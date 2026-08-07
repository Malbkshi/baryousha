import type { MenuItem } from "@/data/menu";
import { formatPrice } from "@/lib/formatPrice";

export function MenuListRow({
  item,
  onClick,
}: {
  item: MenuItem;
  onClick: () => void;
}) {
  return (
    <li
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${item.nameAr} — ${formatPrice(item.price)}`}
      className="group -mx-2 flex cursor-pointer items-center gap-4 rounded-lg border-b border-zinc-800/80 px-2 py-4 transition duration-200 ease-brand last:border-b-0 hover:bg-white/[0.04] focus-visible:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 active:scale-[0.99] active:bg-white/[0.08] lg:[&:nth-last-child(-n+2)]:border-b-0"
    >
      {item.image && (
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-800 shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image}
            alt={item.nameAr}
            className="h-full w-full object-cover transition-transform duration-500 ease-brand group-hover:scale-110"
          />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <p className="text-base font-bold text-white">{item.nameAr}</p>
        <p className="mt-0.5 text-xs text-zinc-400">{item.nameEn}</p>
        {item.note && (
          <p className="mt-1 text-xs font-medium text-amber-500/80">
            {item.note}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 shadow-sm transition-colors duration-200 ease-brand group-hover:border-amber-500/40 group-hover:bg-amber-500/20">
        <span className="text-sm font-bold text-amber-500">
          {formatPrice(item.price)}
        </span>
      </div>
    </li>
  );
}
