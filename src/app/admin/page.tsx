"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardList, LogOut, Settings as SettingsIcon, UtensilsCrossed } from "lucide-react";
import { LoginForm } from "@/components/admin/LoginForm";
import { MenuEditor } from "@/components/admin/MenuEditor";
import { OrdersBoard } from "@/components/admin/OrdersBoard";
import { SettingsPanel } from "@/components/admin/SettingsPanel";
import type { Settings } from "@/lib/orders/types";

type Session = { staff: { email: string } | null; backend: "supabase" | "memory" | "none" };
type Tab = "orders" | "menu" | "settings";

const TABS: { id: Tab; label: string; icon: typeof ClipboardList }[] = [
  { id: "orders", label: "الطلبات", icon: ClipboardList },
  { id: "menu", label: "المنتجات", icon: UtensilsCrossed },
  { id: "settings", label: "الإعدادات", icon: SettingsIcon },
];

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [tab, setTab] = useState<Tab>("orders");
  const [settings, setSettings] = useState<Settings | null>(null);

  const loadSession = useCallback(
    () =>
      fetch("/api/admin/me", { cache: "no-store" })
        .then((response) => response.json())
        .then((data: Session) => setSession(data))
        .catch(() => setSession({ staff: null, backend: "none" })),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: Session) => {
        if (!cancelled) setSession(data);
      })
      .catch(() => {
        if (!cancelled) setSession({ staff: null, backend: "none" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signedIn = Boolean(session?.staff);

  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: Settings | null) => {
        if (!cancelled && data) setSettings(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  const signedOut = useCallback(() => {
    setSettings(null);
    setSession((current) => (current ? { ...current, staff: null } : current));
  }, []);

  const saveSettings = useCallback(
    async (next: Settings): Promise<boolean> => {
      try {
        const response = await fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        });
        if (response.status === 401) {
          signedOut();
          return false;
        }
        if (!response.ok) return false;
        setSettings((await response.json()) as Settings);
        return true;
      } catch {
        return false;
      }
    },
    [signedOut],
  );

  const toggleAccepting = useCallback(
    (acceptingOrders: boolean) => {
      if (settings) void saveSettings({ ...settings, acceptingOrders });
    },
    [settings, saveSettings],
  );

  async function signOut() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    signedOut();
  }

  if (!session) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">جارٍ التحميل</div>;
  }

  if (session.backend === "none") {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="text-xl font-bold text-amber-500">لوحة البريوشة</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">
          قاعدة البيانات غير مربوطة بعد. اربط Supabase بالموقع حسب الدليل في
          <span dir="ltr" className="mx-1 font-mono text-xs text-zinc-400">docs/SETUP-SUPABASE.md</span>
          ثم ارجع لهذه الصفحة.
        </p>
      </div>
    );
  }

  if (!session.staff) return <LoginForm onSignedIn={loadSession} />;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <h1 className="text-lg font-bold text-amber-500">لوحة البريوشة</h1>
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition duration-200 ease-brand hover:border-white/30 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            خروج
          </button>
        </div>
        <nav aria-label="أقسام اللوحة" className="mx-auto flex max-w-6xl gap-1 px-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={tab === id ? "page" : undefined}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors duration-200 ease-brand ${
                tab === id
                  ? "border-amber-500 text-amber-400"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl p-4">
        {tab === "orders" && (
          <OrdersBoard settings={settings} onToggleAccepting={toggleAccepting} onSignedOut={signedOut} />
        )}
        {tab === "menu" && <MenuEditor onSignedOut={signedOut} />}
        {tab === "settings" &&
          (settings ? (
            <SettingsPanel key={`${settings.openTime}-${settings.closeTime}`} settings={settings} onSave={saveSettings} />
          ) : (
            <p className="py-16 text-center text-sm text-zinc-500">جارٍ تحميل الإعدادات</p>
          ))}
      </main>
    </div>
  );
}
