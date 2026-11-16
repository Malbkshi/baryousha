"use client";

import { ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/formatPrice";
import { useCart } from "./CartContext";

/** Floating summary of the cart. Sits above the mobile bottom nav. */
export function CartBar({ onOpen }: { onOpen: () => void }) {
  const { count, total } = useCart();
  if (count === 0) return null;

  return (
    <div className="motion-overlay-in pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 px-3 lg:inset-x-auto lg:bottom-8 lg:left-8 lg:w-96 lg:px-0">
      <button
        type="button"
        onClick={onOpen}
        className="pointer-events-auto flex w-full items-center justify-between gap-3 rounded-2xl bg-amber-500 px-4 py-3 text-black shadow-xl shadow-black/50 transition duration-200 ease-brand hover:bg-amber-400 active:scale-[0.98]"
      >
        <span className="flex items-center gap-3">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-black/15">
            <ShoppingBag className="h-5 w-5" />
            <span
              key={count}
              className="motion-pop absolute -left-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[11px] font-bold text-amber-400"
            >
              {count}
            </span>
          </span>
          <span className="text-sm font-bold">عرض السلة وإتمام الطلب</span>
        </span>
        <span className="text-base font-black">{formatPrice(total)}</span>
      </button>
    </div>
  );
}
