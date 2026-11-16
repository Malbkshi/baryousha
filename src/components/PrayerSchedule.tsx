"use client";

import { Clock, MoonStar } from "lucide-react";
import { formatClock, formatInstant, minutesText, prayerNowText } from "@/lib/orders/labels";
import type { OrderingInfo } from "@/lib/orders/ordering-info";
import { useOrderingInfo } from "@/lib/useOrderingInfo";

export function hoursText(info: OrderingInfo): string {
  return info.allDay
    ? "مفتوح 24 ساعة"
    : `من ${formatClock(info.openTime)} إلى ${formatClock(info.closeTime)}`;
}

/** One line for the café's state right now, or null while it is simply open. */
export function closedText(info: OrderingInfo): string | null {
  switch (info.state) {
    case "prayer":
      return `${prayerNowText(info.label!)}. نفتح الساعة ${formatInstant(info.reopensAt!)}`;
    case "closed":
      return `مغلق الآن. ساعات العمل ${hoursText(info)}`;
    case "paused":
      return "الطلب من الموقع متوقف مؤقتًا";
    default:
      return null;
  }
}

/** Opening hours and today's prayer closures. */
export function PrayerSchedule({ compact = false }: { compact?: boolean }) {
  const { info } = useOrderingInfo();

  if (!info) {
    return <p className="text-xs text-zinc-500">جارٍ تحميل أوقات العمل</p>;
  }

  // The server says which closure is on; match it by when it ends.
  const current =
    info.state === "prayer" ? info.prayers.find((p) => p.until === info.reopensAt) : undefined;
  const closed = closedText(info);

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <div>
          <h4 className="text-sm font-bold text-zinc-200">ساعات العمل</h4>
          <p className="mt-0.5 text-xs text-zinc-400">{hoursText(info)}</p>
          {info.prayerBreaks && (
            <p className="mt-0.5 text-xs text-zinc-500">
              يغلق بعد كل أذان بـ{minutesText(info.closeAfterAdhan)} (المغرب: قبل الأذان بـ
              {minutesText(info.maghribBefore)})، ويفتح بعد الأذان بـ{minutesText(info.minutesAfter)}
            </p>
          )}
        </div>
      </div>

      {closed ? (
        <p role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200">
          {closed}
        </p>
      ) : (
        <p role="status" className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
          مفتوح الآن
        </p>
      )}

      <div>
        <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-zinc-300">
          <MoonStar className="h-3.5 w-3.5 text-amber-500" />
          أوقات الصلاة اليوم · طرابلس
        </h4>
        <ul className={compact ? "grid grid-cols-5 gap-1 text-center" : "space-y-1"}>
          {info.prayers.map((p) => {
            const active = p === current;
            return compact ? (
              <li
                key={p.prayer}
                className={`rounded-lg px-1 py-1.5 ${active ? "bg-amber-500 text-black" : "bg-black/30 text-zinc-300"}`}
              >
                <span className="block text-[11px] font-bold">{p.label}</span>
                <span className="block text-[11px]">{formatInstant(p.at).replace(/ [صم]$/, "")}</span>
              </li>
            ) : (
              <li
                key={p.prayer}
                className={`flex items-baseline justify-between gap-2 rounded-lg px-2 py-1 text-xs ${
                  active ? "bg-amber-500/15 text-amber-200" : "text-zinc-300"
                }`}
              >
                <span className="font-semibold">{p.label}</span>
                <span className="text-left">
                  {formatInstant(p.at)}
                  {p.from && p.until && (
                    <span className="block text-[10px] text-zinc-500">
                      مغلق {formatInstant(p.from)} – {formatInstant(p.until)}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** A notice at the top of the menu while ordering is closed. Hidden while open. */
export function ClosedBanner() {
  const { info } = useOrderingInfo();
  if (!info) return null;

  // Prayer time gets its own, larger announcement.
  if (info.state === "prayer") {
    return (
      <div
        role="status"
        className="motion-overlay-in mx-4 mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-5 text-center"
      >
        <MoonStar className="mx-auto h-7 w-7 text-amber-400" />
        <p className="mt-2 text-xl font-black text-amber-100">{prayerNowText(info.label!)}</p>
        <p className="mt-1 text-sm font-semibold text-amber-200">
          نفتح الساعة {formatInstant(info.reopensAt!)}
        </p>
        <p className="mt-2 text-xs text-zinc-400">تقدر تتصفح القائمة وتجهّز سلتك لين نفتح.</p>
      </div>
    );
  }

  const text = closedText(info);
  if (!text) return null;
  return (
    <p
      role="status"
      className="motion-overlay-in mx-4 mt-4 flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-100"
    >
      <MoonStar className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
      {text}. تقدر تتصفح القائمة وتجهّز سلتك.
    </p>
  );
}
