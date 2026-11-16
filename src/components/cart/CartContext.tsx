"use client";

import { useMemo } from "react";
import type { MenuItem } from "@/data/menu";
import { createLocalStore, useLocalStore } from "@/lib/localStore";
import { LIMITS } from "@/lib/orders/types";
import { useMenu } from "../MenuContext";

type Quantities = Record<string, number>;

const isQuantities = (value: unknown): value is Quantities =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  Object.values(value).every((qty) => Number.isInteger(qty) && qty > 0);

const cartStore = createLocalStore<Quantities>("baryosha.cart.v1", {}, isQuantities);

const clamp = (qty: number) => Math.min(LIMITS.maxQtyPerLine, Math.max(0, Math.trunc(qty)));

function setQty(id: string, qty: number) {
  const next = { ...cartStore.get() };
  const value = clamp(qty);
  if (value > 0) next[id] = value;
  else delete next[id];
  cartStore.set(next);
}

const add = (id: string, qty = 1) => setQty(id, (cartStore.get()[id] ?? 0) + qty);
const remove = (id: string) => setQty(id, 0);
const clear = () => cartStore.set({});

export type CartLine = { item: MenuItem; qty: number };

/**
 * The cart, kept in the browser. Lines follow menu order, and anything no
 * longer on the menu simply does not appear, so a stale cart cannot show
 * or charge for an item that was removed.
 */
export function useCart() {
  const quantities = useLocalStore(cartStore);
  const { categories } = useMenu();

  return useMemo(() => {
    const lines: CartLine[] = [];
    for (const category of categories) {
      for (const item of category.items) {
        const qty = quantities[item.id];
        if (qty) lines.push({ item, qty: Math.min(qty, LIMITS.maxQtyPerLine) });
      }
    }
    return {
      lines: lines.slice(0, LIMITS.maxLines),
      count: lines.reduce((sum, line) => sum + line.qty, 0),
      total: lines.reduce((sum, line) => sum + line.item.price * line.qty, 0),
      qtyOf: (id: string) => quantities[id] ?? 0,
      add,
      setQty,
      remove,
      clear,
    };
  }, [quantities, categories]);
}

// --- Things remembered alongside the cart -------------------------------

export type LastOrder = { token: string; number: number } | null;

const isLastOrder = (value: unknown): value is LastOrder =>
  value === null ||
  (typeof value === "object" &&
    typeof (value as { token?: unknown }).token === "string" &&
    typeof (value as { number?: unknown }).number === "number");

export const lastOrderStore = createLocalStore<LastOrder>("baryosha.lastOrder", null, isLastOrder);

export type Customer = { name: string; phone: string };

const isCustomer = (value: unknown): value is Customer =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as Customer).name === "string" &&
  typeof (value as Customer).phone === "string";

export const customerStore = createLocalStore<Customer>(
  "baryosha.customer",
  { name: "", phone: "" },
  isCustomer,
);
