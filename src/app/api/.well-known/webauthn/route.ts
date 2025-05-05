import { NextResponse } from "next/server";

// Read the single environment variable containing comma-separated allowed origins
// configured for the CURRENT deployment environment (Production/Preview/Development)
const allowedOriginsEnvVar = process.env.NEXT_PUBLIC_ALLOWED_ORIGINS || "";

// Process the environment variable into an array
const allowedOrigins = allowedOriginsEnvVar
  .split(",") // Split the string by commas
  .map((origin) => origin.trim()) // Remove leading/trailing whitespace
  .filter(Boolean); // Remove any empty strings (e.g., from trailing commas or empty env var)

export async function GET(request: Request) {
  // Log the origins being used for this specific environment's deployment
  console.log(`/.well-known/webauthn route hit. Allowed origins for this env:`, allowedOrigins);

  if (allowedOrigins.length === 0) {
    console.error(
      "Error: No allowed frontend origins configured for the current environment. Check NEXT_PUBLIC_ALLOWED_ORIGINS environment variable."
    );
    return new NextResponse("Internal Server Error: Allowed origins not configured.", { status: 500 });
  }

  const responseJson = {
    // Key MUST be "origins" for this spec
    origins: allowedOrigins,
  };

  // Return the JSON response with correct Content-Type and Cache-Control
  return NextResponse.json(responseJson, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
