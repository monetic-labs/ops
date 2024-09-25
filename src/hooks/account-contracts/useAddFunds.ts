import { useState } from 'react';
import useAccountContracts from './useAccountContracts';

interface AddFundsParams {
  network: string;
  token: string;
  amount: number;
}

export default function useAddFunds() {
  const { available, updateAvailable, refetchAccountData } = useAccountContracts();
  const [isAddingFunds, setIsAddingFunds] = useState(false);

  const addFunds = async ({ network, token, amount }: AddFundsParams) => {
    setIsAddingFunds(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update the available balance
      const newAvailable = available + amount;
      updateAvailable(newAvailable);

      // Refetch all account data to ensure everything is up to date
      await refetchAccountData();

      console.log(`Added ${amount} ${token} on ${network}`);
      return true;
    } catch (error) {
      console.error('Error adding funds:', error);
      return false;
    } finally {
      setIsAddingFunds(false);
    }
  };

  return {
    addFunds,
    isAddingFunds,
    currentBalance: available,
  };
}