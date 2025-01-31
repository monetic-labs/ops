"use client";

import { Card, CardBody } from "@nextui-org/card";
import { AlertTriangle } from "lucide-react";

type RecoveryWarningProps = {
  configuredCount: number;
};

export const RecoveryWarning = ({ configuredCount }: RecoveryWarningProps) => {
  if (configuredCount >= 3) return null;

  return (
    <Card className="bg-warning-50/10 border border-warning text-warning">
      <CardBody className="gap-2 py-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 mt-1 flex-shrink-0" />
          <div>
            <p className="font-medium">Account Recovery Not Configured</p>
            <p className="text-sm text-warning-400 py-1">
              Your account is at risk. Set up recovery to prevent permanent lockout.
            </p>
            <ul className="text-sm list-disc pl-4 mt-2 space-y-1 text-warning-400">
              <li>Device changes may cause access issues</li>
              <li>Domain changes could affect authentication</li>
              <li>Lost devices may lock you out</li>
            </ul>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
