import { beforeEach, describe, expect, it } from "vitest";
import type { MenuData } from "@/data/menu";
import { MemoryStore } from "@/lib/store/memory";
import { actOnOrder, createOrder, getSettings, toPublic, type CreateInput } from "./service";

const menu: MenuData = {
  heroSlides: [],
  categories: [
    {
      id: "croissant",
      titleAr: "البريوش",
      titleEn: "Croissant",
      icon: "croissant",
      items: [
        { id: "c1", nameAr: "طرابلسية", nameEn: "Tripolitan", price: 6 },
        { id: "c2", nameAr: "نوتيلا", nameEn: "Nutella", price: 6, hidden: true },
        { id: "c3", nameAr: "فستق", nameEn: "Pistachio", price: 10 },
      ],
    },
  ],
};

// 12:00 in Tripoli.
const noon = new Date("2026-11-15T10:00:00Z");

let store: MemoryStore;
let refCounter = 0;

function input(overrides: Partial<CreateInput> = {}): CreateInput {
  refCounter += 1;
  return {
    clientRef: `ref-${refCounter}`,
    name: "محمد",
    phone: "0912345678",
    pickupTime: null,
    items: [{ id: "c1", qty: 3 }],
    ...overrides,
  };
}

async function mustCreate(overrides: Partial<CreateInput> = {}) {
  const result = await createOrder(store, menu, input(overrides), noon);
  if (!result.ok) throw new Error(`expected an order, got ${JSON.stringify(result.error)}`);
  return result.order;
}

async function errorOf(overrides: Partial<CreateInput>, now = noon) {
  const result = await createOrder(store, menu, input(overrides), now);
  if (result.ok) throw new Error("expected a refusal, got an order");
  return result.error;
}

beforeEach(() => {
  store = new MemoryStore();
});

describe("createOrder", () => {
  it("creates a new order priced from the menu", async () => {
    const order = await mustCreate({ items: [{ id: "c1", qty: 3 }, { id: "c3", qty: 1 }] });
    expect(order.status).toBe("new");
    expect(order.total).toBe(28);
    expect(order.token.length).toBeGreaterThanOrEqual(20);
    expect(order.number).toBe(1001);
    expect(order.items).toEqual([
      { id: "c1", nameAr: "طرابلسية", nameEn: "Tripolitan", price: 6, qty: 3 },
      { id: "c3", nameAr: "فستق", nameEn: "Pistachio", price: 10, qty: 1 },
    ]);
  });

  it("stores the phone in its normal form and trims the name", async () => {
    const order = await mustCreate({ phone: "+218 91 234 5678", name: "  محمد  " });
    expect(order.phone).toBe("0912345678");
    expect(order.customerName).toBe("محمد");
  });

  it("ignores a price sent by the browser", async () => {
    const tampered = { id: "c3", qty: 2, price: 0 };
    const order = await mustCreate({ items: [tampered] });
    expect(order.total).toBe(20);
    expect(order.items[0].price).toBe(10);
  });

  it("adds up the same item sent on two lines", async () => {
    const order = await mustCreate({ items: [{ id: "c1", qty: 2 }, { id: "c1", qty: 1 }] });
    expect(order.items).toHaveLength(1);
    expect(order.items[0].qty).toBe(3);
  });

  it("names the items that are hidden or gone", async () => {
    const error = await errorOf({ items: [{ id: "c1", qty: 1 }, { id: "c2", qty: 1 }, { id: "zz", qty: 1 }] });
    expect(error).toEqual({ code: "unavailable", itemIds: ["c2", "zz"] });
  });

  it.each([
    ["no items", []],
    ["a zero quantity", [{ id: "c1", qty: 0 }]],
    ["a quantity over the limit", [{ id: "c1", qty: 21 }]],
    ["a fractional quantity", [{ id: "c1", qty: 1.5 }]],
    ["too many lines", Array.from({ length: 21 }, (_, i) => ({ id: `x${i}`, qty: 1 }))],
  ])("refuses %s", async (_label, items) => {
    expect(await errorOf({ items })).toEqual({ code: "invalid", field: "items" });
  });

  it("refuses a name that is too short or too long", async () => {
    expect(await errorOf({ name: "ا" })).toEqual({ code: "invalid", field: "name" });
    expect(await errorOf({ name: "م".repeat(41) })).toEqual({ code: "invalid", field: "name" });
  });

  it("refuses a phone that is not a Libyan mobile", async () => {
    expect(await errorOf({ phone: "123" })).toEqual({ code: "invalid", field: "phone" });
  });

  it("refuses a note that is too long", async () => {
    expect(await errorOf({ note: "ن".repeat(201) })).toEqual({ code: "invalid", field: "note" });
  });

  it("refuses when the café paused ordering", async () => {
    await store.setDoc("settings", { acceptingOrders: false });
    expect(await errorOf({})).toEqual({ code: "paused" });
  });

  it("refuses outside working hours", async () => {
    const afterMidnight = new Date("2026-11-15T22:30:00Z");
    expect(await errorOf({}, afterMidnight)).toEqual({ code: "closed" });
  });

  it("refuses a pickup time with less than ten minutes of notice", async () => {
    expect(await errorOf({ pickupTime: "12:05" })).toEqual({ code: "invalid", field: "pickup" });
  });

  it("keeps a valid pickup time", async () => {
    const order = await mustCreate({ pickupTime: "13:30" });
    expect(order.pickupTime).toBe("13:30");
  });

  it("returns the first order when the same submit arrives twice", async () => {
    const first = await mustCreate({ clientRef: "same" });
    const second = await mustCreate({ clientRef: "same" });
    expect(second.id).toBe(first.id);
    expect(await store.listOrdersSince("2000-01-01T00:00:00Z")).toHaveLength(1);
  });

  it("limits how many open orders one phone can have", async () => {
    const first = await mustCreate();
    await mustCreate();
    expect(await errorOf({})).toEqual({ code: "too-many-active" });

    await actOnOrder(store, first.id, "new", "cancel", undefined, noon);
    await mustCreate();
  });
});

