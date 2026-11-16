import { requireStaff } from "@/lib/auth";
import { noStore } from "@/lib/http";
import { tripoliMinutes } from "@/lib/orders/hours";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Midnight today on the café's clock, as an instant. */
function startOfTripoliDay(now: Date): string {
  const start = new Date(now.getTime() - tripoliMinutes(now) * 60_000);
  start.setUTCSeconds(0, 0);
  return start.toISOString();
}

// Today's orders plus anything older that is still open.
export async function GET() {
  const staff = await requireStaff();
  if (staff instanceof Response) return staff;

  const store = getStore();
  if (!store) return Response.json({ error: "server" }, { status: 503, headers: noStore });

  try {
    const orders = await store.listOrdersSince(startOfTripoliDay(new Date()));
    return Response.json({ orders }, { headers: noStore });
  } catch (error) {
    console.error("Order list failed:", error);
    return Response.json({ error: "server" }, { status: 503, headers: noStore });
  }
}
