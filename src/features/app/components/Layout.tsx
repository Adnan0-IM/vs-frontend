import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Link, useLocation } from "react-router"
import { AppSidebar } from "./sidbar/sidbar"

const breadcrumbTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/documents": "Documents",
  "/dashboard/upload-document": "Upload Document",
  "/dashboard/verification-logs": "Verification Logs",
  "/dashboard/members": "Members",
  "/dashboard/settings": "Settings",
}

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation()
  const pageTitle = breadcrumbTitles[pathname] ?? "Dashboard"

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink asChild>
                      <Link to="/dashboard">Dashboard</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {pathname !== "/dashboard" ? (
                    <>
                      <BreadcrumbSeparator className="hidden md:block" />
                      <BreadcrumbItem>
                        <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  ) : null}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <main>{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}

export default Layout
