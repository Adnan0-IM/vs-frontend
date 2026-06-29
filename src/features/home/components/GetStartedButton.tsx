import { Link } from "react-router"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client" // import the auth client

const GetStartedButton = () => {
  const [token, setToken] = useState<string | null>(null)
  useEffect(() => {
    const getSession = async () => {
      try {
        const session = await authClient.getSession()
        const token = session.data?.session.token || null
        setToken(token)
      } catch (error) {
        console.error("Error fetching session:", error)
        setToken(null)
      }
    }

    getSession()
  }, [])

  return (
    <div>
      {!token ? (
        <Link to={"/auth/sign-up"}>
          <Button>Get Started</Button>
        </Link>
      ) : (
        <Link to={"/administration"}>
          <Button>Dashboard</Button>
        </Link>
      )}
    </div>
  )
}

export default GetStartedButton
