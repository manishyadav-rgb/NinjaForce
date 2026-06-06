import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.DATABASE_URL || "";
  let host = "missing";

  try {
    host = new URL(url).hostname;
  } catch {
    host = "invalid";
  }

  return NextResponse.json({
    hasDbUrl: !!url,
    dbHost: host,
  });
}
