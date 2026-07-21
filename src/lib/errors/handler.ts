import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { ZodError } from "zod"
import { Prisma } from "../../generated/prisma/client"
import { logger } from "../logger"
import { AppError, Severity } from "./app-error"
import { ErrorCode } from "./codes"

const log = logger.child({ module: "error-handler" })

export interface ErrorHandlerContext {
  route?: string
  userId?: string
}

async function getCorrelationId(): Promise<string | undefined> {
  try {
    const h = await headers()
    return h.get("x-request-id") ?? undefined
  } catch {
    return undefined
  }
}

function generateErrorId(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase()
}

interface ErrorResponseBody {
  code: string
  message: string
  errorId: string
  correlationId?: string
  details?: Record<string, unknown>
}

function buildResponse(
  status: number,
  body: ErrorResponseBody,
): NextResponse {
  return NextResponse.json(body, { status })
}

export async function handleError(
  error: unknown,
  context?: ErrorHandlerContext,
): Promise<NextResponse> {
  const correlationId = await getCorrelationId()
  const route = context?.route

  // 1. AppError (includes AuthError, ValidationError, CircuitOpenError)
  if (error instanceof AppError) {
    log.error({ errorCode: error.code, route, errorId: error.errorId }, error.message)
    return buildResponse(error.httpStatus, {
      code: error.code,
      message: error.message,
      errorId: error.errorId,
      correlationId,
      details: error.details,
    })
  }

  // 2. Prisma known request errors → map to business codes
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const errorId = generateErrorId()
    log.error({ prismaCode: error.code, route, errorId }, error.message)
    switch (error.code) {
      case "P2025":
        return buildResponse(404, {
          code: ErrorCode.NOT_FOUND,
          message: "Ressource introuvable.",
          errorId,
          correlationId,
        })
      case "P2002":
        return buildResponse(409, {
          code: ErrorCode.CONFLICT,
          message: "Ressource en conflit (contrainte unique).",
          errorId,
          correlationId,
        })
      case "P2003":
        return buildResponse(400, {
          code: ErrorCode.VALIDATION_INVALID_INPUT,
          message: "Référence invalide (clé étrangère).",
          errorId,
          correlationId,
        })
      default:
        return buildResponse(500, {
          code: ErrorCode.DATABASE_ERROR,
          message: "Une erreur de base de données est survenue.",
          errorId,
          correlationId,
        })
    }
  }

  // 3. Prisma validation error
  if (error instanceof Prisma.PrismaClientValidationError) {
    const errorId = generateErrorId()
    log.error({ route, errorId }, error.message)
    return buildResponse(400, {
      code: ErrorCode.VALIDATION_ERROR,
      message: "Requête invalide.",
      errorId,
      correlationId,
    })
  }

  // 4. Prisma initialization error (DB down)
  if (error instanceof Prisma.PrismaClientInitializationError) {
    const errorId = generateErrorId()
    log.error({ route, errorId }, error.message)
    return buildResponse(503, {
      code: ErrorCode.DATABASE_CONNECTION,
      message: "Base de données temporairement indisponible. Réessayez plus tard.",
      errorId,
      correlationId,
    })
  }

  // 5. Zod validation error
  if (error instanceof ZodError) {
    const errorId = generateErrorId()
    const details: Record<string, string[]> = {}
    for (const issue of error.issues) {
      const path = issue.path.join(".")
      if (!details[path]) details[path] = []
      details[path].push(issue.message)
    }
    log.warn({ route, errorId, issues: error.issues.length }, "Validation error")
    return buildResponse(400, {
      code: ErrorCode.VALIDATION_ERROR,
      message: "Données invalides. Vérifiez votre saisie.",
      errorId,
      correlationId,
      details,
    })
  }

  // 6. Unknown errors → 500 with errorId
  const errorId = generateErrorId()
  const message = error instanceof Error ? error.message : String(error)
  log.error({ route, errorId, err: error instanceof Error ? { message: error.message, stack: error.stack } : error }, "Unhandled error")
  return buildResponse(500, {
    code: ErrorCode.INTERNAL_ERROR,
    message: "Une erreur inattendue est survenue. L'équipe technique en a été informée. Réessayez dans quelques instants, ou contactez le support.",
    errorId,
    correlationId,
  })
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

export function toAppError(error: unknown, defaultCode: string = ErrorCode.INTERNAL_ERROR): AppError {
  if (error instanceof AppError) return error
  const message = error instanceof Error ? error.message : "Erreur inconnue"
  return new AppError({ code: defaultCode as any, message, httpStatus: 500 })
}

export function errorResponse(status: number, code: string, message: string): NextResponse {
  const errorId = generateErrorId()
  return NextResponse.json({ code, message, errorId }, { status })
}
