-- Fresh database only. No MongoDB data or credentials are migrated.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated, service_role;

-- Default privileges are deliberately closed, including future RPCs.
alter default privileges in schema public revoke all on tables from anon, authenticated;
-- EXECUTE for PUBLIC is a global default; a per-schema revoke cannot remove it.
alter default privileges revoke execute on functions from public, anon, authenticated;
-- Supabase may also install per-schema grants for API roles. Remove both layers.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges in schema private revoke all on tables from public, anon, authenticated;
alter default privileges in schema private revoke execute on functions from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (name = btrim(name) and length(name) between 1 and 120),
  phone text not null default '' check (length(phone) <= 32),
  -- Profile images have no active uploader/UI. Keep empty until an allowlisted flow exists.
  profile_image_url text not null default '' check (profile_image_url = ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.user_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'subadmin', 'admin')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table private.user_permissions (
  user_id uuid not null references private.user_access(user_id) on delete cascade,
  permission text not null check (permission in
    ('manage_properties', 'manage_categories', 'manage_users', 'view_inquiries')),
  primary key (user_id, permission)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z][A-Z0-9_]{1,63}$'),
  name text not null check (name = btrim(name) and length(name) between 1 and 120),
  description text not null default '' check (length(description) <= 2000),
  icon text not null default '' check (length(icon) <= 100),
  parent_id uuid references public.categories(id) on delete restrict,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (parent_id is distinct from id)
);
create unique index categories_name_key on public.categories (lower(name));
create index categories_parent_idx on public.categories(parent_id);

