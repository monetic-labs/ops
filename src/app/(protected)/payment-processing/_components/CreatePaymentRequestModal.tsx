import React, { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Mail, Phone, DollarSign, Info } from "lucide-react";
import { Tooltip } from "@heroui/tooltip";
import { Chip } from "@heroui/chip";
import { ISO4217Currency, CreatePaymentLinkOutput, PaymentCustomer, CreatePaymentLinkInput } from "@monetic-labs/sdk";

import { formatPhoneNumber, formatCurrencyInput } from "@/utils/helpers";
import pylon from "@/libs/monetic-sdk";

// Define a looser customer type that allows partial fields
interface CustomerInfo {
  email?: string;
  phone?: string;
}

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (order: CreatePaymentLinkOutput) => Promise<void>;
}

export default function CreatePaymentRequestModal({ isOpen, onClose, onCreate }: CreateOrderModalProps) {
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
    if (!email) return "";
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(email) ? "" : "Please enter a valid email address";
  };

  const validatePhone = (phone: string) => {
    if (!phone) return "";
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
    // Only amount is required, customer information is completely optional
    const validEmail = !formData.email || !errors.email;
    const validPhone = !formData.phone || !errors.phone;

    return validEmail && validPhone && !errors.amount && !!formData.amount;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Create a customer object only if at least one field is filled
      const customerData: Record<string, string> = {};
      if (formData.email) customerData.email = formData.email;
      if (formData.phone) customerData.phone = formData.phone.replace(/\D/g, "");

      // Only include customer if we have data
      const requestData: CreatePaymentLinkInput = {
        order: {
          subtotal: parseFloat(formData.amount),
        },
        customer: {
          email: formData.email || undefined,
          phone: formData.phone || undefined,
        },
      };

      const response = await pylon.createPaymentLink(requestData);

      // Create the response object
      const responseCustomer: PaymentCustomer = {
        email: formData.email,
        phone: formData.phone,
      };

      const newOrder: CreatePaymentLinkOutput = {
        id: response.id,
        link: response.link,
        customer: responseCustomer,
        order: {
          subtotal: response.order.subtotal,
        },
        merchant: response.merchant,
        paymentToken: response.paymentToken,
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
    <Modal isOpen={isOpen} size="md" onClose={handleClose}>
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex justify-center">Create Payment Request</ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col items-center text-center pb-4">
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
                  <div className="flex gap-2 pt-4">
                    {[10, 20, 50, 100].map((presetAmount) => (
                      <Chip
                        key={presetAmount}
                        variant="flat"
                        color="default"
                        className="cursor-pointer hover:bg-content3"
                        onClick={() => handleInputChange("amount", presetAmount.toString())}
                      >
                        ${presetAmount}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-foreground/70 pb-2">Customer Details (Optional)</p>
                  <div className="flex flex-col gap-3">
                    <Input
                      errorMessage={errors.email}
                      isInvalid={!!errors.email}
                      label="Email"
                      placeholder="customer@example.com"
                      startContent={<Mail className="w-4 h-4 text-default-400" />}
                      value={formData.email}
                      variant="bordered"
                      onChange={(e) => handleInputChange("email", e.target.value)}
                    />
                    <Input
                      errorMessage={errors.phone}
                      isInvalid={!!errors.phone}
                      label="Phone"
                      placeholder="(555) 555-5555"
                      startContent={<Phone className="w-4 h-4 text-default-400" />}
                      value={formData.phone}
                      variant="bordered"
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                    />
                  </div>
                </div>

                {error && <p className="text-danger text-sm">{error}</p>}
                <div className="text-xs text-foreground/60 bg-content2 dark:bg-content1 p-3 rounded-md border border-divider">
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
                Create Request
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
