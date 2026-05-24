import type { MenuItem } from "@/data/menu";
import { X, Plus, Minus, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import { formatPrice } from "@/lib/formatPrice";

type ItemDetailsModalProps = {
  item: MenuItem | null;
  onClose: () => void;
};

export function ItemDetailsModal({ item, onClose }: ItemDetailsModalProps) {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (item) setQuantity(1);
  }, [item]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center p-4 transition-opacity">
      <div 
        className="w-full max-w-md animate-in slide-in-from-bottom-10 fade-in duration-300 overflow-hidden rounded-3xl bg-zinc-900 border border-white/10 shadow-2xl"
      >
        <div className="relative aspect-square w-full bg-zinc-800">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition hover:bg-black/80"
          >
            <X className="h-5 w-5" />
          </button>
          {item.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image} alt={item.nameAr} className="h-full w-full object-cover" />
          ) : (
             <div className="flex h-full items-center justify-center text-zinc-500">لا توجد صورة</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-80" />
        </div>

        <div className="p-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-white">{item.nameAr}</h2>
            <p className="text-sm text-zinc-400">{item.nameEn}</p>
            {item.note && (
              <p className="mt-2 text-sm font-medium text-amber-500">{item.note}</p>
            )}
          </div>

          <div className="mb-8 flex items-center justify-between">
            <span className="text-2xl font-bold text-amber-500">{formatPrice(item.price)}</span>
            <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center font-bold text-white text-lg">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              alert("تمت الإضافة للسلة! (Added to cart)");
              onClose();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-4 font-bold text-black transition hover:bg-amber-400 active:scale-[0.98] shadow-lg shadow-amber-500/20"
          >
            <ShoppingCart className="h-5 w-5" />
            إضافة للسلة • {formatPrice(item.price * quantity)}
          </button>
        </div>
      </div>
    </div>
  );
}
