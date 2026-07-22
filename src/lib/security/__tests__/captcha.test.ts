import { describe, it, expect } from "vitest"
import { generateCaptcha, verifyCaptcha } from "../../captcha"

describe("Captcha", () => {
  it("generates a question and token", () => {
    const captcha = generateCaptcha()
    expect(captcha.question).toMatch(/\d+ [×+] \d+ = \?/)
    expect(captcha.token).toBeTruthy()
    expect(captcha.token.length).toBeGreaterThan(12)
    expect(captcha.expected).toBeGreaterThan(0)
  })

  it("verifies correct answer", () => {
    const captcha = generateCaptcha()
    const valid = verifyCaptcha(captcha.token, captcha.expected)
    expect(valid).toBe(true)
  })

  it("rejects wrong answer", () => {
    const captcha = generateCaptcha()
    const valid = verifyCaptcha(captcha.token, captcha.expected + 1)
    expect(valid).toBe(false)
  })

  it("rejects expired token (5min)", () => {
    const captcha = generateCaptcha()
    const futureToken = captcha.token.slice(0, 12) + (Math.floor(Date.now() / 1000) - 1000).toString(36)
    const valid = verifyCaptcha(futureToken, captcha.expected)
    expect(valid).toBe(false)
  })

  it("produces different tokens each call", () => {
    const t1 = generateCaptcha()
    const t2 = generateCaptcha()
    expect(t1.token).not.toBe(t2.token)
  })

  it("handles random ops correctly", () => {
    for (let i = 0; i < 50; i++) {
      const captcha = generateCaptcha()
      expect(verifyCaptcha(captcha.token, captcha.expected)).toBe(true)
    }
  })
})
