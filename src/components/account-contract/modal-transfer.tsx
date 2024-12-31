import { useState } from "react";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@nextui-org/modal";
import { Autocomplete, AutocompleteItem } from "@nextui-org/autocomplete";
import { Input } from "@nextui-org/input";
import { Divider } from "@nextui-org/divider";
import ModalFooterWithSupport from "../generics/footer-modal-support";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Account {
  id: string;
  name: string;
  currency: string;
  balance?: number;
}

export default function TransferModal({ isOpen, onClose }: TransferModalProps) {
  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState("");

  const accounts: Account[] = [
    {
      id: "settlement",
      name: "Settlement",
      currency: "USD",
      balance: 456104.2,
    },
    {
      id: "rain",
      name: "Rain Card",
      currency: "USD",
      balance: 31383.43,
    },
  ];

  const handleTransfer = async () => {
    console.log("Transfer:", {
      fromAccount,
      toAccount,
      amount: parseFloat(amount).toFixed(2),
    });
    onClose();
  };

  const selectedFromAccount = accounts.find((acc) => acc.id === fromAccount);
  const availableToAccounts = accounts.filter((acc) => acc.id !== fromAccount);

  const formatUSD = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^\d.]/g, "");
    const parts = numericValue.split(".");
    if (parts.length > 2) return;
    if (parts[1]?.length > 2) return;

    if (numericValue === "" || /^\d*\.?\d{0,2}$/.test(numericValue)) {
      setAmount(numericValue);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalContent>
        <ModalHeader>Transfer Between Accounts</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Autocomplete
              label="From Account"
              placeholder="Select source account"
              selectedKey={fromAccount}
              onSelectionChange={(value) => {
                setFromAccount(value as string);
                if (value === toAccount) {
                  setToAccount("");
                }
              }}
            >
              {accounts.map((account) => (
                <AutocompleteItem key={account.id} textValue={account.name} value={account.id}>
                  <div className="flex justify-between items-center">
                    <span>{account.name}</span>
                    <span className="text-default-400">{formatUSD(account.balance || 0)}</span>
                  </div>
                </AutocompleteItem>
              ))}
            </Autocomplete>

            <Autocomplete
              label="To Account"
              placeholder="Select destination account"
              selectedKey={toAccount}
              isDisabled={!fromAccount}
              onSelectionChange={(value) => setToAccount(value as string)}
            >
              {availableToAccounts.map((account) => (
                <AutocompleteItem key={account.id} textValue={account.name} value={account.id}>
                  <div className="flex justify-between items-center">
                    <span>{account.name}</span>
                    <span className="text-default-400">{formatUSD(account.balance || 0)}</span>
                  </div>
                </AutocompleteItem>
              ))}
            </Autocomplete>

            <Input
              label="Amount"
              placeholder="0.00"
              value={amount}
              startContent={
                <div className="pointer-events-none flex items-center">
                  <span className="text-default-400 text-small">$</span>
                </div>
              }
              type="text"
              inputMode="decimal"
              isDisabled={!fromAccount || !toAccount}
              onChange={(e) => handleAmountChange(e.target.value)}
            />

            <Divider />

            {fromAccount && toAccount && amount && (
              <div className="p-4 rounded-md space-y-4 font-mono bg-default-50">
                <h4 className="font-semibold text-lg">Transfer Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Available Balance:</span>
                    <span>{formatUSD(selectedFromAccount?.balance || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transfer Amount:</span>
                    <span>{formatUSD(parseFloat(amount) || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fee:</span>
                    <span>{formatUSD(0)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooterWithSupport
          actions={[
            { label: "Cancel", onClick: onClose },
            {
              label: "Confirm Transfer",
              onClick: handleTransfer,
              isDisabled:
                !fromAccount ||
                !toAccount ||
                !amount ||
                parseFloat(amount) <= 0 ||
                (selectedFromAccount && parseFloat(amount) > (selectedFromAccount.balance || 0)),
            },
          ]}
          onSupportClick={() => {}}
        />
      </ModalContent>
    </Modal>
  );
}
