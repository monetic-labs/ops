import { useState } from "react";
import { Modal, ModalBody, ModalContent } from "@nextui-org/modal";
import { Button } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";
import { ArrowDownIcon, XIcon, InfoIcon } from "lucide-react";
import { AccountSelectionModal } from "../generics/modal-account-select";
import { useAccounts, Account } from "@/contexts/AccountContext";
import { BalanceDisplay } from "@/components/generics/balance-display";
import { formatUSD } from "@/utils/formatters/currency";
import { MoneyInput } from "../generics/money-input";
import { Tooltip } from "@nextui-org/tooltip";
import { components } from "@/styles/theme/components";

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
          wrapper: components.modal.base.wrapper,
          base: components.modal.base.base,
          body: components.modal.base.body,
        }}
        hideCloseButton
      >
        <ModalContent>
          <div className={components.modal.transfer.header.wrapper}>
            <h3 className={components.modal.transfer.header.title}>Transfer Between Accounts</h3>
            <div className="flex items-center gap-3">
              <Button
                isIconOnly
                variant="light"
                onPress={handleClose}
                className={components.modal.transfer.header.closeButton}
              >
                <XIcon size={18} />
              </Button>
            </div>
          </div>

          <ModalBody className={components.modal.transfer.content.wrapper}>
            <div className={components.modal.transfer.content.section}>
              <div className={components.modal.transfer.accountSection.wrapper}>
                <div className={components.modal.transfer.accountSection.header.wrapper}>
                  <span className={components.modal.transfer.accountSection.header.label}>From</span>
                  {fromAccount && <BalanceDisplay balance={fromAccount.balance || 0} onClick={handleSetMaxAmount} />}
                </div>
                <div className={components.modal.transfer.accountSection.input.wrapper}>
                  <MoneyInput
                    value={amount}
                    onChange={setAmount}
                    isError={Boolean(fromAccount && parseFloat(amount) > (fromAccount.balance || 0))}
                  />
                  <Button
                    className={components.modal.transfer.accountSection.input.button}
                    radius="lg"
                    onPress={() => setIsFromAccountModalOpen(true)}
                  >
                    {fromAccount ? fromAccount.name : "Select Account"}
                  </Button>
                </div>
                {fromAccount && parseFloat(amount) > (fromAccount.balance || 0) && (
                  <div className={components.modal.transfer.accountSection.error}>Insufficient balance</div>
                )}
              </div>

              <div className={components.modal.transfer.swapButton.wrapper}>
                <Button
                  isIconOnly
                  className={components.modal.transfer.swapButton.button}
                  radius="full"
                  onPress={() => {
                    const temp = fromAccount;
                    setFromAccount(toAccount);
                    setToAccount(temp);
                  }}
                >
                  <ArrowDownIcon size={16} />
                </Button>
              </div>

              <div className={components.modal.transfer.accountSection.wrapper}>
                <div className={components.modal.transfer.accountSection.header.wrapper}>
                  <span className={components.modal.transfer.accountSection.header.label}>To</span>
                  {toAccount && <BalanceDisplay balance={toAccount.balance || 0} />}
                </div>
                <Button
                  className={components.modal.transfer.accountSection.input.button}
                  onPress={() => setIsToAccountModalOpen(true)}
                >
                  {toAccount ? toAccount.name : "Select Account"}
                </Button>
              </div>

              {fromAccount && toAccount && amount && (
                <>
                  <Divider className={components.modal.transfer.divider} />
                  <div className={components.modal.transfer.details.wrapper}>
                    <div className={components.modal.transfer.details.row}>
                      <div className="flex items-center gap-2">
                        <span className={components.modal.transfer.details.label}>Estimated Time</span>
                        <Tooltip
                          content="Internal transfers may vary with network activity but usually complete within 1 minute"
                          className={components.modal.transfer.details.tooltip}
                        >
                          <InfoIcon size={14} className={components.modal.transfer.details.icon} />
                        </Tooltip>
                      </div>
                      <span className={components.modal.transfer.details.value}>Instant</span>
                    </div>
                    <div className={components.modal.transfer.details.row}>
                      <span className={components.modal.transfer.details.label}>Transfer Fee</span>
                      <span className={components.modal.transfer.details.value}>$0.00</span>
                    </div>
                    <div className={components.modal.transfer.details.row}>
                      <span className={components.modal.transfer.details.label}>Expected Output</span>
                      <span className={components.modal.transfer.details.value}>
                        {formatUSD(parseFloat(amount) || 0)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </ModalBody>

          <div className={components.modal.transfer.footer.wrapper}>
            <Button
              className={components.modal.transfer.footer.button}
              size="lg"
              isDisabled={!fromAccount || !toAccount || !amount || !isAmountValid()}
              onPress={handleTransfer}
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
