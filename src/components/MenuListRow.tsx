"use client";

import { Plus } from "lucide-react";
import type { MenuItem } from "@/data/menu";
import { formatPrice } from "@/lib/formatPrice";
import { useCart } from "./cart/CartContext";
import { QtyStepper } from "./cart/QtyStepper";

export function MenuListRow({
  item,
  onClick,
}: {
  item: MenuItem;
  onClick: () => void;
}) {
  const cart = useCart();
  const qty = cart.qtyOf(item.id);

  return (
    <li className="group -mx-2 flex items-center gap-3 rounded-lg border-b border-zinc-800/80 px-2 py-4 transition-colors duration-200 ease-brand last:border-b-0 hover:bg-white/[0.04] lg:[&:nth-last-child(-n+2)]:border-b-0">
      {/* The details part is one button; the cart controls sit beside it so a
          tap on + never opens the sheet. */}
      <button
        type="button"
        onClick={onClick}
        aria-label={`${item.nameAr} — ${formatPrice(item.price)}، عرض التفاصيل`}
        className="flex min-w-0 flex-1 items-center gap-4 rounded-lg text-right outline-none transition duration-200 ease-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 active:scale-[0.99]"
      >
        {item.image && (
          <span className="block h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-800 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 ease-brand group-hover:scale-110"
            />
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col justify-center">
          <span className="text-base font-bold text-white">{item.nameAr}</span>
          <span className="mt-0.5 text-xs text-zinc-400">{item.nameEn}</span>
          {item.note && (
            <span className="mt-1 text-xs font-medium text-amber-500/80">{item.note}</span>
          )}
        </span>
      </button>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="text-sm font-bold text-amber-400">{formatPrice(item.price)}</span>
        {qty > 0 ? (
          <QtyStepper
            size="sm"
            qty={qty}
            label={item.nameAr}
            onChange={(next) => cart.setQty(item.id, next)}
          />
        ) : (
          <button
            type="button"
            onClick={() => cart.add(item.id)}
            aria-label={`أضف ${item.nameAr} للسلة`}
            className="flex h-9 items-center gap-1 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 text-xs font-bold text-amber-300 transition duration-200 ease-brand hover:bg-amber-500/20 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            أضف
          </button>
        )}
      </div>
    </li>
  );
}
