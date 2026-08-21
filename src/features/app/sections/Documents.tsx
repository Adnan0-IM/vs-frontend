import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router"
import {
  fetchDocuments,
  revokeDocument,
  type SignedDocument,
} from "../api/documents"
import Layout from "../components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  Download02Icon,
  Cancel01Icon,
  QrCode01Icon,
  AddCircleIcon,
  Loading03Icon,
  Files02Icon,
  PrinterIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"

const Documents = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  // Modals state
  const [selectedQrDoc, setSelectedQrDoc] = useState<SignedDocument | null>(
    null
  )
  const [revokeConfirmDoc, setRevokeConfirmDoc] =
    useState<SignedDocument | null>(null)

  // Printing state
  const [isPrinting, setIsPrinting] = useState<string | null>(null)

  const handlePrintPdf = async (url: string, docId: string) => {
    setIsPrinting(docId)
    const toastId = toast.loading("Preparing document for print...")
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)

      const iframe = document.createElement("iframe")
      iframe.style.display = "none"
      iframe.src = blobUrl
      document.body.appendChild(iframe)

      iframe.onload = () => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        toast.success("Print dialog opened.", { id: toastId })
        setTimeout(() => {
          document.body.removeChild(iframe)
          URL.revokeObjectURL(blobUrl)
          setIsPrinting(null)
        }, 1000)
      }
    } catch (error) {
      console.error("Direct printing failed, opening in new tab", error)
      toast.info("Opening document in new tab for printing...", { id: toastId })
      window.open(url, "_blank")
      setIsPrinting(null)
    }
  }

  const { data: activeMember } = authClient.useActiveMember()

  // Check if current user is owner or admin in the organization
  const canRevoke =
    activeMember?.role === "owner" || activeMember?.role === "admin"

  // Fetch documents using React Query
  const {
    data: documents = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["documents", search, typeFilter, statusFilter],
    queryFn: () =>
      fetchDocuments({
        search: search || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
      }),
  })

  // Revoke document mutation
  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeDocument(id),
    onSuccess: () => {
      toast.success("Document has been successfully revoked.")
      queryClient.invalidateQueries({ queryKey: ["documents"] })
      setRevokeConfirmDoc(null)
    },
    onError: (err: unknown) => {
      const error = err as {
        response?: { data?: { error?: string } }
        message?: string
      }
      const errMsg =
        error.response?.data?.error ||
        error.message ||
        "Failed to revoke document"
      toast.error(errMsg)
    },
  })

  const handleRevoke = (doc: SignedDocument) => {
    if (!canRevoke) {
      toast.error(
        "Forbidden: Only organization owners and admins can revoke documents."
      )
      return
    }
    setRevokeConfirmDoc(doc)
  }

  const confirmRevoke = () => {
    if (revokeConfirmDoc) {
      revokeMutation.mutate(revokeConfirmDoc.id)
    }
  }

  const getVerificationUrl = (token: string) => {
    return `${window.location.origin}/verification?token=${token}`
  }

  const handleCopyLink = (token: string) => {
    const url = getVerificationUrl(token)
    navigator.clipboard.writeText(url)
    toast.success("Verification link copied to clipboard!")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes) return "0 Bytes"
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  }

  const getTypeBadgeStyles = (type: string) => {
    switch (type) {
      case "Certificate":
        return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
      case "Transcript":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      case "Letter":
        return "bg-sky-500/10 text-sky-500 border-sky-500/20"
      case "Diploma":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-500/20"
    }
  }

  return (
    <Layout>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Documents
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Manage, monitor, and issue cryptographically secure digital
              credentials.
            </p>
          </div>
          <Button asChild className="shrink-0 font-medium">
            <Link
              to="/dashboard/upload-document"
              className="flex items-center gap-2"
            >
              <HugeiconsIcon icon={AddCircleIcon} className="size-5" />
              Issue Document
            </Link>
          </Button>
        </div>

        {/* Filter bar */}
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row">
            <div className="relative flex-1">
              <HugeiconsIcon
                icon={Search01Icon}
                className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search by title or filename..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-2 md:w-auto">
              <select
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(
                    e.target.value === "__all_types__" ? "" : e.target.value
                  )
                }
                className="h-10 cursor-pointer rounded-md border border-input bg-transparent px-2.5 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="__all_types__">All Types</option>
                <option value="Certificate">Certificate</option>
                <option value="Transcript">Transcript</option>
                <option value="Letter">Letter</option>
                <option value="Diploma">Diploma</option>
                <option value="Other">Other</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value === "__all_statuses__" ? "" : e.target.value
                  )
                }
                className="h-10 cursor-pointer rounded-md border border-input bg-transparent px-2.5 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="__all_statuses__">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="REVOKED">Revoked</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Table/List area */}
        {isLoading ? (
          <div className="flex h-64 w-full items-center justify-center">
            <HugeiconsIcon
              icon={Loading03Icon}
              className="size-8 animate-spin text-primary"
              strokeWidth={2}
            />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive">
            Failed to load documents. Please check your connection or refresh
            the page.
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/10 p-12 text-center">
            <HugeiconsIcon
              icon={Files02Icon}
              className="mx-auto mb-3 size-12 text-muted-foreground/60"
              strokeWidth={1.5}
            />
            <h3 className="text-base font-semibold text-foreground">
              No documents found
            </h3>
            <p className="mx-auto mt-1 mb-4 max-w-sm text-sm text-muted-foreground">
              {search || typeFilter || statusFilter
                ? "No credentials match your active filters. Try adjusting your query."
                : "Your organization hasn't issued any digital credentials yet."}
            </p>
            {!search && !typeFilter && !statusFilter && (
              <Button asChild variant="outline" size="sm">
                <Link to="/dashboard/upload-document">
                  Upload your first document
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-medium text-muted-foreground">
                    <th className="p-4">Document</th>
                    <th className="p-4">Type</th>
                    <th className="hidden p-4 md:table-cell">Issued By</th>
                    <th className="hidden p-4 sm:table-cell">Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {documents.map((doc) => (
                    <tr
                      key={doc.id}
                      className="transition-colors hover:bg-muted/15"
                    >
                      <td className="p-4">
                        <div className="max-w-xs truncate font-semibold text-foreground sm:max-w-md">
                          {doc.title}
                        </div>
                        <div className="max-w-xs truncate text-xs text-muted-foreground sm:max-w-md">
                          {doc.originalFilename} ({formatBytes(doc.fileSize)})
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${getTypeBadgeStyles(doc.type)}`}
                        >
                          {doc.type}
                        </span>
                      </td>
                      <td className="hidden p-4 md:table-cell">
                        <div className="font-medium text-foreground">
                          {doc.signer?.name || "Unknown"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {doc.signer?.email}
                        </div>
                      </td>
                      <td className="hidden p-4 text-muted-foreground sm:table-cell">
                        {formatDate(doc.createdAt)}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            doc.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-rose-500/10 text-rose-500"
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Verification QR Code"
                            onClick={() => setSelectedQrDoc(doc)}
                            className="size-8 text-muted-foreground hover:text-foreground"
                          >
                            <HugeiconsIcon
                              icon={QrCode01Icon}
                              className="size-4"
                            />
                          </Button>
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            title="Download Signed File"
                            className="size-8 text-muted-foreground hover:text-primary"
                          >
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <HugeiconsIcon
                                icon={Download02Icon}
                                className="size-4"
                              />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Print Signed File"
                            disabled={isPrinting !== null}
                            onClick={() => handlePrintPdf(doc.fileUrl, doc.id)}
                            className="size-8 text-muted-foreground hover:text-primary"
                          >
                            {isPrinting === doc.id ? (
                              <HugeiconsIcon
                                icon={Loading03Icon}
                                className="size-4 animate-spin"
                              />
                            ) : (
                              <HugeiconsIcon
                                icon={PrinterIcon}
                                className="size-4"
                              />
                            )}
                          </Button>

                          {doc.status === "ACTIVE" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Revoke Credential"
                              disabled={!canRevoke}
                              onClick={() => handleRevoke(doc)}
                              className="size-8 text-muted-foreground hover:text-destructive disabled:opacity-30"
                            >
                              <HugeiconsIcon
                                icon={Cancel01Icon}
                                className="size-4"
                              />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {selectedQrDoc && (
        <div className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-background/80 p-4 backdrop-blur-sm duration-200 fade-in">
          <div className="w-full max-w-md animate-in overflow-hidden rounded-xl border border-border bg-card shadow-lg duration-200 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="flex items-center gap-2 font-semibold text-foreground">
                <HugeiconsIcon
                  icon={QrCode01Icon}
                  className="size-5 text-primary"
                />
                Verification Portal QR
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedQrDoc(null)}
                className="size-8"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </Button>
            </div>

            <div className="flex flex-col items-center gap-4 p-6 text-center">
              <div className="line-clamp-1 text-sm font-semibold text-foreground">
                {selectedQrDoc.title}
              </div>
              <p className="-mt-2 text-xs text-muted-foreground">
                Scan this code to verify document authenticity instantly.
              </p>

              <div className="rounded-lg border border-border bg-white p-3 shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    getVerificationUrl(selectedQrDoc.verificationToken)
                  )}`}
                  alt="Verification QR Code"
                  className="size-48"
                />
              </div>

              <div className="flex w-full flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3">
                <div className="text-left text-xs font-semibold text-foreground">
                  Verification URL:
                </div>
                <div className="text-left font-mono text-xs break-all text-muted-foreground select-all">
                  {getVerificationUrl(selectedQrDoc.verificationToken)}
                </div>
                <div className="mt-1 flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() =>
                      handleCopyLink(selectedQrDoc.verificationToken)
                    }
                  >
                    Copy Link
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    <a
                      href={getVerificationUrl(selectedQrDoc.verificationToken)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Visit Portal
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revocation Confirmation Modal */}
      {revokeConfirmDoc && (
        <div className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-background/80 p-4 backdrop-blur-sm duration-200 fade-in">
          <div className="w-full max-w-md animate-in overflow-hidden rounded-xl border border-border bg-card shadow-lg duration-200 zoom-in-95">
            <div className="space-y-4 p-6">
              <h3 className="text-lg font-semibold text-foreground">
                Revoke Digital Credential?
              </h3>
              <p className="text-sm leading-normal text-muted-foreground">
                Are you sure you want to revoke{" "}
                <span className="font-semibold text-foreground">
                  "{revokeConfirmDoc.title}"
                </span>
                ? This action is permanent. Once revoked, anyone scanning the QR
                code or verifying the file will see that this credential is no
                longer valid.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setRevokeConfirmDoc(null)}
                  disabled={revokeMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmRevoke}
                  disabled={revokeMutation.isPending}
                  className="font-medium"
                >
                  {revokeMutation.isPending
                    ? "Revoking..."
                    : "Revoke Credential"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default Documents
