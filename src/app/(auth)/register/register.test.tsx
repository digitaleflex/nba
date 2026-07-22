// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "./page";

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

const mockSignUpEmail = vi.fn();
vi.mock("@nba/lib/auth-client", () => ({
  authClient: {
    signUp: {
      email: (...args: unknown[]) => mockSignUpEmail(...args),
    },
  },
}));

const mockPlans = [
  { id: "bronze", name: "Plan Bronze", description: "Débutant", sortOrder: 1 },
  {
    id: "silver",
    name: "Plan Silver",
    description: "Intermédiaire",
    sortOrder: 2,
  },
  { id: "gold", name: "Plan Gold", description: "Premium", sortOrder: 3 },
];

function mockFetchSuccess() {
  return vi
    .spyOn(global, "fetch")
    .mockImplementation(async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/public/plans")) {
        return new Response(JSON.stringify(mockPlans), { status: 200 });
      }
      if (urlStr.includes("/api/public/select-plan")) {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      return new Response(null, { status: 404 });
    });
}

function getPasswordToggle(passwordInput: HTMLElement) {
  return passwordInput
    .closest(".relative")
    ?.querySelector("button") as HTMLElement;
}

async function fillWizard(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("combobox"));
  await user.click(await screen.findByRole("option", { name: "Plan Bronze" }));
  await user.click(screen.getByRole("button", { name: /continuer/i }));
  await user.type(screen.getByPlaceholderText("Kofi"), "Kofi");
  await user.type(screen.getByPlaceholderText("Mensah"), "Mensah");
  await user.click(screen.getByRole("button", { name: /suivant/i }));
  await user.type(
    screen.getByPlaceholderText("a.mensah@exemple.com"),
    "kofi@test.com",
  );
  await user.type(
    screen.getByPlaceholderText("+229 01 02 03 05 06"),
    "+22901020305",
  );
  await user.click(screen.getByRole("button", { name: /suivant/i }));
  await user.type(
    screen.getByPlaceholderText("Min. 10 caractères"),
    "Str0ng!Pass",
  );
  await user.type(
    screen.getByPlaceholderText("Retapez votre mot de passe"),
    "Str0ng!Pass",
  );
  await user.click(screen.getByRole("button", { name: /suivant/i }));
}

