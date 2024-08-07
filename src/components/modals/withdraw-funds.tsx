import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/modal";
import { Radio, RadioGroup } from "@nextui-org/radio";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/table";
import { useState } from "react";

interface WithdrawFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock data for available balances
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
  const [selectedBalance, setSelectedBalance] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const handleWithdraw = () => {
    // Implement withdraw logic here
    console.log("Withdrawing:", { selectedBalance, withdrawAmount });
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
              <TableColumn>NETWORK</TableColumn>
              <TableColumn>TOKEN</TableColumn>
              <TableColumn>BALANCE</TableColumn>
            </TableHeader>
            <TableBody>
              {availableBalances.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.network}</TableCell>
                  <TableCell>{item.token}</TableCell>
                  <TableCell>${item.balance.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <RadioGroup
            className="mt-4"
            label="Select balance to withdraw from"
            value={selectedBalance}
            onValueChange={setSelectedBalance}
          >
            {availableBalances.map((item) => (
              <Radio key={item.id} value={item.id}>
                {`${item.network} - ${item.token} ($${item.balance.toFixed(
                  2,
                )})`}
              </Radio>
            ))}
          </RadioGroup>

          <Input
            className="mt-4"
            label="Withdraw Amount"
            placeholder="Enter amount to withdraw"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
          />
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleWithdraw}>
            Confirm Withdrawal
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
