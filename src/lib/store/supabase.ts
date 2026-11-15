import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseEnv } from "@/lib/env";
import { ACTIVE_STATUSES, type Order, type OrderStatus } from "@/lib/orders/types";
import type { DocKey, Store } from "./types";

type OrderRow = {
  id: string;
  number: number;
  token: string;
  client_ref: string;
  customer_name: string;
  phone: string;
  pickup_time: string | null;
  note: string;
  status: OrderStatus;
  items: Order["items"];
  total: number | string;
  eta_at: string | null;
  created_at: string;
  accepted_at: string | null;
  ready_at: string | null;
  done_at: string | null;
  cancelled_at: string | null;
};

const COLUMNS: Record<keyof Order, keyof OrderRow> = {
  id: "id",
  number: "number",
  token: "token",
  clientRef: "client_ref",
  customerName: "customer_name",
  phone: "phone",
  pickupTime: "pickup_time",
  note: "note",
  status: "status",
  items: "items",
  total: "total",
  etaAt: "eta_at",
  createdAt: "created_at",
  acceptedAt: "accepted_at",
  readyAt: "ready_at",
  doneAt: "done_at",
  cancelledAt: "cancelled_at",
};

const TIME_FIELDS: (keyof Order)[] = ["etaAt", "createdAt", "acceptedAt", "readyAt", "doneAt", "cancelledAt"];

/** Postgres returns "+00:00"; the app compares ISO strings ending in "Z". */
function isoOrNull(value: unknown): string | null {
  return typeof value === "string" ? new Date(value).toISOString() : null;
}

function fromRow(row: OrderRow): Order {
  const order = {} as Record<string, unknown>;
  for (const [field, column] of Object.entries(COLUMNS)) {
    order[field] = row[column];
  }
  for (const field of TIME_FIELDS) order[field] = isoOrNull(order[field]);
  order.number = Number(row.number);
  order.total = Number(row.total);
  return order as Order;
}

function toRow(order: Partial<Order>): Partial<OrderRow> {
  const row = {} as Record<string, unknown>;
  for (const [field, value] of Object.entries(order)) {
    row[COLUMNS[field as keyof Order]] = value;
  }
  return row as Partial<OrderRow>;
}

/** Supabase with the service key. Must never be constructed in browser code. */
export class SupabaseStore implements Store {
  private db: SupabaseClient;

  constructor(env: SupabaseEnv) {
    this.db = createClient(env.url, env.serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  get client(): SupabaseClient {
    return this.db;
  }

  async getDoc<T>(key: DocKey): Promise<T | null> {
    const { data, error } = await this.db
      .from("app_state")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) throw new Error(`app_state read failed: ${error.message}`);
    return (data?.value as T | undefined) ?? null;
  }

  async setDoc(key: DocKey, value: unknown): Promise<void> {
    const { error } = await this.db
      .from("app_state")
      .upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) throw new Error(`app_state write failed: ${error.message}`);
  }

  async insertOrder(row: Omit<Order, "id" | "number">): Promise<Order> {
    const { data, error } = await this.db
      .from("orders")
      .upsert(toRow(row), { onConflict: "client_ref", ignoreDuplicates: true })
      .select();
    if (error) throw new Error(`order insert failed: ${error.message}`);
    if (data && data.length > 0) return fromRow(data[0] as OrderRow);

    // Nothing came back: a row with this client_ref was already there.
    const existing = await this.getOrderByClientRef(row.clientRef);
    if (!existing) throw new Error("order insert returned nothing");
    return existing;
  }

  private async findOne(column: keyof OrderRow, value: string): Promise<Order | null> {
    const { data, error } = await this.db
      .from("orders")
      .select("*")
      .eq(column, value)
      .maybeSingle();
    if (error) throw new Error(`order read failed: ${error.message}`);
    return data ? fromRow(data as OrderRow) : null;
  }

  getOrderByToken(token: string): Promise<Order | null> {
    return this.findOne("token", token);
  }

  getOrderByClientRef(clientRef: string): Promise<Order | null> {
    return this.findOne("client_ref", clientRef);
  }

  async updateOrderIfStatus(
    id: string,
    expect: OrderStatus,
    patch: Partial<Order>,
  ): Promise<Order | null> {
    const { data, error } = await this.db
      .from("orders")
      .update(toRow(patch))
      .eq("id", id)
      .eq("status", expect)
      .select();
    if (error) {
      // A malformed id is "no such order", not a server fault.
      if (error.code === "22P02") return null;
      throw new Error(`order update failed: ${error.message}`);
    }
    return data && data.length > 0 ? fromRow(data[0] as OrderRow) : null;
  }

  async listOrdersSince(iso: string): Promise<Order[]> {
    const { data, error } = await this.db
      .from("orders")
      .select("*")
      .or(`created_at.gte."${iso}",status.in.(${ACTIVE_STATUSES.join(",")})`)
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(`order list failed: ${error.message}`);
    return (data as OrderRow[]).map(fromRow);
  }

  async countActiveByPhone(phone: string): Promise<number> {
    const { count, error } = await this.db
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("phone", phone)
      .in("status", ACTIVE_STATUSES);
    if (error) throw new Error(`order count failed: ${error.message}`);
    return count ?? 0;
  }

  async isStaffEmail(email: string): Promise<boolean> {
    const { data, error } = await this.db
      .from("staff")
      .select("email")
      .ilike("email", email.replace(/[%_\\]/g, "\\$&"))
      .maybeSingle();
    if (error) throw new Error(`staff read failed: ${error.message}`);
    return Boolean(data);
  }
}
