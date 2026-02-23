import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Define Routes
  const authRoutes = [
    "/login",
    "/register-customer",
    "/register-performer",
    "/reset-password",
  ];

  // Define protected routes per role
  const customerRoutes = ["/customer-profile", "/favorites"];
  const performerRoutes = ["/performer-profile"];
  const adminRoutes = ["/admin"];
  const supportRoutes = ["/support"];

  // 2. Get the User's Token (Session)
  const token = await getToken({ req });
  const isAuth = !!token;
  const userRole = token?.role as string | undefined;

  // --- SCENARIO 1: User is Logged In but tries to access Login/Register ---
  // (e.g., if they click "Login" while already having an active session)
  if (isAuth && authRoutes.some((route) => pathname.startsWith(route))) {
    if (userRole === "customer") {
      return NextResponse.redirect(new URL("/customer-profile", req.url));
    }
    if (userRole === "performer") {
      return NextResponse.redirect(new URL("/performer-profile", req.url));
    }
    if (userRole === "admin") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    if (userRole === "support") {
      return NextResponse.redirect(new URL("/support", req.url));
    }
    if (userRole === "partner") {
      // If a partner somehow retained a legacy session on the main app, bounce them to their portal
      const partnerUrl =
        process.env.NEXT_PUBLIC_PARTNER_APP_URL || "http://localhost:3001";
      return NextResponse.redirect(new URL(partnerUrl));
    }
    // Fallback for unknown roles
    return NextResponse.redirect(new URL("/", req.url));
  }

  // --- SCENARIO 2: User is NOT Logged In but tries to access Protected Routes ---
  const isProtectedRoute =
    customerRoutes.some((r) => pathname.startsWith(r)) ||
    performerRoutes.some((r) => pathname.startsWith(r)) ||
    adminRoutes.some((r) => pathname.startsWith(r)) ||
    supportRoutes.some((r) => pathname.startsWith(r));

  if (!isAuth && isProtectedRoute) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // --- SCENARIO 3: Strict Role Protection (Cross-Role Access) ---
  if (isAuth) {
    // Customer trying to access Performer/Admin/Support routes
    if (
      userRole === "customer" &&
      (performerRoutes.some((r) => pathname.startsWith(r)) ||
        adminRoutes.some((r) => pathname.startsWith(r)) ||
        supportRoutes.some((r) => pathname.startsWith(r)))
    ) {
      return NextResponse.redirect(new URL("/customer-profile", req.url));
    }

    // Performer trying to access Customer/Admin/Support routes
    if (
      userRole === "performer" &&
      (customerRoutes.some((r) => pathname.startsWith(r)) ||
        adminRoutes.some((r) => pathname.startsWith(r)) ||
        supportRoutes.some((r) => pathname.startsWith(r)))
    ) {
      return NextResponse.redirect(new URL("/performer-profile", req.url));
    }

    // (Optional) Add similar restrictions for support preventing them from accessing admin routes, etc.
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // CRITICAL FIX: Removed auth routes (login, register) from the exclusion list
    // so the middleware can actually intercept them!
    "/((?!api|_next/static|_next/image|favicon.ico|images|icons|public|sounds|firebase-messaging-sw.js|manifest.json|$).*)",
  ],
};
