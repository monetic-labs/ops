import { Spinner } from "@nextui-org/spinner";
import { CheckCircle2, XCircle } from "lucide-react";

export enum TransferStatus {
  IDLE = "IDLE",
  PREPARING = "PREPARING",
  SIGNING = "SIGNING",
  SENT = "SENT",
  ERROR = "ERROR",
}

const statusConfig = {
  [TransferStatus.PREPARING]: {
    text: "Preparing Transaction",
    icon: <Spinner color="primary" size="lg" />,
  },
  [TransferStatus.SIGNING]: {
    text: "Waiting for Signature",
    icon: <Spinner color="primary" size="lg" />,
  },
  [TransferStatus.SENT]: {
    text: "Transaction Sent",
    icon: <CheckCircle2 className="w-8 h-8 text-success" />,
  },
  [TransferStatus.ERROR]: {
    text: "Transaction Failed",
    icon: <XCircle className="w-8 h-8 text-danger" />,
  },
};

interface TransferStatusViewProps {
  status: TransferStatus;
}

export default function TransferStatusView({ status }: TransferStatusViewProps) {
  if (status === TransferStatus.IDLE) return null;

  const config = statusConfig[status];

  if (!config) return null;

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-lg bg-content1 shadow-hover">
      <div className="flex items-center justify-center">{config.icon}</div>
      <p className="text-lg font-medium text-foreground">{config.text}</p>
      {(status === TransferStatus.PREPARING || status === TransferStatus.SIGNING) && (
        <p className="text-sm text-default-500 text-center max-w-sm">
          Please wait while we process your transaction. This may take a few moments.
        </p>
      )}
      {status === TransferStatus.SENT && (
        <p className="text-sm text-default-500 text-center max-w-sm">
          Your transaction has been sent successfully. The window will close shortly.
        </p>
      )}
      {status === TransferStatus.ERROR && (
        <p className="text-sm text-danger text-center max-w-sm">
          There was an error processing your transaction. Please try again or contact support if the issue persists.
        </p>
      )}
    </div>
  );
}
