"use client";

import { categories } from "@/data/menu";
import { CategoryIcon } from "@/lib/categoryIcon";

type CategoryTabsProps = {
  activeId: string;
  onChange: (id: string) => void;
};

export function CategoryTabs({ activeId, onChange }: CategoryTabsProps) {
  const scrollToCategory = (id: string) => {
    onChange(id);
    const el = document.getElementById(`category-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="sticky top-0 z-30 -mx-0 border-b border-amber-600/20 bg-[#0a0a0a]/95 py-3 backdrop-blur-md">
      <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4">
        {categories.map((category) => {
          const isActive = category.id === activeId;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => scrollToCategory(category.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "border-amber-500 bg-amber-500 text-black"
                  : "border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:border-amber-600/40"
              }`}
            >
              <CategoryIcon
                icon={category.icon}
                className={`h-4 w-4 ${isActive ? "text-black" : "text-zinc-500"}`}
              />
              <span>{category.titleAr}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
