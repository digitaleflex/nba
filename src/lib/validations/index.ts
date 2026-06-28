import { z } from "zod"

export const documentTypeSchema = z.enum(["ID_CARD", "PASSPORT", "DRIVERS_LICENSE"])

export const accessStatusSchema = z.enum(["APPROVED", "REJECTED", "SUSPENDED", "REVOKED"])

export const verificationStatusSchema = z.enum(["APPROVED", "REJECTED"])

export const profileSchema = z.object({
  country: z.string().min(2, "Le pays est requis"),
  language: z.string().min(2, "La langue est requise"),
  timezone: z.string().min(1, "Le fuseau horaire est requis"),
})

export const selectPlanSchema = z.object({
  planId: z.string().uuid("ID de plan invalide"),
})

export const reviewAccessSchema = z.object({
  status: accessStatusSchema,
  notes: z.string().optional(),
})

export const reviewDocumentSchema = z.object({
  status: verificationStatusSchema,
  notes: z.string().optional(),
})

export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message).join(", ")
    throw new ValidationError(messages)
  }
  return result.data
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ValidationError"
  }
}
