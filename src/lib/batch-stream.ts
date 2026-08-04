/**
 * SSE streaming helper for batch operations.
 *
 * Server: enqueue progress events during batch processing.
 * Client: read the stream to get real-time progress updates.
 */

export interface BatchProgress {
  succeeded: number
  failed: number
  total: number
  step: string
}

export interface BatchDone {
  done: true
  result: {
    total: number
    succeeded: number
    skipped: number
    failed: number
    errors?: { id: string; error: string }[]
  }
}

export type BatchEvent =
  | { type: "progress"; data: BatchProgress }
  | { type: "done"; data: BatchDone }
  | { type: "error"; data: { message: string } }

export function createBatchStream() {
  let controller: ReadableStreamDefaultController<Uint8Array>

  const stream = new ReadableStream({
    start(c) {
      controller = c
    },
  })

  const encoder = new TextEncoder()

  function progress(data: BatchProgress) {
    try {
      controller.enqueue(encoder.encode(`data:${JSON.stringify({ type: "progress", data })}\n\n`))
    } catch {}
  }

  function done(result: BatchDone["result"]) {
    try {
      controller.enqueue(encoder.encode(`data:${JSON.stringify({ type: "done", data: { done: true, result } })}\n\n`))
      controller.close()
    } catch {}
  }

  function error(msg: string) {
    try {
      controller.enqueue(encoder.encode(`data:${JSON.stringify({ type: "error", data: { message: msg } })}\n\n`))
      controller.close()
    } catch {}
  }

  return { stream, progress, done, error }
}

/**
 * Client-side: read an SSE stream from a fetch response and call callbacks.
 */
export async function readBatchStream(
  response: Response,
  callbacks: {
    onProgress?: (data: BatchProgress) => void
    onDone?: (result: BatchDone["result"]) => void
    onError?: (message: string) => void
  }
) {
  if (!response.ok || !response.body) {
    const data = await response.json().catch(() => ({}))
    callbacks.onError?.(data.error || `Erreur ${response.status}`)
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        if (!line.startsWith("data:")) continue
        try {
          const raw = JSON.parse(line.slice(5)) as BatchEvent
          if (raw.type === "progress") {
            callbacks.onProgress?.(raw.data)
          } else if (raw.type === "done") {
            callbacks.onDone?.(raw.data.result)
            return
          } else if (raw.type === "error") {
            callbacks.onError?.(raw.data.message || "Erreur inconnue")
            return
          }
        } catch {}
      }
    }
  } catch {
    callbacks.onError?.("Connexion interrompue")
  }
}
