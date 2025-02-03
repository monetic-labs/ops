"use client";

import { Button } from "@nextui-org/button";
import { Tooltip } from "@nextui-org/tooltip";
import { Shield, InfoIcon, AlertTriangle } from "lucide-react";

type RecoveryHeaderProps = {
  configuredCount: number;
};

export const RecoveryHeader = ({ configuredCount }: RecoveryHeaderProps) => (
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
);
