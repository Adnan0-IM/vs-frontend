import { authClient } from "@/lib/auth-client"
import Layout from "./components/Layout"
import OrgSetup from "./OrgSetup"
import { useQuery } from "@tanstack/react-query"
import { fetchDashboardStats } from "./api/organization"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Files02Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  ClipboardCheckIcon,
  ArrowRight01Icon,
  Loading03Icon,
  Download02Icon,
  PrinterIcon,
  Clock01Icon
} from "@hugeicons/core-free-icons"
import { useState } from "react"
import { Link } from "react-router"
import { toast } from "sonner"

const Dashboard = () => {
  const { data: activeOrg, isPending: activeOrgPending } = authClient.useActiveOrganization()
  const { data: organizations, isPending: listOrgPending } = authClient.useListOrganizations()
  const [isPrinting, setIsPrinting] = useState<string | null>(null)

  // Fetch stats using React Query when activeOrg is available
  const { data: dashboardData, isLoading: statsLoading, error } = useQuery({
    queryKey: ["dashboardStats", activeOrg?.id],
    queryFn: () => fetchDashboardStats(activeOrg!.id),
    enabled: !!activeOrg?.id,
  })

  const isPending = activeOrgPending || listOrgPending

  if (isPending) {
    return (
      <Layout>
        <div className="flex h-64 w-full items-center justify-center">
          <HugeiconsIcon icon={Loading03Icon} className="size-8 text-primary animate-spin" strokeWidth={2} />
        </div>
      </Layout>
    )
  }

  if (!organizations || organizations.length === 0) {
    return <OrgSetup />
  }

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

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes) return "0 Bytes"
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  }

  const getResultBadgeStyles = (result: string) => {
    switch (result) {
      case "VERIFIED":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      case "TAMPERED":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse"
      case "NOT_FOUND":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-500/20"
    }
  }

  const stats = dashboardData?.stats || {
    totalDocuments: 0,
    activeDocuments: 0,
    revokedDocuments: 0,
    totalVerifications: 0,
    verificationSuccessRate: 100
  }

  const recentDocuments = dashboardData?.recentDocuments || []
  const recentActivity = dashboardData?.recentActivity || []

  return (
    <Layout>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Dashboard
            </h1>
            <p className="max-w-2xl text-muted-foreground text-sm">
              Overview of your secure credential verification ecosystem.
            </p>
          </div>
          <Button asChild size="sm" className="font-semibold shrink-0">
            <Link to="/dashboard/upload-document">Issue New Credential</Link>
          </Button>
        </div>

        {statsLoading ? (
          <div className="flex h-64 w-full items-center justify-center">
            <HugeiconsIcon icon={Loading03Icon} className="size-8 text-primary animate-spin" strokeWidth={2} />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive">
            Failed to load dashboard metrics. Check backend connection.
          </div>
        ) : (
          <>
            {/* Stats Metrics Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              
              {/* Stat 1: Total Documents */}
              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Total Credentials
                  </CardTitle>
                  <HugeiconsIcon icon={Files02Icon} className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stats.totalDocuments}</div>
                  <p className="text-xxs text-muted-foreground mt-1">
                    Issued and recorded in ledger
                  </p>
                </CardContent>
              </Card>

              {/* Stat 2: Active Documents */}
              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Active Credentials
                  </CardTitle>
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stats.activeDocuments}</div>
                  <p className="text-xxs text-muted-foreground mt-1">
                    Authentic and open for validation
                  </p>
                </CardContent>
              </Card>

              {/* Stat 3: Revoked Documents */}
              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Revoked Credentials
                  </CardTitle>
                  <HugeiconsIcon icon={Cancel01Icon} className="size-4 text-rose-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stats.revokedDocuments}</div>
                  <p className="text-xxs text-muted-foreground mt-1">
                    Permanently invalidated credentials
                  </p>
                </CardContent>
              </Card>

              {/* Stat 4: Verification Scans */}
              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Total Verifications
                  </CardTitle>
                  <HugeiconsIcon icon={ClipboardCheckIcon} className="size-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stats.totalVerifications}</div>
                  <p className="text-xxs text-muted-foreground mt-1">
                    Success rate: <span className="font-semibold text-foreground">{stats.verificationSuccessRate}%</span>
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Split View: Recent Documents vs Verification Logs */}
            <div className="grid gap-6 lg:grid-cols-3">
              
              {/* Left column: Recent Documents (Span 2) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <HugeiconsIcon icon={Files02Icon} className="size-5 text-muted-foreground" />
                    Recent Issued Credentials
                  </h2>
                  <Button variant="ghost" size="xs" asChild className="text-xs text-primary font-medium hover:underline">
                    <Link to="/dashboard/documents" className="flex items-center gap-1">
                      View all
                      <HugeiconsIcon icon={ArrowRight01Icon} className="size-3" />
                    </Link>
                  </Button>
                </div>

                <Card className="border-border bg-card shadow-sm overflow-hidden">
                  <CardContent className="p-0">
                    {recentDocuments.length === 0 ? (
                      <div className="p-8 text-center text-sm text-muted-foreground">
                        No credentials issued yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-border bg-muted/40 text-muted-foreground font-medium">
                              <th className="p-3">Title</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {recentDocuments.map((doc) => (
                              <tr key={doc.id} className="hover:bg-muted/10 transition-colors">
                                <td className="p-3">
                                  <div className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-[300px]">
                                    {doc.title}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground truncate max-w-[200px] sm:max-w-[300px]">
                                    {doc.originalFilename} ({formatBytes(doc.fileSize)})
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold text-[10px] ${
                                    doc.status === "ACTIVE"
                                      ? "bg-emerald-500/10 text-emerald-500"
                                      : "bg-rose-500/10 text-rose-500"
                                  }`}>
                                    {doc.status}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      asChild
                                      variant="ghost"
                                      size="icon"
                                      title="Download PDF"
                                      className="text-muted-foreground hover:text-primary size-7"
                                    >
                                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                        <HugeiconsIcon icon={Download02Icon} className="size-3.5" />
                                      </a>
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      title="Print PDF"
                                      disabled={isPrinting !== null}
                                      onClick={() => handlePrintPdf(doc.fileUrl, doc.id)}
                                      className="text-muted-foreground hover:text-primary size-7"
                                    >
                                      {isPrinting === doc.id ? (
                                        <HugeiconsIcon icon={Loading03Icon} className="size-3.5 animate-spin" />
                                      ) : (
                                        <HugeiconsIcon icon={PrinterIcon} className="size-3.5" />
                                      )}
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right column: Recent Activity (Span 1) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <HugeiconsIcon icon={Clock01Icon} className="size-5 text-muted-foreground" />
                    Verification Activity
                  </h2>
                  <Button variant="ghost" size="xs" asChild className="text-xs text-primary font-medium hover:underline">
                    <Link to="/dashboard/verification-logs" className="flex items-center gap-1">
                      Logs
                      <HugeiconsIcon icon={ArrowRight01Icon} className="size-3" />
                    </Link>
                  </Button>
                </div>

                <Card className="border-border bg-card shadow-sm overflow-hidden">
                  <CardContent className="p-4 space-y-4 max-h-[350px] overflow-y-auto">
                    {recentActivity.length === 0 ? (
                      <div className="text-center py-6 text-xs text-muted-foreground">
                        No verification scans recorded.
                      </div>
                    ) : (
                      recentActivity.map((log) => (
                        <div key={log.id} className="flex flex-col gap-1 border-b border-border pb-3 last:border-b-0 last:pb-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-xs text-foreground truncate max-w-[150px]" title={log.document.title}>
                              {log.document.title}
                            </span>
                            <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold border ${getResultBadgeStyles(log.verificationResult)}`}>
                              {log.verificationResult}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                            <span>
                              {log.verificationType === "QR_SCAN" ? "QR Scan" : "File Upload"}
                            </span>
                            <span>
                              {new Date(log.verificationTimestamp).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>
                          {log.ipAddress && (
                            <div className="text-[9px] text-muted-foreground/70 font-mono">
                              IP: {log.ipAddress}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

            </div>
          </>
        )}

      </div>
    </Layout>
  )
}

export default Dashboard
