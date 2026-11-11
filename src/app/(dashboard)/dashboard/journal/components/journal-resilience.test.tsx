// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { JournalInsights } from "./journal-insights"
import { StatsDashboard } from "./stats-dashboard"

function okJson(data: unknown): Response {
  return { ok: true, status: 200, json: async () => data } as Response
}

function fail(status = 500): Response {
  return { ok: false, status, json: async () => ({ error: "boom" }) } as Response
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("JournalInsights — résilience API", () => {
  it("affiche un message et un bouton Réessayer sur une 500, sans crasher", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(fail(500))))

    render(<JournalInsights />)

    expect(await screen.findByText(/momentanément indisponible/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /réessayer/i })).toBeInTheDocument()
  })

  it("recharge les données après clic sur Réessayer", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => Promise.resolve(fail(500)))
      .mockImplementationOnce(() =>
        Promise.resolve(
          okJson({
            count: 5,
            summary: "Bilan OK",
            strengths: [],
            warnings: [],
            action: "Continuer",
            processScore: 80,
          }),
        ),
      )
    vi.stubGlobal("fetch", fetchMock)

    render(<JournalInsights />)

    const retry = await screen.findByRole("button", { name: /réessayer/i })
    await userEvent.click(retry)

    expect(await screen.findByText("Bilan OK")).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

describe("StatsDashboard — résilience API", () => {
  it("affiche un message et un bouton Réessayer sur une 500, sans crasher", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(fail(500))))

    render(<StatsDashboard />)

    expect(await screen.findByText(/impossible de charger tes statistiques/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /réessayer/i })).toBeInTheDocument()
  })
})
