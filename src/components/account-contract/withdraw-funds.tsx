import { useState, useMemo } from "react";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/modal";
import { Checkbox } from "@nextui-org/checkbox";
import { Divider } from "@nextui-org/divider";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/table";
import useWithdrawal from "@/hooks/account-contracts/useWithdrawal";
import ModalFooterWithSupport from "../generics/footer-modal-support";

interface WithdrawFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WithdrawFundsModal({ isOpen, onClose }: WithdrawFundsModalProps) {
  const [selectedBalances, setSelectedBalances] = useState<Set<string>>(new Set([]));
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const { contractBalances, isLoading, withdrawFunds, withdrawalInProgress, totalBalance } = useWithdrawal();

  const totalAvailable = useMemo(() => {
    return contractBalances
      .filter((item) => selectedBalances.has(item.id))
      .reduce((sum, item) => sum + item.balance, 0);
  }, [selectedBalances, contractBalances]);

  const amountToWithdraw = parseFloat(withdrawAmount) || 0;
  const amountRemaining = Math.max(totalAvailable - amountToWithdraw, 0);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (amount > 0 && amount <= totalAvailable) {
      await withdrawFunds(amount, Array.from(selectedBalances));
      onClose();
    } else {
      // Show an error message
      console.error("Invalid withdrawal amount");
    }
  };

  const handleSelectionChange = (id: string) => {
    setSelectedBalances((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const handleSupportClick = () => {
    // Handle support action
    console.log("Support clicked");
  };

  const isWithdrawDisabled = isLoading || withdrawalInProgress || amountToWithdraw <= 0 || amountToWithdraw > totalAvailable || selectedBalances.size === 0;

  const footerActions = [
    {
      label: "Cancel",
      onClick: onClose,
    },
    {
      label: "Confirm Withdrawal",
      onClick: handleWithdraw,
      className: "bg-ualert-500 text-notpurple-500",
      isLoading: withdrawalInProgress,
      isDisabled: isWithdrawDisabled,
    },
  ];

  return (
    <Modal isOpen={isOpen} size="3xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Withdraw Funds</ModalHeader>
        <ModalBody>
        {isLoading ? (
            <p>Loading contract balances...</p>
          ) : (
            <>
          <Table aria-label="Available balances">
            <TableHeader>
              <TableColumn>SELECT</TableColumn>
              <TableColumn>NETWORK</TableColumn>
              <TableColumn>TOKEN</TableColumn>
              <TableColumn>BALANCE</TableColumn>
            </TableHeader>
            <TableBody>
              {contractBalances.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      classNames={{
                        icon: " text-notpurple-500",
                      }}
                      isSelected={selectedBalances.has(item.id)}
                      onValueChange={() => handleSelectionChange(item.id)}
                    />
                  </TableCell>
                  <TableCell>{item.network}</TableCell>
                  <TableCell>{item.token}</TableCell>
                  <TableCell>${item.balance.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Input
            className="mt-4"
            classNames={{
              inputWrapper: "bg-charyo-400 text-notpurple-500 border border-ualert-500",
            }}
            label="Withdraw Amount"
            placeholder="Enter amount to withdraw"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
          />

          <Divider className="my-4" />

          <div className="p-4 rounded-md space-y-4 font-mono">
            <h4 className="font-semibold text-lg mb-2">Transaction Details</h4>
            <div className="flex justify-between">
              <span>Amount Available:</span>
              <span className="font-medium">${totalAvailable.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b border-gray-300 pb-4">
              <span>Amount to Withdraw:</span>
              <span className="font-medium">${amountToWithdraw.toFixed(2)}</span>
            </div>
            <Divider className="my-2" />
            <div className="flex justify-between text-lg font-bold">
              <span>Amount Remaining on Contract:</span>
              <span>${amountRemaining.toFixed(2)}</span>
            </div>
          </div>
          </>
          )}
        </ModalBody>
        <ModalFooterWithSupport
        onSupportClick={handleSupportClick}
          actions={footerActions}
        />
      </ModalContent>
    </Modal>
  );
}
