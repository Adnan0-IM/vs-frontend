import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@/test/test-utils"
import VerificationLogs from "../sections/VerificationLogs"
import { fetchVerificationLogs } from "../api/documents"

vi.mock("../api/documents", () => ({
  fetchVerificationLogs: vi.fn(),
}))

const makeLog = (overrides: Record<string, any> = {}) => ({
  id: "log-1",
  documentId: "doc-1",
  verificationType: "QR_SCAN",
  verificationResult: "VERIFIED",
  verifiedByUserId: "user-1",
  ipAddress: "192.168.1.1",
  userAgent: "Chrome/120.0",
  verificationTimestamp: "2025-01-01T10:00:00.000Z",
  document: {
    title: "Graduation Certificate",
    originalFilename: "cert.pdf",
    type: "Certificate",
  },
  ...overrides,
})

describe("VerificationLogs Section", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders logs with verification type, result and timestamp", async () => {
    fetchVerificationLogs.mockResolvedValueOnce([
      makeLog(),
      makeLog({
        id: "log-2",
        verificationType: "FILE_UPLOAD",
        verificationResult: "TAMPERED",
        ipAddress: "10.0.0.5",
        userAgent: "Firefox/120.0",
      }),
    ])

    render(<VerificationLogs />)

    expect((await screen.findAllByText(/Verification Logs/)).length).toBeGreaterThan(0)
    expect((await screen.findAllByText("Graduation Certificate")).length).toBe(2)
    expect(screen.getAllByText(/cert\.pdf/).length).toBeGreaterThan(0)

    // Verification types rendered as readable labels
    expect(screen.getByText("QR Code Scan")).toBeInTheDocument()
    expect(screen.getByText("PDF File Upload")).toBeInTheDocument()

    // Results rendered
    expect(screen.getByText("VERIFIED")).toBeInTheDocument()
    expect(screen.getByText("TAMPERED")).toBeInTheDocument()

    // IPs rendered
    expect(screen.getByText("192.168.1.1")).toBeInTheDocument()
    expect(screen.getByText("10.0.0.5")).toBeInTheDocument()

    // Parsed user agents
    expect(screen.getAllByText("Chrome").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Firefox").length).toBeGreaterThan(0)

    // Timestamps formatted
    expect(screen.getAllByText(/Jan 1, 2025/).length).toBeGreaterThan(0)
  })

  it("renders an empty state when there are no verification logs", async () => {
    fetchVerificationLogs.mockResolvedValueOnce([])

    render(<VerificationLogs />)

    expect(
      await screen.findByText("No verification attempts yet")
    ).toBeInTheDocument()
  })

  it("shows an error message when the logs API fails", async () => {
    fetchVerificationLogs.mockRejectedValueOnce(new Error("Network error"))

    render(<VerificationLogs />)

    expect(
      await screen.findByText(
        "Failed to load verification logs. Please check your connection or refresh the page."
      )
    ).toBeInTheDocument()
  })

  it("handles logs without document metadata", async () => {
    fetchVerificationLogs.mockResolvedValueOnce([
      makeLog({ document: undefined, ipAddress: null, userAgent: null }),
    ])

    render(<VerificationLogs />)

    expect(
      await screen.findByText("Deleted/Missing Document")
    ).toBeInTheDocument()
    expect(screen.getByText("Unknown Browser")).toBeInTheDocument()
    expect(screen.getByText("Unknown")).toBeInTheDocument()
  })

  it("shows a loading state while verification logs are being fetched", () => {
    fetchVerificationLogs.mockImplementationOnce(
      () => new Promise(() => {})
    )

    const { unmount } = render(<VerificationLogs />)

    expect(
      document.querySelector(".animate-spin")
    ).toBeInTheDocument()
    expect(
      screen.queryByText("No verification attempts yet")
    ).not.toBeInTheDocument()

    unmount()
  })
})
