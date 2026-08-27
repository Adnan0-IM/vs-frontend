import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, fireEvent } from "@/test/test-utils"
import Documents from "../sections/Documents"
import { fetchDocuments, revokeDocument } from "../api/documents"
import { toast } from "sonner"

const ac = vi.hoisted(() => ({
  activeMember: vi.fn().mockReturnValue({ data: { role: "owner", id: "m1" } }),
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

vi.mock("../api/documents", () => ({
  fetchDocuments: vi.fn(),
  revokeDocument: vi.fn(),
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

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useActiveMember: ac.activeMember,
    useListOrganizations: ac.listOrganizations,
    useSession: ac.session,
    useActiveOrganization: vi.fn().mockReturnValue({
      data: { id: "org-1", name: "Test Org" },
      isPending: false,
    }),
    signOut: ac.signOut,
    getSession: ac.getSession,
    updateUser: vi.fn().mockResolvedValue({ error: null }),
    changePassword: vi.fn().mockResolvedValue({ error: null }),
    deleteUser: vi.fn().mockResolvedValue({ error: null }),
    organization: {
      listMembers: vi.fn().mockResolvedValue({ data: { members: [] }, error: null }),
      listInvitations: vi.fn().mockResolvedValue({ data: [], error: null }),
      inviteMember: vi.fn().mockResolvedValue({ error: null }),
      cancelInvitation: vi.fn().mockResolvedValue({ error: null }),
      removeMember: vi.fn().mockResolvedValue({ error: null }),
      updateMemberRole: vi.fn().mockResolvedValue({ error: null }),
      create: vi.fn().mockResolvedValue({
        data: { id: "org-1", name: "Test Org", slug: "test-org" },
        error: null,
      }),
      setActive: vi.fn().mockResolvedValue({ error: null }),
      list: vi.fn().mockResolvedValue({
        data: [{ id: "org-1", name: "Test Org" }],
        error: null,
      }),
      update: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}))

Object.assign(navigator, {
  clipboard: { writeText: vi.fn() },
})

const makeDoc = (overrides: Record<string, any> = {}) => ({
  id: "doc-1",
  organizationId: "org-1",
  signedBy: "user-1",
  title: "Graduation Certificate",
  originalFilename: "cert.pdf",
  fileUrl: "https://example.com/cert.pdf",
  mimeType: "application/pdf",
  fileSize: 1024 * 1024,
  type: "Certificate",
  documentHash: "hash123",
  digitalSignature: "sig123",
  verificationToken: "token123",
  status: "ACTIVE",
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
  signer: { id: "user-1", name: "Jane Signer", email: "jane@example.com" },
  ...overrides,
})

describe("Documents Section", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ac.activeMember.mockReturnValue({ data: { role: "owner", id: "m1" } })
    ac.listOrganizations.mockReturnValue({
      data: [
        {
          id: "org-1",
          name: "Test Org",
          logo: null,
          metadata: JSON.stringify({ type: "company" }),
        },
      ],
      isPending: false,
    })
  })

  it("renders loading state then documents", async () => {
    fetchDocuments.mockImplementationOnce(
      () => new Promise(() => {})
    )

    const { unmount } = render(<Documents />)

    expect(screen.getAllByText("Documents").length).toBeGreaterThan(0)

    unmount()

    fetchDocuments.mockResolvedValueOnce([makeDoc()])
    render(<Documents />)
    expect(
      await screen.findByText("Graduation Certificate")
    ).toBeInTheDocument()
  })

  it("renders an empty state when there are no documents", async () => {
    fetchDocuments.mockResolvedValueOnce([])

    render(<Documents />)

    expect(
      await screen.findByText(/No documents found/)
    ).toBeInTheDocument()
  })

  it("shows an error message when the documents API fails", async () => {
    fetchDocuments.mockRejectedValueOnce(new Error("Network error"))

    render(<Documents />)

    expect(
      await screen.findByText(
        "Failed to load documents. Please check your connection or refresh the page."
      )
    ).toBeInTheDocument()
  })

  it("renders document metadata, statuses and signer information", async () => {
    fetchDocuments.mockResolvedValueOnce([
      makeDoc(),
      makeDoc({ id: "doc-2", title: "Revoked Diploma", status: "REVOKED" }),
    ])

    render(<Documents />)

    expect(await screen.findByText("Graduation Certificate")).toBeInTheDocument()
    expect(screen.getByText("Revoked Diploma")).toBeInTheDocument()
    expect(screen.getAllByText("Certificate").length).toBeGreaterThan(0)
    expect(screen.getAllByText("ACTIVE").length).toBe(1)
    expect(screen.getAllByText("REVOKED").length).toBe(1)
    expect(screen.getAllByText(/cert\.pdf/).length).toBeGreaterThan(0)
    expect(screen.getAllByText("Jane Signer").length).toBeGreaterThan(0)
    expect(screen.getAllByText(/1 MB/).length).toBeGreaterThan(0)
  })

  it("filters documents by search query", async () => {
    fetchDocuments.mockResolvedValueOnce([])

    render(<Documents />)

    const searchInput = screen.getByPlaceholderText(/Search by title or filename/)
    fireEvent.change(searchInput, { target: { value: "cert" } })

    await waitFor(() => {
      expect(fetchDocuments).toHaveBeenCalledWith({ search: "cert" })
    })
  })

  it("opens the QR code modal for a document", async () => {
    fetchDocuments.mockResolvedValueOnce([makeDoc()])

    render(<Documents />)

    fireEvent.click(await screen.findByTitle("Verification QR Code"))

    expect(screen.getByText("Verification Portal QR")).toBeInTheDocument()
    expect(screen.getByAltText("Verification QR Code")).toBeInTheDocument()
  })

  it("does not show the revoke action for REVOKED documents", async () => {
    fetchDocuments.mockResolvedValueOnce([makeDoc({ status: "REVOKED" })])

    render(<Documents />)

    await screen.findByText("Graduation Certificate")
    expect(screen.queryByTitle("Revoke Credential")).not.toBeInTheDocument()
  })
})

describe("Documents Section - Revocation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("lets an owner revoke an ACTIVE document with confirmation", async () => {
    ac.activeMember.mockReturnValue({ data: { role: "owner", id: "m1" } })
    fetchDocuments.mockResolvedValueOnce([makeDoc()])
    revokeDocument.mockResolvedValueOnce(true)

    render(<Documents />)

    fireEvent.click(await screen.findByTitle("Revoke Credential"))

    expect(screen.getByText("Revoke Digital Credential?")).toBeInTheDocument()

    fireEvent.click(screen.getByText("Revoke Credential"))

    await waitFor(() => {
      expect(revokeDocument).toHaveBeenCalledWith("doc-1")
    })
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Document has been successfully revoked."
      )
    })
  })

  it("does not open the confirmation modal when a member clicks revoke", async () => {
    ac.activeMember.mockReturnValue({ data: { role: "member", id: "m1" } })
    fetchDocuments.mockResolvedValueOnce([makeDoc()])

    render(<Documents />)

    const revokeButton = (await screen.findByTitle(
      "Revoke Credential"
    )) as HTMLButtonElement
    fireEvent.click(revokeButton)

    expect(
      screen.queryByText("Revoke Digital Credential?")
    ).not.toBeInTheDocument()
  })

  it("disables the revoke button for non-admin members", async () => {
    ac.activeMember.mockReturnValue({ data: { role: "member", id: "m1" } })
    fetchDocuments.mockResolvedValueOnce([makeDoc()])

    render(<Documents />)

    const revokeButton = (await screen.findByTitle(
      "Revoke Credential"
    )) as HTMLButtonElement
    expect(revokeButton.disabled).toBe(true)
  })

  it("displays an error message when revocation fails", async () => {
    ac.activeMember.mockReturnValue({ data: { role: "admin", id: "m1" } })
    fetchDocuments.mockResolvedValueOnce([makeDoc()])
    revokeDocument.mockRejectedValueOnce(new Error("Failed to revoke document"))

    render(<Documents />)

    fireEvent.click(await screen.findByTitle("Revoke Credential"))
    fireEvent.click(screen.getByText("Revoke Credential"))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to revoke document")
    })
  })

  it("cancels the revocation when Cancel is clicked", async () => {
    ac.activeMember.mockReturnValue({ data: { role: "owner", id: "m1" } })
    fetchDocuments.mockResolvedValueOnce([makeDoc()])

    render(<Documents />)

    fireEvent.click(await screen.findByTitle("Revoke Credential"))
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(
      screen.queryByText("Revoke Digital Credential?")
    ).not.toBeInTheDocument()
    expect(revokeDocument).not.toHaveBeenCalled()
  })
})
