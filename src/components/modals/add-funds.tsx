import { Button } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";
import { Input } from "@nextui-org/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/modal";
import { Select, SelectItem } from "@nextui-org/select";
import { useState } from "react";

interface AddFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const networks = [
  { value: "ethereum", label: "Ethereum" },
  { value: "polygon", label: "Polygon" },
  { value: "arbitrum", label: "Arbitrum" },
];

const stablecoins = [
  { value: "usdc", label: "USDC" },
  { value: "usdt", label: "USDT" },
  { value: "dai", label: "DAI" },
];

export default function AddFundsModal({ isOpen, onClose }: AddFundsModalProps) {
  const [network, setNetwork] = useState("");
  const [stablecoin, setStablecoin] = useState("");
  const [amount, setAmount] = useState("");

  const handleAddFunds = () => {
    // Implement add funds logic here
    console.log("Adding funds:", { network, stablecoin, amount });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} size="lg" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Add Funds</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Select
              label="Select Network"
              placeholder="Choose a blockchain network"
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
            >
              {networks.map((net) => (
                <SelectItem key={net.value} value={net.value}>
                  {net.label}
                </SelectItem>
              ))}
            </Select>
            <Select
              label="Select Stablecoin"
              placeholder="Choose a stablecoin"
              value={stablecoin}
              onChange={(e) => setStablecoin(e.target.value)}
            >
              {stablecoins.map((coin) => (
                <SelectItem key={coin.value} value={coin.value}>
                  {coin.label}
                </SelectItem>
              ))}
            </Select>
            <Input
              label="Amount"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <Divider className="my-4" />

          <div className="p-4 rounded-md space-y-2">
            <h4 className="font-semibold text-lg mb-2">Transaction Details</h4>
            <div className="flex justify-between">
              <span>Current Balance:</span>
              <span className="font-medium">$1,000.00</span>
            </div>
            <div className="flex justify-between">
              <span>Amount to Add:</span>
              <span className="font-medium">${amount || "0.00"}</span>
            </div>
            <div className="flex justify-between">
              <span>Source of Funds:</span>
              <span className="font-medium">External Wallet</span>
            </div>
            <Divider className="my-2" />
            <div className="flex justify-between text-lg font-semibold">
              <span>New Balance:</span>
              <span>$1,000.00</span>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleAddFunds}>
            Confirm Add Funds
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
