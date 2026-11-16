-- مقهى البريوشة — جداول الموقع
-- الصق هذا الملف كله في Supabase > SQL Editor واضغط Run.
-- آمن للتشغيل أكثر من مرة.

-- القائمة والإعدادات، كل واحدة مستند JSON واحد.
create table if not exists public.app_state (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- إيميلات الموظفين المسموح لهم بدخول لوحة المقهى.
create table if not exists public.staff (
  email text primary key
);

create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  number        bigint generated always as identity (start with 1001),
  token         text not null unique,
  client_ref    text not null unique,
  customer_name text not null,
  phone         text not null,
  pickup_time   text,
  note          text not null default '',
  status        text not null default 'new'
                check (status in ('new', 'preparing', 'ready', 'done', 'cancelled')),
  items         jsonb not null,
  total         numeric not null,
  eta_at        timestamptz,
  created_at    timestamptz not null default now(),
  accepted_at   timestamptz,
  ready_at      timestamptz,
  done_at       timestamptz,
  cancelled_at  timestamptz
);

create index if not exists orders_status_created_idx on public.orders (status, created_at desc);
create index if not exists orders_phone_idx on public.orders (phone);

-- الجداول مقفولة تمامًا على المتصفح: الحماية مفعّلة ومن غير أي سياسة.
-- الموقع يقرأ ويكتب من السيرفر فقط بالمفتاح السري.
alter table public.app_state enable row level security;
alter table public.staff     enable row level security;
alter table public.orders    enable row level security;

-- مخزن صور المنتجات. القراءة عامة، والرفع من السيرفر فقط.
insert into storage.buckets (id, name, public)
values ('menu', 'menu', true)
on conflict (id) do update set public = true;
