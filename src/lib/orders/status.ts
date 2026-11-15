import type { OrderStatus } from "./types";

export type StaffAction = "accept" | "ready" | "done" | "cancel";

const TRANSITIONS: Record<OrderStatus, Partial<Record<StaffAction, OrderStatus>>> = {
  new: { accept: "preparing", cancel: "cancelled" },
  preparing: { ready: "ready", cancel: "cancelled" },
  ready: { done: "done", cancel: "cancelled" },
  done: {},
  cancelled: {},
};

/** The status an action leads to, or null when it is not allowed from here. */
export function applyAction(status: OrderStatus, action: StaffAction): OrderStatus | null {
  return TRANSITIONS[status]?.[action] ?? null;
}
