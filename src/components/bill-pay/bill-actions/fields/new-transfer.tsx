import { useEffect, useState } from "react";
import { useInfiniteScroll } from "@nextui-org/use-infinite-scroll";
import { DisbursementMethod } from "@backpack-fux/pylon-sdk";
import { Countries, DEFAULT_BILL_PAY, NewBillPay, States, vendorCurrencies, vendorMethods } from "../create";
import { Autocomplete, AutocompleteItem } from "@nextui-org/autocomplete";
import { Input } from "@nextui-org/input";
import { Avatar } from "@nextui-org/avatar";
import { Alpha3 } from "convert-iso-codes";

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
      <Input label="Account Holder Name" placeholder="e.g. John Felix Anthony Cena" isRequired />
      <div className="flex space-x-4">
        <Autocomplete
          isRequired
          isClearable={false}
          label="Method"
          defaultInputValue={DisbursementMethod.ACH_SAME_DAY}
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
          label="Routing Number"
          placeholder="e.g. 123000848"
          type="number"
          inputMode="numeric"
          minLength={9}
          maxLength={9}
          isRequired
          errorMessage="Routing number must be 9 digits"
          value={newBillPay.routingNumber}
          onChange={(e) => setNewBillPay({ ...newBillPay, routingNumber: e.target.value })}
        />
        <Input
          label="Account Number"
          placeholder="e.g. 10987654321"
          type="number"
          inputMode="numeric"
          minLength={10}
          maxLength={17}
          isRequired
          errorMessage="Account number must be between 10 and 17 digits"
          value={newBillPay.accountNumber}
          onChange={(e) => setNewBillPay({ ...newBillPay, accountNumber: e.target.value })}
        />
      </div>
      <Input label="Street Line 1" isRequired placeholder="1234 Main St" />
      <Input label="Street Line 2" placeholder="Apt 4B" />
      <div className="flex space-x-4">
        <Input label="City" isRequired placeholder="New York" />
        <Autocomplete label="State" isClearable={false}>
          {Object.entries(States).map(([key, value]) => (
            <AutocompleteItem key={key} textValue={key}>
              {key}
            </AutocompleteItem>
          ))}
        </Autocomplete>
        <Input label="Zip" placeholder="10001" />
      </div>
      <Autocomplete isClearable={false} label="Country" className="flex-1">
        {Object.entries(Countries).map(([key, value]) => (
          <AutocompleteItem
            key={key}
            textValue={value}
            startContent={
              <Avatar
                alt={value}
                className="w-6 h-6"
                src={`https://flagcdn.com/${Alpha3.toAlpha2(key).toLowerCase()}.svg`}
              />
            }
          >
            {value}
          </AutocompleteItem>
        ))}
      </Autocomplete>
      <Input
        label={`${newBillPay.vendorMethod === DisbursementMethod.WIRE ? "Wire Message" : "ACH Reference"}`}
        placeholder="e.g. Payment for invoice #123456"
        description={`${
          newBillPay.vendorMethod === DisbursementMethod.WIRE
            ? "This cannot be changed after the sender is created."
            : ""
        }`}
        maxLength={newBillPay.vendorMethod === DisbursementMethod.WIRE ? 35 : 10}
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
        label="Amount"
        type="number"
        inputMode="decimal"
        min={1}
        step={0.01}
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
