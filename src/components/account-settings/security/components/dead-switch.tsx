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
          <Clock className="w-5 h-5 text-primary" />
          <h4 className="text-lg font-medium">Dead Switch</h4>
        </div>
        <Chip size="sm" variant="flat" className="bg-default-100">
          Coming Soon
        </Chip>
      </div>

      <Card className="bg-[#141414] border-[#1a1a1a] opacity-60">
        <CardBody className="p-4 space-y-4">
          <p className="text-sm text-gray-400">
            Dead Switch automatically transfers account access to designated guardians after a period of inactivity.
          </p>

          <Select
            isDisabled
            label="Select Inactivity Period"
            selectedKeys={[selectedDeadSwitch]}
            onChange={(e) => onDeadSwitchChange(e.target.value)}
            classNames={{
              trigger: "p-3",
            }}
          >
            {DEAD_SWITCH_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value} textValue={option.label}>
                <div className="flex flex-col">
                  <span>{option.label}</span>
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
