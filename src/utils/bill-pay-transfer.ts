import { modal } from "@/context/reown";
import { encodeFunctionData, Address, parseUnits } from "viem";
import type UniversalProvider from "@walletconnect/universal-provider";
import { BASE_USDC } from "./constants";
import { getChain } from "@/config/web3";

const getProvider = async () => {
  const wcProvider = await modal.universalAdapter?.getWalletConnectProvider();
  if (!wcProvider) {
    throw new Error("No wallet provider found");
  }
  return wcProvider;
};

const getAccounts = async (wcProvider: UniversalProvider): Promise<Address> => {
  // OR await wcProvider.request({ method: "eth_requestAccounts" })
  const accounts = await wcProvider.enable();
  if (!accounts) {
    throw new Error("No connected accounts found");
  }
  return accounts[0] as Address;
};

// TODO: Check user has enough balance
const isBalanceSufficient = async ({
  walletAddress,
  intendedAmountToTransfer,
}: {
  walletAddress: Address;
  intendedAmountToTransfer: number;
}) => {
  // TODO: returns true if user has sufficient balance for intended transfer
};

const buildTransfer = async ({ liquidationAddress, amount }: { liquidationAddress: Address; amount: string }) => {
  const wcProvider = await getProvider();
  const walletAddress = await getAccounts(wcProvider);

  const transferData = encodeFunctionData({
    abi: BASE_USDC.ABI,
    functionName: "transfer",
    args: [liquidationAddress, parseUnits(amount, BASE_USDC.DECIMALS)], // [Liquidation Address, Amount]
  });

  const transactionParameters = {
    from: walletAddress, // The sender's address
    to: BASE_USDC.ADDRESS, // The USDC contract address
    data: transferData,
  };

  console.log("Transaction parameters:", transactionParameters);

  // TODO: run contract simulation

  const transactionResult = await wcProvider.request(
    {
      method: "eth_sendTransaction",
      params: [transactionParameters],
    },
    `eip155:${getChain().id}`
  );
  console.log("Transaction result:", transactionResult);
};

export { buildTransfer };
