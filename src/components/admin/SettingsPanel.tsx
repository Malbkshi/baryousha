"use client";

import { useState } from "react";
import { PRAYER_MINUTES_LIMIT, type Settings } from "@/lib/orders/types";
import { PrayerSchedule } from "../PrayerSchedule";

type SettingsPanelProps = {
  settings: Settings;
  /** Resolves true when the settings were saved. */
  onSave: (settings: Settings) => Promise<boolean>;
};

function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-14 shrink-0 rounded-full transition-colors duration-200 ease-brand disabled:opacity-60 ${
        checked ? "bg-emerald-500" : "bg-zinc-700"
      }`}
    >
      <span
        className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all duration-200 ease-brand ${
          checked ? "right-1" : "right-7"
        }`}
      />
    </button>
  );
}

const field =
  "w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none transition-colors duration-200 ease-brand focus:border-amber-500 [color-scheme:dark]";

export function SettingsPanel({ settings, onSave }: SettingsPanelProps) {
  const [draft, setDraft] = useState(settings);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  // Remounting the preview makes it fetch the schedule as saved.
  const [previewKey, setPreviewKey] = useState(0);

  const allDay = draft.openTime === draft.closeTime;
  const change = (patch: Partial<Settings>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setMessage(null);
  };

  async function save(next: Settings) {
    setBusy(true);
    const ok = await onSave(next);
    setBusy(false);
    if (ok) {
      setDraft(next);
      setPreviewKey((key) => key + 1);
    }
    setMessage(ok ? { ok: true, text: "تم الحفظ." } : { ok: false, text: "تعذر الحفظ. تأكد من القيم وحاول مرة أخرى." });
  }

  const minutes = (value: string, max: number) =>
    Math.min(max, Math.max(0, Math.round(Number(value) || 0)));

  return (
    <div className="mx-auto max-w-md space-y-5 pb-10">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white">استقبال الطلبات من الموقع</h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              أوقفه وقت الزحمة أو عند نفاد الأصناف. القائمة تبقى ظاهرة للزبائن.
            </p>
          </div>
          <Switch
            label="استقبال الطلبات"
            checked={settings.acceptingOrders}
            disabled={busy}
            onChange={(acceptingOrders) => save({ ...draft, acceptingOrders })}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-base font-bold text-white">ساعات العمل</h2>
        <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm text-zinc-200">
          <input
            type="checkbox"
            checked={allDay}
            onChange={(e) =>
              change(e.target.checked ? { openTime: "00:00", closeTime: "00:00" } : { openTime: "08:00", closeTime: "23:00" })
            }
            className="h-5 w-5 accent-amber-500"
          />
          مفتوح 24 ساعة
        </label>
        {!allDay && (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-zinc-300">
                يفتح
                <input type="time" value={draft.openTime} onChange={(e) => change({ openTime: e.target.value })} className={`${field} mt-1.5`} />
              </label>
              <label className="block text-xs font-semibold text-zinc-300">
                يقفل
                <input type="time" value={draft.closeTime} onChange={(e) => change({ closeTime: e.target.value })} className={`${field} mt-1.5`} />
              </label>
            </div>
            <p className="mt-2 text-xs text-zinc-500">لو وقت القفل قبل وقت الفتح، يعني المقهى يقفل بعد نص الليل.</p>
          </>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white">الإغلاق وقت الصلاة</h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              يتوقف استقبال الطلبات تلقائيًا عند كل صلاة من الخمس، حسب مواقيت طرابلس.
            </p>
          </div>
          <Switch
            label="الإغلاق وقت الصلاة"
            checked={draft.prayerBreaks}
            onChange={(prayerBreaks) => change({ prayerBreaks })}
          />
        </div>
        {draft.prayerBreaks && (
          <div className="mt-4 space-y-3">
            <label className="block text-xs font-semibold text-zinc-300">
              يقفل بعد الأذان بـ (دقيقة)
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={PRAYER_MINUTES_LIMIT.closeAfterAdhan}
                value={draft.closeAfterAdhan}
                onChange={(e) => change({ closeAfterAdhan: minutes(e.target.value, PRAYER_MINUTES_LIMIT.closeAfterAdhan) })}
                className={`${field} mt-1.5`}
              />
            </label>
            <label className="block text-xs font-semibold text-zinc-300">
              المغرب: يقفل قبل الأذان بـ (دقيقة)
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={PRAYER_MINUTES_LIMIT.maghribBefore}
                value={draft.maghribBefore}
                onChange={(e) => change({ maghribBefore: minutes(e.target.value, PRAYER_MINUTES_LIMIT.maghribBefore) })}
                className={`${field} mt-1.5`}
              />
            </label>
            <label className="block text-xs font-semibold text-zinc-300">
              يفتح بعد الأذان بـ (دقيقة)
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={PRAYER_MINUTES_LIMIT.after}
                value={draft.minutesAfter}
                onChange={(e) => change({ minutesAfter: minutes(e.target.value, PRAYER_MINUTES_LIMIT.after) })}
                className={`${field} mt-1.5`}
              />
            </label>
            {draft.minutesAfter <= draft.closeAfterAdhan && (
              <p role="alert" className="text-xs text-red-400">
                وقت الفتح لازم يكون بعد وقت القفل.
              </p>
            )}
          </div>
        )}
      </section>

      <button
        type="button"
        disabled={busy}
        onClick={() => save(draft)}
        className="w-full rounded-xl bg-amber-500 py-3 font-bold text-black transition duration-200 ease-brand hover:bg-amber-400 active:scale-[0.98] disabled:opacity-60"
      >
        حفظ الساعات وأوقات الصلاة
      </button>

      {message && (
        <p role="status" className={`text-center text-sm ${message.ok ? "text-emerald-400" : "text-red-400"}`}>
          {message.text}
        </p>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="mb-3 text-base font-bold text-white">كما يراها الزبون اليوم</h2>
        <PrayerSchedule key={previewKey} />
      </section>
    </div>
  );
}
