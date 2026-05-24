import type { MenuItem } from "@/data/menu";
import { formatPrice } from "@/lib/formatPrice";

export function MenuListRow({ item, onClick }: { item: MenuItem; onClick: () => void }) {
  return (
    <li 
      onClick={onClick}
      className="flex cursor-pointer items-center gap-4 border-b border-zinc-800/80 py-4 last:border-0 transition-colors hover:bg-white/[0.04] active:bg-white/[0.08] px-2 -mx-2 rounded-lg"
    >
      {item.image && (
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-800 shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image}
            alt={item.nameAr}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
          />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <p className="font-bold text-white text-base">{item.nameAr}</p>
        <p className="text-xs text-zinc-400 mt-0.5">{item.nameEn}</p>
        {item.note && (
          <p className="mt-1 text-xs font-medium text-amber-500/80">{item.note}</p>
        )}
      </div>
      <div className="shrink-0 flex items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 shadow-sm">
        <span className="text-sm font-bold text-amber-500">
          {formatPrice(item.price)}
        </span>
      </div>
    </li>
  );
}
