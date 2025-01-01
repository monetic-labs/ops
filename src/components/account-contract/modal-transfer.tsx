import { useState } from "react";
import { Modal, ModalBody, ModalContent } from "@nextui-org/modal";
import { Button } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";
import { ArrowDownIcon, XIcon } from "lucide-react";
import { AccountSelectionModal } from "../generics/modal-account-select";
import { useAccounts, Account } from "@/contexts/AccountContext";
import { BalanceDisplay } from "@/components/generics/balance-display";
import { formatUSD } from "@/utils/formatters/currency";
import { MoneyInput } from "../generics/money-input";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TransferModal({ isOpen, onClose }: TransferModalProps) {
  const { getEnabledAccounts } = useAccounts();
  const [fromAccount, setFromAccount] = useState<Account | null>(null);
  const [toAccount, setToAccount] = useState<Account | null>(null);
  const [amount, setAmount] = useState("");
  const [isFromAccountModalOpen, setIsFromAccountModalOpen] = useState(false);
  const [isToAccountModalOpen, setIsToAccountModalOpen] = useState(false);

  const resetForm = () => {
    setFromAccount(null);
    setToAccount(null);
    setAmount("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleTransfer = async () => {
    if (!fromAccount || !toAccount) return;
    console.log("Transfer:", {
      fromAccount: fromAccount.id,
      toAccount: toAccount.id,
      amount: parseFloat(amount).toFixed(2),
    });
    onClose();
  };

  const handleFromAccountSelect = (account: Account) => {
    if (account.id === toAccount?.id) {
      setToAccount(null);
    }
    setFromAccount(account);
  };

  const handleToAccountSelect = (account: Account) => {
    if (account.id === fromAccount?.id) {
      setFromAccount(null);
    }
    setToAccount(account);
  };

  const handleSetMaxAmount = () => {
    if (fromAccount?.balance) {
      const maxAmount = fromAccount.balance.toString();
      setAmount(maxAmount);
    }
  };

  const isAmountValid = () => {
    if (!amount || !fromAccount) return false;
    const numericAmount = parseFloat(amount);
    return numericAmount > 0 && numericAmount <= (fromAccount.balance || 0);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        size="sm"
        classNames={{
          base: "bg-[#0A0A0A]",
          wrapper: "bg-black/80",
          body: "p-0",
        }}
        hideCloseButton
      >
        <ModalContent>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
            <h3 className="text-xl font-normal text-white">Transfer Between Accounts</h3>
            <div className="flex items-center gap-3">
              <Button
                isIconOnly
                variant="light"
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XIcon size={18} />
              </Button>
            </div>
          </div>

          <ModalBody className="p-4">
            <div className="space-y-3">
              <div className="rounded-2xl bg-[#141414] p-4 border border-[#1a1a1a] hover:border-[#2a2a2a] transition-colors">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">From</span>
                  {fromAccount && <BalanceDisplay balance={fromAccount.balance || 0} onClick={handleSetMaxAmount} />}
                </div>
                <div className="flex items-center gap-3">
                  <MoneyInput
                    value={amount}
                    onChange={setAmount}
                    isError={Boolean(fromAccount && parseFloat(amount) > (fromAccount.balance || 0))}
                  />
                  <Button
                    className="h-11 px-4 bg-[#1a1a1a] hover:bg-[#222222] text-white border border-[#2a2a2a] transition-all duration-200"
                    radius="lg"
                    onClick={() => setIsFromAccountModalOpen(true)}
                  >
                    {fromAccount ? fromAccount.name : "Select Account"}
                  </Button>
                </div>
                {fromAccount && parseFloat(amount) > (fromAccount.balance || 0) && (
                  <div className="mt-2 text-sm text-red-500">Insufficient balance</div>
                )}
              </div>

              <div className="flex justify-center -my-2 z-10">
                <Button
                  isIconOnly
                  className="bg-[#0A0A0A] border border-[#1a1a1a] w-8 h-8 text-gray-400 hover:text-white hover:border-[#2a2a2a] transition-all duration-200"
                  radius="full"
                  onClick={() => {
                    const temp = fromAccount;
                    setFromAccount(toAccount);
                    setToAccount(temp);
                  }}
                >
                  <ArrowDownIcon size={16} />
                </Button>
              </div>

              <div className="rounded-2xl bg-[#141414] p-4 border border-[#1a1a1a] hover:border-[#2a2a2a] transition-colors">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">To</span>
                  {toAccount && <BalanceDisplay balance={toAccount.balance || 0} />}
                </div>
                <Button
                  className="w-full h-14 bg-[#1a1a1a] hover:bg-[#222222] text-white border border-[#2a2a2a] transition-all duration-200"
                  onClick={() => setIsToAccountModalOpen(true)}
                >
                  {toAccount ? toAccount.name : "Select Account"}
                </Button>
              </div>

              {fromAccount && toAccount && amount && (
                <>
                  <Divider className="my-4 bg-[#1a1a1a]" />
                  <div className="space-y-3 px-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Transfer Fee</span>
                      <span className="text-white font-medium">$0.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Expected Output</span>
                      <span
                        className={`font-medium ${
                          fromAccount && parseFloat(amount) > (fromAccount.balance || 0) ? "text-red-500" : "text-white"
                        }`}
                      >
                        {formatUSD(parseFloat(amount) || 0)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </ModalBody>

          <div className="p-4 pt-2">
            <Button
              className="w-full h-12 text-base font-medium bg-[#2152ff] hover:bg-[#1a47ff] text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              size="lg"
              isDisabled={!fromAccount || !toAccount || !amount || !isAmountValid()}
              onClick={handleTransfer}
            >
              {!fromAccount || !toAccount
                ? "Select Accounts"
                : !amount
                  ? "Enter Amount"
                  : !isAmountValid()
                    ? "Insufficient Balance"
                    : "Confirm Transfer"}
            </Button>
          </div>
        </ModalContent>
      </Modal>

      <AccountSelectionModal
        isOpen={isFromAccountModalOpen}
        onClose={() => setIsFromAccountModalOpen(false)}
        accounts={getEnabledAccounts().filter((acc) => acc.id !== toAccount?.id)}
        onSelect={handleFromAccountSelect}
        selectedAccountId={fromAccount?.id}
        title="Select Source Account"
      />

      <AccountSelectionModal
        isOpen={isToAccountModalOpen}
        onClose={() => setIsToAccountModalOpen(false)}
        accounts={getEnabledAccounts().filter((acc) => acc.id !== fromAccount?.id)}
        onSelect={handleToAccountSelect}
        selectedAccountId={toAccount?.id}
        title="Select Destination Account"
      />
    </>
  );
}
