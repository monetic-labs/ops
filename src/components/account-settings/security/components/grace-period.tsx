"use client";

import { Card, CardBody } from "@nextui-org/card";
import { Select, SelectItem } from "@nextui-org/select";
import { Timer } from "lucide-react";
import { Chip } from "@nextui-org/chip";
import { GRACE_PERIOD_OPTIONS } from "../constants";

type GracePeriodProps = {
  selectedGracePeriod: string;
  onGracePeriodChange: (value: string) => void;
};

export const GracePeriod = ({ selectedGracePeriod, onGracePeriodChange }: GracePeriodProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Timer className="w-5 h-5 text-primary" />
        <h4 className="text-lg font-medium">Grace Period</h4>
      </div>

      <Card className="bg-[#141414] border-[#1a1a1a]">
        <CardBody className="p-4 space-y-4">
          <p className="text-sm text-gray-400">
            The grace period adds a timelock to recovery attempts, allowing you to detect and stop any unauthorized
            recovery attempts.
          </p>

          <Select
            label="Select Grace Period"
            selectedKeys={[selectedGracePeriod]}
            onChange={(e) => onGracePeriodChange(e.target.value)}
            classNames={{
              trigger: "p-3",
            }}
          >
            {GRACE_PERIOD_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value} textValue={option.label}>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span>{option.label}</span>
                    {option.isRecommended && (
                      <Chip size="sm" color="primary" variant="flat" className="ml-2">
                        Recommended
                      </Chip>
                    )}
                  </div>
                  <span className="text-tiny text-default-400">{option.description}</span>
                </div>
              </SelectItem>
            ))}
          </Select>
        </CardBody>
      </Card>
    </div>
  );
};
