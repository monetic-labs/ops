"use client";

import { Card, CardBody } from "@nextui-org/card";
import { Select, SelectItem } from "@nextui-org/select";
import { LucideIcon } from "lucide-react";
import { Chip } from "@nextui-org/chip";

type TimeOption = {
  label: string;
  value: string;
  description: string;
  isRecommended?: boolean;
};

type TimeSettingCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  options: TimeOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  isComingSoon?: boolean;
};

export const TimeSettingCard = ({
  title,
  description,
  icon: Icon,
  options,
  selectedValue,
  onValueChange,
  isComingSoon = false,
}: TimeSettingCardProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-teal-500/10 rounded-lg">
            <Icon className="w-5 h-5 text-teal-500" />
          </div>
          <h4 className="text-lg font-medium">{title}</h4>
        </div>
        {isComingSoon && (
          <Chip className="bg-content3 text-foreground/60" size="sm" variant="flat">
            Coming Soon
          </Chip>
        )}
      </div>

      <Card className={`bg-content2 border-divider ${isComingSoon ? "opacity-60" : ""}`}>
        <CardBody className="p-4 space-y-4">
          <p className="text-sm text-foreground/60">{description}</p>

          <Select
            isDisabled={isComingSoon}
            classNames={{
              trigger: "p-3",
              value: "text-foreground",
              label: "text-foreground/60",
              base: "bg-content2",
            }}
            label={`Select ${title}`}
            selectedKeys={[selectedValue]}
            onChange={(e) => onValueChange(e.target.value)}
          >
            {options.map((option) => (
              <SelectItem key={option.value} textValue={option.label} value={option.value}>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span>{option.label}</span>
                    {option.isRecommended && (
                      <Chip className="ml-2 bg-teal-500/10 text-teal-500" size="sm" variant="flat">
                        Recommended
                      </Chip>
                    )}
                  </div>
                  <span className="text-tiny text-foreground/40">{option.description}</span>
                </div>
              </SelectItem>
            ))}
          </Select>
        </CardBody>
      </Card>
    </div>
  );
};
