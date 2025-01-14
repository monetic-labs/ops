import { useState } from "react";

import useAccountContracts from "./useAccountContracts";

export default function useWithdrawal() {
  const { contractBalances, isLoading, updateContractBalance } = useAccountContracts();
  const [withdrawalInProgress, setWithdrawalInProgress] = useState(false);

  const withdrawFunds = async (amount: number, selectedBalances: string[]) => {
    setWithdrawalInProgress(true);

    // Simulate API call for withdrawal
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Calculate the amount to withdraw from each selected balance
    const selectedContracts = contractBalances.filter((contract) => selectedBalances.includes(contract.id));
    const totalSelected = selectedContracts.reduce((sum, contract) => sum + contract.balance, 0);

    selectedContracts.forEach((contract) => {
      const withdrawalAmount = (contract.balance / totalSelected) * amount;
      const newBalance = Math.max(contract.balance - withdrawalAmount, 0);

      updateContractBalance(contract.id, newBalance);
    });

    setWithdrawalInProgress(false);
  };

  const totalBalance = contractBalances.reduce((sum, contract) => sum + contract.balance, 0);

  return {
    contractBalances,
    isLoading,
    withdrawFunds,
    withdrawalInProgress,
    totalBalance,
  };
}
