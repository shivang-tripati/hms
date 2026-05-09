import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    trustHost: true,
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const pathname = nextUrl.pathname;

            const isStaticAsset =
                pathname.startsWith("/_next") ||
                pathname.startsWith("/favicon.ico") ||
                pathname.startsWith("/hms.png") ||
                pathname.startsWith("/images") ||
                pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/);

            const isApiAuthRoute = pathname.startsWith("/api/auth");
            const isPublicRoute = ["/login"].includes(pathname);

            if (isApiAuthRoute || isStaticAsset) return true;

            if (isPublicRoute) {
                if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
                return true;
            }

            if (!isLoggedIn) return false;

            // Role-based access control
            const role = (auth.user as any)?.role;
            const isStaff = role === "STAFF";

            // Financial & Admin modules (Restricted for STAFF)
            const restrictedPrefixes = [
                "/billing",
                "/invoices",
                "/accounting",
                "/ledgers",
                "/reports",
                "/analytics",
                "/admin/staff",
                "/settings",
                "/master-data",
                "/holdings/new",
                "/bookings/new",
                "/clients/new",
                "/advertisements/new",
                "/ownership-contracts/new",
                "/ownership-contracts/contracts/new",
            ];

            const restrictedApiPrefixes = [
                "/api/invoices",
                "/api/accounting",
                "/api/receipts",
                "/api/reports",
                "/api/billing",
                "/api/users",
                "/api/master-data",
                "/api/ownership-contracts",
            ];

            if (isStaff) {
                // Check if accessing restricted page
                const isRestrictedPage = restrictedPrefixes.some(prefix =>
                    pathname === prefix || pathname.startsWith(prefix + "/")
                );

                if (isRestrictedPage) {
                    return Response.redirect(new URL("/login", nextUrl));
                }

                // Check if accessing restricted API
                if (pathname.startsWith("/api")) {
                    const isRestrictedApi = restrictedApiPrefixes.some(prefix =>
                        pathname === prefix || pathname.startsWith(prefix + "/")
                    );
                    if (isRestrictedApi) {
                        return Response.json({ error: "Forbidden: Admin access required" }, { status: 403 });
                    }
                }
            }

            return true;
        },
    },
    providers: [],
} satisfies NextAuthConfig;