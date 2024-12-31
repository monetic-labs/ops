import { Card, CardBody } from "@nextui-org/card";
import { Tooltip } from "@nextui-org/tooltip";
import { InfoIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface BaseCardProps {
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  comingSoon?: boolean;
}

interface FundCardProps extends BaseCardProps {
  variant: "fund";
  title: string;
  amount: number;
  description: string;
  color?: string;
}

interface AccountCardProps extends BaseCardProps {
  variant: "account";
  name: string;
  icon: LucideIcon;
  balance?: number;
  currency?: string;
  isCreateAccount?: boolean;
}

interface OverviewCardProps extends BaseCardProps {
  variant: "overview";
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendColor?: "success" | "danger" | "default";
  isTotal?: boolean;
}

type CardProps = FundCardProps | AccountCardProps | OverviewCardProps;

export function AccountCard(props: CardProps) {
  if (props.variant === "fund") {
    return (
      <div className="cursor-pointer" onClick={props.onClick}>
        <Card className="bg-charyo-500/60">
          <CardBody>
            <div className="flex items-center">
              <h3 className="text-lg font-semibold">{props.title}</h3>
              <Tooltip content={props.description} placement="top">
                <InfoIcon size={16} className="ml-2 text-default-500" />
              </Tooltip>
            </div>
            <h4 className="text-2xl font-bold my-2">
              {props.isLoading ? "Loading..." : `$${props.amount.toFixed(2)}`}
            </h4>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (props.variant === "overview") {
    return (
      <div
        className={`p-3 rounded-lg ${
          props.isTotal
            ? "col-span-2 md:col-span-1 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10"
            : props.trendColor === "success"
              ? "bg-success/5 border border-success/10"
              : props.trendColor === "danger"
                ? "bg-danger/5 border border-danger/10"
                : "bg-default-100/5 border border-default/10"
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-default-600">{props.title}</span>
          {props.trend &&
            (props.trend === "up" ? (
              <ArrowUpRight
                className={`w-3 h-3 ${
                  props.trendColor === "success"
                    ? "text-success/70"
                    : props.trendColor === "danger"
                      ? "text-danger/70"
                      : "text-default/70"
                }`}
              />
            ) : (
              <ArrowDownRight
                className={`w-3 h-3 ${
                  props.trendColor === "success"
                    ? "text-success/70"
                    : props.trendColor === "danger"
                      ? "text-danger/70"
                      : "text-default/70"
                }`}
              />
            ))}
        </div>
        <p
          className={`text-lg md:text-xl font-bold ${
            props.isTotal
              ? "text-white"
              : props.trendColor === "success"
                ? "text-success/80"
                : props.trendColor === "danger"
                  ? "text-danger/80"
                  : "text-default/80"
          }`}
        >
          {props.value}
        </p>
        {props.subtitle && <p className="text-xs text-default-500 mt-1">{props.subtitle}</p>}
      </div>
    );
  }

  const Icon = props.icon;

  return (
    <div
      className={`p-3 rounded-lg transition-all ${
        props.isCreateAccount
          ? "border border-dashed border-default-300 hover:border-primary/50"
          : "border border-default-200 bg-white/5 backdrop-blur-sm"
      } ${
        !props.disabled && !props.isCreateAccount
          ? "hover:bg-default-50 cursor-pointer"
          : props.disabled
            ? "opacity-60"
            : ""
      }`}
      onClick={props.onClick}
    >
      <div>
        <div className="flex items-center justify-between">
          {!props.isCreateAccount ? (
            <>
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-default-500" />
                <span className="text-xs text-default-600">{props.name}</span>
              </div>
            </>
          ) : (
            <div className="w-4" />
          )}
          {props.comingSoon && (
            <span className="hidden md:inline-block text-xs px-2 py-0.5 bg-default-100 rounded-full text-default-600">
              Coming soon
            </span>
          )}
        </div>
        <div className="mt-1">
          {props.isCreateAccount ? (
            <div className="flex flex-col items-center justify-center">
              <Icon className="w-6 h-6 text-default-400 hover:text-primary transition-colors" />
              <span className="text-xs text-default-500 mt-1">Create account</span>
            </div>
          ) : (
            <>
              <p className="text-lg md:text-xl font-bold">${props.balance?.toLocaleString() ?? "0"}</p>
              <p className="text-xs text-default-500">{props.currency}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// For backward compatibility
export const FundCard = (props: Omit<FundCardProps, "variant">) => <AccountCard {...props} variant="fund" />;
