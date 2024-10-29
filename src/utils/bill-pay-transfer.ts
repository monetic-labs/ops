import { modal } from "@/context/reown";
import { encodeFunctionData, Address, parseUnits, Hex } from "viem";
import type UniversalProvider from "@walletconnect/universal-provider";
import { BASE_USDC } from "./constants";
import { getChain } from "@/config/web3";
import { TransferStatus } from "@/components/generics/transfer-status";

type BuildTransferArgs = {
  liquidationAddress: Address;
  amount: string;
  setTransferStatus: (status: TransferStatus) => void;
};

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

const buildTransfer = async ({ liquidationAddress, amount, setTransferStatus }: BuildTransferArgs): Promise<Hex> => {
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

  // TODO: run contract simulation

  setTransferStatus(TransferStatus.WAITING);
  return await wcProvider.request(
    {
      method: "eth_sendTransaction",
      params: [transactionParameters],
    },
    `eip155:${getChain().id}`
  );
};

export { buildTransfer };
