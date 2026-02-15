import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Define Routes
  const authRoutes = [
    "/login",
    "/register-customer",
    "/register-performer", // Fixed typo: added leading slash
    "/reset-password",
  ];
  const customerRoutes = ["/customer-profile"];
  const performerRoutes = ["/performer-profile"];

  // 2. Get the User's Token (Session)
  const token = await getToken({ req });
  const isAuth = !!token;
  const userRole = token?.role as string | undefined;

  // --- SCENARIO 1: User is Logged In but tries to access Login/Register ---
  if (isAuth && authRoutes.some((route) => pathname.startsWith(route))) {
    if (userRole === "customer") {
      return NextResponse.redirect(new URL("/customer-profile", req.url));
    } else {
      return NextResponse.redirect(new URL("/performer-profile", req.url));
    }
  }

  // --- SCENARIO 2: User is NOT Logged In but tries to access Protected Routes ---
  if (
    !isAuth &&
    (customerRoutes.some((r) => pathname.startsWith(r)) ||
      performerRoutes.some((r) => pathname.startsWith(r)))
  ) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // --- SCENARIO 3: Role Protection (Cross-Role Access) ---
  // if (isAuth) {
  //   // FIX: Only redirect if Customer tries to access PERFORMER routes
  //   if (
  //     userRole === "customer" &&
  //     performerRoutes.some((r) => pathname.startsWith(r))
  //   ) {
  //     return NextResponse.redirect(new URL("/customer-profile", req.url));
  //   }

  //   // FIX: Only redirect if Performer tries to access CUSTOMER routes
  //   if (
  //     userRole === "performer" &&
  //     customerRoutes.some((r) => pathname.startsWith(r))
  //   ) {
  //     return NextResponse.redirect(new URL("/performer-profile", req.url));
  //   }
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|icons|public|sounds|login|register-customer|register-performer|reset-password|firebase-messaging-sw.js|manifest.json).*)",
  ],
};
