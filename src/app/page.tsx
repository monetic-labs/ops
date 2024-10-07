// Note: This can't be a client component
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

import { MERCHANT_COOKIE_NAME } from "@/utils/constants";

import AvailableCard from "@/components/account-contract/available";
import LockedCard from "@/components/account-contract/locked";
import PendingCard from "@/components/account-contract/pending";
import SpentCard from "@/components/account-contract/spent";
import { title } from "@/components/primitives";
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
        {/* <div className="w-full sm:w-1/4 mb-4 sm:mb-0 flex">
          <AvailableCard />
        </div>
        <div className="w-full sm:w-1/4 mb-4 sm:mb-0 flex">
          <PendingCard />
        </div>
        <div className="w-full sm:w-1/4 mb-4 sm:mb-0 flex">
          <SpentCard />
        </div>
        <div className="w-full sm:w-1/4 mb-4 sm:mb-0 flex">
          <LockedCard />
        </div> */}
        <AccountMeta />
      </div>
      <MerchantServicesTabs userId={userId} />
    </section>
  );
}
