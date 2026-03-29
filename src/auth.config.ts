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

            // Role-based access control for STAFF
            const role = (auth.user as any)?.role;
            if (isLoggedIn && role === "STAFF") {
                const allowedPaths = ["/", "/tasks", "/suggestions", "/api"];
                const isAllowed = allowedPaths.some(path =>
                    nextUrl.pathname === path || nextUrl.pathname.startsWith(path)
                );
                if (!isAllowed) return Response.redirect(new URL("/", nextUrl));
            }

            return true;
        },
    },
    providers: [],
} satisfies NextAuthConfig;