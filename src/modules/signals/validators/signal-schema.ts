import { z } from "zod"

const safePath = z.string().regex(
  /^signals\/[a-f0-9-]{36}\.(jpg|jpeg|png|webp)$/i,
  "Chemin d'image invalide"
)

export const signalCreateSchema = z.object({
  content: z.string().min(1, "Le contenu du signal est requis"),
  imageUrl: safePath.nullable().optional(),
  imageUrls: z.array(safePath).max(5, "Maximum 5 images autorisées").optional().default([]),
  suggestedStopLoss: z.number().positive().optional(),
  suggestedTakeProfit: z.number().positive().optional(),
  planIds: z.array(z.string().uuid("ID de groupe invalide")).min(1, "Veuillez sélectionner au moins un groupe de diffusion"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  scheduledAt: z.string().datetime("Format ISO requis (ex: 2026-07-20T14:00:00Z)").nullable().optional(),
})

export const signalUpdateSchema = signalCreateSchema.partial()

export type SignalCreateInput = z.infer<typeof signalCreateSchema>

export const signalTemplateSchema = z.object({
  name: z.string().min(1, "Le nom du modèle est requis"),
  content: z.string().min(1, "Le contenu du modèle est requis"),
})

export type SignalTemplateInput = z.infer<typeof signalTemplateSchema>
