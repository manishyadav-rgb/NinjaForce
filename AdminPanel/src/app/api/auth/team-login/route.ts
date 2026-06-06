import { NextRequest, NextResponse } from "next/server";
import { loginTeamUser } from "@/lib/admin-auth";
import { logAdminActivity } from "@/lib/activity-log";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim();
    const password = String(body?.password || "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const result = await loginTeamUser(email, password);
    if (!result) {
      await logAdminActivity(request, { email, fullName: email, role: "team" }, {
        module: "auth",
        action: "login",
        entityType: "session",
        entityLabel: email,
        status: "failed",
        message: "Team login failed because credentials were invalid.",
      });
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await logAdminActivity(request, {
      id: result.user.id,
      email: result.user.email,
      fullName: result.user.full_name,
      role: result.user.role,
    }, {
      module: "auth",
      action: "login",
      entityType: "session",
      entityId: result.user.id,
      entityLabel: result.user.email,
      message: "Team member logged into AdminPanel.",
    });

    const response = NextResponse.json({ user: result.user });
    response.cookies.set("qh_token", result.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("POST /api/auth/team-login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
