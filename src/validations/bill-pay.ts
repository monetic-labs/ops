// create dummy schema for bill pay
import { z } from "zod";

import { emailSchema } from "./auth";

export const billPaySchema = z.object({
  billPay: z.object({
    name: z.string().min(1).max(255),
    email: emailSchema,
  }),
});
