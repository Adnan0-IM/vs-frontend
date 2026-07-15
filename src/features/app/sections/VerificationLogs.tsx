import { useQuery } from "@tanstack/react-query"
import { fetchVerificationLogs } from "../api/documents"
import Layout from "../components/Layout"
import { HugeiconsIcon } from "@hugeicons/react"
import { ClipboardCheckIcon, Loading03Icon } from "@hugeicons/core-free-icons"

const VerificationLogs = () => {
  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ["verification-logs"],
    queryFn: fetchVerificationLogs,
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getResultBadgeStyles = (result: string) => {
    switch (result) {
      case "VERIFIED":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      case "TAMPERED":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20"
      default:
        return "bg-amber-500/10 text-amber-500 border-amber-500/20"
    }
  }

  const getVerifyTypeLabel = (type: string) => {
    return type === "QR_SCAN" ? "QR Code Scan" : "PDF File Upload"
  }

  // Parse User Agent to a readable format
  const parseUserAgent = (ua?: string | null) => {
    if (!ua) return "Unknown Browser"
    if (ua.includes("Firefox/")) return "Firefox"
    if (ua.includes("Chrome/")) return "Chrome"
    if (ua.includes("Safari/") && !ua.includes("Chrome")) return "Safari"
    if (ua.includes("Edge/")) return "Microsoft Edge"
    if (ua.includes("Postman")) return "Postman client"
    return ua.split(" ")[0] || "Web Browser"
  }

  return (
    <Layout>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Verification Logs
          </h1>
          <p className="max-w-2xl text-muted-foreground text-sm">
            Review past verification attempts, audit records, and security checks on issued credentials.
          </p>
        </div>

        {isLoading ? (
          <div className="flex h-64 w-full items-center justify-center">
            <HugeiconsIcon icon={Loading03Icon} className="size-8 text-primary animate-spin" strokeWidth={2} />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive">
            Failed to load verification logs. Please check your connection or refresh the page.
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/10 p-12 text-center">
            <HugeiconsIcon
              icon={ClipboardCheckIcon}
              className="mx-auto size-12 text-muted-foreground/60 mb-3"
              strokeWidth={1.5}
            />
            <h3 className="text-base font-semibold text-foreground">No verification attempts yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
              Once verifiers scan your issued QR codes or upload files to the verification portal, attempts will show up here.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground font-medium">
                    <th className="p-4">Document Details</th>
                    <th className="p-4">Verification Type</th>
                    <th className="p-4">Result</th>
                    <th className="p-4 hidden sm:table-cell font-medium">Verifier IP</th>
                    <th className="p-4 hidden md:table-cell font-medium">Platform</th>
                    <th className="p-4 font-medium">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/15 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-foreground truncate max-w-xs">
                          {log.document?.title || "Deleted/Missing Document"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-xs">
                          {log.document?.originalFilename}
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {getVerifyTypeLabel(log.verificationType)}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border ${getResultBadgeStyles(log.verificationResult)}`}>
                          {log.verificationResult}
                        </span>
                      </td>
                      <td className="p-4 hidden sm:table-cell text-muted-foreground font-mono text-xs">
                        {log.ipAddress || "Unknown"}
                      </td>
                      <td className="p-4 hidden md:table-cell text-muted-foreground" title={log.userAgent || undefined}>
                        {parseUserAgent(log.userAgent)}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {formatDate(log.verificationTimestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default VerificationLogs
