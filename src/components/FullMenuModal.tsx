"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useDialog } from "@/lib/useDialog";

type FullMenuModalProps = {
  open: boolean;
  onClose: () => void;
};

export function FullMenuModal({ open, onClose }: FullMenuModalProps) {
  const { closing, requestClose, panelRef } = useDialog(open, onClose);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-4 backdrop-blur-sm sm:items-center ${
        closing ? "motion-overlay-out" : "motion-overlay-in"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="قائمة الأسعار الكاملة"
      onClick={requestClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl border border-amber-600/40 bg-zinc-950 outline-none ${
          closing ? "motion-panel-out" : "motion-panel-in"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={requestClose}
          className="absolute left-3 top-3 z-10 rounded-full bg-black/60 p-2 text-white backdrop-blur-sm transition duration-150 ease-brand hover:bg-black/90 active:scale-90"
          aria-label="إغلاق"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="max-h-[90vh] overflow-y-auto">
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
