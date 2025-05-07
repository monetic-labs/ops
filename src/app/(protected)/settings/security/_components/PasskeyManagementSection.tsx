"use client";

import React, { useState } from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Tooltip } from "@heroui/tooltip";
import { AlertTriangle, CheckCircle, Clock, Fingerprint, Laptop2, Trash2, AlertCircle } from "lucide-react";
import { ListTable } from "@/components/generics/list-table";
import { Passkey, PasskeyStatus } from "@/utils/safe/features/passkey";
import { getTimeAgo, isLocal } from "@/utils/helpers";
import { LEGACY_API_BASE_URL } from "@/libs/monetic-sdk";

// Changed User type to a more specific one for this component's needs
interface UserForPasskeySection {
  walletAddress?: string | null;
}

export interface PasskeyManagementSectionProps {
  passkeys: (Passkey & { id: string })[];
  isLoading: boolean;
  isAddingPasskey: boolean;
  isProcessingPasskey: Record<string, boolean>;
  user: UserForPasskeySection | null | undefined;
  onAddPasskey: () => void;
  onActivatePasskey: (passkey: Passkey) => void;
  onRenamePasskey: (passkeyId: string, newName: string) => void;
  onRemovePasskey: (passkey: Passkey) => void;
}

const PasskeyManagementSection: React.FC<PasskeyManagementSectionProps> = ({
  passkeys,
  isLoading,
  isAddingPasskey,
  isProcessingPasskey,
  user,
  onAddPasskey,
  onActivatePasskey,
  onRenamePasskey,
  onRemovePasskey,
}) => {
  const [editingPasskeyId, setEditingPasskeyId] = useState<string | null>(null);
  const [editingPasskeyName, setEditingPasskeyName] = useState("");

  const startEditing = (passkey: Passkey) => {
    setEditingPasskeyId(passkey.credentialId);
    setEditingPasskeyName(passkey.displayName || "");
  };

  const handleRenameCommit = () => {
    const passkeyToRename = passkeys.find((p) => p.credentialId === editingPasskeyId);
    if (passkeyToRename?.id && editingPasskeyName !== passkeyToRename.displayName) {
      onRenamePasskey(passkeyToRename.id, editingPasskeyName);
    }
    setEditingPasskeyId(null);
  };

  const handleRenameCancel = () => {
    setEditingPasskeyId(null);
  };

  return (
    <ListTable
      aria-label="Passkeys"
      title="Authentication Methods"
      description="Passkeys allow you to log in and sign transactions using biometrics, a device password, or a PIN."
      icon={<Fingerprint className="text-primary" size={20} />}
      items={passkeys} // Already filtered in page.tsx, or filter here if preferred
      isLoading={isLoading && passkeys.length === 0}
      renderItem={(item) => {
        const passkeyItem = item as Passkey & { id: string }; // item is already the correct type
        const isProcessing = isProcessingPasskey[passkeyItem.id];
        const isCurrentlyEditing = editingPasskeyId === passkeyItem.credentialId;
        const canRemove =
          passkeys.filter((p) => p.status === PasskeyStatus.ACTIVE_ONCHAIN).length > 1 ||
          passkeyItem.status !== PasskeyStatus.ACTIVE_ONCHAIN;

        const statusChip = () => {
          switch (passkeyItem.status) {
            case PasskeyStatus.ACTIVE_ONCHAIN:
              return (
                <Chip color="success" size="sm" variant="flat" startContent={<CheckCircle size={14} />}>
                  Active
                </Chip>
              );
            case PasskeyStatus.PENDING_ONCHAIN:
              return (
                <Chip color="warning" size="sm" variant="flat" startContent={<Clock size={14} />}>
                  Pending
                </Chip>
              );
            default:
              return (
                <Chip color="default" size="sm" variant="flat" startContent={<AlertCircle size={14} />}>
                  Unknown
                </Chip>
              );
          }
        };

        const endContent = (
          <div className="flex items-center gap-1 flex-shrink-0">
            {passkeyItem.status === PasskeyStatus.PENDING_ONCHAIN && (
              <Button
                size="sm"
                color="primary"
                variant="flat"
                onPress={() => onActivatePasskey(passkeyItem)}
                isLoading={isProcessing}
                isDisabled={isProcessing}
              >
                {isProcessing ? "" : "Activate"}
              </Button>
            )}
            <Tooltip content={!canRemove ? "Cannot remove the last active passkey" : "Remove Passkey"}>
              <div>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  color="danger"
                  isDisabled={!canRemove || isProcessing}
                  onPress={() => onRemovePasskey(passkeyItem)}
                  className="data-[disabled=true]:opacity-50"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </Tooltip>
          </div>
        );

        const primaryTextContent = isCurrentlyEditing ? (
          <Input
            aria-label="Rename Passkey"
            size="sm"
            variant="bordered"
            value={editingPasskeyName}
            onChange={(e) => setEditingPasskeyName(e.target.value)}
            onBlur={handleRenameCommit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRenameCommit();
              if (e.key === "Escape") handleRenameCancel();
            }}
            classNames={{ inputWrapper: "h-8" }}
            autoFocus
          />
        ) : (
          <button
            className="text-sm font-medium text-foreground text-left hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => startEditing(passkeyItem)}
            disabled={isProcessing}
            title="Click to rename"
          >
            {passkeyItem.displayName || `Passkey ${passkeyItem.credentialId?.substring(0, 6)}...`}
          </button>
        );

        return {
          startContent: <Laptop2 className="text-foreground/60 w-5 h-5" />,
          primaryText: (
            <div className="flex items-center gap-2">
              {primaryTextContent}
              {!isLocal && passkeyItem.rpId?.includes("backpack.network") && (
                <Chip startContent={<AlertTriangle className="w-3 h-3" />} color="warning" size="sm" variant="bordered">
                  Deprecated
                </Chip>
              )}
            </div>
          ),
          secondaryText: (
            <div className="flex items-center gap-2 mt-1">
              {statusChip()}
              <span className="text-xs text-foreground/60">
                {passkeyItem.lastUsedAt ? `Last used ${getTimeAgo(passkeyItem.lastUsedAt)}` : "Usage unknown"}
              </span>
            </div>
          ),
          endContent: endContent,
        };
      }}
      itemHasDivider={true}
      onAddItem={onAddPasskey}
      addItemLabel={isAddingPasskey ? (user?.walletAddress ? "Registering..." : "Creating Account...") : "Add Passkey"}
      disableAddItem={isAddingPasskey}
      emptyContent="No passkeys registered yet."
      cardClassName="shadow-sm"
      bodyClassName="p-0"
    />
  );
};

export default PasskeyManagementSection;
