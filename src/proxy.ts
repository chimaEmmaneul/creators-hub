import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "creatorhub_session";

const PUBLIC_PAGES = ["/login", "/register"];
const PUBLIC_API_PREFIX = "/api/auth/";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  if (PUBLIC_PAGES.includes(pathname) || pathname.startsWith(PUBLIC_API_PREFIX)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in to continue." } },
      { status: 401 },
    );
  }

  const loginUrl = new URL("/login", request.url);
  if (pathname !== "/") loginUrl.searchParams.set("next", pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
