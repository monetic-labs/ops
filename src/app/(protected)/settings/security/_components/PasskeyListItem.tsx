"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Tooltip } from "@heroui/tooltip";
import { Spinner } from "@heroui/spinner";
import { PasskeyStatus, PasskeyWithStatus } from "@/utils/safe/features/passkey";
import { getTimeAgo } from "@/utils/helpers";
import { CheckCircle, Clock, AlertCircle, Trash2, Laptop2 } from "lucide-react";
import { cn } from "@/utils/cn";

interface PasskeyListItemProps {
  passkey: PasskeyWithStatus & { dbId?: string }; // Include original dbId if available
  isProcessing?: boolean;
  onActivate: (passkey: PasskeyWithStatus) => void;
  onRename: (passkeyDbId: string, newName: string) => void; // Expect DB ID for rename
  onRemove: (passkey: PasskeyWithStatus) => void;
  passkeyCount: number; // Needed to disable delete if only one
}

export const PasskeyListItem: React.FC<PasskeyListItemProps> = ({
  passkey,
  isProcessing,
  onActivate,
  onRename,
  onRemove,
  passkeyCount,
}) => {
  const [localName, setLocalName] = useState(passkey.displayName || "");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Update local name if prop changes (e.g., after rename success)
    if (!isEditing) {
      setLocalName(passkey.displayName || "");
    }
  }, [passkey.displayName, isEditing]);

  const handleRenameCommit = () => {
    // Only call rename if the name actually changed and we have the DB id
    if (passkey.dbId && localName !== passkey.displayName) {
      onRename(passkey.dbId, localName);
    }
    setIsEditing(false);
  };

  const handleRenameCancel = () => {
    setLocalName(passkey.displayName || ""); // Reset local name
    setIsEditing(false);
  };

  const statusChip = () => {
    switch (passkey.status) {
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

  const canRemove = passkeyCount > 1; // Simple check based on count

  return (
    // Main item container with background, padding, margin
    <div
      className={cn(
        "flex items-center justify-between gap-3 p-3 bg-content1 rounded-lg mb-1",
        isProcessing && "opacity-70 pointer-events-none" // Visual indication while processing
      )}
    >
      {/* Left side */}
      <div className="flex items-center gap-3 flex-grow min-w-0">
        <Laptop2 className="text-foreground/60 w-5 h-5 flex-shrink-0" />
        <div className="flex-grow min-w-0">
          {/* Renaming Input or Display Name */}
          {isEditing ? (
            <Input
              aria-label="Rename Passkey"
              size="sm"
              variant="bordered"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              onBlur={handleRenameCommit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameCommit();
                if (e.key === "Escape") handleRenameCancel();
              }}
              autoFocus
              classNames={{ inputWrapper: "h-8" }}
            />
          ) : (
            <button
              className="text-sm font-medium text-foreground text-left hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setIsEditing(true)}
              disabled={isProcessing}
              title="Click to rename"
            >
              {localName || `Passkey ${passkey.credentialId?.substring(0, 6)}...`}
            </button>
          )}
          {/* Status and Time */}
          <div className="flex items-center gap-2 mt-1">
            {statusChip()}
            <span className="text-xs text-foreground/60">
              {passkey.lastUsedAt ? `Last used ${getTimeAgo(passkey.lastUsedAt)}` : "Usage unknown"}
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {passkey.status === PasskeyStatus.PENDING_ONCHAIN && (
          <Button
            size="sm"
            color="primary"
            variant="flat"
            onPress={() => onActivate(passkey)}
            isLoading={isProcessing} // Show spinner inside button if processing this specific item
            isDisabled={isProcessing}
          >
            {isProcessing ? "" : "Activate"}
          </Button>
        )}
        <Tooltip content={!canRemove ? "Cannot remove the last passkey" : "Remove Passkey (Coming Soon)"}>
          {/* Wrap button in div for tooltip when disabled */}
          <div>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="danger"
              isDisabled={!canRemove || isProcessing}
              onPress={() => onRemove(passkey)}
              className="data-[disabled=true]:opacity-50"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </Tooltip>
      </div>
    </div>
  );
};
