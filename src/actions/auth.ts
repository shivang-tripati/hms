"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        // Bust ALL server-side caches so stale pages from
        // the previous user's session are never served.
        revalidatePath("/", "layout");

        // Sign in WITHOUT redirectTo — we'll handle the redirect
        // on the client side with window.location.href to force
        // a full hard page load (bypasses client Router Cache).
        await signIn("credentials", {
            ...Object.fromEntries(formData.entries()),
            redirect: false,
        });

        // If we reach here, credentials were valid.
        return "__success__";
    } catch (error) {
        if (error instanceof AuthError) {
            // Check for our custom "AccountDisabled" error thrown in authorize
            if (error.cause?.err?.message === "AccountDisabled" || error.message.includes("AccountDisabled")) {
                return "Your account has been deactivated. Please contact the administrator.";
            }

            switch (error.type) {
                case "CredentialsSignin":
                    return "Invalid email or password.";
                default:
                    return "Authentication failed. Please try again.";
            }
        }
        throw error;
    }
}

export async function logout() {
    // Bust server-side caches.
    revalidatePath("/", "layout");

    // Sign out without server-side redirect — the client
    // will do a hard redirect to /login.
    await signOut({ redirect: false });

    return "__logout__";
}