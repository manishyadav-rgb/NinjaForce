-- QuirkyHome - Team/Admin users table
-- Run on NeonDB after 001_init_schema.sql

create table if not exists team_users (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  password_hash text not null,
  full_name varchar(120) not null,
  role varchar(20) not null default 'team' check (role in ('admin', 'team')),
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Flat products table used by storefront (already exists from import)
-- This is a simplified version for the import pipeline
create table if not exists store_products (
  id uuid primary key default gen_random_uuid(),
  title varchar(220) not null,
  slug varchar(260) not null unique,
  sku varchar(80),
  collection varchar(120),
  category varchar(120),
  short_description text,
  sale_price numeric(12,2),
  mrp numeric(12,2),
  quantity_available int default 0,
  image_url text,
  is_active boolean not null default true,
  source_pk varchar(180),
  source_sk varchar(180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Customer carts (server-side, linked to user)
create table if not exists customer_carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  guest_token varchar(120) unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_customer_carts_user on customer_carts(user_id);

create table if not exists customer_cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references customer_carts(id) on delete cascade,
  product_slug varchar(260) not null,
  product_title varchar(220) not null,
  product_image text,
  unit_price numeric(12,2) not null,
  mrp numeric(12,2),
  quantity int not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, product_slug)
);
create index if not exists idx_customer_cart_items_cart on customer_cart_items(cart_id);

-- Customer orders
create table if not exists customer_orders (
  id uuid primary key default gen_random_uuid(),
  order_number varchar(30) not null unique,
  user_id uuid references users(id) on delete set null,
  status varchar(30) not null default 'pending',
  payment_status varchar(30) not null default 'pending',
  subtotal numeric(12,2) not null default 0,
  shipping_total numeric(12,2) not null default 0,
  grand_total numeric(12,2) not null default 0,
  shipping_name varchar(120),
  shipping_phone varchar(20),
  shipping_address text,
  shipping_city varchar(100),
  shipping_state varchar(100),
  shipping_pincode varchar(10),
  notes text,
  placed_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_customer_orders_user on customer_orders(user_id);

create table if not exists customer_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references customer_orders(id) on delete cascade,
  product_slug varchar(260) not null,
  product_title varchar(220) not null,
  product_image text,
  unit_price numeric(12,2) not null,
  quantity int not null check (quantity > 0),
  line_total numeric(12,2) not null
);
create index if not exists idx_customer_order_items_order on customer_order_items(order_id);

-- Insert default admin user (password: admin123)
-- Hash = sha256("random-salt:admin123") 
insert into team_users (email, password_hash, full_name, role) 
values ('admin@quirkyhome.in', 'default_salt:' || encode(sha256(convert_to('default_salt:admin123', 'UTF8')), 'hex'), 'Admin', 'admin')
on conflict (email) do nothing;
