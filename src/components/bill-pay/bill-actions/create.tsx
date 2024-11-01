import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@nextui-org/modal";
import { Divider } from "@nextui-org/divider";
import { Tooltip } from "@nextui-org/tooltip";
import { DisbursementMethod } from "@backpack-fux/pylon-sdk";

import ModalFooterWithSupport from "../../generics/footer-modal-support";

import NewTransferFields from "./fields/new-transfer";
import ExistingTransferFields from "./fields/existing-transfer";

type CreateBillPayModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newBillPay: NewBillPay) => void;
};

export type NewBillPay = {
  vendorName: string;
  vendorBankName: string;
  vendorMethod?: DisbursementMethod;
  currency: string;
  routingNumber: string;
  accountNumber: string;
  memo?: string;
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

// TODO: get this data from backend
export const vendorMethods: DisbursementMethod[] = [DisbursementMethod.ACH_SAME_DAY, DisbursementMethod.WIRE];
export const vendorCurrencies: Currency[] = [Currency.USD];

const methodFees: Record<DisbursementMethod, number> = {
  [DisbursementMethod.ACH_SAME_DAY]: 0,
  [DisbursementMethod.WIRE]: 0.02,
};

export const DEFAULT_BILL_PAY: NewBillPay = {
  vendorName: "",
  vendorMethod: undefined,
  currency: Currency.USD,
  vendorBankName: "",
  routingNumber: "",
  accountNumber: "",
  memo: "",
  amount: "",
  fee: "",
  total: "",
};

export default function CreateBillPayModal({ isOpen, onClose, onSave }: CreateBillPayModalProps) {
  const [newBillPay, setNewBillPay] = useState<NewBillPay>(DEFAULT_BILL_PAY);
  const [isNewSender, setIsNewSender] = useState(false);
  const [showMemo, setShowMemo] = useState(false);

  const fee = useMemo(() => {
    if (!newBillPay.vendorMethod) return 0;

    return methodFees[newBillPay.vendorMethod] || 0;
  }, [newBillPay.vendorMethod]);

  const total = useMemo(() => {
    const amount = parseFloat(newBillPay.amount) || 0;

    return amount + amount * fee;
  }, [newBillPay.amount, fee]);

  const handleSave = () => {
    onSave({ ...newBillPay, fee: fee.toFixed(2), total: total.toFixed(2) });
    onClose();
  };

  const handleSupportClick = () => {
    // Handle support action
    console.log("Support clicked");
  };

  const footerActions = [
    {
      label: "Create",
      onClick: handleSave,
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      size="2xl"
      onClose={() => {
        setNewBillPay(DEFAULT_BILL_PAY);
        onClose();
      }}
    >
      <ModalContent>
        <ModalHeader>Create New Transfer</ModalHeader>
        <ModalBody className="overflow-y-auto max-h-[50vh] relative">
          {isNewSender ? (
            <NewTransferFields newBillPay={newBillPay} setNewBillPay={setNewBillPay} showMemo={showMemo} />
          ) : (
            <ExistingTransferFields
              isNewSender={isNewSender}
              newBillPay={newBillPay}
              setIsNewSender={setIsNewSender}
              setNewBillPay={setNewBillPay}
            />
          )}
        </ModalBody>
        <Divider className="my-4" />
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
        <Divider className="my-1" />
        <ModalFooterWithSupport
          actions={footerActions}
          isNewSender={isNewSender}
          onNewSenderChange={setIsNewSender}
          onSupportClick={handleSupportClick}
        />
      </ModalContent>
    </Modal>
  );
}
