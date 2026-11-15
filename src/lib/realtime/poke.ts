import { getSupabaseAdmin } from "@/lib/store";

import { ORDERS_CHANNEL, orderChannelName, POKE_EVENT } from "./channels";

async function broadcast(channelName: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  const channel = supabase.channel(channelName);
  try {
    await channel.httpSend(POKE_EVENT, {});
  } finally {
    await supabase.removeChannel(channel);
  }
}

/**
 * Tells open pages that orders changed so they refetch now instead of on
 * their next poll. Carries no order data. Never throws: a missed poke only
 * means the page updates a few seconds later.
 */
export async function pokeOrders(token?: string): Promise<void> {
  const channels = [ORDERS_CHANNEL, ...(token ? [orderChannelName(token)] : [])];
  const results = await Promise.allSettled(channels.map(broadcast));
  for (const result of results) {
    if (result.status === "rejected") console.error("Poke failed:", result.reason);
  }
}
