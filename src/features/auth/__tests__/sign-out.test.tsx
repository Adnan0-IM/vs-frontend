import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@/test/test-utils"
import userEvent from "@testing-library/user-event"
import SignOutButton from "../components/SignOutButton"

const signOut = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ error: null })
)
const mockNavigate = vi.hoisted(() => vi.fn())

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signOut: (opts: { fetchOptions?: { onSuccess?: () => void } }) => {
      const result = signOut()
      result.then(() => opts.fetchOptions?.onSuccess?.())
      return result
    },
  },
}))

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe("SignOutButton", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockReset()
    signOut.mockClear()
  })

  it("renders a sign out button", () => {
    render(<SignOutButton />)
    expect(screen.getByRole("button", { name: "Sign Out" })).toBeInTheDocument()
  })

  it("signs out and navigates to the sign-in page", async () => {
    const user = userEvent.setup()
    render(<SignOutButton />)

    await user.click(screen.getByRole("button", { name: "Sign Out" }))

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith("/auth/sign-in")
    })
  })
})
