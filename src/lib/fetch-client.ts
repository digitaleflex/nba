const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504])

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

function shouldRetry(status: number): boolean {
  return RETRYABLE_STATUSES.has(status)
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const BASE_DELAY = 1000
const MAX_RETRIES = 3

export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  let lastError: unknown

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, options)

      if (res.ok) return res

      if (attempt < MAX_RETRIES && shouldRetry(res.status)) {
        const backoff = BASE_DELAY * Math.pow(2, attempt) + Math.random() * 500
        await delay(backoff)
        continue
      }

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
    } catch (err) {
      if (err instanceof FetchError) throw err

      lastError = err

      if (attempt < MAX_RETRIES) {
        const backoff = BASE_DELAY * Math.pow(2, attempt) + Math.random() * 500
        await delay(backoff)
      }
    }
  }

  // Convertir les erreurs réseau (TypeError) en FetchError lisible
  if (lastError && !(lastError instanceof FetchError)) {
    const message = lastError instanceof TypeError
      ? "Impossible de contacter le serveur. Vérifiez votre connexion."
      : "Une erreur inattendue est survenue."
    throw new FetchError(message, 0)
  }

  throw lastError
}

export async function apiFetchWithRetry(url: string, options?: RequestInit): Promise<Response> {
  return apiFetch(url, options)
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof FetchError) {
    return err.errorId ? `${err.message} (${err.errorId})` : err.message
  }
  if (err instanceof Error) return err.message
  return "Une erreur inattendue est survenue."
}