create table public.property_subtypes (
  code text primary key,
  property_type text not null check (property_type in ('BUY', 'RENT', 'COMMERCIAL')),
  category_id uuid not null references public.categories(id) on delete restrict,
  label text not null,
  active boolean not null default true,
  unique (code, property_type, category_id)
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  property_id text not null unique check (property_id ~ '^DEL-(NP|RS|REN|CB|CL)-[0-9]{3,}$'),
  property_type text not null check (property_type in ('BUY', 'RENT', 'COMMERCIAL')),
  category_id uuid not null references public.categories(id) on delete restrict,
  subtype_code text not null,
  title text not null check (title = btrim(title) and length(title) between 3 and 200),
  description text not null check (length(btrim(description)) between 1 and 20000),
  price numeric(16,2) not null check (price > 0 and price < 'Infinity'::numeric),
  area numeric(14,4) not null check (area > 0 and area < 'Infinity'::numeric),
  area_unit text not null default 'sq_ft' check (area_unit in ('sq_ft','sq_m','sq_yards','acres')),
  plot_area numeric(14,4) check (plot_area > 0 and plot_area < 'Infinity'::numeric),
  bedrooms integer not null default 0 check (bedrooms between 0 and 100),
  bathrooms integer not null default 0 check (bathrooms between 0 and 100),
  address text not null check (length(btrim(address)) between 1 and 500),
  city text not null check (length(btrim(city)) between 1 and 120),
  state text not null check (length(btrim(state)) between 1 and 120),
  locality text check (length(locality) <= 200),
  landmark text check (length(landmark) <= 500),
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  listing_phone text not null check (listing_phone ~ '^[0-9]{10,15}$'),
  furnishing_status text check (furnishing_status in ('UNFURNISHED','SEMI_FURNISHED','FULLY_FURNISHED')),
  property_age numeric(7,2) check (property_age between 0 and 1000),
  amenities text[] not null default '{}' check (cardinality(amenities) <= 50 and array_position(amenities, null) is null),
  facilities text[] not null default '{}' check (cardinality(facilities) <= 50 and array_position(facilities, null) is null and not ('bank' = any(facilities))),
  furnishing_items text[] not null default '{}' check (cardinality(furnishing_items) <= 50 and array_position(furnishing_items, null) is null),
  outdoor_features text[] not null default '{}' check (cardinality(outdoor_features) <= 50 and array_position(outdoor_features, null) is null),
  featured boolean not null default false,
  status text not null default 'available' check (status in ('available','sold','rented')),
  posted_by uuid references auth.users(id) on delete set null,
  views bigint not null default 0 check (views >= 0),
  version bigint not null default 1 check (version >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (subtype_code, property_type, category_id)
    references public.property_subtypes(code, property_type, category_id) on delete restrict,
  check ((latitude is null) = (longitude is null))
);
create index properties_status_created_idx on public.properties(status, created_at desc, id desc);
create index properties_classification_idx on public.properties(property_type, category_id, subtype_code, status, created_at desc, id desc);
create index properties_featured_idx on public.properties(created_at desc, id desc) where featured and status = 'available';
create index properties_price_idx on public.properties(price);
create index properties_area_idx on public.properties(area);
create index properties_author_idx on public.properties(posted_by);

-- JSON columns are closed to browser writes. Field-specific validation belongs to
-- the transactional save RPC before any property writer is exposed.
create table public.property_details (
  property_id uuid primary key references public.properties(id) on delete cascade,
  schema_version integer not null default 1 check (schema_version = 1),
  resale_info jsonb not null default '{}' check (jsonb_typeof(resale_info) = 'object' and octet_length(resale_info::text) <= 16000),
  rental_info jsonb not null default '{}' check (jsonb_typeof(rental_info) = 'object' and octet_length(rental_info::text) <= 16000),
  commercial_details jsonb not null default '{}' check (jsonb_typeof(commercial_details) = 'object' and octet_length(commercial_details::text) <= 24000),
  new_project_info jsonb not null default '{}' check (jsonb_typeof(new_project_info) = 'object' and octet_length(new_project_info::text) <= 16000),
  project_pricing jsonb not null default '{}' check (jsonb_typeof(project_pricing) = 'object' and octet_length(project_pricing::text) <= 16000)
);
create table public.property_units (
  property_id uuid not null references public.properties(id) on delete cascade,
  unit_code text not null check (unit_code in ('bhk2','bhk3','bhk4')),
  super_built_up_area numeric(14,4) not null check (super_built_up_area > 0 and super_built_up_area < 'Infinity'::numeric),
  carpet_area numeric(14,4) not null check (carpet_area > 0 and carpet_area < super_built_up_area),
  land_area numeric(14,4) check (land_area > 0 and land_area < 'Infinity'::numeric),
  price numeric(16,2) not null check (price > 0 and price < 'Infinity'::numeric),
  primary key (property_id, unit_code)
);
create table public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  object_key text not null unique check (object_key ~ '^properties/[a-zA-Z0-9/-]+\.(png|jpg|jpeg|gif|webp|avif)$'),
  sort_order integer not null check (sort_order >= 0 and sort_order < 20),
  mime_type text not null check (mime_type in ('image/png','image/jpeg','image/gif','image/webp','image/avif')),
  byte_size integer not null check (byte_size between 1 and 5242880),
  width integer not null check (width between 1 and 12000),
  height integer not null check (height between 1 and 12000),
  checksum text not null check (checksum ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  unique (property_id, sort_order) deferrable initially immediate,
  check (width::bigint * height <= 40000000)
);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 120),
  email text not null check (length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  phone text not null default '' check (phone = '' or phone ~ '^[0-9+ ()-]{7,32}$'),
  message text not null check (length(btrim(message)) between 1 and 5000),
  property_id uuid references public.properties(id) on delete set null,
  property_display_id text,
  property_title text,
  status text not null default 'new' check (status in ('new','read','replied')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index inquiries_status_created_idx on public.inquiries(status, created_at desc, id desc);
create index inquiries_property_idx on public.inquiries(property_id);
create table public.wishlists (
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, property_id)
);
create index wishlists_property_idx on public.wishlists(property_id);

create table private.property_counters (
  namespace text primary key check (namespace in ('NP','RS','REN','CB','CL')),
  last_value bigint not null check (last_value > 0)
);
create table private.uploads (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete cascade,
  create_session_id uuid,
  property_id uuid references public.properties(id) on delete cascade,
  pending_key text not null unique check (pending_key like 'pending/%'),
  final_key text unique check (final_key like 'properties/%'),
  state text not null default 'pending' check (state in ('pending','validated','attached','rejected')),
  declared_mime text not null check (declared_mime in ('image/png','image/jpeg','image/gif','image/webp','image/avif')),
  declared_size integer not null check (declared_size between 1 and 5242880),
  checksum text check (checksum ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (property_id is not null or create_session_id is not null),
  check (state not in ('validated','attached') or final_key is not null)
);
create index uploads_expiry_idx on private.uploads(expires_at) where state <> 'attached';
create index uploads_actor_idx on private.uploads(actor_id);
create index uploads_property_idx on private.uploads(property_id);
create table private.deletion_jobs (
  id uuid primary key default gen_random_uuid(),
  object_key text not null unique,
  state text not null default 'pending' check (state in ('pending','processing','done','failed')),
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  last_error_code text,
  created_at timestamptz not null default now()
);
create index deletion_jobs_due_idx on private.deletion_jobs(next_attempt_at) where state in ('pending','failed');
create table private.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  operation text not null,
  target_id uuid,
  summary jsonb not null default '{}' check (jsonb_typeof(summary) = 'object'),
  created_at timestamptz not null default now()
);
create table private.rate_limit_buckets (
  bucket_key text not null,
  window_start timestamptz not null,
  hits integer not null check (hits > 0),
  expires_at timestamptz not null,
  primary key(bucket_key, window_start)
);
create table private.idempotency_requests (
  actor_key text not null,
  operation text not null,
  request_key uuid not null,
  request_digest text not null,
  result_id uuid,
  created_at timestamptz not null default now(),
  primary key(actor_key, operation, request_key)
);

create function private.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
do $$
declare table_name text;
begin
  foreach table_name in array array['public.profiles','private.user_access','public.categories','public.properties','public.inquiries'] loop
    execute format('create trigger set_updated_at before update on %s for each row execute function private.set_updated_at()', table_name);
  end loop;
end;
$$;

create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, name, phone) values (
    new.id,
    left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'name'), ''), 'New user'), 120),
    left(coalesce(new.raw_user_meta_data ->> 'phone', ''), 32)
  );
  -- Signup metadata cannot choose a role, permissions or active state.
  insert into private.user_access(user_id) values (new.id);
  return new;
