import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/activity-log";
import { query } from "@/lib/db";

type CouponRow = {
  id: string;
  site_id: string;
  code: string;
  discount_type: "percent" | "flat";
  discount_value: string;
  min_order_amount: string | null;
  max_discount_amount: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  user_id: string | null;
  source: string;
  is_single_use: boolean;
  used_at: string | null;
  created_at: string;
};

async function ensureCouponsTable() {
  await query(`
    create table if not exists discount_coupons (
      id uuid primary key default gen_random_uuid(),
      site_id varchar(80) not null default 'quirkyhome',
      code varchar(60) not null,
      discount_type varchar(20) not null check (discount_type in ('percent', 'flat')),
      discount_value numeric(12,2) not null,
      min_order_amount numeric(12,2),
      max_discount_amount numeric(12,2),
      starts_at timestamptz,
      ends_at timestamptz,
      is_active boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (site_id, code)
    )
  `);
  await query("alter table discount_coupons add column if not exists user_id uuid references users(id) on delete cascade");
  await query("alter table discount_coupons add column if not exists source varchar(40) not null default 'manual'");
  await query("alter table discount_coupons add column if not exists is_single_use boolean not null default false");
  await query("alter table discount_coupons add column if not exists used_at timestamptz");
  await query("alter table discount_coupons add column if not exists used_order_id uuid references customer_orders(id) on delete set null");
}

export async function GET(request: NextRequest) {
  const guard = await requirePermission(request, "discounts.view");
  if (guard.response) return guard.response;

  try {
    await ensureCouponsTable();
    const { searchParams } = new URL(request.url);
    const siteId = (searchParams.get("site_id") || "quirkyhome").trim();
    const result = await query<CouponRow>(
      `select id, site_id, code, discount_type, discount_value::text, min_order_amount::text,
              max_discount_amount::text, starts_at::text, ends_at::text, is_active,
              user_id::text, source, is_single_use, used_at::text, created_at::text
       from discount_coupons
       where site_id = $1
       order by created_at desc`,
      [siteId],
    );
    return NextResponse.json({ coupons: result.rows });
  } catch (error) {
    console.error("GET /api/admin/discounts error:", error);
    return NextResponse.json({ error: "Failed to fetch discounts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await requirePermission(request, "discounts.create");
  if (guard.response) return guard.response;

  try {
    await ensureCouponsTable();
    const body = await request.json();
    const siteId = String(body.site_id || "quirkyhome").trim();
    const code = String(body.code || "").trim().toUpperCase();
    const discountType = body.discount_type === "flat" ? "flat" : "percent";
    const discountValue = Number(body.discount_value);
    const minOrderAmount = body.min_order_amount == null || body.min_order_amount === "" ? null : Number(body.min_order_amount);
    const maxDiscountAmount = body.max_discount_amount == null || body.max_discount_amount === "" ? null : Number(body.max_discount_amount);
    const startsAt = body.starts_at ? new Date(body.starts_at).toISOString() : null;
    const endsAt = body.ends_at ? new Date(body.ends_at).toISOString() : null;
    const isActive = body.is_active !== false;

    if (!code) return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      return NextResponse.json({ error: "Discount value must be greater than 0" }, { status: 400 });
    }

    await query(
      `insert into discount_coupons
       (site_id, code, discount_type, discount_value, min_order_amount, max_discount_amount, starts_at, ends_at, is_active, source, is_single_use, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'manual',false, now())
       on conflict (site_id, code) do update set
         discount_type = excluded.discount_type,
         discount_value = excluded.discount_value,
         min_order_amount = excluded.min_order_amount,
         max_discount_amount = excluded.max_discount_amount,
         starts_at = excluded.starts_at,
         ends_at = excluded.ends_at,
         is_active = excluded.is_active,
         source = coalesce(discount_coupons.source, 'manual'),
         updated_at = now()`,
      [siteId, code, discountType, discountValue, minOrderAmount, maxDiscountAmount, startsAt, endsAt, isActive],
    );

    await logAdminActivity(request, {
      id: guard.user!.id,
      email: guard.user!.email,
      fullName: guard.user!.full_name,
      role: guard.user!.role,
    }, {
      module: "discounts",
      action: "save",
      entityType: "coupon",
      entityId: code,
      entityLabel: code,
      message: `Saved coupon ${code}.`,
      metadata: { siteId, discountType, discountValue, isActive },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/admin/discounts error:", error);
    return NextResponse.json({ error: "Failed to save discount" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const guard = await requirePermission(request, "discounts.delete");
  if (guard.response) return guard.response;

  try {
    await ensureCouponsTable();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Coupon id is required" }, { status: 400 });
    const couponResult = await query<{ code: string }>("select code from discount_coupons where id = $1 limit 1", [id]);
    await query("delete from discount_coupons where id = $1", [id]);
    await logAdminActivity(request, {
      id: guard.user!.id,
      email: guard.user!.email,
      fullName: guard.user!.full_name,
      role: guard.user!.role,
    }, {
      module: "discounts",
      action: "delete",
      entityType: "coupon",
      entityId: id,
      entityLabel: couponResult.rows[0]?.code || id,
      message: "Deleted coupon.",
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/discounts error:", error);
    return NextResponse.json({ error: "Failed to delete discount" }, { status: 500 });
  }
}
