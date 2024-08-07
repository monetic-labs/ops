import AvailableCard from "@/components/cards/available";
import LockedCard from "@/components/cards/locked";
import PendingCard from "@/components/cards/pending";
import SpentCard from "@/components/cards/spent";
import { title } from "@/components/primitives";
import MerchantServicesTabs from "@/components/tabs";

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-lg text-center justify-center">
        <h1 className={title({ color: "charyo" })}>Merchant Services</h1>
      </div>
      <div className="flex flex-row gap-4 w-full max-w-7xl justify-between mb-8">
        <AvailableCard />
        <PendingCard />
        <SpentCard />
        <LockedCard />
      </div>
      <MerchantServicesTabs />
    </section>
  );
}
