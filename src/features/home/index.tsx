import { Button } from "@/components/ui/button"
import { Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { DocumentValidationIcon, Github } from "@hugeicons/core-free-icons"
import heroImage from "@/assets/authentic image.jpg"
import GetStartedButton from "./components/GetStartedButton"
import Footer from "@/components/Footer"

const Home = () => {
  return (
    <div className="container mx-auto min-h-screen max-w-5xl px-4 py-4 md:px-8 md:py-8 lg:px-4">
      <header>
        <div className="flex items-center justify-between text-muted-foreground">
          <div className="flex items-center gap-2 font-bold">
            <div className="flex aspect-square size-6 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <HugeiconsIcon size={16} icon={DocumentValidationIcon} />{" "}
            </div>
            <span>SDVS</span>{" "}
          </div>{" "}
          <nav className="flex items-center gap-4">
            <Link to={"/"}> Docs</Link>
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
          <h1 className=" text-2xl md:text-4xl font-medium">
         Trusted Document Issuance & Verification <br />
            <span className="mt-4 block text-lg md:text-2xl text-muted-foreground">
             Built on cryptographic proofs for authenticity, integrity, and non-repudiation
            </span>
          </h1>
          <div className="md:mt-6 mt-10 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 text-lg text-muted-foreground md:justify-normal">
            <Link className="w-full md:w-auto" to={"/auth/sign-in"}>
              {" "}
              <Button className="w-1/2 md:w-fit">Sign in</Button>{" "}
            </Link>
            <span className="mx-2 text-xs md:inline-block">or</span>{""}
            <Link className="w-full md:w-auto" to={"/auth/sign-up"}>
              <Button variant={"ghost"} className="border w-4/6 md:w-fit border-border">
                Create an account.
              </Button>
            </Link>
          </div>
        </div>
        <div>
          <img
            src={heroImage}
            className="rounded-md"
            alt="Authentic document image"
          />
        </div>
      </div>
   <Footer/> 
    </div>
  )
}

export default Home
