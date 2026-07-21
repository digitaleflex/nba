interface ApiErrorBody {
  code?: string
  error?: string
  errorId?: string
}

export class FetchError extends Error {
  public readonly code?: string
  public readonly errorId?: string
  public readonly status: number

  constructor(message: string, status: number, errorId?: string, code?: string) {
    super(message)
    this.name = "FetchError"
    this.status = status
    this.errorId = errorId
    this.code = code
  }
}

export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, options)

  if (!res.ok) {
    let errorId: string | undefined
    let code: string | undefined
    let message = "Une erreur est survenue. Réessayez ou contactez le support."

    try {
      const body = (await res.json()) as ApiErrorBody
      if (body.code) code = body.code
      if (body.errorId) errorId = body.errorId
      if (body.error) message = body.error
    } catch {
      // réponse non JSON, garder le message par défaut
    }

    throw new FetchError(message, res.status, errorId, code)
  }

  return res
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof FetchError) {
    return err.errorId ? `${err.message} (${err.errorId})` : err.message
  }
  if (err instanceof Error) return err.message
  return "Une erreur inattendue est survenue."
}
