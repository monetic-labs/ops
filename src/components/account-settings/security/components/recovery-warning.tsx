"use client";

import { Card, CardBody } from "@nextui-org/card";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

type RecoveryWarningProps = {
  configuredCount: number;
  threshold?: number;
};

export const RecoveryWarning = ({ configuredCount, threshold }: RecoveryWarningProps) => {
  const getWarningContent = () => {
    if (configuredCount >= 3) {
      return {
        icon: <CheckCircle2 className="w-5 h-5 text-teal-500" />,
        title: "Secure Recovery Configuration",
        message:
          "Your account is protected with 3 recovery options. You can recover your account using any 2 of these options.",
        bgColor: "bg-teal-500/10",
        textColor: "text-teal-500",
      };
    }

    if (configuredCount === 2) {
      return {
        icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
        title: "Limited Recovery Options",
        message:
          "You have 2 recovery options configured. Both options will be required for recovery. Adding a third option is recommended for better security and flexibility.",
        bgColor: "bg-amber-500/10",
        textColor: "text-amber-500",
      };
    }

    if (configuredCount === 1) {
      return {
        icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
        title: "High Risk Configuration",
        message:
          "Having only one recovery option is highly risky. If you lose access to this option, you may permanently lose access to your account. Please add more recovery options.",
        bgColor: "bg-red-500/10",
        textColor: "text-red-500",
      };
    }

    return {
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
      title: "No Recovery Options",
      message: "Your account is not protected. Configure at least 2 recovery options to secure your account.",
      bgColor: "bg-red-500/10",
      textColor: "text-red-500",
    };
  };

  const content = getWarningContent();

  return (
    <Card className={`${content.bgColor} border-none shadow-none`}>
      <CardBody className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{content.icon}</div>
          <div>
            <h4 className={`font-medium ${content.textColor} mb-1`}>{content.title}</h4>
            <p className="text-sm text-foreground/60">{content.message}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
