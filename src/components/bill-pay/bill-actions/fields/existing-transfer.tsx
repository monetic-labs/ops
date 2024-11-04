import { useEffect, useState } from "react";
import { useInfiniteScroll } from "@nextui-org/use-infinite-scroll";
import { DisbursementMethod, FiatCurrency } from "@backpack-fux/pylon-sdk";
import { useGetContacts } from "@/hooks/bill-pay/useGetContacts";
import { Autocomplete, AutocompleteItem } from "@nextui-org/autocomplete";
import { Input } from "@nextui-org/input";
import { Eye, EyeOff } from "lucide-react";
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
        data-testid="account-holder"
        label={FieldLabel.ACCOUNT_HOLDER}
        placeholder="Select an account holder"
        isRequired
        {...validationResults.accountHolder}
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
            data-testid={`account-holder-item-${contact.id}`}
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
        data-testid="bank-name"
        label={FieldLabel.BANK_NAME}
        isDisabled={!billPay.vendorBankName}
        {...validationResults.bankName}
        value={billPay.vendorBankName}
      />
      <div className="flex space-x-4">
        <Input
          data-testid="account-number"
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
        <Input
          data-testid="routing-number"
          label={FieldLabel.ROUTING_NUMBER}
          isDisabled={!billPay.routingNumber}
          value={`${billPay.routingNumber}`}
          className="w-2/5 md:w-1/2"
        />
      </div>
      <Autocomplete
        data-testid="payment-method"
        label={FieldLabel.PAYMENT_METHOD}
        isRequired
        isDisabled={!billPay.vendorName}
        {...validationResults.paymentMethod}
        value={billPay.vendorMethod}
        onSelectionChange={(value) => handleMethodChange(value as DisbursementMethod)}
      >
        {availableMethods.map((method) => (
          <AutocompleteItem data-testid={`payment-method-item-${method}`} key={method} textValue={method}>
            {method}
          </AutocompleteItem>
        ))}
      </Autocomplete>
      {billPay.vendorMethod && (
        <Input
          data-testid="memo"
          isDisabled={billPay.vendorMethod === DisbursementMethod.WIRE}
          label={
            <span data-testid="memo-label">
              {billPay.vendorMethod === DisbursementMethod.WIRE ? "Wire Message" : "ACH Reference"}
            </span>
          }
          description={`${billPay.vendorMethod === DisbursementMethod.WIRE ? "This cannot be changed." : ""}`}
          value={billPay.memo}
          onChange={(e) => setBillPay({ ...billPay, memo: e.target.value || undefined })}
          {...validationResults.memo}
        />
      )}
      <Input
        label={FieldLabel.AMOUNT}
        data-testid="amount"
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
