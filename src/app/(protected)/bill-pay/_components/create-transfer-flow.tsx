"use client";

import { useState, useEffect } from "react";
import { Address } from "viem";
import { toast } from "sonner";
import { DisbursementMethod } from "@monetic-labs/sdk";
import { newBillPaySchema } from "@/validations/bill-pay";

import {
  DEFAULT_EXISTING_BILL_PAY,
  DEFAULT_NEW_BILL_PAY,
  ExistingBillPay,
  NewBillPay,
  isExistingBillPay,
} from "@/types/bill-pay";

import { useBalance } from "@/hooks/account-contracts/useBalance";
import { useUser } from "@/contexts/UserContext";
import { usePasskeySelection } from "@/contexts/PasskeySelectionContext";
import { TransferStatus } from "@/components/generics/transfer-status";
import { useExistingDisbursement } from "@/app/(protected)/bill-pay/_hooks/useExistingDisbursement";
import { useNewDisbursement } from "@/app/(protected)/bill-pay/_hooks/useNewDisbursement";
import { BASE_USDC } from "@/utils/constants";
import { createERC20TransferTemplate } from "@/utils/safe/templates";
import { executeNestedTransaction } from "@/utils/safe/flows/nested";

import RecipientSelectionModal from "./recipient-selection-modal";
import TransferMethodSelection from "./transfer-method-selection";

// Define a type for the contact object (adjust based on actual structure from useGetContacts)
interface SelectedContact {
  id: string;
  accountOwnerName: string;
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  disbursements: Array<{
    id: string;
    method: DisbursementMethod;
    address: Address;
    paymentMessage?: string /* other props */;
  }>;
  // Add other relevant contact properties
}

type CreateTransferFlowProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  settlementAddress: Address;
};

