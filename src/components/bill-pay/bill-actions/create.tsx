"use client";

import { useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@nextui-org/modal";
import { Divider } from "@nextui-org/divider";
import { Tooltip } from "@nextui-org/tooltip";
import {
  DisbursementMethod,
  MerchantDisbursementUpdateOutput,
  MerchantDisbursementCreateOutput,
} from "@backpack-fux/pylon-sdk";
import { Address } from "viem";
import { toast } from "sonner";

import { useExistingDisbursement } from "@/hooks/bill-pay/useExistingDisbursement";
import { TransferStatus, TransferStatusOverlay } from "@/components/generics/transfer-status";
import { executeNestedTransaction } from "@/utils/safe/flows/nested";
import { useBalance } from "@/hooks/account-contracts/useBalance";
import { validateBillPay } from "@/validations/bill-pay";
import {
  DEFAULT_EXISTING_BILL_PAY,
  DEFAULT_NEW_BILL_PAY,
  ExistingBillPay,
  isExistingBillPay,
  NewBillPay,
} from "@/types/bill-pay";
import { useNewDisbursement } from "@/hooks/bill-pay/useNewDisbursement";
import { useUser } from "@/contexts/UserContext";
import { BASE_USDC } from "@/utils/constants";
import { createERC20TransferTemplate } from "@/utils/safe/templates";

import ModalFooterWithSupport from "../../generics/footer-modal-support";

import ExistingTransferFields from "./fields/existing-transfer";
import NewTransferFields from "./fields/new-transfer";

type CreateBillPayModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (billPay: NewBillPay | ExistingBillPay) => void;
  billPay: NewBillPay | ExistingBillPay;
  setBillPay: (billPay: NewBillPay | ExistingBillPay) => void;
  settlementAddress: Address;
  onSuccess?: () => void;
};

const methodFees: Record<DisbursementMethod, number> = {
  [DisbursementMethod.ACH_SAME_DAY]: 0,
  [DisbursementMethod.WIRE]: 0.02,
};

const getLiquidationAddress = (
  response: MerchantDisbursementUpdateOutput | MerchantDisbursementCreateOutput,
  isExisting: boolean
): Address => {
  if (isExisting) {
    // For existing disbursements (MerchantDisbursementUpdateOutput)
    return response.address as Address;
  } else {
    // For new disbursements (MerchantDisbursementCreateOutput)
    const createResponse = response as MerchantDisbursementCreateOutput;

    return createResponse.disbursements[0].address as Address;
  }
};

