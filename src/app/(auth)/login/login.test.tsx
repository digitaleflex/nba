import { describe, it, expect, vi, beforeEach } from "vitest"
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

beforeEach(() => {
  vi.clearAllMocks()
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

    expect(await screen.findByText("Identifiants invalides")).toBeDefined()
  })

  it("redirects on successful login", async () => {
    mockSignInEmail.mockResolvedValue({ error: null })
    const user = userEvent.setup()

    render(<LoginPage />)
    await user.type(screen.getByLabelText("Email"), "test@test.com")
    await user.type(screen.getByLabelText("Mot de passe"), "correct")
    await user.click(screen.getByText("Se connecter"))

    expect(mockPush).toHaveBeenCalledWith("/")
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
