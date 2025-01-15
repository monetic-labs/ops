import { Card } from "@nextui-org/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { LucideIcon } from "lucide-react";
import clsx from "clsx";
import { PressEvent } from "@react-types/shared";

import { components } from "@/styles/theme/components";

interface BaseCardProps {
  onPress?: (e: PressEvent) => void;
  disabled?: boolean;
  isLoading?: boolean;
  comingSoon?: boolean;
  isHoverable?: boolean;
}

interface AccountCardProps extends BaseCardProps {
  variant: "overview" | "account";
  title?: string;
  value?: string;
  subtitle?: string;
  trend?: "up" | "down";
  trendColor?: "success" | "danger";
  isTotal?: boolean;
  name?: string;
  icon?: LucideIcon;
  balance?: number;
  currency?: string;
  isCreateAccount?: boolean;
}

export function AccountCard({
  variant,
  title,
  value,
  subtitle,
  trend,
  trendColor,
  isTotal,
  name,
  icon: Icon,
  balance,
  currency,
  disabled,
  comingSoon,
  isCreateAccount,
  isHoverable,
  onPress,
}: AccountCardProps) {
  const getCardStyle = () => {
    if (variant === "overview") {
      if (isTotal) return "border-blue-400";
      if (title?.toLowerCase().includes("income") || (balance && balance > 0)) 
        return "border-green-400";
      if (title?.toLowerCase().includes("expense") || (balance && balance < 0)) 
        return "border-red-400";
      return "border-black/[0.08] dark:border-white/[0.08]";
    }
    return "border-black/[0.08] dark:border-white/[0.08]";
  };

  const getTextStyle = () => {
    if (variant === "overview") {
      if (isTotal) return components.card.financial.total.text;
      if (title?.toLowerCase().includes("income") || (balance && balance > 0)) 
        return components.card.financial.income.text;
      if (title?.toLowerCase().includes("expense") || (balance && balance < 0)) 
        return components.card.financial.expense.text;
      return components.card.financial.account.text;
    }
    return components.card.financial.account.text;
  };

  if (variant === "overview") {
    return (
      <Card
        isPressable={!!onPress}
        isHoverable={isHoverable}
        classNames={{
          base: clsx(
            "bg-content1 p-6 transition-all duration-200",
            getCardStyle(),
            "border-2",
          ),
        }}
        onPress={onPress}
      >
        <div className="space-y-2">
          <p className={components.card.financial.account.label}>{title}</p>
          <p className={clsx("text-2xl font-semibold", getTextStyle())}>{value}</p>
          {subtitle && (
            <div className="flex items-center gap-1.5">
              <p className="text-sm text-black/40 dark:text-white/40">{subtitle}</p>
              {trend && (
                trend === "up" ? (
                  <ArrowUpRight className={clsx("w-4 h-4", getTextStyle())} />
                ) : (
                  <ArrowDownRight className={clsx("w-4 h-4", getTextStyle())} />
                )
              )}
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card
      isPressable={!disabled && !!onPress}
      isHoverable={isHoverable}
      classNames={{
        base: clsx(
          "bg-content1 p-6 transition-all duration-200",
          getCardStyle(),
          disabled && components.card.financial.account.disabled
        ),
      }}
      onPress={!disabled ? onPress : undefined}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon size={20} className={components.card.financial.account.label} />}
          <span className="font-medium">{name}</span>
          {comingSoon && (
            <span className="text-xs text-black/40 dark:text-white/40 ml-auto">Coming soon</span>
          )}
        </div>
        {!isCreateAccount && (
          <div className="space-y-1">
            <p className={clsx("text-2xl font-semibold", getTextStyle())}>
              ${balance?.toLocaleString()}
            </p>
            <p className={components.card.financial.account.label}>{currency}</p>
          </div>
        )}
      </div>
    </Card>
  );
}

