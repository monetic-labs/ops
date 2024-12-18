import { useEffect, useState } from "react";
import { useInfiniteScroll } from "@nextui-org/use-infinite-scroll";
import { DisbursementMethod, FiatCurrency } from "@backpack-fux/pylon-sdk";
import { Autocomplete, AutocompleteItem } from "@nextui-org/autocomplete";
import { Input } from "@nextui-org/input";
import { Eye, EyeOff } from "lucide-react";

import { useGetContacts } from "@/hooks/bill-pay/useGetContacts";
import { DEFAULT_EXISTING_BILL_PAY, DEFAULT_NEW_BILL_PAY, ExistingBillPay, NewBillPay } from "@/types/bill-pay";
import { FieldLabel, getValidationProps } from "@/types/validations/bill-pay";

type ExistingTransferFieldsProps = {
  billPay: ExistingBillPay;
  setBillPay: (billPay: NewBillPay | ExistingBillPay) => void;
  setIsNewSender: (isNewSender: boolean) => void;
  settlementBalance?: string;
};

function getValidationResults(billPay: ExistingBillPay, settlementBalance?: string) {
  return {
    accountHolder: getValidationProps({
      label: FieldLabel.ACCOUNT_HOLDER,
      value: billPay.vendorName,
      currency: billPay.currency,
    }),
    bankName: getValidationProps({
      label: FieldLabel.BANK_NAME,
      value: billPay.vendorBankName,
      currency: billPay.currency,
    }),
    accountNumber: getValidationProps({
      label: FieldLabel.ACCOUNT_NUMBER,
      value: billPay.accountNumber,
      currency: billPay.currency,
    }),
    paymentMethod: getValidationProps({
      label: FieldLabel.PAYMENT_METHOD,
      value: billPay.vendorMethod || "",
      currency: billPay.currency,
    }),
    memo: getValidationProps({
      label: FieldLabel.MEMO,
      value: billPay.memo,
      currency: billPay.currency,
      method: billPay.vendorMethod,
    }),
    amount: getValidationProps({
      label: FieldLabel.AMOUNT,
      value: billPay.amount,
      currency: billPay.currency,
      balance: settlementBalance,
      method: billPay.vendorMethod,
    }),
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
        isRequired
        data-testid="account-holder"
        label={FieldLabel.ACCOUNT_HOLDER}
        placeholder="Select an account holder"
        {...validationResults.accountHolder}
        defaultItems={contacts}
        isLoading={isLoadingContacts}
        listboxProps={{
          emptyContent: (
            <button
              onClick={() => {
                setBillPay(DEFAULT_NEW_BILL_PAY);
                setIsNewSender(true);
              }}
            >
              <span>
                No results found. <span className="text-ualert-500">Click here</span> to create a new sender.
              </span>
            </button>
          ),
        }}
        scrollRef={scrollerRef}
        value={billPay.vendorName}
        onInputChange={(value) => {
          setSearch(value);
        }}
        onOpenChange={setIsOpen}
        onSelectionChange={(contactId) => {
          if (contactId) {
            handleSelectionChange(contactId as string);
          } else {
            setBillPay(DEFAULT_EXISTING_BILL_PAY);
          }
        }}
      >
        {(contact) => (
          <AutocompleteItem
            key={contact.id}
            data-testid={`account-holder-item-${contact.id}`}
            endContent={<div className="text-gray-400 text-xs">{contact.nickname}</div>}
            textValue={contact.accountOwnerName}
            value={contact.accountOwnerName}
          >
            {contact.accountOwnerName}
          </AutocompleteItem>
        )}
      </Autocomplete>
      <Input
        data-testid="bank-name"
        isDisabled={!billPay.vendorBankName}
        label={FieldLabel.BANK_NAME}
        {...validationResults.bankName}
        value={billPay.vendorBankName}
      />
      <div className="flex space-x-4">
        <Input
          isReadOnly
          data-testid="account-number"
          isDisabled={!billPay.accountNumber}
          label={FieldLabel.ACCOUNT_NUMBER}
          {...validationResults.accountNumber}
          className="w-3/5 md:w-1/2"
          endContent={
            <button
              aria-label="toggle account number visibility"
              className="focus:outline-none"
              type="button"
              onClick={toggleVisibility}
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
          value={
            billPay.accountNumber
              ? isVisible
                ? billPay.accountNumber
                : `${"•".repeat(billPay.accountNumber.length - 4)}${billPay.accountNumber.slice(-4)}`
              : ""
          }
        />
        <Input
          className="w-2/5 md:w-1/2"
          data-testid="routing-number"
          isDisabled={!billPay.routingNumber}
          label={FieldLabel.ROUTING_NUMBER}
          value={`${billPay.routingNumber}`}
        />
      </div>
      <Autocomplete
        isRequired
        data-testid="payment-method"
        isDisabled={!billPay.vendorName}
        label={FieldLabel.PAYMENT_METHOD}
        {...validationResults.paymentMethod}
        value={billPay.vendorMethod}
        onSelectionChange={(value) => handleMethodChange(value as DisbursementMethod)}
      >
        {availableMethods.map((method) => (
          <AutocompleteItem key={method} data-testid={`payment-method-item-${method}`} textValue={method}>
            {method}
          </AutocompleteItem>
        ))}
      </Autocomplete>
      {billPay.vendorMethod && (
        <Input
          data-testid="memo"
          description={`${billPay.vendorMethod === DisbursementMethod.WIRE ? "This cannot be changed." : ""}`}
          isDisabled={billPay.vendorMethod === DisbursementMethod.WIRE}
          label={
            <span data-testid="memo-label">
              {billPay.vendorMethod === DisbursementMethod.WIRE ? "Wire Message" : "ACH Reference"}
            </span>
          }
          value={billPay.memo}
          onChange={(e) => setBillPay({ ...billPay, memo: e.target.value || undefined })}
          {...validationResults.memo}
        />
      )}
      <Input
        isRequired
        data-testid="amount"
        isDisabled={!billPay.vendorName || !billPay.vendorMethod}
        label={FieldLabel.AMOUNT}
        type="number"
        {...validationResults.amount}
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
        startContent={
          <div className="pointer-events-none flex items-center">
            <span className="text-default-400 text-small">$</span>
          </div>
        }
        value={billPay.amount}
        onChange={(e) => {
          const value = e.target.value;
          // Only allow 2 decimal places
          const regex = /^\d*\.?\d{0,2}$/;

          if (regex.test(value) || value === "") {
            setBillPay({ ...billPay, amount: value });
          }
        }}
      />
    </>
  );
}
