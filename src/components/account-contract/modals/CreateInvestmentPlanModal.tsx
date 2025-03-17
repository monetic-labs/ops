import React, { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/modal";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import { RadioGroup, Radio } from "@nextui-org/radio";
import { Card, CardBody } from "@nextui-org/card";
import { Chip } from "@nextui-org/chip";
import { Divider } from "@nextui-org/divider";
import { Info, ArrowRight, Calendar, Bitcoin, Coins, AlertTriangle } from "lucide-react";
import { Slider } from "@nextui-org/slider";

import type { Account } from "@/types/account";
import { formatCurrencyInput, formatAmountUSD } from "@/utils/helpers";

// Define the available assets with custom icon components
const BitcoinIcon = Bitcoin;
const EthereumIcon = () => <Coins className="text-blue-400" />;
const SolanaIcon = () => <Coins className="text-purple-400" />;

// Define the available assets
const cryptoAssets = [
  { id: "btc", name: "Bitcoin", code: "wBTC", icon: BitcoinIcon },
  { id: "eth", name: "Ethereum", code: "wETH", icon: EthereumIcon },
  { id: "sol", name: "Solana", code: "wSOL", icon: SolanaIcon },
];

// Define the frequency options
const frequencyOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
];

// Step types for type safety
type Step = "asset" | "amount" | "schedule" | "review";

interface CreateInvestmentPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account;
  onCreatePlan: (plan: {
    assetId: string;
    amount: number;
    frequency: string;
    startDate: Date;
    endDate?: Date;
  }) => Promise<void>;
}

