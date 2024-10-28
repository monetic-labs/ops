import { useEffect, useState } from "react";
import { useInfiniteScroll } from "@nextui-org/use-infinite-scroll";
import { DisbursementMethod } from "@backpack-fux/pylon-sdk";
import { NewBillPay, vendorCurrencies } from "../create";
import { useGetContacts } from "@/hooks/bill-pay/useGetContacts";
import { Autocomplete, AutocompleteItem } from "@nextui-org/autocomplete";
import { Input } from "@nextui-org/input";
import { Eye, EyeOff } from "lucide-react";
import { DEFAULT_BILL_PAY } from "../../bill-pay";

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

  const handleMethodChange = (value: DisbursementMethod) => {
    const selectedDisbursement = selectedContact?.disbursements.find((disbursement) => disbursement.method === value);
    setNewBillPay({
      ...newBillPay,
      vendorMethod: value,
      memo: selectedDisbursement?.paymentMessage || undefined,
      disbursementId: selectedDisbursement?.id || undefined,
    });
  };

  const toggleVisibility = () => {
    setIsVisible((prevState) => !prevState);
  };

  const selectedContact = contacts.find((contact) => contact.accountOwnerName === newBillPay.vendorName);
  const availableMethods = selectedContact
    ? selectedContact.disbursements.map((disbursement) => disbursement.method)
    : [];

  return (
    <>
      <Autocomplete
        label="Account Holder"
        placeholder="Select an account holder"
        isRequired
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
        value={newBillPay.vendorName}
        onSelectionChange={(contactId) => {
          if (contactId) {
            handleSelectionChange(contactId as string);
          } else {
            setNewBillPay(DEFAULT_BILL_PAY);
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
      <Input isDisabled label="Bank Name" value={newBillPay.vendorBankName} />
      <div className="flex space-x-4">
        {/** TODO: check user balance is sufficient */}
        <Input
          isReadOnly
          isDisabled={!newBillPay.accountNumber}
          label="Account Number"
          value={
            newBillPay.accountNumber
              ? isVisible
                ? newBillPay.accountNumber
                : `${"•".repeat(newBillPay.accountNumber.length - 4)}${newBillPay.accountNumber.slice(-4)}`
              : ""
          }
          endContent={
            <button
              className="focus:outline-none"
              type="button"
              onClick={toggleVisibility}
              aria-label="toggle account number visibility"
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
          type="text"
          className="w-3/5 md:w-1/2"
        />
        <Input isDisabled label="Routing Number" value={`${newBillPay.routingNumber}`} className="w-2/5 md:w-1/2" />
      </div>
      <Autocomplete
        isDisabled={!newBillPay.vendorName}
        label="Method"
        value={newBillPay.vendorMethod}
        onSelectionChange={(value) => handleMethodChange(value as DisbursementMethod)}
      >
        {availableMethods.map((method) => (
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
            description={`${newBillPay.vendorMethod === DisbursementMethod.WIRE ? "This cannot be changed." : ""}`}
            value={newBillPay.memo}
            onChange={(e) => setNewBillPay({ ...newBillPay, memo: e.target.value })}
          />
        )}
      <Input
        label="Amount"
        type="number"
        min={1}
        step={0.01}
        isDisabled={!newBillPay.vendorName && !newBillPay.vendorMethod}
        isRequired
        isInvalid={parseFloat(newBillPay.amount) < 1}
        errorMessage={`Amount must be greater than 1 ${newBillPay.currency}`}
        value={newBillPay.amount}
        onChange={(e) => setNewBillPay({ ...newBillPay, amount: e.target.value })}
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
      />
    </>
  );
}
