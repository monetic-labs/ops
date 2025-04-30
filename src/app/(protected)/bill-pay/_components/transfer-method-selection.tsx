"use client";

import { useState, useEffect, useMemo } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Avatar } from "@heroui/avatar";
import { Input } from "@heroui/input";
import { Divider } from "@heroui/divider";
import { Chip } from "@heroui/chip";
import { Info, Building, CreditCard, Zap, Clock } from "lucide-react";
import { Tooltip } from "@heroui/tooltip";
import { DisbursementMethod, FiatCurrency } from "@monetic-labs/sdk";
import { Address } from "viem";

import { ExistingBillPay, NewBillPay, isExistingBillPay } from "@/types/bill-pay";
import { getOpepenAvatar } from "@/utils/helpers";
import { TransferStatus, TransferStatusOverlay } from "@/components/generics/transfer-status";
import { FieldLabel, getValidationProps, FieldValidationOutput } from "@/validations/bill-pay";

// Import or use the same SelectedContact interface defined in create-transfer-flow.tsx
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
}

type TransferMethodSelectionProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (billPay: ExistingBillPay | NewBillPay) => void;
  billPay: ExistingBillPay | NewBillPay;
  setBillPay: (billPay: ExistingBillPay | NewBillPay) => void;
  settlementBalance?: string;
  transferStatus: TransferStatus;
  onResetTransferStatus: () => void;
  onBack?: () => void;
  selectedContactDetails?: SelectedContact | null;
};

// Map of method fees
const methodFees: Record<DisbursementMethod, number> = {
  [DisbursementMethod.ACH_SAME_DAY]: 0.0025, // 0.25%
  [DisbursementMethod.WIRE]: 0.02, // 2%
};

// Define data for ALL possible payment method cards (Keep this as the main source)
const allPaymentMethodOptions = [
  {
    method: DisbursementMethod.ACH_SAME_DAY,
    title: "ACH Same-Day",
    description: "Fast processing (0-1 business days)",
    Icon: Zap,
    selectedBorderColor: "border-primary",
    selectedBgColor: "bg-primary/5",
    selectedIconColor: "text-primary",
    selectedIconBgColor: "bg-primary/20",
  },
  {
    method: DisbursementMethod.WIRE,
    title: "Wire Transfer",
    description: "Standard processing (up to 90 minutes)",
    Icon: Clock,
    selectedBorderColor: "border-primary",
    selectedBgColor: "bg-primary/5",
    selectedIconColor: "text-primary",
    selectedIconBgColor: "bg-primary/20",
  },
];

