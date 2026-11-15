"use client";

import { useEffect, useState } from "react";
import { Edit3, EyeOff, Image as ImageIcon, Loader2, Save, UploadCloud, Wallet } from "lucide-react";
import type { HeroSlide, MenuData, MenuItem } from "@/data/menu";

type Message = { ok: boolean; text: string };

const input =
  "w-full rounded-lg border border-white/10 bg-white/5 p-2 text-sm text-white outline-none transition-colors duration-200 ease-brand focus:border-amber-500";

const newItemId = (categoryId: string) => `${categoryId}-${Date.now().toString(36)}`;

async function upload(file: File): Promise<string> {
  const form = new FormData();
  form.append("image", file);
  const response = await fetch("/api/upload", { method: "POST", body: form });
  const data = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
  if (!response.ok || !data?.url) throw new Error(data?.error ?? "upload");
  return data.url;
}

const UPLOAD_ERROR: Record<string, string> = {
  "unsupported-type": "الصورة يجب أن تكون JPG أو PNG أو WebP.",
  "too-large": "الصورة أكبر من 5 ميغابايت.",
};

function ImageField({
  value,
  onChange,
  onError,
}: {
  value: string;
  onChange: (url: string) => void;
  onError: (text: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function pick(file: File) {
    setBusy(true);
    try {
      onChange(await upload(file));
    } catch (error) {
      onError(UPLOAD_ERROR[(error as Error).message] ?? "تعذر رفع الصورة. حاول مرة أخرى.");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-2">
      <span className="flex items-center gap-2 text-xs text-zinc-400">
        <ImageIcon className="h-3 w-3" /> الصورة
      </span>
      <div className="flex gap-2">
        <input
          type="text"
          dir="ltr"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          aria-label="رابط الصورة"
          className={`${input} flex-1`}
        />
        <label className="flex cursor-pointer items-center justify-center rounded-lg bg-white/10 px-3 transition duration-200 ease-brand hover:bg-white/20">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-label="رفع صورة"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void pick(file);
              e.target.value = "";
            }}
          />
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
          ) : (
            <UploadCloud className="h-4 w-4 text-amber-500" />
          )}
        </label>
      </div>
      {value && (
        <div className="aspect-video w-full overflow-hidden rounded-lg border border-white/10 bg-white/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-full w-full object-cover" />
        </div>
      )}
    </div>
  );
}

