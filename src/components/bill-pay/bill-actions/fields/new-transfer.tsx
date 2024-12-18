import {
  DisbursementMethod,
  FiatCurrency,
  ISO3166Alpha2State as States,
  ISO3166Alpha2State,
} from "@backpack-fux/pylon-sdk";
import { Autocomplete, AutocompleteItem } from "@nextui-org/autocomplete";
import { Input } from "@nextui-org/input";
import { Avatar } from "@nextui-org/avatar";
import { getRegion } from "iso3166-helper";

import { NewBillPay } from "@/types/bill-pay";
import { getValidationProps } from "@/types/validations/bill-pay";
import { FieldLabel } from "@/types/validations/bill-pay";
import { useCountries } from "@/hooks/bill-pay/useCountries";

type NewTransferFieldsProps = {
  billPay: NewBillPay;
  setBillPay: (billPay: NewBillPay) => void;
  settlementBalance?: string;
};

function getValidationResults(billPay: NewBillPay, settlementBalance?: string) {
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
    routingNumber: getValidationProps({
      label: FieldLabel.ROUTING_NUMBER,
      value: billPay.routingNumber || "",
      currency: billPay.currency,
    }),
    paymentMethod: getValidationProps({
      label: FieldLabel.PAYMENT_METHOD,
      value: billPay.vendorMethod || "",
      currency: billPay.currency,
    }),
    amount: getValidationProps({
      label: FieldLabel.AMOUNT,
      value: billPay.amount,
      currency: billPay.currency,
      balance: settlementBalance,
      method: billPay.vendorMethod,
    }),
    // Add address validations
    streetLine1: getValidationProps({
      label: FieldLabel.STREET_LINE_1,
      value: billPay.address.street1,
      currency: billPay.currency,
      method: billPay.vendorMethod,
    }),
    streetLine2: getValidationProps({
      label: FieldLabel.STREET_LINE_2,
      value: billPay.address.street2,
      currency: billPay.currency,
    }),
    city: getValidationProps({
      label: FieldLabel.CITY,
      value: billPay.address.city,
      currency: billPay.currency,
    }),
    state: getValidationProps({
      label: FieldLabel.STATE,
      value: billPay.address.state || "",
      currency: billPay.currency,
    }),
    zipCode: getValidationProps({
      label: FieldLabel.ZIP,
      value: billPay.address.postcode || "",
      currency: billPay.currency,
    }),
    country: getValidationProps({
      label: FieldLabel.COUNTRY,
      value: billPay.address.country,
      currency: billPay.currency,
    }),
  };
}

export default function NewTransferFields({ billPay, setBillPay, settlementBalance }: NewTransferFieldsProps) {
  const countries = useCountries();
  const validationResults = getValidationResults(billPay, settlementBalance);

  return (
    <>
      <Input
        isRequired
        data-testid="account-holder"
        label={FieldLabel.ACCOUNT_HOLDER}
        placeholder="e.g. John Felix Anthony Cena"
        value={billPay.vendorName}
        onChange={(e) => setBillPay({ ...billPay, vendorName: e.target.value })}
        {...validationResults.accountHolder}
      />
      <div className="flex space-x-4">
        <Autocomplete
          isRequired
          data-testid="payment-method"
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
        isRequired
        data-testid="bank-name"
        label={FieldLabel.BANK_NAME}
        placeholder="e.g. Bank of America"
        value={billPay.vendorBankName}
        onChange={(e) => setBillPay({ ...billPay, vendorBankName: e.target.value })}
        {...validationResults.bankName}
      />
      <div className="flex space-x-4">
        <Input
          isRequired
          data-testid="routing-number"
          inputMode="numeric"
          label={FieldLabel.ROUTING_NUMBER}
          placeholder="e.g. 123000848"
          type="number"
          value={billPay.routingNumber}
          onChange={(e) => setBillPay({ ...billPay, routingNumber: e.target.value })}
          {...validationResults.routingNumber}
        />
        <Input
          isRequired
          data-testid="account-number"
          inputMode="numeric"
          label={FieldLabel.ACCOUNT_NUMBER}
          placeholder="e.g. 10987654321"
          type="number"
          value={billPay.accountNumber}
          onChange={(e) => setBillPay({ ...billPay, accountNumber: e.target.value })}
          {...validationResults.accountNumber}
        />
      </div>
      <Input
        isRequired
        data-testid="street-line-1"
        label={FieldLabel.STREET_LINE_1}
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
        data-testid="street-line-2"
        label={FieldLabel.STREET_LINE_2}
        placeholder="Apt 4B"
        value={billPay.address.street2}
        onChange={(e) =>
          setBillPay({
            ...billPay,
            address: { ...billPay.address, street2: e.target.value || undefined },
          })
        }
        {...validationResults.streetLine2}
      />
      <div className="flex space-x-4">
        <Input
          isRequired
          data-testid="city"
          label={FieldLabel.CITY}
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
          isRequired
          data-testid="state"
          isClearable={false}
          label={FieldLabel.STATE}
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
            <AutocompleteItem key={item.key} textValue={`${item.label} (${item.key})`} value={item.value}>
              {item.label}
            </AutocompleteItem>
          )}
        </Autocomplete>
        <Input
          isRequired
          data-testid="zip-code"
          label={FieldLabel.ZIP}
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
      <Autocomplete isRequired className="flex-1" data-testid="country" isClearable={false} label={FieldLabel.COUNTRY}>
        {countries.map((country) => (
          <AutocompleteItem
            key={country.key}
            startContent={<Avatar alt={country.value} className="w-6 h-6" src={country.flagUrl} />}
            textValue={`${country.label} (${country.key})`}
          >
            {country.label}
          </AutocompleteItem>
        ))}
      </Autocomplete>
      <Input
        data-testid="memo"
        description={`${
          billPay.vendorMethod === DisbursementMethod.WIRE ? "This cannot be changed after the sender is created." : ""
        }`}
        label={`${billPay.vendorMethod === DisbursementMethod.WIRE ? "Wire Message" : "ACH Reference"}`}
        maxLength={billPay.vendorMethod === DisbursementMethod.WIRE ? 35 : 10}
        placeholder="e.g. Payment for invoice #123456"
        validate={(value: string) => {
          if (billPay.vendorMethod === DisbursementMethod.WIRE) {
            return /^[A-Za-z0-9 ]{0,35}$/.test(value) || "Cannot contain special characters";
          }

          return /^[A-Za-z0-9 ]{0,10}$/.test(value) || "Cannot contain special characters";
        }}
        value={billPay.memo}
        onChange={(e) => setBillPay({ ...billPay, memo: e.target.value || undefined })}
      />
      <Input
        isRequired
        data-testid="amount"
        inputMode="decimal"
        isDisabled={!billPay.vendorMethod}
        label={FieldLabel.AMOUNT}
        type="number"
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
      />
    </>
  );
}
