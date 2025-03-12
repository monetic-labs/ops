import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const report = await request.json();

    // Log CSP violations to your server logs
    console.warn("CSP Violation:", JSON.stringify(report));

    // In a production environment, you might want to:
    // 1. Store these reports in a database
    // 2. Send them to a monitoring service
    // 3. Set up alerts for frequent violations

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing CSP report:", error);
    return NextResponse.json({ error: "Failed to process CSP report" }, { status: 500 });
  }
}
