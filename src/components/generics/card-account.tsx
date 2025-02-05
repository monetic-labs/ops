import { Button } from "@nextui-org/button";
import { Card, CardBody } from "@nextui-org/card";
import { Tooltip } from "@nextui-org/tooltip";
import { InfoIcon, ArrowUpRight, ArrowDownRight, PlusCircle } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface BaseCardProps {
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  comingSoon?: boolean;
  isHoverable?: boolean;
  className?: string;
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
      <button
        aria-label={`Fund card for ${props.title}`}
        className={`w-full text-left cursor-pointer ${props.className || ""}`}
        disabled={props.disabled}
        onClick={props.onClick}
      >
        <Card className="bg-charyo-500/60">
          <CardBody>
            <div className="flex items-center">
              <h3 className="text-lg font-semibold">{props.title}</h3>
              <Tooltip content={props.description} placement="top">
                <InfoIcon className="ml-2 text-default-500" size={16} />
              </Tooltip>
            </div>
            <h4 className="text-2xl font-bold my-2">
              {props.isLoading ? "Loading..." : `$${props.amount.toFixed(2)}`}
            </h4>
          </CardBody>
        </Card>
      </button>
    );
  }

  if (props.variant === "overview") {
    const baseClasses = `p-3 rounded-lg transition-all duration-200 ${
      props.isTotal
        ? "col-span-2 md:col-span-1 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10"
        : props.trendColor === "success"
          ? "bg-success/5 border border-success/10"
          : props.trendColor === "danger"
            ? "bg-danger/5 border border-danger/10"
            : "bg-default-100/5 border border-default/10"
    } ${props.className || ""}`;

    const hoverClasses = props.isHoverable
      ? props.trendColor === "success"
        ? "hover:bg-success/10 hover:border-success/20 cursor-pointer"
        : props.trendColor === "danger"
          ? "hover:bg-danger/10 hover:border-danger/20 cursor-pointer"
          : "hover:bg-default-200/10 hover:border-default/20 cursor-pointer"
      : "";

    return props.onClick ? (
      <button
        aria-label={`Overview card for ${props.title}`}
        className={`${baseClasses} ${hoverClasses} w-full text-left`}
        disabled={props.disabled}
        onClick={props.onClick}
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
      </button>
    ) : (
      <div className={baseClasses}>
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

  if (props.variant === "account") {
    const Icon = props.icon;

    if (props.isCreateAccount) {
      return (
        <Button
          aria-label="Create new account"
          className={`w-full h-full p-4 rounded-lg transition-all duration-300 ease-in-out relative group border border-dashed ${
            props.disabled
              ? "border-white/5 bg-[#1A1A1A]/30 !cursor-not-allowed !hover:bg-[#1A1A1A]/30"
              : "border-white/10 bg-[#1A1A1A]/30 hover:bg-[#1A1A1A]/50 hover:border-white/20 cursor-pointer"
          } ${props.className || ""}`}
          disableAnimation={props.disabled}
          disableRipple={props.disabled}
          disabled={props.disabled}
          onClick={props.onClick}
        >
          <div className="h-full flex flex-col items-center justify-center">
            <Icon className={`w-6 h-6 ${props.disabled ? "text-white/40" : "text-white/60"} mb-2`} />
            <span className={`text-sm ${props.disabled ? "text-white/40" : "text-white/60"}`}>Create account</span>
          </div>
          {props.comingSoon && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out rounded-lg backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <PlusCircle className="w-6 h-6 text-white/80" />
                <span className="text-sm font-medium text-white/90">Coming Soon</span>
              </div>
            </div>
          )}
        </Button>
      );
    }

    return (
      <Button
        aria-label={`${props.name} account`}
        className={`w-full h-full p-4 rounded-lg transition-all duration-300 ease-in-out relative group ${
          props.disabled
            ? "border border-white/5 bg-[#1A1A1A]/30 hover:bg-[#1A1A1A]/40"
            : "border border-white/10 bg-[#1A1A1A] hover:bg-[#1A1A1A]/80 cursor-pointer"
        } ${props.className || ""}`}
        disabled={props.disabled}
        onClick={props.onClick}
      >
        <div className="h-full flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Icon
              className={`w-5 h-5 ${
                props.disabled ? "text-white/40 group-hover:text-white/60" : "text-white/80"
              } transition-colors duration-300 ease-in-out`}
            />
            <span
              className={`text-sm font-medium ${
                props.disabled ? "text-white/40 group-hover:text-white/60" : "text-white/80"
              } transition-colors duration-300 ease-in-out`}
            >
              {props.name}
            </span>
          </div>

          {/* Content */}
          <div
            className={`${props.disabled ? "opacity-40 group-hover:opacity-60" : ""} transition-all duration-300 ease-in-out`}
          >
            <p className="text-2xl font-bold text-white mb-1">${props.balance?.toLocaleString() ?? "0"}</p>
            <p
              className={`text-sm ${
                props.disabled ? "text-white/40 group-hover:text-white/60" : "text-white/60"
              } transition-colors duration-300 ease-in-out`}
            >
              {props.currency}
            </p>
          </div>
        </div>

        {props.comingSoon && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out rounded-lg backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <PlusCircle className="w-6 h-6 text-white/80" />
              <span className="text-sm font-medium text-white/90">Coming Soon</span>
            </div>
          </div>
        )}
      </Button>
    );
  }

  return null;
}

// For backward compatibility
export const FundCard = (props: Omit<FundCardProps, "variant">) => <AccountCard {...props} variant="fund" />;
