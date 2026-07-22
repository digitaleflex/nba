import { auth } from "@nba/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

const betterHandler = toNextJsHandler(auth)

function withErrorBoundary(handler: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    try {
      return await handler(req)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal server error"
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }
  }
}

export const GET = withErrorBoundary(betterHandler.GET)
export const POST = withErrorBoundary(betterHandler.POST)
