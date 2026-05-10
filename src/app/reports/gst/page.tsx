import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import GstReportPageClient from "./gst-report-client";

export default async function GstReportPage() {
    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) {
        redirect("/login");
    }

    return <GstReportPageClient />;
}
