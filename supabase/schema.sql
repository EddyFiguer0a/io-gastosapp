-- =========================================================
-- IO GASTOS: SISTEMA DE GESTIÓN FINANCIERA PERSONAL
-- Script SQL de Migración para Supabase (RLS, Triggers & Estructura)
-- =========================================================

-- Habilitar extensión para UUIDs
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------
-- 1. TABLA DE PERFILES (Vinculada a auth.users)
-- ---------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- ---------------------------------------------------------
-- 2. PERIODOS O PRESUPUESTOS MENSUALES
-- ---------------------------------------------------------
create table if not exists public.presupuestos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null default auth.uid(),
  mes smallint not null check (mes between 1 and 12),
  anio int not null check (anio >= 2000),
  nombre text not null, -- ej. "Septiembre 2026"
  cerrado boolean default false,
  created_at timestamp with time zone default now()
);

-- ---------------------------------------------------------
-- 3. CUENTAS (Efectivo, Banco Monetario, Ahorro, Tarjeta de Crédito)
-- ---------------------------------------------------------
create table if not exists public.cuentas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null default auth.uid(),
  nombre text not null, -- ej. "Cuenta Monetaria Principal", "Efectivo"
  tipo text not null check (tipo in ('Efectivo', 'Monetario', 'Ahorro', 'Tarjeta_Credito', 'Mesada')),
  saldo_actual numeric(12,2) default 0.00,
  color_tag text default 'emerald',
  icono text default 'Wallet',
  created_at timestamp with time zone default now()
);

-- ---------------------------------------------------------
-- 4. INGRESOS (Salarios, Honorarios, Entradas al Presupuesto)
-- ---------------------------------------------------------
create table if not exists public.ingresos (
  id uuid primary key default uuid_generate_v4(),
  presupuesto_id uuid references public.presupuestos(id) on delete cascade not null,
  user_id uuid references auth.users not null default auth.uid(),
  cuenta_id uuid references public.cuentas(id) on delete restrict,
  fuente text not null,
  descripcion text,
  monto_esperado numeric(12,2) default 0.00 check (monto_esperado >= 0),
  monto_recibido numeric(12,2) default 0.00 check (monto_recibido >= 0),
  created_at timestamp with time zone default now()
);

-- ---------------------------------------------------------
-- 5. CATEGORÍAS DE GASTO (Presupuestado vs Real)
-- ---------------------------------------------------------
create table if not exists public.categorias (
  id uuid primary key default uuid_generate_v4(),
  presupuesto_id uuid references public.presupuestos(id) on delete cascade not null,
  user_id uuid references auth.users not null default auth.uid(),
  nombre text not null,
  icono text default 'Tag',
  descripcion text,
  presupuestado numeric(12,2) default 0.00 check (presupuestado >= 0),
  es_fijo boolean default false,
  created_at timestamp with time zone default now()
);

-- Si la tabla ya existía de versiones previas, asegurar que tenga la columna es_fijo
alter table public.categorias add column if not exists es_fijo boolean default false;

-- ---------------------------------------------------------
-- 6. TRANSACCIONES (Gastos Reales Registrados)
-- ---------------------------------------------------------
create table if not exists public.transacciones (
  id uuid primary key default uuid_generate_v4(),
  categoria_id uuid references public.categorias(id) on delete cascade not null,
  user_id uuid references auth.users not null default auth.uid(),
  cuenta_id uuid references public.cuentas(id) on delete restrict,
  concepto text not null,
  monto numeric(12,2) not null check (monto > 0),
  fecha date default current_date,
  metodo_pago text default 'Efectivo',
  created_at timestamp with time zone default now()
);

-- ---------------------------------------------------------
-- 7. TRANSFERENCIAS (Movimientos Entre Cuentas)
-- ---------------------------------------------------------
create table if not exists public.transferencias (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null default auth.uid(),
  cuenta_origen_id uuid references public.cuentas(id) on delete restrict not null,
  cuenta_destino_id uuid references public.cuentas(id) on delete restrict not null,
  monto numeric(12,2) not null check (monto > 0),
  fecha date default current_date,
  concepto text,
  created_at timestamp with time zone default now()
);

-- ---------------------------------------------------------
-- 8. METAS DE AHORRO
-- ---------------------------------------------------------
create table if not exists public.metas_ahorro (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null default auth.uid(),
  titulo text not null,
  precio_objetivo numeric(12,2) not null check (precio_objetivo >= 0),
  meta_mensual numeric(12,2) default 0.00 check (meta_mensual >= 0),
  monto_acumulado numeric(12,2) default 0.00 check (monto_acumulado >= 0),
  fecha_limite date,
  color_tag text default 'emerald',
  created_at timestamp with time zone default now()
);

-- ---------------------------------------------------------
-- TRIGGER POSTGRESQL: AUTO-CREAR PERFIL EN REGISTRO DE USUARIO
-- ---------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------
-- ÍNDICES DE RENDIMIENTO
-- ---------------------------------------------------------
create index if not exists idx_presupuestos_user_periodo on public.presupuestos(user_id, anio desc, mes desc);
create index if not exists idx_ingresos_presupuesto on public.ingresos(presupuesto_id);
create index if not exists idx_categorias_presupuesto on public.categorias(presupuesto_id);
create index if not exists idx_transacciones_categoria on public.transacciones(categoria_id);
create index if not exists idx_transacciones_user_fecha on public.transacciones(user_id, fecha desc);
create index if not exists idx_metas_user on public.metas_ahorro(user_id);
create index if not exists idx_transferencias_user on public.transferencias(user_id);

-- ---------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- ---------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.presupuestos enable row level security;
alter table public.ingresos enable row level security;
alter table public.categorias enable row level security;
alter table public.transacciones enable row level security;
alter table public.metas_ahorro enable row level security;
alter table public.cuentas enable row level security;
alter table public.transferencias enable row level security;

-- Políticas de RLS Idempotentes
drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users manage own presupuestos" on public.presupuestos;
create policy "Users manage own presupuestos" on public.presupuestos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own ingresos" on public.ingresos;
create policy "Users manage own ingresos" on public.ingresos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own categorias" on public.categorias;
create policy "Users manage own categorias" on public.categorias for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own transacciones" on public.transacciones;
create policy "Users manage own transacciones" on public.transacciones for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own metas" on public.metas_ahorro;
create policy "Users manage own metas" on public.metas_ahorro for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own cuentas" on public.cuentas;
create policy "Users manage own cuentas" on public.cuentas for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own transferencias" on public.transferencias;
create policy "Users manage own transferencias" on public.transferencias for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------
-- SEGURIDAD & PERMISOS: ROLES ANON Y AUTHENTICATED
-- ---------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

grant usage on schema public to anon, authenticated;
grant all privileges on all tables in schema public to authenticated;
grant all privileges on all sequences in schema public to authenticated;
