import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, fireEvent } from "@/test/test-utils"
import userEvent from "@testing-library/user-event"
import OrgSetup from "../OrgSetup"
import { useCreateOrganization } from "../hooks/use-create-organization"
import { createOrganization } from "../api/organization"

const mockNavigate = vi.fn()
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock("../hooks/use-create-organization", () => ({
  useCreateOrganization: vi.fn(),
}))

vi.mock("../api/organization", () => ({
  createOrganization: vi.fn(),
}))

describe("OrgSetup (Organization Creation)", () => {
  let mutateAsync: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockReset()
    mutateAsync = vi
      .fn()
      .mockResolvedValue({ id: "org-1", name: "Acme Inc", slug: "acme-inc" })
    ;(useCreateOrganization as any).mockReturnValue({
      mutateAsync,
      isPending: false,
    })
  })

  it("renders the organization creation form", () => {
    render(<OrgSetup />)
    expect(
      screen.getByText("Create your organization")
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText("Organization Name")
    ).toBeInTheDocument()
    expect(screen.getByText("Organization Type")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Create organization" })
    ).toBeInTheDocument()
  })

  it("validates that the organization name is required", async () => {
    const user = userEvent.setup()
    render(<OrgSetup />)

    fireEvent.click(screen.getByRole("button", { name: "Create organization" }))

    await waitFor(() => {
      expect(
        screen.getByText(
          "Organization name must be at least 2 characters."
        )
      ).toBeInTheDocument()
    })
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it("creates the organization and navigates to the dashboard", async () => {
    const user = userEvent.setup()
    render(<OrgSetup />)

    const nameInput = screen.getByLabelText("Organization Name")
    await user.type(nameInput, "Acme Inc")
    await user.click(screen.getByRole("button", { name: "Create organization" }))

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        organizationName: "Acme Inc",
        organizationType: "company",
        organizationLogo: undefined,
      })
    })
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard")
    })
    expect(
      screen.getByText("Organization created successfully.")
    ).toBeInTheDocument()
  })

  it("displays an error message when organization creation fails", async () => {
    const user = userEvent.setup()
    mutateAsync.mockRejectedValueOnce(new Error("Organization name is taken"))

    render(<OrgSetup />)

    await user.type(screen.getByLabelText("Organization Name"), "Acme Inc")
    await user.click(screen.getByRole("button", { name: "Create organization" }))

    await waitFor(() => {
      expect(
        screen.getByText("Organization name is taken")
      ).toBeInTheDocument()
    })
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it("shows loading text while the mutation is pending", () => {
    ;(useCreateOrganization as any).mockReturnValue({
      mutateAsync,
      isPending: true,
    })

    render(<OrgSetup />)

    expect(
      screen.getByRole("button", { name: "Creating..." })
    ).toBeDisabled()
  })
})
