import { Link } from "react-router"
import { Button } from "./ui/button"

const GetStartedButton = () => {
  const session = null // Replace with actual session logic

  return (
    <div>
      {!session ? (
        <Link to={"/admin/administration"}>
          <Button>Get Started</Button>
        </Link>
      ) : (
        <Link to={"/auth/sign-up"}>
          <Button>Dashboard</Button>
        </Link>
      )}
    </div>
  )
}

export default GetStartedButton
