import { title } from "@/components/primitives";
import MerchantServicesTabs from "@/components/tabs";

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-lg text-center justify-center">
        <h1 className={title({ color: "charyo" })}>Merchant Services</h1>
      </div>
      <MerchantServicesTabs />
    </section>
  );
}
