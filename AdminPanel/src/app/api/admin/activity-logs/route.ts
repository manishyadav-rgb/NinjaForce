import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import { ensureActivityLogSchema } from "@/lib/activity-log";
import { query } from "@/lib/db";

type ActivityLogRow = {
  id: string;
  actor_team_user_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  actor_role: string | null;
  module: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
  status: "success" | "failed";
  message: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

type TeamMemberRow = {
  id: string;
  full_name: string;
  email: string;
};

export async function GET(request: NextRequest) {
  const guard = await requirePermission(request, "activity.view");
  if (guard.response) return guard.response;

  try {
    await ensureActivityLogSchema();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(10, Number(searchParams.get("limit") || 20)));
    const offset = (page - 1) * limit;
    const moduleFilter = String(searchParams.get("module") || "").trim();
    const actionFilter = String(searchParams.get("action") || "").trim();
    const statusFilter = String(searchParams.get("status") || "").trim();
    const actorFilter = String(searchParams.get("actorId") || "").trim();
    const search = String(searchParams.get("q") || "").trim();

    const where: string[] = [];
    const params: unknown[] = [];

    if (moduleFilter) {
      params.push(moduleFilter);
      where.push(`module = $${params.length}`);
    }
    if (actionFilter) {
      params.push(actionFilter);
      where.push(`action = $${params.length}`);
    }
    if (statusFilter) {
      params.push(statusFilter);
      where.push(`status = $${params.length}`);
    }
    if (actorFilter) {
      params.push(actorFilter);
      where.push(`actor_team_user_id = $${params.length}`);
    }
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      where.push(`(
        lower(coalesce(actor_name, '')) like $${params.length}
        or lower(coalesce(actor_email, '')) like $${params.length}
        or lower(coalesce(module, '')) like $${params.length}
        or lower(coalesce(action, '')) like $${params.length}
        or lower(coalesce(entity_type, '')) like $${params.length}
        or lower(coalesce(entity_label, '')) like $${params.length}
        or lower(coalesce(message, '')) like $${params.length}
      )`);
    }

    const whereClause = where.length > 0 ? `where ${where.join(" and ")}` : "";

    const countResult = await query<{ count: string }>(
      `select count(*)::text as count from admin_activity_logs ${whereClause}`,
      params,
    );
    const totalCount = Number(countResult.rows[0]?.count || 0);

    const logsResult = await query<ActivityLogRow>(
      `select
         id,
         actor_team_user_id::text,
         actor_name,
         actor_email,
         actor_role,
         module,
         action,
         entity_type,
         entity_id,
         entity_label,
         status,
         metadata,
         message,
         ip_address,
         user_agent,
         created_at::text
       from admin_activity_logs
       ${whereClause}
       order by created_at desc
       limit $${params.length + 1}
       offset $${params.length + 2}`,
      [...params, limit, offset],
    );

    const memberResult = await query<TeamMemberRow>(
      `select id, full_name, email::text
       from team_users
       where is_active = true
       order by full_name asc`,
    );

    const modulesResult = await query<{ module: string; count: string }>(
      `select module, count(*)::text as count
       from admin_activity_logs
       group by module
       order by count(*) desc, module asc`,
    );

    const summaryResult = await query<{
      total: string;
      success_count: string;
      failed_count: string;
      unique_actors: string;
    }>(
      `select
         count(*)::text as total,
         count(*) filter (where status = 'success')::text as success_count,
         count(*) filter (where status = 'failed')::text as failed_count,
         count(distinct actor_team_user_id)::text as unique_actors
       from admin_activity_logs`,
    );

    return NextResponse.json({
      logs: logsResult.rows,
      members: memberResult.rows,
      modules: modulesResult.rows,
      summary: {
        total: Number(summaryResult.rows[0]?.total || 0),
        success: Number(summaryResult.rows[0]?.success_count || 0),
        failed: Number(summaryResult.rows[0]?.failed_count || 0),
        actors: Number(summaryResult.rows[0]?.unique_actors || 0),
      },
      pagination: {
        totalCount,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/activity-logs error:", error);
    return NextResponse.json({ error: "Failed to load activity logs" }, { status: 500 });
  }
}
