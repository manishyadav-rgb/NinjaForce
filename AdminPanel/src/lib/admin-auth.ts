import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hashPassword, signToken, verifyPassword, verifyToken } from "@/lib/auth";
import { ALL_PERMISSION_CODES, PERMISSIONS } from "@/lib/permissions";

export type CurrentTeamUser = {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "team";
  is_active: boolean;
  permissions: string[];
};

type TeamUserRow = {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: "admin" | "team";
  is_active: boolean;
};

let permissionsReady = false;

export async function ensurePermissionSchema() {
  if (permissionsReady) return;

  await query(`
    create table if not exists permissions (
      id uuid primary key default gen_random_uuid(),
      code varchar(120) not null unique,
      module varchar(60) not null,
      action varchar(60) not null,
      label varchar(120) not null,
      description text,
      sort_order int not null default 0,
      created_at timestamptz not null default now()
    )
  `);
  await query(`
    create table if not exists team_user_permissions (
      team_user_id uuid not null references team_users(id) on delete cascade,
      permission_code varchar(120) not null references permissions(code) on delete cascade,
      granted_by uuid references team_users(id) on delete set null,
      created_at timestamptz not null default now(),
      primary key (team_user_id, permission_code)
    )
  `);
  await query("alter table team_users add column if not exists permissions_locked boolean not null default false");
  await query("create index if not exists idx_permissions_module on permissions(module)");
  await query("create index if not exists idx_team_user_permissions_user on team_user_permissions(team_user_id)");

  for (const permission of PERMISSIONS) {
    await query(
      `insert into permissions (code, module, action, label, description, sort_order)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (code) do update set
         module = excluded.module,
         action = excluded.action,
         label = excluded.label,
         description = excluded.description,
         sort_order = excluded.sort_order`,
      [permission.code, permission.module, permission.action, permission.label, permission.description, permission.sortOrder],
    );
  }

  permissionsReady = true;
}

export async function getUserPermissions(userId: string, role: "admin" | "team") {
  if (role === "admin") return ALL_PERMISSION_CODES;
  await ensurePermissionSchema();
  const result = await query<{ permission_code: string }>(
    "select permission_code from team_user_permissions where team_user_id = $1",
    [userId],
  );
  return result.rows.map((row) => row.permission_code);
}

export async function getCurrentTeamUser(request: NextRequest): Promise<CurrentTeamUser | null> {
  const token = request.cookies.get("qh_token")?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || (payload.role !== "admin" && payload.role !== "team")) return null;

  const result = await query<TeamUserRow>(
    `select id, email::text, password_hash, full_name, role, is_active
     from team_users
     where id = $1
     limit 1`,
    [payload.sub],
  );
  const user = result.rows[0];
  if (!user || !user.is_active) return null;
  return { ...user, permissions: await getUserPermissions(user.id, user.role) };
}

export function can(user: CurrentTeamUser, permissionCode: string) {
  return user.role === "admin" || user.permissions.includes(permissionCode);
}

export async function requirePermission(request: NextRequest, permissionCode: string) {
  const user = await getCurrentTeamUser(request);
  if (!user) {
    return { user: null, response: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }) };
  }
  if (!can(user, permissionCode)) {
    return { user, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user, response: null };
}

export async function loginTeamUser(emailInput: string, password: string) {
  await ensurePermissionSchema();
  const email = emailInput.trim().toLowerCase();
  const result = await query<TeamUserRow>(
    `select id, email::text, password_hash, full_name, role, is_active
     from team_users
     where lower(email::text) = $1
     limit 1`,
    [email],
  );
  const user = result.rows[0];
  if (!user || !user.is_active || !verifyPassword(password, user.password_hash)) return null;

  await query("update team_users set last_login_at = now(), updated_at = now() where id = $1", [user.id]);
  const permissions = await getUserPermissions(user.id, user.role);
  const token = signToken({ sub: user.id, role: user.role, email: user.email }, 60 * 60 * 24 * 30);
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      permissions,
    },
  };
}

export function makePasswordHash(password: string) {
  return hashPassword(password);
}
