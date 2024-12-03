const USER_ID = "566dd103-b2c8-40e2-b83a-df15855ed6cf";

export const mockBridgeComplianceResponse = {
  statusCode: 200,
  data: {
    kycLink: "https://bridge.withpersona.com/verify",
    tosLink: "https://dashboard.bridge.xyz/accept-terms-of-service",
    kycStatus: "approved", // TODO: This is pending in prod
    tosStatus: "pending",
  },
};

export const mockRainComplianceResponse = {
  statusCode: 200,
  data: {
    status: "APPROVED",
    link: `https://use-dev.raincards.xyz/kyb?userId=${USER_ID}`,
  },
};
