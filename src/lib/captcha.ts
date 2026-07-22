import { createHash } from "crypto"

const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET ?? "nba-captcha-default-secret-change-me"
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
  const token = simpleHash(`${answer}:${CAPTCHA_SECRET}:${timestamp}`) + timestamp.toString(36)
  return { question, token, expected: answer }
}

export function verifyCaptcha(token: string, answer: number): boolean {
  try {
    const tsBase36 = token.slice(12)
    const hash = token.slice(0, 12)
    const timestamp = parseInt(tsBase36, 36)
    if (Date.now() - timestamp > CAPTCHA_TTL) return false
    const expectedHash = simpleHash(`${answer}:${CAPTCHA_SECRET}:${timestamp}`)
    return hash === expectedHash
  } catch {
    return false
  }
}
