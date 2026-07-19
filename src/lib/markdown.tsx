import { type ReactNode } from "react"

/**
 * Rendu markdown ultra-contraint et SÛR pour les messages de chat.
 * Aucun HTML brut n'est injecté (pas de dangerouslySetInnerHTML) : tout est
 * produit sous forme d'éléments React, ce qui élimine tout risque XSS.
 *
 * Supporte : **gras**, *italique*, `code`, [lien](url) (url http/https/mailto
 * uniquement), listes à puces (- / *) et ordonnées (1. ), et les sauts de ligne.
 */

const INLINE_PATTERNS = [
  { name: "link" as const, re: /\[([^\]]+)\]\(([^)\s]+)\)/ },
  { name: "bold" as const, re: /\*\*([^*]+)\*\*/ },
  { name: "code" as const, re: /`([^`]+)`/ },
  { name: "italic" as const, re: /\*([^*]+)\*/ },
]

function safeUrl(url: string): boolean {
  return /^(https?:\/\/|mailto:)/i.test(url)
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let rest = text
  let i = 0

  while (rest.length > 0) {
    let best: { name: string; m: RegExpExecArray } | null = null
    for (const p of INLINE_PATTERNS) {
      const m = p.re.exec(rest)
      if (m && (best === null || m.index < best.m.index)) {
        best = { name: p.name, m }
      }
    }
    if (!best) {
      nodes.push(rest)
      break
    }
    const { name, m } = best
    if (m.index > 0) nodes.push(rest.slice(0, m.index))
    const key = `${keyPrefix}-${i++}`

    if (name === "link") {
      const url = m[2]
      if (safeUrl(url)) {
        nodes.push(
          <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="underline text-primary hover:opacity-80">
            {m[1]}
          </a>,
        )
      } else {
        nodes.push(m[0])
      }
    } else if (name === "bold") {
      nodes.push(<strong key={key}>{renderInline(m[1], key)}</strong>)
    } else if (name === "code") {
      nodes.push(
        <code key={key} className="px-1 py-0.5 rounded bg-black/10 text-[0.85em]">
          {m[1]}
        </code>,
      )
    } else if (name === "italic") {
      nodes.push(<em key={key}>{renderInline(m[1], key)}</em>)
    }

    rest = rest.slice(m.index + m[0].length)
  }

  return nodes
}

export function MarkdownMessage({ content }: { content: string }) {
  const lines = content.split("\n")
  const blocks: ReactNode[] = []
  let key = 0
  let list: { ordered: boolean; items: string[] } | null = null

  const flushList = () => {
    if (!list) return
    const items = list.items
    const node =
      list.ordered ? (
        <ol key={key++} className="list-decimal pl-5 space-y-0.5">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `li-${key}-${idx}`)}</li>
          ))}
        </ol>
      ) : (
        <ul key={key++} className="list-disc pl-5 space-y-0.5">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `li-${key}-${idx}`)}</li>
          ))}
        </ul>
      )
    blocks.push(node)
    list = null
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    const ulMatch = /^[-*]\s+(.*)$/.exec(line)
    const olMatch = /^\d+\.\s+(.*)$/.exec(line)

    if (ulMatch) {
      if (!list || list.ordered) {
        flushList()
        list = { ordered: false, items: [] }
      }
      list.items.push(ulMatch[1])
    } else if (olMatch) {
      if (!list || !list.ordered) {
        flushList()
        list = { ordered: true, items: [] }
      }
      list.items.push(olMatch[1])
    } else if (line.trim() === "") {
      flushList()
    } else {
      flushList()
      blocks.push(
        <p key={key++} className="whitespace-pre-wrap break-words">
          {renderInline(line, `p-${key}`)}
        </p>,
      )
    }
  }
  flushList()

  return <>{blocks}</>
}

/** Aperçu texte brut (listes de conversations) : on retire la syntaxe markdown. */
export function plainPreview(content: string): string {
  return content
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\n+/g, " ")
    .trim()
}
