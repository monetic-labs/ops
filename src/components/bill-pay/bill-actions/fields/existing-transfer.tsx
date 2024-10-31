import { useEffect, useState } from "react";
import { useInfiniteScroll } from "@nextui-org/use-infinite-scroll";
import { DisbursementMethod, FiatCurrency } from "@backpack-fux/pylon-sdk";
import { useGetContacts } from "@/hooks/bill-pay/useGetContacts";
import { Autocomplete, AutocompleteItem } from "@nextui-org/autocomplete";
import { Input } from "@nextui-org/input";
import { Eye, EyeOff } from "lucide-react";
import { DEFAULT_EXISTING_BILL_PAY, ExistingBillPay, NewBillPay } from "@/types/bill-pay";
import { FieldLabel, getFieldValidation } from "@/types/validations/bill-pay";

type ExistingTransferFieldsProps = {
  billPay: ExistingBillPay;
  setBillPay: (billPay: ExistingBillPay) => void;
  setIsNewSender: (isNewSender: boolean) => void;
  settlementBalance?: string;
};

function getValidationProps(label: FieldLabel, value: string, currency: string, balance?: string) {
  const validation = getFieldValidation({ label, currency, value, balance });
  return {
    min: validation.min,
    max: validation.max,
    step: validation.step,
    isInvalid: validation.isInvalid,
    errorMessage: validation.errorMessage,
    description: validation.description,
  };
}

function getValidationResults(billPay: ExistingBillPay, settlementBalance?: string) {
  return {
    accountHolder: getValidationProps(FieldLabel.ACCOUNT_HOLDER, billPay.vendorName, billPay.currency),
    bankName: getValidationProps(FieldLabel.BANK_NAME, billPay.vendorBankName, billPay.currency),
    accountNumber: getValidationProps(FieldLabel.ACCOUNT_NUMBER, billPay.accountNumber, billPay.currency),
    paymentMethod: getValidationProps(FieldLabel.PAYMENT_METHOD, billPay.vendorMethod || "", billPay.currency),
    amount: getValidationProps(FieldLabel.AMOUNT, billPay.amount, billPay.currency, settlementBalance),
  };
}

