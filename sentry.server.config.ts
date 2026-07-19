import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  tracesSampleRate: 1.0,

  debug: false,

  // Uncomment to filter specific errors
  // ignoreErrors: ["ResizeObserver loop limit exceeded"],

  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV === "development") {
      return null;
    }
    // Redact PII from request bodies, headers, and cookies
    const scrub = (obj: unknown) => {
      if (!obj || typeof obj !== "object") return
      const o = obj as Record<string, unknown>
      for (const key of ["password", "token", "secret", "authorization", "cookie", "email"]) {
        if (key in o) o[key] = "[REDACTED]"
      }
    }

    try {
      const original = (hint as any)?.originalException
      if (original?.cause) scrub(original.cause)
      const request = event.request
      if (request) {
        scrub(request.headers)
        scrub(request.cookies)
        // Redact email fields in request data (form body / JSON)
        if (request.data && typeof request.data === "object") {
          const data = request.data as Record<string, unknown>
          if (data.email) data.email = "[REDACTED]"
          if (data.password) data.password = "[REDACTED]"
        }
      }
    } catch { /* best-effort */ }

    return event;
  },
});
