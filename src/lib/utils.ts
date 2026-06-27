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

  return html
}

