import { describe, expect, it } from "vitest";
import { bundledMenu, type MenuData } from "@/data/menu";
import { MemoryStore } from "@/lib/store/memory";
import { loadMenu, publicMenu } from "./getMenu";

const stored: MenuData = {
  heroSlides: [],
  categories: [
    {
      id: "croissant",
      titleAr: "البريوش",
      titleEn: "Croissant",
      icon: "croissant",
      items: [
        { id: "c1", nameAr: "طرابلسية", nameEn: "Tripolitan", price: 7 },
        { id: "c2", nameAr: "نوتيلا", nameEn: "Nutella", price: 6, hidden: true },
      ],
    },
    {
      id: "yogurt",
      titleAr: "زبادي",
      titleEn: "Yogurt",
      icon: "yogurt",
      items: [{ id: "y1", nameAr: "زبادي", nameEn: "Yogurt", price: 3, hidden: true }],
    },
  ],
};

describe("loadMenu", () => {
  it("returns the menu saved in the store", async () => {
    const store = new MemoryStore();
    await store.setDoc("menu", stored);
    expect(await loadMenu(store)).toEqual(stored);
  });

  it("falls back to the bundled menu when nothing is saved yet", async () => {
    expect(await loadMenu(new MemoryStore())).toBe(bundledMenu);
  });

  it("falls back to the bundled menu when there is no store", async () => {
    expect(await loadMenu(null)).toBe(bundledMenu);
  });

  it("falls back to the bundled menu when the store is failing", async () => {
    const store = new MemoryStore();
    store.getDoc = async () => {
      throw new Error("database unreachable");
    };
    expect(await loadMenu(store)).toBe(bundledMenu);
  });

  it("falls back to the bundled menu when the saved document is not a menu", async () => {
    const store = new MemoryStore();
    await store.setDoc("menu", { categories: "oops" });
    expect(await loadMenu(store)).toBe(bundledMenu);
  });
});

describe("publicMenu", () => {
  it("drops hidden items and categories left empty", () => {
    const visible = publicMenu(stored);
    expect(visible.categories.map((c) => c.id)).toEqual(["croissant"]);
    expect(visible.categories[0].items.map((i) => i.id)).toEqual(["c1"]);
  });

  it("does not change the menu it was given", () => {
    publicMenu(stored);
    expect(stored.categories[0].items).toHaveLength(2);
  });
});
