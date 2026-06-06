import { NextRequest, NextResponse } from "next/server";
import { ensurePermissionSchema, getCurrentTeamUser, makePasswordHash, requirePermission } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/activity-log";
import { query } from "@/lib/db";
import { PERMISSIONS } from "@/lib/permissions";

export const runtime = "nodejs";

type MemberRow = {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "team";
  is_active: boolean;
  permissions_locked: boolean;
  last_login_at: string | null;
  created_at: string;
  permissions: string[] | null;
};

function normalizePermissions(value: unknown) {
  const allowed = new Set(PERMISSIONS.map((permission) => permission.code));
  if (!Array.isArray(value)) return [];
  const selected = new Set(value.map((item) => String(item)).filter((code) => allowed.has(code)));

  for (const code of Array.from(selected)) {
    const permission = PERMISSIONS.find((item) => item.code === code);
    if (!permission || permission.action === "view") continue;
    const moduleViewCode = `${permission.module}.view`;
    if (allowed.has(moduleViewCode)) selected.add(moduleViewCode);
  }

  if (selected.has("members.permissions.manage")) selected.add("members.view");
  return Array.from(selected);
}

async function savePermissions(memberId: string, permissionCodes: string[], grantedBy: string) {
  await query("delete from team_user_permissions where team_user_id = $1", [memberId]);
  for (const code of permissionCodes) {
    await query(
      `insert into team_user_permissions (team_user_id, permission_code, granted_by)
       values ($1, $2, $3)
       on conflict do nothing`,
      [memberId, code, grantedBy],
    );
  }
}

export async function GET(request: NextRequest) {
  const guard = await requirePermission(request, "members.view");
  if (guard.response) return guard.response;

  try {
    await ensurePermissionSchema();
    const result = await query<MemberRow>(
      `select
         tu.id,
         tu.email::text,
         tu.full_name,
         tu.role,
         tu.is_active,
         tu.permissions_locked,
         tu.last_login_at::text,
         tu.created_at::text,
         coalesce(array_agg(tup.permission_code order by tup.permission_code) filter (where tup.permission_code is not null), '{}') as permissions
       from team_users tu
       left join team_user_permissions tup on tup.team_user_id = tu.id
       group by tu.id
       order by tu.created_at desc`,
    );
    return NextResponse.json({ permissions: PERMISSIONS, members: result.rows });
  } catch (error) {
    console.error("GET /api/admin/members error:", error);
    return NextResponse.json({ error: "Failed to load members" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await requirePermission(request, "members.create");
  if (guard.response) return guard.response;

  try {
    await ensurePermissionSchema();
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const fullName = String(body?.full_name || "").trim();
    const password = String(body?.password || "");
    const role = body?.role === "admin" ? "admin" : "team";
    const isActive = body?.is_active !== false;
    const permissions = normalizePermissions(body?.permissions);

    if (!email || !fullName || !password) {
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const inserted = await query<{ id: string }>(
      `insert into team_users (email, password_hash, full_name, role, is_active)
       values ($1, $2, $3, $4, $5)
       returning id`,
      [email, makePasswordHash(password), fullName, role, isActive],
    );
    const memberId = inserted.rows[0].id;
    if (role === "team") {
      await savePermissions(memberId, permissions, guard.user!.id);
    }

    await logAdminActivity(request, {
      id: guard.user!.id,
      email: guard.user!.email,
      fullName: guard.user!.full_name,
      role: guard.user!.role,
    }, {
      module: "members",
      action: "create",
      entityType: "member",
      entityId: memberId,
      entityLabel: `${fullName} (${email})`,
      message: `Created ${role} account for ${fullName}.`,
      metadata: { role, isActive, permissionCount: permissions.length },
    });

    return NextResponse.json({ ok: true, id: memberId });
  } catch (error: any) {
    console.error("POST /api/admin/members error:", error);
    if (String(error?.code) === "23505") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create member" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const currentUser = await getCurrentTeamUser(request);
  if (!currentUser) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!currentUser.permissions.includes("members.edit") && currentUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await ensurePermissionSchema();
    const body = await request.json();
    const id = String(body?.id || "");
    const fullName = String(body?.full_name || "").trim();
    const role = body?.role === "admin" ? "admin" : "team";
    const isActive = body?.is_active !== false;
    const password = String(body?.password || "");
    const wantsPermissionChange = Object.prototype.hasOwnProperty.call(body, "permissions");
    const permissions = normalizePermissions(body?.permissions);

    if (!id || !fullName) {
      return NextResponse.json({ error: "Member id and name are required" }, { status: 400 });
    }

    const target = await query<{ id: string; role: "admin" | "team"; permissions_locked: boolean }>(
      "select id, role, permissions_locked from team_users where id = $1 limit 1",
      [id],
    );
    if (!target.rows[0]) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    if (id === currentUser.id && role !== "admin") {
      return NextResponse.json({ error: "You cannot remove your own admin role" }, { status: 400 });
    }
    if (wantsPermissionChange && !currentUser.permissions.includes("members.permissions.manage") && currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updates = ["full_name = $2", "role = $3", "is_active = $4", "updated_at = now()"];
    const params: unknown[] = [id, fullName, role, isActive];
    if (password) {
      if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      updates.push(`password_hash = $${params.length + 1}`);
      params.push(makePasswordHash(password));
    }
    await query(`update team_users set ${updates.join(", ")} where id = $1`, params);

    if (wantsPermissionChange) {
      if (!target.rows[0].permissions_locked && role === "team") {
        await savePermissions(id, permissions, currentUser.id);
      } else if (role === "admin") {
        await query("delete from team_user_permissions where team_user_id = $1", [id]);
      }
    }

    await logAdminActivity(request, {
      id: currentUser.id,
      email: currentUser.email,
      fullName: currentUser.full_name,
      role: currentUser.role,
    }, {
      module: "members",
      action: "update",
      entityType: "member",
      entityId: id,
      entityLabel: fullName,
      message: `Updated member profile for ${fullName}.`,
      metadata: { role, isActive, passwordChanged: Boolean(password), permissionsChanged: wantsPermissionChange },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/admin/members error:", error);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const guard = await requirePermission(request, "members.delete");
  if (guard.response) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Member id is required" }, { status: 400 });
    if (id === guard.user!.id) {
      return NextResponse.json({ error: "You cannot deactivate yourself" }, { status: 400 });
    }
    const memberResult = await query<{ full_name: string; email: string }>(
      "select full_name, email::text from team_users where id = $1 limit 1",
      [id],
    );
    await query("update team_users set is_active = false, updated_at = now() where id = $1", [id]);

    await logAdminActivity(request, {
      id: guard.user!.id,
      email: guard.user!.email,
      fullName: guard.user!.full_name,
      role: guard.user!.role,
    }, {
      module: "members",
      action: "deactivate",
      entityType: "member",
      entityId: id,
      entityLabel: memberResult.rows[0] ? `${memberResult.rows[0].full_name} (${memberResult.rows[0].email})` : id,
      message: "Deactivated team member access.",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/members error:", error);
    return NextResponse.json({ error: "Failed to deactivate member" }, { status: 500 });
  }
}
