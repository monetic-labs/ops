import { CardLimitFrequency } from "@backpack-fux/pylon-sdk";
import { Controller, UseFormReturn } from "react-hook-form";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { DollarSign, Clock } from "lucide-react";
import { z } from "zod";

import { CreateCardSchema } from "@/validations/card";

interface CardLimitsStepProps {
  form: UseFormReturn<z.infer<typeof CreateCardSchema>>;
}

const LIMIT_FREQUENCIES = [
  { value: CardLimitFrequency.DAY, label: "Daily" },
  { value: CardLimitFrequency.WEEK, label: "Weekly" },
  { value: CardLimitFrequency.MONTH, label: "Monthly" },
];

export function CardLimitsStep({ form }: CardLimitsStepProps) {
  const {
    control,
    register,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-6">
      {/* Spending Limit Section */}
      <div className="flex gap-4">
        <Input
          isRequired
          className="w-1/2"
          label="Card Limit"
          placeholder="5000"
          startContent={<DollarSign className="text-foreground/50 w-4 h-4 pointer-events-none flex-shrink-0" />}
          type="number"
          {...register("limitAmount", { valueAsNumber: true })}
          errorMessage={errors.limitAmount?.message}
          isInvalid={!!errors.limitAmount}
        />

        <Controller
          control={control}
          name="limitFrequency"
          render={({ field }) => (
            <Select
              isRequired
              className="w-1/2"
              errorMessage={errors.limitFrequency?.message}
              isInvalid={!!errors.limitFrequency}
              label="Limit Cycle"
              placeholder="Select cycle"
              selectedKeys={field.value ? [field.value] : []}
              startContent={<Clock className="text-foreground/50 w-4 h-4 pointer-events-none flex-shrink-0" />}
              onChange={field.onChange}
            >
              {LIMIT_FREQUENCIES.map((frequency) => (
                <SelectItem key={frequency.value} textValue={frequency.label}>
                  {frequency.label}
                </SelectItem>
              ))}
            </Select>
          )}
        />
      </div>
    </div>
  );
}
