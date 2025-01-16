"use client";

import { Select, SelectItem } from "@nextui-org/select";
import { useFormContext } from "react-hook-form";
import { FormField } from "../form-fields";
import { CardCompanyType } from "@/validations/onboard/schemas";

export const CompanyAccountStep = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="space-y-4">
      <FormField
        label="Settlement Address"
        maxLength={42}
        name="settlementAddress"
        placeholder="0x1234567890123456789012345678901234567890"
      />
      <FormField
        label="Company Registration Number"
        maxLength={12}
        name="companyRegistrationNumber"
        placeholder="1234567"
      />
      <FormField label="Company Tax ID" maxLength={10} name="companyTaxId" placeholder="12-3456789" />
      <Select
        fullWidth
        label="Company Type"
        placeholder="Select Company Type"
        {...register("companyType")}
        errorMessage={errors.companyType?.message?.toString()}
      >
        <SelectItem key="sole_proprietorship" value={CardCompanyType.SOLE_PROPRIETORSHIP}>
          Sole Proprietorship
        </SelectItem>
        <SelectItem key="llc" value={CardCompanyType.LLC}>
          Limited Liability Company (LLC)
        </SelectItem>
        <SelectItem key="c_corp" value={CardCompanyType.C_CORP}>
          C Corporation
        </SelectItem>
        <SelectItem key="s_corp" value={CardCompanyType.S_CORP}>
          S Corporation
        </SelectItem>
        <SelectItem key="partnership" value={CardCompanyType.PARTNERSHIP}>
          Partnership
        </SelectItem>
        <SelectItem key="lp" value={CardCompanyType.LP}>
          Limited Partnership (LP)
        </SelectItem>
        <SelectItem key="llp" value={CardCompanyType.LLP}>
          Limited Liability Partnership (LLP)
        </SelectItem>
        <SelectItem key="nonprofit" value={CardCompanyType.NONPROFIT}>
          Nonprofit Corporation
        </SelectItem>
      </Select>
      <FormField
        isOptional
        label="Company Description"
        maxLength={100}
        name="companyDescription"
        placeholder="Describe your company"
      />
    </div>
  );
};
