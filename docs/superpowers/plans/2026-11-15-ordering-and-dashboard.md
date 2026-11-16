# Pickup Ordering, Café Dashboard and Product Photos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Customers order ahead for pickup and track status; the café runs orders and the menu from a signed-in dashboard backed by Supabase.

**Architecture:** The browser never reads or writes Supabase tables. Every read and write goes through Next.js route handlers that use the Supabase service key on the server; tables have RLS on with no policies. Order logic is written against a small `Store` interface with two implementations (Supabase, and an in-memory one used only outside production when Supabase is not configured) so it can be unit-tested and driven end to end before the owner connects Supabase. Live updates are a content-free Realtime broadcast "poke" that makes clients refetch, with polling underneath so nothing depends on it.

**Tech Stack:** Next.js 16.2.6 App Router, React 19, Tailwind 4, `@supabase/supabase-js`, `@supabase/ssr`, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-15-ordering-and-dashboard-design.md`

## Global Constraints

- Read the matching guide in `node_modules/next/dist/docs/` before writing code that touches a Next API (`AGENTS.md`). Route handler `params` is a Promise; `cookies()` is async.
- Vercel's filesystem is read-only: no writes to `src/data/menu.json` or `public/` outside `next dev`.
- The Supabase service key is read only in server code, never `NEXT_PUBLIC_*`, never committed.
- The menu must render when Supabase is missing or failing; only ordering and the dashboard may be unavailable.
- Customer phone numbers are returned only by `/api/admin/*` routes.
- Prices and names on an order come from the server's menu, never from the request.
- UI copy is Arabic, RTL, mobile first. Keep the black and gold palette and the motion tokens in `globals.css`.
- Payment is cash on pickup. No delivery, no customer accounts, no table ordering.
- Café timezone is `Africa/Tripoli`. Default hours `08:00`–`23:00`.

## Review Focus

1. **Two taps or a stale dashboard:** a status action on an order whose status already moved must be refused (409) and must not overwrite. Test in Task 2.
2. **Menu changed after the item went in the cart:** a hidden or removed item must reject the order naming the item; a changed price must be charged at the server price. Test in Task 2.
3. **Phone typed the way people type it:** `٠٩١٢٣٤٥٦٧٨`, `+218 91 234 5678`, `00218912345678`, `091-234-5678` all normalise to `0912345678`. Test in Task 1.
4. **Double submit on a slow connection:** the same `clientRef` sent twice returns the first order and creates one row. Test in Task 2.
5. **Supabase failing mid-session:** the tracking page keeps the last known status and says it could not refresh; the home page falls back to `menu.json`. Test in Task 3 (menu) and checked by hand in Task 6 (tracker).

---

### Task 1: Order domain rules

**Files:**
- Create: `vitest.config.ts`, `src/lib/orders/types.ts`, `src/lib/orders/phone.ts`, `src/lib/orders/hours.ts`, `src/lib/orders/status.ts`
- Test: `src/lib/orders/phone.test.ts`, `src/lib/orders/hours.test.ts`, `src/lib/orders/status.test.ts`
- Modify: `package.json` (add `vitest` dev dependency, `"test": "vitest run"`)

**Interfaces — Produces:**

```ts
// types.ts
export type OrderStatus = "new" | "preparing" | "ready" | "done" | "cancelled";
export type OrderLine = { id: string; nameAr: string; nameEn: string; price: number; qty: number };
export type Order = {
  id: string; number: number; token: string; clientRef: string;
  customerName: string; phone: string; pickupTime: string | null; note: string;
  status: OrderStatus; items: OrderLine[]; total: number; etaAt: string | null;
  createdAt: string; acceptedAt: string | null; readyAt: string | null;
  doneAt: string | null; cancelledAt: string | null;
};
export type PublicOrder = Omit<Order, "id" | "phone" | "clientRef">;
export type Settings = { acceptingOrders: boolean; openTime: string; closeTime: string };
export const DEFAULT_SETTINGS: Settings = { acceptingOrders: true, openTime: "08:00", closeTime: "23:00" };
export const LIMITS = { maxLines: 20, maxQtyPerLine: 20, maxActivePerPhone: 2, nameMin: 2, nameMax: 40, noteMax: 200, minLeadMinutes: 10 };
export const ETA_CHOICES = [5, 10, 15, 20] as const;

// phone.ts
export function normalizePhone(input: string): string | null; // "09XXXXXXXX" or null

// hours.ts
export function tripoliMinutes(now: Date): number;            // minutes since midnight in Africa/Tripoli
export function isOpen(settings: Settings, now: Date): boolean;
export function checkPickupTime(time: string, settings: Settings, now: Date): "ok" | "invalid" | "closed" | "too-soon";
export function pickupSlots(settings: Settings, now: Date): string[]; // "HH:MM" every 15 min, from now+minLead to close

// status.ts
export type StaffAction = "accept" | "ready" | "done" | "cancel";
export function applyAction(status: OrderStatus, action: StaffAction): OrderStatus | null; // null = not allowed
```

- [ ] **Step 1: Install Vitest and write the failing tests**

`phone.test.ts` asserts each Review Focus 3 input → `"0912345678"`; `"0812345678"`, `"091234567"`, `"abc"`, `""` → `null`; prefixes `091`–`095` accepted, `096` rejected.

`hours.test.ts` (default settings; `2026-11-15T10:00:00Z` is 12:00 Tripoli): `tripoliMinutes` → `720`; `isOpen` true at 12:00, false at `2026-11-15T22:30:00Z` (00:30); `checkPickupTime("12:05")` → `"too-soon"`, `"12:10"` → `"ok"`, `"23:30"` → `"closed"`, `"25:00"` and `"1230"` → `"invalid"`; `pickupSlots` first is `"12:15"`, last is `"23:00"`, and is `[]` when closed.

`status.test.ts`: `new`+`accept`→`preparing`; `preparing`+`ready`→`ready`; `ready`+`done`→`done`; `cancel` allowed from `new`, `preparing`, `ready`; every action from `done` and `cancelled` → `null`; `new`+`ready` → `null`.

- [ ] **Step 2: Run `npm test`** — expect failures for missing modules.
- [ ] **Step 3: Implement the four modules.** `normalizePhone` maps Arabic-Indic and Eastern Arabic digits to ASCII, strips non-digits, drops a leading `00218` or `218`, restores the leading `0`, then matches `/^09[1-5]\d{7}$/`. `tripoliMinutes` uses `Intl.DateTimeFormat` with `timeZone: "Africa/Tripoli"`.
- [ ] **Step 4: Run `npm test`** — expect all passing.
- [ ] **Step 5: Commit.**

### Task 2: Store, order service, schema

**Files:**
- Create: `src/lib/env.ts`, `src/lib/store/types.ts`, `src/lib/store/memory.ts`, `src/lib/store/supabase.ts`, `src/lib/store/index.ts`, `src/lib/orders/service.ts`, `supabase/schema.sql`
- Test: `src/lib/orders/service.test.ts`
- Modify: `package.json` (add `@supabase/supabase-js`, `@supabase/ssr`)

**Interfaces — Produces:**

```ts
// env.ts
export type Backend = "supabase" | "memory" | "none";
export function supabaseEnv(): { url: string; anonKey: string; serviceKey: string } | null;
// url: NEXT_PUBLIC_SUPABASE_URL ?? SUPABASE_URL
// anonKey: NEXT_PUBLIC_SUPABASE_ANON_KEY ?? NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
// serviceKey: SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_SECRET_KEY
export function backend(): Backend; // supabase if env complete; else memory when NODE_ENV !== "production"; else none

// store/types.ts
export interface Store {
  getDoc<T>(key: "menu" | "settings"): Promise<T | null>;
  setDoc(key: "menu" | "settings", value: unknown): Promise<void>;
  insertOrder(row: Omit<Order, "id" | "number">): Promise<Order>;      // returns existing row on clientRef conflict
  getOrderByToken(token: string): Promise<Order | null>;
  getOrderByClientRef(clientRef: string): Promise<Order | null>;
  updateOrderIfStatus(id: string, expect: OrderStatus, patch: Partial<Order>): Promise<Order | null>; // null if status differs
  listOrdersSince(iso: string): Promise<Order[]>;                      // newest first
  countActiveByPhone(phone: string): Promise<number>;                  // status in new/preparing/ready
  isStaffEmail(email: string): Promise<boolean>;
}
// store/index.ts
export function getStore(): Store | null; // null when backend() === "none"; memory instance lives on globalThis

// orders/service.ts
export type OrderError =
  | { code: "closed" } | { code: "paused" } | { code: "invalid"; field: "name" | "phone" | "pickup" | "items" | "note" }
  | { code: "unavailable"; itemIds: string[] } | { code: "too-many-active" };
export type CreateInput = { clientRef: string; name: string; phone: string; pickupTime: string | null; note?: string; items: { id: string; qty: number }[] };
export function createOrder(store: Store, menu: MenuData, input: CreateInput, now: Date): Promise<{ ok: true; order: Order } | { ok: false; error: OrderError }>;
export function actOnOrder(store: Store, id: string, from: OrderStatus, action: StaffAction, etaMinutes: number | undefined, now: Date): Promise<Order | "conflict" | "invalid">;
export function toPublic(order: Order): PublicOrder;
export function getSettings(store: Store): Promise<Settings>; // DEFAULT_SETTINGS merged with the stored doc
```

`MenuData` is `{ categories: MenuCategory[]; heroSlides: HeroSlide[] }`, exported from `src/data/menu.ts` in Task 3; declare it there now and import it.

- [ ] **Step 1: Write the failing tests** in `service.test.ts`, all against `new MemoryStore()` and a two-item fixture menu (`c1` 6 د.ل, `c2` 6 د.ل hidden):
  - creates an order: status `new`, `total` 18 for `c1`×3, token ≥ 20 chars, lines carry server `nameAr`/`price`.
  - a request-supplied price is ignored (pass extra `price: 0` on the item; total is still server price).
  - hidden `c2` and unknown `zz` → `{ code: "unavailable", itemIds: ["c2","zz"] }`.
  - qty 0, qty 21, 21 lines, empty items → `invalid` / `items`. Name `"ا"` → `invalid` / `name`. Phone `"123"` → `invalid` / `phone`.
  - `acceptingOrders: false` → `paused`; `now` at 00:30 Tripoli → `closed`; `pickupTime` 5 min ahead → `invalid` / `pickup`.
  - same `clientRef` twice → same `order.id`, `listOrdersSince` length 1.
  - third active order from one phone → `too-many-active`; allowed again after one is `done`.
  - `actOnOrder(new, "accept", 10)` → `preparing`, `etaAt` = now + 10 min, `acceptedAt` set; `accept` with `etaMinutes` 7 → `"invalid"`.
  - `actOnOrder` with `from: "new"` on an order already `preparing` → `"conflict"` and the order is unchanged.
  - `toPublic` has no `phone`, `id` or `clientRef` keys.
- [ ] **Step 2: Run `npm test`** — expect failures.
- [ ] **Step 3: Implement `env.ts`, `MemoryStore`, `service.ts`.** Token is `crypto.randomBytes(16).toString("base64url")`. Memory order numbers start at 1001.
- [ ] **Step 4: Run `npm test`** — expect all passing.
- [ ] **Step 5: Write `supabase/schema.sql` and `SupabaseStore`.** Tables: `app_state(key text primary key, value jsonb not null, updated_at timestamptz)`, `staff(email text primary key)`, `orders` with one snake_case column per `Order` field (`number bigint generated always as identity (start with 1001)`, `token` unique, `client_ref` unique, `items jsonb`, `status` checked against the five values), index on `(status, created_at desc)` and on `phone`. `alter table … enable row level security` on all three with no policies. A public storage bucket `menu`. The script must be safe to run twice. `SupabaseStore` builds one service-key client with `auth: { persistSession: false }` and maps snake_case rows to `Order`.
- [ ] **Step 6: Run `npx tsc --noEmit` and `npm test`.**
- [ ] **Step 7: Commit.**

### Task 3: Menu served from the store

**Files:**
- Create: `src/lib/menu/getMenu.ts`, `src/components/MenuContext.tsx`
- Test: `src/lib/menu/getMenu.test.ts`
- Modify: `src/data/menu.ts`, `src/app/page.tsx`, `src/app/api/menu/route.ts`, and every component importing `categories` / `heroSlides` / `totalMenuItems` from `@/data/menu` (`MenuApp`, `CategoryTabs`, `HeroCarousel`, `FeaturedCroissants`, `MenuSlides`)

**Interfaces:**
- Consumes: `getStore()`, `Store.getDoc("menu")`.
- Produces:

```ts
// data/menu.ts
export type HeroSlide = { image: string; titleAr: string; titleEn: string; price: number };
export type MenuData = { categories: MenuCategory[]; heroSlides: HeroSlide[] };
export const bundledMenu: MenuData; // menu.json
// lib/menu/getMenu.ts
export function getMenu(): Promise<MenuData>;        // stored doc, else bundledMenu; never throws
export function publicMenu(menu: MenuData): MenuData; // drops hidden items and then empty categories
// components/MenuContext.tsx
export function MenuProvider(props: { menu: MenuData; children: React.ReactNode }): JSX.Element;
export function useMenu(): MenuData;
```

- [ ] **Step 1: Write the failing tests:** `publicMenu` removes an item with `hidden: true` and a category left empty; `getMenu` returns `bundledMenu` when the store's `getDoc` rejects, and when it resolves `null`; returns the stored doc when present.
- [ ] **Step 2: Run `npm test`** — expect failures.
- [ ] **Step 3: Implement.** `page.tsx` becomes an async server component with `export const revalidate = 60` that renders `<MenuProvider menu={publicMenu(await getMenu())}>`. Components read `useMenu()` instead of the static import; the "7 أقسام" count is computed.
- [ ] **Step 4: `/api/menu`:** `GET` returns `getMenu()` (unfiltered, staff editor needs hidden items — gate it behind `requireStaff` once Task 4 lands; leave a failing-closed stub until then). `POST` is added in Task 7.
- [ ] **Step 5: Run `npm test`, `npx tsc --noEmit`, `npm run lint`; load `/` in `next dev` and confirm the menu renders as before.**
- [ ] **Step 6: Commit.**

### Task 4: Staff sign-in

**Files:**
- Create: `src/lib/auth.ts`, `src/app/api/admin/login/route.ts`, `src/app/api/admin/logout/route.ts`, `src/app/api/admin/me/route.ts`
- Modify: `src/app/api/menu/route.ts`

**Interfaces:**
- Consumes: `backend()`, `supabaseEnv()`, `Store.isStaffEmail`.
- Produces:

```ts
// lib/auth.ts
export function getStaff(): Promise<{ email: string } | null>;
export function requireStaff(): Promise<{ email: string } | Response>; // 401 JSON Response when not staff
export function signIn(email: string, password: string): Promise<"ok" | "bad-credentials" | "not-staff" | "unavailable">;
export function signOut(): Promise<void>;
```

- `supabase` backend: `@supabase/ssr` `createServerClient` with the anon key and `cookies()` `getAll`/`setAll`; `getStaff` calls `auth.getUser()` then `isStaffEmail`. A signed-in user who is not in `staff` is signed out and gets `not-staff`.
- `memory` backend: `signIn` succeeds only when `DEV_STAFF_PASSWORD` is set and equals the password (compare with `crypto.timingSafeEqual`); it sets an httpOnly `dev_staff` cookie. `MemoryStore.isStaffEmail` returns true.
- `none` backend: `signIn` → `unavailable`, `getStaff` → `null`.
- `/api/admin/me` → `{ staff: { email } | null, backend }`.

- [ ] **Step 1: Implement `auth.ts` and the three routes; gate `GET /api/menu` with `requireStaff`.**
- [ ] **Step 2: Verify in `next dev` with `DEV_STAFF_PASSWORD=test`:** `curl` `/api/admin/me` → `staff: null`; login with a wrong password → 401; with `test` → 200 and a cookie; `/api/admin/me` with the cookie → staff set; `/api/menu` without the cookie → 401; after logout → 401.
- [ ] **Step 3: `npx tsc --noEmit`, `npm run lint`, commit.**

### Task 5: Public order API and live poke

**Files:**
- Create: `src/app/api/ordering/route.ts`, `src/app/api/orders/route.ts`, `src/app/api/orders/[token]/route.ts`, `src/lib/realtime/poke.ts`, `src/lib/realtime/usePoke.ts`

**Interfaces:**
- Consumes: `createOrder`, `toPublic`, `getSettings`, `getMenu`, `getStore`, `pickupSlots`, `isOpen`.
- Produces:
  - `GET /api/ordering` → `{ state: "open" | "paused" | "closed" | "unavailable", openTime, closeTime, slots: string[] }`
  - `POST /api/orders` body `CreateInput` → `201 { token, number }` or `4xx { error: OrderError }` (`unavailable` backend → 503)
  - `GET /api/orders/[token]` → `200 { order: PublicOrder }` or 404; `Cache-Control: no-store`
  - `pokeOrders(token?: string): Promise<void>` — server; broadcasts event `changed` with an empty payload on channel `orders`, and on `order-<token>` when given; no-op off Supabase; never throws.
  - `usePoke(channels: string[], onPoke: () => void, pollMs: number): void` — client; subscribes with the anon client when `NEXT_PUBLIC_SUPABASE_URL` is set, and always calls `onPoke` every `pollMs` while the tab is visible and once on becoming visible.

- [ ] **Step 1: Implement the routes and both poke halves.** Reject bodies over 10 KB and non-JSON with 400. Check the installed `@supabase/supabase-js` types for the supported way to broadcast without subscribing before writing `pokeOrders`.
- [ ] **Step 2: Verify with `curl` against `next dev`:** `/api/ordering` → `open` with slots; a valid POST → 201 with token; GET by token → order without `phone`; an unknown token → 404; a hidden item → 409 with `itemIds`; a 20 KB body → 400.
- [ ] **Step 3: `npx tsc --noEmit`, `npm run lint`, commit.**

### Task 6: Customer cart, checkout and tracking

**Files:**
- Create: `src/components/cart/CartContext.tsx`, `src/components/cart/CartBar.tsx`, `src/components/cart/CheckoutSheet.tsx`, `src/components/cart/LastOrderBanner.tsx`, `src/app/order/[token]/page.tsx`, `src/components/order/OrderTracker.tsx`, `src/lib/orders/labels.ts`
- Modify: `src/components/MenuApp.tsx`, `src/components/MenuListRow.tsx`, `src/components/ItemDetailsModal.tsx`, `src/components/BottomNav.tsx`

**Interfaces:**
- Consumes: the Task 5 endpoints, `usePoke`, `useMenu`, `useDialog`, `formatPrice`.
- Produces:

```ts
// CartContext.tsx — persisted in localStorage "baryosha.cart.v1" as { [itemId]: qty }; unreadable JSON is discarded
export function useCart(): { lines: { item: MenuItem; qty: number }[]; count: number; total: number;
  add(id: string, qty?: number): void; setQty(id: string, qty: number): void; remove(id: string): void; clear(): void };
// labels.ts
export const STATUS_LABEL: Record<OrderStatus, string>; // تم استلام طلبك / قيد التجهيز / جاهز للاستلام / تم التسليم / ملغي
```

- Cart lines whose item is no longer in `useMenu()` are dropped on load. Qty is clamped to `1..LIMITS.maxQtyPerLine`.
- `MenuListRow` gets a separate `+` button (does not open the details sheet; shows the qty when in the cart). `ItemDetailsModal`'s existing add button calls `add(id, quantity)`.
- `CartBar` is fixed above `BottomNav` on mobile and bottom-start on desktop, visible when `count > 0`.
- `CheckoutSheet`: line list with steppers, name, phone (`inputMode="tel"`, `dir="ltr"`), pickup (`في أقرب وقت` or a slot from `/api/ordering`), note, total, "الدفع نقدًا عند الاستلام". Name and phone are remembered in `localStorage`. A `clientRef` (`crypto.randomUUID()`) is created when the sheet opens and reused on retry. Error handling by `OrderError.code`: `unavailable` removes those lines and names them; `paused` / `closed` / `too-many-active` / `invalid` show an Arabic message next to the relevant field; network failure keeps the form and offers retry. On success: clear the cart, store `{ token, number }` under `baryosha.lastOrder`, navigate to `/order/<token>`.
- `/order/[token]` server-renders the first state (404 page with a link home when unknown) and hands it to `OrderTracker`, which refetches through `usePoke(["order-<token>"], refetch, 8000)`. It shows the number, a four-step progress row, `etaAt` as a Tripoli clock time when `preparing`, the lines and total, the pickup time, and the café address and phone. A failed refetch keeps the last state and shows "تعذر التحديث، نحاول من جديد". Polling stops at `done` / `cancelled`.
- `LastOrderBanner` on the home page links to the stored order while its fetched status is not `done` / `cancelled`; it forgets the entry on 404 or a finished order.

- [ ] **Step 1: Implement cart context and wire the add buttons.**
- [ ] **Step 2: Implement `CartBar` and `CheckoutSheet`.**
- [ ] **Step 3: Implement the tracking page and banner.**
- [ ] **Step 4: Drive it with Playwright at 390×844 against `next dev`:** add two items, open checkout, submit with phone `٠٩١٢٣٤٥٦٧٨`, land on `/order/<token>` showing "تم استلام طلبك" and the right total; reload and confirm the state persists; go home and confirm the banner; submit with an empty name and confirm the inline error. Read the screenshots.
- [ ] **Step 5: `npx tsc --noEmit`, `npm run lint`, commit.**

### Task 7: Café dashboard

**Files:**
- Create: `src/app/api/admin/orders/route.ts`, `src/app/api/admin/orders/[id]/route.ts`, `src/app/api/admin/settings/route.ts`, `src/components/admin/LoginForm.tsx`, `src/components/admin/OrdersBoard.tsx`, `src/components/admin/OrderCard.tsx`, `src/components/admin/MenuEditor.tsx`, `src/components/admin/SettingsPanel.tsx`, `src/lib/admin/chime.ts`
- Modify: `src/app/admin/page.tsx`, `src/app/api/menu/route.ts`, `src/app/api/upload/route.ts`, `next.config.ts`

**Interfaces:**
- Consumes: `requireStaff`, `actOnOrder`, `getSettings`, `pokeOrders`, `usePoke`, `ETA_CHOICES`, `STATUS_LABEL`.
- Produces:
  - `GET /api/admin/orders` → `{ orders: Order[] }` — everything created since 00:00 Tripoli today plus any older order still `new` / `preparing` / `ready`.
  - `PATCH /api/admin/orders/[id]` body `{ from: OrderStatus, action: StaffAction, etaMinutes?: number }` → `200 { order }`, `409` on conflict, `400` on invalid; pokes `orders` and `order-<token>`.
  - `GET` / `PUT /api/admin/settings` → `Settings`; `PUT` validates `HH:MM` and `openTime < closeTime`.
  - `POST /api/menu` (staff) validates shape (categories array, every item has string `id`, `nameAr`, finite `price ≥ 0`), `setDoc("menu")`, `revalidatePath("/")`.
  - `POST /api/upload` (staff): `image/jpeg|png|webp` up to 5 MB; Supabase backend uploads to bucket `menu` and returns the public URL; memory backend keeps the current write to `public/images`; other backends 503.
  - `playChime(): void`, `chimeReady(): boolean`, `unlockChime(): void` — Web Audio, no asset file.

- `admin/page.tsx` becomes: load `/api/admin/me` → `LoginForm` (email + password, no password hint), or a shell with three tabs: الطلبات, المنتجات, الإعدادات, and a sign-out button. When `backend` is `none` it says Supabase is not connected.
- `OrdersBoard`: columns جديد / قيد التجهيز / جاهز (stacked on mobile) and a collapsed "منتهية اليوم". Refetches via `usePoke(["orders"], refetch, 10000)`. When the count of `new` orders rises it calls `playChime()` and sets `document.title` to `(n) طلب جديد`. If audio is locked it shows a "تفعيل صوت التنبيه" button.
- `OrderCard`: number, name, `tel:` link, pickup time, minutes since created, lines, note, total. Actions by status: `new` → the four ETA buttons (each accepts) and إلغاء; `preparing` → جاهز, إلغاء; `ready` → تم التسليم, إلغاء. إلغاء asks for confirmation. A 409 shows "تغيّرت حالة الطلب" and refetches.
- `SettingsPanel`: the accepting-orders switch and the two time inputs.
- `MenuEditor` is the current editor moved out of `page.tsx` unchanged in behaviour, saving through `POST /api/menu`.
- `next.config.ts`: add `images.remotePatterns` for `https://*.supabase.co/storage/v1/object/public/**`.

- [ ] **Step 1: Implement the admin API routes and harden `/api/menu` POST and `/api/upload`.**
- [ ] **Step 2: Verify with `curl`:** every `/api/admin/*` route, `POST /api/menu` and `POST /api/upload` return 401 without the staff cookie; with it, accept → ready → done works and a repeated accept returns 409; an `.svg` upload → 400.
- [ ] **Step 3: Implement the dashboard UI.**
- [ ] **Step 4: Drive it with Playwright, two contexts:** a customer places an order; the staff page (signed in) shows it under جديد within the poll interval; staff taps 10 دقائق; the customer page shows "قيد التجهيز" with a time; staff taps جاهز then تم التسليم; the customer page follows each step. Toggle accepting orders off and confirm checkout shows the paused message. Edit a price in المنتجات, save, and confirm the home page shows it after reload. Read the screenshots.
- [ ] **Step 5: `npx tsc --noEmit`, `npm run lint`, `npm test`, commit.**

### Task 8: Look and photos

**Files:**
- Create: `public/images/brioche-philadelphia-zaatar.jpg`, `public/images/brioche-nutella-almond.jpg`, `public/images/brioche-nutella-hazelnut.jpg`, plus one generated photo per remaining brioche item
- Modify: `src/data/menu.json`, `src/components/HeroCarousel.tsx`, `src/components/MenuCategorySection.tsx`, `src/components/MenuListRow.tsx`, `src/components/ItemDetailsModal.tsx`

- Hero: the dark gradient sits under the title, tagline and price. Cause: Embla's transformed container forms a stacking context, so the text's `z-20` never rises above the section-level `z-10` overlay. Put the gradient inside each slide, beneath the text.
- Category heading: gold title with icon, English name muted beside it, item count, and a thin gold rule — no full-width orange bar.
- Items without an image show a tile with the category icon (row and details sheet), not blank space or "لا توجد صورة".
- Photo assignment in `menu.json`: `c3` ← philadelphia-zaatar, `c2` ← nutella-almond, `c6` ← nutella-hazelnut. Source files are in the session's `images/` folder (`1.webp`, `3.webp`, `2.webp`); convert to JPEG, longest side 1200.
- `c1`, `c4`, `c5`, `c7`, `c8`, `c9`: generate one photo each with the owner's Higgsfield account, using the three supplied photos as style reference (round wood slab, pale marble, soft daylight, no brand packaging invented). Fillings from the printed menu: `c1` butter, honey, almond; `c4` Philadelphia, honey, cashew; `c5` hazelnut, butter, honey; `c7` pistachio, butter, honey; `c8` pistachio, Nutella, honey; `c9` the full one with everything. Check the balance first; if a generation fails or looks wrong, leave that item without an image.
- Non-brioche items that still point at a shared Unsplash photo keep it; they are out of scope.

- [ ] **Step 1: Hero fix, category heading, icon tile.** Screenshot mobile and desktop and read them.
- [ ] **Step 2: Add the three supplied photos and update `menu.json`.**
- [ ] **Step 3: Generate, review and add the six photos.**
- [ ] **Step 4: `npm run lint`, `npx tsc --noEmit`, commit.**

### Task 9: Owner setup guide and final verification

**Files:**
- Create: `docs/SETUP-SUPABASE.md` (Arabic), `.env.example`
- Modify: `README.md`

- The guide, in order: add Supabase to the `baryousha` Vercel project (or create a project and copy three variables into Vercel), paste `supabase/schema.sql` into the SQL editor, create the staff user under Authentication, add that email with `insert into staff (email) values ('…');`, redeploy, sign in at `/admin`. Include how to tell it worked.
- `.env.example` lists the variable names from `env.ts` and `DEV_STAFF_PASSWORD`, with no values.

- [ ] **Step 1: Write the guide, `.env.example`, and a short README section.**
- [ ] **Step 2: Run `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`** — all clean. Then start `next start` with no Supabase variables and confirm `/` renders the menu, `/api/ordering` says `unavailable`, checkout shows the unavailable message, and `/admin` says Supabase is not connected.
- [ ] **Step 3: Commit and push.**
