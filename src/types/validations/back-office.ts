// create dummy schema for back office
import { z } from "zod";

import { emailSchema } from "./auth";

export const backOfficeSchema = z.object({
  backOffice: z.object({
    name: z.string().min(1).max(255),
    email: emailSchema,
  }),
});
