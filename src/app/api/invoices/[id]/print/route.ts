import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: {
          include: {
            city: true,
          },
        },
        booking: {
          include: {
            holding: {
              include: {
                city: true,
                holdingType: true,
              },
            },
          },
        },
        hsnCode: true,
        items: {
          include: {
            hsnCode: true,
          },
        },
        receipts: {
          orderBy: { receiptDate: "desc" },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const settings = await prisma.companySettings.findFirst();

    return NextResponse.json({ ...invoice, settings });
  } catch (error) {
    console.error("[GET /api/invoices/[id]/print]", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice print data" },
      { status: 500 }
    );
  }
}
