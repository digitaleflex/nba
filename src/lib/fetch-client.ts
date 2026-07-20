interface ApiErrorBody {
  error?: string
  errorId?: string
}

export class FetchError extends Error {
  public errorId: string | undefined
  public status: number

  constructor(message: string, status: number, errorId?: string) {
    super(message)
    this.name = "FetchError"
    this.status = status
    this.errorId = errorId
  }
}

export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, options)

  if (!res.ok) {
    let errorId: string | undefined
    let message = "Une erreur est survenue. Réessayez ou contactez le support."

    try {
      const body = (await res.json()) as ApiErrorBody
      if (body.errorId) errorId = body.errorId
      if (body.error) message = body.error
    } catch {
      // réponse non JSON, garder le message par défaut
    }

    throw new FetchError(message, res.status, errorId)
  }

  return res
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof FetchError && err.errorId) {
    return `${err.message} (${err.errorId})`
  }
  if (err instanceof Error) return err.message
  return "Une erreur inattendue est survenue."
}
