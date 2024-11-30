export const mockLoginResponses = {
  initiate: {
    statusCode: 200,
    data: {
      message: "Login OTP sent successfully",
    },
  },
  verify: {
    statusCode: 200,
    data: {
      message: "Login OTP verified successfully",
    },
  },
};

export const mockAuthCookie = {
  name: "pyv2_merchant_token",
  value:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4ZDhlZDM2YS1iMTExLTQzZWMtODQzMy04YjFlZDViYjk2NjgiLCJtZXJjaGFudElkIjoxLCJicmlkZ2VDdXN0b21lcklkIjoiZmRjZjg0MDktZWJiOC00NmU3LWI4MTYtNDVlZTA2NThmYzBiIiwic2Vzc2lvbklkIjoiOGM4YjhiOTQtNTlmZS00ZTQ4LWFjZDQtMjg3MThmMGJjZmJlIiwiaWF0IjoxNzMwNDc3MzE2LCJleHAiOjEwMDMxMDgyMTE2fQ.C_6rmLnTgsHAKs4JLc1GPy8Zlth0yE17QHZSnlZTkaA",
  domain: "localhost",
  path: "/",
  httpOnly: true,
  secure: false,
  expires: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days from now
};
