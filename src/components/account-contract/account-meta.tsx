"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  CreditCard,
  PiggyBank,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import useAccountContracts from "@/hooks/account-contracts/useAccountContracts";
import AddFundsModal from "@/components/account-contract/modal-add-funds";
import WithdrawFundsModal from "@/components/account-contract/modal-withdraw-funds";
import PortfolioModal from "@/components/account-contract/modal-portfolio";
import { AccountCard } from "@/components/generics/card-account";
import TransferModal from "@/components/account-contract/modal-transfer";

const accounts = [
  {
    id: "settlement",
    name: "Settlement",
    currency: "USD",
    balance: 456104.2,
    icon: Building2,
  },
  {
    id: "rain",
    name: "Rain Card",
    currency: "USD",
    balance: 31383.43,
    icon: CreditCard,
  },
  {
    id: "savings",
    name: "Savings",
    currency: "USD",
    balance: 0,
    disabled: true,
    comingSoon: true,
    icon: PiggyBank,
  },
  {
    id: "new-account",
    name: "New Account",
    currency: "USD",
    disabled: true,
    comingSoon: true,
    isCreateAccount: true,
    icon: PlusCircle,
  },
];

const CARD_WIDTH = 240; // Changed from 280
const CONTAINER_PADDING = 32;

interface BalanceOverviewProps {
  onAddFunds: () => void;
  onTransfer: () => void;
}

function BalanceOverview({ onAddFunds, onTransfer }: BalanceOverviewProps) {
  return (
    <div className="w-full p-6 space-y-6">
      <div className="w-full text-center space-y-2">
        <p className="text-white/60 text-sm">Total Balance</p>
        <h1 className="text-4xl font-bold text-white">$487,487.63</h1>
        <p className="text-white/40 text-sm">Available for use</p>
      </div>

      <div className="w-full flex justify-center gap-3">
        <Button
          className="bg-[#1A1A1A] hover:bg-[#252525] text-white border border-white/10 px-6 py-2 h-11"
          startContent={<ArrowUpRight className="w-4 h-4" />}
          onPress={onTransfer}
        >
          Send
        </Button>
        <Button
          className="bg-[#1A1A1A] hover:bg-[#252525] text-white border border-white/10 px-6 py-2 h-11"
          startContent={<ArrowDownLeft className="w-4 h-4" />}
          onPress={onAddFunds}
        >
          Receive
        </Button>
      </div>
    </div>
  );
}

interface AccountsPaginationProps {
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
}

function AccountsPagination({ currentPage, totalPages, onPrevPage, onNextPage }: AccountsPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="w-full flex items-center justify-center gap-4 pb-4">
      <Button
        isIconOnly
        className="bg-[#1A1A1A]/60 text-white/60 hover:text-white w-8 h-8 min-w-0"
        isDisabled={currentPage === 0}
        size="sm"
        variant="flat"
        onPress={onPrevPage}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }).map((_, index) => (
          <div
            key={index}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              currentPage === index ? "bg-white w-2" : "bg-white/40"
            }`}
          />
        ))}
      </div>

      <Button
        isIconOnly
        className="bg-[#1A1A1A]/60 text-white/60 hover:text-white w-8 h-8 min-w-0"
        isDisabled={currentPage === totalPages - 1}
        size="sm"
        variant="flat"
        onPress={onNextPage}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

interface AccountsGridProps {
  accounts: typeof accounts;
  currentPage: number;
  itemsPerPage: number;
  onAccountClick: () => void;
}

function AccountsGrid({ accounts, currentPage, itemsPerPage, onAccountClick }: AccountsGridProps) {
  const visibleAccounts = accounts.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  return (
    <div className="w-full h-[160px]">
      <div className="w-full py-4 h-full">
        <div className="w-full flex justify-center px-4 gap-4 h-full overflow-x-auto">
          {visibleAccounts.map((account) => (
            <div key={account.id} style={{ width: `${CARD_WIDTH}px`, flex: `0 0 ${CARD_WIDTH}px` }}>
              <AccountCard
                balance={account.balance}
                className="h-full"
                comingSoon={account.comingSoon}
                currency={account.currency}
                disabled={account.disabled}
                icon={account.icon}
                isCreateAccount={account.isCreateAccount}
                name={account.name}
                variant="account"
                onClick={() => !account.disabled && !account.isCreateAccount && onAccountClick()}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AccountOverview() {
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [isWithdrawFundsOpen, setIsWithdrawFundsOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateItemsPerPage = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth - CONTAINER_PADDING;
        const newItemsPerPage = Math.max(1, Math.floor(containerWidth / CARD_WIDTH));

        setItemsPerPage(newItemsPerPage);
        // Reset to first page if current page would be invalid with new items per page
        const newTotalPages = Math.ceil(accounts.length / newItemsPerPage);

        if (currentPage >= newTotalPages) {
          setCurrentPage(0);
        }
      }
    };

    // Initial calculation
    updateItemsPerPage();

    // Update on window resize
    const resizeObserver = new ResizeObserver(updateItemsPerPage);

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [currentPage]);

  const { available, pending, spent, isLoading } = useAccountContracts();

  const totalPages = Math.ceil(accounts.length / itemsPerPage);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(0, prev - 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));

  return (
    <Card className="w-full bg-[#1A1A1A]/90 border border-white/10 backdrop-blur-sm">
      <BalanceOverview onAddFunds={() => setIsAddFundsOpen(true)} onTransfer={() => setIsTransferOpen(true)} />

      <div ref={containerRef} className="w-full relative px-4 border-t border-white/5">
        <AccountsGrid
          accounts={accounts}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onAccountClick={() => setIsTransferOpen(true)}
        />

        <AccountsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onNextPage={handleNextPage}
          onPrevPage={handlePrevPage}
        />
      </div>

      <AddFundsModal isOpen={isAddFundsOpen} onClose={() => setIsAddFundsOpen(false)} />
      <WithdrawFundsModal isOpen={isWithdrawFundsOpen} onClose={() => setIsWithdrawFundsOpen(false)} />
      <TransferModal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} />
      <PortfolioModal isOpen={isPortfolioOpen} onClose={() => setIsPortfolioOpen(false)} />
    </Card>
  );
}
