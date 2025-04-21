import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/generics/useToast";

interface FaucetModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountAddress: string;
}

export function FaucetModal({ isOpen, onClose, accountAddress }: FaucetModalProps) {
  const { toast } = useToast();

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(accountAddress);
      toast({
        title: "Address Copied",
        description: "Account address has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy address to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleRedirect = () => {
    window.open("https://faucet.circle.com", "_blank");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} backdrop="blur">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-xl font-semibold">Request Test Funds</h3>
          <p className="text-sm text-default-500">
            Copy your account address before requesting test funds from Circle&apos;s faucet.
          </p>
        </ModalHeader>
        <ModalBody>
          <div className="flex items-center gap-2 p-3 bg-content2 rounded-lg">
            <p className="text-sm font-mono flex-1 break-all truncate">{accountAddress}</p>
            <Button isIconOnly variant="light" size="sm" onPress={handleCopyAddress} className="flex-shrink-0">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <div className="mt-4 text-sm text-default-500">
            <p>Instructions:</p>
            <ol className="list-decimal ml-4 mt-2 space-y-1">
              <li>Copy your account address above</li>
              <li>Click &quot;Continue to Faucet&quot; to open Circle&apos;s faucet</li>
              <li>Paste your address in the faucet form</li>
              <li>Complete the verification and submit</li>
            </ol>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleRedirect} endContent={<ExternalLink className="w-4 h-4" />}>
            Continue to Faucet
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
