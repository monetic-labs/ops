import { useState, useEffect } from "react";
import {
  DisbursementMethod,
  FiatCurrency,
  ISO3166Alpha2State as States,
  ISO3166Alpha2State,
  ISO3166Alpha3Country,
} from "@monetic-labs/sdk";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Input } from "@heroui/input";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Card } from "@heroui/card";
import { ChevronLeft, ChevronRight, Building, CreditCard, MapPin, DollarSign, User } from "lucide-react";
import { getRegion } from "iso3166-helper";
import { Divider } from "@heroui/divider";

import { NewBillPay } from "@/types/bill-pay";
import { getValidationProps, FieldLabel, newBillPaySchema } from "@/validations/bill-pay";
import { useCountries } from "@/app/(protected)/bill-pay/_hooks/useCountries";
import postcodeMap from "@/data/postcodes-map.json";

// --- Define methodFees locally ---
const methodFees: Record<DisbursementMethod, number> = {
  [DisbursementMethod.ACH_SAME_DAY]: 0.0025, // 0.25%
  [DisbursementMethod.WIRE]: 0.02, // 2%
};

type NewTransferFieldsProps = {
  billPay: NewBillPay;
  setBillPay: (billPay: NewBillPay) => void;
  settlementBalance?: string;
  currentStep: number;
  onValidityChange: (isValid: boolean) => void;
};

const STEPS = [
  { id: "recipient", label: "Recipient Info", icon: <User size={18} /> },
  { id: "banking", label: "Banking Details", icon: <CreditCard size={18} /> },
  { id: "address", label: "Address", icon: <MapPin size={18} /> },
  { id: "amount", label: "Amount", icon: <DollarSign size={18} /> },
];

