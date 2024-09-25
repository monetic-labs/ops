import { Button } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";
import { Input } from "@nextui-org/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/modal";
import { Select, SelectItem } from "@nextui-org/select";
import { useEffect, useMemo, useState } from "react";
import ModalFooterWithSupport from "../generics/footer-modal-support";

interface CreateBillPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newBillPay: NewBillPay) => void;
}

interface NewBillPay {
  vendorName: string;
  vendorMethod: string;
  routingNumber: string;
  accountNumber: string;
  memo: string;
  internalNote: string;
  amount: string;
  fee: string;
  total: string;
}

// TODO: get this data from backend
const vendorMethods = ["ACH", "Wire", "SWIFT", "SEPA"];
const memoRequiredMethods = ["Wire", "SWIFT", "SEPA"];

export default function CreateBillPayModal({ isOpen, onClose, onSave }: CreateBillPayModalProps) {
  const [newBillPay, setNewBillPay] = useState<NewBillPay>({
    vendorName: "",
    vendorMethod: "ACH",
    routingNumber: "",
    accountNumber: "",
    memo: "",
    internalNote: "",
    amount: "",
    fee: "",
    total: "",
  });

  const [showMemo, setShowMemo] = useState(false);
  const isMemoRequired = memoRequiredMethods.includes(newBillPay.vendorMethod);

  const fee = useMemo(() => {
    const amount = parseFloat(newBillPay.amount) || 0;
    return amount * 0.02; // 2% fee
  }, [newBillPay.amount]);

  const total = useMemo(() => {
    const amount = parseFloat(newBillPay.amount) || 0;
    return amount + fee;
  }, [newBillPay.amount, fee]);

  useEffect(() => {
    if (isMemoRequired) {
      setShowMemo(true);
    } else {
      const timer = setTimeout(() => setShowMemo(false), 300); // Match this with your CSS transition time
      return () => clearTimeout(timer);
    }
  }, [isMemoRequired]);

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
    <Modal isOpen={isOpen} size="2xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader>Create New Bill Pay</ModalHeader>
        <ModalBody>
          <Input
            label="Vendor Name"
            value={newBillPay.vendorName}
            onChange={(e) => setNewBillPay({ ...newBillPay, vendorName: e.target.value })}
          />
          <Select
            label="Vendor Method"
            selectedKeys={[newBillPay.vendorMethod]}
            onChange={(e) => setNewBillPay({ ...newBillPay, vendorMethod: e.target.value })}
          >
            {vendorMethods.map((method) => (
              <SelectItem key={method} value={method}>
                {method}
              </SelectItem>
            ))}
          </Select>
          <div className={`fade-in ${isMemoRequired ? 'show' : ''}`}>
            {showMemo && (
              <Input
                label="Memo"
                value={newBillPay.memo}
                onChange={(e) => setNewBillPay({ ...newBillPay, memo: e.target.value })}
              />
            )}
          </div>
          <Input
            label="Routing Number"
            value={newBillPay.routingNumber}
            onChange={(e) => setNewBillPay({ ...newBillPay, routingNumber: e.target.value })}
          />
          <Input
            label="Account Number"
            value={newBillPay.accountNumber}
            onChange={(e) => setNewBillPay({ ...newBillPay, accountNumber: e.target.value })}
          />
          <Input
            label="Internal Note"
            value={newBillPay.internalNote}
            onChange={(e) => setNewBillPay({ ...newBillPay, internalNote: e.target.value })}
          />
          <Input
            label="Amount"
            type="number"
            value={newBillPay.amount}
            onChange={(e) => setNewBillPay({ ...newBillPay, amount: e.target.value })}
          />
          
          <Divider className="my-4" />
          
          <div className="space-y-4 font-mono">
            <div className="flex justify-between">
              <span>Amount:</span>
              <span>${parseFloat(newBillPay.amount || "0").toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Fee (2%):</span>
              <span>${fee.toFixed(2)}</span>
            </div>
            <Divider className="my-2" />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </ModalBody>
        <ModalFooterWithSupport
            onSupportClick={handleSupportClick}
            actions={footerActions}
          />
      </ModalContent>
    </Modal>
  );
}
