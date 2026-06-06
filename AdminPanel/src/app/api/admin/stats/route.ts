import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import { query } from "@/lib/db";

type CountRow = { count: string };

async function tableExists(tableName: string): Promise<boolean> {
  const result = await query<{ exists: boolean }>(
    "select to_regclass($1) is not null as exists",
    [tableName],
  );
  return !!result.rows[0]?.exists;
}

async function safeCount(tableName: string): Promise<number> {
  if (!(await tableExists(tableName))) return 0;
  const result = await query<CountRow>(`select count(*)::text as count from ${tableName}`);
  return Number.parseInt(result.rows[0]?.count ?? "0", 10);
}

export async function GET(request: NextRequest) {
  const guard = await requirePermission(request, "home.view");
  if (guard.response) return guard.response;

  try {
    const [totalUsers, totalProducts, totalOrders, totalCarts, totalWishlists] = await Promise.all([
      safeCount("users"),
      safeCount("products"),
      safeCount("customer_orders"),
      safeCount("customer_carts"),
      safeCount("customer_wishlists"),
    ]);

    return NextResponse.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalCarts,
      totalWishlists,
    });
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json(
      {
        totalUsers: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalCarts: 0,
        totalWishlists: 0,
      },
      { status: 200 },
    );
  }
}
