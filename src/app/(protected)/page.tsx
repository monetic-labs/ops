// Note: This can't be a client component
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { redirect } from "next/navigation";

import { MERCHANT_COOKIE_NAME } from "@/utils/constants";
import MerchantServicesTabs from "@/app/(protected)/tabs";
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

  // If no token, redirect to auth
  if (!authToken?.value) {
    redirect("/auth");
  }

  try {
    const { userId } = jwtDecode<JwtPayload>(authToken.value);

    return (
      <section className="flex flex-col items-center justify-center w-full">
        <div className="flex flex-col w-full space-y-6">
          <AccountMeta />
          <MerchantServicesTabs userId={userId} />
        </div>
      </section>
    );
  } catch (error) {
    console.error("Error decoding token:", error);
    redirect("/auth");
  }
}