export default function ExistingTransferFields({
  billPay,
  setBillPay,
  setIsNewSender,
  settlementBalance,
}: ExistingTransferFieldsProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { contacts, pagination, isLoading: isLoadingContacts, fetchContacts } = useGetContacts();

  const [, scrollerRef] = useInfiniteScroll({
    hasMore: pagination?.hasNextPage || false,
    isEnabled: isOpen,
    shouldUseLoader: false,
    onLoadMore: () => {
      fetchContacts({ after: pagination?.endCursor, search });
    },
  });

  useEffect(() => {
    if (isOpen) {
      fetchContacts({ search });
    }
  }, [isOpen, search]);
  const handleSelectionChange = (contactId: string) => {
    const selectedContact = contacts.find((contact) => contact.id === contactId);
    if (selectedContact) {
      setBillPay({
        ...billPay,
        type: "existing",
        vendorName: selectedContact.accountOwnerName,
        vendorBankName: selectedContact.bankName,
        routingNumber: selectedContact.routingNumber,
        accountNumber: selectedContact.accountNumber,
      });
    }
  };

  const handleMethodChange = (value: DisbursementMethod) => {
    const selectedDisbursement = selectedContact?.disbursements.find((disbursement) => disbursement.method === value);
    setBillPay({
      ...billPay,
      vendorMethod: value,
      memo: selectedDisbursement?.paymentMessage || "",
      disbursementId: selectedDisbursement?.id || "",
    });
  };

  const toggleVisibility = () => {
    setIsVisible((prevState) => !prevState);
  };

  const validationResults = getValidationResults(billPay, settlementBalance);
  const selectedContact = contacts.find((contact) => contact.accountOwnerName === billPay.vendorName);
  const availableMethods = selectedContact
    ? selectedContact.disbursements.map((disbursement) => disbursement.method)
    : [];

  return (
    <>
      <Autocomplete
        label={FieldLabel.ACCOUNT_HOLDER}
        placeholder="Select an account holder"
        isRequired
        {...validationResults.accountHolder}
        listboxProps={{
          emptyContent: (
            <button
              onClick={() => {
                setIsNewSender(true);
              }}
            >
              <span>
                No results found. <span className="text-ualert-500">Click here</span> to create a new sender.
              </span>
            </button>
          ),
        }}
        value={billPay.vendorName}
        onSelectionChange={(contactId) => {
          if (contactId) {
            handleSelectionChange(contactId as string);
          } else {
            setBillPay(DEFAULT_EXISTING_BILL_PAY);
          }
        }}
        onInputChange={(value) => {
          setSearch(value);
        }}
        isLoading={isLoadingContacts}
        defaultItems={contacts}
        scrollRef={scrollerRef}
        onOpenChange={setIsOpen}
      >
        {(contact) => (
          <AutocompleteItem
            key={contact.id}
            textValue={contact.accountOwnerName}
            value={contact.accountOwnerName}
            endContent={<div className="text-gray-400 text-xs">{contact.nickname}</div>}
          >
            {contact.accountOwnerName}
          </AutocompleteItem>
        )}
      </Autocomplete>
      <Input
        label={FieldLabel.BANK_NAME}
        isDisabled={!billPay.vendorName}
        {...validationResults.bankName}
        value={billPay.vendorBankName}
      />
      <div className="flex space-x-4">
        <Input
          label={FieldLabel.ACCOUNT_NUMBER}
          isReadOnly
          isDisabled={!billPay.accountNumber}
          {...validationResults.accountNumber}
          value={
            billPay.accountNumber
              ? isVisible
                ? billPay.accountNumber
                : `${"•".repeat(billPay.accountNumber.length - 4)}${billPay.accountNumber.slice(-4)}`
              : ""
          }
          endContent={
            <button
              className="focus:outline-none"
              type="button"
              onClick={toggleVisibility}
              aria-label="toggle account number visibility"
            >
              {billPay.accountNumber ? (
                isVisible ? (
                  <Eye className="text-2xl text-default-400 pointer-events-none" />
                ) : (
                  <EyeOff className="text-2xl text-default-400 pointer-events-none" />
                )
              ) : null}
            </button>
          }
          type="text"
          className="w-3/5 md:w-1/2"
        />
        <Input isDisabled label="Routing Number" value={`${billPay.routingNumber}`} className="w-2/5 md:w-1/2" />
      </div>
      <Autocomplete
        label={FieldLabel.PAYMENT_METHOD}
        isRequired
        isDisabled={!billPay.vendorName}
        {...validationResults.paymentMethod}
        value={billPay.vendorMethod}
        onSelectionChange={(value) => handleMethodChange(value as DisbursementMethod)}
      >
        {availableMethods.map((method) => (
          <AutocompleteItem key={method} textValue={method}>
            {method}
          </AutocompleteItem>
        ))}
      </Autocomplete>
      {billPay.vendorMethod &&
        [DisbursementMethod.WIRE, DisbursementMethod.ACH_SAME_DAY].includes(billPay.vendorMethod) && (
          <Input
            isDisabled={billPay.vendorMethod === DisbursementMethod.WIRE}
            label={`${billPay.vendorMethod === DisbursementMethod.WIRE ? "Wire Message" : "ACH Reference"}`}
            description={`${billPay.vendorMethod === DisbursementMethod.WIRE ? "This cannot be changed." : ""}`}
            value={billPay.memo}
            onChange={(e) => setBillPay({ ...billPay, memo: e.target.value })}
          />
        )}
      <Input
        label={FieldLabel.AMOUNT}
        type="number"
        isRequired
        isDisabled={!billPay.vendorName && !billPay.vendorMethod}
        {...validationResults.amount}
        value={billPay.amount}
        onChange={(e) => {
          const value = e.target.value;
          // Only allow 2 decimal places
          const regex = /^\d*\.?\d{0,2}$/;
          if (regex.test(value) || value === "") {
            setBillPay({ ...billPay, amount: value });
          }
        }}
        startContent={
          <div className="pointer-events-none flex items-center">
            <span className="text-default-400 text-small">$</span>
          </div>
        }
        endContent={
          <div className="flex items-center py-2">
            <label className="sr-only" htmlFor="currency">
              Currency
            </label>
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
      />
    </>
  );
}