export function CreateInvestmentPlanModal({ isOpen, onClose, account, onCreatePlan }: CreateInvestmentPlanModalProps) {
  // State for multi-step form
  const [step, setStep] = useState<Step>("asset");
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const [amount, setAmount] = useState<string>("1");
  const [amountError, setAmountError] = useState<string>("");
  const [frequency, setFrequency] = useState<string>("daily");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [hasEndDate, setHasEndDate] = useState<boolean>(false);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Steps for the wizard
  const steps: Step[] = ["asset", "amount", "schedule", "review"];

  // Helpers for minimum dates
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Reset the form when the modal is opened/closed
  useEffect(() => {
    if (!isOpen) {
      // Reset form on close with a small delay
      setTimeout(() => {
        setStep("asset");
        setSelectedAsset("");
        setAmount("1");
        setAmountError("");
        setFrequency("daily");
        setStartDate(new Date());
        setHasEndDate(false);
        setEndDate(undefined);
        setIsCreating(false);
      }, 300);
    }
  }, [isOpen]);

  // Add validation effect to run when amount changes
  useEffect(() => {
    // Skip validation on empty or initial values
    if (amount) {
      const numericValue = parseFloat(amount.replace(/[^\d.]/g, ""));

      if (isNaN(numericValue)) {
        setAmountError("Please enter a valid amount");
      } else if (numericValue < 1) {
        setAmountError("Amount must be at least $1.00");
      } else if (numericValue > (account.balance || 0)) {
        setAmountError(`Amount cannot exceed your available balance of ${formatAmountUSD(account.balance || 0)}`);
      } else {
        setAmountError("");
      }
    }
  }, [amount, account.balance]);

  // Format the date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handle the asset selection
  const handleAssetSelect = (assetId: string) => {
    setSelectedAsset(assetId);
  };

  // Handle the amount input with proper validation
  const handleAmountChange = (value: string) => {
    // Clean the input value
    const cleanValue = value.replace(/[^\d.]/g, "");

    // Make sure we only have one decimal point
    const parts = cleanValue.split(".");
    let formattedValue = cleanValue;

    if (parts.length > 2) {
      formattedValue = parts[0] + "." + parts[1];
    } else if (parts.length === 2) {
      formattedValue = parts[0] + "." + parts[1].slice(0, 2);
    }

    // Format with commas
    if (!formattedValue.endsWith(".")) {
      const numericValue = parseFloat(formattedValue);
      if (!isNaN(numericValue)) {
        formattedValue = formatCurrencyInput(numericValue.toString());
      } else {
        formattedValue = "";
      }
    }

    // Only update amount - validation happens in useEffect
    setAmount(formattedValue);
  };

  // Validate the amount - This doesn't update state anymore
  const validateAmount = (value: string) => {
    const numericValue = parseFloat(value.replace(/[^\d.]/g, ""));

    if (isNaN(numericValue)) {
      return false;
    }

    if (numericValue < 1) {
      return false;
    }

    if (numericValue > (account.balance || 0)) {
      return false;
    }

    return true;
  };

  // Get the numeric amount value for calculations
  const getNumericAmount = (): number => {
    const numericValue = parseFloat(amount.replace(/[^\d.]/g, ""));
    return isNaN(numericValue) ? 0 : numericValue;
  };

  // Handle the frequency selection
  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFrequency(e.target.value);
  };

  // Handle the start date selection
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(new Date(e.target.value));
  };

  // Handle the end date selection
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(new Date(e.target.value));
  };

  // Handle the end date toggle
  const handleEndDateToggle = (value: string) => {
    setHasEndDate(value === "yes");
    if (value === "no") {
      setEndDate(undefined);
    }
  };

  // Go to the next step
  const nextStep = () => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  // Go to the previous step
  const prevStep = () => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  // Validate the current step
  const isStepValid = () => {
    switch (step) {
      case "asset":
        return !!selectedAsset;
      case "amount":
        return amount.length > 0 && amountError === "";
      case "schedule":
        return !!startDate && (!hasEndDate || !!endDate);
      default:
        return true;
    }
  };

  // Submit the form
  const handleSubmit = async () => {
    if (!isStepValid()) return;

    setIsCreating(true);

    try {
      const numericAmount = getNumericAmount();
      await onCreatePlan({
        assetId: selectedAsset,
        amount: numericAmount,
        frequency,
        startDate,
        endDate: hasEndDate ? endDate : undefined,
      });

      onClose();
    } catch (error) {
      console.error("Failed to create investment plan:", error);
      // Handle error - could show an error message
    } finally {
      setIsCreating(false);
    }
  };

  // Calculate estimated investments
  const getEstimatedMonthlyInvestment = (): number => {
    const numericAmount = getNumericAmount();

    if (frequency === "daily") {
      return numericAmount * 30; // Approximation for monthly
    } else if (frequency === "weekly") {
      return numericAmount * 4;
    } else if (frequency === "biweekly") {
      return numericAmount * 2;
    }
    return numericAmount;
  };

  const getEstimatedAnnualInvestment = (): number => {
    const numericAmount = getNumericAmount();

    if (frequency === "daily") {
      return numericAmount * 365;
    } else if (frequency === "weekly") {
      return numericAmount * 52;
    } else if (frequency === "biweekly") {
      return numericAmount * 26;
    }
    return numericAmount * 12;
  };

  // Get the selected asset details
  const getSelectedAsset = () => {
    return cryptoAssets.find((asset) => asset.id === selectedAsset);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3>Create Investment Plan</h3>
          <p className="text-sm text-foreground/60">Set up a recurring investment with dollar-cost averaging</p>
        </ModalHeader>

        <ModalBody className="py-4">
          {/* Step indicator */}
          <div className="flex mb-6">
            {steps.map((stepValue, index) => (
              <React.Fragment key={stepValue}>
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      ${
                        step === stepValue
                          ? "bg-primary text-white"
                          : steps.indexOf(step) > index
                            ? "bg-success/20 text-success border border-success"
                            : "bg-content3 text-foreground/60"
                      }
                    `}
                  >
                    {steps.indexOf(step) > index ? "✓" : index + 1}
                  </div>
                  <span className="text-xs mt-1 text-foreground/60">
                    {stepValue === "asset"
                      ? "Asset"
                      : stepValue === "amount"
                        ? "Amount"
                        : stepValue === "schedule"
                          ? "Schedule"
                          : "Review"}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 flex items-center mx-2">
                    <div className={`h-0.5 w-full ${steps.indexOf(step) > index ? "bg-success/50" : "bg-content3"}`} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1: Select Asset */}
          {step === "asset" && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Select an asset to invest in</h4>
              <div className="grid grid-cols-1 gap-3">
                {cryptoAssets.map((asset) => {
                  const AssetIcon = asset.icon;
                  return (
                    <Card
                      key={asset.id}
                      isPressable
                      isHoverable
                      onPress={() => handleAssetSelect(asset.id)}
                      className={`border-2 ${selectedAsset === asset.id ? "border-primary" : "border-transparent"}`}
                    >
                      <CardBody className="flex flex-row items-center p-3 gap-3">
                        <div className="w-10 h-10 rounded-full bg-content3 flex items-center justify-center">
                          <AssetIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium">{asset.name}</h5>
                          <p className="text-xs text-foreground/60">
                            {asset.code} <span className="ml-1">(Wrapped Token)</span>
                          </p>
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 border-content3 flex items-center justify-center">
                          {selectedAsset === asset.id && <div className="w-3 h-3 rounded-full bg-primary" />}
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>

              <div className="flex items-start gap-2 p-3 bg-content2 rounded-lg text-sm">
                <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p>
                  These are wrapped versions of crypto assets that can be easily transferred and managed in your
                  account.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Set Amount */}
          {step === "amount" && (
            <div className="space-y-4">
              {selectedAsset && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-lg font-medium">Set investment amount</h4>
                    <Chip size="sm" color="primary" variant="flat">
                      {getSelectedAsset()?.name}
                    </Chip>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground/70">Available Balance:</span>
                    <span className="font-medium">{formatAmountUSD(account.balance || 0)}</span>
                  </div>

                  {/* Amount Slider */}
                  <div className="mt-4 mb-8">
                    <Slider
                      label="How much would you like to invest each period?"
                      size="sm"
                      step={0.5}
                      minValue={1}
                      maxValue={Math.min(account.balance || 1000, 1000)}
                      defaultValue={1}
                      value={getNumericAmount()}
                      showTooltip={true}
                      tooltipValueFormatOptions={{ style: "currency", currency: "USD" }}
                      formatOptions={{ style: "currency", currency: "USD" }}
                      className="my-1"
                      marks={[
                        { value: 1, label: "$1" },
                        {
                          value: Math.min(account.balance || 1000, 1000) / 2,
                          label: `$${Math.floor(Math.min(account.balance || 1000, 1000) / 2)}`,
                        },
                        {
                          value: Math.min(account.balance || 1000, 1000),
                          label: `$${Math.floor(Math.min(account.balance || 1000, 1000))}`,
                        },
                      ]}
                      onChange={(value) => handleAmountChange(value.toString())}
                      classNames={{
                        label: "text-sm text-foreground/70 mb-1",
                      }}
                    />
                    {amountError && <p className="text-danger text-xs mt-1">{amountError}</p>}
                  </div>

                  {/* Frequency Selector */}
                  <div className="pt-6">
                    <Select
                      label="How often would you like to invest?"
                      items={frequencyOptions}
                      selectedKeys={[frequency]}
                      onChange={handleFrequencyChange}
                      size="md"
                      variant="bordered"
                      labelPlacement="outside"
                      classNames={{
                        label: "text-sm text-foreground/70",
                      }}
                    >
                      {(item) => <SelectItem key={item.value}>{item.label}</SelectItem>}
                    </Select>
                  </div>

                  {/* Investment Estimates */}
                  <Card className="bg-content2 mt-4">
                    <CardBody className="p-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-foreground/60">Monthly investment</p>
                          <p className="font-medium">{formatAmountUSD(getEstimatedMonthlyInvestment())}</p>
                        </div>
                        <div>
                          <p className="text-xs text-foreground/60">Annual investment</p>
                          <p className="font-medium">{formatAmountUSD(getEstimatedAnnualInvestment())}</p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Warning for large investments */}
                  {getNumericAmount() > (account.balance || 0) * 0.5 && (
                    <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-lg text-sm mt-4">
                      <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                      <p>
                        You're investing more than 50% of your balance. Ensure you keep enough funds for other expenses.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 3: Schedule */}
          {step === "schedule" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-lg font-medium">Set your schedule</h4>
                <Chip size="sm" color="primary" variant="flat">
                  {getSelectedAsset()?.name} • {formatAmountUSD(getNumericAmount())} {frequency}
                </Chip>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-foreground/70 mb-1 flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> When would you like to start?
                  </label>
                  <Input
                    type="date"
                    value={startDate?.toISOString().split("T")[0]}
                    onChange={handleStartDateChange}
                    min={tomorrow.toISOString().split("T")[0]}
                    className="max-w-xs"
                    size="sm"
                  />
                </div>

                <div>
                  <label className="text-sm text-foreground/70 mb-1 block">Would you like to set an end date?</label>
                  <RadioGroup
                    orientation="horizontal"
                    value={hasEndDate ? "yes" : "no"}
                    onValueChange={handleEndDateToggle}
                    size="sm"
                  >
                    <Radio value="no">No end date</Radio>
                    <Radio value="yes">Set end date</Radio>
                  </RadioGroup>

                  {hasEndDate && (
                    <Input
                      type="date"
                      value={endDate?.toISOString().split("T")[0] || ""}
                      onChange={handleEndDateChange}
                      min={startDate.toISOString().split("T")[0]}
                      className="max-w-xs mt-2"
                      size="sm"
                    />
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-content2 rounded-lg text-sm mt-4">
                <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p>
                  Your first investment will occur on the start date. You can pause or cancel your investment plan at
                  any time.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === "review" && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Review your investment plan</h4>

              <Card className="bg-content2">
                <CardBody className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground/60">Asset</span>
                    <div className="flex items-center gap-2">
                      {getSelectedAsset() && (
                        <>
                          <div className="w-5 h-5 rounded-full bg-content3 flex items-center justify-center">
                            {React.createElement(getSelectedAsset()!.icon, { className: "w-3 h-3" })}
                          </div>
                          <span className="font-medium">{getSelectedAsset()?.name}</span>
                          <span className="text-xs text-foreground/60">({getSelectedAsset()?.code})</span>
                        </>
                      )}
                    </div>
                  </div>

                  <Divider className="my-1" />

                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-foreground/60">Amount per period</span>
                    <span className="font-medium text-right">{formatAmountUSD(getNumericAmount())}</span>

                    <span className="text-foreground/60">Frequency</span>
                    <span className="font-medium text-right">
                      {frequencyOptions.find((f) => f.value === frequency)?.label}
                    </span>

                    <span className="text-foreground/60">Start date</span>
                    <span className="font-medium text-right">{formatDate(startDate)}</span>

                    {hasEndDate && endDate && (
                      <>
                        <span className="text-foreground/60">End date</span>
                        <span className="font-medium text-right">{formatDate(endDate)}</span>
                      </>
                    )}
                  </div>

                  <Divider className="my-1" />

                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-foreground/60">Monthly investment</span>
                    <span className="font-medium text-right">{formatAmountUSD(getEstimatedMonthlyInvestment())}</span>

                    <span className="text-foreground/60">Annual investment</span>
                    <span className="font-medium text-right">{formatAmountUSD(getEstimatedAnnualInvestment())}</span>

                    {!hasEndDate && (
                      <>
                        <span className="text-foreground/60">Duration</span>
                        <span className="font-medium text-right">Ongoing</span>
                      </>
                    )}
                  </div>
                </CardBody>
              </Card>

              <div className="flex items-start gap-2 p-3 bg-content2 rounded-lg text-sm">
                <Info className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                <p>
                  By creating this plan, you authorize automatic transfers from your account to purchase the selected
                  asset according to this schedule.
                </p>
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          {step !== "asset" && (
            <Button variant="flat" onPress={prevStep} size="sm">
              Back
            </Button>
          )}

          {step !== "review" ? (
            <Button
              color="primary"
              onPress={nextStep}
              isDisabled={!isStepValid()}
              endContent={<ArrowRight className="w-4 h-4" />}
              size="sm"
            >
              Continue
            </Button>
          ) : (
            <Button color="primary" onPress={handleSubmit} isLoading={isCreating} size="sm">
              Create Investment Plan
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
