import { PersonRole } from "@monetic-labs/sdk";
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";
import { ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { Tooltip } from "@heroui/tooltip";

import { useUser } from "@/contexts/UserContext";
import { formatStringToTitleCase } from "@/utils/helpers";
import { Signer, Account } from "@/types/account";

import { AddSignerModal } from "@/app/(protected)/account/_modals/AddSignerModal";
import { RemoveSignerModal } from "@/app/(protected)/account/_modals/RemoveSignerModal";

interface SignersViewProps {
  signers: Signer[];
  isLoading: boolean;
  account: Account;
  refreshAccountData: () => void;
}

export function SignersView({ signers, isLoading, account, refreshAccountData }: SignersViewProps) {
  const [showAddSigner, setShowAddSigner] = useState(false);
  const [showRemoveSignerModal, setShowRemoveSignerModal] = useState(false);
  const [signerToRemove, setSignerToRemove] = useState<Signer | null>(null);

  const { user } = useUser();
  const isParentOwner = user?.role === PersonRole.OWNER;

  const handleOpenRemoveModal = (signer: Signer) => {
    setSignerToRemove(signer);
    setShowRemoveSignerModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Active Signers ({signers.length})</h3>
        {isParentOwner && (
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            size="sm"
            onPress={() => setShowAddSigner(true)}
          >
            Add Signer
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {signers.map((signer) => {
          const isCurrentUser = signer.address.toLowerCase() === user?.walletAddress?.toLowerCase();
          const canRemove =
            isParentOwner && // Only parent owners can remove (UI check)
            signers.length > 1; // Cannot remove the last signer

          let tooltipContent = "Remove Signer";
          if (!isParentOwner) tooltipContent = "Only account owners can remove signers";
          else if (signers.length <= 1) tooltipContent = "Cannot remove the last signer";

          return (
            <div
              key={signer.address}
              className={`flex items-center justify-between p-4 bg-content2/50 hover:bg-content2/70 transition-colors rounded-lg ${isCurrentUser ? "border border-primary/20" : ""}`}
            >
              <div className="flex items-center gap-3">
                <Avatar
                  classNames={{
                    base: "bg-content3",
                    name: "text-foreground/90",
                  }}
                  name={signer.name}
                  size="sm"
                  src={signer.image}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{signer.name}</p>
                    {isCurrentUser && <span className="text-xs text-primary">(You)</span>}
                  </div>
                  {signer.role && <p className="text-sm text-foreground/60">{formatStringToTitleCase(signer.role)}</p>}
                  {signer.isAccount && <p className="text-sm text-foreground/60">Sub-account</p>}
                </div>
              </div>
              {isParentOwner && (
                <Tooltip content={tooltipContent}>
                  <div>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      isDisabled={!canRemove}
                      onPress={() => handleOpenRemoveModal(signer)}
                      aria-label={`Remove signer ${signer.name}`}
                      className="data-[disabled=true]:opacity-50"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </Tooltip>
              )}
            </div>
          );
        })}
      </div>

      <AddSignerModal
        account={account}
        isOpen={showAddSigner}
        onClose={() => setShowAddSigner(false)}
        onSuccess={() => {
          setShowAddSigner(false);
          refreshAccountData();
        }}
      />

      {signerToRemove && (
        <RemoveSignerModal
          account={account}
          signerToRemove={signerToRemove}
          isOpen={showRemoveSignerModal}
          onClose={() => {
            setShowRemoveSignerModal(false);
            setSignerToRemove(null);
          }}
          onSuccess={() => {
            setShowRemoveSignerModal(false);
            setSignerToRemove(null);
            refreshAccountData();
          }}
        />
      )}
    </div>
  );
}
