"use client";

import { useEffect, useState } from "react";
import { Croissant, Home, Info } from "lucide-react";
import { scrollToId } from "@/lib/motion";

type BottomNavProps = {
  onMenuClick: () => void;
};

type Section = "top" | "menu" | "about";

export function BottomNav({ onMenuClick }: BottomNavProps) {
  const [active, setActive] = useState<Section>("top");

  // The highlight used to be pinned to "الرئيسية"; track the real position.
  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const about = document.getElementById("about");
      const aboutTop = about?.getBoundingClientRect().top ?? Infinity;

      if (aboutTop < window.innerHeight * 0.6) setActive("about");
      else if (window.scrollY > 240) setActive("menu");
      else setActive("top");
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const itemClass = (section: Section) =>
    `flex flex-col items-center gap-1 rounded-lg px-4 py-1 transition duration-200 ease-brand active:scale-90 ${
      active === section ? "text-amber-400" : "text-zinc-400 hover:text-amber-300"
    }`;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-amber-600/20 bg-[#0a0a0a]/95 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around px-4 py-3">
        <button
          type="button"
          onClick={() => scrollToId("top")}
          aria-current={active === "top" ? "page" : undefined}
          className={itemClass("top")}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px]">الرئيسية</span>
        </button>
        <button
          type="button"
          onClick={onMenuClick}
          aria-current={active === "menu" ? "page" : undefined}
          className={itemClass("menu")}
        >
          <Croissant className="h-5 w-5" />
          <span className="text-[10px]">القائمة</span>
        </button>
        <button
          type="button"
          onClick={() => scrollToId("about")}
          aria-current={active === "about" ? "page" : undefined}
          className={itemClass("about")}
        >
          <Info className="h-5 w-5" />
          <span className="text-[10px]">عن المقهى</span>
        </button>
      </div>
    </nav>
  );
}
