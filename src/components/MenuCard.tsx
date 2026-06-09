import Image from "next/image";
import type { MenuItem } from "@/data/menu";
import { formatPrice } from "@/lib/formatPrice";
import { ItemPlaceholder } from "@/lib/itemPlaceholder";

export function MenuCard({ item, onClick }: { item: MenuItem; onClick?: () => void }) {
  return (
    <article
      onClick={onClick}
      className={`flex h-full w-full flex-col overflow-hidden rounded-2xl border border-amber-600/30 bg-zinc-900/90 shadow-lg shadow-black/40 transition-all ${
        onClick ? "cursor-pointer hover:border-amber-500/50 hover:scale-[1.02] active:scale-[0.98]" : ""
      }`}
    >
      {item.image ? (
        <div className="relative h-36 w-full">
          <Image
            src={item.image}
            alt={item.nameAr}
            fill
            className="object-cover"
            sizes="280px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
        </div>
      ) : (
        <div className="flex h-20 items-center justify-center bg-gradient-to-br from-amber-900/30 to-zinc-900">
          <ItemPlaceholder item={item} />
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-white">{item.nameAr}</h3>
            <p className="mt-0.5 text-xs text-zinc-400">{item.nameEn}</p>
          </div>
          <span className="shrink-0 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-black">
            {formatPrice(item.price)}
          </span>
        </div>
        {item.note && (
          <p className="mt-2 text-xs leading-relaxed text-amber-200/70">
            {item.note}
          </p>
        )}
      </div>
    </article>
  );
}
