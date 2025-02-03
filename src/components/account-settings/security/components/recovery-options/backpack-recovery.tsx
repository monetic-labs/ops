"use client";

import { useState } from "react";
import { Card, CardBody } from "@nextui-org/card";
import { Switch } from "@nextui-org/switch";
import { Backpack } from "lucide-react";

type BackpackRecoveryProps = {
  isEnabled: boolean;
  onToggle: () => Promise<void>;
};

export const BackpackRecovery = ({ isEnabled, onToggle }: BackpackRecoveryProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await onToggle();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <Card className="space-y-4 p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Allow Backpack to help recover your account in case of emergency</p>
            <Switch
              isSelected={isEnabled}
              onValueChange={handleToggle}
              isDisabled={isLoading}
              size="sm"
              color="primary"
            />
          </div>
          <div className="text-xs text-gray-500 space-y-2">
            <p>By enabling Backpack Recovery, you understand and agree that:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Backpack will act as a guardian for your account for recovery purposes only</li>
              <li>Recovery requires additional verification methods to be configured</li>
              <li>This adds an extra layer of security to prevent permanent lockout</li>
              <li>Recovery process includes a mandatory grace period</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
