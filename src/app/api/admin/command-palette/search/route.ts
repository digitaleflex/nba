import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"

export interface PaletteMemberResult {
  type: "member"
  id: string
  title: string
  subtitle: string
  href: string
}

export interface PaletteSignalResult {
  type: "signal"
  id: string
  title: string
  subtitle: string
  href: string
}

export interface PaletteActionResult {
  type: "action"
  id: string
  title: string
  subtitle: string
  href: string
  shortcut?: string
}

export type PaletteResult = PaletteMemberResult | PaletteSignalResult | PaletteActionResult

export interface PaletteResponse {
  members: PaletteMemberResult[]
  signals: PaletteSignalResult[]
  actions: PaletteActionResult[]
}

const ACTIONS: PaletteActionResult[] = [
  { type: "action", id: "act:new-signal", title: "Publier un signal", subtitle: "Communication", href: "/admin?tab=signals", shortcut: "N" },
  { type: "action", id: "act:new-email", title: "Envoyer un email", subtitle: "Communication", href: "/admin?tab=emails" },
  { type: "action", id: "act:view-requests", title: "Voir les demandes d'accès", subtitle: "Décider", href: "/admin?tab=requests", shortcut: "R" },
  { type: "action", id: "act:view-kyc", title: "Voir les KYC en attente", subtitle: "Décider", href: "/admin?tab=kyc", shortcut: "K" },
  { type: "action", id: "act:view-members", title: "Voir les membres", subtitle: "Décider", href: "/admin?tab=membres", shortcut: "M" },
  { type: "action", id: "act:view-audit", title: "Voir l'audit", subtitle: "Auditer", href: "/admin?tab=audit", shortcut: "A" },
  { type: "action", id: "act:view-moderation", title: "Voir la modération", subtitle: "Auditer", href: "/admin?tab=moderation" },
  { type: "action", id: "act:view-security", title: "Voir la sécurité", subtitle: "Auditer", href: "/admin?tab=security" },
  { type: "action", id: "act:view-tracker", title: "Ouvrir le tracker", subtitle: "Surveiller", href: "/admin/tracker" },
  { type: "action", id: "act:view-control-room", title: "Ouvrir le control room", subtitle: "Surveiller", href: "/admin/control-room" },
  { type: "action", id: "act:view-analytics", title: "Voir les analytics", subtitle: "Surveiller", href: "/admin?tab=analytics" },
  { type: "action", id: "act:view-dashboard", title: "Tableau de bord", subtitle: "Surveiller", href: "/admin?tab=dashboard", shortcut: "G" },
]

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

function score(needle: string, hay: string): number {
  if (!needle) return 1
  const h = normalize(hay)
  const n = normalize(needle)
  if (h.startsWith(n)) return 3
  if (h.includes(" " + n) || h.includes("-" + n) || h.includes("_" + n)) return 2
  if (h.includes(n)) return 1
  return 0
}

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const { searchParams } = new URL(req.url)
    const q = (searchParams.get("q") || "").trim().slice(0, 80)
    const limit = Math.min(8, Math.max(1, parseInt(searchParams.get("limit") || "6")))

    if (!q) {
      return NextResponse.json<PaletteResponse>({
        members: [],
        signals: [],
        actions: ACTIONS.slice(0, limit),
      })
    }

    // Search members by name/email
    const [members, signals] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: { select: { name: true } },
        },
        take: limit,
        orderBy: { name: "asc" },
      }),
      prisma.signal.findMany({
        where: {
          deletedAt: null,
          content: { contains: q, mode: "insensitive" },
        },
        select: {
          id: true,
          content: true,
          status: true,
          createdAt: true,
          creator: { select: { name: true } },
        },
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ])

    // Score and sort actions
    const matchedActions = ACTIONS
      .map((a) => ({ a, s: Math.max(score(q, a.title), score(q, a.subtitle)) }))
      .filter((x) => x.s > 0)
      .sort((x, y) => y.s - x.s)
      .slice(0, limit)
      .map((x) => x.a)

    return NextResponse.json<PaletteResponse>({
      members: members.map((m) => ({
        type: "member" as const,
        id: m.id,
        title: m.name,
        subtitle: `${m.email} • ${m.role.name}`,
        href: `/admin?tab=membres&selected=${m.id}`,
      })),
      signals: signals.map((s) => {
        const preview = s.content.length > 80 ? s.content.slice(0, 80) + "…" : s.content
        return {
          type: "signal" as const,
          id: s.id,
          title: preview,
          subtitle: `${s.status} • par ${s.creator?.name || "?"} • ${new Date(s.createdAt).toLocaleDateString()}`,
          href: `/admin?tab=signals`,
        }
      }),
      actions: matchedActions,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
