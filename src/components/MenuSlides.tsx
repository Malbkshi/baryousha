"use client";

import useEmblaCarousel from "embla-carousel-react";
import { categories } from "@/data/menu";
import { MenuCard } from "./MenuCard";
import { CategoryIcon } from "@/lib/categoryIcon";

type MenuSlidesProps = {
  categoryId: string;
};

export function MenuSlides({ categoryId }: MenuSlidesProps) {
  const category = categories.find((c) => c.id === categoryId) ?? categories[0];
  const [emblaRef] = useEmblaCarousel({
    align: "start",
    direction: "rtl",
    containScroll: "trimSnaps",
  });

  return (
    <section className="mt-4">
      <div className="mb-3 flex items-center gap-2 px-4">
        <CategoryIcon icon={category.icon} className="h-5 w-5 text-amber-400" />
        <h2 className="text-lg font-bold text-amber-100">{category.titleAr}</h2>
        <span className="text-sm text-zinc-500">· {category.titleEn}</span>
      </div>

      <div className="overflow-hidden px-4" ref={emblaRef}>
        <div className="flex gap-4">
          {category.items.map((item) => (
            <div
              key={item.id}
              className="min-w-0 shrink-0 grow-0 basis-auto"
            >
              <MenuCard item={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
