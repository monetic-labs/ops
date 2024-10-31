import { SetStateAction, useEffect, useMemo, useState } from "react";
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
import NewTransferFields from "./fields/new-transfer";
import ModalFooterWithSupport from "../../generics/footer-modal-support";
import ExistingTransferFields from "./fields/existing-transfer";
import { useExistingDisbursement } from "@/hooks/bill-pay/useExistingDisbursement";
import { modal } from "@/context/reown";
import { Button } from "@nextui-org/button";
import TransferStatusView, { TransferStatus } from "@/components/generics/transfer-status";
import { buildTransfer } from "@/utils/reown";
import { useBalance } from "@/hooks/account-contracts/useBalance";
import { validateBillPay } from "@/types/validations/bill-pay";
import {
  DEFAULT_EXISTING_BILL_PAY,
  DEFAULT_NEW_BILL_PAY,
  ExistingBillPay,
  isExistingBillPay,
  NewBillPay,
} from "@/types/bill-pay";
import { useNewDisbursement } from "@/hooks/bill-pay/useNewDisbursement";

type CreateBillPayModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (billPay: NewBillPay | ExistingBillPay) => void;
  billPay: NewBillPay | ExistingBillPay;
  setBillPay: (billPay: NewBillPay | ExistingBillPay) => void;
  isWalletConnected: boolean;
  settlementAddress: Address;
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
  isWalletConnected,
  billPay,
  setBillPay,
  settlementAddress,
}: CreateBillPayModalProps) {
  const [isNewSender, setIsNewSender] = useState(false);
  const [transferStatus, setTransferStatus] = useState<TransferStatus>(TransferStatus.IDLE);
  const [formIsValid, setFormIsValid] = useState(false);
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

  useEffect(() => {
    const formValid = validateBillPay(billPay, settlementBalance);
    setFormIsValid(formValid);
  }, [billPay, settlementBalance, setFormIsValid]);

  const fee = useMemo(() => {
    if (!billPay.vendorMethod) return 0;
    return methodFees[billPay.vendorMethod] || 0;
  }, [billPay.vendorMethod]);

  const total = useMemo(() => {
    const amount = parseFloat(billPay.amount) || 0;
    return amount + amount * fee;
  }, [billPay.amount, fee]);

  const handleSave = async () => {
    if (!isWalletConnected || !settlementAddress) return;
    setTransferStatus(TransferStatus.PREPARING);
    let timeout: number = 0;

    try {
      if (!billPay.vendorMethod) {
        throw new Error("Payment method is required");
      }

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

      if (!response) {
        throw new Error(`Failed to create ${isExistingBillPay(billPay) ? "existing" : "new"} disbursement`);
      }

      const liquidationAddress = getLiquidationAddress(response, isExistingBillPay(billPay));
      const txHash = await buildTransfer({
        liquidationAddress,
        amount: billPay.amount,
        settlementAddress,
        setTransferStatus,
      });

      console.log("Transaction hash:", txHash);
      setTransferStatus(TransferStatus.SENT);
      timeout = 3000;
    } catch (error) {
      console.error("Error creating disbursement:", error);
      setTransferStatus(TransferStatus.ERROR);
      timeout = 3000;
    } finally {
      setTimeout(() => {
        onClose();
        setTransferStatus(TransferStatus.IDLE);
      }, timeout);
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

  const footerActions = [
    {
      label: "Create",
      onClick: handleSave,
      isDisabled: !formIsValid || !isWalletConnected,
    },
  ];

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

  const renderFeeAndTotal = () => {
    return (
      <ModalBody className="px-10">
        <div className="space-y-2 font-mono text-sm">
          <div className="flex justify-between">
            <span>Fee:</span>
            <div className="flex items-center gap-2">
              <Tooltip
                content={
                  billPay.vendorMethod === DisbursementMethod.WIRE
                    ? "We pass on the fees from the receiving bank. We do not add any additional fees."
                    : "We cover these fees for you."
                }
                onTouchStart={(e) => {
                  console.log("Touch started");
                }}
              >
                <Info className="text-gray-500 cursor-pointer" size={14} />
              </Tooltip>
              <span>{fee.toFixed(2) === "0.00" ? "Free" : `${fee * 100}%`}</span>
            </div>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </ModalBody>
    );
  };

  return (
    <Modal isOpen={isOpen} size="2xl" onClose={onClose}>
      <ModalContent className="relative">
        {transferStatus !== TransferStatus.IDLE && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
            <TransferStatusView status={transferStatus} />
          </div>
        )}
        <ModalHeader>Create New Transfer</ModalHeader>
        <ModalBody className="overflow-y-auto max-h-[50vh] relative">{renderTransferFields()}</ModalBody>
        {!isWalletConnected && <div className="absolute inset-0 bg-gray-500 bg-opacity-50 z-10"></div>}
        <Divider className="my-4" />
        {renderFeeAndTotal()}
        <Divider className="my-1" />
        <ModalFooterWithSupport
          onSupportClick={handleSupportClick}
          isNewSender={isNewSender}
          onNewSenderChange={handleNewSenderChange}
          actions={footerActions}
        />
        {!isWalletConnected && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <Button
              color="primary"
              onPress={async () => {
                await modal.open();
              }}
            >
              Connect Wallet
            </Button>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
