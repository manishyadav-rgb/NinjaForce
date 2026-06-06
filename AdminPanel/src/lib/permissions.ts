export type PermissionDefinition = {
  code: string;
  module: string;
  action: string;
  label: string;
  description: string;
  sortOrder: number;
};

export const PERMISSIONS: PermissionDefinition[] = [
  { code: "home.view", module: "home", action: "view", label: "View Home", description: "Can view the dashboard home page", sortOrder: 10 },
  { code: "orders.view", module: "orders", action: "view", label: "View Orders", description: "Can view order lists and order details", sortOrder: 100 },
  { code: "orders.edit", module: "orders", action: "edit", label: "Edit Orders", description: "Can update order details", sortOrder: 110 },
  { code: "orders.status.update", module: "orders", action: "status.update", label: "Update Order Status", description: "Can change order status", sortOrder: 120 },
  { code: "orders.cancel", module: "orders", action: "cancel", label: "Cancel Orders", description: "Can cancel orders", sortOrder: 130 },
  { code: "orders.invoice.download", module: "orders", action: "invoice.download", label: "Download Invoice", description: "Can download order invoices", sortOrder: 140 },
  { code: "products.view", module: "products", action: "view", label: "View Products", description: "Can view the product list", sortOrder: 200 },
  { code: "products.create", module: "products", action: "create", label: "Create Products", description: "Can add or import new products", sortOrder: 210 },
  { code: "products.edit", module: "products", action: "edit", label: "Edit Products", description: "Can update products", sortOrder: 220 },
  { code: "products.delete", module: "products", action: "delete", label: "Delete Products", description: "Can delete products", sortOrder: 230 },
  { code: "products.images.upload", module: "products", action: "images.upload", label: "Upload Product Images", description: "Can upload product images", sortOrder: 240 },
  { code: "products.inventory", module: "products", action: "inventory", label: "Manage Inventory", description: "Can update product stock quantities", sortOrder: 250 },
  { code: "variants.view", module: "variants", action: "view", label: "View Variants", description: "Can view product variants", sortOrder: 300 },
  { code: "variants.create", module: "variants", action: "create", label: "Create Variants", description: "Can add product variants", sortOrder: 310 },
  { code: "variants.edit", module: "variants", action: "edit", label: "Edit Variants", description: "Can update product variants", sortOrder: 320 },
  { code: "variants.delete", module: "variants", action: "delete", label: "Delete Variants", description: "Can delete product variants", sortOrder: 330 },
  { code: "collections.view", module: "collections", action: "view", label: "View Collections", description: "Can view collections", sortOrder: 400 },
  { code: "collections.create", module: "collections", action: "create", label: "Create Collections", description: "Can create collections", sortOrder: 410 },
  { code: "collections.edit", module: "collections", action: "edit", label: "Edit Collections", description: "Can update collections", sortOrder: 420 },
  { code: "collections.delete", module: "collections", action: "delete", label: "Delete Collections", description: "Can delete collections", sortOrder: 430 },
  { code: "categories.view", module: "categories", action: "view", label: "View Categories", description: "Can view categories", sortOrder: 500 },
  { code: "categories.create", module: "categories", action: "create", label: "Create Categories", description: "Can create categories", sortOrder: 510 },
  { code: "categories.edit", module: "categories", action: "edit", label: "Edit Categories", description: "Can update categories", sortOrder: 520 },
  { code: "categories.delete", module: "categories", action: "delete", label: "Delete Categories", description: "Can delete categories", sortOrder: 530 },
  { code: "customers.view", module: "customers", action: "view", label: "View Customers", description: "Can view customers", sortOrder: 600 },
  { code: "customers.edit", module: "customers", action: "edit", label: "Edit Customers", description: "Can update customer details", sortOrder: 610 },
  { code: "customers.delete", module: "customers", action: "delete", label: "Delete Customers", description: "Can delete customers", sortOrder: 620 },
  { code: "marketing.view", module: "marketing", action: "view", label: "View Marketing", description: "Can view marketing pages", sortOrder: 700 },
  { code: "marketing.manage", module: "marketing", action: "manage", label: "Manage Marketing", description: "Can manage marketing campaigns", sortOrder: 710 },
  { code: "discounts.view", module: "discounts", action: "view", label: "View Discounts", description: "Can view discounts", sortOrder: 800 },
  { code: "discounts.create", module: "discounts", action: "create", label: "Create Discounts", description: "Can create discounts", sortOrder: 810 },
  { code: "discounts.edit", module: "discounts", action: "edit", label: "Edit Discounts", description: "Can update discounts", sortOrder: 820 },
  { code: "discounts.delete", module: "discounts", action: "delete", label: "Delete Discounts", description: "Can delete discounts", sortOrder: 830 },
  { code: "content.view", module: "content", action: "view", label: "View Content", description: "Can view content", sortOrder: 900 },
  { code: "content.edit", module: "content", action: "edit", label: "Edit Content", description: "Can update content", sortOrder: 910 },
  { code: "markets.view", module: "markets", action: "view", label: "View Markets", description: "Can view markets", sortOrder: 1000 },
  { code: "markets.manage", module: "markets", action: "manage", label: "Manage Markets", description: "Can manage markets", sortOrder: 1010 },
  { code: "analytics.view", module: "analytics", action: "view", label: "View Analytics", description: "Can view analytics", sortOrder: 1100 },
  { code: "activity.view", module: "activity", action: "view", label: "View Activity Logs", description: "Can view employee activity logs", sortOrder: 1110 },
  { code: "online_store.view", module: "online_store", action: "view", label: "View Online Store", description: "Can view online store settings", sortOrder: 1200 },
  { code: "online_store.edit", module: "online_store", action: "edit", label: "Edit Online Store", description: "Can update online store settings", sortOrder: 1210 },
  { code: "app.view", module: "app", action: "view", label: "View App", description: "Can view app settings", sortOrder: 1300 },
  { code: "app.manage", module: "app", action: "manage", label: "Manage App", description: "Can manage app settings", sortOrder: 1310 },
  { code: "settings.view", module: "settings", action: "view", label: "View Settings", description: "Can view settings", sortOrder: 1400 },
  { code: "settings.edit", module: "settings", action: "edit", label: "Edit Settings", description: "Can update settings", sortOrder: 1410 },
  { code: "members.view", module: "members", action: "view", label: "View Members", description: "Can view team members", sortOrder: 1500 },
  { code: "members.create", module: "members", action: "create", label: "Create Members", description: "Can create team members", sortOrder: 1510 },
  { code: "members.edit", module: "members", action: "edit", label: "Edit Members", description: "Can update team members", sortOrder: 1520 },
  { code: "members.delete", module: "members", action: "delete", label: "Delete Members", description: "Can deactivate team members", sortOrder: 1530 },
  { code: "members.permissions.manage", module: "members", action: "permissions.manage", label: "Manage Member Permissions", description: "Can assign permissions to team members", sortOrder: 1540 },
];

