import React from "react";
import { ExternalLink, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { BridgeComplianceKycStatus } from "@backpack-fux/pylon-sdk";

interface StatusCardProps {
  provider: "BRIDGE" | "RAIN"; // TODO: Get providers from SDK
  status: string;
  onVerify: () => void;
}

// TODO: Add icons for each status
export function StatusCard({ provider, status, onVerify }: StatusCardProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case BridgeComplianceKycStatus.APPROVED:
        return "text-green-500";
      case BridgeComplianceKycStatus.PENDING:
        return "text-yellow-500";
      // TODO: Add remaining statuses
      default:
        return "text-red-500";
    }
  };

  // TODO: Add icons for each status
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case BridgeComplianceKycStatus.APPROVED:
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case BridgeComplianceKycStatus.PENDING:
        return <Clock className="w-6 h-6 text-yellow-500" />;
      // TODO: Add remaining statuses
      default:
        return <AlertCircle className="w-6 h-6 text-red-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800">{provider}</h3>
        {getStatusIcon(status)}
      </div>

      <div className="mb-4">
        <span className="text-sm text-gray-500">Status</span>
        <p className={`text-lg font-medium ${getStatusColor(status)}`}>{status}</p>
      </div>

      <button
        onClick={onVerify}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-300"
      >
        Start Verification
        <ExternalLink className="w-4 h-4" />
      </button>
    </div>
  );
}
