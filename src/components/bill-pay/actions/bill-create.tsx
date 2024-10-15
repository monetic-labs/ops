import { Divider } from "@nextui-org/divider";
import { Input } from "@nextui-org/input";
import { Autocomplete, AutocompleteItem } from "@nextui-org/autocomplete";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@nextui-org/modal";
import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import ModalFooterWithSupport from "../../generics/footer-modal-support";
import { Tooltip } from "@nextui-org/tooltip";
import { Avatar } from "@nextui-org/avatar";
import { Alpha3 } from "convert-iso-codes";

type CreateBillPayModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newBillPay: NewBillPay) => void;
};

type NewBillPay = {
  vendorName: string;
  vendorBankName: string;
  vendorMethod: VendorMethod | undefined;
  currency: string;
  routingNumber: string;
  accountNumber: string;
  memo: string;
  internalNote: string;
  amount: string;
  fee: string;
  total: string;
};

enum VendorMethod {
  ACH = "ACH",
  ACH_SAME_DAY = "ACH (Same Day)",
  WIRE = "Wire",
}

enum Currency {
  USD = "USD",
}

enum Countries {
  CAN = "Canada",
  CYM = "Cayman Islands",
  USA = "United States",
  VGB = "British Virgin Islands",
}

enum States {
  NY = "New York",
  CA = "California",
  TX = "Texas",
}

// TODO: get this data from backend
const vendorMethods: VendorMethod[] = [VendorMethod.ACH, VendorMethod.ACH_SAME_DAY, VendorMethod.WIRE];
const vendorCurrencies: Currency[] = [Currency.USD];
const vendorCountries: Countries[] = [Countries.USA, Countries.CAN, Countries.CYM, Countries.VGB];
const vendorStates: States[] = [States.NY, States.CA, States.TX];

const methodFees: Record<VendorMethod, number> = {
  [VendorMethod.ACH]: 0.5,
  [VendorMethod.ACH_SAME_DAY]: 1,
  [VendorMethod.WIRE]: 20,
};

const testBillPay: Partial<NewBillPay>[] = [
  {
    vendorName: "MyBackpackMy LLC",
    vendorBankName: "Bank of America",
    vendorMethod: VendorMethod.ACH,
    currency: Currency.USD,
    routingNumber: "123000848",
    accountNumber: "4321",
    memo: "ACH#123456",
  },
  {
    vendorName: "Acme LTD",
    vendorBankName: "JP Morgan Chase",
    vendorMethod: VendorMethod.WIRE,
    currency: Currency.USD,
    routingNumber: "123000848",
    accountNumber: "4321",
    memo: "WIRE#123456",
  },
];

