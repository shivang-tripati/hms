export async function apiFetch<T = unknown>(
    url: string,
    options?: RequestInit & { revalidate?: number },
): Promise<T> {

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
        try {
            const body = await res.json();
            if (body?.error) message = body.error;
        } catch { }
        throw new Error(message);
    }

    const text = await res.text();
    if (!text) return undefined as T;

    return JSON.parse(text) as T;
}