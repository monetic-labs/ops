import { Address, encodeFunctionData, erc20Abi, Hex, parseUnits } from "viem";
import {
  MetaTransaction,
  SignerSignaturePair,
  CandidePaymaster,
  DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
  SafeAccountV0_3_0 as SafeAccount,
  GasOption,
} from "abstractionkit";

import { TransferStatus } from "@/components/generics/transfer-status";
import { WebAuthnHelper } from "@/utils/webauthn";
import { BASE_USDC } from "@/utils/constants";
import { chain, BUNDLER_URL, PAYMASTER_URL, SPONSORSHIP_POLICY_ID, PUBLIC_RPC } from "@/config/web3";

import { WebAuthnCredentials } from "../localstorage";

import { safeAbi } from "./safeAbi";

type BuildNestedTransferParams = {
  individualSafeAddress: Address;
  settlementAddress: Address;
  liquidationAddress: Address;
  amount: string;
  setTransferStatus: (status: TransferStatus) => void;
  credentials: WebAuthnCredentials;
};

// Add these new helper functions above buildNestedTransfer
const trackSettlementOperation = async (
  settlementAccount: SafeAccount,
  settlementAccountUserOperation: any,
  setTransferStatus: (status: TransferStatus) => void
) => {
  try {
    const settlementAccountResponse = await settlementAccount.sendUserOperation(
      settlementAccountUserOperation,
      BUNDLER_URL
    );

    // Show optimistic success immediately
    setTransferStatus(TransferStatus.SENT);

    // Track receipt in background
    settlementAccountResponse.included().catch((error) => {
      console.error("Settlement receipt tracking failed:", error);
      setTransferStatus(TransferStatus.ERROR);
    });
  } catch (error) {
    console.error("Failed to send settlement operation:", error);
    setTransferStatus(TransferStatus.ERROR);
    throw error;
  }
};

const createSettlementOperation = (
  individualAccountAddress: string,
  settlementAccountUserOperation: any,
  DEFAULT_SECP256R1_PRECOMPILE_ADDRESS: string
) => {
  const approvedSignature =
    "0x000000000000000000000000" +
    individualAccountAddress.slice(2) +
    "000000000000000000000000000000000000000000000000000000000000000001";

  settlementAccountUserOperation.signature = SafeAccount.formatSignaturesToUseroperationSignature(
    [{ signer: individualAccountAddress, signature: approvedSignature }],
    {
      eip7212WebAuthnPrecompileVerifier: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
    }
  );

  return settlementAccountUserOperation;
};

/**
 * Builds and executes a nested safe transaction for bill pay transfers
 * The flow is:
 * 1. User signs with WebAuthn through their individual safe
 * 2. Individual safe approves the settlement safe's transaction
 * 3. Settlement safe executes the transfer with approved signature
 */
