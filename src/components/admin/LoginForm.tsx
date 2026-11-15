"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { unlockChime } from "@/lib/admin/chime";

const MESSAGE: Record<string, string> = {
  "bad-credentials": "الإيميل أو كلمة المرور غير صحيحة.",
  "not-staff": "هذا الحساب غير مضاف كموظف في المقهى.",
  unavailable: "تسجيل الدخول غير متاح الآن. تأكد من ربط Supabase.",
};

export function LoginForm({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    unlockChime();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json().catch(() => null)) as { result?: string } | null;
      if (response.ok && data?.result === "ok") {
        onSignedIn();
        return;
      }
      setError(MESSAGE[data?.result ?? ""] ?? "تعذر تسجيل الدخول. حاول مرة أخرى.");
    } catch {
      setError("تعذر الاتصال. تأكد من الإنترنت وحاول مرة أخرى.");
    }
    setBusy(false);
  }

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none transition-colors duration-200 ease-brand placeholder:text-zinc-600 focus:border-amber-500";

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/50 p-8 shadow-xl backdrop-blur-md"
      >
        <h1 className="mb-1 text-center text-2xl font-bold text-amber-500">لوحة البريوشة</h1>
        <p className="mb-6 text-center text-sm text-zinc-500">دخول موظفي المقهى</p>

        <label htmlFor="staff-email" className="mb-1.5 block text-xs font-semibold text-zinc-300">
          الإيميل
        </label>
        <input
          id="staff-email"
          type="email"
          dir="ltr"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${inputClass} mb-4`}
        />

        <label htmlFor="staff-password" className="mb-1.5 block text-xs font-semibold text-zinc-300">
          كلمة المرور
        </label>
        <input
          id="staff-password"
          type="password"
          dir="ltr"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`${inputClass} mb-4`}
        />

        {error && (
          <p role="alert" className="mb-4 text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 font-bold text-black transition duration-200 ease-brand hover:bg-amber-400 active:scale-[0.98] disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          دخول
        </button>
      </form>
    </div>
  );
}
