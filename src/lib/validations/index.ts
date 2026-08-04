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
  name: z.string().min(1, "Le nom est requis").max(100).optional(),
  phone: z.string().max(30).optional(),
  whatsapp: z.string().max(30).optional(),
  country: z.string().max(100).optional(),
  language: z.string().max(10).optional(),
  timezone: z.string().max(50).optional(),
}).strict()

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
}).strict()

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
  planId: z.string().uuid("ID de plan invalide").optional(),
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

export const supportSchema = z.object({
  subject: z.string().trim().min(1, "Sujet requis").max(200, "Sujet trop long"),
  message: z.string().trim().min(1, "Message requis").max(5000, "Message trop long"),
})

export const bugSeveritySchema = z.enum(["low", "medium", "high"])

export const bugReportSchema = z.object({
  title: z.string().trim().min(3, "Titre trop court").max(120, "Titre trop long"),
  description: z.string().trim().min(10, "Décris le problème (min 10 caractères)").max(3000, "Description trop longue"),
  severity: bugSeveritySchema.optional(),
  steps: z.string().trim().max(2000, "Étapes trop longues").optional(),
  context: z.object({
    url: z.string().max(500).optional(),
    userAgent: z.string().max(500).optional(),
    platform: z.string().max(100).optional(),
    screen: z.string().max(100).optional(),
    language: z.string().max(50).optional(),
    timezone: z.string().max(100).optional(),
  }).strict().optional(),
}).strict()

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z.string().min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères").max(128),
})

export const changeEmailSchema = z.object({
  newEmail: z.string().email("Email invalide"),
  currentPassword: z.string().min(1, "Mot de passe requis"),
})

export const deviceVerifySchema = z.object({
  code: z.string().min(1, "Code requis"),
})

export const deviceRenameSchema = z.object({
  deviceId: z.string().min(1, "ID de périphérique requis"),
  name: z.string().min(1, "Nom requis").max(100),
})

export const deviceDeleteSchema = z.object({
  deviceId: z.string().optional(),
  revokeOthers: z.boolean().optional(),
})

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Mot de passe requis"),
})

export const memberUpdateSchema = z.object({
  userId: z.string().min(1, "ID utilisateur requis").optional(),
  userIds: z.array(z.string().min(1)).min(1).optional(),
  isActive: z.boolean().optional(),
  roleId: z.string().optional(),
  onboardingStatus: z.string().optional(),
  signalsAccessOverride: z.boolean().optional(),
  emailStatus: z.string().optional(),
})

export const memberQuerySchema = z.object({
  userId: z.string().min(1, "ID utilisateur requis"),
})

export const adminNotificationSchema = z.object({
  title: z.string().trim().min(1, "Titre requis").max(200),
  content: z.string().trim().min(1, "Contenu requis").max(5000),
  userId: z.string().uuid("ID utilisateur invalide").optional(),
})

export const banUserSchema = z.object({
  email: z.string().email("Email invalide"),
  reason: z.string().trim().min(1, "Motif requis").max(500),
})

export const unbanUserSchema = z.object({
  email: z.string().email("Email invalide"),
})

export const replayEventSchema = z.object({
  eventId: z.string().min(1, "ID d'événement requis"),
})

export const smtpSettingsSchema = z.object({
  smtpHost: z.string().optional(),
  smtpPort: z.string().optional(),
  smtpTls: z.string().optional(),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  smtpFrom: z.string().optional(),
})

export const queueRetrySchema = z.object({
  name: z.string().optional(),
})

export const verifyOtpSchema = z.object({
  code: z.string().length(6, "Le code doit contenir 6 caractères"),
})

export const pushSubscribeSchema = z.object({
  endpoint: z.string().min(1, "Endpoint requis"),
  keys: z.object({
    p256dh: z.string().min(1, "Clé p256dh requise"),
    auth: z.string().min(1, "Clé auth requise"),
  }),
  userAgent: z.string().optional(),
})

export const pushUnsubscribeSchema = z.object({
  endpoint: z.string().min(1, "Endpoint requis"),
})

export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message).join(", ")
    throw new ValidationError(messages)
  }
  return result.data
}

import { AppError } from "../errors/app-error"
import { ErrorCode } from "../errors/codes"

export class ValidationError extends AppError {
  constructor(message: string) {
    super({
      code: ErrorCode.VALIDATION_ERROR,
      message,
      httpStatus: 400,
      module: "validation",
    })
    this.name = "ValidationError"
  }
}
