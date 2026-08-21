import Layout from "../components/Layout"
import { authClient } from "@/lib/auth-client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Settings as SettingsIcon,
  UserCheck01Icon,
  Loading03Icon,
  SecurityPasswordIcon,
  TickDouble01Icon,
  Building01Icon,
  Key01Icon,
  Alert02Icon,
  Delete02Icon
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { useNavigate } from "react-router"

const organizationTypes = [
  { value: "university", label: "University / Higher Ed" },
  { value: "secondary-school", label: "Secondary / High School" },
  { value: "government-agency", label: "Government / Regulatory Agency" },
  { value: "company", label: "Private Company / Corporation" },
  { value: "other", label: "Other Institution" },
]

const Settings = () => {
  const navigate = useNavigate()
  const { data: session, refetch: refetchSession } = authClient.useSession()
  const { data: activeOrgRaw, refetch: refetchOrg } = authClient.useActiveOrganization()
  const activeOrg = activeOrgRaw as (NonNullable<typeof activeOrgRaw> & { publicKey?: string | null }) | null
  const { data: activeMember } = authClient.useActiveMember()
  
  const user = session?.user

  // Profile Form State
  const [userName, setUserName] = useState(user?.name || "")
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Organization Form State
  const [orgName, setOrgName] = useState("")
  const [orgLogo, setOrgLogo] = useState("")
  const [isUpdatingOrg, setIsUpdatingOrg] = useState(false)

  // Danger Zone States
  const [isDeletingOrg, setIsDeletingOrg] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deleteOrgConfirmOpen, setDeleteOrgConfirmOpen] = useState(false)
  const [deleteAccountConfirmOpen, setDeleteAccountConfirmOpen] = useState(false)

  const isOwnerOrAdmin = activeMember?.role === "owner" || activeMember?.role === "admin"

  // Initialize profile name when session changes
  useEffect(() => {
    if (user?.name) {
      setUserName(user.name)
    }
  }, [user])

  // Initialize organization form when activeOrg updates
  useEffect(() => {
    if (activeOrg) {
      setOrgName(activeOrg.name || "")
      setOrgLogo(activeOrg.logo || "")
    }
  }, [activeOrg])

  // Update Profile Submit Handler
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userName.trim()) return

    setIsUpdatingProfile(true)
    const toastId = toast.loading("Updating profile details...")
    try {
      const { error } = await authClient.updateUser({
        name: userName.trim(),
      })
      if (error) throw error
      toast.success("Profile updated successfully!", { id: toastId })
      refetchSession()
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile.", { id: toastId })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  // Password Change Submit Handler
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPassword) {
      toast.error("Current password is required.")
      return
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.")
      return
    }

    setIsChangingPassword(true)
    const toastId = toast.loading("Updating password...")
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      })
      if (error) throw error
      toast.success("Password changed successfully!", { id: toastId })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      toast.error(err.message || "Failed to change password.", { id: toastId })
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Organization Settings Submit Handler
  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgName.trim()) return

    setIsUpdatingOrg(true)
    const toastId = toast.loading("Updating organization details...")
    try {
      const { error } = await authClient.organization.update({
        data: {
          name: orgName.trim(),
          logo: orgLogo.trim() || undefined,
        }
      })
      if (error) throw error
      
      toast.success("Organization settings updated successfully!", { id: toastId })
      refetchOrg()
    } catch (err: any) {
      toast.error(err.message || "Failed to update organization details.", { id: toastId })
    } finally {
      setIsUpdatingOrg(false)
    }
  }

  // Copy cryptographic verification key
  const handleCopyKey = () => {
    if (activeOrg?.publicKey) {
      navigator.clipboard.writeText(activeOrg.publicKey)
      toast.success("Public verification key copied to clipboard!")
    }
  }

  // Delete Organization Handler (opens confirmation modal)
  const handleDeleteOrganization = () => {
    if (!activeOrg?.id) return
    setDeleteOrgConfirmOpen(true)
  }

  // Confirm Delete Organization
  const confirmDeleteOrganization = async () => {
    if (!activeOrg?.id) return

    setIsDeletingOrg(true)
    const toastId = toast.loading("Deleting organization...")
    try {
      const { error } = await authClient.organization.delete({
        organizationId: activeOrg.id,
      })
      if (error) throw error

      setDeleteOrgConfirmOpen(false)
      toast.success("Organization deleted successfully.", { id: toastId })
      navigate("/dashboard")
    } catch (err: any) {
      toast.error(err.message || "Failed to delete organization.", { id: toastId })
    } finally {
      setIsDeletingOrg(false)
    }
  }

  // Delete Personal Account Handler (opens confirmation modal)
  const handleDeleteAccount = () => {
    setDeleteAccountConfirmOpen(true)
  }

  // Confirm Delete Account
  const confirmDeleteAccount = async () => {
    setIsDeletingAccount(true)
    console.log("deleting")
    const toastId = toast.loading("Deleting your personal account...")
    try {
      const { error } = await authClient.deleteUser()
      if (error) throw error
      console.log("deleting 2")
      setDeleteAccountConfirmOpen(false)
      toast.success("Account deleted. Redirecting...", { id: toastId })
      navigate("/auth/sign-in")
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user account.", { id: toastId })
      console.log("deleting error")
    } finally {
      setIsDeletingAccount(false)
      console.log("dlelting done")
    }
  }

  // Parse organization type from metadata
  const getOrgTypeLabel = () => {
    if (!activeOrg?.metadata) return "Other"
    try {
      const meta = typeof activeOrg.metadata === "string" 
        ? JSON.parse(activeOrg.metadata) 
        : activeOrg.metadata
      const match = organizationTypes.find((t) => t.value === meta.type)
      return match ? match.label : "Other"
    } catch (e) {
      return "Other"
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      case "admin":
        return "bg-primary/10 text-primary border-primary/20"
      case "signer":
        return "bg-sky-500/10 text-sky-500 border-sky-500/20"
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-500/20"
    }
  }
  return (
    <Layout>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6 md:px-8 md:py-8 font-sans">
        
        {/* Main Title Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <HugeiconsIcon icon={SettingsIcon} className="size-8 text-primary" />
            Workspace Settings
          </h1>
          <p className="max-w-2xl text-muted-foreground text-sm">
            Manage your personal profile details, account security, and active organization settings.
          </p>
        </div>

        {/* ============================================================== */}
        {/* SECTION 1: Personal Account Settings */}
        {/* ============================================================== */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-1.5 flex items-center gap-2">
            <HugeiconsIcon icon={UserCheck01Icon} className="size-5 text-primary" />
            Personal Account Settings
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Profile Details Card */}
            <Card className="border-border bg-card shadow-sm h-fit">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-foreground">Profile Information</CardTitle>
                <CardDescription className="text-xs">
                  Update your account display name and view your registered email address.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleUpdateProfile}>
                <CardContent className="space-y-4">
                  {/* Email (Read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-muted text-muted-foreground border-border cursor-not-allowed text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Email address cannot be changed. Contact administrator if needed.
                    </p>
                  </div>

                  {/* Display Name */}
                  <div className="space-y-2">
                    <Label htmlFor="display-name" className="text-xs font-semibold text-muted-foreground">Display Name</Label>
                    <Input
                      id="display-name"
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      disabled={isUpdatingProfile}
                      placeholder="Enter your name"
                      required
                      className="text-xs"
                    />
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 border-t border-border p-4 mt-6 flex justify-end">
                  <Button type="submit" disabled={isUpdatingProfile || userName === user?.name} size="sm" className="font-semibold">
                    {isUpdatingProfile ? (
                      <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
                    ) : (
                      <HugeiconsIcon icon={TickDouble01Icon} className="size-4" />
                    )}
                    Save Changes
                  </Button>
                </CardFooter>
              </form>
            </Card>

            {/* Security & Password Card */}
            <Card className="border-border bg-card shadow-sm h-fit">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-foreground">Security & Password</CardTitle>
                <CardDescription className="text-xs">
                  Change your password to keep your account secure.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handlePasswordChange}>
                <CardContent className="space-y-4">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <Label htmlFor="current-pw" className="text-xs font-semibold text-muted-foreground">Current Password</Label>
                    <Input
                      id="current-pw"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={isChangingPassword}
                      placeholder="••••••••"
                      required
                      className="text-xs"
                    />
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="new-pw" className="text-xs font-semibold text-muted-foreground">New Password</Label>
                    <Input
                      id="new-pw"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isChangingPassword}
                      placeholder="••••••••"
                      required
                      className="text-xs"
                    />
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirm-pw" className="text-xs font-semibold text-muted-foreground">Confirm New Password</Label>
                    <Input
                      id="confirm-pw"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isChangingPassword}
                      placeholder="••••••••"
                      required
                      className="text-xs"
                    />
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 border-t border-border p-4 mt-6 flex justify-end">
                  <Button type="submit" disabled={isChangingPassword} size="sm" className="font-semibold">
                    {isChangingPassword ? (
                      <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
                    ) : (
                      <HugeiconsIcon icon={SecurityPasswordIcon} className="size-4" />
                    )}
                    Change Password
                  </Button>
                </CardFooter>
              </form>
            </Card>

          </div>
        </div>

        {/* ============================================================== */}
        {/* SECTION 2: Organization Settings */}
        {/* ============================================================== */}
        <div className="space-y-4 pt-4">
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-1.5 flex items-center gap-2">
            <HugeiconsIcon icon={Building01Icon} className="size-5 text-primary" />
            Organization Settings
          </h2>
          
          <div className="grid gap-6 md:grid-cols-3">
            
            {/* Organization profile form & keys card (2 cols) */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Org details Card */}
              <Card className="border-border bg-card shadow-sm h-fit">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-foreground">Organization Identity</CardTitle>
                  <CardDescription className="text-xs">
                    Configure public organization details seen on verification pages and generated credentials.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdateOrganization}>
                  <CardContent className="space-y-4">
                    {/* Slug (Read-only) */}
                    <div className="space-y-2">
                      <Label htmlFor="slug" className="text-xs font-semibold text-muted-foreground">Workspace Slug (URL-friendly)</Label>
                      <Input
                        id="slug"
                        type="text"
                        value={activeOrg?.slug || ""}
                        disabled
                        className="bg-muted text-muted-foreground border-border cursor-not-allowed text-xs font-mono"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Slugs are unique identifiers and cannot be altered after creation.
                      </p>
                    </div>

                    {/* Organization Name */}
                    <div className="space-y-2">
                      <Label htmlFor="org-name" className="text-xs font-semibold text-muted-foreground">Organization Name</Label>
                      <Input
                        id="org-name"
                        type="text"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        disabled={isUpdatingOrg || !isOwnerOrAdmin}
                        placeholder="e.g. Federal University of Technology"
                        required
                        className="text-xs"
                      />
                    </div>

                    {/* Logo URL */}
                    <div className="space-y-2">
                      <Label htmlFor="logo-url" className="text-xs font-semibold text-muted-foreground">Logo URL Image Path</Label>
                      <Input
                        id="logo-url"
                        type="url"
                        value={orgLogo}
                        onChange={(e) => setOrgLogo(e.target.value)}
                        disabled={isUpdatingOrg || !isOwnerOrAdmin}
                        placeholder="https://example.com/logo.png"
                        className="text-xs font-mono"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Input a hosted URL path for your official organization logo image.
                      </p>
                    </div>

                    {/* Organization Type (Read-only) */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground block">Workspace Institution Type</Label>
                      <span className="inline-flex items-center rounded-md bg-muted border border-border px-3 py-1.5 font-medium text-xs text-foreground capitalize">
                        {getOrgTypeLabel()}
                      </span>
                    </div>
                  </CardContent>
                  
                  {isOwnerOrAdmin && (
                    <CardFooter className="bg-muted/30 border-t border-border mt-6 p-4 flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={isUpdatingOrg || (orgName === activeOrg?.name && orgLogo === activeOrg?.logo)} 
                        size="sm" 
                        className="font-semibold"
                      >
                        {isUpdatingOrg ? (
                          <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
                        ) : (
                          <HugeiconsIcon icon={TickDouble01Icon} className="size-4" />
                        )}
                        Save Organization Details
                      </Button>
                    </CardFooter>
                  )}
                </form>
              </Card>

              {/* Cryptographic Public Verification Key Card */}
              <Card className="border-border bg-card shadow-sm h-fit">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <HugeiconsIcon icon={Key01Icon} className="size-5 text-primary" />
                    Cryptographic Public Key
                  </CardTitle>
                  <CardDescription className="text-xs">
                    This active 2048-bit RSA public key verifies the signatures on your organization's credentials.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeOrg?.publicKey ? (
                    <div className="space-y-3">
                      <pre className="bg-muted p-4 rounded-md border border-border font-mono text-[9px] text-foreground overflow-x-auto max-h-36 whitespace-pre-wrap select-all">
                        {activeOrg.publicKey}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      No public key has been generated for this organization.
                    </p>
                  )}
                </CardContent>
                {activeOrg?.publicKey && (
                  <CardFooter className="bg-muted/30 border-t border-border mt-6 p-4 flex justify-end">
                    <Button variant="outline" size="sm" onClick={handleCopyKey} className="font-semibold">
                      Copy Public Key
                    </Button>
                  </CardFooter>
                )}
              </Card>

            </div>

            {/* Sidebar status / access details card (1 col) */}
            <div className="space-y-6">
              <Card className="border-border bg-card shadow-sm h-full">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Workspace Membership
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-6 space-y-5 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Current Active Member</span>
                    <span className="text-foreground font-medium truncate max-w-[120px]">
                      {user?.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Organization Role</span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${getRoleBadgeColor(activeMember?.role || "")}`}>
                      {activeMember?.role?.toUpperCase() || "MEMBER"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Date Joined Workspace</span>
                    <span>
                      {activeMember?.createdAt ? new Date(activeMember.createdAt).toLocaleDateString() : "N/A"}
                    </span>
                  </div>

                  <div className="border-t border-border pt-4 text-xxs text-muted-foreground/80 leading-relaxed">
                    <p className="font-semibold text-foreground mb-1.5">Permissions Overview:</p>
                    <ul className="list-disc pl-3.5 space-y-1">
                      <li>Owners and Admins can configure keys and update profile details.</li>
                      <li>Signers can run signing routines but cannot change settings.</li>
                      <li>Viewers can view issued documents and verification statistics.</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>

        {/* ============================================================== */}
        {/* SECTION 3: Danger Zone */}
        {/* ============================================================== */}
        <div className="space-y-4 pt-6 border-t border-destructive/20">
          <h2 className="text-lg font-semibold text-destructive flex items-center gap-2">
            <HugeiconsIcon icon={Alert02Icon} className="size-5" />
            Danger Zone
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Delete Organization Card */}
            <Card className="border-destructive/20  shadow-sm h-fit">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-destructive">Delete Organization</CardTitle>
                <CardDescription className="text-xs text-destructive/80">
                  Permanently delete your organization, revoke all credentials, and remove all member data.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-destructive/70 min-h-[48px]">
                {activeMember?.role !== "owner" ? (
                  <p className="text-amber-500 font-semibold">Only the organization owner can delete the organization workspace.</p>
                ) : (
                  <p>Warning: This action is irreversible. All issued credentials will fail verification.</p>
                )}
              </CardContent>
              <CardFooter className="bg-destructive/10 border-t border-destructive/20 p-4 flex justify-end">
                <Button 
                  onClick={handleDeleteOrganization}
                  disabled={activeMember?.role !== "owner" || isDeletingOrg}
                  variant="destructive"
                  size="sm"
                  className="font-semibold"
                >
                  {isDeletingOrg ? (
                    <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
                  ) : (
                    <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                  )}
                  Delete Organization
                </Button>
              </CardFooter>
            </Card>

            {/* Delete Account Card */}
            <Card className="border-destructive/20  shadow-sm h-fit">

              <CardHeader>
                <CardTitle className="text-sm font-semibold text-destructive">Delete Personal Account</CardTitle>
                <CardDescription className="text-xs text-destructive/80">
                  Permanently delete your user account, personal data, and remove your dashboard access.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-destructive/70 min-h-[48px]">
                <p>Warning: This action is irreversible. You will be signed out and your account credentials will be removed.</p>
              </CardContent>
              <CardFooter className="bg-destructive/10 border-t border-destructive/20 p-4 flex justify-end">
                <Button 
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount}
                  variant="destructive"
                  size="sm"
                  className="font-semibold"
                >
                  {isDeletingAccount ? (
                    <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
                  ) : (
                    <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                  )}
                  Delete Account
                </Button>
              </CardFooter>
            </Card>

          </div>
        </div>

        {/* Delete Organization Confirmation Modal */}
        {deleteOrgConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 space-y-4">
                <h3 className="font-semibold text-foreground text-lg">
                  Delete Organization?
                </h3>
                <p className="text-sm text-muted-foreground leading-normal">
                  Are you sure you want to permanently delete <span className="font-semibold text-foreground">"{activeOrg?.name}"</span>? 
                  This action is <span className="font-semibold text-destructive">IRREVERSIBLE</span>. 
                  It will delete all memberships, remove all issued document ledgers, and invalidate all digital signature verifications.
                </p>
                
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteOrgConfirmOpen(false)}
                    disabled={isDeletingOrg}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={confirmDeleteOrganization}
                    disabled={isDeletingOrg}
                    className="font-medium"
                  >
                    {isDeletingOrg ? "Deleting..." : "Delete Organization"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Account Confirmation Modal */}
        {deleteAccountConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 space-y-4">
                <h3 className="font-semibold text-foreground text-lg">
                  Delete Personal Account?
                </h3>
                <p className="text-sm text-muted-foreground leading-normal">
                  Are you sure you want to permanently delete your personal account? 
                  This action is <span className="font-semibold text-destructive">IRREVERSIBLE</span>. 
                  You will be permanently signed out and your account credentials will be removed.
                </p>
                
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteAccountConfirmOpen(false)}
                    disabled={isDeletingAccount}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={confirmDeleteAccount}
                    disabled={isDeletingAccount}
                    className="font-medium"
                  >
                    {isDeletingAccount ? "Deleting..." : "Delete Account"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Settings
