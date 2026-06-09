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
      <div className="mb-3 flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 shadow-md shadow-amber-900/30">
        <CategoryIcon icon={category.icon} className="h-5 w-5 text-black" />
        <h2 className="text-base font-bold text-black">{category.titleAr}</h2>
        <span className="text-sm font-medium text-black/70">
          · {category.titleEn}
        </span>
      </div>

      <ul className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 rounded-xl border border-amber-600/20 bg-zinc-900/50 px-4 py-2">
        {category.items.map((item) => (
          <MenuListRow key={item.id} item={item} onClick={() => onItemClick(item)} />
        ))}
      </ul>

      <p className="mt-2 text-center text-xs text-zinc-600">
        {category.items.length} صنف
      </p>
    </section>
  );
}
