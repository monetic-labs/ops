import React, { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Mail, Phone, DollarSign } from "lucide-react";
import { GetOrderLinksOutput, ISO4217Currency } from "@monetic-labs/sdk";

import { formatPhoneNumber, formatCurrencyInput } from "@/utils/helpers";
import pylon from "@/libs/pylon-sdk";

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (order: GetOrderLinksOutput) => Promise<void>;
}

export default function CreateOrderModal({ isOpen, onClose, onCreate }: CreateOrderModalProps) {
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
              <div className="space-y-4">
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
                <Input
                  endContent={
                    <div className="pointer-events-none flex items-center">
                      <span className="text-default-400 text-small">USD</span>
                    </div>
                  }
                  errorMessage={errors.amount}
                  isInvalid={!!errors.amount}
                  label="Amount"
                  placeholder="0.00"
                  startContent={<DollarSign className="w-4 h-4 text-default-400" />}
                  value={formData.amount}
                  variant="bordered"
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                />
                {error && <p className="text-danger text-sm">{error}</p>}
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
