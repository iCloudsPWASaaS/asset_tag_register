import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const signupSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
  fullName: z.string().trim().min(2, "Enter your name."),
  companyName: z.string().trim().optional().default(""),
  phone: z.string().trim().optional().default(""),
});

export const assetInputSchema = z.object({
  premisesId: z.string().trim().optional(),
  premisesName: z.string().trim().min(1, "Choose or add a premises."),
  premisesAddress: z.string().trim().optional().default(""),
  location: z.string().trim().min(1, "Add a location within the premises."),
  type: z.string().trim().min(1, "Add an asset type."),
  make: z.string().trim().min(1, "Add the manufacturer."),
  model: z.string().trim().optional().default(""),
  serialNumber: z.string().trim().optional().default(""),
  notes: z.string().trim().optional().default(""),
  engineer: z.string().trim().optional().default(""),
  installedAt: z.string().trim().optional().default(""),
  photoPath: z.string().trim().optional().default(""),
  photoContentType: z.string().trim().optional().default(""),
  status: z.enum(["active", "archived", "removed"]).optional().default("active"),
  aiExtracted: z.boolean().optional().default(false),
});

export const assetUpdateSchema = assetInputSchema.partial();

export const premisesInputSchema = z.object({
  name: z.string().trim().min(1, "Add a premises name."),
  addressLine1: z.string().trim().optional().default(""),
  addressLine2: z.string().trim().optional().default(""),
  addressLine3: z.string().trim().optional().default(""),
  postcode: z.string().trim().optional().default(""),
  placeId: z.string().trim().optional(),
  notes: z.string().trim().optional().default(""),
});

export const manualSchema = z.object({
  make: z.string().trim().optional().default(""),
  model: z.string().trim().optional().default(""),
  type: z.string().trim().optional().default(""),
  serialNumber: z.string().trim().optional().default(""),
});
