-- ═══════════════════════════════════════════════════════
-- IGNEA WELLNESS STUDIO — Schema SQL para Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- VENTAS (registro de ventas/pagos)
-- ─────────────────────────────────────────────
create table if not exists ventas (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  cliente_nombre      text not null,
  servicio            text not null,
  es_paquete          boolean not null default false,
  monto               numeric(10,2) not null,
  moneda              text not null default 'MXN',
  metodo_pago         text not null,
  notas               text,
  calendly_event_uuid text,
  user_id             uuid references auth.users(id) on delete cascade not null
);

create index if not exists ventas_created_at_idx on ventas(created_at desc);
create index if not exists ventas_user_id_idx on ventas(user_id);

-- ─────────────────────────────────────────────
-- CALENDLY_CACHE (citas sincronizadas)
-- ─────────────────────────────────────────────
create table if not exists calendly_cache (
  calendly_uuid     text primary key,
  start_time        timestamptz not null,
  end_time          timestamptz not null,
  status            text not null,
  invitee_name      text,
  invitee_email     text,
  event_type_name   text,
  location          text,
  raw_payload       jsonb,
  synced_at         timestamptz not null default now()
);

create index if not exists calendly_cache_start_time_idx on calendly_cache(start_time);
create index if not exists calendly_cache_status_idx on calendly_cache(status);

-- ─────────────────────────────────────────────
-- PRODUCTOS (inventario / resurtido)
-- ─────────────────────────────────────────────
create table if not exists productos (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  marca           text not null,
  nombre          text not null,
  stock_actual    int not null default 0,
  stock_minimo    int not null default 1,
  unidad          text not null default 'unidad',
  pedir           boolean not null default false,
  notas           text
);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
alter table ventas enable row level security;
alter table calendly_cache enable row level security;
alter table productos enable row level security;

-- Ventas: solo el dueño ve/modifica sus ventas
create policy "owner_ventas" on ventas
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Calendly cache y productos: cualquier usuario autenticado
create policy "auth_calendly" on calendly_cache
  for all
  using (auth.role() = 'authenticated');

create policy "auth_productos" on productos
  for all
  using (auth.role() = 'authenticated');
