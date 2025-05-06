import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PYLON_API_BASE_URL } from "@/libs/monetic-sdk";

import { MERCHANT_COOKIE_NAME } from "@/utils/constants";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const authToken = cookieStore.get(MERCHANT_COOKIE_NAME);

    if (!PYLON_API_BASE_URL) {
      throw new Error("PYLON_API_BASE_URL is not configured via monetic-sdk.ts");
    }

    const [complianceResponse, cardCompanyResponse] = await Promise.all([
      fetch(`${PYLON_API_BASE_URL}/v1/bridge/compliance`, {
        headers: {
          "Content-Type": "application/json",
          Cookie: `${MERCHANT_COOKIE_NAME}=${authToken?.value}`,
        },
        credentials: "include",
      }),
      fetch(`${PYLON_API_BASE_URL}/v1/merchant/company/rain/status`, {
        headers: {
          "Content-Type": "application/json",
          Cookie: `${MERCHANT_COOKIE_NAME}=${authToken?.value}`,
        },
        credentials: "include",
      }),
    ]);

    if (!complianceResponse.ok || !cardCompanyResponse.ok) {
      throw new Error(complianceResponse.statusText || "Failed to fetch compliance status");
    }

    const complianceStatus = await complianceResponse.json();
    const cardCompanyStatus = await cardCompanyResponse.json();

    return NextResponse.json({ ...complianceStatus.data, ...cardCompanyStatus.data });
  } catch (error) {
    console.error("Error checking compliance:", error);

    return NextResponse.json(
      {
        error: "Failed to check compliance status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
