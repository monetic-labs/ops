import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { CardType } from "@monetic-labs/sdk";
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
              className="w-full"
              errorMessage={errors.cardType?.message}
              isInvalid={!!errors.cardType}
              label="Card Type"
              placeholder="Select a card type"
              startContent={<CreditCard className="text-foreground/50 w-4 h-4 pointer-events-none flex-shrink-0" />}
            >
              {CARD_TYPES.map((type) => (
                <SelectItem key={type.value} textValue={type.label}>
                  {type.label}
                </SelectItem>
              ))}
            </Select>
          )}
        />

        <Input
          {...register("displayName")}
          className="w-full"
          errorMessage={errors.displayName?.message}
          isInvalid={!!errors.displayName}
          label="Card Name"
          placeholder="Marketing Team Card"
          startContent={<CreditCard className="text-foreground/50 w-4 h-4 pointer-events-none flex-shrink-0" />}
        />
      </div>

      {/* Card Owner Section */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <Input
            {...register("ownerFirstName")}
            className="w-1/2"
            errorMessage={errors.ownerFirstName?.message}
            isInvalid={!!errors.ownerFirstName}
            label="First Name"
            placeholder="John"
            startContent={<User className="text-foreground/50 w-4 h-4 pointer-events-none flex-shrink-0" />}
          />

          <Input
            {...register("ownerLastName")}
            className="w-1/2"
            errorMessage={errors.ownerLastName?.message}
            isInvalid={!!errors.ownerLastName}
            label="Last Name"
            placeholder="Smith"
            startContent={<User className="text-foreground/50 w-4 h-4 pointer-events-none flex-shrink-0" />}
          />
        </div>

        <Input
          {...register("ownerEmail")}
          className="w-full"
          errorMessage={errors.ownerEmail?.message}
          isInvalid={!!errors.ownerEmail}
          label="Email"
          placeholder="john.smith@company.com"
          startContent={<Mail className="text-foreground/50 w-4 h-4 pointer-events-none flex-shrink-0" />}
          type="email"
        />
      </div>
    </div>
  );
}
