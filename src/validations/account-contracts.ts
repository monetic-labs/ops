// create dummy schema for account contracts
import { z } from "zod";
import { emailSchema } from "./auth";

export const accountContractsSchema = z.object({
  accountContracts: z.object({
    name: z.string().min(1).max(255),
    email: emailSchema,
  }),
});

export type AccountContractsSchema = z.infer<typeof accountContractsSchema>;