import { describe, it, expect } from "vitest"
import { Home } from "lucide-react"
import {
  NAVIGATION,
  filterNavItems,
  getMobileNavItems,
  getSidebarSections,
  getSuperAdminSections,
  isNavItemActive,
} from "./navigation"

describe("navigation config", () => {
  it("a des items pour chaque espace et device", () => {
    expect(NAVIGATION.dashboard.mobile.length).toBeGreaterThan(0)
    expect(NAVIGATION.dashboard.sidebar.length).toBeGreaterThan(0)
    expect(NAVIGATION.dashboard.menu.length).toBeGreaterThan(0)
    expect(NAVIGATION.admin.mobile.length).toBeGreaterThan(0)
    expect(NAVIGATION.admin.sidebar.length).toBeGreaterThan(0)
    expect(NAVIGATION.admin.menu.length).toBeGreaterThan(0)
  })

  it("filtre les items par rôle", () => {
    const items = [
      { id: "a", href: "/a", label: "A", icon: Home },
      { id: "b", href: "/b", label: "B", icon: Home, requiredRoles: ["ADMIN"] },
    ]
    expect(filterNavItems(items, "USER").length).toBe(1)
    expect(filterNavItems(items, "ADMIN").length).toBe(2)
    expect(filterNavItems(items).length).toBe(1)
  })

  it("retourne les liens mobile dashboard sans admin pour un user standard", () => {
    const items = getMobileNavItems("dashboard", "USER")
    expect(items.some((i) => i.id === "admin")).toBe(false)
    expect(items.some((i) => i.id === "signals")).toBe(true)
  })

  it("retourne le lien admin pour un admin", () => {
    const items = getMobileNavItems("dashboard", "ADMIN")
    expect(items.some((i) => i.id === "admin")).toBe(true)
  })

  it("retourne 5 contextes admin en mobile (organisation par métier)", () => {
    const items = getMobileNavItems("admin", "ADMIN")
    expect(items.map((i) => i.id)).toEqual(["a-traiter", "membres", "contenus", "pilotage", "securite"])
  })

  it("retourne les sections admin pour la sidebar", () => {
    const sections = getSidebarSections("admin", "ADMIN")
    expect(sections.length).toBe(5)
    expect(sections.map((s) => s.id)).toEqual(["a-traiter", "membres", "contenus", "pilotage", "securite"])
  })

  it("détecte l'active state par pathname", () => {
    const item = { id: "signals", href: "/dashboard/signals", label: "Signaux", icon: Home }
    expect(isNavItemActive(item, "/dashboard/signals", new URLSearchParams())).toBe(true)
    expect(isNavItemActive(item, "/dashboard/journal", new URLSearchParams())).toBe(false)
  })

  it("détecte l'active state par search params pour les tabs admin", () => {
    const item = {
      id: "dashboard",
      href: "/admin?tab=dashboard",
      label: "Tableau de bord",
      icon: Home,
      isActive: (pathname: string, searchParams: URLSearchParams) =>
        pathname === "/admin" && searchParams.get("tab") === "dashboard",
    }
    expect(isNavItemActive(item, "/admin", new URLSearchParams("?tab=dashboard"))).toBe(true)
    expect(isNavItemActive(item, "/admin", new URLSearchParams("?tab=requests"))).toBe(false)
  })

  it("considère /admin sans ?tab comme le tableau de bord (tab par défaut)", () => {
    const sections = getSidebarSections("admin", "ADMIN")
    const dashboard = sections.flatMap((s) => s.items).find((i) => i.id === "dashboard")
    expect(dashboard).toBeDefined()
    expect(isNavItemActive(dashboard!, "/admin", new URLSearchParams())).toBe(true)
  })

  it("n'ajoute pas d'entrée Système à la barre mobile du SUPER_ADMIN (section injectée à part)", () => {
    const items = getMobileNavItems("admin", "SUPER_ADMIN")
    expect(items.map((i) => i.id)).toEqual(["a-traiter", "membres", "contenus", "pilotage", "securite"])
    expect(items.map((i) => i.id)).not.toContain("systeme")
  })

  it("expose la section Système au SUPER_ADMIN avec ses tabs et ses liens standalone", () => {
    const sections = getSuperAdminSections()
    expect(sections.map((s) => s.id)).toEqual(["systeme"])
    const ids = sections[0].items.map((i) => i.id)
    expect(ids).toEqual(expect.arrayContaining(["settings", "crons", "developer", "cache", "dlq", "queues"]))
  })

  it("masque les outils système aux ADMIN simples", () => {
    const sections = getSidebarSections("admin", "ADMIN")
    const allIds = sections.flatMap((s) => s.items.map((i) => i.id))
    expect(allIds).not.toContain("developer")
    expect(allIds).not.toContain("cache")
    expect(allIds).not.toContain("dlq")
    expect(allIds).not.toContain("queues")
    expect(allIds).not.toContain("settings")
    expect(allIds).not.toContain("crons")
  })
})
