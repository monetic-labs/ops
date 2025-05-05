"use client";

import React, { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { DollarSign } from "lucide-react";
import { Chip } from "@heroui/chip";
import { GetOrderLinksOutput, ISO4217Currency } from "@monetic-labs/sdk";

import { formatCurrencyInput } from "@/utils/helpers";
import pylon from "@/libs/monetic-sdk";

interface CreateInStoreRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (order: GetOrderLinksOutput) => Promise<void>;
}

export default function CreateInStoreRequestModal({ isOpen, onClose, onCreate }: CreateInStoreRequestModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState("");

  const validateAmount = (value: string) => {
    const numericValue = parseFloat(value.replace(/[^\d.]/g, ""));
    if (isNaN(numericValue)) return "Please enter a valid amount";
    if (numericValue < 1) return "Amount must be at least $1.00";
    if (numericValue > 1000000) return "Amount cannot exceed $1,000,000";
    return "";
  };

  const handleAmountChange = (value: string) => {
    let formattedValue = value;
    const cleanValue = value.replace(/[^\d.]/g, "");
    const parts = cleanValue.split(".");

    if (parts.length > 2) {
      formattedValue = parts[0] + "." + parts[1];
    } else if (parts.length === 2) {
      formattedValue = parts[0] + "." + parts[1].slice(0, 2);
    } else {
      formattedValue = cleanValue;
    }

    if (!formattedValue.endsWith(".")) {
      const numericValue = parseFloat(formattedValue);
      if (!isNaN(numericValue)) {
        formattedValue = formatCurrencyInput(numericValue.toString());
      }
    }

    setAmount(formattedValue);
    setAmountError(validateAmount(formattedValue));
  };

  const isFormValid = () => {
    return amount && !amountError;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;

    setIsLoading(true);
    setError(null);

    try {
      const amountInCents = Math.round(parseFloat(amount.replace(/[^\d.]/g, "")) * 100);
      const response = await pylon.createOrderLink({
        customer: { email: "", phone: "" }, // Provide empty strings if properties are optional in practice
        order: {
          subtotal: amountInCents,
          currency: ISO4217Currency.USD,
        },
      });

      // Construct a simplified order object for the callback
      const newOrder: GetOrderLinksOutput = {
        id: response.orderLink,
        customer: { email: "", phone: "" }, // Provide empty strings to match type
        order: {
          subtotal: amountInCents,
          currency: ISO4217Currency.USD,
        },
        expiresAt: response.expiresAt,
      };

      await onCreate(newOrder);
      handleClose();
    } catch (err) {
      console.error("Failed to create in-store order:", err);
      setError("Failed to create order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setAmount("");
    setAmountError("");
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} size="md" onClose={handleClose}>
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex justify-center">Create In-Store Payment Request</ModalHeader>
            <ModalBody className="flex flex-col items-center text-center">
              <p className="text-sm text-foreground/70 pb-4 max-w-sm">
                Enter the amount for the in-store payment. A QR code and payment link will be generated for the customer
                to scan or use with <span className="font-bold">Monetic Pay</span>.
              </p>
              <Input
                isRequired
                autoFocus
                labelPlacement="outside"
                label="Enter Amount"
                placeholder="0.00"
                classNames={{
                  inputWrapper: "border-none shadow-none bg-transparent flex items-center",
                  input: "text-5xl font-medium text-center focus:outline-none placeholder:text-foreground/20",
                  label: "sr-only",
                }}
                startContent={<DollarSign className="w-8 h-8 text-foreground/30 mr-1" />}
                endContent={<span className="text-2xl font-medium text-foreground/30 ml-2">USD</span>}
                value={amount}
                variant="bordered"
                onChange={(e) => handleAmountChange(e.target.value)}
              />
              <div className="flex gap-2 pt-4 pb-2">
                {[10, 20, 50, 100].map((presetAmount) => (
                  <Chip
                    key={presetAmount}
                    variant="flat"
                    color="default"
                    className="cursor-pointer hover:bg-content3"
                    onClick={() => handleAmountChange(presetAmount.toString())}
                  >
                    ${presetAmount}
                  </Chip>
                ))}
              </div>
              {error && <p className="text-danger text-sm pt-2">{error}</p>}
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={handleClose}>
                Cancel
              </Button>
              <Button color="primary" isDisabled={!isFormValid() || true} isLoading={isLoading} onPress={handleSubmit}>
                Generate Request
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
