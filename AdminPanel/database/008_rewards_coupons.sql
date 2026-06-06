create table if not exists customer_reward_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  order_id uuid references customer_orders(id) on delete set null,
  type varchar(20) not null check (type in ('earn', 'redeem', 'adjust')),
  coins integer not null,
  note text,
  coupon_code varchar(60),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, order_id, type)
);

alter table customer_reward_transactions add column if not exists coupon_code varchar(60);
alter table customer_reward_transactions add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table discount_coupons add column if not exists user_id uuid references users(id) on delete cascade;
alter table discount_coupons add column if not exists source varchar(40) not null default 'manual';
alter table discount_coupons add column if not exists is_single_use boolean not null default false;
alter table discount_coupons add column if not exists used_at timestamptz;
alter table discount_coupons add column if not exists used_order_id uuid references customer_orders(id) on delete set null;

create index if not exists idx_customer_rewards_user_created on customer_reward_transactions(user_id, created_at desc);
create index if not exists idx_discount_coupons_user_source on discount_coupons(user_id, source);
create index if not exists idx_discount_coupons_single_use on discount_coupons(site_id, code, is_single_use, used_at);
