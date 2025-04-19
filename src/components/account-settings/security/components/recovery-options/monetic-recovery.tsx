"use client";

import { Switch } from "@heroui/switch";

interface MoneticRecoveryProps {
  isMoneticRecoveryEnabled: boolean;
  handleToggleMonetic: () => Promise<void>;
}

const MoneticRecovery: React.FC<MoneticRecoveryProps> = ({ isMoneticRecoveryEnabled, handleToggleMonetic }) => {
  return (
    <div className="p-4">
      <div className="space-y-4">
        <p className="text-sm mb-3">
          Allow Monetic to help recover your account if you lose access to your other recovery methods.
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm">Monetic Recovery</span>
          <Switch
            classNames={{
              wrapper: isMoneticRecoveryEnabled ? "bg-teal-500" : "",
            }}
            isSelected={isMoneticRecoveryEnabled}
            size="sm"
            onValueChange={handleToggleMonetic}
          />
        </div>
        <p className="text-xs text-foreground/60 mt-2">
          This allows Monetic to act as a guardian for your account recovery.
        </p>
      </div>
    </div>
  );
};

export default MoneticRecovery;