export default function CreateTransferFlow({ isOpen, onClose, onSuccess, settlementAddress }: CreateTransferFlowProps) {
  // Flow state
  const [step, setStep] = useState<"recipient" | "details">("recipient");
  const [billPay, setBillPay] = useState<NewBillPay | ExistingBillPay>(DEFAULT_NEW_BILL_PAY);
  const [selectedContactDetails, setSelectedContactDetails] = useState<SelectedContact | null>(null); // Store full contact
  const [transferStatus, setTransferStatus] = useState<TransferStatus>(TransferStatus.IDLE);

  // Hooks
  const { user } = useUser();
  const { selectCredential } = usePasskeySelection();
  const { balance: settlementBalance, isLoading: isLoadingBalance } = useBalance({
    amount: billPay.amount,
    isModalOpen: isOpen,
  });

  const {
    disbursement: existingDisbursement,
    isLoading: isLoadingExistingDisbursement,
    error: existingDisbursementError,
    createExistingDisbursement,
  } = useExistingDisbursement();

  const {
    disbursement: newDisbursement,
    isLoading: isLoadingNewDisbursement,
    error: newDisbursementError,
    createNewDisbursement,
  } = useNewDisbursement();

  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setStep("recipient");
      setBillPay(DEFAULT_NEW_BILL_PAY);
      setSelectedContactDetails(null); // Reset selected contact
      setTransferStatus(TransferStatus.IDLE);
    }
  }, [isOpen]);

  // Handle recipient selection - REVISED
  const handleRecipientSelect = (recipientData: SelectedContact | NewBillPay) => {
    // Check if it's a new bill pay object or an existing contact
    if ("type" in recipientData && recipientData.type === "new") {
      // --- It's the data for a new recipient flow ---
      // Directly submit this data instead of going to the details step
      setBillPay(recipientData); // Update state just in case
      // Ensure the data is fully formed before submitting
      const validationResult = newBillPaySchema.safeParse(recipientData);
      if (validationResult.success) {
        console.log("New recipient details complete, initiating transfer...");
        handleTransferSubmit(recipientData); // Call submit directly
      } else {
        console.error("New recipient data is invalid just before submission:", validationResult.error);
        toast.error("There was an issue validating the recipient details. Please check the form.");
        // Optionally, reset the flow or show specific errors
        setStep("recipient"); // Go back to allow fixing?
      }
    } else {
      // --- It's an existing contact object ---
      const contact = recipientData as SelectedContact;
      setSelectedContactDetails(contact); // Store the full contact details
      // Initialize billPay with existing contact details
      setBillPay({
        ...DEFAULT_EXISTING_BILL_PAY,
        type: "existing",
        vendorName: contact.accountOwnerName,
        vendorBankName: contact.bankName,
        routingNumber: contact.routingNumber,
        accountNumber: contact.accountNumber,
      });
      // Proceed to details step for existing contacts
      setStep("details");
    }
  };

  // Handle transfer method and amount submission
  const handleTransferSubmit = async (finalBillPay: NewBillPay | ExistingBillPay) => {
    if (!settlementAddress || !user?.walletAddress || !finalBillPay.vendorMethod) {
      toast.error("Missing required information for the transfer");
      return;
    }

    try {
      console.log("=== Bill Payment Debug: Starting payment process ===");
      console.log("settlementAddress:", settlementAddress);
      console.log("user.walletAddress:", user.walletAddress);
      console.log("billPay details:", {
        amount: finalBillPay.amount,
        vendorMethod: finalBillPay.vendorMethod,
        isExisting: isExistingBillPay(finalBillPay),
      });

      // Select a credential to use
      let selectedCredential;
      try {
        setTransferStatus(TransferStatus.PREPARING);
        selectedCredential = await selectCredential();
      } catch (error) {
        console.error("Credential selection failed:", error);
        toast.error("Failed to select a passkey. Please try again.");
        setTransferStatus(TransferStatus.ERROR);
        return;
      }

      console.log("Creating disbursement...");
      const response = isExistingBillPay(finalBillPay)
        ? await createExistingDisbursement(finalBillPay.disbursementId, {
            amount: finalBillPay.amount,
            disbursementMethod: finalBillPay.vendorMethod,
            ...(finalBillPay.vendorMethod === DisbursementMethod.WIRE && { wireMessage: finalBillPay.memo }),
            ...(finalBillPay.vendorMethod === DisbursementMethod.ACH_SAME_DAY && {
              achReference: finalBillPay.memo,
            }),
          })
        : await createNewDisbursement({
            accountOwnerName: finalBillPay.vendorName,
            bankName: finalBillPay.vendorBankName,
            accountNumber: finalBillPay.accountNumber,
            routingNumber: finalBillPay.routingNumber,
            address: finalBillPay.address,
            returnAddress: settlementAddress,
            amount: parseFloat(finalBillPay.amount),
            paymentRail: finalBillPay.vendorMethod,
            ...(finalBillPay.vendorMethod === DisbursementMethod.WIRE && {
              wireMessage: finalBillPay.memo,
            }),
            ...(finalBillPay.vendorMethod === DisbursementMethod.ACH_SAME_DAY && {
              achReference: finalBillPay.memo,
            }),
          });

      console.log("Disbursement created successfully:", response);

      if (!response) {
        throw new Error(`Failed to create ${isExistingBillPay(finalBillPay) ? "existing" : "new"} disbursement`);
      }

      // Get liquidation address based on response type
      const liquidationAddress = isExistingBillPay(finalBillPay)
        ? (response.address as Address)
        : "disbursements" in response
          ? (response.disbursements[0].address as Address)
          : (response.address as Address);

      console.log("Liquidation address:", liquidationAddress);

      // Create ERC20 transfer template
      console.log("Creating ERC20 transfer template...");
      const erc20TransferTemplate = createERC20TransferTemplate({
        tokenAddress: BASE_USDC.ADDRESS,
        toAddress: liquidationAddress,
        amount: finalBillPay.amount,
        decimals: BASE_USDC.DECIMALS,
      });

      console.log("Transfer template created:", erc20TransferTemplate);

      // Execute the transaction
      console.log("Executing nested transaction...");
      await executeNestedTransaction({
        fromSafeAddress: user.walletAddress as Address,
        throughSafeAddress: settlementAddress,
        transactions: [erc20TransferTemplate],
        credentials: selectedCredential,
        callbacks: {
          onPreparing: () => {
            console.log("Transaction state: PREPARING");
            setTransferStatus(TransferStatus.PREPARING);
          },
          onSigning: () => {
            console.log("Transaction state: SIGNING");
            setTransferStatus(TransferStatus.SIGNING);
          },
          onSigningComplete: () => {
            console.log("Transaction state: SIGNING COMPLETE");
            setTransferStatus(TransferStatus.SENDING);
          },
          onSent: () => {
            console.log("Transaction state: SENT/CONFIRMING");
            setTransferStatus(TransferStatus.CONFIRMING);
          },
          onSuccess: () => {
            console.log("Transaction state: SUCCESS");
            setTransferStatus(TransferStatus.SENT);
            toast.success("Bill payment completed successfully");
            onSuccess?.();
          },
          onError: (error: Error) => {
            console.error("Bill payment transaction error:", error);
            console.error("Error details:", {
              message: error.message,
              name: error.name,
              stack: error.stack,
            });
            setTransferStatus(TransferStatus.ERROR);
            toast.error("Bill payment failed. Please try again.");
          },
        },
      });
    } catch (error) {
      console.error("Error in bill payment process:", error);
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          name: error.name,
          stack: error.stack,
        });
      }
      setTransferStatus(TransferStatus.ERROR);
      toast.error(`Bill payment failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  // Handle reset transfer status
  const handleResetTransferStatus = () => {
    setTransferStatus(TransferStatus.IDLE);
  };

  // Handle modal close
  const handleClose = () => {
    if (transferStatus !== TransferStatus.IDLE && transferStatus !== TransferStatus.ERROR) {
      return; // Prevent closing during active transfer
    }
    onClose();
  };

  return (
    <>
      {/* Step 1: Recipient Selection */}
      <RecipientSelectionModal
        isOpen={isOpen && step === "recipient"}
        onClose={handleClose}
        onSelect={handleRecipientSelect}
        settlementAddress={settlementAddress}
        settlementBalance={settlementBalance}
      />

      {/* Step 2: Transfer Method and Amount */}
      <TransferMethodSelection
        isOpen={isOpen && step === "details"}
        onClose={() => {
          setStep("recipient");
          setSelectedContactDetails(null); // Clear contact when going back
        }}
        onSubmit={handleTransferSubmit}
        billPay={billPay}
        setBillPay={setBillPay}
        settlementBalance={settlementBalance}
        transferStatus={transferStatus}
        onResetTransferStatus={handleResetTransferStatus}
        onBack={() => {
          setStep("recipient");
          setSelectedContactDetails(null); // Clear contact when going back
        }}
        selectedContactDetails={selectedContactDetails} // Pass contact details
      />
    </>
  );
}
