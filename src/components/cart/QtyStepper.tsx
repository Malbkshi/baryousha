"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { LIMITS } from "@/lib/orders/types";

type QtyStepperProps = {
  qty: number;
  onChange: (qty: number) => void;
  label: string;
  size?: "sm" | "md";
};

/** − n + for a line already in the cart. Going below one removes the line. */
export function QtyStepper({ qty, onChange, label, size = "md" }: QtyStepperProps) {
  const box = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const button = `flex ${box} items-center justify-center rounded-lg bg-white/10 text-white transition duration-150 ease-brand hover:bg-white/20 active:scale-90 disabled:opacity-40 disabled:active:scale-100`;

  return (
    <div className="flex items-center gap-1 rounded-xl border border-amber-500/30 bg-black/40 p-0.5">
      <button
        type="button"
        onClick={() => onChange(qty - 1)}
        aria-label={qty === 1 ? `حذف ${label}` : `إنقاص ${label}`}
        className={button}
      >
        {qty === 1 ? <Trash2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
      </button>
      <span
        key={qty}
        aria-live="polite"
        className="motion-pop w-6 text-center text-sm font-bold text-amber-300"
      >
        {qty}
      </span>
      <button
        type="button"
        onClick={() => onChange(qty + 1)}
        disabled={qty >= LIMITS.maxQtyPerLine}
        aria-label={`زيادة ${label}`}
        className={button}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
