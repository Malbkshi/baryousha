import type { Metadata } from "next";
import Link from "next/link";
import { OrderTracker } from "@/components/order/OrderTracker";
import { toPublic } from "@/lib/orders/service";
import type { PublicOrder } from "@/lib/orders/types";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "متابعة الطلب | مقهى البريوشة",
  robots: { index: false, follow: false },
};

async function findOrder(token: string): Promise<PublicOrder | "missing" | "error"> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return "missing";
  const store = getStore();
  if (!store) return "error";
  try {
    const order = await store.getOrderByToken(token);
    return order ? toPublic(order) : "missing";
  } catch (error) {
    console.error("Order page read failed:", error);
    return "error";
  }
}

export default async function OrderPage({ params }: PageProps<"/order/[token]">) {
  const { token } = await params;
  const order = await findOrder(token);

  if (typeof order === "string") {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="text-xl font-bold text-white">
          {order === "missing" ? "لم نجد هذا الطلب" : "تعذر عرض الطلب الآن"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          {order === "missing"
            ? "تأكد من الرابط، أو اطلب من جديد من القائمة."
            : "حدّث الصفحة بعد قليل. طلبك محفوظ عند المقهى."}
        </p>
        <Link
          href="/"
          className="mt-6 rounded-xl bg-amber-500 px-6 py-3 font-bold text-black transition duration-200 ease-brand hover:bg-amber-400 active:scale-[0.98]"
        >
          رجوع للقائمة
        </Link>
      </div>
    );
  }

  return <OrderTracker initial={order} />;
}
