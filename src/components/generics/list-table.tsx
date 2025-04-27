import React from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { PlusIcon } from "lucide-react";
import { cn } from "@/utils/cn";

interface ListItem {
  id: string | number;
  [key: string]: any; // Allow arbitrary data per item
}

export interface ListTableProps<T extends ListItem> {
  "aria-label": string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  items: T[];
  isLoading?: boolean;
  renderItem: (item: T) => {
    startContent?: React.ReactNode;
    primaryText: React.ReactNode;
    secondaryText?: React.ReactNode;
    endContent?: React.ReactNode;
  };
  onAddItem?: () => void;
  addItemLabel?: string;
  disableAddItem?: boolean;
  emptyContent?: React.ReactNode;
  cardClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  listClassName?: string;
  itemClassName?: string;
  itemHasDivider?: boolean;
}

export function ListTable<T extends ListItem>({
  title,
  description,
  icon,
  items,
  isLoading,
  renderItem,
  onAddItem,
  addItemLabel = "Add Item",
  disableAddItem = false,
  emptyContent = "No items to display.",
  cardClassName = "shadow-sm",
  headerClassName = "pb-2",
  bodyClassName = "p-0",
  listClassName = "",
  itemClassName = "block w-full",
  itemHasDivider = false,
  "aria-label": ariaLabel,
}: ListTableProps<T>) {
  const baseItemClass = cn(
    itemClassName,
    itemHasDivider && "border-b border-divider last:border-b-0",
    "px-6 pb-2 pt-1"
  );

  const listContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-20">
          <Spinner size="sm" label="Loading..." />
        </div>
      );
    }

    if (items.length === 0 && !onAddItem) {
      return typeof emptyContent === "string" ? (
        <div className={cn("text-foreground/60 italic text-center py-4 px-3")}>{emptyContent}</div>
      ) : (
        emptyContent
      );
    }

    return (
      <div role="list" aria-label={ariaLabel} className={listClassName}>
        {items.map((item) => {
          const { startContent, primaryText, secondaryText, endContent } = renderItem(item);

          return (
            <div key={item.id} role="listitem" className={baseItemClass}>
              <div className="flex items-start justify-between w-full gap-3 py-3">
                <div className="flex items-start gap-3 flex-grow min-w-0">
                  {startContent && <div className="flex-shrink-0 mt-0.5">{startContent}</div>}
                  <div className="flex-grow min-w-0">
                    {primaryText}
                    {secondaryText}
                  </div>
                </div>
                {endContent && <div className="flex items-center flex-shrink-0 ml-2">{endContent}</div>}
              </div>
            </div>
          );
        })}

        {onAddItem && (
          <div
            role="button"
            aria-disabled={disableAddItem}
            className={cn(
              "flex items-center gap-2 px-3 py-2",
              itemHasDivider && "border-t border-divider",
              "text-primary",
              !disableAddItem && "cursor-pointer hover:bg-primary/5",
              disableAddItem && "opacity-50 cursor-not-allowed"
            )}
            onClick={!disableAddItem ? onAddItem : undefined}
            tabIndex={!disableAddItem ? 0 : -1}
            onKeyDown={!disableAddItem ? (e) => (e.key === "Enter" || e.key === " ") && onAddItem() : undefined}
          >
            {disableAddItem ? <Spinner size="sm" color="primary" className="w-4 h-4" /> : <PlusIcon size={16} />}
            <span className="text-sm font-medium">{addItemLabel}</span>
          </div>
        )}

        {items.length === 0 &&
          onAddItem &&
          (typeof emptyContent === "string" ? (
            <div className={cn("text-foreground/60 italic text-center py-4 px-3")}>{emptyContent}</div>
          ) : (
            emptyContent
          ))}
      </div>
    );
  };

  return (
    <Card className={cardClassName} shadow="sm" classNames={{ base: "border border-divider" }}>
      {(title || description || icon) && (
        <CardHeader className={headerClassName}>
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-md flex-shrink-0">
                {icon}
              </div>
            )}
            <div>
              {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
              {description && <p className="text-sm text-foreground/60 mt-0.5">{description}</p>}
            </div>
          </div>
        </CardHeader>
      )}
      <CardBody className={bodyClassName}>{listContent()}</CardBody>
    </Card>
  );
}
