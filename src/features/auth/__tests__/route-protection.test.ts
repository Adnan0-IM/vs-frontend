import { describe, it, expect, vi, beforeEach } from "vitest"
import { requireAuth } from "@/router/AppRouter"

const getSession = vi.hoisted(() => vi.fn())
const listOrganizations = vi.hoisted(() => vi.fn())
const setActive = vi.hoisted(() => vi.fn())

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    getSession: getSession,
    organization: {
      list: listOrganizations,
      setActive: setActive,
    },
  },
}))

const authedUser = {
  data: {
    session: {
      token: "session-token",
      activeOrganizationId: "org-1",
    },
  },
  error: null,
}

// requireAuth throws the response returned by react-router's redirect() on
// failure. Capture it to inspect the Location header.
async function expectRedirect(
  promise: Promise<unknown>,
  locationPredicate: (location: string) => void
) {
  try {
    await promise
    throw new Error("expected requireAuth to redirect")
  } catch (err: any) {
    const location = err.headers?.get("Location")
    locationPredicate(location)
  }
}

describe("requireAuth route protection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSession.mockReset()
    listOrganizations.mockReset()
    setActive.mockReset()
  })

  const request = (path: string) =>
    new Request(`https://app.veridoc.example${path}`)

  it("redirects unauthenticated users to sign-in with the original path", async () => {
    getSession.mockResolvedValueOnce({ data: { session: null }, error: null })

    await expectRedirect(requireAuth({ request: request("/dashboard/documents") }), (location) => {
      expect(location).toContain("/auth/sign-in?redirectTo=")
      expect(location).toContain(encodeURIComponent("/dashboard/documents"))
    })
  })

  it("redirects unauthenticated users when getSession returns an error", async () => {
    getSession.mockResolvedValueOnce({ data: null, error: new Error("no session") })

    await expectRedirect(requireAuth({ request: request("/dashboard") }), (location) => {
      expect(location).toContain("/auth/sign-in?redirectTo=")
    })
  })

  it("allows an authenticated user with organizations to access protected pages", async () => {
    getSession.mockResolvedValueOnce(authedUser)
    listOrganizations.mockResolvedValueOnce({
      data: [{ id: "org-1", name: "Test Org" }],
      error: null,
    })

    const token = await requireAuth({ request: request("/dashboard/documents") })

    expect(token).toBe("session-token")
  })

  it("sets an active organization when an authenticated user has none set", async () => {
    getSession.mockResolvedValueOnce({
      data: {
        session: { token: "t", activeOrganizationId: null },
      },
      error: null,
    })
    listOrganizations.mockResolvedValueOnce({
      data: [{ id: "org-1", name: "Test Org" }],
      error: null,
    })
    setActive.mockResolvedValueOnce({ error: null })

    const token = await requireAuth({ request: request("/dashboard") })

    expect(setActive).toHaveBeenCalledWith({ organizationId: "org-1" })
    expect(token).toBe("t")
  })

  it("sends users with no organizations to org setup", async () => {
    getSession.mockResolvedValueOnce(authedUser)
    listOrganizations.mockResolvedValueOnce({ data: [], error: null })

    await expectRedirect(requireAuth({ request: request("/dashboard") }), (location) => {
      expect(location).toBe("/dashboard/org-setup")
    })
  })

  it("does not redirect users already on org setup when they have no organizations", async () => {
    getSession.mockResolvedValueOnce(authedUser)
    listOrganizations.mockResolvedValueOnce({ data: [], error: null })

    const token = await requireAuth({
      request: request("/dashboard/org-setup"),
    })
    expect(token).toBe("session-token")
  })
})
