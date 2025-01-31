"use client";

import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Chip } from "@nextui-org/chip";
import { Tooltip } from "@nextui-org/tooltip";
import { Accordion, AccordionItem } from "@nextui-org/accordion";
import { Shield, InfoIcon, AlertTriangle } from "lucide-react";
import { RECOVERY_OPTIONS } from "../constants";
import { EmailVerification } from "./email-verification";
import { BackpackRecovery } from "./backpack-recovery";
import { PhoneVerification } from "./phone-verification";
import { EmailVerificationProps, PhoneVerificationProps } from "../types";

type RecoveryOptionsProps = {
  configuredCount: number;
  onBackpackRecoveryToggle: () => Promise<void>;
  isBackpackRecoveryEnabled: boolean;
} & EmailVerificationProps &
  PhoneVerificationProps;

export const RecoveryOptions = ({
  configuredCount,
  onBackpackRecoveryToggle,
  isBackpackRecoveryEnabled,
  ...props
}: RecoveryOptionsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h4 className="text-lg font-medium">Recovery Options</h4>
          <Tooltip
            content={
              <div className="max-w-xs p-2">
                <p className="font-medium mb-2">How Recovery Works:</p>
                <ul className="text-sm list-disc pl-4 space-y-1">
                  <li>Set up 3 different recovery methods</li>
                  <li>Any 2 methods can be used to recover access</li>
                  <li>Recovery process includes a grace period for security</li>
                  <li>All guardians must verify recovery attempts</li>
                </ul>
              </div>
            }
            placement="right"
          >
            <Button isIconOnly size="sm" variant="light">
              <InfoIcon className="w-4 h-4" />
            </Button>
          </Tooltip>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <span className="text-sm text-warning">Requires 3 options</span>
        </div>
      </div>

      <Accordion
        className="p-0 gap-0 flex flex-col bg-[#141414] rounded-lg border border-[#1a1a1a]"
        itemClasses={{
          base: "border-b border-[#1a1a1a] last:border-0",
          title: "font-medium",
          trigger: "px-4 py-3 flex data-[hover=true]:bg-[#1a1a1a] rounded-none",
          indicator: "text-medium",
          content: "pt-0",
        }}
        showDivider={false}
        variant="light"
      >
        {RECOVERY_OPTIONS.map((option) => {
          if (option.id === "backpack") {
            return (
              <AccordionItem
                key={option.id}
                aria-label={option.title}
                startContent={
                  <option.icon
                    className={`w-5 h-5 ${isBackpackRecoveryEnabled ? "text-success" : "text-default-500"}`}
                  />
                }
                subtitle={<p className="text-sm text-gray-400">{option.description}</p>}
                title={
                  <div className="flex items-center gap-2">
                    <span>{option.title}</span>
                    {isBackpackRecoveryEnabled && (
                      <Chip size="sm" variant="flat" color="success">
                        Configured
                      </Chip>
                    )}
                  </div>
                }
              >
                <div className="px-4 pb-4">
                  <BackpackRecovery isEnabled={isBackpackRecoveryEnabled} onToggle={onBackpackRecoveryToggle} />
                </div>
              </AccordionItem>
            );
          }

          return (
            <AccordionItem
              key={option.id}
              aria-label={option.title}
              isDisabled={option.isComingSoon}
              classNames={{
                base: option.isComingSoon ? "opacity-50" : option.isConfigured ? "bg-success/10" : "",
                content: "pt-6",
              }}
              startContent={
                <option.icon
                  className={`w-5 h-5 ${
                    option.isConfigured ? "text-success" : option.isComingSoon ? "text-default-300" : "text-default-500"
                  }`}
                />
              }
              subtitle={<p className="text-sm text-gray-400">{option.description}</p>}
              title={
                <div className="flex items-center gap-2">
                  <span className={option.isComingSoon ? "text-default-400" : ""}>{option.title}</span>
                  {option.isComingSoon && (
                    <Chip size="sm" variant="flat" className="bg-[#1a1a1a] text-default-400">
                      Coming Soon
                    </Chip>
                  )}
                  {option.isConfigured && (
                    <Chip size="sm" variant="flat" color="success">
                      Configured
                    </Chip>
                  )}
                </div>
              }
            >
              <div className="px-4 pb-4 space-y-4">
                {option.id === "email" && <EmailVerification {...props} />}

                {option.id === "phone" && <PhoneVerification {...props} />}

                {(option.id === "wallet" || option.id === "trusted") && (
                  <div className="space-y-4">
                    <Input label="Wallet Address" placeholder="Enter wallet address" />
                    <Button color="primary">Add Guardian</Button>
                  </div>
                )}
              </div>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};
