"use client";

import { useEffect, useState } from "react";
import { HeroCarousel } from "./HeroCarousel";
import { CategoryTabs } from "./CategoryTabs";
import { MenuCategorySection } from "./MenuCategorySection";
import { FullMenuModal } from "./FullMenuModal";
import { AboutSection } from "./AboutSection";
import { BottomNav } from "./BottomNav";
import { categories, totalMenuItems } from "@/data/menu";
import type { MenuItem } from "@/data/menu";
import { FeaturedCroissants } from "./FeaturedCroissants";
import { ScrollText } from "lucide-react";
import { ItemDetailsModal } from "./ItemDetailsModal";

export function MenuApp() {
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    categories.forEach((category) => {
      const el = document.getElementById(`category-${category.id}`);
      if (!el) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveCategory(category.id);
            }
          });
        },
        { rootMargin: "-30% 0px -55% 0px", threshold: 0 }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollToMenu = () => {
    document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <div id="top" />
      <HeroCarousel />

      <main className="pb-24">
        <section id="menu" className="mt-6">
          <div className="mb-4 px-4">
            <h2 className="text-xl font-bold text-amber-100">قائمة الطعام</h2>
            <p className="text-sm text-zinc-500">
              The Menu · {totalMenuItems} صنف · 7 أقسام
            </p>
          </div>

          <CategoryTabs
            activeId={activeCategory}
            onChange={setActiveCategory}
          />

          <div className="mt-6">
            <FeaturedCroissants />
          </div>

          <div className="mt-8 flex flex-col gap-10">
            {categories.map((category) => (
              <MenuCategorySection 
                key={category.id} 
                category={category} 
                onItemClick={setSelectedItem} 
              />
            ))}
          </div>

          <div className="mt-8 px-4">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 py-3.5 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-500/20"
            >
              <ScrollText className="h-4 w-4" />
              عرض قائمة الأسعار الكاملة (صورة)
            </button>
          </div>
        </section>

        <AboutSection />
      </main>

      <BottomNav onMenuClick={scrollToMenu} />
      <FullMenuModal open={menuOpen} onClose={() => setMenuOpen(false)} />
      <ItemDetailsModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </>
  );
}
