import { createHash, randomBytes } from "crypto"

// Ne jamais utiliser un secret par défaut connu en production.
// Priorité : CAPTCHA_SECRET dédié, sinon dérivé de BETTER_AUTH_SECRET
// (stable entre instances), sinon secret éphémère (dev/test).
const configuredSecret = process.env.CAPTCHA_SECRET?.trim()
const authSecret = process.env.BETTER_AUTH_SECRET?.trim()
const CAPTCHA_SECRET =
  configuredSecret ||
  (authSecret
    ? createHash("sha256").update(`${authSecret}:captcha`).digest("hex")
    : randomBytes(32).toString("hex"))
if (!configuredSecret) {
  console.warn(
    authSecret
      ? "[captcha] CAPTCHA_SECRET non configuré — secret dérivé de BETTER_AUTH_SECRET. Définissez un CAPTCHA_SECRET dédié."
      : "[captcha] CAPTCHA_SECRET non configuré — secret éphémère utilisé. Définissez CAPTCHA_SECRET (openssl rand -hex 32) en production.",
  )
}
const CAPTCHA_TTL = 5 * 60 * 1000

function simpleHash(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 12)
}

export function generateCaptcha(): { question: string; token: string; expected: number } {
  const a = Math.floor(Math.random() * 10) + 1
  const b = Math.floor(Math.random() * 10) + 1
  const op = Math.random() > 0.5 ? "+" : "×"
  const answer = op === "+" ? a + b : a * b
  const question = `${a} ${op} ${b} = ?`
  const timestamp = Date.now()
  // Nonce aléatoire : deux captchas générés dans la même milliseconde ne
  // produisent jamais le même token.
  const nonce = randomBytes(4).toString("hex")
  const token =
    simpleHash(`${answer}:${CAPTCHA_SECRET}:${timestamp}:${nonce}`) +
    timestamp.toString(36) +
    nonce
  return { question, token, expected: answer }
}

export function verifyCaptcha(token: string, answer: number): boolean {
  try {
    // Format : hash(12) + timestampBase36 + nonce(8)
    const hash = token.slice(0, 12)
    const nonce = token.slice(-8)
    const tsBase36 = token.slice(12, -8)
    const timestamp = parseInt(tsBase36, 36)
    if (!Number.isFinite(timestamp)) return false
    if (Date.now() - timestamp > CAPTCHA_TTL) return false
    const expectedHash = simpleHash(
      `${answer}:${CAPTCHA_SECRET}:${timestamp}:${nonce}`,
    )
    return hash === expectedHash
  } catch {
    return false
  }
}
