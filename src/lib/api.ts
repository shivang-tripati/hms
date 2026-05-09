import { recordActivity } from "@/components/auth/session-timeout";
import { toast } from "sonner";

export async function apiFetch<T = unknown>(
    url: string,
    options?: RequestInit & { revalidate?: number },
): Promise<T> {
    if (typeof window !== "undefined") {
        recordActivity();
    }

    let finalUrl = url;

    if (typeof window === "undefined" && url.startsWith("/")) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        finalUrl = `${baseUrl}${url}`;
    }

    const { revalidate, ...restOptions } = options || {};

    const headers = new Headers(restOptions.headers);

    const isFormData = restOptions.body instanceof FormData;
    if (!isFormData) {
        headers.set("Content-Type", "application/json");
    }

    const isServer = typeof window === "undefined";

    if (isServer) {
        try {
            const { cookies } = await import("next/headers");
            const cookieStore = await cookies();
            const cookieString = cookieStore.toString();
            if (cookieString) {
                headers.set("Cookie", cookieString);
            }
        } catch { }
    }



    // 🚨 KEY LOGIC
    const fetchOptions: RequestInit = {
        ...restOptions,
        headers,
    };

    if (isServer) {
        if (revalidate !== undefined) {
            // Cache only when explicitly requested
            fetchOptions.next = { revalidate };
        } else {
            // Default: NO caching (safe for user data)
            fetchOptions.cache = 'no-store';
        }
    }

    const res = await fetch(finalUrl, fetchOptions);

    if (!res.ok) {
        let message = `Request failed: ${res.status} ${res.statusText}`;
        let requestId = "";
        try {
            const body = await res.json();
            if (body?.error) message = body.error;
            if (body?.requestId) requestId = body.requestId;
        } catch { }

        // Handle Session Expiry or Unauthorized Access
        if (res.status === 401 || res.status === 403) {
            if (typeof window !== "undefined") {
                // Client-side: Clear any local state and redirect
                localStorage.clear(); // Clear all as a safety measure
                toast.error("Session expired. Please login again.");
                window.location.href = "/login";
            } else {
                // Server-side: Import redirect dynamically
                const { redirect } = await import("next/navigation");
                redirect("/login");
            }
            throw new Error("Session expired or access denied. Redirecting to login...");
        }

        if (typeof window !== "undefined") {
            toast.error(message, {
                description: requestId ? `Error ID: ${requestId}` : undefined,
            });
        }
        throw new Error(message);
    }

    const text = await res.text();
    if (!text) return undefined as T;

    return JSON.parse(text) as T;
}