-- Quirky Home - Aurora PostgreSQL init schema
-- Covers: phone+otp auth, users, catalog, cart, wishlist, orders, inventory sync mapping.

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- =========================
-- USERS / AUTH
-- =========================
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  phone_e164 varchar(16) not null unique,
  full_name varchar(120),
  email citext unique,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  gender varchar(20),
  date_of_birth date,
  preferred_language varchar(20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  label varchar(40),
  recipient_name varchar(120) not null,
  phone_e164 varchar(16) not null,
  line1 varchar(180) not null,
  line2 varchar(180),
  landmark varchar(120),
  city varchar(100) not null,
  state varchar(100) not null,
  country varchar(60) not null default 'India',
  postal_code varchar(12) not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_user_addresses_user_id on user_addresses(user_id);

create table if not exists auth_otp_requests (
  id uuid primary key default gen_random_uuid(),
  phone_e164 varchar(16) not null,
  purpose varchar(30) not null default 'login',
  otp_hash text not null,
  attempts smallint not null default 0,
  max_attempts smallint not null default 5,
  is_verified boolean not null default false,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists idx_otp_phone_created on auth_otp_requests(phone_e164, created_at desc);
create index if not exists idx_otp_expires_at on auth_otp_requests(expires_at);

create table if not exists user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  device_id varchar(120),
  refresh_token_hash text not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists idx_sessions_user_id on user_sessions(user_id);
create index if not exists idx_sessions_expires_at on user_sessions(expires_at);

-- =========================
-- CATALOG
-- =========================
create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null unique,
  slug varchar(140) not null unique,
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  slug varchar(140) not null unique,
  parent_id uuid references categories(id) on delete set null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete set null,
  title varchar(220) not null,
  slug varchar(260) not null unique,
  short_description text,
  long_description text,
  rating_avg numeric(3,2) not null default 0,
  rating_count int not null default 0,
  is_active boolean not null default true,
  is_searchable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_category_map (
  product_id uuid not null references products(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  primary key (product_id, category_id)
);

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  sku varchar(80) not null unique,
  title varchar(180),
  attributes jsonb not null default '{}'::jsonb,
  mrp numeric(12,2) not null,
  sale_price numeric(12,2) not null,
  cost_price numeric(12,2),
  currency char(3) not null default 'INR',
  weight_grams int,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sale_price <= mrp)
);

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete set null,
  image_url text not null,
  alt_text varchar(220),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_product_images_product on product_images(product_id, sort_order);

-- =========================
-- INVENTORY
-- =========================
create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null unique references product_variants(id) on delete cascade,
  quantity_available int not null default 0,
  quantity_reserved int not null default 0,
  reorder_level int not null default 0,
  updated_at timestamptz not null default now(),
  check (quantity_available >= 0),
  check (quantity_reserved >= 0)
);

create table if not exists inventory_source_mapping (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null unique references product_variants(id) on delete cascade,
  source_system varchar(30) not null default 'dynamodb',
  source_table varchar(120) not null,
  source_pk varchar(180) not null,
  source_sk varchar(180),
  include_in_sync boolean not null default true,
  last_synced_at timestamptz,
  sync_status varchar(30) not null default 'pending',
  sync_error text
);
create index if not exists idx_inventory_sync_include on inventory_source_mapping(include_in_sync, sync_status);

create table if not exists inventory_sync_runs (
  id uuid primary key default gen_random_uuid(),
  run_type varchar(30) not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  status varchar(20) not null default 'running',
  processed_count int not null default 0,
  success_count int not null default 0,
  failed_count int not null default 0,
  details jsonb not null default '{}'::jsonb
);

-- =========================
-- CART / WISHLIST
-- =========================
create table if not exists wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists wishlist_items (
  wishlist_id uuid not null references wishlists(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (wishlist_id, product_id)
);

create table if not exists carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references users(id) on delete cascade,
  guest_token varchar(120) unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  variant_id uuid not null references product_variants(id),
  quantity int not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);
create index if not exists idx_cart_items_cart_id on cart_items(cart_id);

-- =========================
-- ORDERS / PAYMENTS
-- =========================
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number varchar(30) not null unique,
  user_id uuid references users(id) on delete set null,
  status varchar(30) not null default 'pending',
  payment_status varchar(30) not null default 'pending',
  currency char(3) not null default 'INR',
  subtotal numeric(12,2) not null,
  discount_total numeric(12,2) not null default 0,
  shipping_total numeric(12,2) not null default 0,
  tax_total numeric(12,2) not null default 0,
  grand_total numeric(12,2) not null,
  shipping_address jsonb not null,
  billing_address jsonb,
  placed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  variant_id uuid not null references product_variants(id),
  sku varchar(80) not null,
  title_snapshot varchar(220) not null,
  attributes_snapshot jsonb not null default '{}'::jsonb,
  unit_price numeric(12,2) not null,
  quantity int not null check (quantity > 0),
  line_total numeric(12,2) not null
);
create index if not exists idx_order_items_order_id on order_items(order_id);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  provider varchar(40) not null,
  provider_payment_id varchar(120),
  provider_order_id varchar(120),
  amount numeric(12,2) not null,
  status varchar(30) not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  status varchar(30) not null,
  note text,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);
