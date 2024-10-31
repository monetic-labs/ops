import { useEffect, useState } from "react";
import { useInfiniteScroll } from "@nextui-org/use-infinite-scroll";
import {
  DisbursementMethod,
  FiatCurrency,
  ISO3166Alpha3Country as Countries,
  ISO3166Alpha2State as States,
  ISO3166Alpha2State,
} from "@backpack-fux/pylon-sdk";
import { NewBillPay } from "@/types/bill-pay";
import { Autocomplete, AutocompleteItem } from "@nextui-org/autocomplete";
import { Input } from "@nextui-org/input";
import { Avatar } from "@nextui-org/avatar";
import { Alpha3 } from "convert-iso-codes";
import { getCountryName, getRegion, getTree } from "iso3166-helper";
import { getFieldValidation } from "@/types/validations/bill-pay";
import { FieldLabel } from "@/types/validations/bill-pay";

type NewTransferFieldsProps = {
  billPay: NewBillPay;
  setBillPay: (billPay: NewBillPay) => void;
  settlementBalance?: string;
};

// Helper function to get validation props
function getValidationProps(
  label: FieldLabel,
  value: string,
  currency: string,
  balance?: string,
  method?: DisbursementMethod
) {
  const validation = getFieldValidation({ label, currency, value, balance, method });
  return {
    min: validation.min,
    max: validation.max,
    step: validation.step,
    isInvalid: validation.isInvalid,
    errorMessage: validation.errorMessage,
    description: validation.description,
  };
}

// Get all validation results
function getValidationResults(billPay: NewBillPay, settlementBalance?: string) {
  return {
    accountHolder: getValidationProps(FieldLabel.ACCOUNT_HOLDER, billPay.vendorName, billPay.currency),
    bankName: getValidationProps(FieldLabel.BANK_NAME, billPay.vendorBankName, billPay.currency),
    accountNumber: getValidationProps(FieldLabel.ACCOUNT_NUMBER, billPay.accountNumber, billPay.currency),
    routingNumber: getValidationProps(FieldLabel.ROUTING_NUMBER, billPay.routingNumber || "", billPay.currency),
    paymentMethod: getValidationProps(FieldLabel.PAYMENT_METHOD, billPay.vendorMethod || "", billPay.currency),
    amount: getValidationProps(FieldLabel.AMOUNT, billPay.amount, billPay.currency, settlementBalance),
    // Add address validations
    streetLine1: getValidationProps(
      FieldLabel.STREET_LINE_1,
      billPay.address.street1,
      billPay.currency,
      undefined,
      billPay.vendorMethod
    ),
    streetLine2: billPay.address.street2
      ? getValidationProps(FieldLabel.STREET_LINE_2, billPay.address.street2, billPay.currency)
      : undefined,
    city: getValidationProps(FieldLabel.CITY, billPay.address.city, billPay.currency),
    state: getValidationProps(FieldLabel.STATE, billPay.address.state || "", billPay.currency),
    zipCode: getValidationProps(FieldLabel.ZIP, billPay.address.postcode || "", billPay.currency),
    country: getValidationProps(FieldLabel.COUNTRY, billPay.address.country, billPay.currency),
  };
}

