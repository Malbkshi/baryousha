"use client";

import type { MenuItem } from "@/data/menu";
import { X, Plus, Minus, ShoppingCart, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/formatPrice";
import { useDialog } from "@/lib/useDialog";

type ItemDetailsModalProps = {
  item: MenuItem | null;
  onClose: () => void;
};

export function ItemDetailsModal({ item, onClose }: ItemDetailsModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { closing, requestClose, panelRef } = useDialog(Boolean(item), onClose);

  // Let the confirmation read for a beat before the sheet leaves.
  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(requestClose, 900);
    return () => clearTimeout(timer);
  }, [added, requestClose]);

  if (!item) return null;

  return (
    <div
      onClick={requestClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.nameAr}
      className={`fixed inset-0 z-[100] flex cursor-pointer items-end justify-center bg-black/80 p-4 backdrop-blur-sm sm:items-center ${
        closing ? "motion-overlay-out" : "motion-overlay-in"
      }`}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md cursor-default overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 shadow-2xl outline-none ${
          closing ? "motion-panel-out" : "motion-panel-in"
        }`}
      >
        <div className="relative aspect-square w-full bg-zinc-800">
          <button
            onClick={requestClose}
            aria-label="إغلاق"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition duration-150 ease-brand hover:bg-black/80 active:scale-90"
          >
            <X className="h-5 w-5" />
          </button>
          {item.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image}
              alt={item.nameAr}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-500">
              لا توجد صورة
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-80" />
        </div>

        <div className="p-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-white">{item.nameAr}</h2>
            <p className="text-sm text-zinc-400">{item.nameEn}</p>
            {item.note && (
              <p className="mt-2 text-sm font-medium text-amber-500">
                {item.note}
              </p>
            )}
          </div>

          <div className="mb-8 flex items-center justify-between">
            <span className="text-2xl font-bold text-amber-500">
              {formatPrice(item.price)}
            </span>
            <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="إنقاص الكمية"
                disabled={quantity === 1}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition duration-150 ease-brand hover:bg-white/20 active:scale-90 disabled:opacity-40 disabled:active:scale-100"
              >
                <Minus className="h-4 w-4" />
              </button>
              {/* Remounting on change restarts the pop. */}
              <span
                key={quantity}
                aria-live="polite"
                className="motion-pop w-6 text-center text-lg font-bold text-white"
              >
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                aria-label="زيادة الكمية"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition duration-150 ease-brand hover:bg-white/20 active:scale-90"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <button
            onClick={() => setAdded(true)}
            disabled={added}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold text-black shadow-lg transition duration-200 ease-brand active:scale-[0.98] ${
              added
                ? "bg-emerald-400 shadow-emerald-500/20"
                : "bg-amber-500 shadow-amber-500/20 hover:bg-amber-400"
            }`}
          >
            {added ? (
              <>
                <Check className="motion-pop h-5 w-5" />
                تمت الإضافة للسلة
              </>
            ) : (
              <>
                <ShoppingCart className="h-5 w-5" />
                إضافة للسلة • {formatPrice(item.price * quantity)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