describe("Register Wizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("renders step 0 with service selector and disabled continue button", async () => {
    mockFetchSuccess();
    render(<RegisterPage />);
    await waitFor(() => {
      expect(screen.getByText(/Choisissez le service/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continuer/i })).toBeDisabled();
  });

  it("loads plans and shows options on combobox click", async () => {
    mockFetchSuccess();
    render(<RegisterPage />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("combobox"));
    expect(
      await screen.findByRole("option", { name: "Plan Bronze" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Plan Silver" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Plan Gold" }),
    ).toBeInTheDocument();
  });

  it("shows confirmation card when a plan is selected", async () => {
    mockFetchSuccess();
    render(<RegisterPage />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("combobox"));
    await user.click(
      await screen.findByRole("option", { name: "Plan Bronze" }),
    );
    expect(screen.getByText("Service sélectionné")).toBeInTheDocument();
    const serviceCard = screen
      .getByText("Service sélectionné")
      .closest("[class*='flex']") as HTMLElement;
    expect(within(serviceCard).getByText("Plan Bronze")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continuer/i })).toBeEnabled();
  });

  it("navigates from service selection to identity step", async () => {
    mockFetchSuccess();
    render(<RegisterPage />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("combobox"));
    await user.click(
      await screen.findByRole("option", { name: "Plan Silver" }),
    );
    await user.click(screen.getByRole("button", { name: /continuer/i }));
    expect(
      screen.getByText(/Commençons par votre identité/i),
    ).toBeInTheDocument();
  });

  it("disables next button when identity fields are empty", async () => {
    mockFetchSuccess();
    render(<RegisterPage />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("combobox"));
    await user.click(
      await screen.findByRole("option", { name: "Plan Bronze" }),
    );
    await user.click(screen.getByRole("button", { name: /continuer/i }));
    expect(screen.getByRole("button", { name: /suivant/i })).toBeDisabled();
  });

  it("enables next button after filling identity fields", async () => {
    mockFetchSuccess();
    render(<RegisterPage />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("combobox"));
    await user.click(
      await screen.findByRole("option", { name: "Plan Bronze" }),
    );
    await user.click(screen.getByRole("button", { name: /continuer/i }));
    await user.type(screen.getByPlaceholderText("Kofi"), "Kofi");
    await user.type(screen.getByPlaceholderText("Mensah"), "Mensah");
    expect(screen.getByRole("button", { name: /suivant/i })).toBeEnabled();
  });

  it("goes back to previous step", async () => {
    mockFetchSuccess();
    render(<RegisterPage />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("combobox"));
    await user.click(
      await screen.findByRole("option", { name: "Plan Bronze" }),
    );
    await user.click(screen.getByRole("button", { name: /continuer/i }));
    await user.click(screen.getByRole("button", { name: /retour/i }));
    expect(screen.getByText(/Choisissez le service/i)).toBeInTheDocument();
  });

  it("displays password strength rules on typing", async () => {
    mockFetchSuccess();
    render(<RegisterPage />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("combobox"));
    await user.click(
      await screen.findByRole("option", { name: "Plan Bronze" }),
    );
    await user.click(screen.getByRole("button", { name: /continuer/i }));
    await user.type(screen.getByPlaceholderText("Kofi"), "Kofi");
    await user.type(screen.getByPlaceholderText("Mensah"), "Mensah");
    await user.click(screen.getByRole("button", { name: /suivant/i }));
    await user.type(
      screen.getByPlaceholderText("a.mensah@exemple.com"),
      "k@t.com",
    );
    await user.type(
      screen.getByPlaceholderText("+229 01 02 03 05 06"),
      "+22901020305",
    );
    await user.click(screen.getByRole("button", { name: /suivant/i }));
    const input = screen.getByPlaceholderText("Min. 10 caractères");
    await user.type(input, "a");
    expect(screen.getByText("Faible")).toBeInTheDocument();
    expect(screen.getByText("Au moins 10 caractères")).toBeInTheDocument();
  });

  it("updates strength label from Faible to Très bon as password improves", async () => {
    mockFetchSuccess();
    render(<RegisterPage />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("combobox"));
    await user.click(
      await screen.findByRole("option", { name: "Plan Bronze" }),
    );
    await user.click(screen.getByRole("button", { name: /continuer/i }));
    await user.type(screen.getByPlaceholderText("Kofi"), "Kofi");
    await user.type(screen.getByPlaceholderText("Mensah"), "Mensah");
    await user.click(screen.getByRole("button", { name: /suivant/i }));
    await user.type(
      screen.getByPlaceholderText("a.mensah@exemple.com"),
      "k@t.com",
    );
    await user.type(
      screen.getByPlaceholderText("+229 01 02 03 05 06"),
      "+22901020305",
    );
    await user.click(screen.getByRole("button", { name: /suivant/i }));
    const input = screen.getByPlaceholderText("Min. 10 caractères");
    await user.type(input, "Str0ng!Pass");
    expect(screen.getByText("Très bon")).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    mockFetchSuccess();
    render(<RegisterPage />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("combobox"));
    await user.click(
      await screen.findByRole("option", { name: "Plan Bronze" }),
    );
    await user.click(screen.getByRole("button", { name: /continuer/i }));
    await user.type(screen.getByPlaceholderText("Kofi"), "Kofi");
    await user.type(screen.getByPlaceholderText("Mensah"), "Mensah");
    await user.click(screen.getByRole("button", { name: /suivant/i }));
    await user.type(
      screen.getByPlaceholderText("a.mensah@exemple.com"),
      "k@t.com",
    );
    await user.type(
      screen.getByPlaceholderText("+229 01 02 03 05 06"),
      "+22901020305",
    );
    await user.click(screen.getByRole("button", { name: /suivant/i }));
    const input = screen.getByPlaceholderText(
      "Min. 10 caractères",
    ) as HTMLInputElement;
    expect(input.type).toBe("password");
    const toggle = getPasswordToggle(input);
    await user.click(toggle);
    expect(input.type).toBe("text");
    await user.click(toggle);
    expect(input.type).toBe("password");
  });

  it("shows confirmation step with all entered data", async () => {
    mockFetchSuccess();
    mockSignUpEmail.mockResolvedValue({ error: null });
    render(<RegisterPage />);
    const user = userEvent.setup();
    await fillWizard(user);
    expect(screen.getByText(/Vérifiez vos informations/i)).toBeInTheDocument();
    expect(screen.getByText("Kofi Mensah")).toBeInTheDocument();
    expect(screen.getByText("kofi@test.com")).toBeInTheDocument();
    expect(screen.getByText("+22901020305")).toBeInTheDocument();
    const reviewSection = screen.getByText(
      /Vérifiez vos informations/i,
    ).parentElement!;
    expect(within(reviewSection).getByText("Plan Bronze")).toBeInTheDocument();
  });

  it("submits form and redirects on success", async () => {
    mockFetchSuccess();
    mockSignUpEmail.mockResolvedValue({ error: null });
    render(<RegisterPage />);
    const user = userEvent.setup();
    await fillWizard(user);
    await user.click(screen.getByRole("button", { name: /créer mon compte/i }));
    expect(mockSignUpEmail).toHaveBeenCalledWith({
      name: "Kofi Mensah",
      email: "kofi@test.com",
      password: "Str0ng!Pass",
      callbackURL: "/onboarding",
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/onboarding");
    });
  });

  it("sends select-plan request after successful signup", async () => {
    mockFetchSuccess();
    mockSignUpEmail.mockResolvedValue({ error: null });
    render(<RegisterPage />);
    const user = userEvent.setup();
    await fillWizard(user);
    await user.click(screen.getByRole("button", { name: /créer mon compte/i }));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });
    expect(global.fetch).toHaveBeenCalledWith("/api/public/select-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: "bronze" }),
    });
  }, 10000);

  it("shows error on failed submission", async () => {
    mockFetchSuccess();
    mockSignUpEmail.mockResolvedValue({
      error: { message: "Email already in use", status: 422 },
    });
    render(<RegisterPage />);
    const user = userEvent.setup();
    await fillWizard(user);
    await user.click(screen.getByRole("button", { name: /créer mon compte/i }));
    expect(
      await screen.findByText(
        "Ce compte existe déjà. Veuillez vous connecter.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Inscription en cours…")).not.toBeInTheDocument();
  });

  it("clears sessionStorage on successful registration", async () => {
    mockFetchSuccess();
    mockSignUpEmail.mockResolvedValue({ error: null });
    render(<RegisterPage />);
    const user = userEvent.setup();
    await fillWizard(user);
    sessionStorage.setItem("nba_register_test_before", "should-exist");
    await user.click(screen.getByRole("button", { name: /créer mon compte/i }));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });
    const remainingKeys = Object.keys(sessionStorage).filter((k) =>
      k.startsWith("nba_register"),
    );
    expect(remainingKeys).toHaveLength(0);
  });

  it("has a link to login page", async () => {
    mockFetchSuccess();
    render(<RegisterPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: /se connecter/i }),
      ).toHaveAttribute("href", "/login");
    });
  });
});
