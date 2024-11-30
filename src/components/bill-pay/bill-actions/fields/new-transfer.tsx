import {
  DisbursementMethod,
  FiatCurrency,
  ISO3166Alpha2State as States,
  ISO3166Alpha2State,
} from "@backpack-fux/pylon-sdk";
import { NewBillPay } from "@/types/bill-pay";
import { Autocomplete, AutocompleteItem } from "@nextui-org/autocomplete";
import { Input } from "@nextui-org/input";
import { Avatar } from "@nextui-org/avatar";
import { getRegion } from "iso3166-helper";
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
        data-testid="account-holder"
        label={FieldLabel.ACCOUNT_HOLDER}
        placeholder="e.g. John Felix Anthony Cena"
        isRequired
        value={billPay.vendorName}
        onChange={(e) => setBillPay({ ...billPay, vendorName: e.target.value })}
        {...validationResults.accountHolder}
      />
      <div className="flex space-x-4">
        <Autocomplete
          data-testid="payment-method"
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
        data-testid="bank-name"
        label={FieldLabel.BANK_NAME}
        placeholder="e.g. Bank of America"
        isRequired
        value={billPay.vendorBankName}
        onChange={(e) => setBillPay({ ...billPay, vendorBankName: e.target.value })}
        {...validationResults.bankName}
      />
      <div className="flex space-x-4">
        <Input
          data-testid="routing-number"
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
          data-testid="account-number"
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
        data-testid="street-line-1"
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
          data-testid="city"
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
          data-testid="state"
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
          data-testid="zip-code"
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
      <Autocomplete data-testid="country" isClearable={false} isRequired label={FieldLabel.COUNTRY} className="flex-1">
        {countries.map((country) => (
          <AutocompleteItem
            key={country.key}
            textValue={`${country.label} (${country.key})`}
            startContent={<Avatar alt={country.value} className="w-6 h-6" src={country.flagUrl} />}
          >
            {country.label}
          </AutocompleteItem>
        ))}
      </Autocomplete>
      <Input
        data-testid="memo"
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
        onChange={(e) => setBillPay({ ...billPay, memo: e.target.value || undefined })}
      />
      <Input
        data-testid="amount"
        label={FieldLabel.AMOUNT}
        type="number"
        inputMode="decimal"
        isRequired
        isDisabled={!billPay.vendorMethod}
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