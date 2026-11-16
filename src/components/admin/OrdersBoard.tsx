"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BellOff, BellRing, ChevronDown, PauseCircle, WifiOff } from "lucide-react";
import { chimeReady, playChime, unlockChime } from "@/lib/admin/chime";
import { STATUS_SHORT } from "@/lib/orders/labels";
import type { StaffAction } from "@/lib/orders/status";
import type { Order, OrderStatus, Settings } from "@/lib/orders/types";
import { ORDERS_CHANNEL } from "@/lib/realtime/channels";
import { usePoke } from "@/lib/realtime/usePoke";
import { OrderCard } from "./OrderCard";

const COLUMNS: OrderStatus[] = ["new", "preparing", "ready"];
const PAGE_TITLE = "لوحة البريوشة";

type OrdersBoardProps = {
  settings: Settings | null;
  onToggleAccepting: (accepting: boolean) => void;
  onSignedOut: () => void;
};

export function OrdersBoard({ settings, onToggleAccepting, onSignedOut }: OrdersBoardProps) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [stale, setStale] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [soundOn, setSoundOn] = useState(false);
  const [showFinished, setShowFinished] = useState(false);

  // Ids of new orders already announced, so each one chimes once.
  const announced = useRef<Set<string> | null>(null);

  const refetch = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/orders", { cache: "no-store" });
      if (response.status === 401) {
        onSignedOut();
        return;
      }
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as { orders: Order[] };

      const fresh = data.orders.filter((order) => order.status === "new").map((order) => order.id);
      if (announced.current === null) {
        // First load: these were already waiting, do not chime for history.
        announced.current = new Set(fresh);
      } else if (fresh.some((id) => !announced.current!.has(id))) {
        fresh.forEach((id) => announced.current!.add(id));
        playChime();
      }

      setOrders(data.orders);
      setStale(false);
      setNow(Date.now());
      setSoundOn(chimeReady());
    } catch {
      setStale(true);
    }
  }, [onSignedOut]);

  // Keeps polling in a background tab so a new order still chimes.
  usePoke([ORDERS_CHANNEL], refetch, 10_000, { immediate: true, background: true });

  const newCount = orders?.filter((order) => order.status === "new").length ?? 0;

  useEffect(() => {
    document.title = newCount > 0 ? `(${newCount}) طلب جديد · ${PAGE_TITLE}` : PAGE_TITLE;
    return () => {
      document.title = PAGE_TITLE;
    };
  }, [newCount]);

  const act = useCallback(
    async (order: Order, action: StaffAction, etaMinutes?: number): Promise<string | null> => {
      try {
        const response = await fetch(`/api/admin/orders/${order.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ from: order.status, action, etaMinutes }),
        });
        if (response.status === 401) {
          onSignedOut();
          return null;
        }
        await refetch();
        if (response.ok) return null;
        return response.status === 409
          ? "تغيّرت حالة الطلب من جهاز آخر. حدّثنا القائمة."
          : "تعذر تنفيذ الخطوة. حاول مرة أخرى.";
      } catch {
        return "تعذر الاتصال. حاول مرة أخرى.";
      }
    },
    [onSignedOut, refetch],
  );

  if (orders === null) {
    return <p className="py-16 text-center text-sm text-zinc-500">{stale ? "تعذر تحميل الطلبات. نحاول من جديد." : "جارٍ تحميل الطلبات"}</p>;
  }

  const finished = orders.filter((order) => order.status === "done" || order.status === "cancelled");
  // Oldest first inside a column: the order waiting longest is on top.
  const inColumn = (status: OrderStatus) =>
    orders.filter((order) => order.status === status).reverse();

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {settings && (
          <button
            type="button"
            role="switch"
            aria-checked={settings.acceptingOrders}
            onClick={() => onToggleAccepting(!settings.acceptingOrders)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition duration-200 ease-brand active:scale-[0.97] ${
              settings.acceptingOrders
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/50 bg-red-500/10 text-red-300"
            }`}
          >
            <PauseCircle className="h-4 w-4" />
            {settings.acceptingOrders ? "نستقبل الطلبات" : "استقبال الطلبات متوقف"}
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            unlockChime();
            setSoundOn(true);
            window.setTimeout(playChime, 150);
          }}
          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition duration-200 ease-brand active:scale-[0.97] ${
            soundOn
              ? "border-white/10 text-zinc-400"
              : "border-amber-500/60 bg-amber-500/10 font-bold text-amber-200"
          }`}
        >
          {soundOn ? <BellRing className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          {soundOn ? "صوت التنبيه يعمل" : "تفعيل صوت التنبيه"}
        </button>

        {stale && (
          <span role="status" className="flex items-center gap-1.5 text-xs text-red-300">
            <WifiOff className="h-3.5 w-3.5" />
            تعذر التحديث، نحاول من جديد
          </span>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((status) => {
          const column = inColumn(status);
          return (
            <section key={status} aria-label={STATUS_SHORT[status]} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <h2 className="mb-3 flex items-center justify-between px-1 text-sm font-bold text-zinc-200">
                {STATUS_SHORT[status]}
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs ${
                    status === "new" && column.length > 0
                      ? "bg-amber-500 text-black"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {column.length}
                </span>
              </h2>
              {column.length === 0 ? (
                <p className="px-1 py-6 text-center text-xs text-zinc-600">لا يوجد</p>
              ) : (
                <div className="space-y-3">
                  {column.map((order) => (
                    <OrderCard key={order.id} order={order} now={now} onAct={act} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {finished.length > 0 && (
        <section className="mt-6">
          <button
            type="button"
            onClick={() => setShowFinished((value) => !value)}
            aria-expanded={showFinished}
            className="flex w-full items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm text-zinc-300 transition-colors duration-200 ease-brand hover:bg-white/5"
          >
            منتهية اليوم ({finished.length})
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ease-brand ${showFinished ? "rotate-180" : ""}`} />
          </button>
          {showFinished && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {finished.map((order) => (
                <OrderCard key={order.id} order={order} now={now} onAct={act} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
