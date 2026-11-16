import { requireStaff } from "@/lib/auth";
import { noStore, readJson } from "@/lib/http";
import { actOnOrder } from "@/lib/orders/service";
import type { StaffAction } from "@/lib/orders/status";
import type { OrderStatus } from "@/lib/orders/types";
import { pokeOrders } from "@/lib/realtime/poke";
import { getStore } from "@/lib/store";

const STATUSES: OrderStatus[] = ["new", "preparing", "ready", "done", "cancelled"];
const ACTIONS: StaffAction[] = ["accept", "ready", "done", "cancel"];

type Body = { from?: unknown; action?: unknown; etaMinutes?: unknown };

// Moves one order a step. `from` is the status the dashboard was showing, so
// a second tap or a stale screen is refused instead of overwriting.
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/orders/[id]">) {
  const staff = await requireStaff();
  if (staff instanceof Response) return staff;

  const { id } = await ctx.params;
  const body = (await readJson(request)) as Body | null;
  const from = body?.from as OrderStatus;
  const action = body?.action as StaffAction;
  const eta = typeof body?.etaMinutes === "number" ? body.etaMinutes : undefined;

  if (!body || !STATUSES.includes(from) || !ACTIONS.includes(action)) {
    return Response.json({ error: "invalid" }, { status: 400, headers: noStore });
  }

  const store = getStore();
  if (!store) return Response.json({ error: "server" }, { status: 503, headers: noStore });

  try {
    const result = await actOnOrder(store, id, from, action, eta, new Date());
    if (result === "invalid") {
      return Response.json({ error: "invalid" }, { status: 400, headers: noStore });
    }
    if (result === "conflict") {
      return Response.json({ error: "conflict" }, { status: 409, headers: noStore });
    }
    await pokeOrders(result.token);
    return Response.json({ order: result }, { headers: noStore });
  } catch (error) {
    console.error("Order update failed:", error);
    return Response.json({ error: "server" }, { status: 503, headers: noStore });
  }
}
