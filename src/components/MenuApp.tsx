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
import { ScrollText, MapPin, Phone, Clock, Truck } from "lucide-react";
import { ItemDetailsModal } from "./ItemDetailsModal";
import { CategoryIcon } from "@/lib/categoryIcon";

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
    <div className="mx-auto max-w-7xl px-0 sm:px-4 lg:px-8 py-0 sm:py-6 lg:py-10">
      <div className="lg:grid lg:grid-cols-[300px_1fr] lg:gap-8 lg:items-start">
        {/* Right side: Sidebar (Desktop only) */}
        <aside className="hidden lg:block sticky top-8 bg-zinc-900/60 border border-amber-600/20 rounded-3xl p-6 backdrop-blur-md">
          {/* Cafe Branding */}
          <div className="text-center mb-6 border-b border-zinc-800 pb-6">
            <h1 className="text-3xl font-extrabold text-white tracking-wide">مقهى البريوشة</h1>
            <p className="text-amber-400 text-sm mt-1 uppercase tracking-widest font-semibold">ALBARYOSHA CAFÉ</p>
            <p className="text-zinc-500 text-xs mt-2">الطعم الطرابلسي الأصلي في طرابلس</p>
          </div>

          {/* Sidebar Vertical Category Tabs */}
          <div className="mb-8">
            <h3 className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider px-2">أقسام القائمة</h3>
            <nav className="flex flex-col gap-1.5">
              {categories.map((category) => {
                const isActive = category.id === activeCategory;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setActiveCategory(category.id);
                      document.getElementById(`category-${category.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className={`flex items-center justify-between w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-amber-500 text-black shadow-md shadow-amber-900/20"
                        : "text-zinc-300 hover:bg-zinc-800/50 hover:text-amber-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CategoryIcon
                        icon={category.icon}
                        className={`h-4.5 w-4.5 ${isActive ? "text-black" : "text-zinc-400"}`}
                      />
                      <span>{category.titleAr}</span>
                    </div>
                    <span className={`text-[10px] rounded-full px-2 py-0.5 font-bold ${
                      isActive ? "bg-black/10 text-black" : "bg-zinc-800 text-zinc-500"
                    }`}>
                      {category.items.length}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Cafe Info & Delivery Details */}
          <div className="space-y-4 rounded-2xl bg-black/40 p-4 border border-zinc-800">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-zinc-200">العنوان</h4>
                <p className="text-xs text-zinc-400 mt-0.5">طرابلس، السياحية</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-zinc-200">رقم الهاتف</h4>
                <p dir="ltr" className="text-xs font-bold text-amber-400 mt-0.5">091 123 4567</p>
              </div>
            </div>

            <div className="flex items-start gap-3 border-t border-zinc-800 pt-3 mt-3">
              <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-zinc-200">ساعات العمل</h4>
                <p className="text-xs text-zinc-400 mt-0.5">يومياً: 8:00 صباحاً - 11:00 مساءً</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80 px-3 py-2 text-xs text-zinc-500">
              <Truck className="h-4 w-4 shrink-0 text-amber-500/60" />
              <span>التوصيل متوفر قريباً</span>
            </div>
          </div>
        </aside>

        {/* Left side: Main scrollable area */}
        <div className="flex-1 min-w-0">
          <div id="top" />
          <div className="overflow-hidden rounded-none sm:rounded-2xl border-0 sm:border border-amber-600/10 shadow-xl shadow-black/35">
            <HeroCarousel />
          </div>

          <main className="pb-24 lg:pb-12">
            <section id="menu" className="mt-6">
              <div className="mb-4 px-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-amber-100">قائمة الطعام</h2>
                  <p className="text-sm text-zinc-500">
                    The Menu · {totalMenuItems} صنف · 7 أقسام
                  </p>
                </div>
                {/* Desktop menu image button */}
                <button
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  className="hidden lg:flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-500/20"
                >
                  <ScrollText className="h-4 w-4" />
                  عرض قائمة الأسعار الكاملة
                </button>
              </div>

              {/* Mobile-only category tabs */}
              <div className="lg:hidden">
                <CategoryTabs
                  activeId={activeCategory}
                  onChange={setActiveCategory}
                />
              </div>

              <div className="mt-6">
                <FeaturedCroissants />
              </div>

              <div className="mt-8 flex flex-col gap-12 lg:gap-16">
                {categories.map((category) => (
                  <MenuCategorySection 
                    key={category.id} 
                    category={category} 
                    onItemClick={setSelectedItem} 
                  />
                ))}
              </div>

              {/* Mobile-only menu image button */}
              <div className="mt-8 px-4 lg:hidden">
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

            {/* About section, shown below on mobile, hidden on desktop since sidebar has all the info */}
            <div className="lg:hidden">
              <AboutSection />
            </div>
          </main>
        </div>
      </div>

      <BottomNav onMenuClick={scrollToMenu} />
      <FullMenuModal open={menuOpen} onClose={() => setMenuOpen(false)} />
      <ItemDetailsModal key={selectedItem?.id ?? "closed"} item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}

