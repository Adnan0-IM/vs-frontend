import { useState, useEffect } from "react"
import { authClient } from "@/lib/auth-client"
import type { Session } from "@/lib/auth-client"

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const getSession = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await authClient.getSession()

        if (response.error) {
          if (
            response.error.status === 401 ||
            response.error.message === "not authenticated"
          ) {
            setSession(null)
            return
          }

          throw new Error(response.error.message ?? "Failed to fetch session")
        }

        if (!response?.data?.session?.token) {
          setSession(null)
          return
        }

        setSession(response.data)
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to fetch session")
        setSession(null)
        setError(error)
      } finally {
        setLoading(false)
      }
    }

    getSession()
  }, [])

  return { session, loading, error }
}
