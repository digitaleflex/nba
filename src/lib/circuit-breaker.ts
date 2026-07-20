/**
 * Lightweight circuit breaker for external API calls.
 *
 * States:
 *  - CLOSED: normal operation, failures are counted
 *  - OPEN: too many failures, all calls short-circuit immediately
 *  - HALF_OPEN: cooldown expired, allow one probe call
 *
 * Usage:
 *   const breaker = createCircuitBreaker("resend", { threshold: 5, cooldownMs: 60_000 })
 *   await breaker.execute(() => resend.emails.send(...))
 */

export interface CircuitBreakerOptions {
  /** Number of consecutive failures before opening the circuit */
  threshold?: number
  /** How long the circuit stays open (ms) before half-open */
  cooldownMs?: number
}

interface CircuitState {
  failures: number
  state: "closed" | "open" | "half-open"
  openedAt: number
}

const circuits = new Map<string, CircuitState>()

export function createCircuitBreaker(name: string, opts?: CircuitBreakerOptions) {
  const threshold = opts?.threshold ?? 5
  const cooldownMs = opts?.cooldownMs ?? 60_000

  function get(): CircuitState {
    if (!circuits.has(name)) {
      circuits.set(name, { failures: 0, state: "closed", openedAt: 0 })
    }
    const s = circuits.get(name)!

    // Transition OPEN → HALF_OPEN if cooldown elapsed
    if (s.state === "open" && Date.now() - s.openedAt >= cooldownMs) {
      s.state = "half-open"
    }

    return s
  }

  function onSuccess() {
    const s = get()
    s.failures = 0
    s.state = "closed"
  }

  function onFailure() {
    const s = get()
    s.failures++
    if (s.failures >= threshold) {
      s.state = "open"
      s.openedAt = Date.now()
      console.warn(`[circuit:${name}] OPEN after ${s.failures} consecutive failures`)
    }
  }

  async function execute<T>(fn: () => Promise<T>): Promise<T> {
    const s = get()
    if (s.state === "open") {
      throw new CircuitOpenError(name)
    }

    try {
      const result = await fn()
      onSuccess()
      return result
    } catch (err) {
      onFailure()
      throw err
    }
  }

  function getState() {
    return get().state
  }

  function reset() {
    const s = get()
    s.failures = 0
    s.state = "closed"
    s.openedAt = 0
  }

  return { execute, getState, reset }
}

export class CircuitOpenError extends Error {
  constructor(name: string) {
    super(`[circuit:${name}] Circuit is OPEN — call short-circuited`)
    this.name = "CircuitOpenError"
  }
}

/**
 * Execute a function with an AbortController timeout.
 * Throws AbortError if the timeout is exceeded.
 */
export function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return fn(controller.signal).finally(() => clearTimeout(timer))
}
