import { NextRequest } from "next/server";
import { query } from "@/lib/db";

type ActivityActor = {
  id?: string | null;
  email?: string | null;
  fullName?: string | null;
  role?: string | null;
};

type ActivityEntry = {
  module: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  status?: "success" | "failed";
  message?: string | null;
  metadata?: Record<string, unknown> | null;
};

let activityLogSchemaReady = false;

export async function ensureActivityLogSchema() {
  if (activityLogSchemaReady) return;

  await query(`
    create table if not exists admin_activity_logs (
      id uuid primary key default gen_random_uuid(),
      actor_team_user_id uuid references team_users(id) on delete set null,
      actor_name varchar(160),
      actor_email varchar(190),
      actor_role varchar(20),
      module varchar(80) not null,
      action varchar(80) not null,
      entity_type varchar(80) not null,
      entity_id varchar(120),
      entity_label text,
      status varchar(20) not null default 'success',
      message text,
      metadata jsonb not null default '{}'::jsonb,
      ip_address varchar(120),
      user_agent text,
      created_at timestamptz not null default now()
    )
  `);
  await query("create index if not exists idx_admin_activity_logs_created_at on admin_activity_logs(created_at desc)");
  await query("create index if not exists idx_admin_activity_logs_actor on admin_activity_logs(actor_team_user_id)");
  await query("create index if not exists idx_admin_activity_logs_module_action on admin_activity_logs(module, action)");

  activityLogSchemaReady = true;
}

function requestIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return request.headers.get("x-real-ip") || null;
}

export async function logAdminActivity(request: NextRequest, actor: ActivityActor | null | undefined, entry: ActivityEntry) {
  try {
    await ensureActivityLogSchema();
    await query(
      `insert into admin_activity_logs
       (actor_team_user_id, actor_name, actor_email, actor_role, module, action, entity_type, entity_id, entity_label, status, message, metadata, ip_address, user_agent)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, $14)`,
      [
        actor?.id || null,
        actor?.fullName || null,
        actor?.email || null,
        actor?.role || null,
        entry.module,
        entry.action,
        entry.entityType,
        entry.entityId || null,
        entry.entityLabel || null,
        entry.status || "success",
        entry.message || null,
        JSON.stringify(entry.metadata || {}),
        requestIp(request),
        request.headers.get("user-agent") || null,
      ],
    );
  } catch (error) {
    console.error("Failed to write admin activity log:", error);
  }
}
