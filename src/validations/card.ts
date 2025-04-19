import { z } from "zod";
import { CardType, CardLimitFrequency, CardShippingMethod } from "@monetic-labs/sdk";

export const CardBasicInfoSchema = z.object({
  displayName: z.string().min(3, "Card name must be at least 3 characters"),
  ownerFirstName: z.string().min(2, "First name must be at least 2 characters"),
  ownerLastName: z.string().min(2, "Last name must be at least 2 characters"),
  ownerEmail: z.string().email("Please enter a valid email"),
  cardType: z.nativeEnum(CardType),
});

export const CardLimitsSchema = z.object({
  limitAmount: z.number().min(1, "Limit amount must be greater than 0"),
  limitFrequency: z.nativeEnum(CardLimitFrequency),
});

export const CardShippingSchema = z.object({
  street1: z.string().min(1, "Address is required"),
  street2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  region: z.string().min(1, "Region is required"),
  phoneNumber: z.string().regex(/^[0-9]+$/, "Please enter a valid phone number"),
  phoneCountryCode: z.string().regex(/^[0-9]{1,3}$/, "Please enter a valid country code"),
  shippingMethod: z.nativeEnum(CardShippingMethod),
});

// Combined schema for the entire form
export const CreateCardSchema = CardBasicInfoSchema.merge(CardLimitsSchema).merge(
  z.object({
    shipping: CardShippingSchema.optional(),
  })
);
