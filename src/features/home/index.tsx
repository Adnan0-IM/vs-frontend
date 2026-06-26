import { Button } from "@/components/ui/button"
import { Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { DocumentValidationIcon, Github } from "@hugeicons/core-free-icons"
import heroImage from "@/assets/authentic image.jpg"
import GetStartedButton from "@/components/get-started-button"

const Home = () => {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-4 md:px-8 md:py-8 lg:px-4">
      <header>
        <div className="flex items-center justify-between text-muted-foreground">
          <div className="font-bold flex items-center gap-2"><HugeiconsIcon icon={DocumentValidationIcon} /> <span>SDVS</span> </div>{" "}
          <nav className="flex items-center gap-4">
            <Link to={""}> Docs</Link>
            <Link to={""}></Link>
            <Link to={""}>
              <HugeiconsIcon icon={Github} size={22} />
            </Link>
            <GetStartedButton />
          </nav>
        </div>
      </header>
      <div className="flex flex-col items-center justify-center gap-6 py-24 text-center md:flex-row md:text-left lg:gap-12 lg:py-32">
        <div>
          <h1 className="text-4xl font-medium">
            Secure Document Verification System <br />
            <span className="mt-4 block text-2xl text-muted-foreground">
              for issuing and verifying document authenticity, integrity, and
              non-repudiation
            </span>
          </h1>
          <div className="mt-6 flex flex-row items-center justify-center gap-2 text-lg text-muted-foreground md:justify-normal">
            <Link to={"/auth/sign-in"}>
              {" "}
              <Button>Sign in</Button>{" "}
            </Link>
            or
            <Link className="" to={"/auth/sign-up"}>
              <Button variant={"ghost"} className="">
                Create an account.
              </Button>
            </Link>
          </div>
        </div>
        <div>
          <img
            src={heroImage}
            className="h-1/2 rounded-md"
            alt="Authentic document image"
          />
        </div>
      </div>
      <footer className="py-6 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Secure Document Verification System.
        All rights reserved.
      </footer>
    </div>
  )
}

export default Home
