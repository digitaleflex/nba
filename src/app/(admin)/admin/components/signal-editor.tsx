"use client"

import { useEffect, useRef, useState } from "react"
import { 
  Bold, Italic, List, Image as ImageIcon, Trash2, Send, Loader2, Sparkles, 
  Save, Calendar, Check, X, Plus, FileText, ChevronDown, Laptop, Phone, Star, Info, TrendingUp, Compass, Eye
} from "lucide-react"
import { Button, Card, CardContent, Checkbox, Badge, Input, Switch, cn } from "@nba/design-system"
import { parseSimpleMarkdown } from "@nba/lib/utils"

interface Plan {
  id: string
  name: string
  _count?: {
    users?: number
  }
}

export function SignalEditor({ onSignalCreated }: { onSignalCreated?: () => void }) {
  // Form fields states
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("Forex")
  const [content, setContent] = useState("")
  const [imageUrls, setImageUrls] = useState<string[]>([])
  
  // Trade parameters states
  const [signalType, setSignalType] = useState<"BUY" | "SELL" | "NEUTRE">("BUY")
  const [conviction, setConviction] = useState(4)
  const [entry, setEntry] = useState("")
  const [takeProfit, setTakeProfit] = useState("")
  const [stopLoss, setStopLoss] = useState("")
  const [riskReward, setRiskReward] = useState("")
  const [multipleTargets, setMultipleTargets] = useState(false)

  // Advanced options states
  const [publishLater, setPublishLater] = useState(false)
  const [visibleImmediately, setVisibleImmediately] = useState(true)
  const [pinSignal, setPinSignal] = useState(false)
  const [allowSharing, setAllowSharing] = useState(true)

  // Scheduling states
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("")

  // Diffusion groups
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlans, setSelectedPlans] = useState<string[]>([])

  // Global states
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState<"DRAFT" | "PUBLISHED" | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop")

  // Templates states
  const [templates, setTemplates] = useState<any[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState("")
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)

  // Confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [targetStatus, setTargetStatus] = useState<"DRAFT" | "PUBLISHED">("PUBLISHED")
  const [isEstimating, setIsEstimating] = useState(false)
  const [estimationResult, setEstimationResult] = useState<{ total: number; breakdown: Record<string, number> } | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch plans
  useEffect(() => {
    fetch("/api/public/plans")
      .then((r) => r.json())
      .then((data) => {
        setPlans(data)
        // Auto-select all plans by default
        if (data.length > 0) {
          setSelectedPlans(data.map((p: Plan) => p.id))
        }
      })
      .catch((err) => console.error("Failed to load plans:", err))
  }, [])

  // Fetch templates
  async function fetchTemplates() {
    try {
      const res = await fetch("/api/admin/signals/templates")
      if (res.ok) {
        const data = await res.json()
        setTemplates(data)
      }
    } catch (err) {
      console.error("Failed to load templates:", err)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [content])

  // Automatically calculate Risk/Reward ratio
  useEffect(() => {
    const ent = parseFloat(entry)
    const tp = parseFloat(takeProfit)
    const sl = parseFloat(stopLoss)

    if (!isNaN(ent) && !isNaN(tp) && !isNaN(sl) && ent !== sl) {
      let reward = 0
      let risk = 0
      if (signalType === "BUY") {
        reward = tp - ent
        risk = ent - sl
      } else if (signalType === "SELL") {
        reward = ent - tp
        risk = sl - ent
      }

      if (risk > 0 && reward > 0) {
        const ratio = (reward / risk).toFixed(1)
        setRiskReward(`1:${ratio}`)
      } else {
        setRiskReward("")
      }
    } else {
      setRiskReward("")
    }
  }, [entry, takeProfit, stopLoss, signalType])

  // Handle image upload
  async function handleImageUpload(file: File) {
    if (imageUrls.length >= 5) {
      alert("Vous pouvez télécharger jusqu'à 5 images maximum.")
      return
    }
    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/admin/signals/upload", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      setImageUrls((prev) => [...prev, data.path])
    } catch (err) {
      console.error(err)
      alert("Erreur lors du téléchargement de l'image")
    } finally {
      setIsUploading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const remainingSlots = 5 - imageUrls.length
    if (remainingSlots <= 0) {
      alert("Vous pouvez télécharger jusqu'à 5 images maximum.")
      return
    }
    const toUpload = files.slice(0, remainingSlots)
    for (const file of toUpload) {
      handleImageUpload(file)
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    const images = files.filter((f: File) => f.type.startsWith("image/"))
    if (images.length === 0) return

    const remainingSlots = 5 - imageUrls.length
    if (remainingSlots <= 0) {
      alert("Vous pouvez télécharger jusqu'à 5 images maximum.")
      return
    }

    const toUpload = images.slice(0, remainingSlots)
    for (const img of toUpload) {
      await handleImageUpload(img)
    }
  }

  async function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = Array.from(e.clipboardData.items)
    const imageItems = items.filter((item: DataTransferItem) => item.type.startsWith("image/"))
    if (imageItems.length === 0) return

    const remainingSlots = 5 - imageUrls.length
    if (remainingSlots <= 0) {
      e.preventDefault()
      alert("Vous pouvez télécharger jusqu'à 5 images maximum.")
      return
    }

    e.preventDefault()
    const toUpload = imageItems.slice(0, remainingSlots)
    for (const item of toUpload) {
      const file = item.getAsFile()
      if (file) {
        await handleImageUpload(file)
      }
    }
  }

  function insertFormat(prefix: string, suffix = "") {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const selected = text.substring(start, end)
    const formatted = prefix + selected + suffix
    setContent(text.substring(0, start) + formatted + text.substring(end))
    
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length)
    }, 0)
  }

  // Templates Management
  async function handleSaveTemplate() {
    if (!newTemplateName.trim()) {
      alert("Veuillez entrer un nom pour le modèle.")
      return
    }
    if (!content.trim()) {
      alert("Veuillez rédiger du contenu à enregistrer comme modèle.")
      return
    }

    try {
      const res = await fetch("/api/admin/signals/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTemplateName.trim(),
          content: content.trim(),
        }),
      })
      if (res.ok) {
        setNewTemplateName("")
        setIsSavingTemplate(false)
        fetchTemplates()
        alert("Modèle enregistré avec succès.")
      } else {
        const err = await res.json()
        alert(`Erreur : ${err.error || "Impossible d'enregistrer le modèle"}`)
      }
    } catch (err) {
      console.error(err)
      alert("Erreur lors de la sauvegarde du modèle")
    }
  }

  async function handleDeleteTemplate(id: string) {
    if (!confirm("Voulez-vous vraiment supprimer ce modèle ?")) return
    try {
      const res = await fetch(`/api/admin/signals/templates/${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        fetchTemplates()
      } else {
        alert("Impossible de supprimer le modèle")
      }
    } catch (err) {
      console.error(err)
      alert("Erreur lors de la suppression")
    }
  }

  // Open confirmation modal
  async function openConfirmation(status: "DRAFT" | "PUBLISHED") {
    if (!title.trim()) {
      alert("Veuillez donner un titre à votre signal.")
      return
    }
    if (!content.trim()) {
      alert("Veuillez rédiger un message pour votre signal.")
      return
    }
    if (selectedPlans.length === 0) {
      alert("Veuillez sélectionner au moins un groupe de diffusion.")
      return
    }

    setTargetStatus(status)
    setShowConfirmModal(true)
    setIsEstimating(true)
    setEstimationResult(null)

    try {
      const planQuery = selectedPlans.map(id => `planIds=${id}`).join("&")
      const res = await fetch(`/api/admin/signals/estimate?${planQuery}`)
      if (res.ok) {
        const data = await res.json()
        setEstimationResult(data)
      }
    } catch (err) {
      console.error("Failed to estimate recipients:", err)
    } finally {
      setIsEstimating(false)
    }
  }

  // Submit Signal with structured formatted markdown
  async function handleConfirmSubmit() {
    setShowConfirmModal(false)
    setIsSubmitting(targetStatus)

    let scheduledAt = null
    if (publishLater && scheduleDate && scheduleTime) {
      scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
    }

    // Format trade details into clean, premium markdown
    let formattedContent = `### ${title}\n\n${content}`
    
    if (entry || takeProfit || stopLoss) {
      formattedContent += `\n\n---\n**📊 NIVEAUX DU TRADE :**\n`
      formattedContent += `- **Type :** ${signalType === "BUY" ? "ACHAT 🟢" : signalType === "SELL" ? "VENTE 🔴" : "NEUTRE 🟡"} (${category})\n`
      if (entry) formattedContent += `- **Entrée :** ${entry}\n`
      if (takeProfit) formattedContent += `- **Take Profit (TP) :** ${takeProfit}\n`
      if (stopLoss) formattedContent += `- **Stop Loss (SL) :** ${stopLoss}\n`
      if (riskReward) formattedContent += `- **Risk/Reward estimé :** ${riskReward}\n`
      formattedContent += `- **Conviction :** ${"★".repeat(conviction)}${"☆".repeat(5 - conviction)}`
    }

    try {
      const res = await fetch("/api/admin/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: formattedContent,
          imageUrls,
          planIds: selectedPlans,
          status: targetStatus,
          scheduledAt,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Submission failed")
      }

      // Success Reset
      setTitle("")
      setCategory("Forex")
      setContent("")
      setImageUrls([])
      setEntry("")
      setTakeProfit("")
      setStopLoss("")
      setRiskReward("")
      setSignalType("BUY")
      setConviction(4)
      setPublishLater(false)
      setScheduleDate("")
      setScheduleTime("")
      alert(targetStatus === "DRAFT" ? "Brouillon enregistré avec succès." : "Signal publié avec succès.")
      if (onSignalCreated) onSignalCreated()
    } catch (err: any) {
      console.error(err)
      alert(`Erreur : ${err.message || err}`)
    } finally {
      setIsSubmitting(null)
    }
  }

  // Interactive Live SVG Candlestick Chart Component
  function InteractivePreviewChart() {
    const ent = parseFloat(entry) || 1.0850
    const tp = parseFloat(takeProfit) || (signalType === "BUY" ? ent + 0.0070 : ent - 0.0070)
    const sl = parseFloat(stopLoss) || (signalType === "BUY" ? ent - 0.0050 : ent + 0.0050)

    // Calculate Y coordinates mapping
    const chartHeight = 160
    const chartPadding = 25
    
    const minVal = Math.min(ent, tp, sl) * 0.998
    const maxVal = Math.max(ent, tp, sl) * 1.002
    const range = maxVal - minVal

    const getX = (index: number) => {
      return 35 + index * 26
    }
    
    const getY = (val: number) => {
      if (range === 0) return chartHeight / 2
      const pct = (val - minVal) / range
      // Invert Y axis for SVG rendering
      return chartHeight - chartPadding - pct * (chartHeight - 2 * chartPadding)
    }

    // Static premium candles data
    const candles = [
      { open: ent * 0.999, close: ent * 0.9995, high: ent * 1.0002, low: ent * 0.9988 },
      { open: ent * 0.9995, close: ent * 1.0003, high: ent * 1.0009, low: ent * 0.9991 },
      { open: ent * 1.0003, close: ent * 0.9998, high: ent * 1.0006, low: ent * 0.9994 },
      { open: ent * 0.9998, close: ent * 1.0008, high: ent * 1.0012, low: ent * 0.9992 },
      { open: ent * 1.0008, close: ent * 1.0005, high: ent * 1.0015, low: ent * 1.0002 },
      { open: ent * 1.0005, close: ent * 1.0012, high: ent * 1.0018, low: ent * 1.0000 },
      { open: ent * 1.0012, close: ent * 1.0009, high: ent * 1.0016, low: ent * 1.0006 },
      { open: ent * 1.0009, close: ent * 1.0019, high: ent * 1.0024, low: ent * 1.0003 },
      { open: ent * 1.0019, close: ent, high: ent * 1.0021, low: ent * 0.9996 },
    ]

    return (
      <div className="relative w-full h-[180px] bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden shadow-inner flex flex-col justify-between">
        {/* Trading grid */}
        <svg className="absolute inset-0 w-full h-[160px] pointer-events-none">
          {/* Grid lines */}
          <line x1="0" y1="40" x2="100%" y2="40" stroke="#1f1f23" strokeWidth="0.5" />
          <line x1="0" y1="80" x2="100%" y2="80" stroke="#1f1f23" strokeWidth="0.5" />
          <line x1="0" y1="120" x2="100%" y2="120" stroke="#1f1f23" strokeWidth="0.5" />
          
          {/* Candlesticks */}
          {candles.map((c, i) => {
            const isGreen = c.close >= c.open
            const x = getX(i)
            const yOpen = getY(c.open)
            const yClose = getY(c.close)
            const yHigh = getY(c.high)
            const yLow = getY(c.low)
            
            return (
              <g key={i} className="opacity-75">
                {/* Wick */}
                <line x1={x + 4} y1={yHigh} x2={x + 4} y2={yLow} stroke={isGreen ? "#22c55e" : "#ef4444"} strokeWidth="1.5" />
                {/* Body */}
                <rect 
                  x={x} 
                  y={Math.min(yOpen, yClose)} 
                  width="8" 
                  height={Math.max(2, Math.abs(yOpen - yClose))} 
                  fill={isGreen ? "#22c55e" : "#ef4444"} 
                  rx="1"
                />
              </g>
            )
          })}

          {/* Dynamic TP Level Line (Green) */}
          {takeProfit && (
            <g className="transition-all duration-300">
              <line x1="0" y1={getY(tp)} x2="100%" y2={getY(tp)} stroke="#22c55e" strokeWidth="1" strokeDasharray="3 3" />
              <rect x="5" y={getY(tp) - 8} width="55" height="15" fill="#22c55e" rx="3" className="opacity-90" />
              <text x="10" y={getY(tp) + 3} fill="#000" fontSize="9" fontWeight="bold">TP: {tp}</text>
            </g>
          )}

          {/* Dynamic Entry Level Line (Blue) */}
          {entry && (
            <g className="transition-all duration-300">
              <line x1="0" y1={getY(ent)} x2="100%" y2={getY(ent)} stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 3" />
              <rect x="5" y={getY(ent) - 8} width="60" height="15" fill="#3b82f6" rx="3" className="opacity-90" />
              <text x="10" y={getY(ent) + 3} fill="#fff" fontSize="9" fontWeight="bold">ENTRÉE: {ent}</text>
            </g>
          )}

          {/* Dynamic SL Level Line (Red) */}
          {stopLoss && (
            <g className="transition-all duration-300">
              <line x1="0" y1={getY(sl)} x2="100%" y2={getY(sl)} stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" />
              <rect x="5" y={getY(sl) - 8} width="55" height="15" fill="#ef4444" rx="3" className="opacity-90" />
              <text x="10" y={getY(sl) + 3} fill="#fff" fontSize="9" fontWeight="bold">SL: {sl}</text>
            </g>
          )}
        </svg>
        
        {/* Floating status */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-neutral-900/60 backdrop-blur-md rounded-full px-2 py-0.5 border border-neutral-800 text-[8px] text-muted-foreground">
          <span className="size-1 rounded-full bg-emerald-500 animate-pulse" />
          <span>Graphique dynamique</span>
        </div>

        {/* Trade values footer */}
        <div className="mt-auto h-7 bg-neutral-900 border-t border-neutral-900/50 flex items-center justify-between px-3 text-[10px] text-muted-foreground z-10">
          <div className="flex gap-3">
            <span>ENTRÉE: <strong className="text-blue-400">{entry || "—"}</strong></span>
            <span>TP: <strong className="text-emerald-400">{takeProfit || "—"}</strong></span>
            <span>SL: <strong className="text-rose-400">{stopLoss || "—"}</strong></span>
          </div>
          {riskReward && <span>R:R: <strong className="text-primary">{riskReward}</strong></span>}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Ariane & Actions bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <span className="hover:text-foreground cursor-pointer">Tableau de bord</span>
            <span>&gt;</span>
            <span className="hover:text-foreground cursor-pointer">Signaux</span>
            <span>&gt;</span>
            <span className="text-foreground font-medium">Créer un signal</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Créer un nouveau signal</h1>
            <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-full px-2 py-0.5 text-[9px] font-bold">
              <span className="size-1 rounded-full bg-emerald-500 animate-pulse" />
              Brouillon enregistré
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Rédigez, configurez et publiez un signal pour vos membres.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 text-xs rounded-xl"
            onClick={() => setPreviewDevice(previewDevice === "desktop" ? "mobile" : "desktop")}
          >
            <Eye className="size-4 mr-1.5" />
            Aperçu ({previewDevice === "desktop" ? "Mobile" : "Bureau"})
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 text-xs rounded-xl"
            disabled={!content.trim() || isSubmitting !== null}
            onClick={() => openConfirmation("DRAFT")}
          >
            <Save className="size-4 mr-1.5" />
            Enregistrer le brouillon
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="h-9 text-xs rounded-xl px-4 font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={!content.trim() || isSubmitting !== null}
            onClick={() => openConfirmation("PUBLISHED")}
          >
            <Send className="size-4 mr-1.5" />
            Publier le signal
          </Button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid gap-6 xl:grid-cols-5">
        
        {/* COLUMN LEFT - FORM (3 columns wide) */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* SECTION 1: CONTENU DU SIGNAL */}
          <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b">
                <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">1</span>
                <h3 className="font-bold text-sm">Contenu du signal</h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Titre du signal</label>
                  <Input 
                    placeholder="Ex: EUR/USD - Opportunité d'achat après retracement" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Catégorie</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs outline-none text-muted-foreground focus:text-foreground h-9"
                  >
                    <option value="Forex">Forex</option>
                    <option value="Indices">Indices</option>
                    <option value="Crypto">Crypto</option>
                    <option value="Deriv">Deriv</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Message du signal</label>
                  <button 
                    type="button" 
                    onClick={() => setShowTemplates(!showTemplates)} 
                    className="text-[10px] text-primary hover:underline font-bold flex items-center gap-1"
                  >
                    <FileText className="size-3" />
                    Utiliser un modèle
                  </button>
                </div>
                
                {/* WYSIWYG / MD Toolbar */}
                <div className="border rounded-xl bg-background overflow-hidden">
                  <div className="flex items-center gap-1.5 p-2 bg-muted/40 border-b">
                    <Button type="button" variant="ghost" size="sm" className="size-7 p-0 rounded-lg hover:bg-muted text-muted-foreground" onClick={() => insertFormat("**", "**")} title="Gras"><Bold className="size-3.5" /></Button>
                    <Button type="button" variant="ghost" size="sm" className="size-7 p-0 rounded-lg hover:bg-muted text-muted-foreground" onClick={() => insertFormat("*", "*")} title="Italique"><Italic className="size-3.5" /></Button>
                    <Button type="button" variant="ghost" size="sm" className="size-7 p-0 rounded-lg hover:bg-muted text-muted-foreground" onClick={() => insertFormat("- ")} title="Liste"><List className="size-3.5" /></Button>
                    <span className="w-px h-4 bg-border" />
                    <Button type="button" variant="ghost" size="sm" className="size-7 p-0 rounded-lg hover:bg-muted text-muted-foreground" onClick={() => fileInputRef.current?.click()} title="Ajouter des images"><ImageIcon className="size-3.5" /></Button>
                  </div>
                  
                  {/* Textarea */}
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onPaste={handlePaste}
                    placeholder="Détaillez votre analyse, le contexte du marché, les niveaux clés, votre stratégie..."
                    className="w-full min-h-[120px] max-h-[300px] p-3 text-xs leading-relaxed outline-none border-0 resize-none bg-transparent"
                  />
                  <div className="px-3 py-1 bg-muted/20 text-[9px] text-right text-muted-foreground border-t">
                    {content.length} / 5000 caractères
                  </div>
                </div>
              </div>

              {/* Templates popover inline if open */}
              {showTemplates && (
                <div className="p-3 bg-muted/30 border rounded-xl space-y-2 animate-in fade-in duration-150">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Modèles système</span>
                    <button type="button" onClick={() => setShowTemplates(false)} className="text-muted-foreground hover:text-foreground"><X className="size-3.5" /></button>
                  </div>
                  {templates.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Aucun modèle créé.</p>
                  ) : (
                    <div className="grid gap-2 max-h-[140px] overflow-y-auto pr-1">
                      {templates.map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-2 rounded-lg border bg-background text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setContent(t.content)
                              setShowTemplates(false)
                            }}
                            className="flex-1 text-left font-medium hover:text-primary transition-colors truncate"
                          >
                            {t.name}
                          </button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="size-6 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteTemplate(t.id)}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {isSavingTemplate ? (
                    <div className="border-t pt-2 flex gap-2">
                      <Input
                        placeholder="Nom du modèle..."
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        className="h-8 text-xs flex-1"
                      />
                      <Button size="sm" className="h-8 text-xs" onClick={handleSaveTemplate}>Sauvegarder</Button>
                    </div>
                  ) : (
                    <div className="border-t pt-2 flex justify-end">
                      <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => setIsSavingTemplate(true)} disabled={!content.trim()}>
                        <Plus className="size-3" />
                        Enregistrer message comme modèle
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Uploaded Gallery Grid */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Pièces jointes (images / graphiques)</label>
                <div 
                  className={cn(
                    "border border-dashed rounded-xl p-4 flex flex-wrap gap-3 items-center justify-center transition-colors cursor-pointer",
                    isDragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/10"
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
                  
                  {imageUrls.length === 0 ? (
                    <div className="text-center py-2">
                      <ImageIcon className="size-7 mx-auto text-muted-foreground/50 mb-1" />
                      <p className="text-[10px] text-muted-foreground">Cliquez ou glissez-déposez jusqu'à 5 images pour illustrer votre analyse</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-5 gap-3 w-full" onClick={(e) => e.stopPropagation()}>
                      {imageUrls.map((url, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                          <img src={`/api/files/${url}`} alt="" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setImageUrls((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 size-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ))}
                      {imageUrls.length < 5 && (
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square rounded-lg border border-dashed flex flex-col items-center justify-center hover:border-primary hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary cursor-pointer"
                        >
                          <Plus className="size-4 mb-0.5" />
                          <span className="text-[9px] font-bold">Ajouter</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 2: PARAMETRES DU SIGNAL */}
          <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b">
                <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">2</span>
                <h3 className="font-bold text-sm">Paramètres du signal</h3>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Type de signal</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSignalType("BUY")}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer text-center",
                        signalType === "BUY" 
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 shadow-xs" 
                          : "border-border hover:bg-muted/40 text-muted-foreground"
                      )}
                    >
                      Achat
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignalType("SELL")}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer text-center",
                        signalType === "SELL" 
                          ? "bg-rose-500/10 text-rose-600 border-rose-500/30 shadow-xs" 
                          : "border-border hover:bg-muted/40 text-muted-foreground"
                      )}
                    >
                      Vente
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignalType("NEUTRE")}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer text-center",
                        signalType === "NEUTRE" 
                          ? "bg-neutral-500/10 text-neutral-600 border-neutral-500/30 shadow-xs" 
                          : "border-border hover:bg-muted/40 text-muted-foreground"
                      )}
                    >
                      Neutre
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Degré de conviction</label>
                  <div className="flex items-center gap-1 h-9">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setConviction(star)}
                        className="p-1 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star 
                          className={cn(
                            "size-5",
                            star <= conviction ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                          )} 
                        />
                      </button>
                    ))}
                    <span className="text-[10px] font-bold text-muted-foreground ml-2">
                      {conviction}/5 étoiles
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 3: NIVEAUX DU TRADE (OPTIONNEL) */}
          <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <div className="flex items-center gap-2">
                  <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">3</span>
                  <h3 className="font-bold text-sm">Niveaux du trade <span className="text-xs text-muted-foreground font-normal">(optionnel)</span></h3>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  <Checkbox checked={multipleTargets} onCheckedChange={(checked) => setMultipleTargets(!!checked)} />
                  Niveaux multiples
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Entrée</label>
                  <Input 
                    type="text" 
                    placeholder="Ex: 1.0850" 
                    value={entry} 
                    onChange={(e) => setEntry(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Take Profit (TP)</label>
                  <Input 
                    type="text" 
                    placeholder="Ex: 1.0920" 
                    value={takeProfit} 
                    onChange={(e) => setTakeProfit(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Stop Loss (SL)</label>
                  <Input 
                    type="text" 
                    placeholder="Ex: 1.0800" 
                    value={stopLoss} 
                    onChange={(e) => setStopLoss(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Risk/Reward estimé</label>
                  <Input 
                    type="text" 
                    placeholder="Calculé..." 
                    value={riskReward} 
                    onChange={(e) => setRiskReward(e.target.value)}
                    className="text-xs font-semibold text-primary bg-primary/5 border-primary/20"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 4: OPTIONS AVANCEES */}
          <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b">
                <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">4</span>
                <h3 className="font-bold text-sm">Options avancées</h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                <div className="flex items-center justify-between p-3 rounded-xl border bg-background/50">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold">Publier plus tard</p>
                    <p className="text-[10px] text-muted-foreground">Planifiez la publication à une date précise</p>
                  </div>
                  <Switch checked={publishLater} onCheckedChange={(checked) => setPublishLater(checked)} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border bg-background/50">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold">Rendre visible immédiatement</p>
                    <p className="text-[10px] text-muted-foreground">Le signal sera visible et notifié</p>
                  </div>
                  <Switch checked={visibleImmediately} onCheckedChange={(checked) => setVisibleImmediately(checked)} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border bg-background/50">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold">Épingler ce signal</p>
                    <p className="text-[10px] text-muted-foreground">Le signal restera en haut de la liste</p>
                  </div>
                  <Switch checked={pinSignal} onCheckedChange={(checked) => setPinSignal(checked)} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border bg-background/50">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold">Autoriser le partage</p>
                    <p className="text-[10px] text-muted-foreground">Permettre aux membres de partager</p>
                  </div>
                  <Switch checked={allowSharing} onCheckedChange={(checked) => setAllowSharing(checked)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 5: PLANIFICATION DE PUBLICATION */}
          {publishLater && (
            <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-sm border-amber-500/20 bg-amber-500/5/5 animate-in slide-in-from-top-3 duration-200">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border/60">
                  <span className="size-5 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs">5</span>
                  <h3 className="font-bold text-sm text-foreground">Planification de publication <span className="text-xs text-muted-foreground font-normal">(optionnel)</span></h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Publier le</label>
                    <Input 
                      type="date" 
                      min={new Date().toISOString().split("T")[0]}
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">à</label>
                    <Input 
                      type="time" 
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 pt-1">
                  <Info className="size-3.5 text-muted-foreground" />
                  <span>Fuseau horaire du serveur : (GMT+1) Afrique/Cotonou</span>
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* COLUMN RIGHT - PREVIEW & GROUPS (2 columns wide) */}
        <div className="xl:col-span-2 space-y-6 sticky top-24 h-fit">
          
          {/* LIVE PREVIEW COMPONENT */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Sparkles className="size-3.5 text-primary" />
              Aperçu du signal
            </h3>
            
            {previewDevice === "mobile" ? (
              /* Mobile Preview screen */
              <div className="mx-auto w-[310px] border-[8px] border-neutral-800 rounded-[36px] overflow-hidden bg-neutral-950 shadow-xl relative animate-in zoom-in-95 duration-200">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-neutral-800 rounded-full z-20 flex items-center justify-center">
                  <div className="w-8 h-1 bg-neutral-950 rounded-full mr-1.5" />
                  <div className="size-1 bg-neutral-950 rounded-full" />
                </div>
                <div className="pt-8 pb-4 px-3 bg-background min-h-[440px] flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[9px] text-muted-foreground border-b pb-1.5">
                      <span className="flex items-center gap-1 font-bold">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        DIRECT
                      </span>
                      <span>Aujourd'hui, 14:30</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex gap-1.5">
                        <Badge className={cn("text-[9px] uppercase", signalType === "BUY" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : signalType === "SELL" ? "bg-rose-500/10 text-rose-600 border-rose-500/20" : "bg-neutral-500/10 text-neutral-600 border-neutral-500/20")}>
                          {signalType === "BUY" ? "ACHAT" : signalType === "SELL" ? "VENTE" : "NEUTRE"}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] border-border/80">{category}</Badge>
                      </div>

                      <h4 className="text-xs font-bold text-foreground leading-snug">
                        {title || "Titre du signal"}
                      </h4>

                      <div 
                        className="text-[10px] text-muted-foreground leading-relaxed whitespace-pre-wrap line-clamp-4"
                        dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(content || "Détaillez le contenu...") }}
                      />
                    </div>

                    {/* Chart preview in mobile */}
                    {(entry || takeProfit || stopLoss) && <InteractivePreviewChart />}
                  </div>
                  
                  <div className="text-[8px] text-center text-muted-foreground border-t pt-2 mt-2">
                    🔒 NBA VIP Signal
                  </div>
                </div>
              </div>
            ) : (
              /* Desktop Card Preview */
              <Card className="relative overflow-hidden border border-primary/20 bg-primary/5/10 shadow-md shadow-primary/5/10 animate-in zoom-in-95 duration-200">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                <CardContent className="p-4 space-y-4">
                  
                  {/* Header badges */}
                  <div className="flex items-center justify-between border-b pb-3 border-border/50">
                    <div className="flex gap-1.5">
                      <Badge className={cn("text-[10px] uppercase font-bold", signalType === "BUY" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : signalType === "SELL" ? "bg-rose-500/10 text-rose-600 border-rose-500/20" : "bg-neutral-500/10 text-neutral-600 border-neutral-500/20")}>
                        {signalType === "BUY" ? "ACHAT" : signalType === "SELL" ? "VENTE" : "NEUTRE"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] border-border/80 font-bold">{category}</Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-semibold">Aujourd'hui, 14:30</span>
                  </div>

                  {/* Title and Message */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-foreground leading-snug">
                      {title || "EUR/USD - Opportunité d'achat après retracement"}
                    </h3>
                    <div 
                      className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap break-words"
                      dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(content || "Après une forte baisse, le prix revient sur un niveau de support clé...") }}
                    />
                  </div>

                  {/* Chart component */}
                  {(entry || takeProfit || stopLoss) && (
                    <div className="pt-2">
                      <InteractivePreviewChart />
                    </div>
                  )}

                  {/* Attachment indicator if any */}
                  {imageUrls.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pt-2">
                      {imageUrls.map((url, idx) => (
                        <div key={idx} className="relative aspect-video w-20 rounded-lg overflow-hidden border shrink-0">
                          <img src={`/api/files/${url}`} alt="" className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* SECTION 6: GROUPES DE DIFFUSION */}
          <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b">
                <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">6</span>
                <h3 className="font-bold text-sm">Groupes de diffusion</h3>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Sélectionnez les groupes qui recevront ce signal</p>
                <div className="space-y-2.5">
                  {plans.length === 0 ? (
                    <div className="text-center py-4 text-xs text-muted-foreground">Aucun plan trouvé.</div>
                  ) : (
                    plans.map((plan) => (
                      <label
                        key={plan.id}
                        className={cn(
                          "flex items-center justify-between cursor-pointer text-xs p-3 rounded-xl border transition-all duration-200",
                          selectedPlans.includes(plan.id)
                            ? "border-primary/20 bg-primary/5 text-foreground font-semibold"
                            : "border-border hover:bg-muted/30 text-muted-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <Checkbox
                            checked={selectedPlans.includes(plan.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedPlans((prev) => [...prev, plan.id])
                              } else {
                                setSelectedPlans((prev) => prev.filter((id) => id !== plan.id))
                              }
                            }}
                          />
                          <span>Signals {plan.name}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/80 font-normal">
                          {plan._count?.users !== undefined ? `${plan._count.users} membres` : "— membres"}
                        </span>
                      </label>
                    ))
                  )}
                </div>
                
                <button 
                  type="button" 
                  className="text-xs text-primary hover:underline font-bold flex items-center gap-1 mt-2"
                  onClick={() => alert("Fonctionnalité de création de groupe disponible dans l'onglet Paramètres.")}
                >
                  <Plus className="size-3.5" />
                  Créer un nouveau groupe
                </button>
              </div>

              {publishLater && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 flex items-start gap-2.5 text-xs text-amber-600 leading-normal mt-3">
                  <Info className="size-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Signal programmé</span>
                    <p className="text-[10px] text-amber-500 mt-0.5">
                      Le signal sera automatiquement publié à la date et l'heure choisies. Les membres recevront une notification et l'email correspondant.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

      </div>

      {/* Confirmation Modal overlay */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-background border rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-semibold text-lg">Confirmation d'envoi</h3>
              <button onClick={() => setShowConfirmModal(false)} className="text-muted-foreground hover:text-foreground"><X className="size-5" /></button>
            </div>

            {isEstimating ? (
              <div className="flex flex-col items-center justify-center py-6 gap-3">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Estimation des destinataires...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Ce signal sera envoyé aux membres des groupes de diffusion sélectionnés.
                </p>

                {estimationResult && (
                  <div className="space-y-2 rounded-xl bg-muted/40 p-4 border text-sm">
                    <div className="flex justify-between font-semibold border-b pb-2 mb-2">
                      <span>Groupe</span>
                      <span>Destinataires</span>
                    </div>
                    {Object.entries(estimationResult.breakdown).map(([planName, count]) => (
                      <div key={planName} className="flex justify-between text-xs text-muted-foreground">
                        <span>{planName}</span>
                        <span className="font-medium text-foreground">{count} membres</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold border-t pt-2 mt-2 text-primary">
                      <span>Total (uniques)</span>
                      <span>{estimationResult.total} membres</span>
                    </div>
                  </div>
                )}

                {publishLater && scheduleDate && scheduleTime && (
                  <div className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex items-center gap-2">
                    <Calendar className="size-4 animate-pulse" />
                    <span>Planifié pour le : <strong>{new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString("fr-FR")}</strong></span>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 border-t pt-4">
              <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Annuler</Button>
              <Button onClick={handleConfirmSubmit} disabled={isSubmitting !== null} className="gap-1.5">
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    Confirmer et {publishLater ? "planifier" : "publier"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
