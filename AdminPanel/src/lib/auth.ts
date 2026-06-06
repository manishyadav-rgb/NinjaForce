import { createHash, createHmac, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { query } from "@/lib/db";

// ─── JWT-like Token (HMAC-SHA256) ───

const JWT_SECRET = () => process.env.JWT_SECRET ?? process.env.DATABASE_URL ?? "qh-fallback-secret";

type TokenPayload = {
  sub: string;       // user id
  role: "customer" | "team" | "admin";
  phone?: string;
  email?: string;
  iat: number;
  exp: number;
};

function base64url(data: string) {
  return Buffer.from(data).toString("base64url");
}

function fromBase64url(data: string) {
  return Buffer.from(data, "base64url").toString("utf-8");
}

export function signToken(payload: Omit<TokenPayload, "iat" | "exp">, expiresInSeconds = 60 * 60 * 24 * 7): string {
  const now = Math.floor(Date.now() / 1000);
  const full: TokenPayload = { ...payload, iat: now, exp: now + expiresInSeconds };
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify(full));
  const signature = createHmac("sha256", JWT_SECRET()).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const [header, body, signature] = token.split(".");
    if (!header || !body || !signature) return null;
    const expected = createHmac("sha256", JWT_SECRET()).update(`${header}.${body}`).digest("base64url");
    if (expected !== signature) return null;
    const payload = JSON.parse(fromBase64url(body)) as TokenPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// ─── Cookie helpers ───

const TOKEN_COOKIE = "qh_token";

export function setAuthCookie(token: string, response?: Response) {
  // For use in route handlers, set on NextResponse
  if (response && "cookies" in response) {
    (response as any).cookies.set(TOKEN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }
  return token;
}

export async function getAuthFromCookies(): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_COOKIE)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

// ─── Hash helpers ───

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256").update(`${salt}:${password}`).digest("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const computed = createHash("sha256").update(`${salt}:${password}`).digest("hex");
  return computed === hash;
}

export function hashOtp(phone: string, otp: string): string {
  const secret = process.env.OTP_SECRET ?? process.env.DATABASE_URL ?? "quirky-home-dev";
  return createHash("sha256").update(`${phone}:${otp}:${secret}`).digest("hex");
}

export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.length === 10) return `+91${cleaned}`;
  return cleaned;
}
