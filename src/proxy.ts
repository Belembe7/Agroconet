import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/admin",
  "/vendedor",
  "/entregador",
  "/cliente",
] as const;

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function proxy(request: NextRequest) {
  if (!isProtected(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const sessionCookie =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get("__Secure-better-auth.session_token");

  if (!sessionCookie?.value) {
    const login = new URL("/entrar", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/vendedor/:path*",
    "/entregador/:path*",
    "/cliente/:path*",
  ],
};
