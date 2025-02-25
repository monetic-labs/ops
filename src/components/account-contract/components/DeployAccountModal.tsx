import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/modal";
import { Button } from "@nextui-org/button";
import { Select, SelectItem } from "@nextui-org/select";
import { Chip } from "@nextui-org/chip";
import { ScrollShadow } from "@nextui-org/scroll-shadow";
import { Avatar } from "@nextui-org/avatar";
import { SharedSelection } from "@nextui-org/system";
import { Address } from "viem";

import { formatStringToTitleCase } from "@/utils/helpers";
import { useAccountManagement } from "@/hooks/useAccountManagement";
import { useUser } from "@/contexts/UserContext";
import { Account, Signer } from "@/types/account";
import { deploySafeAccount } from "@/utils/safe/deploy";

export function DeployAccountModal({
  isOpen,
  onClose,
  onDeploy,
  accounts,
  selectedAccount,
  selectedSigners,
  setSelectedSigners,
  threshold,
  setThreshold,
}: {
  isOpen: boolean;
  onClose: () => void;
  onDeploy: () => void;
  accounts: Account[];
  selectedAccount: Account;
  selectedSigners: Signer[];
  setSelectedSigners: (signers: Signer[]) => void;
  threshold: number;
  setThreshold: (threshold: number) => void;
}) {
  const { isLoadingAccounts, registerSubAccount, unregisterSubAccount, signers, isLoadingSigners } =
    useAccountManagement();
  const { user, credentials, isAuthenticated } = useUser();

  if (!credentials) {
    if (isAuthenticated) {
      throw new Error("No credentials found");
    }
    return null;
  }

  const handleSignerChange = (keys: SharedSelection) => {
    if (keys === "all") {
      setSelectedSigners(signers);
      return;
    }

    const selected = Array.from(keys)
      .map((key) => signers.find((signer) => signer.address === key))
      .filter((signer): signer is Signer => Boolean(signer));

    setSelectedSigners(selected);
    setThreshold(1);
  };

  const handleDeploy = async () => {
    try {
      if (selectedSigners.length === 0) {
        throw new Error("At least one signer must be selected");
      }

      // Get the deployer's address (current user)
      const individualSafeAddress = user?.walletAddress as Address;
      if (!individualSafeAddress) {
        throw new Error("Deployer must have a wallet address");
      }

      // Get all signers' addresses
      const signerAddresses = selectedSigners.map((signer) => signer.address);

      await deploySafeAccount({
        individualSafeAddress,
        credentials,
        signerAddresses,
        threshold,
        callbacks: {
          onSent: onDeploy,
          onSuccess: async (safeAddress) => {
            await registerSubAccount(safeAddress, selectedAccount.name);
          },
          onError: (error) => {
            console.error("Deployment failed:", error);
          },
        },
      });
    } catch (error) {
      console.error("Error in deployment process:", error);
      // TODO: Show error message to user
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      classNames={{
        backdrop: "bg-[#000000]/50 backdrop-opacity-40",
        base: "border-content3",
        body: "py-6",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h2 className="text-xl font-bold">Deploy {selectedAccount.name} Account</h2>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground/90">About Signers and Threshold</h3>
                  <p className="text-sm text-foreground/60">
                    Signers are users who can approve transactions for this account only. The threshold is the minimum
                    number of signers required to approve transactions.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="signer-select" className="text-sm font-medium text-foreground/90">
                      Signers
                    </label>
                    <Select
                      id="signer-select"
                      items={signers}
                      selectionMode="multiple"
                      placeholder="Select users to upgrade"
                      selectedKeys={new Set(selectedSigners.map((op) => op.address))}
                      onSelectionChange={(keys) => handleSignerChange(keys)}
                      isLoading={isLoadingAccounts}
                      classNames={{
                        trigger: "bg-content2 data-[hover=true]:bg-content3",
                        value: "text-foreground/90",
                      }}
                      renderValue={(items) => (
                        <ScrollShadow className="w-full flex gap-2 flex-wrap py-2" hideScrollBar>
                          {items.map((item) => (
                            <Chip
                              key={item.key}
                              variant="flat"
                              color="primary"
                              classNames={{
                                base: "bg-content3",
                                content: "text-foreground/90",
                              }}
                            >
                              {item.data?.name}
                            </Chip>
                          ))}
                        </ScrollShadow>
                      )}
                    >
                      {(signer) => (
                        <SelectItem key={signer.address} textValue={signer.name} value={signer.address}>
                          <div className="flex gap-2 items-center">
                            <Avatar
                              name={signer.name}
                              size="sm"
                              classNames={{
                                base: "bg-content3",
                                name: "text-foreground/90",
                              }}
                            />
                            <div className="flex flex-col flex-grow">
                              <span className="text-small">{signer.name}</span>
                              <div className="flex items-center gap-2">
                                {signer.role && (
                                  <span className="text-xs text-foreground/60">
                                    {formatStringToTitleCase(signer.role)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      )}
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="threshold-select" className="text-sm font-medium text-foreground/90">
                      Approval Threshold
                    </label>
                    <Select
                      id="threshold-select"
                      placeholder={selectedSigners.length === 0 ? "Select a threshold" : "Select required approvals"}
                      selectedKeys={selectedSigners.length > 0 ? new Set([threshold.toString()]) : new Set()}
                      selectionMode="single"
                      onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0];
                        if (value) {
                          setThreshold(parseInt(value.toString()));
                        }
                      }}
                      isDisabled={selectedSigners.length === 0}
                      classNames={{
                        trigger: "bg-content2 data-[hover=true]:bg-content3",
                        value: "text-foreground/90",
                        description: `${selectedSigners.length === 1 ? "text-warning" : "text-foreground/60"}`,
                      }}
                      renderValue={(item) => {
                        if (selectedSigners.length === 0) {
                          return "Select a threshold";
                        }
                        const num = item[0]?.key;
                        return num
                          ? `${num} of ${selectedSigners.length} ${selectedSigners.length === 1 ? "signer" : "signers"} required`
                          : "Select a threshold";
                      }}
                      description={
                        selectedSigners.length === 1
                          ? "Warning: Relying on one signer risks losing access if their account is compromised."
                          : "A higher threshold means more security but requires more signers to approve transactions."
                      }
                    >
                      {selectedSigners.length > 0 ? (
                        Array.from({ length: selectedSigners.length }, (_, i) => i + 1).map((num) => (
                          <SelectItem key={num.toString()}>
                            {num} of {selectedSigners.length} {selectedSigners.length === 1 ? "signer" : "signers"}{" "}
                            required
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem key="1">1 signer required</SelectItem>
                      )}
                    </Select>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose} className="font-medium">
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={handleDeploy}
                className="font-medium"
                isDisabled={selectedSigners.length === 0}
              >
                Deploy Account
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
