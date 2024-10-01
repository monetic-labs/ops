import React, { useState, useEffect } from "react";
import { Button } from "@nextui-org/button";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { FormModal } from "@/components/generics/form-modal";
import ModalFooterWithSupport from "@/components/generics/footer-modal-support";
import useAccountContracts from "@/hooks/account-contracts/useAccountContracts";
import useAddFunds from "@/hooks/account-contracts/useAddFunds";

interface Rule {
  id: number;
  description: string;
  fromAccount: string;
  toAccount: string;
  condition: string;
  action: () => void;
}

interface LogicModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LogicModal: React.FC<LogicModalProps> = ({ isOpen, onClose }) => {
  const { available, isLoading } = useAccountContracts();
  const { addFunds, isAddingFunds } = useAddFunds();
  const [rules, setRules] = useState<Rule[]>([]);
  const [nextRuleId, setNextRuleId] = useState(1);

  useEffect(() => {
    if (!isLoading && available < 1000) {
      handleTopUp();
    }
  }, [available, isLoading]);

  const handleTopUp = async () => {
    const success = await addFunds({
      network: "polygon", // Default network
      token: "usdc", // Default stablecoin
      amount: 5000 - available, // Amount to top up to $5000
    });

    if (!success) {
      console.error("Failed to top up funds");
    }
  };

  const addRule = (description: string, fromAccount: string, toAccount: string, condition: string, action: () => void) => {
    const newRule: Rule = {
      id: nextRuleId,
      description,
      fromAccount,
      toAccount,
      condition,
      action,
    };
    setRules([...rules, newRule]);
    setNextRuleId(nextRuleId + 1);
  };

  const handleAddRuleClick = () => {
    // Example rule: Top up balance when below $1000
    addRule(
      "Top up balance to $5000 when below $1000",
      "Main Account",
      "Main Account",
      "Balance < $1000",
      handleTopUp
    );
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Account Rules"
      onSubmit={() => {}}
      isValid={true}
    >
      <div className="space-y-4">
        {rules.map((rule) => (
          <Card key={rule.id} className="bg-charyo-500/60">
            <CardHeader className="flex-col items-start px-4 pt-2 pb-0">
              <p className="text-tiny uppercase font-bold">Rule {rule.id}</p>
              <small className="text-default-500">{rule.description}</small>
            </CardHeader>
            <CardBody className="py-2">
              <p>From: {rule.fromAccount}</p>
              <p>To: {rule.toAccount}</p>
              <p>Condition: {rule.condition}</p>
              <Button
                className="w-full bg-charyo-200 text-notpurple-500 mt-2"
                size="sm"
                onPress={rule.action}
              >
                Execute Rule
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>
      <Button
        className="w-full bg-charyo-200 text-notpurple-500 mt-4"
        size="sm"
        onPress={handleAddRuleClick}
      >
        Add Rule
      </Button>
      <ModalFooterWithSupport
        onSupportClick={() => {}}
        actions={[
          {
            label: "Close",
            onClick: onClose,
          },
        ]}
      />
    </FormModal>
  );
};

export default LogicModal;