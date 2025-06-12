import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { Divider } from "@heroui/divider";
import { BillingAddress, StableCurrency, ShippingAddress } from "@monetic-labs/sdk";
import { Chip } from "@heroui/chip";
import { Snippet } from "@heroui/snippet";
import { Home, Truck, User, Clock, Tag, Wallet, Gift } from "lucide-react";

import { formatAmountUSD, formattedDate, mapCurrencyToSymbol } from "@/utils/helpers";
import ModalFooterWithSupport from "@/components/generics/footer-modal-support";

interface PaymentDetailsResponseProps {
  isOpen: boolean;
  response: {
    transactionId: string;
    transactionStatus: "SALE" | "REFUND";
    transactionSubtotal: string;
    transactionTip: string;
    transactionTotal: string;
    transactionCurrency: StableCurrency;
    transactionBillingAddress: BillingAddress;
    transactionShippingAddress?: ShippingAddress | null;
    transactionCreatedAt: string;
    timestamp: string;
  };
  onClose: () => void;
}

const DetailRow = ({
  label,
  value,
  valueClassName,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
  icon: React.ElementType;
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-foreground/70" />
      <span className="text-sm text-foreground/90">{label}</span>
    </div>
    <span className={`text-sm font-medium ${valueClassName || ""}`}>{value}</span>
  </div>
);

const AddressCard = ({
  title,
  address,
  icon: Icon,
}: {
  title: string;
  address?: BillingAddress | ShippingAddress | null;
  icon: React.ElementType;
}) => {
  if (!address || Object.keys(address).length === 0) {
    return null;
  }

  const { firstName, lastName, street1, street2, city, state, postcode, country } = address;

  return (
    <div className="rounded-lg p-4 bg-content2 dark:bg-content3 flex-1 min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-5 h-5 text-foreground/70" />
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      <address className="not-italic text-sm text-foreground/90 space-y-0.5">
        <p>
          {firstName} {lastName}
        </p>
        <p>{street1}</p>
        {street2 && <p>{street2}</p>}
        <p>
          {city}, {state} {postcode}
        </p>
        <p>{country}</p>
      </address>
    </div>
  );
};

export function PaymentDetails({ isOpen, response, onClose }: PaymentDetailsResponseProps) {
  const handleSupportClick = () => {
    console.log("Support clicked");
  };

  const getStatusChipColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "sale":
        return "success";
      case "refund":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <Modal className="max-w-xl mx-auto" isOpen={isOpen} scrollBehavior="inside" onClose={onClose}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col items-center">
              <h2 className="text-2xl font-bold">Payment Details</h2>
              <Snippet hideSymbol variant="flat" size="sm" className="mt-1 bg-transparent">
                {response.transactionId}
              </Snippet>
            </ModalHeader>
            <ModalBody className="py-6">
              <div className="space-y-6">
                {/* Financial Details */}
                <div className="space-y-3 rounded-xl bg-content2 dark:bg-content3 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-foreground/70">Total Amount</p>
                      <p className="text-3xl font-bold tracking-tight">
                        {formatAmountUSD(Number(response.transactionTotal))}
                      </p>
                    </div>
                    <Chip color={getStatusChipColor(response.transactionStatus)} variant="flat">
                      {response.transactionStatus}
                    </Chip>
                  </div>
                  <Divider />
                  <DetailRow
                    icon={Wallet}
                    label="Subtotal"
                    value={`${formatAmountUSD(Number(response.transactionSubtotal))} ${response.transactionCurrency}`}
                  />
                  <DetailRow
                    icon={Gift}
                    label="Tip"
                    value={`${formatAmountUSD(Number(response.transactionTip))} ${response.transactionCurrency}`}
                  />
                </div>

                {/* Customer Address Details */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <AddressCard title="Billing Address" address={response.transactionBillingAddress} icon={User} />
                  <AddressCard title="Shipping Address" address={response.transactionShippingAddress} icon={Truck} />
                </div>

                {/* Timestamp */}
                <DetailRow
                  icon={Clock}
                  label="Timestamp"
                  value={formattedDate(response.timestamp)}
                  valueClassName="font-mono"
                />
              </div>
            </ModalBody>
            <ModalFooterWithSupport
              actions={[
                {
                  label: "Close",
                  onClick: onClose,
                  className: "bg-content2 text-foreground hover:bg-content3",
                },
              ]}
              onSupportClick={handleSupportClick}
            />
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
