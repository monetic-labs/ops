import { useEffect, useState } from "react";
import { useInfiniteScroll } from "@nextui-org/use-infinite-scroll";
import { DisbursementMethod } from "@backpack-fux/pylon-sdk";
import { Autocomplete, AutocompleteItem } from "@nextui-org/autocomplete";
import { Input } from "@nextui-org/input";
import { Eye, EyeOff } from "lucide-react";

import { useExistingDisbursement } from "@/hooks/bill-pay/useExistingDisbursement";
import { useGetContacts } from "@/hooks/bill-pay/useGetContacts";

import { DEFAULT_BILL_PAY, NewBillPay, vendorCurrencies, vendorMethods } from "../create";

export default function ExistingTransferFields({
  newBillPay,
  setNewBillPay,
  isNewSender,
  setIsNewSender,
}: {
  newBillPay: NewBillPay;
  setNewBillPay: (newBillPay: NewBillPay) => void;
  isNewSender: boolean;
  setIsNewSender: (isNewSender: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { contacts, pagination, isLoading: isLoadingContacts, fetchContacts } = useGetContacts();
  const {
    disbursement,
    isLoading: isLoadingDisbursement,
    error,
    createExistingDisbursement,
  } = useExistingDisbursement();

  const [, scrollerRef] = useInfiniteScroll({
    hasMore: pagination?.hasNextPage || false,
    isEnabled: isOpen,
    shouldUseLoader: false,
    onLoadMore: () => {
      fetchContacts({ after: pagination?.endCursor });
    },
  });

  useEffect(() => {
    fetchContacts({ search });
  }, [search]);

  const handleSelectionChange = (contactId: string) => {
    const selectedContact = contacts.find((contact) => contact.id === contactId);

    if (selectedContact) {
      setNewBillPay({
        ...newBillPay,
        vendorName: selectedContact.accountOwnerName,
        vendorBankName: selectedContact.bankName,
        routingNumber: selectedContact.routingNumber,
        accountNumber: selectedContact.accountNumber,
      });
    }
  };

  const toggleVisibility = () => {
    setIsVisible((prevState) => !prevState);
  };

  return (
    <>
      <Autocomplete
        isRequired
        defaultItems={contacts}
        isLoading={isLoadingContacts}
        label="Account Holder"
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
        placeholder="Select an account holder"
        scrollRef={scrollerRef}
        value={newBillPay.vendorName}
        onInputChange={(value) => {
          setSearch(value);
        }}
        onOpenChange={setIsOpen}
        onSelectionChange={(contactId) => {
          if (contactId) {
            handleSelectionChange(contactId as string);
          } else {
            setNewBillPay(DEFAULT_BILL_PAY);
          }
        }}
      >
        {(contact) => (
          <AutocompleteItem
            key={contact.id}
            endContent={<div className="text-gray-400 text-xs">{contact.nickname}</div>}
            textValue={contact.accountOwnerName}
            value={contact.accountOwnerName}
          >
            {contact.accountOwnerName}
          </AutocompleteItem>
        )}
      </Autocomplete>
      <Input isDisabled label="Bank Name" value={newBillPay.vendorBankName} />
      <div className="flex space-x-4">
        <Input
          isReadOnly
          className="w-3/5 md:w-1/2"
          endContent={
            <button
              aria-label="toggle account number visibility"
              className="focus:outline-none"
              type="button"
              onClick={toggleVisibility}
            >
              {newBillPay.accountNumber ? (
                isVisible ? (
                  <Eye className="text-2xl text-default-400 pointer-events-none" />
                ) : (
                  <EyeOff className="text-2xl text-default-400 pointer-events-none" />
                )
              ) : null}
            </button>
          }
          isDisabled={!newBillPay.accountNumber}
          label="Account Number"
          type="text"
          value={
            newBillPay.accountNumber
              ? isVisible
                ? newBillPay.accountNumber
                : `${"•".repeat(newBillPay.accountNumber.length - 4)}${newBillPay.accountNumber.slice(-4)}`
              : ""
          }
        />
        <Input isDisabled className="w-2/5 md:w-1/2" label="Routing Number" value={`${newBillPay.routingNumber}`} />
      </div>
      <Autocomplete
        isDisabled={!newBillPay.vendorName}
        label="Method"
        value={newBillPay.vendorMethod}
        onSelectionChange={(value) => setNewBillPay({ ...newBillPay, vendorMethod: value as DisbursementMethod })}
      >
        {vendorMethods.map((method) => (
          <AutocompleteItem key={method} textValue={method}>
            {method}
          </AutocompleteItem>
        ))}
      </Autocomplete>
      {newBillPay.vendorMethod &&
        [DisbursementMethod.WIRE, DisbursementMethod.ACH_SAME_DAY].includes(newBillPay.vendorMethod) && (
          <Input
            isDisabled={newBillPay.vendorMethod === DisbursementMethod.WIRE}
            label={`${newBillPay.vendorMethod === DisbursementMethod.WIRE ? "Wire Message" : "ACH Reference"}`}
            value={newBillPay.memo}
            onChange={(e) => setNewBillPay({ ...newBillPay, memo: e.target.value })}
          />
        )}
      <Input
        isRequired
        endContent={
          <div className="flex items-center py-2">
            <label className="sr-only" htmlFor="currency">
              Currency
            </label>
            <select
              className="outline-none border-0 bg-transparent text-default-400 text-small"
              id="currency"
              name="currency"
              value={newBillPay.currency}
              onChange={(e) => setNewBillPay({ ...newBillPay, currency: e.target.value })}
            >
              {vendorCurrencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>
        }
        errorMessage={`Amount must be greater than 1 ${newBillPay.currency}`}
        isDisabled={!newBillPay.vendorName && !newBillPay.vendorMethod}
        isInvalid={parseFloat(newBillPay.amount) < 1}
        label="Amount"
        min={1}
        startContent={
          <div className="pointer-events-none flex items-center">
            <span className="text-default-400 text-small">$</span>
          </div>
        }
        step={0.01}
        type="number"
        value={newBillPay.amount}
        onChange={(e) => setNewBillPay({ ...newBillPay, amount: e.target.value })}
      />
    </>
  );
}
