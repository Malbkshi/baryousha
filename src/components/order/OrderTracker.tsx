"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Ban, Check, ChefHat, Clock, MapPin, PackageCheck, Phone, ReceiptText, WifiOff } from "lucide-react";
import { CAFE, telHref } from "@/lib/cafe";
import { formatPrice } from "@/lib/formatPrice";
import { formatClock, formatInstant, STATUS_LABEL } from "@/lib/orders/labels";
import type { OrderStatus, PublicOrder } from "@/lib/orders/types";
import { orderChannelName } from "@/lib/realtime/channels";
import { usePoke } from "@/lib/realtime/usePoke";
import { lastOrderStore } from "../cart/CartContext";

const STEPS: { status: OrderStatus; label: string; icon: typeof Check }[] = [
  { status: "new", label: "استلمنا الطلب", icon: ReceiptText },
  { status: "preparing", label: "قيد التجهيز", icon: ChefHat },
  { status: "ready", label: "جاهز", icon: PackageCheck },
  { status: "done", label: "تم التسليم", icon: Check },
];

function helperText(order: PublicOrder): string {
  switch (order.status) {
    case "new":
      return "وصل طلبك للمقهى، وسنبدأ تجهيزه خلال لحظات.";
    case "preparing":
      return order.etaAt
        ? `يجهز تقريبًا الساعة ${formatInstant(order.etaAt)}.`
        : "طلبك يُجهَّز الآن.";
    case "ready":
      return "طلبك جاهز. تفضل لاستلامه من المقهى.";
    case "done":
      return "بالهناء والشفاء. نراك قريبًا.";
    case "cancelled":
      return "أُلغي هذا الطلب. للاستفسار اتصل بالمقهى.";
  }
}

export function OrderTracker({ initial }: { initial: PublicOrder }) {
  const [order, setOrder] = useState(initial);
  const [stale, setStale] = useState(false);

  const finished = order.status === "done" || order.status === "cancelled";

  const refetch = useCallback(async () => {
    try {
      const response = await fetch(`/api/orders/${initial.token}`, { cache: "no-store" });
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as { order: PublicOrder };
      setOrder(data.order);
      setStale(false);
      if (data.order.status === "done" || data.order.status === "cancelled") {
        if (lastOrderStore.get()?.token === data.order.token) lastOrderStore.set(null);
      }
    } catch {
      // Keep showing the last known state rather than an error page.
      setStale(true);
    }
  }, [initial.token]);

  usePoke([orderChannelName(initial.token)], refetch, finished ? 0 : 8000);

  const currentStep = STEPS.findIndex((step) => step.status === order.status);
  const cancelled = order.status === "cancelled";

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-16 pt-6">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm font-bold text-amber-400 transition-colors duration-200 ease-brand hover:text-amber-300">
          {CAFE.nameAr}
        </Link>
        <Link href="/" className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition duration-200 ease-brand hover:border-amber-500/40 hover:text-amber-200">
          رجوع للقائمة
        </Link>
      </header>

      <section
        aria-live="polite"
        className={`rounded-3xl border p-6 text-center ${
          cancelled
            ? "border-red-500/30 bg-red-500/5"
            : order.status === "ready"
              ? "border-emerald-500/40 bg-emerald-500/10"
              : "border-amber-600/25 bg-zinc-900/70"
        }`}
      >
        <p className="text-xs tracking-wide text-zinc-400">رقم الطلب</p>
        <p dir="ltr" className="mt-1 text-4xl font-black text-white">
          #{order.number}
        </p>
        <p
          key={order.status}
          className={`motion-overlay-in mt-4 text-xl font-bold ${
            cancelled ? "text-red-400" : order.status === "ready" ? "text-emerald-400" : "text-amber-400"
          }`}
        >
          {STATUS_LABEL[order.status]}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">{helperText(order)}</p>

        {cancelled ? (
          <Ban className="mx-auto mt-5 h-8 w-8 text-red-400/70" />
        ) : (
          <ol className="mt-6 flex items-start justify-between">
            {STEPS.map((step, index) => {
              const reached = index <= currentStep;
              const Icon = step.icon;
              return (
                <li key={step.status} className="relative flex flex-1 flex-col items-center gap-2">
                  {index > 0 && (
                    <span
                      aria-hidden
                      className={`absolute left-1/2 top-4 h-0.5 w-full transition-colors duration-300 ease-brand ${
                        reached ? "bg-amber-500" : "bg-zinc-700"
                      }`}
                    />
                  )}
                  <span
                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors duration-300 ease-brand ${
                      reached
                        ? "border-amber-500 bg-amber-500 text-black"
                        : "border-zinc-700 bg-zinc-900 text-zinc-500"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span
                    aria-current={index === currentStep ? "step" : undefined}
                    className={`text-[11px] leading-tight ${reached ? "font-bold text-amber-100" : "text-zinc-500"}`}
                  >
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {stale && !finished && (
        <p role="status" className="mt-3 flex items-center justify-center gap-2 text-xs text-zinc-400">
          <WifiOff className="h-3.5 w-3.5" />
          تعذر التحديث، نحاول من جديد.
        </p>
      )}

      <section className="mt-5 rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
        <h2 className="mb-3 text-sm font-bold text-zinc-200">تفاصيل الطلب</h2>
        <ul className="space-y-2.5">
          {order.items.map((line) => (
            <li key={line.id} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-zinc-200">
                <span className="font-bold text-amber-400">{line.qty}×</span> {line.nameAr}
              </span>
              <span className="shrink-0 text-zinc-400">{formatPrice(line.price * line.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
          <span className="text-sm text-zinc-400">الإجمالي · نقدًا عند الاستلام</span>
          <span className="text-lg font-black text-amber-400">{formatPrice(order.total)}</span>
        </div>
        {order.note && (
          <p className="mt-3 rounded-lg bg-black/30 px-3 py-2 text-xs text-zinc-400">
            ملاحظة: {order.note}
          </p>
        )}
      </section>

      <section className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-zinc-900/60 p-5 text-sm">
        <p className="flex items-center gap-3 text-zinc-200">
          <Clock className="h-4 w-4 shrink-0 text-amber-500" />
          الاستلام: {order.pickupTime ? `اليوم ${formatClock(order.pickupTime)}` : "في أقرب وقت"}
        </p>
        <p className="flex items-center gap-3 text-zinc-200">
          <MapPin className="h-4 w-4 shrink-0 text-amber-500" />
          {CAFE.address}
        </p>
        <a
          href={telHref(CAFE.phone)}
          className="flex items-center gap-3 text-zinc-200 transition-colors duration-200 ease-brand hover:text-amber-300"
        >
          <Phone className="h-4 w-4 shrink-0 text-amber-500" />
          <span dir="ltr" className="font-bold">
            {CAFE.phone}
          </span>
        </a>
      </section>
    </div>
  );
}
