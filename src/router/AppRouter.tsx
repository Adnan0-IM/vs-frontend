import { Suspense, lazy } from "react"
import { authClient } from "@/lib/auth-client"
import {
  Link,
  Outlet,
  RouterProvider,
  createBrowserRouter,
  redirect,
  useNavigation,
  useRouteError,
} from "react-router"
import { Loading03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

const Home = lazy(() => import("@/features/home"))
const SignUp = lazy(() => import("@/features/auth/SignUp"))
const SignIn = lazy(() => import("@/features/auth/SignIn"))
const Verification = lazy(() => import("@/features/public/verification"))
const Documents = lazy(() => import("@/features/app/sections/Documents"))
const UploadDocuments = lazy(
  () => import("@/features/app/sections/UploadDocuments")
)
const VerificationLogs = lazy(
  () => import("@/features/app/sections/VerificationLogs")
)
const Members = lazy(() => import("@/features/app/sections/Members"))
const Settings = lazy(() => import("@/features/app/sections/Settings"))
const Dashboard = lazy(() => import("@/features/app/Dashboard"))
const AccountSettings = lazy(
  () => import("@/features/app/sections/AccountSettings")
)
const OrgSetup = lazy(() => import("@/features/app/OrgSetup"))
const InvitationAccept = lazy(() => import("@/features/app/InvitationAccept"))

const NavigationLoading = () => {
  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <HugeiconsIcon
        icon={Loading03Icon}
        className="size-8 animate-spin text-primary"
        strokeWidth={2}
      />
    </div>
  )
}

const AppLayout = () => {
  const navigation = useNavigation()
  const isLoading = navigation.state === "loading"

  return (
    <>
      {isLoading ? (
        <NavigationLoading />
      ) : (
        <Suspense fallback={<NavigationLoading />}>
          <Outlet />
        </Suspense>
      )}
    </>
  )
}

const NotFound = () => {
  return (
    <div className="container mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-12 md:px-8">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        The page you opened does not exist. Use one of the links below to get
        back to a working section.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          to="/docs/introduction"
        >
          Open docs
        </Link>
        <Link
          className="rounded-md border border-border px-4 py-2 text-sm font-medium"
          to="/"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}

const ErrorElement = () => {
  const error = useRouteError()
  const message =
    error && typeof error === "object" && "message" in error
      ? String(
          (error as { message?: unknown }).message ?? "Something went wrong."
        )
      : "Something went wrong."

  console.error(error)
  return (
    <div className="container mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-12 md:px-8">
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Oops!</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">{message}</p>
      <div className="mt-6 flex gap-3">
        <a
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          href={window.location.pathname}
        >
          refresh
        </a>
      </div>
    </div>
  )
}
export const requireAuth = async ({ request }: { request: Request }) => {  const { data: session, error } = await authClient.getSession()

  if (error || !session?.session?.token) {
    const url = new URL(request.url)
    throw redirect(
      `/auth/sign-in?redirectTo=${encodeURIComponent(url.pathname + url.search)}`
    )
  }

  const { data: organizations } = await authClient.organization.list()

  const url = new URL(request.url)
  const isOrgSetupPath = url.pathname === "/dashboard/org-setup"

  if (!organizations || organizations.length === 0) {
    if (!isOrgSetupPath) {
      throw redirect("/dashboard/org-setup")
    }
  } else {
    // If user has organizations, make sure an active organization is set
    const activeOrgId = session.session.activeOrganizationId
    if (!activeOrgId) {
      await authClient.organization.setActive({
        organizationId: organizations[0].id,
      })
    }

    if (isOrgSetupPath) {
      throw redirect("/dashboard")
    }
  }

  return session?.session?.token
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "auth/sign-in",
        element: <SignIn />,
      },
      {
        path: "auth/sign-up",
        element: <SignUp />,
      },
      {
        path: "verification",
        element: <Verification />,
      },
      {
        path: "invitation/:invitationId",
        element: <InvitationAccept />,
      },
      {
        path: "dashboard",
        loader: requireAuth,
        errorElement: <ErrorElement />,
        element: <Outlet />,
        children: [
          {
            index: true,
            element: <Dashboard />,
          },
          {
            path: "org-setup",
            element: <OrgSetup />,
          },
          {
            path: "documents",
            element: <Documents />,
          },
          {
            path: "upload-document",
            element: <UploadDocuments />,
          },
          {
            path: "verification-logs",
            element: <VerificationLogs />,
          },
          {
            path: "members",
            element: <Members />,
          },
          {
            path: "settings",
            element: <Settings />,
          },
          {
            path: "Account",
            element: <AccountSettings />,
          },
        ],
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
])

const AppRouter = () => {
  return <RouterProvider router={router} />
}

export default AppRouter
