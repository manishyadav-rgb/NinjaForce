import { NextRequest, NextResponse } from "next/server";
import { logAdminActivity } from "@/lib/activity-log";
import { getCurrentTeamUser } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const user = await getCurrentTeamUser(request);
  if (user) {
    await logAdminActivity(request, {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    }, {
      module: "auth",
      action: "logout",
      entityType: "session",
      entityId: user.id,
      entityLabel: user.email,
      message: "Team member logged out of AdminPanel.",
    });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set("qh_token", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
  return response;
}
