import { NextResponse } from "next/server";

/**
 * Handles CSP violation reports
 * This endpoint receives Content Security Policy violation reports
 * and logs them for analysis
 */
export async function POST(request: Request) {
  try {
    const report = await request.json();
    const cspReport = report["csp-report"];

    if (!cspReport) {
      return NextResponse.json({ error: "Invalid CSP report format" }, { status: 400 });
    }

    // Extract key information from the report
    const {
      "document-uri": documentUri,
      "violated-directive": violatedDirective,
      "blocked-uri": blockedUri,
      "source-file": sourceFile,
      "line-number": lineNumber,
      "column-number": columnNumber,
    } = cspReport;

    // Create a structured log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      documentUri,
      violatedDirective,
      blockedUri,
      sourceFile,
      location: lineNumber && columnNumber ? `${lineNumber}:${columnNumber}` : "unknown",
      // Add environment info
      environment: process.env.NODE_ENV || "development",
    };

    // Log the structured entry
    console.warn("CSP Violation:", JSON.stringify(logEntry));

    // For debugging, log the full report in development
    if (process.env.NODE_ENV === "development") {
      console.debug("Full CSP Report:", JSON.stringify(report));
    }

    // Provide guidance for common violations
    let guidance = "";

    if (violatedDirective?.includes("script-src")) {
      guidance = `To fix this, add "${blockedUri}" to the script-src directive in your CSP configuration.`;
    } else if (violatedDirective?.includes("connect-src")) {
      guidance = `To fix this, add "${blockedUri}" to the connect-src directive in your CSP configuration.`;
    } else if (violatedDirective?.includes("frame-src")) {
      guidance = `To fix this, add "${blockedUri}" to the frame-src directive in your CSP configuration.`;
    }

    if (guidance && process.env.NODE_ENV === "development") {
      console.info("Guidance:", guidance);
    }

    // In a production environment, you might want to:
    // 1. Store these reports in a database
    // 2. Send them to a monitoring service
    // 3. Set up alerts for frequent violations
    // 4. Implement rate limiting to prevent DoS attacks on this endpoint

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing CSP report:", error);

    return NextResponse.json({ error: "Failed to process CSP report" }, { status: 500 });
  }
}
