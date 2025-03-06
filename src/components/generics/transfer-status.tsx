import { Spinner } from "@nextui-org/spinner";
import { CheckCircle2, XCircle } from "lucide-react";
import { ReactNode, useEffect } from "react";

export enum TransferStatus {
  IDLE = "IDLE",
  PREPARING = "PREPARING",
  SIGNING = "SIGNING",
  SENDING = "SENDING",
  SENT = "SENT",
  CONFIRMING = "CONFIRMING",
  ERROR = "ERROR",
}

export const statusConfig = {
  [TransferStatus.PREPARING]: {
    text: "Preparing Transaction",
    icon: <Spinner color="primary" size="lg" />,
  },
  [TransferStatus.SIGNING]: {
    text: "Waiting for Signature",
    icon: <Spinner color="primary" size="lg" />,
  },
  [TransferStatus.SENDING]: {
    text: "Sending Transaction",
    icon: <Spinner color="primary" size="lg" />,
  },
  [TransferStatus.SENT]: {
    text: "Transaction Sent",
    icon: <CheckCircle2 className="w-8 h-8 text-success" />,
  },
  [TransferStatus.CONFIRMING]: {
    text: "Waiting for Confirmation",
    icon: <Spinner color="primary" size="lg" />,
  },
  [TransferStatus.ERROR]: {
    text: "Transaction Failed",
    icon: <XCircle className="w-8 h-8 text-danger" />,
  },
};

export interface TransferStatusViewProps {
  status: TransferStatus;
  transferDetails?: ReactNode;
  autoResetDelay?: number;
  onReset?: () => void;
  onComplete?: () => void;
}

export default function TransferStatusView({
  status,
  transferDetails,
  autoResetDelay = 3000,
  onReset,
  onComplete,
}: TransferStatusViewProps) {
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    // Auto-reset for completed or error states
    if ((status === TransferStatus.SENT || status === TransferStatus.ERROR) && autoResetDelay > 0) {
      timeoutId = setTimeout(() => {
        if (onReset) onReset();
        if (status === TransferStatus.SENT && onComplete) onComplete();
      }, autoResetDelay);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [status, autoResetDelay, onReset, onComplete]);

  if (status === TransferStatus.IDLE) return null;

  const config = statusConfig[status];

  if (!config) return null;

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6 rounded-xl bg-content2/80 border border-border shadow-md">
      {transferDetails && <div className="w-full mb-4">{transferDetails}</div>}

      <div className="flex items-center justify-center p-4">{config.icon}</div>
      <p className="text-lg font-medium text-foreground text-center">{config.text}</p>

      {(status === TransferStatus.PREPARING || status === TransferStatus.SIGNING) && (
        <p className="text-sm text-default-500 text-center max-w-sm">
          Please wait while we process your transaction. This may take a few moments.
        </p>
      )}

      {status === TransferStatus.SENDING && (
        <p className="text-sm text-default-500 text-center max-w-sm">
          Your transaction has been signed and is now being sent to the blockchain.
        </p>
      )}

      {status === TransferStatus.CONFIRMING && (
        <p className="text-sm text-default-500 text-center max-w-sm">
          Your transaction has been sent to the blockchain. Waiting for confirmation, which may take 15-30 seconds.
        </p>
      )}

      {status === TransferStatus.SENT && (
        <p className="text-sm text-default-500 text-center max-w-sm">
          Your transaction has been confirmed successfully. The window will close shortly.
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

export function TransferStatusOverlay({
  status,
  transferDetails,
  autoResetDelay,
  onReset,
  onComplete,
}: TransferStatusViewProps) {
  if (status === TransferStatus.IDLE) return null;

  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="w-full max-w-lg mx-auto">
        <TransferStatusView
          autoResetDelay={autoResetDelay}
          status={status}
          transferDetails={transferDetails}
          onComplete={onComplete}
          onReset={onReset}
        />
      </div>
    </div>
  );
}
