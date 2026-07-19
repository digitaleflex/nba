import { describe, it, expect } from "vitest"
import {
  NAVIGATION,
  filterNavItems,
  getMobileNavItems,
  getMenuNavItems,
  getSidebarSections,
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
      { id: "a", href: "/a", label: "A", icon: () => null },
      { id: "b", href: "/b", label: "B", icon: () => null, requiredRoles: ["ADMIN"] },
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

  it("retourne 4 contextes admin en mobile", () => {
    const items = getMobileNavItems("admin", "ADMIN")
    expect(items.map((i) => i.id)).toEqual(["surveiller", "decider", "communiquer", "auditer"])
  })

  it("retourne les sections admin pour la sidebar", () => {
    const sections = getSidebarSections("admin", "ADMIN")
    expect(sections.length).toBe(4)
    expect(sections.map((s) => s.id)).toEqual(["surveiller", "decider", "communiquer", "auditer"])
  })

  it("détecte l'active state par pathname", () => {
    const item = { id: "signals", href: "/dashboard/signals", label: "Signaux", icon: () => null }
    expect(isNavItemActive(item, "/dashboard/signals", new URLSearchParams())).toBe(true)
    expect(isNavItemActive(item, "/dashboard/journal", new URLSearchParams())).toBe(false)
  })

  it("détecte l'active state par search params pour les tabs admin", () => {
    const item = {
      id: "dashboard",
      href: "/admin?tab=dashboard",
      label: "Tableau de bord",
      icon: () => null,
      isActive: (pathname: string, searchParams: URLSearchParams) =>
        pathname === "/admin" && searchParams.get("tab") === "dashboard",
    }
    expect(isNavItemActive(item, "/admin", new URLSearchParams("?tab=dashboard"))).toBe(true)
    expect(isNavItemActive(item, "/admin", new URLSearchParams("?tab=requests"))).toBe(false)
  })
})
