import { NextResponse } from "next/server";
import pylon from "@/libs/pylon-sdk";
import type { GetComplianceStatusResponse, MerchantRainCompanyStatusOutput } from "@backpack-fux/pylon-sdk";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Fetch compliance status from both services
    const [complianceStatus, rainCardCompany] = await Promise.all([
      pylon.getComplianceStatus(),
      pylon.getCardCompanyStatus(),
    ]);

    // Log statuses for debugging
    console.log("bridgeTosStatus", complianceStatus.tosStatus);
    console.log("bridgeKybStatus", complianceStatus.kycStatus);
    console.log("rainKybStatus", rainCardCompany.status);

    return NextResponse.json({
      complianceStatus: {
        ...complianceStatus,
        ...rainCardCompany,
      },
    });
  } catch (error) {
    console.error("Error checking compliance:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to check compliance status",
      },
      { status: 500 }
    );
  }
}
