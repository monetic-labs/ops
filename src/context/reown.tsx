import { base, baseSepolia } from "@reown/appkit/networks";
import { createAppKit } from "@reown/appkit";
import SignClient from "@walletconnect/sign-client";

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;
if (!projectId) {
  throw new Error("Reown Project ID is not set");
}

const metadata = {
  name: "Backpack Network",
  description: "Connect to Backpack to enable bill pay services",
  url: "http://localhost:3000",
  icons: ["https://cryptologos.cc/logos/uniswap-uni-logo.png?v=035"],
};

export const modal = createAppKit({
  projectId,
  networks: [base, baseSepolia],
  themeMode: "dark",
  metadata,
  connectorImages: {
    walletConnect: "https://cryptologos.cc/logos/uniswap-uni-logo.png?v=035",
  },
  features: {
    analytics: false,
    onramp: false,
    swaps: false,
  },
});
