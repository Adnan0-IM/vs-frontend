import Home from "@/features/home"
import SignUp from "@/features/auth/SignUp"
import SignIn from "@/features/auth/SignIn"
import Administration from "@/features/admin/administration"
import Verification from "@/features/user/verification"
import { authClient } from "@/lib/auth-client"
import {
  Link,
  Outlet,
  RouterProvider,
  createBrowserRouter,
  redirect,
  useNavigation,
} from "react-router"
import Docs from "@/features/docs/Docs"

const NavigationLoading = () => {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-4 md:px-8 md:py-8 lg:px-4">
      <p>Loading...</p>
    </div>
  )
}

const AppLayout = () => {
  const navigation = useNavigation()
  const isLoading = navigation.state === "loading"

  return <>{isLoading ? <NavigationLoading /> : <Outlet />}</>
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

const requireAuth = async () => {
  const { data: session, error } = await authClient.getSession()

  if (error || !session?.session?.token) {
    throw redirect("/auth/sign-in")
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
        path: "administration",
        loader: requireAuth,
        element: <Administration />,
      },
      {
        // Docs route with nested routes for each section and page
        path: "docs",
        element: <Docs />,
        children: [
          {
            index: true,
            loader: () => redirect("/docs/introduction"),
          },
          {
            path: ":slug",
            element: <Docs />,
          },
        ],
      },
      {
        path: "*",
        element: <NotFound />,
      }
    ],
  },
])

const AppRouter = () => {
  return <RouterProvider router={router} />
}

export default AppRouter
