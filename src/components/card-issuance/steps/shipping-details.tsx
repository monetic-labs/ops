import { UseFormReturn } from "react-hook-form";
import { Input } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import { MapPin, Phone } from "lucide-react";
import { z } from "zod";
import { CreateCardSchema } from "@/validations/card";
import { getRegionsForCountry } from "@/data";

interface ShippingDetailsStepProps {
  form: UseFormReturn<z.infer<typeof CreateCardSchema>>;
}

const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
];

interface Region {
  value: string;
  label: string;
}

export function ShippingDetailsStep({ form }: ShippingDetailsStepProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = form;

  const shipping = watch("shipping");
  const regions = shipping?.country ? getRegionsForCountry(shipping.country) : [];

  return (
    <div className="space-y-6">
      {/* Street Address Section */}
      <div className="space-y-4">
        <Input
          {...register("shipping.street1")}
          label="Address Line 1"
          placeholder="123 Main Street"
          className="w-full"
          startContent={<MapPin className="text-foreground/50 w-4 h-4 pointer-events-none flex-shrink-0" />}
          errorMessage={errors.shipping?.street1?.message}
          isInvalid={!!errors.shipping?.street1}
        />

        <Input
          {...register("shipping.street2")}
          label="Address Line 2"
          placeholder="Suite 100 (optional)"
          className="w-full"
          startContent={<MapPin className="text-foreground/50 w-4 h-4 pointer-events-none flex-shrink-0" />}
          errorMessage={errors.shipping?.street2?.message}
          isInvalid={!!errors.shipping?.street2}
        />
      </div>

      {/* Location Section */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <Input
            {...register("shipping.city")}
            label="City"
            placeholder="San Francisco"
            className="w-1/2"
            startContent={<MapPin className="text-foreground/50 w-4 h-4 pointer-events-none flex-shrink-0" />}
            errorMessage={errors.shipping?.city?.message}
            isInvalid={!!errors.shipping?.city}
          />

          <Input
            {...register("shipping.postalCode")}
            label="Postal Code"
            placeholder="94105"
            className="w-1/2"
            startContent={<MapPin className="text-foreground/50 w-4 h-4 pointer-events-none flex-shrink-0" />}
            errorMessage={errors.shipping?.postalCode?.message}
            isInvalid={!!errors.shipping?.postalCode}
          />
        </div>

        <div className="flex gap-4">
          <Select
            {...register("shipping.country")}
            label="Country"
            placeholder="Select a country"
            className="w-1/2"
            startContent={<MapPin className="text-foreground/50 w-4 h-4 pointer-events-none flex-shrink-0" />}
            errorMessage={errors.shipping?.country?.message}
            isInvalid={!!errors.shipping?.country}
          >
            {COUNTRIES.map((country) => (
              <SelectItem key={country.value} value={country.value}>
                {country.label}
              </SelectItem>
            ))}
          </Select>

          <Select
            {...register("shipping.region")}
            label="Region"
            placeholder="Select a region"
            className="w-1/2"
            startContent={<MapPin className="text-foreground/50 w-4 h-4 pointer-events-none flex-shrink-0" />}
            errorMessage={errors.shipping?.region?.message}
            isInvalid={!!errors.shipping?.region}
          >
            {regions.map((region: Region) => (
              <SelectItem key={region.value} value={region.value}>
                {region.label}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {/* Contact Section */}
      <Input
        {...register("shipping.phoneNumber")}
        type="tel"
        label="Phone Number"
        placeholder="(555) 123-4567"
        className="w-full"
        startContent={<Phone className="text-foreground/50 w-4 h-4 pointer-events-none flex-shrink-0" />}
        errorMessage={errors.shipping?.phoneNumber?.message}
        isInvalid={!!errors.shipping?.phoneNumber}
      />
    </div>
  );
}
