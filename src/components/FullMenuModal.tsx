"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useEffect } from "react";

type FullMenuModalProps = {
  open: boolean;
  onClose: () => void;
};

export function FullMenuModal({ open, onClose }: FullMenuModalProps) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="قائمة الأسعار الكاملة"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl border border-amber-600/40 bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute left-3 top-3 z-10 rounded-full bg-black/60 p-2 text-white backdrop-blur-sm"
          aria-label="إغلاق"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="overflow-y-auto max-h-[90vh]">
          <Image
            src="/images/menu-full.jpg"
            alt="قائمة أسعار مقهى البريوشة"
            width={800}
            height={1200}
            className="h-auto w-full"
          />
        </div>
      </div>
    </div>
  );
}
