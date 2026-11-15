import type { Order, OrderStatus } from "@/lib/orders/types";

export type DocKey = "menu" | "settings";

/** Everything the app needs from a database. Server-side only. */
export interface Store {
  getDoc<T>(key: DocKey): Promise<T | null>;
  setDoc(key: DocKey, value: unknown): Promise<void>;
  /** Inserts, or returns the row that already has this clientRef. */
  insertOrder(row: Omit<Order, "id" | "number">): Promise<Order>;
  getOrderByToken(token: string): Promise<Order | null>;
  getOrderByClientRef(clientRef: string): Promise<Order | null>;
  /** Applies the patch only while the order is still in `expect`; null otherwise. */
  updateOrderIfStatus(id: string, expect: OrderStatus, patch: Partial<Order>): Promise<Order | null>;
  /** Orders created at or after `iso`, plus any older one still open. Newest first. */
  listOrdersSince(iso: string): Promise<Order[]>;
  countActiveByPhone(phone: string): Promise<number>;
  isStaffEmail(email: string): Promise<boolean>;
}