export const buildNestedTransfer = async ({
  individualSafeAddress,
  settlementAddress,
  liquidationAddress,
  amount,
  setTransferStatus,
  credentials,
}: BuildNestedTransferParams) => {
  try {
    setTransferStatus(TransferStatus.PREPARING);

    console.log("Individual Safe Address:", individualSafeAddress);
    console.log("Settlement Safe Address:", settlementAddress);
    console.log("Liquidation Address:", liquidationAddress);

    const webauthnHelper = new WebAuthnHelper({
      publicKey: credentials.publicKey,
      credentialId: credentials.credentialId,
    });

    // Create individual account without initialization as it was already deployed
    const individualAccountAddress = SafeAccount.createAccountAddress([credentials.publicKey], {
      threshold: 1,
      eip7212WebAuthnPrecompileVerifierForSharedSigner: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
    });
    const individualAccount = new SafeAccount(individualAccountAddress);

    // Create settlement account without initialization as it was already deployed
    const settlementAccountAddress = SafeAccount.createAccountAddress([individualAccountAddress], { threshold: 1 });
    const settlementAccount = new SafeAccount(settlementAccountAddress);

    console.log("Individual Account address:", individualAccount.accountAddress);
    console.log("Settlement Account address:", settlementAccount.accountAddress);

    // Create USDC transfer transaction
    const transferCalldata = encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [liquidationAddress, parseUnits(amount, BASE_USDC.DECIMALS)],
    });

    const transferTransaction: MetaTransaction = {
      to: BASE_USDC.ADDRESS,
      value: BigInt(0),
      data: transferCalldata,
    };

    // Create settlement account user operation with expected signers for gas estimation
    let settlementAccountUserOperation = await settlementAccount.createUserOperation(
      [transferTransaction],
      PUBLIC_RPC,
      BUNDLER_URL,
      {
        expectedSigners: [individualAccountAddress],
        eip7212WebAuthnPrecompileVerifier: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
        gasLevel: GasOption.Fast,
      }
    );

    // Add sponsorship to settlement operation
    const paymaster = new CandidePaymaster(PAYMASTER_URL);
    const [sponsoredSettlementOp] = await paymaster.createSponsorPaymasterUserOperation(
      settlementAccountUserOperation,
      BUNDLER_URL,
      SPONSORSHIP_POLICY_ID
    );

    settlementAccountUserOperation = sponsoredSettlementOp;

    // Get the hash for the settlement operation that needs to be approved
    const settlementOpHash = SafeAccount.getUserOperationEip712Hash(
      settlementAccountUserOperation,
      BigInt(chain.id)
    ) as Hex;

    // Create the approval transaction for the individual account
    const approveHashCalldata = encodeFunctionData({
      abi: safeAbi,
      functionName: "approveHash",
      args: [settlementOpHash],
    });

    const approveHashTransaction: MetaTransaction = {
      to: settlementAccount.accountAddress,
      value: BigInt(0),
      data: approveHashCalldata,
    };

    setTransferStatus(TransferStatus.SIGNING);

    // Create individual account operation to approve hash with WebAuthn signer
    let individualAccountUserOperation = await individualAccount.createUserOperation(
      [approveHashTransaction],
      PUBLIC_RPC,
      BUNDLER_URL,
      {
        expectedSigners: [credentials.publicKey],
        eip7212WebAuthnPrecompileVerifier: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
        gasLevel: GasOption.Fast,
      }
    );

    // Add sponsorship to individual operation
    const [sponsoredIndividualOp] = await paymaster.createSponsorPaymasterUserOperation(
      individualAccountUserOperation,
      BUNDLER_URL,
      SPONSORSHIP_POLICY_ID
    );

    individualAccountUserOperation = sponsoredIndividualOp;

    // Get the hash for the individual operation that needs to be signed
    const individualOpHash = SafeAccount.getUserOperationEip712Hash(individualAccountUserOperation, BigInt(chain.id));

    // Sign the individual operation with WebAuthn
    const { signature } = await webauthnHelper.signMessage(individualOpHash as Hex);

    // Create signer signature pair
    const webAuthnSignerSignaturePair: SignerSignaturePair = {
      signer: credentials.publicKey,
      signature,
    };

    // Format and set the signature with WebAuthn verifier
    individualAccountUserOperation.signature = SafeAccount.formatSignaturesToUseroperationSignature(
      [webAuthnSignerSignaturePair],
      {
        isInit: individualAccountUserOperation.nonce === BigInt(0),
        eip7212WebAuthnPrecompileVerifier: DEFAULT_SECP256R1_PRECOMPILE_ADDRESS,
      }
    );

    console.log("Sending approve hash userOp for individual account");
    const individualAccountResponse = await individualAccount.sendUserOperation(
      individualAccountUserOperation,
      BUNDLER_URL
    );

    // Show optimistic success for first operation
    setTransferStatus(TransferStatus.SIGNING);

    // Track individual account receipt in background
    individualAccountResponse
      .included()
      .then(async (approvalReceipt) => {
        if (!approvalReceipt.success) {
          console.error("Approval transaction failed");
          setTransferStatus(TransferStatus.ERROR);

          return;
        }

        const updatedSettlementOp = createSettlementOperation(
          individualAccountAddress,
          settlementAccountUserOperation,
          DEFAULT_SECP256R1_PRECOMPILE_ADDRESS
        );

        await trackSettlementOperation(settlementAccount, updatedSettlementOp, setTransferStatus);
      })
      .catch((error) => {
        console.error("Approval receipt tracking failed:", error);
        setTransferStatus(TransferStatus.ERROR);
      });

    // Return early with success - actual tracking happens in background
    return { success: true };
  } catch (error) {
    console.error("Error in nested transfer:", error);
    setTransferStatus(TransferStatus.ERROR);
    throw error;
  }
};
