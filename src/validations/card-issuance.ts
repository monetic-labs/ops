// create dummy schema for card issuance
import { z } from "zod";
import { emailSchema } from "./auth";

export const cardIssuanceSchema = z.object({
  card: z.object({
    name: z.string().min(1).max(255),
    email: emailSchema,
  }),
});

export type CardIssuanceSchema = z.infer<typeof cardIssuanceSchema>;