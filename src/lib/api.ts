/**
 * Typed API fetch helper used by all client components.
 * Throws on non-2xx responses with the server-provided error message.
 */
export async function apiFetch<T = unknown>(
    url: string,
    options?: RequestInit,
): Promise<T> {
    const isBuilding = process.env.NEXT_PHASE === 'phase-production-build';

    if (isBuilding && typeof window === "undefined") {
        console.log(`[Build] Skipping API call to ${url}`);
        return [] as T;
    }
    let finalUrl = url;

    // Handle server-side relative URLs
    if (typeof window === "undefined" && url.startsWith("/")) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        finalUrl = `${baseUrl}${url}`;
    }

    const headers = new Headers(options?.headers);
    headers.set("Content-Type", "application/json");

    // Forward cookies if on server to maintain session
    if (typeof window === "undefined") {
        try {
            const { cookies } = await import("next/headers");
            const cookieStore = await cookies();
            const cookieString = cookieStore.toString();
            if (cookieString) {
                headers.set("Cookie", cookieString);
            }
        } catch (error) {
            // next/headers might not be available or throw in some contexts (e.g. middleware or edge)
            // We ignore it and proceed without cookies if it fails
        }
    }

    const res = await fetch(finalUrl, {
        cache: 'no-store',
        ...options,
        headers,
    });

    if (!res.ok) {
        let message = `Request failed: ${res.status} ${res.statusText}`;
        try {
            const body = await res.json();
            if (body?.error) message = body.error;
        } catch {
            // ignore JSON parse errors
        }
        throw new Error(message);
    }

    // 204 No Content or empty body
    const text = await res.text();
    if (!text) return undefined as T;

    return JSON.parse(text) as T;
}
