import { Search } from "@hugeicons/core-free-icons"

import { Label } from "@/components/ui/label"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarInput,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"

export function SearchForm({ isMobile, ...props }: React.ComponentProps<"form"> & { isMobile?: boolean }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Implement search functionality here
  }
  return (
    <form {...props} onSubmit={handleSubmit}>
      <SidebarGroup className="py-0">
        <SidebarGroupContent className="relative">
          <Label htmlFor="search" className="sr-only">
            Search
          </Label>
          {isMobile && (
            <HugeiconsIcon
              className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none"
              icon={Search}
            />
          )}
          <SidebarInput
            id="search"
            placeholder="Search the docs..."
            className="pl-8"
            value={""}
          />
         
        </SidebarGroupContent>
      </SidebarGroup>
    </form>
  )
}
