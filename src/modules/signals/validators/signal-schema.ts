import { z } from "zod"

export const signalCreateSchema = z.object({
  content: z.string().min(1, "Le contenu du signal est requis"),
  imageUrl: z.string().nullable().optional(),
  planIds: z.array(z.string().uuid("ID de groupe invalide")).min(1, "Veuillez sélectionner au moins un groupe de diffusion"),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
})

export type SignalCreateInput = z.infer<typeof signalCreateSchema>
