import React from "react";
import { ExternalLink, CheckCircle, AlertCircle, Clock, Lock, X } from "lucide-react";
import {
  BridgeComplianceKycStatus as BridgeKybStatus,
  CardCompanyStatus as RainKybStatus,
} from "@backpack-fux/pylon-sdk";

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

interface StatusCardProps {
  provider: "BRIDGE" | "RAIN"; // TODO: Get providers from SDK
  status: BridgeKybStatus | RainKybStatus | undefined;
  onVerify: () => void;
}

// TODO: Add icons for each status
export function StatusCard({ provider, status, onVerify }: StatusCardProps) {
  const formatStatus = (status: BridgeKybStatus | RainKybStatus | undefined) => {
    switch (status) {
      case BridgeKybStatus.APPROVED:
      case RainKybStatus.APPROVED:
        return ComplianceStatus.APPROVED;
      case BridgeKybStatus.REJECTED:
      case RainKybStatus.DENIED:
        return ComplianceStatus.REJECTED;
      case BridgeKybStatus.PENDING:
      case RainKybStatus.PENDING:
        return ComplianceStatus.PENDING;
      case BridgeKybStatus.NOT_STARTED:
      case RainKybStatus.NOT_STARTED:
        return ComplianceStatus.NOT_STARTED;
      case BridgeKybStatus.INCOMPLETE:
        return ComplianceStatus.INCOMPLETE;
      case BridgeKybStatus.AWAITING_UBO:
        return ComplianceStatus.AWAITING_UBO;
      case BridgeKybStatus.MANUAL_REVIEW:
      case RainKybStatus.MANUAL_REVIEW:
        return ComplianceStatus.MANUAL_REVIEW;
      case BridgeKybStatus.UNDER_REVIEW:
        return ComplianceStatus.UNDER_REVIEW;
      case RainKybStatus.NEEDS_INFORMATION:
        return ComplianceStatus.NEEDS_INFORMATION;
      case RainKybStatus.NEEDS_VERIFICATION:
        return ComplianceStatus.NEEDS_VERIFICATION;
      case RainKybStatus.LOCKED:
        return ComplianceStatus.LOCKED;
      case RainKybStatus.CANCELED:
        return ComplianceStatus.CANCELED;
      default:
        return ComplianceStatus.UNKNOWN;
    }
  };

  const getStatusColor = (status: ComplianceStatus) => {
    switch (status) {
      case ComplianceStatus.APPROVED:
        return "text-green-500";
      case ComplianceStatus.PENDING:
        return "text-yellow-500";
      case ComplianceStatus.REJECTED:
        return "text-red-500";
      case ComplianceStatus.NOT_STARTED:
        return "text-gray-500";
      case ComplianceStatus.INCOMPLETE:
        return "text-orange-500";
      case ComplianceStatus.AWAITING_UBO:
        return "text-blue-500";
      case ComplianceStatus.MANUAL_REVIEW:
        return "text-purple-500";
      case ComplianceStatus.UNDER_REVIEW:
        return "text-indigo-500";
      case ComplianceStatus.NEEDS_INFORMATION:
        return "text-orange-500";
      case ComplianceStatus.NEEDS_VERIFICATION:
        return "text-red-500";
      case ComplianceStatus.LOCKED:
        return "text-gray-500";
      case ComplianceStatus.CANCELED:
        return "text-gray-500";
      default:
        return "text-red-500";
    }
  };

  // TODO: Add icons for each status
  const getStatusIcon = (status: ComplianceStatus) => {
    switch (status) {
      case ComplianceStatus.APPROVED:
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case ComplianceStatus.PENDING:
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case ComplianceStatus.REJECTED:
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      case ComplianceStatus.NOT_STARTED:
        return <Clock className="w-6 h-6 text-gray-500" />;
      case ComplianceStatus.INCOMPLETE:
        return <AlertCircle className="w-6 h-6 text-orange-500" />;
      case ComplianceStatus.AWAITING_UBO:
        return <Clock className="w-6 h-6 text-blue-500" />;
      case ComplianceStatus.MANUAL_REVIEW:
        return <Clock className="w-6 h-6 text-purple-500" />;
      case ComplianceStatus.UNDER_REVIEW:
        return <Clock className="w-6 h-6 text-indigo-500" />;
      case ComplianceStatus.NEEDS_INFORMATION:
        return <AlertCircle className="w-6 h-6 text-orange-500" />;
      case ComplianceStatus.NEEDS_VERIFICATION:
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      case ComplianceStatus.LOCKED:
        return <Lock className="w-6 h-6 text-gray-500" />;
      case ComplianceStatus.CANCELED:
        return <X className="w-6 h-6 text-gray-500" />;
      default:
        return <AlertCircle className="w-6 h-6 text-red-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800">{provider}</h3>
        {getStatusIcon(formatStatus(status))}
      </div>

      <div className="mb-4">
        <span className="text-sm text-gray-500">Status</span>
        <p className={`text-lg font-medium ${getStatusColor(formatStatus(status))}`}>
          {status === undefined ? "Loading..." : formatStatus(status)}
        </p>
      </div>

      <button
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-300"
        onClick={onVerify}
      >
        Start Verification
        <ExternalLink className="w-4 h-4" />
      </button>
    </div>
  );
}
