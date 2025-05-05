import React, { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Mail, Phone, DollarSign, Info } from "lucide-react";
import { Tooltip } from "@heroui/tooltip";
import { GetOrderLinksOutput, ISO4217Currency } from "@monetic-labs/sdk";

import { formatPhoneNumber, formatCurrencyInput } from "@/utils/helpers";
import pylon from "@/libs/monetic-sdk";

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (order: GetOrderLinksOutput) => Promise<void>;
}

export default function CreateOnlineRequestModal({ isOpen, onClose, onCreate }: CreateOrderModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    amount: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    phone: "",
    amount: "",
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

    return emailRegex.test(email) ? "" : "Please enter a valid email address";
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\(\d{3}\)\s\d{3}-\d{4}$/;

    return phoneRegex.test(phone) ? "" : "Please enter a valid phone number";
  };

  const validateAmount = (amount: string) => {
    const numericValue = parseFloat(amount.replace(/[^\d.]/g, ""));

    if (isNaN(numericValue)) return "Please enter a valid amount";
    if (numericValue < 1) return "Amount must be at least $1.00";
    if (numericValue > 1000000) return "Amount cannot exceed $1,000,000";

    return "";
  };

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;
    let error = "";

    switch (field) {
      case "email":
        error = validateEmail(value);
        break;
      case "phone":
        formattedValue = formatPhoneNumber(value.replace(/\D/g, ""));
        error = validatePhone(formattedValue);
        break;
      case "amount":
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
        error = validateAmount(formattedValue);
        break;
    }

    setFormData((prev) => ({ ...prev, [field]: formattedValue }));
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const isFormValid = () => {
    return !errors.email && !errors.phone && !errors.amount && formData.email && formData.phone && formData.amount;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;

    setIsLoading(true);
    setError(null);

    try {
      const amountInCents = Math.round(parseFloat(formData.amount.replace(/[^\d.]/g, "")) * 100);
      const response = await pylon.createOrderLink({
        customer: {
          email: formData.email,
          phone: formData.phone.replace(/\D/g, ""),
        },
        order: {
          subtotal: amountInCents,
          currency: ISO4217Currency.USD,
        },
      });

      const newOrder: GetOrderLinksOutput = {
        id: response.orderLink,
        customer: {
          email: formData.email,
          phone: formData.phone,
        },
        order: {
          subtotal: amountInCents,
          currency: ISO4217Currency.USD,
        },
        expiresAt: response.expiresAt,
      };

      await onCreate(newOrder);
      handleClose();
    } catch (err) {
      console.error("Failed to create order:", err);
      setError("Failed to create order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ email: "", phone: "", amount: "" });
    setErrors({ email: "", phone: "", amount: "" });
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} size="2xl" onClose={handleClose}>
      <ModalContent>
        {() => (
          <>
            <ModalHeader>Create Payment Order</ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-sm text-foreground/70 pb-2">Customer Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      errorMessage={errors.email}
                      isInvalid={!!errors.email}
                      label={
                        <div className="flex items-center gap-1">
                          Email
                          <Tooltip content="Used for receipts, order confirmations, and potential follow-ups.">
                            <Info className="w-3 h-3 text-foreground/50 cursor-help" />
                          </Tooltip>
                        </div>
                      }
                      placeholder="customer@example.com"
                      startContent={<Mail className="w-4 h-4 text-default-400" />}
                      value={formData.email}
                      variant="bordered"
                      onChange={(e) => handleInputChange("email", e.target.value)}
                    />
                    <Input
                      errorMessage={errors.phone}
                      isInvalid={!!errors.phone}
                      label={
                        <div className="flex items-center gap-1">
                          Phone
                          <Tooltip content="Used for order confirmations (SMS) and potential follow-ups.">
                            <Info className="w-3 h-3 text-foreground/50 cursor-help" />
                          </Tooltip>
                        </div>
                      }
                      placeholder="(555) 555-5555"
                      startContent={<Phone className="w-4 h-4 text-default-400" />}
                      value={formData.phone}
                      variant="bordered"
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-col items-center text-center pt-4 pb-4 bg-content2/30 dark:bg-content1/50 rounded-lg">
                  <Input
                    label="Enter Amount"
                    labelPlacement="outside"
                    endContent={<span className="text-2xl font-medium text-foreground/30 ml-2">USD</span>}
                    errorMessage={errors.amount}
                    isInvalid={!!errors.amount}
                    placeholder="0.00"
                    classNames={{
                      inputWrapper: "border-none shadow-none bg-transparent flex items-center justify-center",
                      input: "text-5xl font-medium text-center focus:outline-none placeholder:text-foreground/20",
                      label: "text-sm text-foreground/70 pb-1",
                    }}
                    startContent={<DollarSign className="w-8 h-8 text-foreground/30 mr-1" />}
                    value={formData.amount}
                    variant="bordered"
                    onChange={(e) => handleInputChange("amount", e.target.value)}
                  />
                </div>
                {error && <p className="text-danger text-sm">{error}</p>}
                <div className="pt-2 text-xs text-foreground/60 space-y-1 bg-content2 dark:bg-content1 p-3 rounded-md border border-divider">
                  <p>
                    <strong>Note:</strong> Email and phone help with reconciliation and customer communication
                    (confirmations, refunds).
                  </p>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={handleClose}>
                Cancel
              </Button>
              <Button color="primary" isDisabled={!isFormValid()} isLoading={isLoading} onPress={handleSubmit}>
                Create Order
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
