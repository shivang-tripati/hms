"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        // 1. CLEAR THE CACHE FIRST
        // This ensures the NEXT request (to the dashboard) 
        // will fetch fresh Server Components/Sidebar.
        revalidatePath("/", "layout");

        // 2. Sign in
        await signIn("credentials", {
            ...Object.fromEntries(formData.entries()),
            redirectTo: "/"
        });
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return "Invalid credentials.";
                default:
                    return "Something went wrong.";
            }
        }
        throw error;
    }

    redirect("/");
}

export async function logout() {
    revalidatePath("/", "layout");
    await signOut({ redirectTo: "/login", redirect: true });
}