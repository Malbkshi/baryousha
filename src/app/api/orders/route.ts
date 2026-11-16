import { noStore, readJson } from "@/lib/http";
import { getMenu } from "@/lib/menu/getMenu";
import { createOrder, type CreateInput, type OrderError } from "@/lib/orders/service";
import { pokeOrders } from "@/lib/realtime/poke";
import { getStore } from "@/lib/store";

const STATUS: Record<OrderError["code"], number> = {
  invalid: 400,
  unavailable: 409,
  paused: 409,
  closed: 409,
  "too-many-active": 429,
  prayer: 409,
};

const serverError = () =>
  Response.json({ error: { code: "server" } }, { status: 503, headers: noStore });

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body || typeof body !== "object") {
    return Response.json(
      { error: { code: "invalid", field: "items" } },
      { status: 400, headers: noStore },
    );
  }

  const store = getStore();
  if (!store) return serverError();

  try {
    const result = await createOrder(store, await getMenu(), body as CreateInput, new Date());
    if (!result.ok) {
      return Response.json(
        { error: result.error },
        { status: STATUS[result.error.code], headers: noStore },
      );
    }
    await pokeOrders();
    return Response.json(
      { token: result.order.token, number: result.order.number },
      { status: 201, headers: noStore },
    );
  } catch (error) {
    console.error("Order creation failed:", error);
    return serverError();
  }
}
