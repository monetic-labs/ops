import { useState } from "react";
import { Button } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";
import { Input } from "@nextui-org/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/modal";
import { Select, SelectItem } from "@nextui-org/select";
import useAddFunds from "@/hooks/account-contracts/useAddFunds";
import ModalFooterWithSupport from "../generics/footer-modal-support";

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
  const [network, setNetwork] = useState("polygon");
  const [stablecoin, setStablecoin] = useState("usdc");
  const [amount, setAmount] = useState("");
  const { addFunds, isAddingFunds, currentBalance } = useAddFunds();

  const handleAddFunds = async () => {
    const success = await addFunds({
      network,
      token: stablecoin,
      amount: parseFloat(amount),
    });

    if (success) {
      onClose();
    } else {
      // Handle error (e.g., show an error message)
      console.error("Failed to add funds");
    }
  };

  const handleSupportClick = () => {
    // Handle support action
    console.log("Support clicked");
  };

  const footerActions = [
    {
      label: "Cancel",
      onClick: onClose,
    },
    {
      label: "Confirm Add Funds",
      onClick: handleAddFunds,
      isLoading: isAddingFunds,
      isDisabled: isAddingFunds || !amount || !network || !stablecoin,
    },
  ];

  const newBalance = currentBalance + parseFloat(amount || "0");

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

          <div className="p-4 rounded-md space-y-4 font-mono">
            <h4 className="font-semibold text-lg mb-2">Transaction Details</h4>
            <div className="flex justify-between">
              <span>Current Balance:</span>
              <span className="font-medium">${currentBalance.toFixed(2)}</span>
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
            <div className="flex justify-between text-lg font-bold">
              <span>New Balance:</span>
              <span>${newBalance.toFixed(2)}</span>
            </div>
          </div>
        </ModalBody>
        <ModalFooterWithSupport
            onSupportClick={handleSupportClick}
            actions={footerActions}
          />
      </ModalContent>
    </Modal>
  );
}