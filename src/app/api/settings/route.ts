import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    let settings = await prisma.companySettings.findFirst();
    
    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {
          companyName: "Supreme Media Advertising",
          tagline: "Creative • Innovative • Positive",
          terms: [
            "Space once sold will not be taken back.",
            "Flex Mounting charges will be free 4 times in a year. After that, Rs. 3/- will be charged for every mounting.",
            "Subject to local jurisdiction only.",
            "Payment should be made within 5 days of the bill's issue.",
            "Any disputes should be resolved amicably."
          ],
          gstNo: "16BBSPB2699J1Z4",
          panNo: "BBSPB2699J",
          address: "Post Office Chowmuhani, Agartala, Tripura (W)",
          bankName: "State Bank Of India (SBI)",
          accountName: "SUPREME MEDIA ADVERTISING",
          accountNumber: "36369322514",
          ifscCode: "SBIN0009126",
          micrCode: "799002007",
          branchCode: "09126",
          bankAddress: "SBI MBB COLLEGE BRANCH, MATH CHOWMUHANI, AGARTALA, TRIPURA (W) PIN-799007",
          footerAddress: "Agartala Office: 45 HGB Road, Post Office Chowmuhani, Opp to Sarkar Nursing Home, Singh Para, Rimpon International Building 3rd Floor, Upstairs Of Times 24 Network, Agartala, Tripura (W) PIN: 799001",
          website: "www.suprememedia.co.in",
          phone: "Call: 82580-05500",
          signatoryName: "Supreme Media Advertising",
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    
    let settings = await prisma.companySettings.findFirst();
    
    if (settings) {
      settings = await prisma.companySettings.update({
        where: { id: settings.id },
        data
      });
    } else {
      settings = await prisma.companySettings.create({
        data
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
