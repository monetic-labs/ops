import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import { ModalBody, ModalFooter } from "@nextui-org/modal";
import { XIcon, DollarSign, Calendar, CreditCard, Lock } from "lucide-react";
import { Controller, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { CardLimitFrequency, CardStatus } from "@backpack-fux/pylon-sdk";

import { limitCyclesObject, limitStatesObject, UpateCardSchema } from "@/data";

import { FormInput } from "../generics/form-input";

interface CardEditProps {
  form: UseFormReturn<z.input<typeof UpateCardSchema>>;
  cardName: string;
  onCancel: () => void;
  onSubmit: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export default function CardEdit({ form, cardName, onCancel, onSubmit, isLoading, error }: CardEditProps) {
  const {
    control,
    formState: { errors },
  } = form;

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-divider">
        <h3 className="text-xl font-normal text-foreground">Edit Card - {cardName}</h3>
        <Button
          isIconOnly
          className="text-foreground/60 hover:text-foreground transition-colors"
          variant="light"
          onClick={onCancel}
        >
          <XIcon size={18} />
        </Button>
      </div>
      <ModalBody className="p-6">
        <Input
          isDisabled
          label="Card Name"
          startContent={<CreditCard className="text-foreground/50 w-4 h-4 pointer-events-none flex-shrink-0" />}
          value={cardName}
        />

        <FormInput
          control={control}
          data-testid="card-limitAmount"
          errorMessage={errors.limitAmount?.message}
          label="Limit amount"
          min={1}
          name="limitAmount"
          placeholder="Enter limit amount"
          startContent={<DollarSign className="text-foreground/50 w-4 h-4 pointer-events-none flex-shrink-0" />}
          type="number"
        />

        <Controller
          control={control}
          name="limitFrequency"
          render={({ field, formState: { errors } }) => (
            <div>
              <Select
                data-testid="card-limitFrequency"
                label="Card limit cycle"
                placeholder="Select card limit cycle"
                startContent={<Calendar className="text-foreground/50 w-4 h-4 pointer-events-none flex-shrink-0" />}
                value={field.value}
                onChange={field.onChange}
              >
                {limitCyclesObject.map((t) => (
                  <SelectItem key={t.value} data-testid={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </Select>
              {errors.limitFrequency?.message && (
                <p className="mt-1 text-sm text-danger">{errors.limitFrequency?.message}</p>
              )}
            </div>
          )}
        />

        <Controller
          control={control}
          name="status"
          render={({ field, formState: { errors } }) => (
            <div>
              <Select
                data-testid="card-status"
                label="Status"
                placeholder="Select status"
                startContent={<Lock className="text-foreground/50 w-4 h-4 pointer-events-none flex-shrink-0" />}
                value={field.value}
                onChange={field.onChange}
              >
                {limitStatesObject.map((t) => (
                  <SelectItem key={t.value} data-testid={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </Select>
              {errors.status?.message && <p className="mt-1 text-sm text-danger">{errors.status?.message}</p>}
            </div>
          )}
        />
        {error && <p className="text-danger">{error}</p>}
      </ModalBody>
      <ModalFooter className="px-6 py-4 border-t border-divider">
        <div className="flex justify-end gap-3 w-full">
          <Button className="bg-content2 text-foreground hover:bg-content3" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="bg-primary text-primary-foreground"
            isDisabled={isLoading}
            isLoading={isLoading}
            onClick={onSubmit}
          >
            Save Changes
          </Button>
        </div>
      </ModalFooter>
    </>
  );
}
