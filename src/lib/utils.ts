import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseSimpleMarkdown(text: string): string {
  if (!text) return ""
  
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")

  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>")

  html = html.split("\n").map(line => {
    const trimmed = line.trim()
    if (trimmed.startsWith("- ")) {
      return `<div style="margin:4px 0 4px 16px;color:inherit">&bull; ${trimmed.substring(2)}</div>`
    }
    if (trimmed.startsWith("* ")) {
      return `<div style="margin:4px 0 4px 16px;color:inherit">&bull; ${trimmed.substring(2)}</div>`
    }
    return line
  }).join("\n")

  html = html.replace(/\n/g, "<br/>")

  return sanitizeHtml(html)
}

const ALLOWED_TAGS = /^(strong|em|br|div|p|span|a|img|ul|ol|li|blockquote|h[1-6])$/
const ALLOWED_ATTRS = /^class|style|href|target|src|alt|width|height|loading$/
const SAFE_PROTOCOLS = /^https?:|^mailto:|^\/|^#/

export function sanitizeHtml(html: string): string {
  return html.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (tag) => {
    const isClose = tag.startsWith("</")
    const inner = tag.slice(isClose ? 2 : 1, -1)
    const space = inner.indexOf(" ")
    const tagName = (space > 0 ? inner.slice(0, space) : inner).toLowerCase()

    if (!ALLOWED_TAGS.test(tagName)) return ""

    if (isClose) return `</${tagName}>`

    let cleaned = `<${tagName}`
    const attrs = inner.slice(space + 1).match(/([a-zA-Z-]+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/g)
    if (attrs && tagName === "a") {
      for (const attr of attrs) {
        const eq = attr.indexOf("=")
        const name = attr.slice(0, eq).trim()
        const val = attr.slice(eq + 1).replace(/^["']|["']$/g, "")
        if (name === "href" || name === "target") {
          if (name === "href" && !SAFE_PROTOCOLS.test(val)) continue
          cleaned += ` ${name}="${val.replace(/"/g, "&quot;")}"`
        }
      }
      if (!attrs.find((a: string) => a.startsWith("target"))) cleaned += ` target="_blank" rel="noopener"`
    }
    if (attrs && tagName === "img") {
      for (const attr of attrs) {
        const eq = attr.indexOf("=")
        const name = attr.slice(0, eq).trim()
        const val = attr.slice(eq + 1).replace(/^["']|["']$/g, "")
        if (name === "src" && !SAFE_PROTOCOLS.test(val)) continue
        if (name === "alt" || name === "src" || name === "width" || name === "height" || name === "loading") {
          cleaned += ` ${name}="${val.replace(/"/g, "&quot;")}"`
        }
      }
    }

    cleaned += ">"
    return cleaned
  })
}

