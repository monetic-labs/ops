import { ISO3166Alpha2Country } from "@backpack-fux/pylon-sdk";

export const merchantConfig = {
  fee: 3,
  country: "US" as ISO3166Alpha2Country,
  chainId: "80001", //polygon testnet
  contractAddress: "0x0000000000000000000000000000000000000000",
  role: "account owner",
};
