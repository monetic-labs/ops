import AvailableCard from "@/components/account-contract/available";
import LockedCard from "@/components/account-contract/locked";
import PendingCard from "@/components/account-contract/pending";
import SpentCard from "@/components/account-contract/spent";
import { title } from "@/components/primitives";
import MerchantServicesTabs from "@/components/tabs";

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-lg text-center justify-center">
        <h1 className={title({ color: "charyo" })}>Merchant Services</h1>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-7xl justify-between mb-8">
        <div className="w-full sm:w-1/4 mb-4 sm:mb-0 flex">
          <AvailableCard />
        </div>
        <div className="w-full sm:w-1/4 mb-4 sm:mb-0 flex">
          <PendingCard />
        </div>
        <div className="w-full sm:w-1/4 mb-4 sm:mb-0 flex">
          <SpentCard />
        </div>
        <div className="w-full sm:w-1/4 flex">
          <LockedCard />
        </div>
      </div>
      <MerchantServicesTabs />
    </section>
  );
}
