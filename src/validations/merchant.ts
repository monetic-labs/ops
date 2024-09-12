import { z } from "zod";

import {
  companyInfoSchema,
  companyRepresentativeSchema,
  complianceSchema,
  walletAddressSchema,
} from "@/validations/onboard";

export const merchantCreateSchema = z.object({
  walletAddress: walletAddressSchema.shape.walletAddress.optional(),
  company: companyInfoSchema.shape.company,
  representatives: z.array(companyRepresentativeSchema.shape.representative),
  compliance: complianceSchema.shape.compliance.optional(),
});

export type MerchantFormData = z.infer<typeof merchantCreateSchema>;
