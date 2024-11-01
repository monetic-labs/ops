import { DisbursementMethod } from "@backpack-fux/pylon-sdk";
import { Autocomplete, AutocompleteItem } from "@nextui-org/autocomplete";
import { Input } from "@nextui-org/input";
import { Avatar } from "@nextui-org/avatar";
import { Alpha3 } from "convert-iso-codes";

import { Countries, NewBillPay, States, vendorCurrencies, vendorMethods } from "../create";

export default function NewTransferFields({
  newBillPay,
  setNewBillPay,
  showMemo,
}: {
  newBillPay: NewBillPay;
  setNewBillPay: (newBillPay: NewBillPay) => void;
  showMemo: boolean;
}) {
  return (
    <>
      <Input isRequired label="Account Holder Name" placeholder="e.g. John Felix Anthony Cena" />
      <div className="flex space-x-4">
        <Autocomplete
          isRequired
          defaultInputValue={DisbursementMethod.ACH_SAME_DAY}
          isClearable={false}
          label="Method"
          value={newBillPay.vendorMethod}
          onSelectionChange={(value) => {
            console.log("Selected Method:", value);
            setNewBillPay({ ...newBillPay, vendorMethod: value as DisbursementMethod });
          }}
        >
          {vendorMethods.map((method) => (
            <AutocompleteItem key={method} textValue={method}>
              {method}
            </AutocompleteItem>
          ))}
        </Autocomplete>
      </div>
      <Input isRequired label="Bank Name" placeholder="e.g. Bank of America" />
      <div className="flex space-x-4">
        <Input
          isRequired
          errorMessage="Routing number must be 9 digits"
          inputMode="numeric"
          label="Routing Number"
          maxLength={9}
          minLength={9}
          placeholder="e.g. 123000848"
          type="number"
          value={newBillPay.routingNumber}
          onChange={(e) => setNewBillPay({ ...newBillPay, routingNumber: e.target.value })}
        />
        <Input
          isRequired
          errorMessage="Account number must be between 10 and 17 digits"
          inputMode="numeric"
          label="Account Number"
          maxLength={17}
          minLength={10}
          placeholder="e.g. 10987654321"
          type="number"
          value={newBillPay.accountNumber}
          onChange={(e) => setNewBillPay({ ...newBillPay, accountNumber: e.target.value })}
        />
      </div>
      <Input isRequired label="Street Line 1" placeholder="1234 Main St" />
      <Input label="Street Line 2" placeholder="Apt 4B" />
      <div className="flex space-x-4">
        <Input isRequired label="City" placeholder="New York" />
        <Autocomplete isClearable={false} label="State">
          {Object.entries(States).map(([key, value]) => (
            <AutocompleteItem key={key} textValue={key}>
              {key}
            </AutocompleteItem>
          ))}
        </Autocomplete>
        <Input label="Zip" placeholder="10001" />
      </div>
      <Autocomplete className="flex-1" isClearable={false} label="Country">
        {Object.entries(Countries).map(([key, value]) => (
          <AutocompleteItem
            key={key}
            startContent={
              <Avatar
                alt={value}
                className="w-6 h-6"
                src={`https://flagcdn.com/${Alpha3.toAlpha2(key).toLowerCase()}.svg`}
              />
            }
            textValue={value}
          >
            {value}
          </AutocompleteItem>
        ))}
      </Autocomplete>
      <Input
        description={`${
          newBillPay.vendorMethod === DisbursementMethod.WIRE
            ? "This cannot be changed after the sender is created."
            : ""
        }`}
        label={`${newBillPay.vendorMethod === DisbursementMethod.WIRE ? "Wire Message" : "ACH Reference"}`}
        maxLength={newBillPay.vendorMethod === DisbursementMethod.WIRE ? 35 : 10}
        placeholder="e.g. Payment for invoice #123456"
        validate={(value: string) => {
          if (newBillPay.vendorMethod === DisbursementMethod.WIRE) {
            return /^[A-Za-z0-9 ]{0,35}$/.test(value) || "Cannot contain special characters";
          }

          return /^[A-Za-z0-9 ]{0,10}$/.test(value) || "Cannot contain special characters";
        }}
        value={newBillPay.memo}
        onChange={(e) => setNewBillPay({ ...newBillPay, memo: e.target.value })}
      />
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
        inputMode="decimal"
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
