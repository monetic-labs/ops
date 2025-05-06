import { Pylon } from "@monetic-labs/sdk";

let determinedBaseUrl: string | undefined;
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const legacyApiBaseUrl = process.env.NEXT_PUBLIC_LEGACY_API_BASE_URL;

// Check if running in a browser environment
if (typeof window !== "undefined") {
  const hostname = window.location.hostname;
  switch (hostname) {
    case "services.staging.backpack.network":
    case "services.backpack.network":
      determinedBaseUrl = legacyApiBaseUrl;
      if (!determinedBaseUrl) {
        console.error(
          `Pylon SDK Critical: Running on ${hostname}, but NEXT_PUBLIC_LEGACY_API_BASE_URL is not set. API calls will likely fail.`
        );
      }
      break;
    case "ops.staging.monetic.xyz":
    case "ops.monetic.xyz":
      determinedBaseUrl = apiBaseUrl;
      if (!determinedBaseUrl) {
        console.error(
          `Pylon SDK Critical: Running on ${hostname}, but NEXT_PUBLIC_API_BASE_URL is not set. API calls will likely fail.`
        );
      }
      break;
    case "localhost": // Explicitly handle localhost to use NEXT_PUBLIC_API_BASE_URL
    default: // Catches other unmapped hostnames and defaults to NEXT_PUBLIC_API_BASE_URL
      determinedBaseUrl = apiBaseUrl;
      if (!determinedBaseUrl) {
        console.error(
          `Pylon SDK Critical: Running on ${hostname} (or unmapped domain), but NEXT_PUBLIC_API_BASE_URL is not set. API calls will likely fail.`
        );
      }
      break;
  }
} else {
  // Server-side (e.g., build time, API routes)
  // Defaults to the new API base URL for server operations.
  determinedBaseUrl = apiBaseUrl;
  if (!determinedBaseUrl) {
    console.error(
      "Pylon SDK Critical: Server-side/build time, NEXT_PUBLIC_API_BASE_URL is not set. This will likely cause issues for API routes or server-side rendering."
    );
  }
}

// Ensure that baseUrl is set, otherwise throw a critical error.
// The Pylon SDK constructor requires a valid URL.
if (!determinedBaseUrl) {
  // The specific reason (which env var was missing for the context)
  // should have been logged by a console.error further up.
  throw new Error(
    "Pylon SDK: Critical error - API base URL could not be determined. " +
      "Check console logs for details on which environment variable might be missing for the current context (hostname or server-side operation)."
  );
}

const pylon = new Pylon({
  baseUrl: determinedBaseUrl,
});

// Export the determined base URL for the default Pylon instance and general use
export const PYLON_API_BASE_URL = determinedBaseUrl;

// Export the individual base URLs for more granular control, e.g., in server-side logic
export const MONETIC_API_BASE_URL = apiBaseUrl; // From NEXT_PUBLIC_API_BASE_URL
export const LEGACY_API_BASE_URL = legacyApiBaseUrl; // From NEXT_PUBLIC_LEGACY_API_BASE_URL

export default pylon;
