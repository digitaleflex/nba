import { logger } from "./logger"

const log = logger.child({ module: "circuit-breaker" })

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
  /** Called when the circuit transitions from closed/half-open to open */
  onOpen?: (name: string, failures: number) => void
}

interface CircuitState {
  failures: number
  state: "closed" | "open" | "half-open"
  openedAt: number
}

const circuits = new Map<string, CircuitState>()

/**
 * Get the state of all registered circuit breakers (for monitoring).
 */
export function getAllCircuitStates(): Record<string, { state: string; failures: number }> {
  const result: Record<string, { state: string; failures: number }> = {}
  for (const [name, s] of circuits) {
    result[name] = { state: s.state, failures: s.failures }
  }
  return result
}

export function createCircuitBreaker(name: string, opts?: CircuitBreakerOptions) {
  const threshold = opts?.threshold ?? 5
  const cooldownMs = opts?.cooldownMs ?? 60_000
  const onOpen = opts?.onOpen

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
      log.warn({ name, failures: s.failures, errorCode: "SYSTEM_CIRCUIT_OPEN" }, "Circuit OPEN")
      onOpen?.(name, s.failures)
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

import { AppError } from "./errors/app-error"
import { ErrorCode } from "./errors/codes"

export class CircuitOpenError extends AppError {
  constructor(name: string) {
    super({
      code: ErrorCode.CIRCUIT_OPEN,
      message: `[circuit:${name}] Circuit is OPEN — call short-circuited`,
      httpStatus: 503,
      retryable: true,
      module: "circuit-breaker",
      details: { circuitName: name },
    })
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

// Re-export logger for consumers that import from circuit-breaker
export { logger } from "./logger"
