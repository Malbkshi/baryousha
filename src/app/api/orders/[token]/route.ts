import { noStore } from "@/lib/http";
import { toPublic } from "@/lib/orders/service";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

// The customer's view of one order. The token is the only credential.
export async function GET(_request: Request, ctx: RouteContext<"/api/orders/[token]">) {
  const { token } = await ctx.params;
  const notFound = () => Response.json({ error: "not-found" }, { status: 404, headers: noStore });

  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return notFound();

  const store = getStore();
  if (!store) return Response.json({ error: "server" }, { status: 503, headers: noStore });

  try {
    const order = await store.getOrderByToken(token);
    if (!order) return notFound();
    return Response.json({ order: toPublic(order) }, { headers: noStore });
  } catch (error) {
    console.error("Order read failed:", error);
    return Response.json({ error: "server" }, { status: 503, headers: noStore });
  }
}
