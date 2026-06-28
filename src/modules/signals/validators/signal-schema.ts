import { z } from "zod"

export const signalCreateSchema = z.object({
  content: z.string().min(1, "Le contenu du signal est requis").max(10000),
  imageUrl: z.string().nullable().optional(),
  imageUrls: z.array(z.string()).max(5, "Maximum 5 images autorisées").optional().default([]),
  planIds: z.array(z.string().uuid("ID de groupe invalide")).min(1, "Veuillez sélectionner au moins un groupe de diffusion"),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  scheduledAt: z.string().nullable().optional(),
}).strict()

export type SignalCreateInput = z.infer<typeof signalCreateSchema>

export const signalTemplateSchema = z.object({
  name: z.string().min(1, "Le nom du modèle est requis").max(200),
  content: z.string().min(1, "Le contenu du modèle est requis").max(10000),
}).strict()

export type SignalTemplateInput = z.infer<typeof signalTemplateSchema>
