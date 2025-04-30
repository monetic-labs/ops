"use client";

import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";
import { Divider } from "@heroui/divider";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Search, User, Plus, Users, ArrowRight, Building, CreditCard } from "lucide-react";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";
import { Address } from "viem";

import { useGetContacts } from "@/app/(protected)/bill-pay/_hooks/useGetContacts";
import { DEFAULT_EXISTING_BILL_PAY, DEFAULT_NEW_BILL_PAY, ExistingBillPay, NewBillPay } from "@/types/bill-pay";
import { formatStringToTitleCase, getOpepenAvatar } from "@/utils/helpers";
import NewTransferFields from "./fields/new-transfer";

type SelectionType = "select" | "new" | "existing";

// Define STEPS length here or import STEPS if needed elsewhere
const NEW_RECIPIENT_STEP_COUNT = 4;

type RecipientSelectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (recipientData: any | NewBillPay) => void;
  settlementAddress: Address;
  settlementBalance?: string;
};

// --- Simple useDebounce Hook ---
// (Consider moving this to a dedicated hooks file later)
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function to cancel the timeout if value changes before delay expires
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Only re-call effect if value or delay changes

  return debouncedValue;
}

export default function RecipientSelectionModal({
  isOpen,
  onClose,
  onSelect,
  settlementAddress,
  settlementBalance,
}: RecipientSelectionModalProps) {
  const [selectionType, setSelectionType] = useState<SelectionType>("select");
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // Debounce with 300ms delay
  const [billPay, setBillPay] = useState<NewBillPay | ExistingBillPay>(DEFAULT_NEW_BILL_PAY);
  const [currentNewRecipientStep, setCurrentNewRecipientStep] = useState(0); // State for stepper
  const [isNewRecipientStepValid, setIsNewRecipientStepValid] = useState(false); // State for current step validity

  const { contacts, pagination, isLoading: isLoadingContacts, fetchContacts } = useGetContacts();

  // Infinite scroll for contacts list
  const [, scrollerRef] = useInfiniteScroll({
    hasMore: pagination?.hasNextPage || false,
    isEnabled: selectionType === "existing",
    shouldUseLoader: false,
    onLoadMore: () => {
      // Ensure infinite scroll uses the debounced query if searching
      fetchContacts({ after: pagination?.endCursor, search: debouncedSearchQuery });
    },
  });

  // Reset state when modal closes or selection type changes
  useEffect(() => {
    setCurrentNewRecipientStep(0); // Reset step
    setIsNewRecipientStepValid(false); // Reset validity
    if (!isOpen) {
      setSelectionType("select");
      setSelectedContact(null);
      setSearchQuery(""); // Reset immediate search query too
      setBillPay(DEFAULT_NEW_BILL_PAY);
    }
    // Reset billPay when switching *to* select view, or *away* from new view
    if (selectionType === "select" || selectionType !== "new") {
      setBillPay(DEFAULT_NEW_BILL_PAY); // Reset form data unless actively in 'new' flow
    }
  }, [isOpen, selectionType]);

  // Fetch debounced contacts when search query changes
  useEffect(() => {
    // Only fetch if in the correct view
    if (selectionType === "existing") {
      // Fetch contacts using the debounced value
      // The hook should handle replacing data when the search query changes
      fetchContacts({ search: debouncedSearchQuery });
    }
    // Add fetchContacts as a dependency if it's not stable
  }, [debouncedSearchQuery, selectionType, fetchContacts]);

  // Handle selecting a contact - simplified
  const handleContactSelect = (contact: any) => {
    setSelectedContact(contact);
    // Don't create billPay object here, just store the selected contact
  };

  // Final submission handler for new recipient
  const handleNewRecipientContinue = () => {
    // When creating new, we pass the built-up billPay state
    onSelect(billPay);
  };

  // Handle continue with existing recipient - pass the selected contact directly
  const handleExistingRecipientContinue = () => {
    if (selectedContact) {
      onSelect(selectedContact);
    }
  };

  // Handlers for stepper navigation
  const handleNewRecipientNextStep = () => {
    if (isNewRecipientStepValid) {
      setCurrentNewRecipientStep((prev) => Math.min(NEW_RECIPIENT_STEP_COUNT - 1, prev + 1));
    }
  };

  const handleNewRecipientPrevStep = () => {
    setCurrentNewRecipientStep((prev) => Math.max(0, prev - 1));
  };

  // Handler to receive validity updates from NewTransferFields
  const handleNewRecipientValidityChange = (isValid: boolean) => {
    setIsNewRecipientStepValid(isValid);
  };

  // Render the main footer's right-side button
  const renderContinueButton = () => {
    switch (selectionType) {
      case "select":
        return null;
      case "new":
        const isLastStep = currentNewRecipientStep === NEW_RECIPIENT_STEP_COUNT - 1;
        return (
          <Button
            color="primary"
            onPress={isLastStep ? handleNewRecipientContinue : handleNewRecipientNextStep}
            isDisabled={!isNewRecipientStepValid}
          >
            {isLastStep ? "Confirm Recipient Details" : "Continue"}
          </Button>
        );
      case "existing":
        return (
          <Button color="primary" onPress={handleExistingRecipientContinue} isDisabled={!selectedContact}>
            {selectedContact ? `Continue with ${selectedContact.accountOwnerName}` : "Select a Recipient"}
          </Button>
        );
      default:
        return null;
    }
  };

  // Render the continue button based on selection type and state
  const renderSelectionView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 p-4 md:p-6">
      <Card
        isPressable
        isHoverable
        className="border border-divider bg-content2 min-h-[180px] md:min-h-[220px] cursor-pointer flex flex-col"
        onClick={() => setSelectionType("existing")}
      >
        <CardBody className="justify-center items-center text-center flex-grow">
          <div className="bg-primary/10 p-3 md:p-4 rounded-full mb-3 md:mb-4">
            <Users className="w-7 h-7 md:w-8 md:h-8 text-primary" />
          </div>
          <h3 className="text-lg md:text-xl font-semibold text-foreground">Existing Recipient</h3>
          <p className="text-foreground mt-1 md:mt-2 text-sm md:text-base">Select from your saved contacts</p>
        </CardBody>
        <CardFooter className="justify-center pb-4 md:pb-5 pt-0">
          <Button
            className="bg-primary/10 text-primary"
            variant="flat"
            endContent={<ArrowRight size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              setSelectionType("existing");
            }}
          >
            Select Recipient
          </Button>
        </CardFooter>
      </Card>

      <Card
        isPressable
        isHoverable
        className="border border-divider bg-content2 min-h-[180px] md:min-h-[220px] cursor-pointer flex flex-col"
        onClick={() => setSelectionType("new")}
      >
        <CardBody className="justify-center items-center text-center flex-grow">
          <div className="bg-primary/10 p-3 md:p-4 rounded-full mb-3 md:mb-4">
            <Plus className="w-7 h-7 md:w-8 md:h-8 text-primary" />
          </div>
          <h3 className="text-lg md:text-xl font-semibold text-foreground">New Recipient</h3>
          <p className="text-foreground mt-1 md:mt-2 text-sm md:text-base">Create a new payment recipient</p>
        </CardBody>
        <CardFooter className="justify-center pb-4 md:pb-5 pt-0">
          <Button
            variant="flat"
            className="bg-primary/10 text-primary"
            endContent={<ArrowRight size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              setSelectionType("new");
            }}
          >
            Create New
          </Button>
        </CardFooter>
      </Card>
    </div>
  );

  // Render existing recipients grid
  const renderExistingRecipients = () => (
    <div className="p-6">
      <Input
        isClearable
        startContent={<Search size={16} className="text-foreground/60" />}
        placeholder="Search recipients..."
        className="mb-6"
        onClear={() => setSearchQuery("")}
        value={searchQuery} // Input still uses the immediate value
        onChange={(e) => setSearchQuery(e.target.value)} // Update immediate value on change
      />

      {isLoadingContacts ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <ScrollShadow className="max-h-[400px]" ref={scrollerRef}>
          <div className="space-y-4">
            {contacts.length > 0 ? (
              contacts.map((contact) => (
                <Card
                  key={contact.id}
                  isPressable
                  isHoverable
                  className={`border w-full ${selectedContact?.id === contact.id ? "border-2 border-primary" : "border-divider"}`}
                  onPress={() => handleContactSelect(contact)}
                >
                  <CardBody className="flex flex-row items-center gap-4 p-4">
                    <Avatar
                      radius="lg"
                      size="lg"
                      src={getOpepenAvatar(contact.accountOwnerName, 48)}
                      fallback={contact.accountOwnerName.charAt(0)}
                      className="bg-primary/10 text-primary"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg text-foreground">{contact.accountOwnerName}</h4>
                      <div className="flex items-center gap-2 mt-1 text-small text-foreground/70">
                        <Building size={14} />
                        <span>{contact.bankName}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-small text-foreground/70">
                        <CreditCard size={14} />
                        <span>••••{contact.accountNumber.slice(-4)}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {contact.disbursements.map((disbursement: any) => (
                          <Chip key={disbursement.id} size="sm" variant="flat" className="bg-primary/10 text-primary">
                            {formatStringToTitleCase(disbursement.method)}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-divider rounded-xl bg-content2">
                <div className="bg-content3 p-4 rounded-full mb-4">
                  <Users size={24} className="text-foreground/70" />
                </div>
                <h4 className="text-lg font-medium mb-2 text-foreground">No recipients found</h4>
                <p className="text-foreground/70 mb-4">
                  {searchQuery ? `No results found for "${searchQuery}"` : "You don't have any saved recipients yet"}
                </p>
                <Button color="primary" variant="flat" onPress={() => setSelectionType("new")}>
                  Create New Recipient
                </Button>
              </div>
            )}
          </div>
        </ScrollShadow>
      )}
    </div>
  );

  // Render new recipient form
  const renderNewRecipient = () => (
    <NewTransferFields
      billPay={billPay as NewBillPay}
      setBillPay={setBillPay}
      settlementBalance={settlementBalance}
      currentStep={currentNewRecipientStep} // Pass current step
      onValidityChange={handleNewRecipientValidityChange} // Pass validity handler
    />
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
      classNames={{
        base: "bg-content1 max-h-[90vh]",
        header: "border-b border-divider flex flex-col items-start",
        body: "p-0",
        footer: "border-t border-divider",
      }}
    >
      <ModalContent>
        <ModalHeader>
          <h2 className="text-xl font-semibold mb-1 text-foreground">Payment Recipient</h2>
          <p className="text-foreground/70 text-sm">
            {selectionType === "select"
              ? "Select an existing recipient or create a new one"
              : selectionType === "existing"
                ? "Choose from your saved recipients"
                : "Create a new payment recipient"}
          </p>
        </ModalHeader>
        <Divider />
        <ModalBody className="overflow-y-auto">
          {selectionType === "select" && renderSelectionView()}
          {selectionType === "existing" && renderExistingRecipients()}
          {selectionType === "new" && renderNewRecipient()}
        </ModalBody>
        <Divider />
        {selectionType !== "select" && (
          <ModalFooter>
            <Button
              variant="flat"
              color="default"
              onPress={() => {
                if (selectionType === "new") {
                  if (currentNewRecipientStep > 0) {
                    handleNewRecipientPrevStep(); // Go back a step in the form
                  } else {
                    setSelectionType("select"); // Go back to selection view from step 0
                  }
                } else if (selectionType === "existing") {
                  setSelectionType("select"); // Go back to selection view
                } else {
                  onClose();
                }
              }}
            >
              Back
            </Button>
            {renderContinueButton()}
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
}
