import type { Account } from "@/types/account";

import { Button } from "@nextui-org/button";
import { Card, CardBody } from "@nextui-org/card";
import { X, Info, Copy, Share2 } from "lucide-react";
import { Tooltip } from "@nextui-org/tooltip";

interface ReceiveViewProps {
  selectedAccount: Account;
  onClose: () => void;
  selectedSettlementAccount: Account;
  onChangeSettlementAccount: (account: Account) => void;
  availableAccounts: Account[];
}

// Mock data for testing - replace with actual API data
const mockDepositInstructions = {
  currency: "usd" as const,
  bankName: "Silicon Valley Bank",
  bankAddress: "3003 Tasman Drive, Santa Clara, CA 95054",
  routingNumber: "121140399",
  accountNumber: "1234567890",
  beneficiaryName: "MyBackpack LLC",
  beneficiaryAddress: "123 Main St, San Francisco, CA 94105",
};

export function ReceiveView({
  selectedAccount,
  onClose,
  selectedSettlementAccount,
  onChangeSettlementAccount,
  availableAccounts,
}: ReceiveViewProps) {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Add toast notification
  };

  const handleShare = () => {
    // TODO: Implement share functionality
  };

  return (
    <Card className="w-full bg-content1/90 border border-border backdrop-blur-sm">
      <CardBody className="p-0">
        <div>
          <div className="sticky top-0 z-20 flex justify-between items-center px-8 py-5 border-b border-border bg-content1/80 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-content2/60">
                <selectedAccount.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{selectedAccount.name}</h2>
                <p className="text-sm text-foreground/60">Receive funds</p>
              </div>
            </div>
            <Button
              isIconOnly
              className="w-10 h-10 text-foreground/60 hover:text-foreground bg-content2/60 hover:bg-content2"
              variant="light"
              onPress={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-4 md:p-6">
            <div className="max-w-[1200px] mx-auto">
              {/* Overview */}
              <div className="space-y-2 md:text-center md:max-w-2xl md:mx-auto mb-6">
                <h3 className="text-lg font-medium">Virtual Account Details</h3>
                <p className="text-sm text-foreground/60">
                  Your virtual account provides unique routing and account numbers that accept wire transfers and ACH
                  deposits.
                </p>
              </div>

              <div className="grid md:grid-cols-[1fr_1px_2fr] gap-6">
                {/* Left Column - Settlement Account */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Settlement Account</h4>
                    <Button
                      className="min-w-0 h-7 px-3 text-xs bg-primary/10 text-primary hover:bg-primary/20"
                      size="sm"
                      variant="flat"
                      onClick={() => {
                        // TODO: Open account selection modal
                      }}
                    >
                      Change Account
                    </Button>
                  </div>

                  <div className="bg-content2 p-4 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground/60">Deposits will settle to</span>
                      <div className="flex items-center gap-2">
                        <selectedSettlementAccount.icon className="w-4 h-4 text-foreground/60" />
                        <span className="text-sm font-medium">{selectedSettlementAccount.name}</span>
                      </div>
                    </div>
                    <p className="text-xs text-foreground/60">
                      You can change which account receives deposits at any time. Changes will apply to future deposits
                      only.
                    </p>
                  </div>

                  {/* Minimum Deposit Notice */}
                  <div className="bg-warning/10 p-4 rounded-xl space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Info className="text-warning" size={16} />
                      Minimum Deposit
                    </h4>
                    <p className="text-sm text-foreground/60">All deposits must be at least $1 USD</p>
                  </div>
                </div>

                {/* Divider for desktop */}
                <div className="hidden md:block bg-border" />

                {/* Right Column - Bank Details */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Bank Information</h4>
                    <Button
                      className="min-w-0 h-7 px-3 text-xs bg-primary/10 text-primary hover:bg-primary/20"
                      size="sm"
                      startContent={<Share2 size={14} />}
                      variant="flat"
                      onPress={handleShare}
                    >
                      Share Details
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-content2 p-4 rounded-xl space-y-3">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground/60">Bank Name</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-right">{mockDepositInstructions.bankName}</span>
                            <Button
                              isIconOnly
                              className="min-w-0 h-6 w-6"
                              size="sm"
                              variant="light"
                              onPress={() => handleCopy(mockDepositInstructions.bankName)}
                            >
                              <Copy size={14} />
                            </Button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground/60">Bank Address</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-right">{mockDepositInstructions.bankAddress}</span>
                            <Button
                              isIconOnly
                              className="min-w-0 h-6 w-6"
                              size="sm"
                              variant="light"
                              onPress={() => handleCopy(mockDepositInstructions.bankAddress)}
                            >
                              <Copy size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-content2 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-foreground/60">Routing Number</span>
                          <Tooltip className="bg-content2 text-foreground" content="Use this for ACH transfers">
                            <Info className="text-foreground/60 cursor-help" size={14} />
                          </Tooltip>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono">{mockDepositInstructions.routingNumber}</span>
                          <Button
                            isIconOnly
                            className="min-w-0 h-6 w-6"
                            size="sm"
                            variant="light"
                            onPress={() => handleCopy(mockDepositInstructions.routingNumber)}
                          >
                            <Copy size={14} />
                          </Button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-foreground/60">Account Number</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono">{mockDepositInstructions.accountNumber}</span>
                          <Button
                            isIconOnly
                            className="min-w-0 h-6 w-6"
                            size="sm"
                            variant="light"
                            onPress={() => handleCopy(mockDepositInstructions.accountNumber)}
                          >
                            <Copy size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-content2 p-4 rounded-xl space-y-3 md:col-span-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-foreground/60">Beneficiary Name</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{mockDepositInstructions.beneficiaryName}</span>
                          <Button
                            isIconOnly
                            className="min-w-0 h-6 w-6"
                            size="sm"
                            variant="light"
                            onPress={() => handleCopy(mockDepositInstructions.beneficiaryName)}
                          >
                            <Copy size={14} />
                          </Button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-foreground/60">Beneficiary Address</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-right">{mockDepositInstructions.beneficiaryAddress}</span>
                          <Button
                            isIconOnly
                            className="min-w-0 h-6 w-6"
                            size="sm"
                            variant="light"
                            onPress={() => handleCopy(mockDepositInstructions.beneficiaryAddress)}
                          >
                            <Copy size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
