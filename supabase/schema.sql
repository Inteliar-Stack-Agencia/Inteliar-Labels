-- Inteliar Labels - Schema SQL
-- Ejecutar en Supabase → SQL Editor

-- Tabla de organizaciones
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references auth.users(id) on delete cascade not null,
  plan text not null default 'starter' check (plan in ('starter', 'pro', 'enterprise')),
  created_at timestamptz default now()
);

-- Tabla de plantillas de etiquetas
create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  org_id uuid references organizations(id) on delete set null,
  name text not null,
  description text,
  width_mm numeric not null default 100,
  height_mm numeric not null default 50,
  canvas_data jsonb,
  variables text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla de trabajos de impresión
create table if not exists print_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  template_id uuid references templates(id) on delete set null,
  name text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  total_labels int not null default 0,
  printed_labels int not null default 0,
  source_file text,
  printer_name text,
  error_message text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Tabla de impresoras
create table if not exists printers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  model text,
  connection_type text not null default 'usb' check (connection_type in ('usb', 'tcp', 'windows')),
  ip_address text,
  port int default 9100,
  is_default boolean default false,
  created_at timestamptz default now()
);

-- Row Level Security
alter table organizations enable row level security;
alter table templates enable row level security;
alter table print_jobs enable row level security;
alter table printers enable row level security;

-- Políticas: cada usuario ve solo sus datos
create policy "users_own_orgs" on organizations
  for all using (owner_id = auth.uid());

create policy "users_own_templates" on templates
  for all using (user_id = auth.uid());

create policy "users_own_jobs" on print_jobs
  for all using (user_id = auth.uid());

create policy "users_own_printers" on printers
  for all using (user_id = auth.uid());

-- Filas de datos del Excel por job
create table if not exists print_job_rows (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references print_jobs(id) on delete cascade not null,
  row_index int not null,
  row_data jsonb not null,
  quantity int not null default 1
);

alter table print_job_rows enable row level security;

create policy "users_own_job_rows" on print_job_rows
  for all using (
    job_id in (select id from print_jobs where user_id = auth.uid())
  );

-- Trigger para updated_at en templates
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger templates_updated_at
  before update on templates
  for each row execute function update_updated_at();
