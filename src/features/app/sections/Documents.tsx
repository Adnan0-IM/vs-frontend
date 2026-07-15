import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router"
import { fetchDocuments, revokeDocument, type SignedDocument } from "../api/documents"
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
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"

const Documents = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  
  // Modals state
  const [selectedQrDoc, setSelectedQrDoc] = useState<SignedDocument | null>(null)
  const [revokeConfirmDoc, setRevokeConfirmDoc] = useState<SignedDocument | null>(null)

  const { data: activeMember } = authClient.useActiveMember()
  
  // Check if current user is owner or admin in the organization
  const canRevoke = activeMember?.role === "owner" || activeMember?.role === "admin"

  // Fetch documents using React Query
  const { data: documents = [], isLoading, error } = useQuery({
    queryKey: ["documents", search, typeFilter, statusFilter],
    queryFn: () => fetchDocuments({
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
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      const errMsg = error.response?.data?.error || error.message || "Failed to revoke document";
      toast.error(errMsg)
    },
  })

  const handleRevoke = (doc: SignedDocument) => {
    if (!canRevoke) {
      toast.error("Forbidden: Only organization owners and admins can revoke documents.")
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
            <p className="max-w-2xl text-muted-foreground text-sm">
              Manage, monitor, and issue cryptographically secure digital credentials.
            </p>
          </div>
          <Button asChild className="shrink-0 font-medium">
            <Link to="/dashboard/upload-document" className="flex items-center gap-2">
              <HugeiconsIcon icon={AddCircleIcon} className="size-5" />
              Issue Document
            </Link>
          </Button>
        </div>

        {/* Filter bar */}
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-4 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <HugeiconsIcon
                icon={Search01Icon}
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
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
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Types</option>
                <option value="Certificate">Certificate</option>
                <option value="Transcript">Transcript</option>
                <option value="Letter">Letter</option>
                <option value="Diploma">Diploma</option>
                <option value="Other">Other</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="REVOKED">Revoked</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Table/List area */}
        {isLoading ? (
          <div className="flex h-64 w-full items-center justify-center">
            <HugeiconsIcon icon={Loading03Icon} className="size-8 text-primary animate-spin" strokeWidth={2} />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive">
            Failed to load documents. Please check your connection or refresh the page.
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/10 p-12 text-center">
            <HugeiconsIcon icon={Files02Icon} className="mx-auto size-12 text-muted-foreground/60 mb-3" strokeWidth={1.5} />
            <h3 className="text-base font-semibold text-foreground">No documents found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
              {search || typeFilter || statusFilter
                ? "No credentials match your active filters. Try adjusting your query."
                : "Your organization hasn't issued any digital credentials yet."}
            </p>
            {!search && !typeFilter && !statusFilter && (
              <Button asChild variant="outline" size="sm">
                <Link to="/dashboard/upload-document">Upload your first document</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground font-medium">
                    <th className="p-4">Document</th>
                    <th className="p-4">Type</th>
                    <th className="p-4 hidden md:table-cell">Issued By</th>
                    <th className="p-4 hidden sm:table-cell">Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-muted/15 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-foreground truncate max-w-xs sm:max-w-md">
                          {doc.title}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-xs sm:max-w-md">
                          {doc.originalFilename} ({formatBytes(doc.fileSize)})
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border ${getTypeBadgeStyles(doc.type)}`}>
                          {doc.type}
                        </span>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <div className="text-foreground font-medium">{doc.signer?.name || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground">{doc.signer?.email}</div>
                      </td>
                      <td className="p-4 hidden sm:table-cell text-muted-foreground">
                        {formatDate(doc.createdAt)}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          doc.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-rose-500/10 text-rose-500"
                        }`}>
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
                            className="text-muted-foreground hover:text-foreground size-8"
                          >
                            <HugeiconsIcon icon={QrCode01Icon} className="size-4" />
                          </Button>
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            title="Download Signed File"
                            className="text-muted-foreground hover:text-primary size-8"
                          >
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                              <HugeiconsIcon icon={Download02Icon} className="size-4" />
                            </a>
                          </Button>
                          
                          {doc.status === "ACTIVE" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Revoke Credential"
                              disabled={!canRevoke}
                              onClick={() => handleRevoke(doc)}
                              className="text-muted-foreground hover:text-destructive size-8 disabled:opacity-30"
                            >
                              <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <HugeiconsIcon icon={QrCode01Icon} className="size-5 text-primary" />
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
            
            <div className="p-6 flex flex-col items-center text-center gap-4">
              <div className="font-semibold text-foreground text-sm line-clamp-1">
                {selectedQrDoc.title}
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                Scan this code to verify document authenticity instantly.
              </p>
              
              <div className="bg-white p-3 rounded-lg border border-border shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    getVerificationUrl(selectedQrDoc.verificationToken)
                  )}`}
                  alt="Verification QR Code"
                  className="size-48"
                />
              </div>

              <div className="w-full bg-muted/40 rounded-lg border border-border p-3 flex flex-col gap-2">
                <div className="text-xs font-semibold text-foreground text-left">
                  Verification URL:
                </div>
                <div className="text-xs text-muted-foreground select-all break-all text-left font-mono">
                  {getVerificationUrl(selectedQrDoc.verificationToken)}
                </div>
                <div className="flex gap-2 mt-1">
                  <Button
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => handleCopyLink(selectedQrDoc.verificationToken)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4">
              <h3 className="font-semibold text-foreground text-lg">
                Revoke Digital Credential?
              </h3>
              <p className="text-sm text-muted-foreground leading-normal">
                Are you sure you want to revoke <span className="font-semibold text-foreground">"{revokeConfirmDoc.title}"</span>? 
                This action is permanent. Once revoked, anyone scanning the QR code or verifying the file will see that this credential is no longer valid.
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
                  {revokeMutation.isPending ? "Revoking..." : "Revoke Credential"}
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
