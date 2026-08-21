import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Loading03Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons"
import { useSession } from "@/lib/auth/hooks/useSession"

type InvitationDetails = {
  id: string
  organizationId: string
  email: string
  role: "member" | "owner" | "admin"
  status?: string
  inviterId: string
  expiresAt: Date | string
  createdAt?: Date | string
  organizationName?: string
  organizationSlug?: string
  inviterEmail?: string
}

const InvitationAccept = () => {
  const { invitationId } = useParams()
  const navigate = useNavigate()
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [isAccepting, setIsAccepting] = useState(false)
  const { session, loading: sessionLoading, error: sessionError } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!invitationId || !session?.session?.token) return

      try {
        setIsLoading(true)
        setError(null)

        const response = await authClient.organization.getInvitation({
          query: { id: invitationId },
        })

        if (response.error) {
          setError(
            response.error.message || "Failed to fetch invitation details"
          )
          setInvitation(null)
          return
        }

        setInvitation((response.data ?? null) as InvitationDetails | null)
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to fetch invitation details"
        setError(message)
        setInvitation(null)
        console.error("Error fetching invitation:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvitation()
  }, [invitationId, session?.session?.token])

  const handleAcceptInvitation = async () => {
    if (!invitationId || !session?.session?.token) return

    setIsAccepting(true)
    const toastId = toast.loading("Accepting invitation...")

    try {
      const response = await authClient.organization.acceptInvitation({
        invitationId,
      })

      if (response.error) {
        throw new Error(response.error.message || "Failed to accept invitation")
      }

      toast.success("Invitation accepted successfully!", { id: toastId })
      navigate("/dashboard")
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to accept invitation"
      console.error("Error accepting invitation:", err)
      toast.error(message, { id: toastId })
      setError(message)
    } finally {
      setIsAccepting(false)
    }
  }

  const handleSignIn = () => {
    navigate(
      `/auth/sign-in?redirectTo=${encodeURIComponent(`/invitation/${invitationId}`)}`
    )
  }

  if (isLoading || sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <HugeiconsIcon
          icon={Loading03Icon}
          className="size-8 animate-spin text-primary"
        />
      </div>
    )
  }

  if (sessionError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <HugeiconsIcon icon={Cancel01Icon} className="size-6" />
              Error
            </CardTitle>
            <CardDescription>{sessionError.message}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate("/")}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!session?.session?.token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <HugeiconsIcon icon={Cancel01Icon} className="size-6" />
              Not Signed In
            </CardTitle>
            <CardDescription>
              You need to sign in or create an account to accept this
              invitation.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end gap-4">
            <Button variant="outline" onClick={handleSignIn}>
              Sign In/Create Account
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <HugeiconsIcon icon={Cancel01Icon} className="size-6" />
              Error
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate("/")}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HugeiconsIcon
                icon={Cancel01Icon}
                className="size-6 text-destructive"
              />
              Invitation Not Found
            </CardTitle>
            <CardDescription>
              This invitation does not exist or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate("/")}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const invitationName =
    invitation.organizationName ||
    invitation.organizationSlug ||
    "this organization"

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon
              icon={UserAdd01Icon}
              className="size-6 text-primary"
            />
            Organization Invitation
          </CardTitle>
          <CardDescription>
            You&apos;ve been invited to join <strong>{invitationName}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium">Role</p>
            <div className="inline-flex items-center rounded border border-border bg-muted px-3 py-1 text-sm font-medium">
              {invitation.role.toUpperCase()}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Expires</p>
            <p className="text-sm text-muted-foreground">
              {new Date(invitation.expiresAt).toLocaleDateString()}
            </p>
          </div>
          {session?.session?.token ? (
            <Button
              className="w-full"
              onClick={handleAcceptInvitation}
              disabled={isAccepting}
            >
              {isAccepting ? (
                <>
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    className="size-4 animate-spin"
                  />
                  <span className="ml-2">Accepting...</span>
                </>
              ) : (
                <>
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    className="size-4"
                  />
                  <span className="ml-2">Accept Invitation</span>
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You need to sign in to accept this invitation.
              </p>
              <Button className="w-full" onClick={handleSignIn}>
                Sign In
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default InvitationAccept
