import { describe, it, expect } from "vitest"
import { escapeHtml, sanitizeEmailSubject } from "./email"

describe("email security helpers", () => {
  it("escapeHtml neutralise les balises et les attributs", () => {
    expect(escapeHtml("<script>alert(1)</script>")).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;",
    )
    expect(escapeHtml('" onmouseover="alert(1)')).toBe(
      "&quot; onmouseover=&quot;alert(1)",
    )
    expect(escapeHtml("L'utilisateur & co")).toBe(
      "L&#39;utilisateur &amp; co",
    )
  })

  it("sanitizeEmailSubject supprime les injections d'en-têtes", () => {
    expect(sanitizeEmailSubject("Hello\r\nBcc: evil@example.com")).toBe(
      "Hello Bcc: evil@example.com",
    )
    expect(sanitizeEmailSubject("a".repeat(300)).length).toBe(180)
  })
})
