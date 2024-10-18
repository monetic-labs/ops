// Note: This can't be a client component
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

import { MERCHANT_COOKIE_NAME } from "@/utils/constants";

import MerchantServicesTabs from "@/app/tabs";
import AccountMeta from "@/components/account-contract/account-meta";

type JwtPayload = {
  userId: string;
  merchantId: number;
  sessionId: string;
  iat: number;
  exp: number;
};

export default function Home() {
  const authToken = cookies().get(MERCHANT_COOKIE_NAME);
  const token = authToken?.value;
  if (!token) {
    throw new Error("No token found");
  }
  const userId = jwtDecode<JwtPayload>(token).userId;
  return (
    <section className="flex flex-col items-center justify-center gap-4">
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-7xl justify-between mb-8">
        <AccountMeta />
      </div>
      <MerchantServicesTabs userId={userId} />
    </section>
  );
}
