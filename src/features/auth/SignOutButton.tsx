import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { useNavigate } from "react-router"

const SignOutButton = () => {
  const navigate = useNavigate()
  return (
    <Button
      onClick={async () => {
        await authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              navigate("/auth/sign-in")
            },
          },
        })
      }}
    >
      Sign Out
    </Button>
  )
}

export default SignOutButton
