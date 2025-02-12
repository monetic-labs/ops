import React from "react";
import { Spinner } from "@nextui-org/spinner";
import { CheckIcon, CircleX } from "lucide-react";

export enum TransferStatus {
  IDLE = "idle",
  PREPARING = "preparing",
  WAITING = "waiting",
  SENT = "sent",
  ERROR = "error",
  SIGNING = "signing",
  PROCESSING = "processing",
}

const getTransferStatusDescription = (status: TransferStatus) => {
  switch (status) {
    case TransferStatus.PREPARING:
      return "Preparing your transfer...";
    case TransferStatus.WAITING:
      return "Please check your wallet and approve the transaction. This may take a few seconds to appear.";
    case TransferStatus.SENT:
      return "Your funds have been sent!";
    case TransferStatus.ERROR:
      return "Something went wrong. Please try again.";
    default:
      return "";
  }
};

const getTransferStatusIcon = (status: TransferStatus) => {
  switch (status) {
    case TransferStatus.SENT:
      return <CheckIcon className="text-green-500" size={32} />;
    case TransferStatus.ERROR:
      return <CircleX className="text-red-500" size={32} />;
    default:
      return <Spinner color="secondary" size="lg" />;
  }
};

export default function TransferStatusView({ status }: { status: TransferStatus }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center px-4">
      {getTransferStatusIcon(status)}
      <span className="text-white text-lg sm:text-xl">{getTransferStatusDescription(status)}</span>
    </div>
  );
}
