import * as React from "react"

import { HugeiconsIcon } from "@hugeicons/react"
import { NavLink } from "react-router"
import { useLocation } from "react-router"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: Parameters<typeof HugeiconsIcon>[0]["icon"]
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const { pathname } = useLocation()
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                size="sm"
                isActive={
                  pathname === item.url || pathname.startsWith(`${item.url}/`)
                }
              >
                <NavLink to={item.url}>
                  <HugeiconsIcon icon={item.icon} />
                  <span>{item.title}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
