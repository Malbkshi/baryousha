"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Banknote, Loader2, X } from "lucide-react";
import { formatPrice } from "@/lib/formatPrice";
import { formatClock } from "@/lib/orders/labels";
import type { OrderingInfo } from "@/lib/orders/ordering-info";
import { closedText } from "../PrayerSchedule";
import { LIMITS } from "@/lib/orders/types";
import { useLocalStore } from "@/lib/localStore";
import { useDialog } from "@/lib/useDialog";
import { customerStore, lastOrderStore, useCart } from "./CartContext";
import { QtyStepper } from "./QtyStepper";

type Ordering = OrderingInfo;

type Field = "name" | "phone" | "pickup" | "items" | "note" | "form";
type Problem = { field: Field; message: string };

type ApiError =
  | { code: "invalid"; field: Exclude<Field, "form"> }
  | { code: "unavailable"; itemIds: string[] }
  | { code: "prayer"; label: string; reopensAt: string }
  | { code: "paused" | "closed" | "too-many-active" | "server" };

const FIELD_MESSAGE: Record<Exclude<Field, "form">, string> = {
  name: "اكتب اسمك، حرفين على الأقل.",
  phone: "اكتب رقم هاتف ليبي صحيح، مثل 0912345678.",
  pickup: "هذا الوقت لم يعد متاحًا. اختر وقتًا آخر.",
  items: "في مشكلة في السلة. راجع الأصناف والكميات.",
  note: `الملاحظة طويلة. الحد ${LIMITS.noteMax} حرف.`,
};

const RETRY_MESSAGE = "تعذر إرسال الطلب. تأكد من الإنترنت وحاول مرة أخرى.";

function closedMessage(ordering: Ordering): string {
  if (ordering.state === "paused") return "المقهى أوقف استقبال الطلبات مؤقتًا. حاول بعد قليل.";
  if (ordering.state === "unavailable") return "الطلب من الموقع غير متاح حاليًا. تقدر تطلب من المقهى مباشرة.";
  return `${closedText(ordering)}.`;
}

const UNAVAILABLE: Ordering = {
  state: "unavailable",
  label: null,
  reopensAt: null,
  openTime: "00:00",
  closeTime: "00:00",
  allDay: true,
  prayerBreaks: false,
  minutesBefore: 0,
  minutesAfter: 0,
  prayers: [],
  slots: [],
};

function newRef(): string {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function CheckoutSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <CheckoutPanel onClose={onClose} />;
}

function CheckoutPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const cart = useCart();
  const remembered = useLocalStore(customerStore);
  const { closing, requestClose, panelRef } = useDialog(true, onClose);

  const [ordering, setOrdering] = useState<Ordering | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [pickup, setPickup] = useState("asap");
  const [note, setNote] = useState("");
  const [problem, setProblem] = useState<Problem | null>(null);
  const [sending, setSending] = useState(false);

  // One reference per attempt at this order, so tapping twice or retrying
  // after a dropped connection cannot create a second order.
  const clientRef = useRef<string | null>(null);

  // Until the customer types, show what they entered last time.
  const nameValue = name ?? remembered.name;
  const phoneValue = phone ?? remembered.phone;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ordering", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: Ordering) => {
        if (!cancelled) setOrdering(data);
      })
      .catch(() => {
        if (!cancelled) {
          setOrdering((current) => (current ? { ...current, state: "unavailable", slots: [] } : UNAVAILABLE));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const canOrder = ordering?.state === "open";
  const empty = cart.lines.length === 0;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (sending || !canOrder || empty) return;

    setProblem(null);
    setSending(true);
    clientRef.current ??= newRef();

    let response: Response;
    try {
      response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientRef: clientRef.current,
          name: nameValue,
          phone: phoneValue,
          pickupTime: pickup === "asap" ? null : pickup,
          note,
          items: cart.lines.map((line) => ({ id: line.item.id, qty: line.qty })),
        }),
      });
    } catch {
      setSending(false);
      setProblem({ field: "form", message: RETRY_MESSAGE });
      return;
    }

    const data = (await response.json().catch(() => null)) as
      | { token?: string; number?: number; error?: ApiError }
      | null;

    if (response.ok && data?.token && typeof data.number === "number") {
      customerStore.set({ name: nameValue.trim(), phone: phoneValue.trim() });
      lastOrderStore.set({ token: data.token, number: data.number });
      cart.clear();
      router.push(`/order/${data.token}`);
      return;
    }

    setSending(false);
    const error = data?.error;

    if (error?.code === "invalid") {
      setProblem({ field: error.field, message: FIELD_MESSAGE[error.field] });
    } else if (error?.code === "unavailable") {
      const names = cart.lines
        .filter((line) => error.itemIds.includes(line.item.id))
        .map((line) => line.item.nameAr.trim());
      error.itemIds.forEach(cart.remove);
      setProblem({
        field: "items",
        message: names.length
          ? `لم تعد متوفرة وحذفناها من السلة: ${names.join("، ")}.`
          : "بعض الأصناف لم تعد متوفرة وحذفناها من السلة.",
      });
    } else if (error?.code === "prayer") {
      // Prayer time began while the form was open.
      const { label, reopensAt } = error;
      setOrdering((current) => (current ? { ...current, state: "prayer", label, reopensAt, slots: [] } : current));
    } else if (error?.code === "paused" || error?.code === "closed") {
      // The café's state changed while the form was open: show it as it is now.
      const state = error.code;
      setOrdering((current) => (current ? { ...current, state, slots: [] } : current));
    } else if (error?.code === "too-many-active") {
      setProblem({
        field: "phone",
        message: "عندك طلبات لم تُستلم بعد بهذا الرقم. استلمها أولًا ثم اطلب من جديد.",
      });
    } else {
      setProblem({ field: "form", message: RETRY_MESSAGE });
    }
  }

  const fieldError = (field: Field) =>
    problem?.field === field ? (
      <p role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs text-red-400">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {problem.message}
      </p>
    ) : null;

  const inputClass = (field: Field) =>
    `w-full rounded-xl border bg-white/5 px-4 py-3 text-base text-white outline-none transition-colors duration-200 ease-brand placeholder:text-zinc-600 focus:border-amber-500 ${
      problem?.field === field ? "border-red-500/70" : "border-white/10"
    }`;

  return (
    <div
      onClick={requestClose}
      role="dialog"
      aria-modal="true"
      aria-label="السلة وإتمام الطلب"
      className={`fixed inset-0 z-[100] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4 ${
        closing ? "motion-overlay-out" : "motion-overlay-in"
      }`}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-zinc-900 shadow-2xl outline-none sm:rounded-3xl ${
          closing ? "motion-panel-out" : "motion-panel-in"
        }`}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-bold text-white">سلتك</h2>
          <button
            type="button"
            onClick={requestClose}
            aria-label="إغلاق"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition duration-150 ease-brand hover:bg-white/20 active:scale-90"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col" noValidate>
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
            {empty ? (
              <p className="py-8 text-center text-sm text-zinc-400">
                السلة فارغة. أضف أصنافًا من القائمة.
              </p>
            ) : (
              <ul className="divide-y divide-white/5">
                {cart.lines.map(({ item, qty }) => (
                  <li key={item.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">{item.nameAr}</p>
                      <p className="text-xs text-zinc-500">
                        {formatPrice(item.price)} × {qty} = {formatPrice(item.price * qty)}
                      </p>
                    </div>
                    <QtyStepper
                      size="sm"
                      qty={qty}
                      label={item.nameAr}
                      onChange={(next) => cart.setQty(item.id, next)}
                    />
                  </li>
                ))}
              </ul>
            )}
            {fieldError("items")}

            {ordering && !canOrder && (
              <p
                role="status"
                className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                {closedMessage(ordering)}
              </p>
            )}

            {!empty && canOrder && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="order-name" className="mb-1.5 block text-xs font-semibold text-zinc-300">
                    الاسم
                  </label>
                  <input
                    id="order-name"
                    value={nameValue}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    maxLength={LIMITS.nameMax}
                    placeholder="اسمك عند الاستلام"
                    className={inputClass("name")}
                  />
                  {fieldError("name")}
                </div>

                <div>
                  <label htmlFor="order-phone" className="mb-1.5 block text-xs font-semibold text-zinc-300">
                    رقم الهاتف
                  </label>
                  <input
                    id="order-phone"
                    value={phoneValue}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    dir="ltr"
                    maxLength={20}
                    placeholder="091 234 5678"
                    className={`${inputClass("phone")} text-right`}
                  />
                  {fieldError("phone")}
                </div>

                <div>
                  <label htmlFor="order-pickup" className="mb-1.5 block text-xs font-semibold text-zinc-300">
                    وقت الاستلام
                  </label>
                  <select
                    id="order-pickup"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    className={`${inputClass("pickup")} appearance-none`}
                  >
                    <option value="asap" className="bg-zinc-900">
                      في أقرب وقت
                    </option>
                    {ordering.slots.map((slot) => (
                      <option key={slot} value={slot} className="bg-zinc-900">
                        اليوم {formatClock(slot)}
                      </option>
                    ))}
                  </select>
                  {fieldError("pickup")}
                </div>

                <div>
                  <label htmlFor="order-note" className="mb-1.5 block text-xs font-semibold text-zinc-300">
                    ملاحظة <span className="font-normal text-zinc-500">(اختياري)</span>
                  </label>
                  <textarea
                    id="order-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    maxLength={LIMITS.noteMax}
                    placeholder="مثال: بدون سكر"
                    className={`${inputClass("note")} resize-none`}
                  />
                  {fieldError("note")}
                </div>
              </div>
            )}
          </div>

          <footer className="border-t border-white/10 bg-zinc-950/60 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Banknote className="h-4 w-4 text-amber-500/80" />
                الدفع نقدًا عند الاستلام
              </span>
              <span className="text-lg font-black text-amber-400">{formatPrice(cart.total)}</span>
            </div>
            {fieldError("form")}
            <button
              type="submit"
              disabled={sending || empty || !canOrder}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 font-bold text-black shadow-lg shadow-amber-500/20 transition duration-200 ease-brand hover:bg-amber-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400 disabled:shadow-none disabled:active:scale-100"
            >
              {sending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  جارٍ إرسال الطلب
                </>
              ) : !ordering ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-label="جارٍ التحميل" />
              ) : (
                "أرسل الطلب"
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
