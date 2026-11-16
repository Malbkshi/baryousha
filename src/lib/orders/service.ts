import { randomBytes } from "node:crypto";
import type { MenuData, MenuItem } from "@/data/menu";
import type { Store } from "@/lib/store/types";
import { checkPickupTime, orderingState } from "./hours";
import { normalizePhone } from "./phone";
import { applyAction, type StaffAction } from "./status";
import {
  DEFAULT_SETTINGS,
  ETA_CHOICES,
  LIMITS,
  type Order,
  type OrderLine,
  type OrderStatus,
  type PublicOrder,
  type Settings,
} from "./types";

export type OrderError =
  | { code: "closed" }
  | { code: "paused" }
  | { code: "invalid"; field: "name" | "phone" | "pickup" | "items" | "note" }
  | { code: "unavailable"; itemIds: string[] }
  | { code: "too-many-active" }
  | { code: "prayer"; label: string; reopensAt: string };

export type CreateInput = {
  clientRef: string;
  name: string;
  phone: string;
  pickupTime: string | null;
  note?: string;
  items: { id: string; qty: number }[];
};

type CreateResult = { ok: true; order: Order } | { ok: false; error: OrderError };

const refuse = (error: OrderError): CreateResult => ({ ok: false, error });

export async function getSettings(store: Store): Promise<Settings> {
  const stored = await store.getDoc<Partial<Settings>>("settings");
  return { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
}

/** Merges repeated ids and checks every quantity. Null when the list is unusable. */
function collectQuantities(items: unknown): Map<string, number> | null {
  if (!Array.isArray(items) || items.length === 0 || items.length > LIMITS.maxLines) {
    return null;
  }
  const wanted = new Map<string, number>();
  for (const line of items) {
    const id = (line as { id?: unknown })?.id;
    const qty = (line as { qty?: unknown })?.qty;
    if (typeof id !== "string" || !id || id.length > 64) return null;
    if (typeof qty !== "number" || !Number.isInteger(qty) || qty < 1) return null;
    const sum = (wanted.get(id) ?? 0) + qty;
    if (sum > LIMITS.maxQtyPerLine) return null;
    wanted.set(id, sum);
  }
  return wanted;
}

function sellableItems(menu: MenuData): Map<string, MenuItem> {
  const byId = new Map<string, MenuItem>();
  for (const category of menu.categories) {
    for (const item of category.items) {
      if (!item.hidden) byId.set(item.id, item);
    }
  }
  return byId;
}

/**
 * Validates a customer's order and stores it.
 * Names and prices are taken from `menu`; nothing in `input` can change them.
 */
export async function createOrder(
  store: Store,
  menu: MenuData,
  input: CreateInput,
  now: Date,
): Promise<CreateResult> {
  const wanted = collectQuantities(input?.items);
  if (!wanted) return refuse({ code: "invalid", field: "items" });
  if (typeof input.clientRef !== "string" || !input.clientRef || input.clientRef.length > 64) {
    return refuse({ code: "invalid", field: "items" });
  }

  const name = typeof input.name === "string" ? input.name.trim().replace(/\s+/g, " ") : "";
  if (name.length < LIMITS.nameMin || name.length > LIMITS.nameMax) {
    return refuse({ code: "invalid", field: "name" });
  }

  const phone = typeof input.phone === "string" ? normalizePhone(input.phone) : null;
  if (!phone) return refuse({ code: "invalid", field: "phone" });

  const note = typeof input.note === "string" ? input.note.trim() : "";
  if (note.length > LIMITS.noteMax) return refuse({ code: "invalid", field: "note" });

  // A retried submit gets its first answer, whatever has changed since.
  const earlier = await store.getOrderByClientRef(input.clientRef);
  if (earlier) return { ok: true, order: earlier };

  const settings = await getSettings(store);
  if (!settings.acceptingOrders) return refuse({ code: "paused" });
  const open = orderingState(settings, now);
  if (open.state === "closed") return refuse({ code: "closed" });
  if (open.state === "prayer") {
    return refuse({ code: "prayer", label: open.label!, reopensAt: open.reopensAt! });
  }

  const pickupTime = input.pickupTime ?? null;
  if (pickupTime !== null) {
    if (typeof pickupTime !== "string" || checkPickupTime(pickupTime, settings, now) !== "ok") {
      return refuse({ code: "invalid", field: "pickup" });
    }
  }

  const sellable = sellableItems(menu);
  const missing = [...wanted.keys()].filter((id) => !sellable.has(id));
  if (missing.length > 0) return refuse({ code: "unavailable", itemIds: missing });

  if ((await store.countActiveByPhone(phone)) >= LIMITS.maxActivePerPhone) {
    return refuse({ code: "too-many-active" });
  }

  const items: OrderLine[] = [...wanted].map(([id, qty]) => {
    const item = sellable.get(id)!;
    return { id, nameAr: item.nameAr.trim(), nameEn: item.nameEn, price: item.price, qty };
  });
  const total = items.reduce((sum, line) => sum + line.price * line.qty, 0);

  const order = await store.insertOrder({
    token: randomBytes(16).toString("base64url"),
    clientRef: input.clientRef,
    customerName: name,
    phone,
    pickupTime,
    note,
    status: "new",
    items,
    total,
    etaAt: null,
    createdAt: now.toISOString(),
    acceptedAt: null,
    readyAt: null,
    doneAt: null,
    cancelledAt: null,
  });
  return { ok: true, order };
}

/**
 * Moves an order one step. `from` is the status the member of staff was
 * looking at; if the order has moved since, nothing is written.
 */
export async function actOnOrder(
  store: Store,
  id: string,
  from: OrderStatus,
  action: StaffAction,
  etaMinutes: number | undefined,
  now: Date,
): Promise<Order | "conflict" | "invalid"> {
  const next = applyAction(from, action);
  if (!next) return "invalid";

  const stamp = now.toISOString();
  const patch: Partial<Order> = { status: next };

  if (action === "accept") {
    if (!ETA_CHOICES.includes(etaMinutes as (typeof ETA_CHOICES)[number])) return "invalid";
    patch.acceptedAt = stamp;
    patch.etaAt = new Date(now.getTime() + etaMinutes! * 60_000).toISOString();
  } else if (action === "ready") {
    patch.readyAt = stamp;
  } else if (action === "done") {
    patch.doneAt = stamp;
  } else {
    patch.cancelledAt = stamp;
  }

  return (await store.updateOrderIfStatus(id, from, patch)) ?? "conflict";
}

export function toPublic(order: Order): PublicOrder {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, phone, clientRef, ...visible } = order;
  return visible;
}
