import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { CheckCircle, AlertCircle, Clock, HelpCircle } from "lucide-react";
import { PasskeyStatus, Passkey } from "@/utils/safe/features/passkey";

interface PasskeyStatusProps {
  passkey: Passkey;
  isSelf?: boolean;
  onActivate?: (passkey: Passkey) => void;
  showDetails?: boolean;
}

export function PasskeyStatusComponent({
  passkey,
  isSelf = false,
  onActivate,
  showDetails = false,
}: PasskeyStatusProps) {
  const renderStatusChip = (status: PasskeyStatus) => {
    switch (status) {
      case PasskeyStatus.ACTIVE_ONCHAIN:
        return (
          <Chip startContent={<CheckCircle className="w-3 h-3" />} color="success" size="sm" variant="flat">
            Active
          </Chip>
        );
      case PasskeyStatus.PENDING_ONCHAIN:
        return (
          <Chip startContent={<Clock className="w-3 h-3" />} color="warning" size="sm" variant="flat">
            Pending Activation
          </Chip>
        );
      default:
        return (
          <Chip startContent={<HelpCircle className="w-3 h-3" />} color="default" size="sm" variant="flat">
            Unknown Status
          </Chip>
        );
    }
  };

  return (
    <div className="mt-1 flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {renderStatusChip(passkey.status)}
        {passkey.status === PasskeyStatus.PENDING_ONCHAIN && isSelf && onActivate && (
          <Button className="ml-2" color="primary" size="sm" variant="flat" onPress={() => onActivate(passkey)}>
            Activate
          </Button>
        )}
      </div>

      {showDetails && passkey.status === PasskeyStatus.PENDING_ONCHAIN && (
        <p className="text-xs text-warning mt-1">
          This passkey is not yet activated on the blockchain.
          {isSelf && " Use an active passkey to activate it."}
        </p>
      )}

      {showDetails && passkey.status === PasskeyStatus.ACTIVE_ONCHAIN && (
        <p className="text-xs text-success-600 mt-1">This passkey is ready to use for signing transactions.</p>
      )}

      {showDetails && passkey.ownerAddress && (
        <p className="text-xs text-default-500 mt-1 font-mono">
          Address: {passkey.ownerAddress.slice(0, 6)}...{passkey.ownerAddress.slice(-4)}
        </p>
      )}
    </div>
  );
}

export default PasskeyStatusComponent;
