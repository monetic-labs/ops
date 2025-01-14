import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { MERCHANT_COOKIE_NAME } from "@/utils/constants";
import axios from "axios";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const authToken = cookieStore.get(MERCHANT_COOKIE_NAME);

    const API_URL = process.env.NEXT_PUBLIC_PYLON_BASE_URL;
    if (!API_URL) {
      throw new Error("NEXT_PUBLIC_PYLON_BASE_URL is not set");
    }

    const [complianceResponse, cardCompanyResponse] = await Promise.all([
      axios.get(`${API_URL}/v1/bridge/compliance`, {
        headers: {
          "Content-Type": "application/json",
          Cookie: `${MERCHANT_COOKIE_NAME}=${authToken?.value}`,
        },
        withCredentials: true,
      }),
      axios.get(`${API_URL}/v1/merchant/company/rain/status`, {
        headers: {
          "Content-Type": "application/json",
          Cookie: `${MERCHANT_COOKIE_NAME}=${authToken?.value}`,
        },
        withCredentials: true,
      }),
    ]);

    if (complianceResponse.status !== 200 || cardCompanyResponse.status !== 200) {
      throw new Error(complianceResponse.statusText || "Failed to fetch compliance status");
    }

    const complianceStatus = complianceResponse.data;
    const cardCompanyStatus = cardCompanyResponse.data;

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
