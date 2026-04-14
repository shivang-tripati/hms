"use client";

import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

export function AuthProvider({
    children,
    session,
}: {
    children: React.ReactNode;
    session: Session | null;
}) {
    return (
        <SessionProvider
            // Pass the server-fetched session so the client starts
            // with the correct user data immediately (no flash of stale data).
            session={session}
            // Refetch the session every time the window regains focus.
            refetchOnWindowFocus={true}
            // Refetch session on every navigation cycle.
            refetchInterval={0}
        >
            {children}
        </SessionProvider>
    );
}