export default function NewTransferFields({ billPay, setBillPay, settlementBalance }: NewTransferFieldsProps) {
  const validationResults = getValidationResults(billPay, settlementBalance);
  console.log(validationResults);

  return (
    <>
      <Input
        label={FieldLabel.ACCOUNT_HOLDER}
        placeholder="e.g. John Felix Anthony Cena"
        isRequired
        value={billPay.vendorName}
        onChange={(e) => setBillPay({ ...billPay, vendorName: e.target.value })}
        {...validationResults.accountHolder}
      />
      <div className="flex space-x-4">
        <Autocomplete
          isRequired
          isClearable={false}
          label={FieldLabel.PAYMENT_METHOD}
          value={billPay.vendorMethod}
          {...validationResults.paymentMethod}
          onSelectionChange={(value) => {
            setBillPay({ ...billPay, vendorMethod: value as DisbursementMethod });
          }}
        >
          {Object.values(DisbursementMethod).map((method) => (
            <AutocompleteItem key={method} textValue={method}>
              {method}
            </AutocompleteItem>
          ))}
        </Autocomplete>
      </div>
      <Input
        label={FieldLabel.BANK_NAME}
        placeholder="e.g. Bank of America"
        isRequired
        value={billPay.vendorBankName}
        onChange={(e) => setBillPay({ ...billPay, vendorBankName: e.target.value })}
        {...validationResults.bankName}
      />
      <div className="flex space-x-4">
        <Input
          label={FieldLabel.ROUTING_NUMBER}
          placeholder="e.g. 123000848"
          type="number"
          inputMode="numeric"
          isRequired
          value={billPay.routingNumber}
          onChange={(e) => setBillPay({ ...billPay, routingNumber: e.target.value })}
          {...validationResults.routingNumber}
        />
        <Input
          label={FieldLabel.ACCOUNT_NUMBER}
          placeholder="e.g. 10987654321"
          type="number"
          inputMode="numeric"
          isRequired
          value={billPay.accountNumber}
          onChange={(e) => setBillPay({ ...billPay, accountNumber: e.target.value })}
          {...validationResults.accountNumber}
        />
      </div>
      <Input
        label={FieldLabel.STREET_LINE_1}
        isRequired
        placeholder="1234 Main St"
        value={billPay.address.street1}
        onChange={(e) =>
          setBillPay({
            ...billPay,
            address: { ...billPay.address, street1: e.target.value },
          })
        }
        {...validationResults.streetLine1}
      />
      <Input
        label={FieldLabel.STREET_LINE_2}
        placeholder="Apt 4B"
        value={billPay.address.street2}
        onChange={(e) =>
          setBillPay({
            ...billPay,
            address: { ...billPay.address, street2: e.target.value },
          })
        }
        {...validationResults.streetLine2}
      />
      <div className="flex space-x-4">
        <Input
          label={FieldLabel.CITY}
          isRequired
          placeholder="New York"
          value={billPay.address.city}
          onChange={(e) =>
            setBillPay({
              ...billPay,
              address: { ...billPay.address, city: e.target.value },
            })
          }
          {...validationResults.city}
        />
        <Autocomplete
          label={FieldLabel.STATE}
          isRequired
          isClearable={false}
          value={billPay.address.state}
          {...validationResults.state}
          defaultItems={Object.entries(States).map(([key, value]) => {
            const state = getRegion(`US-${value}`);
            return {
              key: key, // The state code (e.g., "NY")
              value: value, // The state code we want to save
              label: state || key, // The full state name (e.g., "New York")
            };
          })}
          onSelectionChange={(value) => {
            setBillPay({
              ...billPay,
              address: {
                ...billPay.address,
                state: value as ISO3166Alpha2State,
              },
            });
          }}
        >
          {(item) => (
            <AutocompleteItem key={item.key} value={item.value} textValue={`${item.label} (${item.key})`}>
              {item.label}
            </AutocompleteItem>
          )}
        </Autocomplete>
        <Input
          label={FieldLabel.ZIP}
          isRequired
          placeholder="10001"
          value={billPay.address.postcode}
          onChange={(e) =>
            setBillPay({
              ...billPay,
              address: { ...billPay.address, postcode: e.target.value },
            })
          }
          {...validationResults.zipCode}
        />
      </div>
      <Autocomplete isClearable={false} isRequired label={FieldLabel.COUNTRY} className="flex-1">
        {Object.entries(Countries).map(([key, value]) => {
          const countryCode = Alpha3.toAlpha2(key);
          const countryFullName = getCountryName(countryCode, "int");
          return (
            <AutocompleteItem
              key={key}
              textValue={`${countryFullName} (${key})`}
              startContent={
                <Avatar alt={value} className="w-6 h-6" src={`https://flagcdn.com/${countryCode.toLowerCase()}.svg`} />
              }
            >
              {countryFullName}
            </AutocompleteItem>
          );
        })}
      </Autocomplete>
      <Input
        label={`${billPay.vendorMethod === DisbursementMethod.WIRE ? "Wire Message" : "ACH Reference"}`}
        placeholder="e.g. Payment for invoice #123456"
        description={`${
          billPay.vendorMethod === DisbursementMethod.WIRE ? "This cannot be changed after the sender is created." : ""
        }`}
        maxLength={billPay.vendorMethod === DisbursementMethod.WIRE ? 35 : 10}
        validate={(value: string) => {
          if (billPay.vendorMethod === DisbursementMethod.WIRE) {
            return /^[A-Za-z0-9 ]{0,35}$/.test(value) || "Cannot contain special characters";
          }
          return /^[A-Za-z0-9 ]{0,10}$/.test(value) || "Cannot contain special characters";
        }}
        value={billPay.memo}
        onChange={(e) => setBillPay({ ...billPay, memo: e.target.value })}
      />
      <Input
        label={FieldLabel.AMOUNT}
        type="number"
        inputMode="decimal"
        isRequired
        value={billPay.amount}
        onChange={(e) => {
          const value = e.target.value;
          // Only allow 2 decimal places
          const regex = /^\d*\.?\d{0,2}$/;
          if (regex.test(value) || value === "") {
            setBillPay({ ...billPay, amount: value });
          }
        }}
        {...validationResults.amount}
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