export function MenuEditor({ onSignedOut }: { onSignedOut: () => void }) {
  const [menu, setMenu] = useState<MenuData | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/menu", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) return onSignedOut();
        if (!response.ok) throw new Error(String(response.status));
        const data = (await response.json()) as MenuData;
        if (!cancelled) setMenu(data);
      })
      .catch(() => {
        if (!cancelled) setMessage({ ok: false, text: "تعذر تحميل المنتجات. حدّث الصفحة." });
      });
    return () => {
      cancelled = true;
    };
  }, [onSignedOut]);

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const change = (next: MenuData) => {
    setMenu(next);
    setDirty(true);
    setMessage(null);
  };

  function updateItem(categoryId: string, itemId: string, patch: Partial<MenuItem>) {
    if (!menu) return;
    change({
      ...menu,
      categories: menu.categories.map((category) =>
        category.id !== categoryId
          ? category
          : {
              ...category,
              items: category.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
            },
      ),
    });
  }

  function addItem(categoryId: string) {
    if (!menu) return;
    const item: MenuItem = { id: newItemId(categoryId), nameAr: "", nameEn: "", price: 0 };
    change({
      ...menu,
      categories: menu.categories.map((category) =>
        category.id === categoryId ? { ...category, items: [...category.items, item] } : category,
      ),
    });
  }

  function updateSlide(index: number, patch: Partial<HeroSlide>) {
    if (!menu) return;
    change({
      ...menu,
      heroSlides: menu.heroSlides.map((slide, i) => (i === index ? { ...slide, ...patch } : slide)),
    });
  }

  async function save() {
    if (!menu || saving) return;
    const unnamed = menu.categories.some((category) => category.items.some((item) => !item.nameAr.trim()));
    if (unnamed) {
      setMessage({ ok: false, text: "في منتج بدون اسم عربي. اكتب اسمه أو أخفِه قبل الحفظ." });
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(menu),
      });
      if (response.status === 401) return onSignedOut();
      if (!response.ok) throw new Error(String(response.status));
      setDirty(false);
      setMessage({ ok: true, text: "تم حفظ التغييرات، وتظهر للزبائن الآن." });
    } catch {
      setMessage({ ok: false, text: "تعذر الحفظ. تغييراتك ما زالت هنا، حاول مرة أخرى." });
    } finally {
      setSaving(false);
    }
  }

  if (!menu) {
    return (
      <p className="py-16 text-center text-sm text-zinc-500">
        {message ? message.text : "جارٍ تحميل المنتجات"}
      </p>
    );
  }

  const uploadError = (text: string) => setMessage({ ok: false, text });
  const price = (value: string) => Math.max(0, Number(value) || 0);

  return (
    <div className="space-y-8 pb-24">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="mb-5 text-xl font-bold text-amber-100">صور الواجهة</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {menu.heroSlides.map((slide, index) => (
            <div key={index} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/40 p-4">
              <label className="space-y-2">
                <span className="flex items-center gap-2 text-xs text-zinc-400">
                  <Edit3 className="h-3 w-3" /> العنوان (عربي / إنجليزي)
                </span>
                <input type="text" value={slide.titleAr} onChange={(e) => updateSlide(index, { titleAr: e.target.value })} placeholder="العنوان بالعربي" className={input} />
                <input type="text" dir="ltr" value={slide.titleEn} onChange={(e) => updateSlide(index, { titleEn: e.target.value })} placeholder="Title in English" className={input} />
              </label>
              <label className="space-y-1">
                <span className="flex items-center gap-2 text-xs text-zinc-400">
                  <Wallet className="h-3 w-3" /> السعر بالدينار
                </span>
                <input type="number" min={0} step="0.5" inputMode="decimal" value={slide.price} onChange={(e) => updateSlide(index, { price: price(e.target.value) })} className={input} />
              </label>
              <ImageField value={slide.image ?? ""} onChange={(image) => updateSlide(index, { image })} onError={uploadError} />
            </div>
          ))}
        </div>
      </section>

      {menu.categories.map((category) => (
        <section key={category.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="mb-5 text-xl font-bold text-amber-100">{category.titleAr}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {category.items.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col gap-3 rounded-xl border border-white/10 bg-black/40 p-4 ${item.hidden ? "opacity-60" : ""}`}
              >
                <label className="space-y-2">
                  <span className="flex items-center gap-2 text-xs text-zinc-400">
                    <Edit3 className="h-3 w-3" /> الاسم (عربي / إنجليزي)
                  </span>
                  <input type="text" value={item.nameAr} onChange={(e) => updateItem(category.id, item.id, { nameAr: e.target.value })} placeholder="الاسم بالعربي" className={input} />
                  <input type="text" dir="ltr" value={item.nameEn} onChange={(e) => updateItem(category.id, item.id, { nameEn: e.target.value })} placeholder="Name in English" className={input} />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-zinc-400">المكونات (اختياري)</span>
                  <input type="text" value={item.note ?? ""} onChange={(e) => updateItem(category.id, item.id, { note: e.target.value })} placeholder="زبدة · عسل · لوز" className={input} />
                </label>
                <label className="space-y-1">
                  <span className="flex items-center gap-2 text-xs text-zinc-400">
                    <Wallet className="h-3 w-3" /> السعر بالدينار
                  </span>
                  <input type="number" min={0} step="0.5" inputMode="decimal" value={item.price} onChange={(e) => updateItem(category.id, item.id, { price: price(e.target.value) })} className={input} />
                </label>
                <ImageField value={item.image ?? ""} onChange={(image) => updateItem(category.id, item.id, { image })} onError={uploadError} />
                <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={item.hidden ?? false}
                    onChange={(e) => updateItem(category.id, item.id, { hidden: e.target.checked })}
                    className="h-4 w-4 accent-amber-500"
                  />
                  <EyeOff className="h-3 w-3" /> إخفاء من القائمة
                </label>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => addItem(category.id)}
              className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-200 transition duration-200 ease-brand hover:bg-amber-500/20 active:scale-[0.98]"
            >
              إضافة منتج
            </button>
          </div>
        </section>
      ))}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <p role="status" className={`text-sm ${message ? (message.ok ? "text-emerald-400" : "text-red-400") : "text-zinc-400"}`}>
            {message?.text ?? (dirty ? "عندك تغييرات لم تُحفظ." : "لا توجد تغييرات.")}
          </p>
          <button
            type="button"
            onClick={save}
            disabled={saving || !dirty}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 font-bold text-black transition duration-200 ease-brand hover:bg-amber-400 active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ التغييرات
          </button>
        </div>
      </div>
    </div>
  );
}
