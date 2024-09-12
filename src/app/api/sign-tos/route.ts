import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { customer_id } = await request.json();

  const url = "https://monorail.onrender.com/dashboard/generate_signed_agreement_id";
  const payload = {
    customer_id: customer_id,
    email: null,
    token: null,
    type: "tos",
    version: "v3",
  };

  const headers = {
    Accept: "*/*",
    "Content-Type": "application/json;charset=utf-8",
    Origin: "https://dashboard.bridge.xyz",
    Referer: "https://dashboard.bridge.xyz/",
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error making API call:", error);

    return NextResponse.json({ error: "Failed to sign terms of service" }, { status: 500 });
  }
}
