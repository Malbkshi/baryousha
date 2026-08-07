"use client";

import { useEffect, useRef } from "react";
import { categories } from "@/data/menu";
import { CategoryIcon } from "@/lib/categoryIcon";
import { scrollBehavior, scrollToId } from "@/lib/motion";

type CategoryTabsProps = {
  activeId: string;
  onChange: (id: string) => void;
};

export function CategoryTabs({ activeId, onChange }: CategoryTabsProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // As you scroll the page the active tab can end up off-screen in this
  // horizontal strip. Bring it back into view whenever it changes.
  useEffect(() => {
    const tab = listRef.current?.querySelector<HTMLElement>(
      `[data-category="${activeId}"]`
    );
    tab?.scrollIntoView({
      behavior: scrollBehavior(),
      block: "nearest",
      inline: "center",
    });
  }, [activeId]);

  const scrollToCategory = (id: string) => {
    onChange(id);
    scrollToId(`category-${id}`);
  };

  return (
    <div className="sticky top-0 z-30 -mx-0 border-b border-amber-600/20 bg-[#0a0a0a]/95 py-3 backdrop-blur-md">
      <div
        ref={listRef}
        className="scrollbar-hide flex gap-2 overflow-x-auto px-4"
      >
        {categories.map((category) => {
          const isActive = category.id === activeId;
          return (
            <button
              key={category.id}
              type="button"
              data-category={category.id}
              aria-current={isActive ? "true" : undefined}
              onClick={() => scrollToCategory(category.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition duration-200 ease-brand active:scale-95 ${
                isActive
                  ? "border-amber-500 bg-amber-500 text-black"
                  : "border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:border-amber-600/40 hover:text-zinc-200"
              }`}
            >
              <CategoryIcon
                icon={category.icon}
                className={`h-4 w-4 transition-colors duration-200 ease-brand ${
                  isActive ? "text-black" : "text-zinc-500"
                }`}
              />
              <span>{category.titleAr}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
