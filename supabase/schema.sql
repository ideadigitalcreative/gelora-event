-- Schema database Event QR (Supabase)
-- Jalankan seluruh file ini di SQL Editor Supabase.
-- Disinkronkan dengan skema production per 2026-10-04.

create extension if not exists "pgcrypto";

-- ===================== TABEL =====================

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  date timestamptz,
  location text,
  quota integer,
  created_at timestamptz not null default now()
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  institution text,
  registration_number text not null unique,
  qr_token uuid not null unique default gen_random_uuid(),
  status text not null default 'registered' check (status in ('registered','checked_in')),
  registered_at timestamptz not null default now(),
  checked_in_at timestamptz,
  unique (event_id, phone)
);

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null unique references public.participants(id) on delete cascade,
  checked_in_at timestamptz not null default now()
);

create index if not exists idx_participants_event_id on public.participants(event_id);
create index if not exists idx_participants_qr_token on public.participants(qr_token);
create index if not exists idx_participants_status on public.participants(status);

-- ===================== RLS =====================

alter table public.events enable row level security;
alter table public.participants enable row level security;
alter table public.checkins enable row level security;

-- events: publik bisa baca; hanya authenticated yang boleh tulis.
drop policy if exists "events_public_read" on public.events;
create policy "events_public_read" on public.events for select using (true);
drop policy if exists "events_auth_insert" on public.events;
create policy "events_auth_insert" on public.events for insert with check (auth.role() = 'authenticated');
drop policy if exists "events_auth_update" on public.events;
create policy "events_auth_update" on public.events for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "events_auth_delete" on public.events;
create policy "events_auth_delete" on public.events for delete using (auth.role() = 'authenticated');

-- participants: publik bisa baca & daftar (anon insert); update oleh siapa saja
-- dibutuhkan oleh endpoint check-in (server-side token check tetap jadi penjaga).
drop policy if exists "participants_public_read" on public.participants;
create policy "participants_public_read" on public.participants for select using (true);
drop policy if exists "participants_anon_insert" on public.participants;
create policy "participants_anon_insert" on public.participants for insert with check (true);
drop policy if exists "participants_auth_update" on public.participants;
create policy "participants_auth_update" on public.participants for update using (true) with check (true);
drop policy if exists "participants_auth_delete" on public.participants;
create policy "participants_auth_delete" on public.participants for delete using (auth.role() = 'authenticated');

-- checkins
drop policy if exists "checkins_public_read" on public.checkins;
create policy "checkins_public_read" on public.checkins for select using (true);
drop policy if exists "checkins_anon_insert" on public.checkins;
create policy "checkins_anon_insert" on public.checkins for insert with check (true);

-- ===================== REALTIME =====================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'participants'
  ) then
    alter publication supabase_realtime add table public.participants;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'events'
  ) then
    alter publication supabase_realtime add table public.events;
  end if;
end $$;

-- ===================== ADMIN SEEDER =====================
-- Dipakai oleh halaman /setup, API /api/seed-admin, dan scripts/seed-admin.mjs.
-- Membuat akun admin pertama (bcrypt via pgcrypto). Terkunci otomatis setelah
-- ada minimal satu user di auth.users.

create extension if not exists pgcrypto;

create or replace function public.create_admin_user(
  p_email text,
  p_password text,
  p_full_name text default 'Admin Panitia'
)
returns jsonb
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user_id uuid;
  v_existing_id uuid;
  v_existing_email text;
  v_total_admins integer;
begin
  if p_email is null or length(trim(p_email)) = 0 then
    raise exception 'Email wajib diisi' using errcode = '22023';
  end if;
  if p_password is null or length(p_password) < 8 then
    raise exception 'Password minimal 8 karakter' using errcode = '22023';
  end if;

  v_existing_email := lower(trim(p_email));

  select id into v_existing_id from auth.users where email = v_existing_email;
  if v_existing_id is not null then
    return jsonb_build_object(
      'id', v_existing_id,
      'email', v_existing_email,
      'created', false
    );
  end if;

  select count(*) into v_total_admins from auth.users;
  if v_total_admins > 0 then
    raise exception 'Admin sudah ada, gunakan halaman login' using errcode = 'P0001';
  end if;

  v_user_id := gen_random_uuid();

  insert into auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_existing_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('full_name', p_full_name),
    now(), now(), '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
  )
  values (
    gen_random_uuid(),
    v_user_id,
    v_user_id::text,
    'email',
    jsonb_build_object('sub', v_user_id::text, 'email', v_existing_email, 'email_verified', true),
    now(), now(), now()
  );

  return jsonb_build_object(
    'id', v_user_id,
    'email', v_existing_email,
    'created', true
  );
end;
$$ language plpgsql;

create or replace function public.admin_count()
returns integer
language sql
security definer
set search_path = public, auth
stable
as $$
  select count(*)::integer from auth.users;
$$;

grant execute on function public.create_admin_user(text, text, text) to anon, authenticated;
grant execute on function public.admin_count() to anon, authenticated;
