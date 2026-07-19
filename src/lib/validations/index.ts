import { z } from "zod"

export const documentTypeSchema = z.enum(["ID_CARD", "PASSPORT", "DRIVERS_LICENSE"])

export const accessStatusSchema = z.enum(["APPROVED", "REJECTED", "SUSPENDED", "REVOKED"])

export const verificationStatusSchema = z.enum(["APPROVED", "REJECTED"])

export const profileSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100).optional(),
  phone: z.string().max(30).optional(),
  whatsapp: z.string().max(30).optional(),
  country: z.string().max(100).optional(),
  language: z.string().max(10).optional(),
  timezone: z.string().max(50).optional(),
})

export const notificationPrefsSchema = z.object({
  sound: z.string().max(30).optional(),
  prefs: z.record(z.string(), z.boolean()).optional(),
  quietHours: z.object({
    start: z.string(),
    end: z.string(),
  }).nullable().optional(),
})

export const selectPlanSchema = z.object({
  planId: z.string().uuid("ID de plan invalide"),
})

export const messageContentSchema = z.object({
  content: z.string().trim().min(1, "Le message ne peut pas être vide").max(5000, "Message trop long"),
})

export const messageAttachmentSchema = z.object({
  url: z.string().min(1, "URL de pièce jointe requise"),
  mime: z.string().min(1, "Type de fichier requis"),
  name: z.string().max(255).optional(),
  size: z.number().int().nonnegative().optional(),
})

export const messageSendSchema = z
  .object({
    type: z.enum(["TEXT", "VIDEO", "IMAGE"]).optional().default("TEXT"),
    content: z.string().trim().max(5000, "Message trop long").optional().default(""),
    attachment: messageAttachmentSchema.optional(),
    quotedMessageId: z.string().uuid("ID de message cité invalide").optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type === "VIDEO") {
      if (!val.attachment) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Vidéo requise", path: ["attachment"] })
      } else if (!val.attachment.mime.startsWith("video/")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Seules les vidéos sont autorisées",
          path: ["attachment", "mime"],
        })
      }
    } else if (val.type === "IMAGE") {
      if (!val.attachment) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Image requise", path: ["attachment"] })
      } else if (!val.attachment.mime.startsWith("image/")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Seules les images sont autorisées",
          path: ["attachment", "mime"],
        })
      }
    } else if ((val.content ?? "").length === 0 && !val.attachment) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Le message ne peut pas être vide", path: ["content"] })
    }
  })

export const messageEditSchema = z.object({
  content: z.string().trim().min(1, "Le message ne peut pas être vide").max(5000, "Message trop long"),
})

export const messageDeleteSchema = z.object({
  forEveryone: z.boolean().optional().default(false),
})

export const messageReactionSchema = z.object({
  emoji: z.string().min(1).max(8).nullable(),
})

export const messageReportSchema = z.object({
  reason: z.string().trim().min(3, "Motif trop court").max(500, "Motif trop long"),
})

export const startMessageSchema = z.object({
  memberId: z.string().uuid("ID de membre invalide"),
  content: z.string().trim().min(1, "Le message ne peut pas être vide").max(5000, "Message trop long"),
})

export const startMessageMemberSchema = z
  .object({
    adminId: z.string().uuid("ID d'admin invalide"),
  })
  .and(messageSendSchema)

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
