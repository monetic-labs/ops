import { useState, useMemo } from "react";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/modal";
import { Checkbox } from "@nextui-org/checkbox";
import { Divider } from "@nextui-org/divider";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/table";

interface WithdrawFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const availableBalances = [
  { id: "1", network: "Ethereum", token: "USDC", balance: 1000 },
  { id: "2", network: "Ethereum", token: "DAI", balance: 500 },
  { id: "3", network: "Polygon", token: "USDC", balance: 2000 },
  { id: "4", network: "Arbitrum", token: "USDT", balance: 1500 },
];

export default function WithdrawFundsModal({
  isOpen,
  onClose,
}: WithdrawFundsModalProps) {
  const [selectedBalances, setSelectedBalances] = useState<Set<string>>(
    new Set([]),
  );
  const [withdrawAmount, setWithdrawAmount] = useState("");

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

  const totalAvailable = useMemo(() => {
    return availableBalances
      .filter((item) => selectedBalances.has(item.id))
      .reduce((sum, item) => sum + item.balance, 0);
  }, [selectedBalances]);

  const amountToWithdraw = parseFloat(withdrawAmount) || 0;
  const amountRemaining = Math.max(totalAvailable - amountToWithdraw, 0);

  const handleWithdraw = () => {
    console.log("Withdrawing:", { selectedBalances, withdrawAmount });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} size="3xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          Withdraw Funds
        </ModalHeader>
        <ModalBody>
          <Table aria-label="Available balances">
            <TableHeader>
              <TableColumn>SELECT</TableColumn>
              <TableColumn>NETWORK</TableColumn>
              <TableColumn>TOKEN</TableColumn>
              <TableColumn>BALANCE</TableColumn>
            </TableHeader>
            <TableBody>
              {availableBalances.map((item) => (
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
              inputWrapper:
                "bg-charyo-400 text-notpurple-500 border border-ualert-500",
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
              <span className="font-medium">
                ${amountToWithdraw.toFixed(2)}
              </span>
            </div>
            <Divider className="my-2" />
            <div className="flex justify-between text-lg font-bold">
              <span>Amount Remaining on Contract:</span>
              <span>${amountRemaining.toFixed(2)}</span>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            className="text-notpurple-500"
            variant="light"
            onPress={onClose}
          >
            Cancel
          </Button>
          <Button
            className="bg-ualert-500 text-notpurple-500"
            onPress={handleWithdraw}
          >
            Confirm Withdrawal
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
