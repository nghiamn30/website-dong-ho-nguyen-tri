import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE_NAME = "dong_ho_nguyen_tri_access_token";
// Public portal + auth routes that never require a session.
const PUBLIC_PREFIXES = ["/login", "/gioi-thieu", "/tin-tuc", "/thu-vien"];
const PUBLIC_EXACT = ["/"];

function isPublicPath(pathname: string) {
  if (PUBLIC_EXACT.includes(pathname)) {
    return true;
  }
  return PUBLIC_PREFIXES.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
