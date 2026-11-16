"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ReceiptText } from "lucide-react";
import { useLocalStore } from "@/lib/localStore";
import { STATUS_LABEL } from "@/lib/orders/labels";
import type { OrderStatus, PublicOrder } from "@/lib/orders/types";
import { lastOrderStore } from "./CartContext";

/** A way back to the order the customer placed from this browser. */
export function LastOrderBanner() {
  const last = useLocalStore(lastOrderStore);
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const token = last?.token;

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    fetch(`/api/orders/${token}`, { cache: "no-store" })
      .then(async (response) => {
        if (cancelled) return;
        if (response.status === 404) {
          lastOrderStore.set(null);
          return;
        }
        if (!response.ok) return;
        const { order } = (await response.json()) as { order: PublicOrder };
        if (cancelled) return;
        if (order.status === "done" || order.status === "cancelled") lastOrderStore.set(null);
        else setStatus(order.status);
      })
      .catch(() => {
        // Offline or the server is down: say nothing rather than guess.
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!last || !status) return null;

  return (
    <Link
      href={`/order/${last.token}`}
      className="motion-overlay-in mx-4 mt-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 transition duration-200 ease-brand hover:bg-emerald-500/15 active:scale-[0.99]"
    >
      <span className="flex items-center gap-3">
        <ReceiptText className="h-5 w-5 shrink-0 text-emerald-400" />
        <span>
          <span className="block text-sm font-bold text-white">
            طلبك <span dir="ltr">#{last.number}</span> · {STATUS_LABEL[status]}
          </span>
          <span className="block text-xs text-emerald-200/80">تابع طلبك</span>
        </span>
      </span>
      <ChevronLeft className="h-5 w-5 text-emerald-300" />
    </Link>
  );
}
