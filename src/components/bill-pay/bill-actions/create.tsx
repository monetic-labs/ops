import { SetStateAction, useMemo, useState } from "react";
import { Info } from "lucide-react";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@nextui-org/modal";
import { Divider } from "@nextui-org/divider";
import { Tooltip } from "@nextui-org/tooltip";
import { DisbursementMethod } from "@backpack-fux/pylon-sdk";
import { Address } from "viem";
import NewTransferFields from "./fields/new-transfer";
import ModalFooterWithSupport from "../../generics/footer-modal-support";
import ExistingTransferFields from "./fields/existing-transfer";
import { useExistingDisbursement } from "@/hooks/bill-pay/useExistingDisbursement";
import { useAppKitAccount, useDisconnect } from "@reown/appkit/react";
import { modal } from "@/context/reown";
import { Button } from "@nextui-org/button";
import TransferStatusView, { TransferStatus } from "@/components/generics/transfer-status";
import { buildTransfer } from "@/utils/bill-pay-transfer";

type CreateBillPayModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newBillPay: NewBillPay) => void;
  newBillPay: NewBillPay;
  setNewBillPay: (newBillPay: NewBillPay) => void;
  isWalletConnected: boolean;
};

export type NewBillPay = {
  vendorName: string;
  vendorBankName: string;
  vendorMethod?: DisbursementMethod;
  currency: string;
  routingNumber: string;
  accountNumber: string;
  memo?: string;
  disbursementId?: string;
  amount: string;
  fee: string;
  total: string;
};

export enum Currency {
  USD = "USD",
}

export enum Countries {
  CAN = "Canada",
  CYM = "Cayman Islands",
  USA = "United States",
  VGB = "British Virgin Islands",
}

export enum States {
  NY = "New York",
  CA = "California",
  TX = "Texas",
}

export const vendorCurrencies: Currency[] = [Currency.USD];

const methodFees: Record<DisbursementMethod, number> = {
  [DisbursementMethod.ACH_SAME_DAY]: 0,
  [DisbursementMethod.WIRE]: 0.02,
};

export default function CreateBillPayModal({
  isOpen,
  onClose,
  onSave,
  isWalletConnected,
  setNewBillPay,
  newBillPay,
}: CreateBillPayModalProps) {
  const [isNewSender, setIsNewSender] = useState(false);
  const [transferStatus, setTransferStatus] = useState<TransferStatus>(TransferStatus.IDLE);
  const {
    disbursement,
    isLoading: isLoadingDisbursement,
    error,
    createExistingDisbursement,
  } = useExistingDisbursement();

  const fee = useMemo(() => {
    if (!newBillPay.vendorMethod) return 0;
    return methodFees[newBillPay.vendorMethod] || 0;
  }, [newBillPay.vendorMethod]);

  const total = useMemo(() => {
    const amount = parseFloat(newBillPay.amount) || 0;
    return amount + amount * fee;
  }, [newBillPay.amount, fee]);

  const handleSave = async () => {
    if (!isWalletConnected) return;
    try {
      // Create existing disbursement
      if (newBillPay.disbursementId && newBillPay.vendorMethod) {
        const response = await createExistingDisbursement(newBillPay.disbursementId, {
          amount: newBillPay.amount,
          disbursementMethod: newBillPay.vendorMethod,
          ...(newBillPay.vendorMethod === DisbursementMethod.WIRE && { wireMessage: newBillPay.memo }),
          ...(newBillPay.vendorMethod === DisbursementMethod.ACH_SAME_DAY && {
            achReference: newBillPay.memo,
          }),
        });
        console.log("Existing disbursement response:", response);

        if (!response) throw new Error("Failed to create disbursement");

        await buildTransfer({ liquidationAddress: response.address as Address, amount: newBillPay.amount });
        // TODO: tell user funds have been sent
        setTransferStatus(TransferStatus.WAITING);
      } else if (!newBillPay.disbursementId && newBillPay.vendorMethod) {
        // TODO: Create new disbursement
      }
    } catch (error) {
      console.error("Error creating disbursement:", error);
      setTransferStatus(TransferStatus.IDLE);
      // TODO: Handle error case
    } finally {
      onClose();
    }
  };

  const handleTransactionApproved = () => {
    setTransferStatus(TransferStatus.SENT);
    setTimeout(() => {
      onClose();
      setTransferStatus(TransferStatus.IDLE);
    }, 3000);
  };

  const handleSupportClick = () => {
    // Handle support action
    console.log("Support clicked");
  };

  const footerActions = [
    {
      label: "Create",
      onClick: handleSave,
      onTransactionApproved: handleTransactionApproved,
    },
  ];

  const renderTransferFields = () => {
    return isNewSender ? (
      <NewTransferFields newBillPay={newBillPay} setNewBillPay={setNewBillPay} />
    ) : (
      <ExistingTransferFields
        newBillPay={newBillPay}
        setNewBillPay={setNewBillPay}
        isNewSender={isNewSender}
        setIsNewSender={setIsNewSender}
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
                  newBillPay.vendorMethod === DisbursementMethod.WIRE
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
      <ModalContent>
        <ModalHeader>Create New Transfer</ModalHeader>
        <ModalBody className="overflow-y-auto max-h-[50vh] relative">{renderTransferFields()}</ModalBody>
        {!isWalletConnected && <div className="absolute inset-0 bg-gray-500 bg-opacity-50 z-10"></div>}
        <Divider className="my-4" />
        {renderFeeAndTotal()}
        <Divider className="my-1" />
        <ModalFooterWithSupport
          onSupportClick={handleSupportClick}
          isNewSender={isNewSender}
          onNewSenderChange={setIsNewSender}
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
        {transferStatus !== TransferStatus.IDLE && <TransferStatusView status={transferStatus} />}
      </ModalContent>
    </Modal>
  );
}
