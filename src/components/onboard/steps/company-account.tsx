"use client";

import { useFormContext, Controller } from "react-hook-form";
import { useMemo, useState, useEffect } from "react";
import { Select, SelectItem } from "@heroui/select";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { CardCompanyType, NAICS_SECTORS, NAICS_CODES, getNAICSSector } from "@backpack-fux/pylon-sdk";
import { Input } from "@heroui/input";
import { Building2, Hash, Receipt, Briefcase, ChevronRight } from "lucide-react";

import { formatCompanyType, formatEIN } from "@/utils/helpers";

import { FormField } from "../form-fields";

export const CompanyAccountStep = () => {
  const {
    formState: { errors },
    control,
    watch,
    setValue,
  } = useFormContext();

  const companyType = watch("companyType");
  const companyIndustry = watch("companyIndustry");

  // State for the selected sector
  const [selectedSector, setSelectedSector] = useState<string>(() => {
    // If we already have a companyIndustry, set the sector from it
    if (companyIndustry) {
      // Handle special sector cases
      const code = companyIndustry.substring(0, 2);
      if (code >= "31" && code <= "33") return "31-33";
      if (code >= "44" && code <= "45") return "44-45";
      if (code >= "48" && code <= "49") return "48-49";

      // Regular case
      return code;
    }
    return "";
  });

  // Format NAICS sectors for the dropdown
  const formattedSectors = useMemo(() => {
    return Object.entries(NAICS_SECTORS).map(([code, description]) => ({
      code,
      description,
      display: `${code} - ${description}`,
    }));
  }, []);

  // Format NAICS codes filtered by the selected sector
  const filteredNaicsCodes = useMemo(() => {
    if (!selectedSector) return [];

    return Object.entries(NAICS_CODES)
      .filter(([code]) => {
        // Special case handling for ranges
        if (selectedSector === "31-33") {
          return code.startsWith("31") || code.startsWith("32") || code.startsWith("33");
        }
        if (selectedSector === "44-45") {
          return code.startsWith("44") || code.startsWith("45");
        }
        if (selectedSector === "48-49") {
          return code.startsWith("48") || code.startsWith("49");
        }

        // Regular case
        return code.startsWith(selectedSector);
      })
      .map(([code, description]) => ({
        code,
        description,
        display: `${code} - ${description}`,
        sectorCode: selectedSector,
      }));
  }, [selectedSector]);

  // Handle sector selection
  const handleSectorChange = (sectorCode: string) => {
    setSelectedSector(sectorCode);
    // Clear the industry code if sector changes
    setValue("companyIndustry", "");
  };

  return (
    <div className="mb-8 space-y-6">
      <div className="space-y-4">
        <FormField
          errorMessage={errors?.companyRegistrationNumber?.message?.toString()}
          isInvalid={!!errors?.companyRegistrationNumber}
          label="Company Registration Number"
          maxLength={12}
          name="companyRegistrationNumber"
          placeholder="1234567"
          startContent={<Hash className="text-foreground/40 w-4 h-4 flex-shrink-0" />}
        />
        <FormField
          errorMessage={errors?.companyTaxId?.message?.toString()}
          isInvalid={!!errors?.companyTaxId}
          label="Company Tax ID"
          maxLength={10}
          name="companyTaxId"
          placeholder="12-3456789"
          startContent={<Receipt className="text-foreground/40 w-4 h-4 flex-shrink-0" />}
          value={watch("companyTaxId") ? formatEIN(watch("companyTaxId")) : ""}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            if (digits.length <= 9) {
              setValue("companyTaxId", digits);
            }
          }}
        />
        <Controller
          control={control}
          name="companyType"
          render={({ field, fieldState: { error } }) => (
            <Select
              {...field}
              fullWidth
              errorMessage={error?.message}
              isInvalid={!!error}
              label="Company Type"
              placeholder="Select Company Type"
              selectedKeys={companyType ? [companyType] : []}
              startContent={<Building2 className="text-foreground/40 w-4 h-4 flex-shrink-0" />}
              onChange={(e) => field.onChange(e.target.value)}
            >
              {Object.values(CardCompanyType).map((type) => (
                <SelectItem key={type} textValue={formatCompanyType(type)}>
                  {formatCompanyType(type)}
                </SelectItem>
              ))}
            </Select>
          )}
        />

        {/* Industry Sector Selection */}
        <Select
          isRequired
          isInvalid={!selectedSector}
          errorMessage={!selectedSector ? "Industry sector is required" : undefined}
          label="Industry Sector"
          placeholder="Select your industry sector first"
          selectedKeys={selectedSector ? [selectedSector] : []}
          startContent={<Briefcase className="text-foreground/40 w-4 h-4 flex-shrink-0" />}
          onChange={(e) => handleSectorChange(e.target.value)}
        >
          {formattedSectors.map((sector) => (
            <SelectItem key={sector.code} textValue={sector.display}>
              {sector.display}
            </SelectItem>
          ))}
        </Select>

        {/* NAICS Code Selection (only shown after sector is selected) */}
        {selectedSector && (
          <Controller
            control={control}
            name="companyIndustry"
            render={({ field, fieldState: { error } }) => (
              <Select
                {...field}
                isRequired
                errorMessage={error?.message}
                isInvalid={!!error}
                label="Industry (NAICS Code)"
                placeholder="Select specific industry code"
                selectedKeys={companyIndustry ? [companyIndustry] : []}
                startContent={<ChevronRight className="text-foreground/40 w-4 h-4 flex-shrink-0" />}
                onChange={(e) => field.onChange(e.target.value)}
              >
                {filteredNaicsCodes.map((item) => (
                  <SelectItem key={item.code} textValue={item.display}>
                    {item.display}
                  </SelectItem>
                ))}
              </Select>
            )}
          />
        )}

        <FormField
          errorMessage={errors?.companyDescription?.message?.toString()}
          isInvalid={!!errors?.companyDescription}
          label="Company Description"
          maxLength={100}
          name="companyDescription"
          placeholder="Describe your company"
        />
      </div>
    </div>
  );
};
