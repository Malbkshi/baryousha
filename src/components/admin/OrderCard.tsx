"use client";

import { useState } from "react";
import { Clock, Loader2, Phone, StickyNote } from "lucide-react";
import { formatPrice } from "@/lib/formatPrice";
import { formatClock, formatInstant, STATUS_SHORT } from "@/lib/orders/labels";
import type { StaffAction } from "@/lib/orders/status";
import { ETA_CHOICES, type Order } from "@/lib/orders/types";

type OrderCardProps = {
  order: Order;
  now: number;
  /** Resolves to an Arabic error message, or null when the step went through. */
  onAct: (order: Order, action: StaffAction, etaMinutes?: number) => Promise<string | null>;
};

function waited(order: Order, now: number): string {
  const minutes = Math.max(0, Math.floor((now - new Date(order.createdAt).getTime()) / 60_000));
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} د`;
  return `منذ ${Math.floor(minutes / 60)} س ${minutes % 60} د`;
}

export function OrderCard({ order, now, onAct }: OrderCardProps) {
  const [busy, setBusy] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finished = order.status === "done" || order.status === "cancelled";

  async function act(action: StaffAction, etaMinutes?: number) {
    if (busy) return;
    setBusy(true);
    setError(null);
    const problem = await onAct(order, action, etaMinutes);
    setBusy(false);
    setConfirmingCancel(false);
    setError(problem);
  }

  const primary =
    "flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-black transition duration-200 ease-brand hover:bg-amber-400 active:scale-[0.97] disabled:opacity-50";
  const quiet =
    "rounded-xl border border-white/10 px-3 py-2.5 text-sm text-zinc-300 transition duration-200 ease-brand hover:border-red-500/50 hover:text-red-300 active:scale-[0.97] disabled:opacity-50";

  return (
    <article
      className={`rounded-2xl border p-4 ${
        order.status === "new"
          ? "border-amber-500/60 bg-amber-500/[0.07]"
          : "border-white/10 bg-zinc-900/70"
      } ${finished ? "opacity-70" : ""}`}
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <p dir="ltr" className="text-right text-2xl font-black text-white">
            #{order.number}
          </p>
          <p className="mt-0.5 text-sm font-bold text-zinc-100">{order.customerName}</p>
        </div>
        <div className="text-left">
          <p className="text-xs text-zinc-400">{waited(order, now)}</p>
          {finished && (
            <p className={`mt-1 text-xs font-bold ${order.status === "done" ? "text-emerald-400" : "text-red-400"}`}>
              {STATUS_SHORT[order.status]}
            </p>
          )}
        </div>
      </header>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
        <a
          href={`tel:${order.phone}`}
          dir="ltr"
          className="flex items-center gap-1.5 font-bold text-amber-400 transition-colors duration-200 ease-brand hover:text-amber-300"
        >
          <Phone className="h-3.5 w-3.5" />
          {order.phone}
        </a>
        <span className="flex items-center gap-1.5 text-zinc-300">
          <Clock className="h-3.5 w-3.5 text-zinc-500" />
          {order.pickupTime ? `الاستلام ${formatClock(order.pickupTime)}` : "في أقرب وقت"}
        </span>
        {order.status === "preparing" && order.etaAt && (
          <span className="text-zinc-400">يجهز {formatInstant(order.etaAt)}</span>
        )}
      </div>

      <ul className="mt-3 space-y-1 border-t border-white/10 pt-3">
        {order.items.map((line) => (
          <li key={line.id} className="flex justify-between gap-2 text-sm text-zinc-100">
            <span>
              <span className="font-black text-amber-400">{line.qty}×</span> {line.nameAr}
            </span>
          </li>
        ))}
      </ul>

      {order.note && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-black/40 px-3 py-2 text-xs text-amber-100">
          <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
          {order.note}
        </p>
      )}

      <p className="mt-3 text-sm font-bold text-zinc-200">
        الإجمالي: <span className="text-amber-400">{formatPrice(order.total)}</span>
      </p>

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-400">
          {error}
        </p>
      )}

      {!finished && (
        <div className="mt-3">
          {busy ? (
            <div className="flex justify-center py-2.5">
              <Loader2 className="h-5 w-5 animate-spin text-amber-400" aria-label="جارٍ التنفيذ" />
            </div>
          ) : confirmingCancel ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => act("cancel")}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white transition duration-200 ease-brand hover:bg-red-400 active:scale-[0.97]"
              >
                نعم، ألغِ الطلب
              </button>
              <button type="button" onClick={() => setConfirmingCancel(false)} className={quiet}>
                رجوع
              </button>
            </div>
          ) : order.status === "new" ? (
            <>
              <p className="mb-1.5 text-xs text-zinc-400">ابدأ التجهيز، يجهز خلال:</p>
              <div className="flex items-center gap-2">
                {ETA_CHOICES.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => act("accept", minutes)}
                    aria-label={`ابدأ التجهيز، ${minutes} دقيقة`}
                    className={primary}
                  >
                    {minutes} د
                  </button>
                ))}
                <button type="button" onClick={() => setConfirmingCancel(true)} className={quiet}>
                  إلغاء
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => act(order.status === "preparing" ? "ready" : "done")}
                className={primary}
              >
                {order.status === "preparing" ? "جاهز" : "تم التسليم"}
              </button>
              <button type="button" onClick={() => setConfirmingCancel(true)} className={quiet}>
                إلغاء
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
