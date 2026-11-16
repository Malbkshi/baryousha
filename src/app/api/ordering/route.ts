import { noStore } from "@/lib/http";
import { isAllDay, orderingState, pickupSlots } from "@/lib/orders/hours";
import { todaysPrayers } from "@/lib/orders/prayer";
import { getSettings } from "@/lib/orders/service";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/orders/types";
import type { OrderingInfo } from "@/lib/orders/ordering-info";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

function describe(settings: Settings, state: OrderingInfo["state"], now: Date): OrderingInfo {
  const open = orderingState(settings, now);
  return {
    state,
    label: open.label,
    reopensAt: open.reopensAt,
    openTime: settings.openTime,
    closeTime: settings.closeTime,
    allDay: isAllDay(settings),
    prayerBreaks: settings.prayerBreaks,
    minutesBefore: settings.minutesBefore,
    minutesAfter: settings.minutesAfter,
    prayers: todaysPrayers(settings, now),
    slots: state === "open" ? pickupSlots(settings, now) : [],
  };
}

// Whether an order can be placed right now, today's prayer closures, and the
// pickup times on offer.
export async function GET() {
  const now = new Date();
  const store = getStore();
  if (!store) return Response.json(describe(DEFAULT_SETTINGS, "unavailable", now), { headers: noStore });

  try {
    const settings = await getSettings(store);
    const state = !settings.acceptingOrders ? "paused" : orderingState(settings, now).state;
    return Response.json(describe(settings, state, now), { headers: noStore });
  } catch (error) {
    console.error("Ordering state failed:", error);
    return Response.json(describe(DEFAULT_SETTINGS, "unavailable", now), { headers: noStore });
  }
}