export default function TransferMethodSelection({
  isOpen,
  onClose,
  onSubmit,
  billPay,
  setBillPay,
  settlementBalance,
  transferStatus,
  onResetTransferStatus,
  onBack,
  selectedContactDetails,
}: TransferMethodSelectionProps) {
  const [formIsValid, setFormIsValid] = useState(false);
  const [availableMethods, setAvailableMethods] = useState<DisbursementMethod[]>([]);
  const [amountValidation, setAmountValidation] = useState<FieldValidationOutput>({ isInvalid: true });

  useEffect(() => {
    // Set available methods based on contact/recipient type
    if (isExistingBillPay(billPay) && billPay.vendorName) {
      // In a real implementation, we would get available methods from the contact
      setAvailableMethods([DisbursementMethod.ACH_SAME_DAY, DisbursementMethod.WIRE]);
    } else {
      setAvailableMethods([DisbursementMethod.ACH_SAME_DAY, DisbursementMethod.WIRE]);
    }
  }, [billPay]);

  // Calculate fee based on method
  const feeRate = billPay.vendorMethod ? methodFees[billPay.vendorMethod] || 0 : 0;
  const amount = parseFloat(billPay.amount || "0");
  const feeAmount = amount * feeRate;
  const totalAmount = amount + feeAmount;

  // Check if the form is valid and calculate amount validation
  useEffect(() => {
    // Basic checks: method selected, amount entered and > 0
    const basicChecksPass = !!billPay.vendorMethod && !!billPay.amount && parseFloat(billPay.amount) > 0;
    if (!basicChecksPass) {
      // Calculate validation even if basic checks fail, to show initial required message if needed
      const validationResult = getValidationProps({
        label: FieldLabel.AMOUNT,
        value: billPay.amount,
        currency: billPay.currency,
        balance: settlementBalance,
        method: billPay.vendorMethod,
      });
      setAmountValidation(validationResult);
      setFormIsValid(false);
      return;
    }

    // Balance check
    if (settlementBalance) {
      const balanceValue = parseFloat(settlementBalance);
      const amountValue = parseFloat(billPay.amount);
      if (amountValue > balanceValue) {
        // Calculate validation to potentially show balance error message
        const validationResult = getValidationProps({
          label: FieldLabel.AMOUNT,
          value: billPay.amount,
          currency: billPay.currency,
          balance: settlementBalance,
          method: billPay.vendorMethod,
        });
        setAmountValidation(validationResult);
        setFormIsValid(false);
        return;
      }
    }

    // --- Calculate and store amount validation result ---
    const currentAmountValidation = getValidationProps({
      label: FieldLabel.AMOUNT,
      value: billPay.amount,
      currency: billPay.currency,
      balance: settlementBalance,
      method: billPay.vendorMethod,
    });
    setAmountValidation(currentAmountValidation); // Store the result in state

    // --- Set form validity based on the validation result ---
    if (currentAmountValidation.isInvalid) {
      setFormIsValid(false);
      // return; // No need to return here, let it fall through
    } else {
      // If all checks pass
      setFormIsValid(true);
    }
  }, [billPay, settlementBalance]); // Dependencies remain the same

  // Handle method selection - Updated
  const handleMethodSelect = (method: DisbursementMethod) => {
    let updatedBillPay: Partial<ExistingBillPay | NewBillPay> = { vendorMethod: method };

    if (selectedContactDetails) {
      // Find the specific disbursement for the selected method
      const selectedDisbursement = selectedContactDetails.disbursements.find((d) => d.method === method);

      if (selectedDisbursement) {
        updatedBillPay = {
          ...updatedBillPay,
          type: "existing",
          disbursementId: selectedDisbursement.id,
          memo: selectedDisbursement.paymentMessage || "", // Set memo from disbursement if available
        };
      } else {
        // Handle case where the method isn't found for the contact (should ideally not happen if UI is correct)
        console.error(`Disbursement method ${method} not found for contact ${selectedContactDetails.id}`);
        // Fallback or show error?
        updatedBillPay.type = "existing"; // Still mark as existing type
      }
    } else {
      // It's a new recipient
      updatedBillPay.type = "new";
    }

    // Merge the updates with the existing billPay state
    setBillPay({
      ...billPay,
      ...updatedBillPay,
    } as ExistingBillPay | NewBillPay); // Assert type after merging
  };

  // Create transfer details component for the overlay
  const transferDetailsComponent = (
    <div className="bg-content2/50 border border-border rounded-xl p-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-foreground/60">Recipient</span>
        <span className="font-medium">{billPay.vendorName}</span>
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
      isOpen={isOpen}
      onClose={transferStatus !== TransferStatus.IDLE ? () => {} : onClose}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: "bg-content1 max-h-[90vh]",
        header: "border-b border-default-100 flex flex-col items-start",
        body: "p-0",
        footer: "border-t border-default-100",
      }}
    >
      <ModalContent>
        {transferStatus !== TransferStatus.IDLE && transferStatus !== TransferStatus.ERROR ? (
          <div className="p-6">
            <TransferStatusOverlay
              status={transferStatus}
              transferDetails={transferDetailsComponent}
              onComplete={onClose}
              onReset={onResetTransferStatus}
            />
          </div>
        ) : (
          <>
            <ModalHeader>
              <h2 className="text-xl font-semibold mb-1">Transfer Details</h2>
              <p className="text-default-500 text-sm">Choose payment method and enter amount</p>
            </ModalHeader>
            <Divider />
            <ModalBody className="p-6 overflow-y-auto">
              {/* Recipient summary */}
              <Card className="mb-6 bg-default-50 border border-default-200 flex-shrink-0">
                <CardBody className="flex flex-row items-center gap-4 p-4">
                  <Avatar
                    radius="lg"
                    size="lg"
                    src={getOpepenAvatar(billPay.vendorName, 48)}
                    fallback={billPay.vendorName.charAt(0)}
                    className="bg-primary/10 text-primary"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{billPay.vendorName}</h4>
                    <div className="flex items-center gap-2 mt-1 text-small text-default-500">
                      <Building size={14} />
                      <span>{billPay.vendorBankName}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-small text-default-500">
                      <CreditCard size={14} />
                      <span>••••{billPay.accountNumber.slice(-4)}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Payment method selection - Shows all, disables unavailable */}
              <div className="mb-6">
                <h3 className="text-medium font-semibold mb-3">Payment Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* --- Map over ALL paymentMethodOptions --- */}
                  {allPaymentMethodOptions.map((option) => {
                    const isSelected = billPay.vendorMethod === option.method;
                    // --- Check if method is available for the selected contact ---
                    let isAvailable = true;
                    if (selectedContactDetails && selectedContactDetails.disbursements) {
                      const availableContactMethods = selectedContactDetails.disbursements.map((d) => d.method);
                      isAvailable = availableContactMethods.includes(option.method);
                    }

                    const cardFeeRate = methodFees[option.method] || 0; // Get fee for THIS card

                    return (
                      <Card
                        key={option.method}
                        isPressable={isAvailable} // Only pressable if available
                        isHoverable={isAvailable} // Only hoverable if available
                        isDisabled={!isAvailable} // Set disabled state
                        className={`border-2 text-center transition-opacity ${
                          isSelected
                            ? `${option.selectedBorderColor} ${option.selectedBgColor}`
                            : "border-transparent bg-default-50/50"
                        } ${!isAvailable ? "opacity-50 cursor-not-allowed" : ""}`}
                        onPress={() => {
                          if (isAvailable) {
                            // Only handle select if available
                            handleMethodSelect(option.method);
                          }
                        }}
                      >
                        <CardBody className="flex flex-col items-center justify-center gap-1 p-4">
                          <div className="relative">
                            <div
                              className={`p-2 rounded-full ${isSelected && isAvailable ? option.selectedIconBgColor : "bg-default-100"}`}
                            >
                              <option.Icon
                                size={20}
                                className={`${isSelected && isAvailable ? option.selectedIconColor : "text-default-600"}`}
                              />
                            </div>
                          </div>
                          <div className="flex flex-col items-center justify-center text-center">
                            <h4 className="font-medium">{option.title}</h4>
                            <p className="text-xs text-default-500">{option.description}</p>
                            {/* --- Display Fee Rate --- */}
                            <p className="text-xs text-primary font-medium mt-1">
                              ({`${(cardFeeRate * 100).toFixed(2)}%`} Fee)
                            </p>
                            {/* --- Add text if not available --- */}
                            {!isAvailable && <p className="text-xs text-warning-600 mt-1">(Not configured)</p>}
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Conditionally render Amount, Reference, and Fee/Total */}
              {billPay.vendorMethod && (
                <>
                  {/* Combined Reference and Amount section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Reference/Message field */}
                    <div className="w-full">
                      <Input
                        label={billPay.vendorMethod === DisbursementMethod.WIRE ? "Wire Message" : "ACH Reference"}
                        placeholder={
                          billPay.vendorMethod === DisbursementMethod.WIRE
                            ? "Add a message (max 35 characters)"
                            : "Add a reference (max 10 characters)"
                        }
                        // --- Disable ACH Memo and add description ---
                        isDisabled={billPay.vendorMethod === DisbursementMethod.ACH_SAME_DAY}
                        description={
                          billPay.vendorMethod === DisbursementMethod.ACH_SAME_DAY
                            ? "ACH Reference editing is temporarily disabled while we resolve an issue."
                            : undefined
                        }
                        maxLength={billPay.vendorMethod === DisbursementMethod.WIRE ? 35 : 10}
                        value={billPay.memo || ""}
                        onChange={(e) => setBillPay({ ...billPay, memo: e.target.value || undefined })}
                        {...getValidationProps({
                          label: FieldLabel.MEMO,
                          value: billPay.memo || "",
                          currency: billPay.currency,
                          method: billPay.vendorMethod,
                        })}
                      />
                    </div>

                    {/* Amount field */}
                    <div className="w-full">
                      <Input
                        isRequired
                        data-testid="amount"
                        inputMode="decimal"
                        label={FieldLabel.AMOUNT}
                        type="number"
                        placeholder="0.00"
                        value={billPay.amount}
                        onChange={(e) => {
                          const value = e.target.value;
                          const regex = /^\d*\.?\d{0,2}$/;
                          if (regex.test(value) || value === "") {
                            setBillPay({ ...billPay, amount: value });
                          }
                        }}
                        {...amountValidation}
                        endContent={
                          <div className="flex items-center py-2">
                            <select
                              className="outline-none border-0 bg-transparent text-default-400 text-small"
                              id="currency"
                              name="currency"
                              value={billPay.currency}
                              onChange={(e) => setBillPay({ ...billPay, currency: e.target.value as FiatCurrency })}
                            >
                              {Object.values(FiatCurrency).map((currency) => (
                                <option key={currency} value={currency}>
                                  {currency}
                                </option>
                              ))}
                            </select>
                          </div>
                        }
                        startContent={
                          <div className="pointer-events-none flex items-center">
                            <span className="text-default-400 text-small">$</span>
                          </div>
                        }
                      />
                    </div>
                  </div>

                  {/* Fee and total calculation - Relabeled */}
                  <div className="space-y-3 font-mono text-sm p-4 bg-default-50 rounded-xl border border-default-200">
                    <div className="flex justify-between items-center">
                      <span className="text-default-600">Subtotal:</span>
                      <span className="text-default-600">${amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-default-600">Fee:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-default-600" data-testid="fee">
                          {`${(feeRate * 100).toFixed(2)}%`}
                        </span>
                        <span className="text-default-500 text-xs">(${feeAmount.toFixed(2)})</span>
                      </div>
                    </div>
                    <Divider className="my-1" />
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-foreground">Total:</span>
                      <span className="text-lg font-semibold text-foreground" data-testid="total">
                        ${totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </ModalBody>
            <Divider />
            <ModalFooter className="flex justify-between">
              <Button variant="flat" color="default" onPress={onBack || onClose}>
                Back
              </Button>
              <Button color="primary" isDisabled={!formIsValid} onPress={() => onSubmit(billPay)}>
                Create Transfer
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
