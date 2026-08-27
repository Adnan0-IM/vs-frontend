import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@/test/test-utils"
import userEvent from "@testing-library/user-event"
import { SignInForm } from "../components/SignInForm"
import { SignUpForm } from "../components/SignUpForm"
import { signIn } from "../api/sign-in"
import { signUp } from "../api/sign-up"

// Mock the API functions
vi.mock("../api/sign-in", () => ({
  signIn: vi.fn() as any,
}))

vi.mock("../api/sign-up", () => ({
  signUp: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams()],
  }
})

describe("Authentication Components", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockReset()
  })

  describe("SignInForm", () => {
    it("renders the sign-in form correctly", () => {
      render(<SignInForm />)

      expect(screen.getByText("Login to your account")).toBeInTheDocument()
      expect(screen.getByLabelText("Email")).toBeInTheDocument()
      expect(screen.getByLabelText("Password")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument()
      expect(screen.getByText("Login with Google")).toBeInTheDocument()
      expect(screen.getByText("Don't have an account?")).toBeInTheDocument()
    })

    it("validates required fields", async () => {
      const user = userEvent.setup()
      render(<SignInForm />)
      const submitButton = screen.getByRole("button", { name: "Login" })

      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText("Email must be at least 5 characters.")
        ).toBeInTheDocument()
        expect(
          screen.getByText("Password must be at least 8 characters.")
        ).toBeInTheDocument()
      })
    })

    it("validates email format", async () => {
      const user = userEvent.setup()
      render(<SignInForm />)
      const emailInput = screen.getByLabelText("Email")
      const submitButton = screen.getByRole("button", { name: "Login" })

      await user.type(emailInput, "invalid-email")
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText("Invalid email")).toBeInTheDocument()
      })
    })

    it("submits the form with valid data", async () => {
      ;(signIn as unknown as vi.Mock).mockResolvedValueOnce({})
      const user = userEvent.setup()
      render(<SignInForm />)
      const emailInput = screen.getByLabelText("Email")
      const passwordInput = screen.getByLabelText("Password")
      const submitButton = screen.getByRole("button", { name: "Login" })

      await user.type(emailInput, "test@example.com")
      await user.type(passwordInput, "password123")
      await user.click(submitButton)

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
        })
      })
    })

    it("shows error message when sign-in fails", async () => {
      const user = userEvent.setup()
      ;(signIn as unknown as vi.Mock).mockRejectedValueOnce(
        new Error("Invalid credentials")
      )
      render(<SignInForm />)
      const emailInput = screen.getByLabelText("Email")
      const passwordInput = screen.getByLabelText("Password")
      const submitButton = screen.getByRole("button", { name: "Login" })

      await user.type(emailInput, "test@example.com")
      await user.type(passwordInput, "wrongpassword")
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText("Invalid credentials")).toBeInTheDocument()
      })
    })

    it("navigates to the dashboard after a successful sign-in", async () => {
      const user = userEvent.setup()
      ;(signIn as unknown as vi.Mock).mockResolvedValueOnce({})
      render(<SignInForm />)
      const emailInput = screen.getByLabelText("Email")
      const passwordInput = screen.getByLabelText("Password")

      await user.type(emailInput, "test@example.com")
      await user.type(passwordInput, "password123")
      await user.click(screen.getByRole("button", { name: "Login" }))

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard")
      })
    })

    it("calls signIn only once when login succeeds", async () => {
      const user = userEvent.setup()
      ;(signIn as unknown as vi.Mock).mockResolvedValueOnce({})
      render(<SignInForm />)

      await user.type(screen.getByLabelText("Email"), "a@example.com")
      await user.type(screen.getByLabelText("Password"), "password123")
      await user.click(screen.getByRole("button", { name: "Login" }))

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe("SignUpForm", () => {
    it("renders the sign-up form correctly", () => {
      render(<SignUpForm />)

      expect(screen.getByText("Create your account")).toBeInTheDocument()
      expect(screen.getByLabelText("Full Name")).toBeInTheDocument()
      expect(screen.getByLabelText("Email")).toBeInTheDocument()
      expect(screen.getByLabelText("Password")).toBeInTheDocument()
      expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: "Create Account" })
      ).toBeInTheDocument()
      expect(screen.getByText("Already have an account?")).toBeInTheDocument()
    })

    it("validates required fields", async () => {
      const user = userEvent.setup()
      render(<SignUpForm />)
      const submitButton = screen.getByRole("button", {
        name: "Create Account",
      })

      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText("Name must be at least 2 characters.")
        ).toBeInTheDocument()
        expect(
          screen.getByText("Email must be at least 5 characters.")
        ).toBeInTheDocument()
        expect(
          screen.getByText("Password must be at least 8 characters.")
        ).toBeInTheDocument()
        expect(
          screen.getByText("Confirm Password must be at least 8 characters.")
        ).toBeInTheDocument()
      })
    })

    it("validates email format", async () => {
      const user = userEvent.setup()
      render(<SignUpForm />)
      const emailInput = screen.getByLabelText("Email")
      const submitButton = screen.getByRole("button", {
        name: "Create Account",
      })

      await user.type(emailInput, "invalid-email")
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText("Invalid email")).toBeInTheDocument()
      })
    })

    it("validates password match", async () => {
      const user = userEvent.setup()
      render(<SignUpForm />)
      const passwordInput = screen.getByLabelText("Password")
      const confirmPasswordInput = screen.getByLabelText("Confirm Password")
      const submitButton = screen.getByRole("button", {
        name: "Create Account",
      })

      await user.type(passwordInput, "password123")
      await user.type(confirmPasswordInput, "differentpassword")
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText("Passwords do not match.")).toBeInTheDocument()
      })
    })

    it("submits the form with valid data", async () => {
      const user = userEvent.setup()
      ;(signUp as unknown as vi.Mock).mockResolvedValueOnce({})
      render(<SignUpForm />)
      const nameInput = screen.getByLabelText("Full Name")
      const emailInput = screen.getByLabelText("Email")
      const passwordInput = screen.getByLabelText("Password")
      const confirmPasswordInput = screen.getByLabelText("Confirm Password")
      const submitButton = screen.getByRole("button", {
        name: "Create Account",
      })

      await user.type(nameInput, "Test User")
      await user.type(emailInput, "test@example.com")
      await user.type(passwordInput, "password123")
      await user.type(confirmPasswordInput, "password123")
      await user.click(submitButton)

      await waitFor(() => {
        expect(signUp).toHaveBeenCalledWith({
          name: "Test User",
          email: "test@example.com",
          password: "password123",
        })
      })
    })

    it("shows error message when sign-up fails", async () => {
      const user = userEvent.setup()
      ;(signUp as unknown as vi.Mock).mockRejectedValueOnce(
        new Error("Email already exists")
      )
      render(<SignUpForm />)
      const nameInput = screen.getByLabelText("Full Name")
      const emailInput = screen.getByLabelText("Email")
      const passwordInput = screen.getByLabelText("Password")
      const confirmPasswordInput = screen.getByLabelText("Confirm Password")
      const submitButton = screen.getByRole("button", {
        name: "Create Account",
      })

      await user.type(nameInput, "Test User")
      await user.type(emailInput, "existing@example.com")
      await user.type(passwordInput, "password123")
      await user.type(confirmPasswordInput, "password123")
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText("Email already exists")).toBeInTheDocument()
      })
    })
  })
})
