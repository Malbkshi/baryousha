"use client";

import { useState } from "react";
import type { Settings } from "@/lib/orders/types";

type SettingsPanelProps = {
  settings: Settings;
  /** Resolves true when the settings were saved. */
  onSave: (settings: Settings) => Promise<boolean>;
};

export function SettingsPanel({ settings, onSave }: SettingsPanelProps) {
  const [openTime, setOpenTime] = useState(settings.openTime);
  const [closeTime, setCloseTime] = useState(settings.closeTime);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(next: Settings) {
    if (next.openTime >= next.closeTime) {
      setMessage({ ok: false, text: "وقت الفتح يجب أن يكون قبل وقت الإغلاق." });
      return;
    }
    setBusy(true);
    const ok = await onSave(next);
    setBusy(false);
    setMessage(ok ? { ok: true, text: "تم الحفظ." } : { ok: false, text: "تعذر الحفظ. حاول مرة أخرى." });
  }

  const timeInput =
    "w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none transition-colors duration-200 ease-brand focus:border-amber-500 [color-scheme:dark]";

  return (
    <div className="mx-auto max-w-md space-y-5">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white">استقبال الطلبات من الموقع</h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              أوقفه وقت الزحمة أو عند نفاد الأصناف. القائمة تبقى ظاهرة للزبائن.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.acceptingOrders}
            aria-label="استقبال الطلبات"
            disabled={busy}
            onClick={() => save({ ...settings, acceptingOrders: !settings.acceptingOrders })}
            className={`relative h-8 w-14 shrink-0 rounded-full transition-colors duration-200 ease-brand disabled:opacity-60 ${
              settings.acceptingOrders ? "bg-emerald-500" : "bg-zinc-700"
            }`}
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all duration-200 ease-brand ${
                settings.acceptingOrders ? "right-1" : "right-7"
              }`}
            />
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-base font-bold text-white">ساعات استقبال الطلبات</h2>
        <p className="mt-1 text-xs text-zinc-400">خارج هذه الساعات لا يمكن الطلب من الموقع.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block text-xs font-semibold text-zinc-300">
            من
            <input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} className={`${timeInput} mt-1.5`} />
          </label>
          <label className="block text-xs font-semibold text-zinc-300">
            إلى
            <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className={`${timeInput} mt-1.5`} />
          </label>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => save({ ...settings, openTime, closeTime })}
          className="mt-4 w-full rounded-xl bg-amber-500 py-3 font-bold text-black transition duration-200 ease-brand hover:bg-amber-400 active:scale-[0.98] disabled:opacity-60"
        >
          حفظ الساعات
        </button>
      </section>

      {message && (
        <p role="status" className={`text-center text-sm ${message.ok ? "text-emerald-400" : "text-red-400"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
