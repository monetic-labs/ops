import { useState } from "react";
import {
  Address,
  BridgeAddress,
  DisbursementMethod,
  FiatCurrency,
  MerchantDisbursementCreateOutput,
  Network,
  StableCurrency,
} from "@backpack-fux/pylon-sdk";
import pylon from "@/libs/pylon-sdk";

export const useNewDisbursement = () => {
  const [disbursement, setDisbursement] = useState<MerchantDisbursementCreateOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  const createNewDisbursement = async ({
    accountOwnerName,
    bankName,
    accountNumber,
    routingNumber,
    address,
    returnAddress,
    amount,
    paymentRail,
    wireMessage,
    achReference,
  }: {
    accountOwnerName: string;
    bankName: string;
    accountNumber: string;
    routingNumber: string;
    address: BridgeAddress;
    returnAddress: string;
    amount: number;
    paymentRail: DisbursementMethod;
    wireMessage?: string;
    achReference?: string;
  }) => {
    setIsLoading(true);
    try {
      const response = await pylon.initiateNewDisbursement({
        account_owner_name: accountOwnerName,
        bank_name: bankName,
        account: {
          account_number: accountNumber,
          routing_number: routingNumber,
        },
        address,
        chain: Network.BASE, // TODO
        currency: StableCurrency.USDC, // TODO
        return_address: returnAddress,
        amount,
        destination: {
          payment_rail: paymentRail,
          currency: FiatCurrency.USD, // TODO: Make this dynamic
          wire_message: wireMessage,
          ach_reference: achReference,
        },
      });
      setDisbursement(response);
      return response;
    } catch (error) {
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return { disbursement, isLoading, error, createNewDisbursement };
};
