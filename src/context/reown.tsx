import { AppKitNetwork, base, baseSepolia } from "@reown/appkit/networks";
import { createAppKit, Metadata } from "@reown/appkit";
import SignClient from "@walletconnect/sign-client";
import { isLocal } from "@/utils/helpers";
import { getChain } from "@/config/web3";

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;
if (!projectId) {
  throw new Error("Reown Project ID is not set");
}

const metadata: Metadata = {
  name: "Backpack Network",
  description: "Connect to Backpack to enable bill pay services",
  url: isLocal ? "http://localhost:3000" : "https://backpack.network",
  icons: ["https://cryptologos.cc/logos/uniswap-uni-logo.png?v=035"], // TODO: change URL
};

const mapChainToAppKitNetwork = (): [AppKitNetwork, ...AppKitNetwork[]] => {
  switch (getChain().id) {
    case 84532:
      return [baseSepolia]
    case 8453:
      return [base];
    default:
      return [base];
  }
};

export const modal = createAppKit({
  projectId,
  networks: mapChainToAppKitNetwork(),
  themeMode: "dark",
  metadata,
  features: {
    analytics: false,
    onramp: false,
    swaps: false,
  },
});
