import { describe, it, expect } from "vitest"
import { parseSimpleMarkdown } from "./utils"

describe("parseSimpleMarkdown", () => {
  it("returns empty string when input is falsy", () => {
    expect(parseSimpleMarkdown("")).toBe("")
    expect(parseSimpleMarkdown(undefined as any)).toBe("")
  })

  it("escapes basic HTML entities to prevent XSS", () => {
    const input = '<script>alert("XSS")</script> & hello'
    const result = parseSimpleMarkdown(input)
    expect(result).not.toContain("<script>")
    expect(result).toContain("&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt; &amp; hello")
  })

  it("formats bold text using double asterisks", () => {
    const input = "This is **bold** text"
    const result = parseSimpleMarkdown(input)
    expect(result).toContain("This is <strong>bold</strong> text")
  })

  it("formats italic text using single asterisk", () => {
    const input = "This is *italic* text"
    const result = parseSimpleMarkdown(input)
    expect(result).toContain("This is <em>italic</em> text")
  })

  it("formats both bold and italic text together", () => {
    const input = "Make it **bold** and *italic*"
    const result = parseSimpleMarkdown(input)
    expect(result).toContain("<strong>bold</strong>")
    expect(result).toContain("<em>italic</em>")
  })

  it("converts bullet list items into styled bullet points", () => {
    const input = "- First item\n* Second item"
    const result = parseSimpleMarkdown(input)
    expect(result).toContain("&bull; First item")
    expect(result).toContain("&bull; Second item")
    expect(result).toContain("margin:4px 0 4px 16px")
  })

  it("converts standard carriage breaks to br tags", () => {
    const input = "Line one\nLine two"
    const result = parseSimpleMarkdown(input)
    expect(result).toBe("Line one<br/>Line two")
  })
})
