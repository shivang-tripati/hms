import { NextRequest, NextResponse } from 'next/server';
import { generatePdfBuffer } from '@/lib/export-server';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { title, columns, filters } = body;
        const rows = body.rows || body.data;

        if (!rows || rows.length === 0) {
            return NextResponse.json({ error: "No data to export" }, { status: 400 });
        }

        const buffer = await generatePdfBuffer({ title, columns, rows, filters });

        const fileName = `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().getTime()}.pdf`;

        return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${fileName}"`,
            },
        });
    } catch (error: any) {
        console.error('[EXPORT_PDF_ERROR]', error);
        return NextResponse.json({ error: error.message || "Export failed" }, { status: 500 });
    }
}
