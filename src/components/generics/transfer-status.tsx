import React from "react";
import { Spinner } from "@nextui-org/spinner";

export enum TransferStatus {
  IDLE = "idle",
  PREPARING = "preparing",
  WAITING = "waiting",
  SENT = "sent",
  COMPLETED = "completed",
}

const getTransferStatusDescription = (status: TransferStatus) => {
  switch (status) {
    case TransferStatus.PREPARING:
      return "Preparing your transfer...";
    case TransferStatus.WAITING:
      return "Please check your wallet and approve the transaction.";
    case TransferStatus.SENT:
      return "Your funds have been sent!";
    case TransferStatus.COMPLETED:
      return "Transfer completed successfully!";
    default:
      return "";
  }
};

export default function TransferStatusView({ status }: { status: TransferStatus }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" color="secondary" />
        <span className="text-white">{getTransferStatusDescription(status)}</span>
      </div>
    </div>
  );
}
