import Home from "@/features/home"
import SignUp from "@/features/auth/SignUp"
import SignIn from "@/features/auth/SignIn"
import Administration from "@/features/admin/administration"
import Verification from "@/features/user/verification"
import { authClient } from "@/lib/auth-client"
import {
  Outlet,
  RouterProvider,
  createBrowserRouter,
  redirect,
  useNavigation,
} from "react-router"

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

  return (
    <>
      {isLoading ? <NavigationLoading /> :  <Outlet />}
     
    </>
  )
}

const requireAuth = async () => {
  const { data: session, error } = await authClient.getSession()

  if (error || !session) {
    throw redirect("/auth/sign-in")
  }

  return session
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
    ],
  },
])

const AppRouter = () => {
  return <RouterProvider router={router} />
}

export default AppRouter
