import { PersonRole } from "@backpack-fux/pylon-sdk";
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";

import { useUser } from "@/contexts/UserContext";
import { formatStringToTitleCase } from "@/utils/helpers";
import { Signer, Account } from "@/types/account";

import { AddSignerModal } from "../modals/AddSignerModal";

interface SignersViewProps {
  signers: Signer[];
  isLoading: boolean;
  account: Account;
}

export function SignersView({ signers, isLoading, account }: SignersViewProps) {
  const [showAddSigner, setShowAddSigner] = useState(false);
  const { user } = useUser();
  const isOwner = user?.role === PersonRole.OWNER;
  const isMember = user?.role === PersonRole.MEMBER;
  const isSigner =
    user?.walletAddress && signers.some((s) => s.address.toLowerCase() === user.walletAddress?.toLowerCase());
  const showAccessMessage = isMember && isSigner;

  return (
    <div className="space-y-4">
      {showAccessMessage && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-2 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-primary">You are a Signer</p>
            <p className="text-sm text-primary/80 mt-0.5">
              You can initiate new transfers and approve pending transactions
            </p>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Active Signers</h3>
        {isOwner && (
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
        {signers.map((signer) => (
          <div
            key={signer.address}
            className={`flex items-center justify-between p-4 bg-content2/50 hover:bg-content2/70 transition-colors rounded-lg ${
              signer.address.toLowerCase() === user?.walletAddress?.toLowerCase() ? "border border-primary/20" : ""
            }`}
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
                  {signer.address.toLowerCase() === user?.walletAddress?.toLowerCase() && (
                    <span className="text-xs text-primary">(You)</span>
                  )}
                </div>
                {signer.role && <p className="text-sm text-foreground/60">{formatStringToTitleCase(signer.role)}</p>}
                {signer.isAccount && <p className="text-sm text-foreground/60">Sub-account</p>}
              </div>
            </div>
            {isOwner && (
              <Button className="bg-content3/50 hover:bg-content3" size="sm" variant="flat">
                Manage
              </Button>
            )}
          </div>
        ))}
      </div>

      <AddSignerModal
        account={account}
        isOpen={showAddSigner}
        onClose={() => setShowAddSigner(false)}
        onSuccess={() => setShowAddSigner(false)}
      />
    </div>
  );
}
