import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        client: {
          include: {
            city: true,
          },
        },
        invoice: {
          include: {
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
          },
        },
      },
    });

    if (!receipt) {
      return NextResponse.json(
        { error: "Receipt not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(receipt);
  } catch (error) {
    console.error("[GET /api/receipts/[id]/print]", error);
    return NextResponse.json(
      { error: "Failed to fetch receipt print data" },
      { status: 500 }
    );
  }
}