end;
$$;
create trigger dealinee_profile_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- Atomic allocation is internal only; the future save transaction calls it.
create function private.allocate_property_id(namespace text) returns text
language plpgsql security definer set search_path = '' as $$
declare allocated bigint;
begin
  insert into private.property_counters(namespace, last_value) values (namespace, 1)
  on conflict on constraint property_counters_pkey do update
    set last_value = private.property_counters.last_value + 1
  returning last_value into allocated;
  -- lpad truncates long values: only use it below 1000.
  return 'DEL-' || namespace || '-' || case when allocated < 1000 then lpad(allocated::text, 3, '0') else allocated::text end;
end;
$$;

-- Keep cleanup durable even when a trusted future writer cascades a deletion.
create function private.queue_image_deletion() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into private.deletion_jobs(object_key) values (old.object_key) on conflict(object_key) do nothing;
  return old;
end;
$$;
create trigger image_delete_outbox after delete on public.property_images
  for each row execute function private.queue_image_deletion();

-- Deleting an account/property can cascade upload reservations too. Preserve
-- cleanup work for pending and validated-but-unattached objects before that
-- metadata disappears. Never queue a final key still attached to a listing.
create function private.queue_upload_deletion() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into private.deletion_jobs(object_key) values(old.pending_key) on conflict(object_key) do nothing;
  if old.final_key is not null and not exists(
    select 1 from public.property_images where object_key = old.final_key
  ) then
    insert into private.deletion_jobs(object_key) values(old.final_key) on conflict(object_key) do nothing;
  end if;
  return old;
end;
$$;
create trigger upload_delete_outbox after delete on private.uploads
  for each row execute function private.queue_upload_deletion();

create function private.snapshot_inquiry_property() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.property_id is not null then
    select p.property_id, p.title into strict new.property_display_id, new.property_title
      from public.properties p where p.id = new.property_id;
  else
    new.property_display_id := null;
    new.property_title := null;
  end if;
  return new;
end;
$$;
create trigger inquiry_property_snapshot before insert on public.inquiries
  for each row execute function private.snapshot_inquiry_property();
