"use client"

import { useState } from "react"
import { Star, Archive, Share2, Printer, Check, Loader2, Copy, TrendingUp } from "lucide-react"
import { Button, cn } from "@nba/design-system"

interface SignalActionsProps {
  signalId: string
  signalContent: string
  initialFavorited: boolean
  initialArchived: boolean
  initialTaken?: boolean
}

export function SignalActions({ signalId, signalContent, initialFavorited, initialArchived, initialTaken = false }: SignalActionsProps) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [archived, setArchived] = useState(initialArchived)
  const [taken, setTaken] = useState(initialTaken)
  const [isLiking, setIsLiking] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const [isTaking, setIsTaking] = useState(false)
  const [copied, setCopied] = useState(false)
  const [contentCopied, setContentCopied] = useState(false)

  async function toggleFavorite() {
    setIsLiking(true)
    try {
      const res = await fetch(`/api/dashboard/signals/${signalId}/favorite`, { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setFavorited(data.favorited)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLiking(false)
    }
  }

  async function toggleArchive() {
    setIsArchiving(true)
    try {
      const res = await fetch(`/api/dashboard/signals/${signalId}/archive`, { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setArchived(data.archived)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsArchiving(false)
    }
  }

  function handleShare() {
    const url = `${window.location.origin}/dashboard/signals/${signalId}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleCopyContent() {
    navigator.clipboard.writeText(signalContent)
    setContentCopied(true)
    setTimeout(() => setContentCopied(false), 2000)
  }

  function handlePrint() {
    window.print()
  }

  async function toggleTaken() {
    setIsTaking(true)
    try {
      const res = await fetch(`/api/dashboard/signals/${signalId}/taken`, { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setTaken(!!data.taken)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsTaking(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-b py-3 my-4 border-border/40 select-none">
      <Button
        variant={taken ? "default" : "outline"}
        size="sm"
        disabled={isTaking}
        onClick={toggleTaken}
        className={cn(
          "h-9 text-xs rounded-xl flex items-center gap-1.5 cursor-pointer font-semibold transition-colors",
          taken ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-emerald-600/30 text-emerald-700 hover:bg-emerald-50"
        )}
      >
        {isTaking ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <TrendingUp className="size-4" />
        )}
        <span>{taken ? "Tradé ✓" : "J'ai tradé ce signal"}</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={isLiking}
        onClick={toggleFavorite}
        className={cn(
          "h-9 text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors",
          favorited ? "text-amber-500 hover:text-amber-600 bg-amber-500/5" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {isLiking ? (
          <Loader2 className="size-4 animate-spin text-amber-500" />
        ) : (
          <Star className={cn("size-4", favorited && "fill-amber-500")} />
        )}
        <span>{favorited ? "Favori" : "Ajouter aux favoris"}</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        disabled={isArchiving}
        onClick={toggleArchive}
        className={cn(
          "h-9 text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors",
          archived ? "text-primary hover:text-primary/90 bg-primary/5 font-semibold" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {isArchiving ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Archive className="size-4" />
        )}
        <span>{archived ? "Désarchiver" : "Archiver"}</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopyContent}
        className="h-9 text-xs rounded-xl text-muted-foreground hover:text-foreground flex items-center gap-1.5 cursor-pointer"
      >
        {contentCopied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
        <span>{contentCopied ? "Copié !" : "Copier"}</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleShare}
        className="h-9 text-xs rounded-xl text-muted-foreground hover:text-foreground flex items-center gap-1.5 cursor-pointer"
      >
        {copied ? <Check className="size-4 text-emerald-500" /> : <Share2 className="size-4" />}
        <span>{copied ? "Lien copié !" : "Partager"}</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handlePrint}
        className="h-9 text-xs rounded-xl text-muted-foreground hover:text-foreground flex items-center gap-1.5 cursor-pointer"
      >
        <Printer className="size-4" />
        <span>Imprimer</span>
      </Button>
    </div>
  )
}
