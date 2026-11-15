import { backend, supabaseEnv } from "@/lib/env";
import { MemoryStore } from "./memory";
import { SupabaseStore } from "./supabase";
import type { Store } from "./types";

// Kept on globalThis so `next dev` module reloads do not drop the memory
// store's orders or build a new Supabase client per request.
const holder = globalThis as unknown as {
  __baryoshaMemory?: MemoryStore;
  __baryoshaSupabase?: SupabaseStore;
};

/** The data store, or null when production has no Supabase configured. */
export function getStore(): Store | null {
  switch (backend()) {
    case "supabase":
      return (holder.__baryoshaSupabase ??= new SupabaseStore(supabaseEnv()!));
    case "memory":
      return (holder.__baryoshaMemory ??= new MemoryStore());
    default:
      return null;
  }
}

/** The service-key Supabase client, for storage and broadcasts. Null off Supabase. */
export function getSupabaseAdmin() {
  if (backend() !== "supabase") return null;
  getStore();
  return holder.__baryoshaSupabase!.client;
}

export type { Store } from "./types";
