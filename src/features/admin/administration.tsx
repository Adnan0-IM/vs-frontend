import { authClient } from "@/lib/auth-client"
import SignOutButton from "../auth/SignOutButton"
import { useEffect, useState } from "react"

export type Session = typeof authClient.$Infer.Session
const Administration = () => {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: session, error } = await authClient.getSession()
      if (error || !session) {
        window.location.href = "/auth/sign-in"
      }
      setSession(session)
    }

    checkAuth()
  }, [])

  const user = session?.user
  return (
    <div className="container mx-auto max-w-5xl px-4 py-4 md:px-8 md:py-8 lg:px-4">
      <h1 className="text-2xl font-bold">Administration</h1>
      <p>Welcome to the administration panel.</p>
      <section className="mt-4">
        <h2>Admin Info</h2>
       <p>Name: {user?.name}</p>
       <p>Email: {user?.email}</p>
       <p>ID: {user?.id}</p>
       <p>EmailVerified: {user?.emailVerified}</p>
       <p>Role: {user?.role}</p>
      </section>
      <SignOutButton />
    </div>
  )
}

export default Administration
