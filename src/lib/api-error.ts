import { NextResponse } from "next/server"
import { headers } from "next/headers"

/**
 * Réponse d'erreur serveur (500) générique et rassurante.
 *
 * - Loggue l'erreur réelle côté serveur (avec le contexte `route`) pour le debug.
 * - Renvoie un message volontairement vague et rassurant au client :
 *   aucun détail technique / stack trace ne fuit vers l'utilisateur.
 * - Génère un `errorId` court pour permettre à l'utilisateur de le communiquer
 *   au support si besoin, sans exposer la cause.
 */
export async function serverError(error: unknown, route?: string): Promise<NextResponse> {
  const errorId = Math.random().toString(36).slice(2, 10).toUpperCase()
  let correlationId: string | null = null
  try {
    const h = await headers()
    correlationId = h.get("x-request-id")
  } catch { /* next/headers peut échouer selon le contexte */ }

  console.error(
    `[API 500]${route ? ` ${route}` : ""} (ref: ${errorId})${correlationId ? ` corr: ${correlationId}` : ""}`,
    error instanceof Error ? { message: error.message, stack: error.stack } : error
  )

  return NextResponse.json(
    {
      error:
        "Une erreur inattendue est survenue de notre côté. L'équipe technique en a été informée. Réessayez dans quelques instants, ou contactez le support si le problème persiste.",
      errorId,
      ...(correlationId ? { correlationId } : {}),
    },
    { status: 500 }
  )
}

/**
 * Renvoie un message utilisateur sûr à partir d'une erreur, sans fuiter
 * les détails internes. À utiliser quand on veut garder un message 500
 * mais sans exposer `error.message` brut.
 */
export function safeErrorMessage(error: unknown): string {
  if (error instanceof Error && /prisma|unique constraint|foreign key/i.test(error.message)) {
    return "Une erreur de base de données est survenue. Réessayez, ou contactez le support si cela persiste."
  }
  return "Une erreur inattendue est survenue. Réessayez dans quelques instants."
}
