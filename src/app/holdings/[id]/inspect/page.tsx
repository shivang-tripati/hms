import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { ReportInspectionForm } from "@/components/inspections/report-inspection-form";
import { ClipboardCheck } from "lucide-react";

interface InspectPageProps {
    params: {
        id: string;
    };
}

export default async function InspectPage({ params }: InspectPageProps) {
    const { id } = await params;

    let holding: any;
    try {
        holding = await apiFetch<any>(`/api/holdings/${id}`);
    } catch (error) {
        notFound();
    }

    if (!holding) {
        notFound();
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <PageHeader
                title="Report Inspection"
                description={`Submit an unscheduled inspection for ${holding.code} - ${holding.name}`}
                icon={ClipboardCheck}
            />

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm mb-6">
                <p className="font-semibold flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-600 font-bold text-xs">i</span>
                    Ad-hoc Submission
                </p>
                <p className="mt-1">
                    This report will be submitted as an ad-hoc task for Admin review. Once approved, it will be officially recorded in the holding's inspection history.
                </p>
            </div>

            <ReportInspectionForm holdingId={id} />
        </div>
    );
}
