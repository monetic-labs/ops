"use client";

import { Switch } from "@heroui/switch";

interface BackpackRecoveryProps {
  isBackpackRecoveryEnabled: boolean;
  handleToggleBackpack: () => Promise<void>;
}

const BackpackRecovery: React.FC<BackpackRecoveryProps> = ({ isBackpackRecoveryEnabled, handleToggleBackpack }) => {
  return (
    <div className="p-4">
      <div className="space-y-4">
        <p className="text-sm mb-3">
          Allow Backpack to help recover your account if you lose access to your other recovery methods.
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm">Backpack Recovery</span>
          <Switch
            classNames={{
              wrapper: isBackpackRecoveryEnabled ? "bg-teal-500" : "",
            }}
            isSelected={isBackpackRecoveryEnabled}
            size="sm"
            onValueChange={handleToggleBackpack}
          />
        </div>
        <p className="text-xs text-foreground/60 mt-2">
          This allows Backpack to act as a guardian for your account recovery.
        </p>
      </div>
    </div>
  );
};

export default BackpackRecovery;
