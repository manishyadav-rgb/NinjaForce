create table if not exists permissions (
  id uuid primary key default gen_random_uuid(),
  code varchar(120) not null unique,
  module varchar(60) not null,
  action varchar(60) not null,
  label varchar(120) not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists team_user_permissions (
  team_user_id uuid not null references team_users(id) on delete cascade,
  permission_code varchar(120) not null references permissions(code) on delete cascade,
  granted_by uuid references team_users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (team_user_id, permission_code)
);

alter table team_users add column if not exists permissions_locked boolean not null default false;

create index if not exists idx_permissions_module on permissions(module);
create index if not exists idx_team_user_permissions_user on team_user_permissions(team_user_id);

insert into permissions (code, module, action, label, description, sort_order) values
('home.view', 'home', 'view', 'View Home', 'Can view the dashboard home page', 10),
('orders.view', 'orders', 'view', 'View Orders', 'Can view order lists and order details', 100),
('orders.edit', 'orders', 'edit', 'Edit Orders', 'Can update order details', 110),
('orders.status.update', 'orders', 'status.update', 'Update Order Status', 'Can change order status', 120),
('orders.cancel', 'orders', 'cancel', 'Cancel Orders', 'Can cancel orders', 130),
('orders.invoice.download', 'orders', 'invoice.download', 'Download Invoice', 'Can download order invoices', 140),
('products.view', 'products', 'view', 'View Products', 'Can view the product list', 200),
('products.create', 'products', 'create', 'Create Products', 'Can add or import new products', 210),
('products.edit', 'products', 'edit', 'Edit Products', 'Can update products', 220),
('products.delete', 'products', 'delete', 'Delete Products', 'Can delete products', 230),
('products.images.upload', 'products', 'images.upload', 'Upload Product Images', 'Can upload product images', 240),
('products.inventory', 'products', 'inventory', 'Manage Inventory', 'Can update product stock quantities', 250),
('variants.view', 'variants', 'view', 'View Variants', 'Can view product variants', 300),
('variants.create', 'variants', 'create', 'Create Variants', 'Can add product variants', 310),
('variants.edit', 'variants', 'edit', 'Edit Variants', 'Can update product variants', 320),
('variants.delete', 'variants', 'delete', 'Delete Variants', 'Can delete product variants', 330),
('collections.view', 'collections', 'view', 'View Collections', 'Can view collections', 400),
('collections.create', 'collections', 'create', 'Create Collections', 'Can create collections', 410),
('collections.edit', 'collections', 'edit', 'Edit Collections', 'Can update collections', 420),
('collections.delete', 'collections', 'delete', 'Delete Collections', 'Can delete collections', 430),
('categories.view', 'categories', 'view', 'View Categories', 'Can view categories', 500),
('categories.create', 'categories', 'create', 'Create Categories', 'Can create categories', 510),
('categories.edit', 'categories', 'edit', 'Edit Categories', 'Can update categories', 520),
('categories.delete', 'categories', 'delete', 'Delete Categories', 'Can delete categories', 530),
('customers.view', 'customers', 'view', 'View Customers', 'Can view customers', 600),
('customers.edit', 'customers', 'edit', 'Edit Customers', 'Can update customer details', 610),
('customers.delete', 'customers', 'delete', 'Delete Customers', 'Can delete customers', 620),
('marketing.view', 'marketing', 'view', 'View Marketing', 'Can view marketing pages', 700),
('marketing.manage', 'marketing', 'manage', 'Manage Marketing', 'Can manage marketing campaigns', 710),
('discounts.view', 'discounts', 'view', 'View Discounts', 'Can view discounts', 800),
('discounts.create', 'discounts', 'create', 'Create Discounts', 'Can create discounts', 810),
('discounts.edit', 'discounts', 'edit', 'Edit Discounts', 'Can update discounts', 820),
('discounts.delete', 'discounts', 'delete', 'Delete Discounts', 'Can delete discounts', 830),
('content.view', 'content', 'view', 'View Content', 'Can view content', 900),
('content.edit', 'content', 'edit', 'Edit Content', 'Can update content', 910),
('markets.view', 'markets', 'view', 'View Markets', 'Can view markets', 1000),
('markets.manage', 'markets', 'manage', 'Manage Markets', 'Can manage markets', 1010),
('analytics.view', 'analytics', 'view', 'View Analytics', 'Can view analytics', 1100),
('activity.view', 'activity', 'view', 'View Activity Logs', 'Can view employee activity logs', 1110),
('online_store.view', 'online_store', 'view', 'View Online Store', 'Can view online store settings', 1200),
('online_store.edit', 'online_store', 'edit', 'Edit Online Store', 'Can update online store settings', 1210),
('app.view', 'app', 'view', 'View App', 'Can view app settings', 1300),
('app.manage', 'app', 'manage', 'Manage App', 'Can manage app settings', 1310),
('settings.view', 'settings', 'view', 'View Settings', 'Can view settings', 1400),
('settings.edit', 'settings', 'edit', 'Edit Settings', 'Can update settings', 1410),
('members.view', 'members', 'view', 'View Members', 'Can view team members', 1500),
('members.create', 'members', 'create', 'Create Members', 'Can create team members', 1510),
('members.edit', 'members', 'edit', 'Edit Members', 'Can update team members', 1520),
('members.delete', 'members', 'delete', 'Delete Members', 'Can deactivate team members', 1530),
('members.permissions.manage', 'members', 'permissions.manage', 'Manage Member Permissions', 'Can assign permissions to team members', 1540)
on conflict (code) do update set
  module = excluded.module,
  action = excluded.action,
  label = excluded.label,
  description = excluded.description,
  sort_order = excluded.sort_order;
