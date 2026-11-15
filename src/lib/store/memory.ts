import { ACTIVE_STATUSES, type Order, type OrderStatus } from "@/lib/orders/types";
import type { DocKey, Store } from "./types";

/** In-process store for tests and for `next dev` without Supabase. Not durable. */
export class MemoryStore implements Store {
  private docs = new Map<DocKey, unknown>();
  private orders: Order[] = [];
  private nextNumber = 1001;

  async getDoc<T>(key: DocKey): Promise<T | null> {
    return (this.docs.get(key) as T | undefined) ?? null;
  }

  async setDoc(key: DocKey, value: unknown): Promise<void> {
    this.docs.set(key, structuredClone(value));
  }

  async insertOrder(row: Omit<Order, "id" | "number">): Promise<Order> {
    const existing = this.orders.find((o) => o.clientRef === row.clientRef);
    if (existing) return structuredClone(existing);
    const order: Order = {
      ...structuredClone(row),
      id: crypto.randomUUID(),
      number: this.nextNumber++,
    };
    this.orders.push(order);
    return structuredClone(order);
  }

  async getOrderByToken(token: string): Promise<Order | null> {
    const found = this.orders.find((o) => o.token === token);
    return found ? structuredClone(found) : null;
  }

  async getOrderByClientRef(clientRef: string): Promise<Order | null> {
    const found = this.orders.find((o) => o.clientRef === clientRef);
    return found ? structuredClone(found) : null;
  }

  async updateOrderIfStatus(
    id: string,
    expect: OrderStatus,
    patch: Partial<Order>,
  ): Promise<Order | null> {
    const order = this.orders.find((o) => o.id === id);
    if (!order || order.status !== expect) return null;
    Object.assign(order, structuredClone(patch));
    return structuredClone(order);
  }

  async listOrdersSince(iso: string): Promise<Order[]> {
    return this.orders
      .filter((o) => o.createdAt >= iso || ACTIVE_STATUSES.includes(o.status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.number - a.number)
      .map((o) => structuredClone(o));
  }

  async countActiveByPhone(phone: string): Promise<number> {
    return this.orders.filter(
      (o) => o.phone === phone && ACTIVE_STATUSES.includes(o.status),
    ).length;
  }

  async isStaffEmail(): Promise<boolean> {
    return true;
  }
}
