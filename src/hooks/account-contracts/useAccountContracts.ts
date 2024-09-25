import { useState, useEffect, useCallback } from 'react';

interface ContractBalance {
  id: string;
  network: string;
  token: string;
  balance: number;
}

interface AccountData {
  available: number;
  pending: number;
  spent: number;
  contractBalances: ContractBalance[];
}

export default function useAccountContracts() {
    const [accountData, setAccountData] = useState<AccountData>({
        available: 0,
        pending: 0,
        spent: 0,
        contractBalances: []
    });
    const [isLoading, setIsLoading] = useState(true);

    const fetchAccountData = useCallback(async () => {
        setIsLoading(true);
        // Mocked data
        const mockedData: AccountData = {
            available: 5000,
            pending: 2000,
            spent: 5000,
            contractBalances: [
                { id: "1", network: "Ethereum", token: "USDC", balance: 1000 },
                { id: "2", network: "Ethereum", token: "DAI", balance: 500 },
                { id: "3", network: "Polygon", token: "USDC", balance: 2000 },
                { id: "4", network: "Arbitrum", token: "USDT", balance: 1500 },
            ]
        };

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        setAccountData(mockedData);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchAccountData();
    }, [fetchAccountData]);

    const updateContractBalance = useCallback((id: string, newBalance: number) => {
        setAccountData(prevData => ({
            ...prevData,
            contractBalances: prevData.contractBalances.map(balance =>
                balance.id === id ? { ...balance, balance: newBalance } : balance
            )
        }));
    }, []);

    const updateAvailable = useCallback((newAvailable: number) => {
        setAccountData(prevData => ({ ...prevData, available: newAvailable }));
    }, []);

    const updatePending = useCallback((newPending: number) => {
        setAccountData(prevData => ({ ...prevData, pending: newPending }));
    }, []);

    const updateSpent = useCallback((newSpent: number) => {
        setAccountData(prevData => ({ ...prevData, spent: newSpent }));
    }, []);

    const totalLocked = accountData.available + accountData.pending + accountData.spent;

    return {
        ...accountData,
        isLoading,
        totalLocked,
        updateContractBalance,
        updateAvailable,
        updatePending,
        updateSpent,
        refetchAccountData: fetchAccountData,
    };
}