/**
 * Where data lives.
 * - "supabase": the real thing, once the three variables are set.
 * - "memory":   a throwaway in-process store, only ever outside production,
 *               so the order flow can be developed and tested without Supabase.
 * - "none":     production without Supabase. The menu still renders from the
 *               bundled file; ordering and the dashboard report unavailable.
 */
export type Backend = "supabase" | "memory" | "none";

export type SupabaseEnv = { url: string; anonKey: string; serviceKey: string };

export function supabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!url || !anonKey || !serviceKey) return null;
  return { url, anonKey, serviceKey };
}

export function backend(): Backend {
  if (supabaseEnv()) return "supabase";
  return process.env.NODE_ENV === "production" ? "none" : "memory";
}