export default function NewTransferFields({
  billPay,
  setBillPay,
  settlementBalance,
  currentStep,
  onValidityChange,
}: NewTransferFieldsProps) {
  const countries = useCountries();
  const [isCityStateAutofilled, setIsCityStateAutofilled] = useState(false);
  const [touchedFields, setTouchedFields] = useState<{ [key: string]: boolean }>({});

  const handleBlur = (fieldName: string) => {
    setTouchedFields((prev) => ({ ...prev, [fieldName]: true }));
  };

  const getConditionalValidationProps = (fieldName: string, options: Parameters<typeof getValidationProps>[0]) => {
    const validation = getValidationProps(options);
    return {
      isInvalid: !!touchedFields[fieldName] && validation.isInvalid,
      errorMessage: touchedFields[fieldName] ? validation.errorMessage : undefined,
      min: validation.min,
      max: validation.max,
      step: validation.step,
    };
  };

  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 0:
        return !!billPay.vendorName && !!billPay.vendorMethod;
      case 1:
        return !!billPay.vendorBankName && !!billPay.accountNumber && !!billPay.routingNumber;
      case 2:
        const addressResult = newBillPaySchema.shape.address.safeParse(billPay.address);
        return addressResult.success;
      case 3:
        const amountValidation = getValidationProps({
          label: FieldLabel.AMOUNT,
          value: billPay.amount,
          currency: billPay.currency,
          balance: settlementBalance,
          method: billPay.vendorMethod,
        });
        return !amountValidation.isInvalid;
      default:
        return false;
    }
  };

  useEffect(() => {
    onValidityChange(isCurrentStepValid());
  }, [billPay, currentStep, onValidityChange, settlementBalance]);

  useEffect(() => {
    if (isCityStateAutofilled) {
      setIsCityStateAutofilled(false);
    }
  }, [billPay.address.postcode]);

  useEffect(() => {
    setTouchedFields({});
  }, [currentStep]);

  // --- Calculate fee and total for display in step 3 ---
  const feeRate = billPay.vendorMethod ? methodFees[billPay.vendorMethod] || 0 : 0;
  const amountValue = parseFloat(billPay.amount || "0");
  const feeAmount = amountValue * feeRate;
  const totalAmount = amountValue + feeAmount;

  return (
    <div className="space-y-6 p-6">
      <div className="mb-4">
        <div className="flex justify-between px-1">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex flex-col items-center ${currentStep >= index ? "text-primary" : "text-default-400"}`}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full mb-2 ${
                  currentStep === index
                    ? "bg-primary text-white"
                    : currentStep > index
                      ? "bg-primary/20 text-primary"
                      : "bg-default-100 text-default-500"
                }`}
              >
                {step.icon}
              </div>
              <span className="text-xs hidden sm:block">{step.label}</span>
            </div>
          ))}
        </div>
        <div className="relative mt-2 mb-6">
          <div className="absolute top-0 left-0 right-0 h-1 bg-default-100"></div>
          <div
            className="absolute top-0 left-0 h-1 bg-primary transition-all duration-300"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="min-h-[300px]">
        {currentStep === 0 && (
          <fieldset className="space-y-4">
            <h4 className="text-lg font-medium">Recipient Information</h4>
            <Input
              isRequired
              data-testid="account-holder"
              label={FieldLabel.ACCOUNT_HOLDER}
              placeholder="e.g. John Felix Anthony Cena"
              value={billPay.vendorName}
              onChange={(e) => setBillPay({ ...billPay, vendorName: e.target.value })}
              onBlur={() => handleBlur("vendorName")}
              {...getConditionalValidationProps("vendorName", {
                label: FieldLabel.ACCOUNT_HOLDER,
                value: billPay.vendorName,
                currency: billPay.currency,
              })}
            />
            <Autocomplete
              isRequired
              data-testid="payment-method"
              isClearable={false}
              label={FieldLabel.PAYMENT_METHOD}
              selectedKey={billPay.vendorMethod || null}
              onBlur={() => handleBlur("vendorMethod")}
              onSelectionChange={(value) => {
                setBillPay({ ...billPay, vendorMethod: value as DisbursementMethod });
                handleBlur("vendorMethod");
              }}
              {...getConditionalValidationProps("vendorMethod", {
                label: FieldLabel.PAYMENT_METHOD,
                value: billPay.vendorMethod,
                currency: billPay.currency,
              })}
            >
              {Object.values(DisbursementMethod).map((method) => (
                <AutocompleteItem key={method} textValue={method}>
                  {method === DisbursementMethod.ACH_SAME_DAY ? "ACH Same-Day" : "Wire Transfer"}
                </AutocompleteItem>
              ))}
            </Autocomplete>
          </fieldset>
        )}

        {currentStep === 1 && (
          <fieldset className="space-y-4">
            <h4 className="text-lg font-medium">Banking Details</h4>
            <Input
              isRequired
              data-testid="bank-name"
              label={FieldLabel.BANK_NAME}
              placeholder="e.g. Bank of America"
              value={billPay.vendorBankName}
              onChange={(e) => setBillPay({ ...billPay, vendorBankName: e.target.value })}
              onBlur={() => handleBlur("vendorBankName")}
              {...getConditionalValidationProps("vendorBankName", {
                label: FieldLabel.BANK_NAME,
                value: billPay.vendorBankName,
                currency: billPay.currency,
              })}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                isRequired
                data-testid="routing-number"
                inputMode="numeric"
                label={FieldLabel.ROUTING_NUMBER}
                placeholder="e.g. 123000848"
                value={billPay.routingNumber}
                onChange={(e) => setBillPay({ ...billPay, routingNumber: e.target.value })}
                onBlur={() => handleBlur("routingNumber")}
                {...getConditionalValidationProps("routingNumber", {
                  label: FieldLabel.ROUTING_NUMBER,
                  value: billPay.routingNumber || "",
                  currency: billPay.currency,
                })}
              />
              <Input
                isRequired
                data-testid="account-number"
                inputMode="numeric"
                label={FieldLabel.ACCOUNT_NUMBER}
                placeholder="e.g. 10987654321"
                value={billPay.accountNumber}
                onChange={(e) => setBillPay({ ...billPay, accountNumber: e.target.value })}
                onBlur={() => handleBlur("accountNumber")}
                {...getConditionalValidationProps("accountNumber", {
                  label: FieldLabel.ACCOUNT_NUMBER,
                  value: billPay.accountNumber,
                  currency: billPay.currency,
                })}
              />
            </div>
          </fieldset>
        )}

        {currentStep === 2 && (
          <fieldset className="space-y-4">
            <h4 className="text-lg font-medium">Address</h4>
            <Input
              isRequired
              data-testid="street-line-1"
              label={FieldLabel.STREET_LINE_1}
              placeholder="123 Main St"
              value={billPay.address.street1}
              onChange={(e) =>
                setBillPay({
                  ...billPay,
                  address: { ...billPay.address, street1: e.target.value },
                })
              }
              onBlur={() => handleBlur("address.street1")}
              {...getConditionalValidationProps("address.street1", {
                label: FieldLabel.STREET_LINE_1,
                value: billPay.address.street1,
                currency: billPay.currency,
                method: billPay.vendorMethod,
              })}
            />
            <Input
              data-testid="street-line-2"
              label={FieldLabel.STREET_LINE_2}
              placeholder="Apt 4B"
              value={billPay.address.street2 || ""}
              onChange={(e) =>
                setBillPay({
                  ...billPay,
                  address: { ...billPay.address, street2: e.target.value || undefined },
                })
              }
              onBlur={() => handleBlur("address.street2")}
              {...getConditionalValidationProps("address.street2", {
                label: FieldLabel.STREET_LINE_2,
                value: billPay.address.street2,
                currency: billPay.currency,
              })}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                isRequired
                data-testid="zip-code"
                label={FieldLabel.ZIP}
                placeholder="10001"
                maxLength={5}
                value={billPay.address.postcode || ""}
                onBlur={() => handleBlur("address.postcode")}
                onChange={(e) => {
                  const zip = e.target.value.replace(/\D/g, "");
                  let updatedAddress = { ...billPay.address, postcode: zip };
                  let autofilled = false;

                  const zipKey = zip as keyof typeof postcodeMap;
                  if (zip.length === 5 && postcodeMap[zipKey]) {
                    const locationData = postcodeMap[zipKey];
                    if (
                      locationData &&
                      typeof locationData === "object" &&
                      locationData.city &&
                      locationData.stateAbbreviation
                    ) {
                      updatedAddress = {
                        ...updatedAddress,
                        city: locationData.city,
                        state: locationData.stateAbbreviation as ISO3166Alpha2State,
                        country: ISO3166Alpha3Country.USA,
                      };
                      autofilled = true;
                    } else {
                      console.warn(
                        `Unexpected data structure or missing properties for ZIP ${zip} in postcodeMap.json`
                      );
                    }
                  }
                  setBillPay({ ...billPay, address: updatedAddress });
                  handleBlur("address.postcode");
                  setIsCityStateAutofilled(autofilled);
                }}
                {...getConditionalValidationProps("address.postcode", {
                  label: FieldLabel.ZIP,
                  value: billPay.address.postcode,
                  currency: billPay.currency,
                })}
              />
              <Input
                isRequired
                data-testid="city"
                label={FieldLabel.CITY}
                placeholder="New York"
                value={billPay.address.city}
                isDisabled={true}
                onBlur={() => handleBlur("address.city")}
                onChange={(e) => {
                  setBillPay({
                    ...billPay,
                    address: { ...billPay.address, city: e.target.value },
                  });
                }}
                {...getConditionalValidationProps("address.city", {
                  label: FieldLabel.CITY,
                  value: billPay.address.city,
                  currency: billPay.currency,
                })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Autocomplete
                isRequired
                data-testid="state"
                label={FieldLabel.STATE}
                selectedKey={billPay.address.state || null}
                isDisabled={true}
                onBlur={() => handleBlur("address.state")}
                onSelectionChange={(value) => {
                  setBillPay({
                    ...billPay,
                    address: {
                      ...billPay.address,
                      state: value as ISO3166Alpha2State,
                    },
                  });
                  handleBlur("address.state");
                }}
                {...getConditionalValidationProps("address.state", {
                  label: FieldLabel.STATE,
                  value: billPay.address.state,
                  currency: billPay.currency,
                })}
                defaultItems={Object.entries(States).map(([key, value]) => {
                  const state = getRegion(`US-${value}`);
                  return {
                    key: value,
                    value: value,
                    label: state || key,
                  };
                })}
              >
                {(item) => (
                  <AutocompleteItem key={item.key} textValue={`${item.label} (${item.key})`}>
                    {item.label}
                  </AutocompleteItem>
                )}
              </Autocomplete>
              <Autocomplete
                isRequired
                data-testid="country"
                label={FieldLabel.COUNTRY}
                selectedKey={billPay.address.country || null}
                isDisabled={true}
                isReadOnly={true}
                isClearable={false}
                {...getValidationProps({
                  label: FieldLabel.COUNTRY,
                  value: billPay.address.country,
                  currency: billPay.currency,
                })}
                defaultItems={countries.filter((c) => c.key === ISO3166Alpha3Country.USA)}
              >
                {(item) => (
                  <AutocompleteItem
                    key={item.key}
                    startContent={<Avatar alt={item.value} className="w-6 h-6" src={item.flagUrl} />}
                    textValue={`${item.label} (${item.key})`}
                  >
                    {item.label}
                  </AutocompleteItem>
                )}
              </Autocomplete>
            </div>
          </fieldset>
        )}

        {currentStep === 3 && (
          <fieldset className="space-y-4">
            <h4 className="text-lg font-medium">Payment Amount</h4>

            {billPay.vendorName && (
              <Card className="p-3 bg-default-50 border border-default-100">
                <div className="text-sm text-default-600">
                  <p className="font-semibold">{billPay.vendorName}</p>
                  <p className="mt-1">{billPay.vendorBankName}</p>
                  <p className="mt-0.5 text-xs">Account ending in {billPay.accountNumber.slice(-4)}</p>
                </div>
              </Card>
            )}

            <Input
              isRequired
              data-testid="amount"
              inputMode="decimal"
              label={FieldLabel.AMOUNT}
              type="number"
              value={billPay.amount}
              onBlur={() => handleBlur("amount")}
              onChange={(e) => {
                const value = e.target.value;
                const regex = /^\d*\.?\d{0,2}$/;

                if (regex.test(value) || value === "") {
                  setBillPay({ ...billPay, amount: value });
                }
              }}
              {...getConditionalValidationProps("amount", {
                label: FieldLabel.AMOUNT,
                value: billPay.amount,
                currency: billPay.currency,
                balance: settlementBalance,
                method: billPay.vendorMethod,
              })}
              description={
                getValidationProps({
                  label: FieldLabel.AMOUNT,
                  value: billPay.amount,
                  currency: billPay.currency,
                  balance: settlementBalance,
                  method: billPay.vendorMethod,
                }).description
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
              startContent={
                <div className="pointer-events-none flex items-center">
                  <span className="text-default-400 text-small">$</span>
                </div>
              }
            />

            <Input
              data-testid="memo"
              label={`${billPay.vendorMethod === DisbursementMethod.WIRE ? "Wire Message" : "ACH Reference"}`}
              maxLength={billPay.vendorMethod === DisbursementMethod.WIRE ? 35 : 10}
              placeholder="e.g. Payment for invoice #123456"
              description="Optional, but recommended for reconciliation."
              value={billPay.memo || ""}
              onBlur={() => handleBlur("memo")}
              onChange={(e) => setBillPay({ ...billPay, memo: e.target.value || undefined })}
              {...getConditionalValidationProps("memo", {
                label: FieldLabel.MEMO,
                value: billPay.memo,
                currency: billPay.currency,
                method: billPay.vendorMethod,
              })}
            />

            {/* --- Fee and Total Summary --- */}
            <div className="space-y-3 font-mono text-sm p-4 bg-default-50 rounded-xl border border-default-200 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-default-600">Subtotal:</span>
                <span className="text-default-600">${amountValue.toFixed(2)}</span>
              </div>
              {billPay.vendorMethod && ( // Only show fee if method is selected
                <div className="flex justify-between items-center">
                  <span className="text-default-600">Fee:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-default-600">{`${(feeRate * 100).toFixed(2)}%`}</span>
                    <span className="text-default-500 text-xs">(${feeAmount.toFixed(2)})</span>
                  </div>
                </div>
              )}
              <Divider className="my-1" />
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-foreground">Total:</span>
                <span className="text-lg font-semibold text-foreground">${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </fieldset>
        )}
      </div>
    </div>
  );
}
