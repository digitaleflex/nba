import { z } from "zod"
import { NextResponse } from "next/server"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function validateId(id: string): { valid: true } | { valid: false; response: NextResponse } {
  if (!UUID_REGEX.test(id)) {
    return {
      valid: false,
      response: NextResponse.json({ error: "ID invalide" }, { status: 400 }),
    }
  }
  return { valid: true }
}

export const documentTypeSchema = z.enum(["ID_CARD", "PASSPORT", "DRIVERS_LICENSE"])

export const accessStatusSchema = z.enum(["APPROVED", "REJECTED", "SUSPENDED", "REVOKED"])

export const verificationStatusSchema = z.enum(["APPROVED", "REJECTED"])

export const profileSchema = z.object({
  country: z.string().min(2, "Le pays est requis"),
  language: z.string().min(2, "La langue est requise"),
  timezone: z.string().min(1, "Le fuseau horaire est requis"),
}).strict()

export const selectPlanSchema = z.object({
  planId: z.string().uuid("ID de plan invalide"),
}).strict()

export const reviewAccessSchema = z.object({
  status: accessStatusSchema,
  notes: z.string().optional(),
}).strict()

export const dashboardProfileSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().max(50).optional(),
  whatsapp: z.string().max(50).optional(),
  country: z.string().max(100).optional(),
  language: z.string().max(50).optional(),
  timezone: z.string().max(100).optional(),
}).strict()

export const reviewDocumentSchema = z.object({
  status: verificationStatusSchema,
  notes: z.string().optional(),
}).strict()

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