export default function CreateBillPayModal({
  isOpen,
  onClose,
  onSave,
  billPay,
  setBillPay,
  settlementAddress,
  onSuccess,
}: CreateBillPayModalProps) {
  const { user, credentials, isAuthenticated } = useUser();
  const [isNewSender, setIsNewSender] = useState(false);
  const [transferStatus, setTransferStatus] = useState<TransferStatus>(TransferStatus.IDLE);
  const [formIsValid, setFormIsValid] = useState(false);

  // Reset internal state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setTransferStatus(TransferStatus.IDLE);
      setIsNewSender(false);
      setFormIsValid(false);
    }
  }, [isOpen]);

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

  const fee = useMemo(() => {
    if (!billPay.vendorMethod) return 0;

    return methodFees[billPay.vendorMethod] || 0;
  }, [billPay.vendorMethod]);

  const total = useMemo(() => {
    const amount = parseFloat(billPay.amount) || 0;

    return amount + amount * fee;
  }, [billPay.amount, fee]);

  useEffect(() => {
    const formValid = validateBillPay(billPay, settlementBalance);

    setFormIsValid(formValid);
  }, [billPay, settlementBalance]);

  if (!credentials) {
    if (isAuthenticated) {
      toast.error("Please set up a passkey to make transfers");
      onClose();
    }

    return null;
  }

  const handleSave = async () => {
    if (!settlementAddress || !user?.walletAddress) return;

    try {
      console.log("=== Bill Payment Debug: Starting payment process ===");
      console.log("settlementAddress:", settlementAddress);
      console.log("user.walletAddress:", user.walletAddress);
      console.log("billPay details:", {
        amount: billPay.amount,
        vendorMethod: billPay.vendorMethod,
        isExisting: isExistingBillPay(billPay),
      });

      if (!billPay.vendorMethod) {
        throw new Error("Payment method is required");
      }

      console.log("Creating disbursement...");
      const response = isExistingBillPay(billPay)
        ? await createExistingDisbursement(billPay.disbursementId, {
            amount: billPay.amount,
            disbursementMethod: billPay.vendorMethod,
            ...(billPay.vendorMethod === DisbursementMethod.WIRE && { wireMessage: billPay.memo }),
            ...(billPay.vendorMethod === DisbursementMethod.ACH_SAME_DAY && {
              achReference: billPay.memo,
            }),
          })
        : await createNewDisbursement({
            accountOwnerName: billPay.vendorName,
            bankName: billPay.vendorBankName,
            accountNumber: billPay.accountNumber,
            routingNumber: billPay.routingNumber,
            address: billPay.address,
            returnAddress: settlementAddress,
            amount: parseFloat(billPay.amount),
            paymentRail: billPay.vendorMethod,
            ...(billPay.vendorMethod === DisbursementMethod.WIRE && {
              wireMessage: billPay.memo,
            }),
            ...(billPay.vendorMethod === DisbursementMethod.ACH_SAME_DAY && {
              achReference: billPay.memo,
            }),
          });

      console.log("Disbursement created successfully:", response);

      if (!response) {
        throw new Error(`Failed to create ${isExistingBillPay(billPay) ? "existing" : "new"} disbursement`);
      }

      const liquidationAddress = getLiquidationAddress(response, isExistingBillPay(billPay));

      console.log("Liquidation address:", liquidationAddress);

      console.log("Creating ERC20 transfer template...");
      const erc20TransferTemplate = createERC20TransferTemplate({
        tokenAddress: BASE_USDC.ADDRESS,
        toAddress: liquidationAddress,
        amount: billPay.amount,
        decimals: BASE_USDC.DECIMALS,
      });

      console.log("Transfer template created:", erc20TransferTemplate);

      console.log("Executing nested transaction...");
      await executeNestedTransaction({
        fromSafeAddress: user.walletAddress as Address,
        throughSafeAddress: settlementAddress,
        transactions: [erc20TransferTemplate],
        credentials,
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

  const handleNewSenderChange = (newValue: boolean) => {
    setIsNewSender(newValue);
    setBillPay(newValue ? DEFAULT_NEW_BILL_PAY : DEFAULT_EXISTING_BILL_PAY);
  };

  const handleSupportClick = () => {
    // Handle support action
    console.log("Support clicked");
  };

  const renderTransferFields = () => {
    return isNewSender ? (
      <NewTransferFields
        billPay={billPay as NewBillPay}
        setBillPay={setBillPay}
        settlementBalance={settlementBalance}
      />
    ) : (
      <ExistingTransferFields
        billPay={billPay as ExistingBillPay}
        setBillPay={setBillPay}
        setIsNewSender={handleNewSenderChange}
        settlementBalance={settlementBalance}
      />
    );
  };

  const footerActions = [
    {
      label: "Create Transfer",
      onClick: handleSave,
      isDisabled: !formIsValid,
      className: `${
        !formIsValid
          ? "bg-content2 text-default-400 cursor-not-allowed"
          : "bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
      } px-6`,
    },
  ];

  const isActiveTransfer = transferStatus !== TransferStatus.IDLE;

  const handleResetTransferStatus = () => {
    setTransferStatus(TransferStatus.IDLE);
  };

  // Create transfer details component for the overlay
  const transferDetailsComponent = (
    <div className="bg-content2/50 border border-border rounded-xl p-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-foreground/60">Recipient</span>
        <span className="font-medium">{isExistingBillPay(billPay) ? billPay.vendorName : billPay.vendorName}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-foreground/60">Amount</span>
        <span className="font-medium">${parseFloat(billPay.amount).toFixed(2)}</span>
      </div>
      {billPay.memo && (
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-foreground/60">Memo</span>
          <span className="font-medium">{billPay.memo}</span>
        </div>
      )}
    </div>
  );

  return (
    <Modal
      classNames={{
        base: "bg-content1",
        header: "border-b border-default-100",
        body: "py-6",
        closeButton: "hover:bg-default-100",
      }}
      data-testid="create-transfer-modal"
      isOpen={isOpen}
      size="2xl"
      onClose={isActiveTransfer && transferStatus !== TransferStatus.ERROR ? () => {} : onClose}
    >
      <ModalContent className="relative">
        {isActiveTransfer ? (
          <div className="p-6">
            <TransferStatusOverlay
              status={transferStatus}
              transferDetails={transferDetailsComponent}
              onComplete={onClose}
              onReset={handleResetTransferStatus}
            />
          </div>
        ) : (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h3 className="text-xl font-semibold text-foreground">Create New Transfer</h3>
              <p className="text-sm text-default-500">Fill in the details below to create a new transfer</p>
            </ModalHeader>
            <Divider className="bg-default-100" />
            <ModalBody className="overflow-y-auto max-h-[50vh] relative px-6">{renderTransferFields()}</ModalBody>
            <Divider className="bg-default-100" />
            <ModalBody className="px-6">
              <div className="space-y-3 font-mono text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-default-600">Fee:</span>
                  <div className="flex items-center gap-2">
                    <Tooltip
                      classNames={{
                        base: "bg-content2/80 backdrop-blur-sm",
                        content: "text-foreground",
                      }}
                      content={
                        <div className="px-2 py-1 text-sm">
                          {billPay.vendorMethod === DisbursementMethod.WIRE
                            ? "We pass on the fees from the receiving bank. We do not add any additional fees."
                            : "We cover these fees for you."}
                        </div>
                      }
                    >
                      <Info className="text-default-500 dark:text-default-400 cursor-help" size={14} />
                    </Tooltip>
                    <span className="text-default-600" data-testid="fee">
                      {fee.toFixed(2) === "0.00" ? "Free" : `${fee * 100}%`}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-foreground">Total:</span>
                  <span className="text-lg font-semibold text-foreground" data-testid="total">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>
            </ModalBody>
            <Divider className="bg-default-100" />
            <ModalFooterWithSupport
              actions={footerActions}
              isNewSender={isNewSender}
              onNewSenderChange={(value) => {
                setIsNewSender(value);
                setBillPay(value ? DEFAULT_NEW_BILL_PAY : DEFAULT_EXISTING_BILL_PAY);
              }}
              onSupportClick={handleSupportClick}
            />
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
