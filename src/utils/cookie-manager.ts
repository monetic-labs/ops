import { BridgeComplianceKycStatus, RainComplianceKybStatus } from "@monetic-labs/sdk";

/**
 * Client-side cookie management utility.
 * Note: This class is designed for client-side use only.
 * For server-side or middleware cookie operations, use Next.js's built-in cookie handling:
 * - Server components: cookies() from 'next/headers'
 * - Middleware: request.cookies from NextRequest
 */
export interface ComplianceStatus {
  kycStatus: string;
  rainKybStatus: string;
  rainKycStatus?: string;
}

export class CookieManager {
  public static readonly COMPLIANCE_COOKIE = "compliance_status";

  /**
   * Compliance Status Management
   */
  static setComplianceStatus(status: ComplianceStatus): void {
    const isApproved =
      status.kycStatus.toUpperCase() === BridgeComplianceKycStatus.APPROVED.toUpperCase() &&
      status.rainKybStatus.toUpperCase() === RainComplianceKybStatus.APPROVED.toUpperCase() &&
      (!status.rainKycStatus || status.rainKycStatus.toUpperCase() === RainComplianceKybStatus.APPROVED.toUpperCase());

    this.setCookie(this.COMPLIANCE_COOKIE, isApproved ? "approved" : "pending", {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  static getComplianceStatus(): "approved" | "pending" | null {
    const status = this.getCookie(this.COMPLIANCE_COOKIE);
    return (status as "approved" | "pending" | null) || null;
  }

  static clearComplianceStatus(): void {
    this.deleteCookie(this.COMPLIANCE_COOKIE);
  }

  /**
   * Generic Cookie Utilities
   */
  private static setCookie(
    name: string,
    value: string,
    options: {
      path?: string;
      expires?: Date;
      maxAge?: number;
      domain?: string;
      secure?: boolean;
      sameSite?: "strict" | "lax" | "none";
    } = {}
  ): void {
    let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    if (options.path) cookie += `; path=${options.path}`;
    if (options.expires) cookie += `; expires=${options.expires.toUTCString()}`;
    if (options.maxAge) cookie += `; max-age=${options.maxAge}`;
    if (options.domain) cookie += `; domain=${options.domain}`;
    if (options.secure) cookie += "; secure";
    if (options.sameSite) cookie += `; samesite=${options.sameSite}`;

    document.cookie = cookie;
  }

  private static getCookie(name: string): string | null {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.split("=").map((c) => c.trim());
      if (cookieName === name) {
        return decodeURIComponent(cookieValue);
      }
    }
    return null;
  }

  private static deleteCookie(name: string, path: string = "/"): void {
    this.setCookie(name, "", {
      path,
      expires: new Date(0),
    });
  }
}
