import type { Account } from "@/types/account";

import { Button } from "@heroui/button";
import { Copy, Info, Share2, X, Check } from "lucide-react";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { useState } from "react";
import { Spinner } from "@heroui/spinner";
import { useRouter } from "next/navigation";
import { Select } from "@heroui/select";

import { useAccounts } from "@/contexts/AccountContext";

import { AccountSelectionModal } from "./AccountSelectionModal";

interface ReceiveModalProps {
  availableAccounts: Account[];
  isOpen: boolean;
  selectedAccount: Account;
  selectedSettlementAccount: Account;
  onClose: () => void;
}

export function ReceiveModal({
  availableAccounts,
  isOpen,
  selectedAccount,
  selectedSettlementAccount,
  onClose,
}: ReceiveModalProps) {
  const router = useRouter();
  const [isShared, setIsShared] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isAccountSelectionOpen, setIsAccountSelectionOpen] = useState(false);
  const { virtualAccount, updateVirtualAccountDestination, getSettlementAccount } = useAccounts();

  // Get the actual settlement account based on virtual account destination
  const actualSettlementAccount = getSettlementAccount();

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = async () => {
    if (!virtualAccount?.source_deposit_instructions) return;

    try {
      const depositInstructions = virtualAccount.source_deposit_instructions;
      const fields = [
        { label: "Bank Name", value: depositInstructions.bank_name },
        { label: "Bank Address", value: depositInstructions.bank_address },
        { label: "Routing Number", value: depositInstructions.bank_routing_number },
        { label: "Account Number", value: depositInstructions.bank_account_number },
        { label: "Beneficiary Name", value: depositInstructions.bank_beneficiary_name },
        { label: "Beneficiary Address", value: depositInstructions.bank_beneficiary_address },
      ];

      const details = [
        "These are my account details for receiving ACH and Wire deposits.",
        ...fields
          .filter(({ value }) => value && value.trim() && value !== "null" && value !== "undefined")
          .map(({ label, value }) => `${label}: ${value}`),
      ].join("\n");

      await navigator.clipboard.writeText(details);
      setIsShared(true);
      setTimeout(() => setIsShared(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleAccountChange = (account: Account) => {
    router.push(`/account/${account.id}`);
  };

  // Show loading state while virtual account is being fetched
  if (!virtualAccount) {
    return (
      <Modal
        classNames={{
          backdrop: "bg-background/70 backdrop-blur-sm",
          base: "border-border",
        }}
        isOpen={isOpen}
        size="2xl"
        onClose={onClose}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex justify-between items-center px-8 py-5 border-b border-border bg-content1/80 backdrop-blur-md">
                <h3 className="text-xl font-semibold">Virtual Account Details</h3>
                <Button isIconOnly aria-label="Close" variant="light" onPress={onClose}>
                  <X size={20} />
                </Button>
              </ModalHeader>
              <ModalBody className="p-4 md:p-6">
                <div className="flex justify-center items-center min-h-[200px]">
                  <Spinner size="lg" />
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    );
  }

  if (!virtualAccount.source_deposit_instructions) {
    return (
      <Modal
        classNames={{
          backdrop: "bg-background/70 backdrop-blur-sm",
          base: "border-border",
        }}
        isOpen={isOpen}
        size="2xl"
        onClose={onClose}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex justify-between items-center px-8 py-5 border-b border-border bg-content1/80 backdrop-blur-md">
                <h3 className="text-xl font-semibold">Virtual Account Details</h3>
                <Button isIconOnly aria-label="Close" variant="light" onPress={onClose}>
                  <X size={20} />
                </Button>
              </ModalHeader>
              <ModalBody className="p-4 md:p-6">
                <div className="flex justify-center items-center min-h-[200px]">
                  <p className="text-foreground/60">No virtual account details available.</p>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    );
  }

  const depositInstructions = virtualAccount.source_deposit_instructions;

  // Helper function to get display value
  const getDisplayValue = (value: string | undefined | null) => {
    return value?.trim() ? value : "N/A";
  };

  // Helper function to determine if a field should be copyable
  const isCopyable = (value: string | undefined | null) => {
    return Boolean(value?.trim());
  };

  return (
    <>
      <Modal
        classNames={{
          backdrop: "bg-background/70 backdrop-blur-sm",
          base: "border-border",
        }}
        isOpen={isOpen}
        size="2xl"
        onClose={onClose}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex justify-between items-center px-8 py-5 border-b border-border bg-content1/80 backdrop-blur-md">
                <h3 className="text-xl font-semibold">Virtual Account Details</h3>
                <Button isIconOnly aria-label="Close" variant="light" onPress={onClose}>
                  <X size={20} />
                </Button>
              </ModalHeader>

              <ModalBody className="p-4 md:p-6">
                <div className="max-w-[1200px] mx-auto">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Left Column - Settlement Account */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Settlement Account</h4>
                        <Button
                          className="min-w-0 h-7 px-3 text-xs bg-primary/10 text-primary hover:bg-primary/20"
                          size="sm"
                          variant="flat"
                          onClick={() => setIsAccountSelectionOpen(true)}
                        >
                          Change Account
                        </Button>
                      </div>
                      <div className="bg-content2 p-4 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground/60">Deposits will settle to</span>
                          <div className="flex items-center gap-2">
                            {actualSettlementAccount ? (
                              <>
                                <actualSettlementAccount.icon className="w-4 h-4 text-foreground/60" />
                                <span className="text-sm font-medium">{actualSettlementAccount.name}</span>
                              </>
                            ) : (
                              <span className="text-sm text-foreground/60">Loading...</span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-foreground/60">
                          You can change which account receives deposits at any time. Changes will apply to future
                          deposits only.
                        </p>
                      </div>
                      {/* Minimum Deposit Notice */}
                      <div className="bg-warning/10 p-4 rounded-xl space-y-2">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <Info className="text-warning" size={16} />
                          Minimum Deposit
                        </h4>
                        <p className="text-sm text-foreground/60">All deposits must be at least $1 USD</p>
                      </div>
                    </div>

                    {/* Right Column - Bank Details */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium">Bank Information</h4>
                          <div className="group relative">
                            <Info className="text-foreground/60 cursor-help" size={14} />
                            <div className="absolute bottom-full mb-2 hidden group-hover:block bg-content2 text-xs p-2 rounded-lg shadow-lg whitespace-nowrap">
                              Accepts ACH and Wire transfers
                            </div>
                          </div>
                        </div>
                        <Button
                          className="min-w-0 h-7 px-3 text-xs bg-primary/10 text-primary hover:bg-primary/20"
                          isDisabled={!depositInstructions}
                          size="sm"
                          startContent={isShared ? <Check size={14} /> : <Share2 size={14} />}
                          variant="flat"
                          onPress={handleShare}
                        >
                          Share Details
                        </Button>
                      </div>

                      <div className="bg-content2 p-4 rounded-xl space-y-3">
                        {[
                          { label: "Bank Name", value: depositInstructions?.bank_name, key: "bankName" },
                          { label: "Bank Address", value: depositInstructions?.bank_address, key: "bankAddress" },
                          {
                            label: "Routing Number",
                            value: depositInstructions?.bank_routing_number,
                            key: "routingNumber",
                          },
                          {
                            label: "Account Number",
                            value: depositInstructions?.bank_account_number,
                            key: "accountNumber",
                          },
                          {
                            label: "Beneficiary Name",
                            value: depositInstructions?.bank_beneficiary_name,
                            key: "beneficiaryName",
                          },
                          {
                            label: "Beneficiary Address",
                            value: depositInstructions?.bank_beneficiary_address,
                            key: "beneficiaryAddress",
                          },
                        ].map(({ label, value, key }) => (
                          <div key={key} className="flex justify-between items-center">
                            <span className="text-sm text-foreground/60">{label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-right">{getDisplayValue(value)}</span>
                              {isCopyable(value) && (
                                <Button
                                  isIconOnly
                                  className="min-w-0 h-6 w-6"
                                  size="sm"
                                  variant="light"
                                  onPress={() => handleCopy(value!, key)}
                                >
                                  {copiedField === key ? <Check size={14} /> : <Copy size={14} />}
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      <AccountSelectionModal
        accounts={availableAccounts}
        isOpen={isAccountSelectionOpen}
        isSettlementSelection={true}
        selectedAccountId={actualSettlementAccount?.id}
        title="Select Settlement Account"
        onClose={() => setIsAccountSelectionOpen(false)}
        onSelect={handleAccountChange}
      />
    </>
  );
}
