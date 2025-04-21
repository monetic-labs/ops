import React from "react";
import { ExternalLink, CheckCircle } from "lucide-react";
import { BridgeComplianceKycStatus as BridgeKybStatus, CardCompanyStatus as RainKybStatus } from "@monetic-labs/sdk";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";

export enum ComplianceStatus {
  APPROVED = "Approved",
  PENDING = "Pending",
  REJECTED = "Rejected",
  NOT_STARTED = "Not Started",
  INCOMPLETE = "Incomplete",
  AWAITING_UBO = "Awaiting UBO",
  MANUAL_REVIEW = "Manual Review",
  UNDER_REVIEW = "Under Review",
  NEEDS_INFORMATION = "Needs Information",
  NEEDS_VERIFICATION = "Needs Verification",
  LOCKED = "Locked",
  CANCELED = "Canceled",
  UNKNOWN = "Unknown",
}

export interface StatusCardProps {
  provider: "BRIDGE" | "RAIN";
  status?: BridgeKybStatus | RainKybStatus;
  onVerify: () => void;
  type: "KYB" | "KYC";
  isLoading?: boolean;
}

export function StatusCard({ provider, status, onVerify, type, isLoading }: StatusCardProps) {
  const getStatusColor = () => {
    if (!status) return "default";
    switch (status) {
      case BridgeKybStatus.APPROVED:
      case RainKybStatus.APPROVED:
        return "success";
      case BridgeKybStatus.PENDING:
      case RainKybStatus.PENDING:
        return "warning";
      case BridgeKybStatus.REJECTED:
      case RainKybStatus.DENIED:
        return "danger";
      default:
        return "default";
    }
  };

  const getStatusText = () => {
    if (!status) return "Not Started";
    switch (status) {
      case BridgeKybStatus.APPROVED:
      case RainKybStatus.APPROVED:
        return "Approved";
      case BridgeKybStatus.PENDING:
      case RainKybStatus.PENDING:
        return "Pending";
      case BridgeKybStatus.REJECTED:
      case RainKybStatus.DENIED:
        return "Rejected";
      case BridgeKybStatus.AWAITING_UBO:
        return "Awaiting UBO";
      case BridgeKybStatus.MANUAL_REVIEW:
      case RainKybStatus.MANUAL_REVIEW:
        return "Manual Review";
      case RainKybStatus.NEEDS_INFORMATION:
        return "Needs Information";
      case RainKybStatus.LOCKED:
        return "Locked";
      case RainKybStatus.CANCELED:
        return "Canceled";
      case BridgeKybStatus.INCOMPLETE:
        return "Incomplete";
      case BridgeKybStatus.UNDER_REVIEW:
        return "Under Review";
      default:
        return "Not Started";
    }
  };

  const getButtonText = () => {
    if (!status) return "Start Verification";
    switch (status) {
      case BridgeKybStatus.APPROVED:
      case RainKybStatus.APPROVED:
        return "Completed";
      case BridgeKybStatus.PENDING:
      case RainKybStatus.PENDING:
        return "Continue Verification";
      case BridgeKybStatus.REJECTED:
      case RainKybStatus.DENIED:
        return "Retry Verification";
      default:
        return "Start Verification";
    }
  };

  const getStatusStyles = () => {
    const color = getStatusColor();

    switch (color) {
      case "success":
        return "text-success-600";
      case "warning":
        return "text-warning";
      case "danger":
        return "text-danger";
      default:
        return "text-default-500";
    }
  };

  return (
    <Card className="bg-content1 border-small border-default-200">
      <CardBody className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-foreground">{provider}</h3>
              <p className="text-sm text-default-500">{type} Verification</p>
            </div>
            <div className={`font-medium ${getStatusStyles()}`}>{getStatusText()}</div>
          </div>
          <Button
            className={
              status === BridgeKybStatus.APPROVED || status === RainKybStatus.APPROVED
                ? "bg-success-600/10 text-success-600 hover:bg-success/20"
                : "bg-default-100 text-default-foreground hover:bg-default-200"
            }
            endContent={
              status === BridgeKybStatus.APPROVED || status === RainKybStatus.APPROVED ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )
            }
            isDisabled={status === BridgeKybStatus.APPROVED || status === RainKybStatus.APPROVED}
            isLoading={isLoading}
            size="md"
            variant="flat"
            onPress={onVerify}
          >
            {getButtonText()}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
