import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import LoginPage from "./page"

const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

const mockSignInEmail = vi.fn()
vi.mock("@nba/lib/auth-client", () => ({
  authClient: {
    signIn: {
      email: (...args: unknown[]) => mockSignInEmail(...args),
    },
  },
}))

// La page interroge /api/auth/check-login (fetch global) AVANT le signIn.
// On remplace fetch par un mock qui répond "ok" pour check-login ; le signIn
// est géré par le mock authClient, pas par la réponse fetch.
const realFetch = globalThis.fetch
const mockFetch = vi.fn((input: string | URL | Request) => {
  const url = typeof input === "string" ? input : (input as Request).url
  if (url.includes("/api/auth/check-login")) {
    return Promise.resolve({ ok: true, json: async () => ({ status: "ok" }) })
  }
  return Promise.resolve({ ok: true, json: async () => ({}) })
})

let assignedHref = ""
beforeEach(() => {
  vi.clearAllMocks()
  mockFetch.mockClear()
  // @ts-expect-error - remplacement du fetch global pour le test
  globalThis.fetch = mockFetch
  // @ts-expect-error - window.location mutable pour capturer la redirection
  delete window.location
  // @ts-expect-error - objet location factice
  window.location = {
    href: "",
    assign: (v: string) => {
      assignedHref = v
    },
  }
})

afterEach(() => {
  // Isolation : on restaure le fetch réel pour ne pas polluer les autres tests.
  globalThis.fetch = realFetch
})

describe("LoginPage", () => {
  it("renders the login form", () => {
    render(<LoginPage />)
    expect(screen.getByText("Se connecter")).toBeDefined()
    expect(screen.getByLabelText("Email")).toBeDefined()
    expect(screen.getByLabelText("Mot de passe")).toBeDefined()
  })

  it("renders the forgot password link", () => {
    render(<LoginPage />)
    const link = screen.getByText("Mot de passe oublié ?")
    expect(link).toBeDefined()
    expect(link.getAttribute("href")).toBe("/forgot-password")
  })

  it("renders the register link", () => {
    render(<LoginPage />)
    const link = screen.getByText((content) => content.includes("S") && content.includes("inscrire"))
    expect(link).toBeDefined()
    expect(link.getAttribute("href")).toBe("/register")
  })

  it("shows error on failed login", async () => {
    mockSignInEmail.mockResolvedValue({ error: { message: "Identifiants invalides", statusText: "" } })
    const user = userEvent.setup()

    render(<LoginPage />)
    await user.type(screen.getByLabelText("Email"), "test@test.com")
    await user.type(screen.getByLabelText("Mot de passe"), "wrong")
    await user.click(screen.getByText("Se connecter"))

    expect(mockSignInEmail).toHaveBeenCalled()
    expect(await screen.findByText("Identifiants invalides")).toBeDefined()
  })

  it("redirects on successful login", async () => {
    mockSignInEmail.mockResolvedValue({ error: null })
    const user = userEvent.setup()

    render(<LoginPage />)
    await user.type(screen.getByLabelText("Email"), "test@test.com")
    await user.type(screen.getByLabelText("Mot de passe"), "correct")
    await user.click(screen.getByText("Se connecter"))

    // La page force un full reload vers /dashboard (cookie de session).
    expect(assignedHref).toBe("/dashboard")
  })

  it("toggles password visibility", async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const passwordInput = screen.getByLabelText("Mot de passe") as HTMLInputElement
    expect(passwordInput.type).toBe("password")

    const toggleButton = screen.getByRole("button", { name: /afficher le mot de passe/i })
    await user.click(toggleButton)

    expect(passwordInput.type).toBe("text")
  })
})
