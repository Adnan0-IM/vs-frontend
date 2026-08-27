import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@/test/test-utils"
import userEvent from "@testing-library/user-event"
import Members from "../sections/Members"
import { toast } from "sonner"

const orgPlugin = vi.hoisted(() => ({
  listMembers: vi.fn().mockResolvedValue({ data: { members: [] }, error: null }),
  listInvitations: vi.fn().mockResolvedValue({ data: [], error: null }),
  inviteMember: vi.fn().mockResolvedValue({ error: null }),
  cancelInvitation: vi.fn().mockResolvedValue({ error: null }),
  removeMember: vi.fn().mockResolvedValue({ error: null }),
  updateMemberRole: vi.fn().mockResolvedValue({ error: null }),
  create: vi.fn(),
  setActive: vi.fn(),
  list: vi.fn().mockResolvedValue({
    data: [{ id: "org-1", name: "Test Org" }],
    error: null,
  }),
  update: vi.fn(),
  delete: vi.fn(),
}))

const ac = vi.hoisted(() => ({
  activeMember: vi.fn().mockReturnValue({ data: { role: "owner", id: "owner-1" } }),
  activeOrganization: vi.fn().mockReturnValue({
    data: { id: "org-1", name: "Test Org", slug: "test-org" },
    isPending: false,
    refetch: vi.fn(),
  }),
  listOrganizations: vi.fn().mockReturnValue({
    data: [
      {
        id: "org-1",
        name: "Test Org",
        logo: null,
        metadata: JSON.stringify({ type: "company" }),
      },
    ],
    isPending: false,
  }),
  session: vi.fn().mockReturnValue({
    data: { user: { id: "u1", name: "Test User", email: "t@example.com" } },
  }),
  signOut: vi.fn().mockResolvedValue({}),
  getSession: vi.fn().mockResolvedValue({ data: { session: { token: "t" } } }),
}))

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useActiveMember: ac.activeMember,
    useActiveOrganization: ac.activeOrganization,
    useListOrganizations: ac.listOrganizations,
    useSession: ac.session,
    signOut: ac.signOut,
    getSession: ac.getSession,
    updateUser: vi.fn().mockResolvedValue({ error: null }),
    changePassword: vi.fn().mockResolvedValue({ error: null }),
    deleteUser: vi.fn().mockResolvedValue({ error: null }),
    organization: orgPlugin,
  },
}))

vi.mock("sonner", () => ({
  toast: {
    loading: vi.fn().mockReturnValue("toast-id"),
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}))

const members = [
  {
    id: "owner-1",
    role: "owner",
    createdAt: "2025-01-01T00:00:00.000Z",
    user: { name: "Ada Owner", email: "ada@example.com", image: null },
  },
  {
    id: "member-2",
    role: "member",
    createdAt: "2025-02-01T00:00:00.000Z",
    user: { name: "Bob Member", email: "bob@example.com", image: null },
  },
]

describe("Members Section", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ac.activeMember.mockReturnValue({ data: { role: "owner", id: "owner-1" } })
    ac.activeOrganization.mockReturnValue({
      data: { id: "org-1", name: "Test Org", slug: "test-org" },
      isPending: false,
      refetch: vi.fn(),
    })
    orgPlugin.listMembers.mockResolvedValue({ data: { members: [] }, error: null })
    orgPlugin.listInvitations.mockResolvedValue({ data: [], error: null })
    orgPlugin.inviteMember.mockResolvedValue({ error: null })
  })

  it("renders active members with role information", async () => {
    orgPlugin.listMembers.mockResolvedValue({ data: { members }, error: null })

    render(<Members />)

    expect(
      await screen.findByText("Members & Organization Access")
    ).toBeInTheDocument()
    expect(await screen.findByText("Ada Owner")).toBeInTheDocument()
    expect(screen.getByText("Bob Member")).toBeInTheDocument()
    expect(screen.getByText("OWNER")).toBeInTheDocument()
    expect(screen.getByText("MEMBER")).toBeInTheDocument()
    expect(screen.getAllByText("ada@example.com").length).toBeGreaterThan(0)
  })

  it("hides administrative actions for members without privileges", async () => {
    ac.activeMember.mockReturnValue({ data: { role: "member", id: "member-2" } })
    orgPlugin.listMembers.mockResolvedValue({ data: { members }, error: null })

    render(<Members />)

    await screen.findByText("Ada Owner")
    expect(screen.queryByText("Invite Member")).not.toBeInTheDocument()
    expect(screen.queryByText("Pending Invitations")).not.toBeInTheDocument()
  })

  it("shows the invite section to owners/admins", async () => {
    render(<Members />)

    expect(await screen.findByText("Invite Member")).toBeInTheDocument()
    expect(screen.getByText("Pending Invitations")).toBeInTheDocument()
  })

  it("renders an empty state when there are no members", async () => {
    render(<Members />)

    expect(await screen.findByText("No active members found.")).toBeInTheDocument()
  })

  it("invites a member and shows a success toast", async () => {
    const user = userEvent.setup()
    render(<Members />)

    await user.type(await screen.findByLabelText("Email Address"), "new@example.com")
    await user.click(screen.getByRole("button", { name: "Send Invite" }))

    await waitFor(() => {
      expect(orgPlugin.inviteMember).toHaveBeenCalledWith({
        email: "new@example.com",
        role: "member",
        organizationId: "org-1",
      })
    })
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Invitation sent successfully!",
        { id: "toast-id" }
      )
    })
  })

  it("displays an error when inviting fails", async () => {
    orgPlugin.inviteMember.mockRejectedValueOnce(new Error("Invalid email"))

    const user = userEvent.setup()
    render(<Members />)

    await user.type(
      await screen.findByLabelText("Email Address"),
      "bad@example.com"
    )
    await user.click(screen.getByRole("button", { name: "Send Invite" }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid email", {
        id: "toast-id",
      })
    })
  })

  it("displays pending invitations with a cancel action", async () => {
    orgPlugin.listInvitations.mockResolvedValue({
      data: [
        {
          id: "inv-1",
          email: "pending@example.com",
          role: "admin",
          expiresAt: "2025-06-01T00:00:00.000Z",
        },
      ],
      error: null,
    })
    orgPlugin.cancelInvitation.mockResolvedValue({ error: null })

    render(<Members />)

    expect(await screen.findByText("pending@example.com")).toBeInTheDocument()
    expect(screen.getByText("ADMIN")).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByTitle("Cancel Invitation"))

    await waitFor(() => {
      expect(orgPlugin.cancelInvitation).toHaveBeenCalledWith({
        invitationId: "inv-1",
      })
    })
  })

  it("removes a member after confirmation", async () => {
    orgPlugin.listMembers.mockResolvedValue({ data: { members }, error: null })
    vi.spyOn(window, "confirm").mockReturnValue(true)
    orgPlugin.removeMember.mockResolvedValue({ error: null })

    render(<Members />)

    await screen.findByText("Bob Member")

    const removeButtons = screen.getAllByTitle("Remove User")
    await userEvent.setup().click(removeButtons[0])

    await waitFor(() => {
      expect(orgPlugin.removeMember).toHaveBeenCalled()
    })
  })
})
