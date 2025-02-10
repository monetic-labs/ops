"use client";

import { Card, CardBody } from "@nextui-org/card";
import { Select, SelectItem } from "@nextui-org/select";
import { Clock } from "lucide-react";
import { Chip } from "@nextui-org/chip";

import { DEAD_SWITCH_OPTIONS } from "../constants";

type DeadSwitchProps = {
  selectedDeadSwitch: string;
  onDeadSwitchChange: (value: string) => void;
};

export const DeadSwitch = ({ selectedDeadSwitch, onDeadSwitchChange }: DeadSwitchProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-teal-500/10 rounded-lg">
            <Clock className="w-5 h-5 text-teal-500" />
          </div>
          <h4 className="text-lg font-medium">Dead Switch</h4>
        </div>
        <Chip className="bg-content3 text-foreground/60" size="sm" variant="flat">
          Coming Soon
        </Chip>
      </div>

      <Card className="bg-content2 border-divider opacity-60">
        <CardBody className="p-4 space-y-4">
          <p className="text-sm text-foreground/60">
            Dead Switch automatically transfers account access to designated guardians after a period of inactivity.
          </p>

          <Select
            isDisabled
            classNames={{
              trigger: "p-3",
              value: "text-foreground",
              label: "text-foreground/60",
              base: "bg-content2",
            }}
            label="Select Inactivity Period"
            selectedKeys={[selectedDeadSwitch]}
            onChange={(e) => onDeadSwitchChange(e.target.value)}
          >
            {DEAD_SWITCH_OPTIONS.map((option) => (
              <SelectItem key={option.value} textValue={option.label} value={option.value}>
                <div className="flex flex-col">
                  <span>{option.label}</span>
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
