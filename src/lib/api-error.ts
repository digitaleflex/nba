import { NextResponse } from "next/server"
import { handleError } from "./errors/handler"

/**
 * Réponse d'erreur serveur (500) générique et rassurante.
 */
export async function serverError(error: unknown, route?: string): Promise<NextResponse> {
  return handleError(error, { route })
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