function ExistingTransferFields({
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
  const handleSelectionChange = (value: number) => {
    const selectedBillPay = testBillPay[value];
    if (selectedBillPay) {
      setNewBillPay({
        ...newBillPay,
        ...selectedBillPay,
      });
    }
  };

  return (
    <>
      <Autocomplete
        label="Account Holder"
        placeholder="Select an account holder"
        isRequired
        isClearable={false}
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
        onSelectionChange={(value) => handleSelectionChange(value as number)}
      >
        {testBillPay.map((billPay, index) => (
          <AutocompleteItem
            key={index}
            textValue={billPay.vendorName}
            value={billPay.vendorName}
            endContent={billPay.vendorMethod}
          >
            {billPay.vendorName}
          </AutocompleteItem>
        ))}
      </Autocomplete>
      <Input isDisabled label="Method" value={newBillPay.vendorMethod} />
      <Input isDisabled label="Bank Name" value={newBillPay.vendorBankName} />
      <div className="flex space-x-4">
        <Input
          isDisabled
          label="Account Number"
          value={`${newBillPay.accountNumber ? `****${newBillPay.accountNumber}` : ""}`}
        />
        <Input isDisabled label="Routing Number" value={`${newBillPay.routingNumber}`} />
      </div>
      {newBillPay.vendorMethod &&
        [VendorMethod.WIRE, VendorMethod.ACH_SAME_DAY, VendorMethod.ACH].includes(newBillPay.vendorMethod) && (
          <Input
            isDisabled={newBillPay.vendorMethod === VendorMethod.WIRE}
            label={`${newBillPay.vendorMethod === VendorMethod.WIRE ? "Wire Message" : "ACH Reference"}`}
            value={newBillPay.memo}
            onChange={(e) => setNewBillPay({ ...newBillPay, memo: e.target.value })}
          />
        )}
      <Input
        label="Amount"
        type="number"
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

function NewTransferFields({
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
          defaultInputValue={VendorMethod.ACH}
          value={newBillPay.vendorMethod}
          onSelectionChange={(value) => {
            console.log("Selected Method:", value);
            setNewBillPay({ ...newBillPay, vendorMethod: value as VendorMethod });
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
        label={`${newBillPay.vendorMethod === VendorMethod.WIRE ? "Wire Message" : "ACH Reference"}`}
        placeholder="e.g. Payment for invoice #123456"
        description={`${
          newBillPay.vendorMethod === VendorMethod.WIRE ? "This cannot be changed after the sender is created." : ""
        }`}
        maxLength={newBillPay.vendorMethod === VendorMethod.WIRE ? 35 : 10}
        validate={(value: string) => {
          if (newBillPay.vendorMethod === VendorMethod.WIRE) {
            return /^[A-Za-z0-9 ]{0,35}$/.test(value) || "Cannot contain special characters";
          }
          return /^[A-Za-z0-9 ]{0,10}$/.test(value) || "Cannot contain special characters";
        }}
        value={newBillPay.internalNote}
        onChange={(e) => setNewBillPay({ ...newBillPay, internalNote: e.target.value })}
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

export default function CreateBillPayModal({ isOpen, onClose, onSave }: CreateBillPayModalProps) {
  const [newBillPay, setNewBillPay] = useState<NewBillPay>({
    vendorName: "",
    vendorMethod: undefined,
    currency: Currency.USD,
    vendorBankName: "",
    routingNumber: "",
    accountNumber: "",
    memo: "",
    internalNote: "",
    amount: "",
    fee: "",
    total: "",
  });
  const [isNewSender, setIsNewSender] = useState(false);
  const [showMemo, setShowMemo] = useState(false);

  const fee = useMemo(() => {
    if (!newBillPay.vendorMethod) return 0;
    return methodFees[newBillPay.vendorMethod] || 0;
  }, [newBillPay.vendorMethod]);

  const total = useMemo(() => {
    const amount = parseFloat(newBillPay.amount) || 0;
    return amount + fee;
  }, [newBillPay.amount, fee]);

  const handleSave = () => {
    onSave({ ...newBillPay, fee: fee.toFixed(2), total: total.toFixed(2) });
    onClose();
  };

  const handleSupportClick = () => {
    // Handle support action
    console.log("Support clicked");
  };

  const footerActions = [
    {
      label: "Create",
      onClick: handleSave,
    },
  ];

  return (
    <Modal isOpen={isOpen} size="2xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader>Create New Transfer</ModalHeader>
        <ModalBody className="overflow-y-auto max-h-[50vh] relative">
          {isNewSender ? (
            <NewTransferFields newBillPay={newBillPay} setNewBillPay={setNewBillPay} showMemo={showMemo} />
          ) : (
            <ExistingTransferFields
              newBillPay={newBillPay}
              setNewBillPay={setNewBillPay}
              isNewSender={isNewSender}
              setIsNewSender={setIsNewSender}
            />
          )}
        </ModalBody>
        <Divider className="my-4" />
        <ModalBody className="px-10">
          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between">
              <span>Fee:</span>
              <div className="flex items-center gap-2">
                <Tooltip
                  content="We pass on the fees from the receiving bank. We do not add any additional fees."
                  onTouchStart={(e) => {
                    console.log("Touch started");
                  }}
                >
                  <Info className="text-gray-500 cursor-pointer" size={14} />
                </Tooltip>
                <span>${fee.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </ModalBody>
        <Divider className="my-1" />
        <ModalFooterWithSupport
          onSupportClick={handleSupportClick}
          isNewSender={isNewSender}
          onNewSenderChange={setIsNewSender}
          actions={footerActions}
        />
      </ModalContent>
    </Modal>
  );
}