describe("actOnOrder", () => {
  it("accepts with an estimate and stamps the time", async () => {
    const order = await mustCreate();
    const updated = await actOnOrder(store, order.id, "new", "accept", 10, noon);
    if (typeof updated === "string") throw new Error(updated);
    expect(updated.status).toBe("preparing");
    expect(updated.acceptedAt).toBe(noon.toISOString());
    expect(updated.etaAt).toBe("2026-11-15T10:10:00.000Z");
  });

  it("refuses an estimate that is not one of the choices", async () => {
    const order = await mustCreate();
    expect(await actOnOrder(store, order.id, "new", "accept", 7, noon)).toBe("invalid");
    expect(await actOnOrder(store, order.id, "new", "accept", undefined, noon)).toBe("invalid");
  });

  it("stamps ready, done and cancelled", async () => {
    const order = await mustCreate();
    await actOnOrder(store, order.id, "new", "accept", 5, noon);
    const ready = await actOnOrder(store, order.id, "preparing", "ready", undefined, noon);
    const done = await actOnOrder(store, order.id, "ready", "done", undefined, noon);
    if (typeof ready === "string" || typeof done === "string") throw new Error("unexpected refusal");
    expect(ready.readyAt).toBe(noon.toISOString());
    expect(done.doneAt).toBe(noon.toISOString());

    const other = await mustCreate({ phone: "0921234567" });
    const cancelled = await actOnOrder(store, other.id, "new", "cancel", undefined, noon);
    if (typeof cancelled === "string") throw new Error("unexpected refusal");
    expect(cancelled.cancelledAt).toBe(noon.toISOString());
  });

  it("refuses a step that is not allowed from the stated status", async () => {
    const order = await mustCreate();
    expect(await actOnOrder(store, order.id, "new", "ready", undefined, noon)).toBe("invalid");
  });

  it("reports a conflict when the order already moved, and leaves it alone", async () => {
    const order = await mustCreate();
    await actOnOrder(store, order.id, "new", "accept", 10, noon);

    const later = new Date("2026-11-15T10:03:00Z");
    expect(await actOnOrder(store, order.id, "new", "accept", 20, later)).toBe("conflict");
    expect(await actOnOrder(store, order.id, "new", "cancel", undefined, later)).toBe("conflict");

    const current = await store.getOrderByToken(order.token);
    expect(current?.status).toBe("preparing");
    expect(current?.etaAt).toBe("2026-11-15T10:10:00.000Z");
  });

  it("reports a conflict for an order that does not exist", async () => {
    expect(await actOnOrder(store, "missing", "new", "accept", 10, noon)).toBe("conflict");
  });
});

describe("toPublic", () => {
  it("leaves out the phone and internal ids", async () => {
    const view = toPublic(await mustCreate());
    expect(Object.keys(view)).not.toContain("phone");
    expect(Object.keys(view)).not.toContain("id");
    expect(Object.keys(view)).not.toContain("clientRef");
    expect(view.customerName).toBe("محمد");
  });
});

describe("getSettings", () => {
  it("falls back to the defaults", async () => {
    expect(await getSettings(store)).toEqual({ acceptingOrders: true, openTime: "08:00", closeTime: "23:00" });
  });
  it("fills what a stored document is missing", async () => {
    await store.setDoc("settings", { closeTime: "22:00" });
    expect(await getSettings(store)).toEqual({ acceptingOrders: true, openTime: "08:00", closeTime: "22:00" });
  });
});
