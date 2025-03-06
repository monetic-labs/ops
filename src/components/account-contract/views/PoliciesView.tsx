import { Button } from "@nextui-org/button";
import { Shield, Info, Clock, Settings } from "lucide-react";
import { Tooltip } from "@nextui-org/tooltip";

import { Signer } from "@/types/account";

export function PoliciesView({ signers, isLoading }: { signers: Signer[]; isLoading: boolean }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="text-foreground/60" size={16} />
          <h3 className="text-lg font-semibold">Transfer Policies</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="bg-content3 text-primary hover:bg-content4"
            size="sm"
            startContent={<Settings className="w-4 h-4" />}
          >
            Configure
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-4">
          {/* Policy Overview Card */}
          <div className="bg-content2 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <span className="text-sm text-foreground/60">Default Transfer Limit</span>
                <span className="text-lg font-medium mt-1">$50,000 / day</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-foreground/60">Require Approval Above</span>
                <span className="text-lg font-medium mt-1">$10,000</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-foreground/60">Threshold Required</span>
                <span className="text-lg font-medium mt-1">2 signers</span>
              </div>
            </div>
          </div>

          {/* Active Policies */}
          <div className="bg-content2 rounded-lg p-4">
            <h4 className="text-sm font-medium mb-3">Active Policies</h4>
            <div className="space-y-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-content3 rounded-lg gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-content4">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">High Value Transfers</p>
                      <span className="px-2 py-0.5 text-xs bg-default-200 text-default-700 rounded-full">
                        Coming Soon
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-foreground/60">Requires 2 signatures above $10,000</p>
                      <Tooltip content="This policy requires two signers to sign any transfer above $10,000">
                        <Info className="w-3 h-3 text-foreground/40" />
                      </Tooltip>
                    </div>
                  </div>
                </div>
                <Button isDisabled className="bg-content4 shrink-0" size="sm" variant="flat">
                  Edit
                </Button>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-content3 rounded-lg gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-content4">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">Daily Limit</p>
                      <span className="px-2 py-0.5 text-xs bg-default-200 text-default-700 rounded-full">
                        Coming Soon
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-foreground/60">Maximum $50,000 per day</p>
                      <Tooltip content="Total transfers cannot exceed $50,000 in a 24-hour period">
                        <Info className="w-3 h-3 text-foreground/40" />
                      </Tooltip>
                    </div>
                  </div>
                </div>
                <Button isDisabled className="bg-content4 shrink-0" size="sm" variant="flat">
                  Edit
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
