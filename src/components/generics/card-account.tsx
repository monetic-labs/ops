import { Button } from "@nextui-org/button";
import { LucideIcon } from "lucide-react";

interface AccountCardProps {
  variant: "account";
  name: string;
  icon: LucideIcon;
  balance?: number;
  currency?: string;
  isCreateAccount?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  comingSoon?: boolean;
  isHoverable?: boolean;
  className?: string;
  iconClassName?: string;
}

export function AccountCard(props: AccountCardProps) {
  const Icon = props.icon;

  const getBaseCardClasses = () => {
    const disabledClasses = props.disabled
      ? "border-default-200/50 bg-default-100/50 dark:border-default-200/30"
      : "border-default-300 bg-default-100/80 hover:bg-default-200/50";

    return `w-full h-full p-4 rounded-lg transition-all duration-300 relative group border ${disabledClasses} ${props.className || ""}`;
  };

  const getIconClasses = (size: number) => {
    if (props.iconClassName) return `w-${size} h-${size} ${props.iconClassName}`;

    return `w-${size} h-${size} ${props.disabled ? "text-foreground/40" : "text-primary"}`;
  };

  const renderComingSoonOverlay = () => {
    if (!props.comingSoon) return null;

    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background/90 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg backdrop-blur-sm">
        <span className="text-sm font-medium text-foreground">Coming Soon</span>
      </div>
    );
  };

  const renderBalance = () => {
    if (typeof props.balance !== "number") return null;

    return (
      <div className="flex flex-col items-start w-full">
        <p className={`text-lg font-semibold ${props.disabled ? "text-default-400" : "text-foreground"}`}>
          ${props.balance.toLocaleString()}
        </p>
        {props.currency && (
          <p className={`text-xs ${props.disabled ? "text-default-400" : "text-default-500"}`}>{props.currency}</p>
        )}
      </div>
    );
  };

  switch (true) {
    case props.isCreateAccount:
      return (
        <Button
          aria-label="Create new account"
          className={`${getBaseCardClasses()} border-dashed`}
          disableAnimation={props.disabled}
          disableRipple={props.disabled}
          disabled={props.disabled}
          onClick={props.onClick}
        >
          <div className="h-full w-full flex flex-col items-center justify-center">
            <Icon className={`${getIconClasses(6)} mb-2`} />
            <span className={`text-sm ${props.disabled ? "text-default-400" : "text-default-600"}`}>
              Create account
            </span>
          </div>
          {renderComingSoonOverlay()}
        </Button>
      );

    default:
      return (
        <Button
          aria-label={`${props.name} account`}
          className={getBaseCardClasses()}
          disabled={props.disabled}
          onClick={props.onClick}
        >
          <div className="h-full w-full flex flex-col items-start justify-between">
            <div className="flex items-center gap-2">
              <Icon className={getIconClasses(5)} />
              <span className={`text-sm ${props.disabled ? "text-default-400" : "text-default-600"}`}>
                {props.name}
              </span>
            </div>
            {renderBalance()}
          </div>
          {renderComingSoonOverlay()}
        </Button>
      );
  }
}
