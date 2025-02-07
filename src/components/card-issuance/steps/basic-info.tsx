import { Input } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import { CardType } from "@backpack-fux/pylon-sdk";
import { CreditCard, Mail, User } from "lucide-react";
import { Controller, UseFormReturn } from "react-hook-form";
import { z } from "zod";

import { CreateCardSchema } from "@/validations/card";

interface BasicInfoStepProps {
  form: UseFormReturn<z.infer<typeof CreateCardSchema>>;
}

const CARD_TYPES = [
  { value: CardType.VIRTUAL, label: "Virtual" },
  { value: CardType.PHYSICAL, label: "Physical" },
];

export function BasicInfoStep({ form }: BasicInfoStepProps) {
  const {
    control,
    register,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-6">
      {/* Card Type & Name Section */}
      <div className="space-y-4">
        <Controller
          control={control}
          name="cardType"
          render={({ field }) => (
            <Select
              {...field}
              label="Card Type"
              placeholder="Select a card type"
              className="w-full"
              startContent={<CreditCard className="text-foreground/50 w-4 h-4 pointer-events-none flex-shrink-0" />}
              errorMessage={errors.cardType?.message}
              isInvalid={!!errors.cardType}
            >
              {CARD_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </Select>
          )}
        />

        <Input
          {...register("displayName")}
          label="Card Name"
          placeholder="Marketing Team Card"
          className="w-full"
          startContent={<CreditCard className="text-foreground/50 w-4 h-4 pointer-events-none flex-shrink-0" />}
          errorMessage={errors.displayName?.message}
          isInvalid={!!errors.displayName}
        />
      </div>

      {/* Card Owner Section */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <Input
            {...register("ownerFirstName")}
            label="First Name"
            placeholder="John"
            className="w-1/2"
            startContent={<User className="text-foreground/50 w-4 h-4 pointer-events-none flex-shrink-0" />}
            errorMessage={errors.ownerFirstName?.message}
            isInvalid={!!errors.ownerFirstName}
          />

          <Input
            {...register("ownerLastName")}
            label="Last Name"
            placeholder="Smith"
            className="w-1/2"
            startContent={<User className="text-foreground/50 w-4 h-4 pointer-events-none flex-shrink-0" />}
            errorMessage={errors.ownerLastName?.message}
            isInvalid={!!errors.ownerLastName}
          />
        </div>

        <Input
          {...register("ownerEmail")}
          type="email"
          label="Email"
          placeholder="john.smith@company.com"
          className="w-full"
          startContent={<Mail className="text-foreground/50 w-4 h-4 pointer-events-none flex-shrink-0" />}
          errorMessage={errors.ownerEmail?.message}
          isInvalid={!!errors.ownerEmail}
        />
      </div>
    </div>
  );
}
