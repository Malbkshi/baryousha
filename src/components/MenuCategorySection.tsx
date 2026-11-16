import type { MenuCategory, MenuItem } from "@/data/menu";
import { CategoryIcon } from "@/lib/categoryIcon";
import { MenuListRow } from "./MenuListRow";

type MenuCategorySectionProps = {
  category: MenuCategory;
  onItemClick: (item: MenuItem) => void;
};

export function MenuCategorySection({ category, onItemClick }: MenuCategorySectionProps) {
  return (
    <section
      id={`category-${category.id}`}
      className="scroll-mt-28 px-4"
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10">
          <CategoryIcon icon={category.icon} className="h-5 w-5 text-amber-400" />
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-black leading-tight text-amber-100">{category.titleAr}</h2>
          <p className="text-xs text-zinc-500">
            {category.titleEn} · {category.items.length} صنف
          </p>
        </div>
        <span aria-hidden className="h-px flex-1 bg-gradient-to-l from-amber-500/50 to-transparent" />
      </div>

      <ul className="grid grid-cols-1 gap-x-8 rounded-2xl border border-amber-600/15 bg-zinc-900/50 px-4 py-1 lg:grid-cols-2">
        {category.items.map((item) => (
          <MenuListRow
            key={item.id}
            item={item}
            icon={category.icon}
            onClick={() => onItemClick(item)}
          />
        ))}
      </ul>
    </section>
  );
}
