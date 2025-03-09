import type { Account, Signer } from "@/types/account";

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/modal";
import { Button } from "@nextui-org/button";
import { Select, SelectItem } from "@nextui-org/select";
import { User } from "@nextui-org/user";
import { Trash2, Plus, Shield, Users, Search, Key, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@nextui-org/input";
import { ScrollShadow } from "@nextui-org/scroll-shadow";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { useSigners } from "@/contexts/SignersContext";
import { getOpepenAvatar } from "@/utils/helpers";

interface DeployAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeploy: () => Promise<void>;
  accounts: Account[];
  selectedAccount: Account;
  selectedSigners: Signer[];
  setSelectedSigners: (signers: Signer[]) => void;
  threshold: number;
  setThreshold: (threshold: number) => void;
}

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
}: DeployAccountModalProps) {
  const { getAvailableSigners, isLoading } = useSigners();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllSigners, setShowAllSigners] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);

  const availableSigners = getAvailableSigners(selectedSigners.map((s) => s.address));

  // Reset error state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setDeployError(null);
      setIsDeploying(false);
    }
  }, [isOpen]);

  // Filter signers based on search query
  const filteredSigners = selectedSigners.filter(
    (signer) =>
      signer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (signer.role?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  // Limit displayed signers unless "show all" is clicked
  const displayedSigners = showAllSigners ? filteredSigners : filteredSigners.slice(0, 3);
  const hasMoreSigners = filteredSigners.length > 3 && !showAllSigners;

  const handleAddSigner = (signerId: string) => {
    const signer = availableSigners.find((s) => s.address === signerId);
    if (signer) {
      setSelectedSigners([...selectedSigners, signer]);
    }
  };

  const handleRemoveSigner = (signerId: string) => {
    setSelectedSigners(selectedSigners.filter((s) => s.address !== signerId));
  };

  const handleDeployClick = async () => {
    setIsDeploying(true);
    setDeployError(null);

    try {
      console.log("Starting account deployment with signers:", selectedSigners);
      console.log("Using threshold:", threshold);

      await onDeploy();
      // Only close on success
      onClose();
      toast.success("Account activated successfully!");
    } catch (error) {
      console.error("Deployment error:", error);

      // Log detailed error information
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);

        // Try to extract more details if available
        if ("cause" in error) {
          console.error("Error cause:", (error as any).cause);
        }
      }

      let errorMessage = "Failed to activate account";

      if (error instanceof Error) {
        // Handle specific error cases
        if (error.message.includes("Create2 call failed")) {
          errorMessage = "This account may already be deployed. Please refresh and try again.";
        } else if (error.message.includes("eth_estimateUserOperationGas")) {
          errorMessage = "Failed to estimate gas for deployment. The account may already be deployed.";
        } else if (
          error.message.includes("Invalid UserOp signature") ||
          error.message.includes("paymaster signature")
        ) {
          errorMessage =
            "Signature validation failed. Please ensure your passkey is properly registered and try again.";

          // Add more specific guidance for signature issues
          if (error.message.includes("Invalid UserOp signature")) {
            errorMessage += " There may be an issue with your WebAuthn credentials.";
          } else if (error.message.includes("paymaster signature")) {
            errorMessage += " There may be an issue with the transaction sponsorship.";
          }
        } else if (error.message.includes("bundler")) {
          errorMessage = "The transaction bundler service is experiencing issues. Please try again later.";
        } else if (error.message.includes("paymaster")) {
          errorMessage = "Transaction sponsorship failed. Please try again later.";
        } else {
          // Use the actual error message for other cases
          errorMessage = error.message;
        }
      }

      setDeployError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDeploying(false);
    }
  };

  useEffect(() => {
    if (selectedSigners.length > 0 && threshold === 0) {
      setThreshold(1);
    } else if (selectedSigners.length > 0 && threshold > selectedSigners.length) {
      setThreshold(selectedSigners.length);
    }
  }, [selectedSigners.length, threshold]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={isDeploying ? undefined : onClose}
      classNames={{
        base: "max-w-xl mx-auto bg-background",
        header: "border-b border-divider py-4",
        body: "p-0",
        footer: "border-t border-divider py-4",
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex items-center gap-2 px-6">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-xl">Activate Account</span>
            </ModalHeader>

            <ModalBody>
              <div className="flex flex-col gap-8 px-6 py-6">
                {/* Selected Account */}
                <div className="space-y-2">
                  <div className="text-sm text-foreground/60">Selected Account</div>
                  <div className="flex items-center gap-3">
                    <selectedAccount.icon className="w-6 h-6 text-foreground/70" />
                    <span className="text-xl font-medium">{selectedAccount.name}</span>
                  </div>
                </div>

                {/* Error message - placed right after the account info */}
                {deployError && (
                  <div className="flex items-center gap-2 p-3 bg-danger-50 text-danger border border-danger-200 rounded-lg">
                    <AlertCircle size={18} className="flex-shrink-0" />
                    <p className="text-sm">{deployError}</p>
                  </div>
                )}

                {/* Account Signers */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-foreground/70" />
                      <h3 className="text-lg font-medium">Account Signers</h3>
                    </div>
                    <div className="text-sm bg-default-100 px-2 py-1 rounded-full">
                      {selectedSigners.length} {selectedSigners.length === 1 ? "signer" : "signers"}
                    </div>
                  </div>

                  {/* Search Input */}
                  {selectedSigners.length > 3 && (
                    <div className="relative">
                      <Input
                        classNames={{
                          base: "w-full",
                          inputWrapper: "bg-default-100 border-none h-10",
                        }}
                        placeholder="Search signers..."
                        startContent={<Search size={16} className="text-foreground/60" />}
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                    </div>
                  )}

                  {/* Signer List */}
                  {selectedSigners.length > 0 ? (
                    <div className="space-y-2">
                      <ScrollShadow className={`${selectedSigners.length > 3 ? "max-h-[240px]" : ""}`}>
                        <div className="space-y-2 pr-1">
                          {displayedSigners.map((signer) => (
                            <div
                              key={signer.address}
                              className="flex items-center justify-between p-3 bg-default-100 rounded-lg"
                            >
                              <User
                                avatarProps={{
                                  radius: "lg",
                                  src: getOpepenAvatar(signer.name, 36),
                                }}
                                description={signer.role}
                                name={signer.name}
                              />
                              <Button
                                isIconOnly
                                className="text-danger"
                                size="sm"
                                variant="light"
                                onPress={() => handleRemoveSigner(signer.address)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollShadow>

                      {/* Show more button */}
                      {hasMoreSigners && (
                        <Button
                          variant="flat"
                          color="primary"
                          size="sm"
                          className="w-full mt-1"
                          onPress={() => setShowAllSigners(true)}
                        >
                          Show {filteredSigners.length - 3} more signers
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-4 bg-default-100 rounded-lg">
                      <p className="text-foreground/60">No signers added yet</p>
                    </div>
                  )}

                  {/* Add Signer */}
                  <div className="space-y-2">
                    <div className="text-sm text-foreground/60">Add a signer</div>
                    <div className="flex items-center gap-2 bg-default-100 rounded-lg px-3">
                      <Plus size={18} className="text-foreground/60 flex-shrink-0" />
                      <Select
                        isDisabled={isLoading || availableSigners.length === 0}
                        placeholder="Select a signer to add"
                        selectedKeys={[]}
                        className="w-full"
                        classNames={{
                          trigger: "h-10 border-0 bg-transparent",
                          value: "text-foreground",
                        }}
                        popoverProps={{
                          classNames: {
                            content: "p-0",
                          },
                        }}
                        onChange={(e) => handleAddSigner(e.target.value)}
                      >
                        {availableSigners.map((signer) => (
                          <SelectItem key={signer.address} textValue={signer.name}>
                            <User
                              avatarProps={{
                                radius: "lg",
                                src: getOpepenAvatar(signer.name, 32),
                              }}
                              description={signer.role}
                              name={signer.name}
                            />
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Signature Threshold */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-foreground/70" />
                    <h3 className="text-lg font-medium">Signature Threshold</h3>
                  </div>

                  <div className="space-y-4">
                    <p className="text-foreground/80">How many signatures are required to approve transactions?</p>

                    {/* Threshold Selection - Adaptive to number of signers */}
                    <div className="flex flex-wrap gap-2">
                      {selectedSigners.length <= 5 ? (
                        // Show all options when 5 or fewer signers
                        Array.from({ length: Math.max(1, selectedSigners.length) }, (_, i) => i + 1).map((num) => (
                          <button
                            key={num}
                            className={`
                              py-2 px-4 rounded-lg transition-colors
                              ${
                                threshold === num
                                  ? "bg-primary text-white font-medium"
                                  : "bg-default-100 text-foreground hover:bg-default-200"
                              }
                            `}
                            onClick={() => setThreshold(num)}
                          >
                            {num} {num === 1 ? "signature" : "signatures"}
                          </button>
                        ))
                      ) : (
                        // For more than 5 signers, show a more compact UI
                        <div className="w-full">
                          <Select
                            label="Required signatures"
                            selectedKeys={[threshold.toString()]}
                            className="w-full"
                            onChange={(e) => setThreshold(parseInt(e.target.value))}
                          >
                            {Array.from({ length: selectedSigners.length }, (_, i) => i + 1).map((num) => (
                              <SelectItem key={num.toString()} value={num.toString()}>
                                {num} {num === 1 ? "signature" : "signatures"}
                              </SelectItem>
                            ))}
                          </Select>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-default-100 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      <p className="text-sm">
                        <span className="font-medium">{threshold}</span> out of{" "}
                        <span className="font-medium">{selectedSigners.length}</span>{" "}
                        {selectedSigners.length === 1 ? "signer" : "signers"} will need to approve transactions
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ModalBody>

            <ModalFooter className="px-6 flex justify-between">
              <Button
                color="danger"
                variant="flat"
                radius="lg"
                className="px-6"
                onPress={onClose}
                isDisabled={isDeploying}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                radius="lg"
                className="px-6"
                isDisabled={selectedSigners.length === 0 || isDeploying}
                isLoading={isDeploying}
                startContent={!isDeploying && <Shield size={16} />}
                onPress={handleDeployClick}
              >
                {isDeploying ? "Activating..." : "Activate Account"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
