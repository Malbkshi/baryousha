"use client";

import { Croissant, Home, Info } from "lucide-react";

type BottomNavProps = {
  onMenuClick: () => void;
};

export function BottomNav({ onMenuClick }: BottomNavProps) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-amber-600/20 bg-[#0a0a0a]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center justify-around px-4 py-3">
        <button
          type="button"
          onClick={() => scrollTo("top")}
          className="flex flex-col items-center gap-1 text-amber-400"
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px]">الرئيسية</span>
        </button>
        <button
          type="button"
          onClick={onMenuClick}
          className="flex flex-col items-center gap-1 text-zinc-400 hover:text-amber-300"
        >
          <Croissant className="h-5 w-5" />
          <span className="text-[10px]">القائمة</span>
        </button>
        <button
          type="button"
          onClick={() => scrollTo("about")}
          className="flex flex-col items-center gap-1 text-zinc-400 hover:text-amber-300"
        >
          <Info className="h-5 w-5" />
          <span className="text-[10px]">عن المقهى</span>
        </button>
      </div>
    </nav>
  );
}
