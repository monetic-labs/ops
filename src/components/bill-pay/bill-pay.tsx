import { useEffect, useState } from "react";
import { Tabs, Tab } from "@nextui-org/tabs";
import Contacts from "./contacts-tab";
import Transfers from "./transfers-tab";
import { billPayConfig, BillPayId } from "@/config/tabs";
import { Button } from "@nextui-org/button";
import CreateBillPayModal from "./bill-actions/create";
import { modal } from "@/context/reown";
import { useAppKitAccount, useDisconnect } from "@reown/appkit/react";
import { Spinner } from "@nextui-org/spinner";
import { Modal } from "@nextui-org/modal";
import { QRCodeSVG } from "qrcode.react";
import { custom, encodeFunctionData, erc20Abi } from "viem";
import { baseSepolia } from "viem/chains";
import "viem/window";

export default function BillPayTabs() {
  const [selectedService, setSelectedService] = useState<string>(billPayConfig[0].id);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoadingModalOpen, setIsLoadingModalOpen] = useState(false);
  const [qrCodeUri, setQrCodeUri] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const { isConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();

  const renderTabContent = (tabId: string) => {
    switch (tabId) {
      case BillPayId.TRANSFERS:
        return <Transfers />;
      case BillPayId.CONTACTS:
        return <Contacts />;
      default:
        return <div>Tab content not found</div>;
    }
  };

  useEffect(() => {
    console.log("Is connected?:", isConnected);

    const getWalletInfo = async () => {
      const wcProvider = await modal.universalAdapter?.getWalletConnectProvider();
      console.log("Wallet connect provider:", wcProvider);
      wcProvider?.on("display_uri", (handleURI: any) => {
        console.log("Display URI:", handleURI);
      });
      const accounts = await wcProvider?.enable();
      console.log("Accounts:", accounts);
      const accounts2 = await wcProvider?.request({ method: "eth_requestAccounts" });
      console.log("Accounts2:", accounts2);

      console.log("Session:", wcProvider?.session);

      // const personalSignResult = await wcProvider?.request(
      //   {
      //     method: "personal_sign",
      //     params: [
      //       "0x5369676E2074686973206D65737361676520666F72206261636B7061636B",
      //       "0x1d85568eEAbad713fBB5293B45ea066e552A90De",
      //     ],
      //   },
      //   "eip155:42161"
      // );
      // console.log("Personal sign result:", personalSignResult);

      const transferData = encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: ["0x595ec62736Bf19445d7F00D66072B3a3c7aeA0F5", BigInt(1)],
      });

      console.log("Transfer data:", transferData);

      const account = accounts?.[0];
      const transactionParameters = {
        from: account, // The sender's address
        to: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // The USDC contract address
        data: transferData,
      };

      console.log("Transaction parameters:", transactionParameters);

      const transactionResult = await wcProvider?.request(
        {
          method: "eth_sendTransaction",
          params: [transactionParameters],
        },
        "eip155:84532"
      );
      console.log("Transaction result:", transactionResult);
    };

    if (isConnected) {
      setIsCreateModalOpen(true);
      const provider = modal.getWalletProvider();
      console.log("Wallet provider:", provider);
      getWalletInfo();
    }

    if (!isConnected) {
      setIsCreateModalOpen(false);
    }
  }, [isConnected]);

  const handleConnect = async () => {
    if (!isConnected) {
      await modal.open();
    } else {
      setIsCreateModalOpen(true);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <Tabs
          aria-label="Bill Pay options"
          classNames={{
            base: "w-full overflow-x-auto sm:overflow-x-viseible",
            tabList: "bg-charyo-500/60 backdrop-blur-sm border-none",
            tab: "flex-grow sm:flex-grow-0",
            tabContent: "text-notpurple-500/60",
          }}
          selectedKey={selectedService}
          onSelectionChange={(key) => setSelectedService(key as string)}
        >
          {billPayConfig.map((tab) => (
            <Tab key={tab.id} title={tab.label} />
          ))}
        </Tabs>
        <Button color="default" onPress={handleConnect}>
          Create Transfer
        </Button>
      </div>
      <div className="mt-4">{renderTabContent(selectedService)}</div>
      <CreateBillPayModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={(newBillPay) => {
          console.log("Creating bill pay:", newBillPay);
          // setIsCreateModalOpen(false);
        }}
      />
      {isLoadingModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col items-center gap-4">
            <Spinner size="lg" color="white" />
            <span className="text-white">Connecting to your wallet...</span>
          </div>
        </div>
      )}
      {qrCodeUri && (
        <Modal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)}>
          <QRCodeSVG value={qrCodeUri} />
        </Modal>
      )}
    </div>
  );
}
