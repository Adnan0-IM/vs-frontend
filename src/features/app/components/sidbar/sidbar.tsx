import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  ClipboardCheckIcon,
  DashboardCircleSettingsIcon,
  FileUploadIcon,
  Files02Icon,
  Settings,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { authClient } from "@/lib/auth-client"
import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"
import { Link } from "react-router"

const data = {
  user: {
    name: "Adnan",
    email: "adnan@gmail.com",
    avatar: "",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: DashboardCircleSettingsIcon,
      isActive: true,
    },
    {
      title: "Documents",
      url: "/dashboard/documents",
      icon: Files02Icon,
    },
    {
      title: "Upload Document",
      url: "/dashboard/upload-document",
      icon: FileUploadIcon,
    },
    {
      title: "Verification Logs",
      url: "/dashboard/verification-logs",
      icon: ClipboardCheckIcon,
    },
    {
      title: "Members",
      url: "/dashboard/members",
      icon: UserGroupIcon,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings,
    },
  ],
}
// function to abbreviat a title if it is longer than 20 characters
// example Federal University Dutse should return FUD
const abbreviateTitle = (title: string) => {
  if (!title) return ""
  if (title.length > 20) {
    return title
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
  }
  return title
}
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: organizations } = authClient.useListOrganizations()
  const { data: session } = authClient.useSession()
  const sidebarUser = session?.user
    ? {
        name: session.user.name ?? data.user.name,
        email: session.user.email ?? data.user.email,
        avatar: session.user.image ?? data.user.avatar,
      }
    : data.user
  if (!organizations || organizations.length === 0) {
    return (
      <Sidebar variant="inset" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to="#">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <img src={""} alt="logo" />
                  </div>
                  <div className="grid flex-1 gap-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">Org name</span>
                    <span className="truncate text-xs text-muted-foreground capitalize">
                      Org type
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={data.navMain} />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
      </Sidebar>
    )
  }
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <img
                    src={organizations?.[0]?.logo as string | undefined}
                    alt="logo"
                  />
                </div>
                <div className="grid flex-1 gap-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {abbreviateTitle(organizations?.[0]?.name as string)}
                  </span>
                  <span className="truncate text-xs text-muted-foreground capitalize">
                    {JSON.parse(organizations?.[0]?.metadata)?.type}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