export const ALL_PERMISSION_CODES = PERMISSIONS.map((permission) => permission.code);

export const PAGE_PERMISSION_MAP: Record<string, string> = {
  "/": "home.view",
  "/orders": "orders.view",
  "/products": "products.view",
  "/add-product": "products.create",
  "/variants": "variants.view",
  "/collections": "collections.view",
  "/categories": "categories.view",
  "/customers": "customers.view",
  "/marketing": "marketing.view",
  "/discounts": "discounts.view",
  "/content": "content.view",
  "/markets": "markets.view",
  "/analytics": "analytics.view",
  "/activity-logs": "activity.view",
  "/online-store": "online_store.view",
  "/app": "app.view",
  "/settings": "settings.view",
  "/users": "members.view",
};

export function permissionForPath(pathname: string) {
  if (pathname === "/") return PAGE_PERMISSION_MAP["/"];
  if (/^\/products\/[^/]+$/.test(pathname)) return "products.edit";
  if (/^\/collections\/[^/]+$/.test(pathname)) return "collections.edit";
  const match = Object.entries(PAGE_PERMISSION_MAP)
    .filter(([path]) => path !== "/" && (pathname === path || pathname.startsWith(`${path}/`)))
    .sort((a, b) => b[0].length - a[0].length)[0];
  return match?.[1] ?? "home.view";
}

export function hasPermission(role: string | undefined, permissions: string[] | undefined, code: string) {
  if (role === "admin") return true;
  return Boolean(permissions?.includes(code));
}
