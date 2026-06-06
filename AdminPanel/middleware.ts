import { NextRequest, NextResponse } from "next/server";

const protectedPaths = [
  "/",
  "/orders",
  "/products",
  "/add-product",
  "/variants",
  "/collections",
  "/categories",
  "/customers",
  "/marketing",
  "/discounts",
  "/content",
  "/markets",
  "/analytics",
  "/online-store",
  "/app",
  "/settings",
  "/users",
];

function isProtectedPath(pathname: string) {
  return protectedPaths.some((path) => pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("qh_token")?.value;

  if (pathname === "/login" && token) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (isProtectedPath(pathname) && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/orders/:path*",
    "/products/:path*",
    "/add-product/:path*",
    "/variants/:path*",
    "/collections/:path*",
    "/categories/:path*",
    "/customers/:path*",
    "/marketing/:path*",
    "/discounts/:path*",
    "/content/:path*",
    "/markets/:path*",
    "/analytics/:path*",
    "/online-store/:path*",
    "/app/:path*",
    "/settings/:path*",
    "/users/:path*",
  ],
};

