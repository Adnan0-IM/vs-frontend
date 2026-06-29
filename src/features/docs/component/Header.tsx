import ThemeToggle from "@/components/theme-toggle"
import {
  DocumentValidationIcon,
  ExternalLinkIcon,
  Github,
  Menu,
  X,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "react-router"
import { Button } from "@/components/ui/button"

const Header = ({
  mobileSidebarOpen,
  setMobileSidebarOpen,
}: {
  mobileSidebarOpen: boolean
  setMobileSidebarOpen: (open: boolean) => void
}) => {
  return (
    <header className="sticky border-b border-border top-0 left-0 z-40 w-full bg-background p-4">
      <div className="flex items-center justify-between font-bold text-muted-foreground">
        <div className=" items-center flex ">
          <Button
          className="mr-2 md:hidden"
            variant="ghost"
            size="icon"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          >
            {mobileSidebarOpen ? (
              <HugeiconsIcon className="h-5 w-5" icon={X} />
            ) : (
              <HugeiconsIcon className="h-5 w-5" icon={Menu} />
            )}
          </Button>
          <Link to="/" className="flex items-center gap-2">
            <div className="flex aspect-square size-6 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <HugeiconsIcon size={16} icon={DocumentValidationIcon} />{" "}
            </div>
            <span>SDVS Documentation</span>{" "}
          </Link>{" "}
        </div>
        <nav className="flex items-center gap-4">
          <Link className="flex items-center gap-1" to="">
          <HugeiconsIcon className="md:hidden" icon={Github} /> <span className="hidden md:inline">Github</span>
            <HugeiconsIcon className="hidden md:inline" icon={ExternalLinkIcon} size={16} />
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}

export default Header
