import { useState } from "react";
import { Button } from "@nextui-org/button";
import { TrendingUp, Clock, Pause, Play, Plus, ExternalLink, Info } from "lucide-react";
import type { Account } from "@/types/account";

interface InvestmentPlan {
  id: string;
  asset: string;
  assetCode: string;
  assetIcon: React.ReactNode;
  amount: number;
  frequency: "Weekly" | "Bi-weekly" | "Monthly";
  nextPurchase: Date;
  active: boolean;
}

interface PortfolioAsset {
  asset: string;
  assetCode: string;
  assetIcon: React.ReactNode;
  amount: number;
  value: number;
  performance: number;
}

interface InvestmentsViewProps {
  account: Account;
  isLoading?: boolean;
  onCreateInvestmentPlan: () => void;
}

export function InvestmentsView({ account, isLoading = false, onCreateInvestmentPlan }: InvestmentsViewProps) {
  const [activePlans, setActivePlans] = useState<InvestmentPlan[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioAsset[]>([]);

  // This would come from your actual data
  const totalInvested = 0;
  const currentValue = 0;
  const percentChange = 0;

  const togglePlanStatus = (planId: string) => {
    setActivePlans(activePlans.map((plan) => (plan.id === planId ? { ...plan, active: !plan.active } : plan)));
  };

  if (isLoading) {
    return (
      <div className="mt-4 space-y-6">
        <div className="bg-content2 p-4 rounded-lg animate-pulse">
          <div className="h-6 w-48 bg-content3 rounded-md mb-4" />
          <div className="h-12 w-32 bg-content3 rounded-md mb-2" />
          <div className="h-4 w-24 bg-content3 rounded-md" />
        </div>

        <div className="space-y-2">
          <div className="h-6 w-32 bg-content2 rounded-md" />
          <div className="bg-content2 p-4 rounded-lg">
            <div className="h-12 w-full bg-content3 rounded-md" />
          </div>
          <div className="bg-content2 p-4 rounded-lg">
            <div className="h-12 w-full bg-content3 rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no investments
  if (portfolio.length === 0 && activePlans.length === 0) {
    return (
      <div className="mt-4 space-y-8">
        <div className="bg-content2 p-6 rounded-lg text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Start investing in crypto</h3>
          <p className="text-foreground/60 mb-6 max-w-md mx-auto">
            Set up recurring investments to dollar-cost average into popular cryptocurrencies over time.
          </p>
          <Button
            className="bg-primary text-primary-foreground px-6 py-5"
            onPress={onCreateInvestmentPlan}
            startContent={<Plus className="w-4 h-4" />}
          >
            Create Investment Plan
          </Button>
        </div>

        <div className="bg-content2 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <Info className="w-4 h-4 text-foreground/60 mr-2" />
            <h4 className="text-sm font-medium">What is dollar-cost averaging?</h4>
          </div>
          <p className="text-sm text-foreground/60 mb-3">
            Dollar-cost averaging is an investment strategy where you invest a fixed amount at regular intervals,
            regardless of the asset&apos;s price. This reduces the impact of volatility and helps you build wealth over
            time.
          </p>
          <Button
            variant="light"
            className="text-primary text-sm p-0 h-auto"
            endContent={<ExternalLink className="w-3 h-3 ml-1" />}
            as="a"
            href="#"
            target="_blank"
          >
            Learn more about DCA
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-6">
      {/* Portfolio Summary */}
      {portfolio.length > 0 && (
        <div className="bg-content2 p-4 md:p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Portfolio Overview</h3>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-foreground/60">Total Invested</p>
              <p className="text-2xl font-semibold">${totalInvested.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-foreground/60">Current Value</p>
              <p className="text-2xl font-semibold">${currentValue.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-foreground/60">Performance</p>
              <p className={`text-2xl font-semibold ${percentChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                {percentChange >= 0 ? "+" : ""}
                {percentChange.toFixed(2)}%
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-medium">Holdings</h4>
            {portfolio.map((asset) => (
              <div key={asset.assetCode} className="bg-content1 p-3 rounded-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-content3 flex items-center justify-center">
                    {asset.assetIcon}
                  </div>
                  <div>
                    <p className="font-medium">{asset.asset}</p>
                    <p className="text-xs text-foreground/60">{asset.assetCode}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">${asset.value.toFixed(2)}</p>
                  <p className={`text-xs ${asset.performance >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {asset.performance >= 0 ? "+" : ""}
                    {asset.performance.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Investment Plans */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">Investment Plans</h3>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground"
            onPress={onCreateInvestmentPlan}
            startContent={<Plus className="w-4 h-4" />}
          >
            New Plan
          </Button>
        </div>

        <div className="space-y-3">
          {activePlans.map((plan) => (
            <div key={plan.id} className="bg-content2 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-content3 flex items-center justify-center">
                    {plan.assetIcon}
                  </div>
                  <div>
                    <p className="font-medium">{plan.asset}</p>
                    <p className="text-xs text-foreground/60">{plan.assetCode}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="light"
                  isIconOnly
                  className={plan.active ? "text-warning" : "text-success"}
                  onPress={() => togglePlanStatus(plan.id)}
                >
                  {plan.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                <div className="bg-content1 p-3 rounded-md">
                  <p className="text-xs text-foreground/60">Amount</p>
                  <p className="font-medium">${plan.amount}</p>
                </div>
                <div className="bg-content1 p-3 rounded-md">
                  <p className="text-xs text-foreground/60">Frequency</p>
                  <p className="font-medium">{plan.frequency}</p>
                </div>
                <div className="bg-content1 p-3 rounded-md">
                  <p className="text-xs text-foreground/60 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Next Purchase
                  </p>
                  <p className="font-medium">
                    {plan.nextPurchase.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {activePlans.length === 0 && (
            <div className="bg-content2 p-6 rounded-lg text-center">
              <p className="text-foreground/60 mb-3">No active investment plans</p>
              <Button
                className="bg-primary text-primary-foreground"
                onPress={onCreateInvestmentPlan}
                startContent={<Plus className="w-4 h-4" />}
              >
                Create Investment Plan
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
