import { noStore } from "@/lib/http";
import { isOpen, pickupSlots } from "@/lib/orders/hours";
import { getSettings } from "@/lib/orders/service";
import { DEFAULT_SETTINGS } from "@/lib/orders/types";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export type OrderingState = "open" | "paused" | "closed" | "unavailable";

// Whether an order can be placed right now, and the pickup times on offer.
export async function GET() {
  const unavailable = {
    state: "unavailable" as OrderingState,
    openTime: DEFAULT_SETTINGS.openTime,
    closeTime: DEFAULT_SETTINGS.closeTime,
    slots: [] as string[],
  };

  const store = getStore();
  if (!store) return Response.json(unavailable, { headers: noStore });

  try {
    const settings = await getSettings(store);
    const now = new Date();
    const state: OrderingState = !settings.acceptingOrders
      ? "paused"
      : isOpen(settings, now)
        ? "open"
        : "closed";
    return Response.json(
      {
        state,
        openTime: settings.openTime,
        closeTime: settings.closeTime,
        slots: state === "open" ? pickupSlots(settings, now) : [],
      },
      { headers: noStore },
    );
  } catch (error) {
    console.error("Ordering state failed:", error);
    return Response.json(unavailable, { headers: noStore });
  }
}
