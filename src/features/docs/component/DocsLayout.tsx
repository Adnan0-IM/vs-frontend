import { useState, useEffect, useCallback } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { HugeiconsIcon } from "@hugeicons/react"
import { ChevronRight } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import type { DocSection, Heading } from "../types"
import { DocsPager } from "./docsPager"
import { Link } from "react-router"
import Header from "./Header"
import Footer from "./Footer"

interface DocsLayoutProps {
  children: React.ReactNode
  sections: DocSection[]
  currentSlug: string
}

export function DocsLayout({
  children,
  sections,
  currentSlug,
}: DocsLayoutProps) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeHeading, setActiveHeading] = useState<string>("")
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    // Auto-open section containing current page
    const initial = new Set<string>()
    sections.forEach((section) => {
      if (section.pages.some((p) => p.slug === currentSlug)) {
        initial.add(section.title)
      }
    })
    return initial
  })

  // Extract headings from main content
  useEffect(() => {
    const content = document.querySelector("[data-docs-content]")
    if (!content) return

    const elements = content.querySelectorAll("h2, h3")
    const extracted: Heading[] = []

    elements.forEach((el) => {
      if (!el.id) {
        el.id =
          el.textContent
            ?.toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-") ?? ""
      }
      extracted.push({
        id: el.id,
        text: el.textContent || "",
        level: el.tagName === "H2" ? 2 : 3,
      })
    })
    const callSetHeading = () => {
      setHeadings(extracted)
    }
    callSetHeading()
  }, [children])

  // Scroll spy with IntersectionObserver
  useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visible.length > 0) {
          setActiveHeading(visible[0].target.id)
        }
      },
      {
        rootMargin: "-80px 0px -70% 0px",
        threshold: 0,
      }
    )

    headings.forEach((h) => {
      const el = document.getElementById(h.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [headings])

  const scrollToHeading = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (el) {
      const offset = 80
      const top = el.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: "smooth" })
    }
  }, [])

  const toggleSection = (title: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      return next
    })
  }

  const isSectionOpen = (title: string) => openSections.has(title)

  useEffect(() => {
    // Auto-open section containing current page when currentSlug changes
    sections.forEach((section) => {
      if (section.pages.some((p) => p.slug === currentSlug)) {
        setOpenSections((prev) => new Set(prev).add(section.title))
      }
    })
  }, [currentSlug, sections])

  return (
    <div className="relative min-h-screen bg-background">
      <Header
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
      />

      <div className="container mx-auto max-w-350">
        <div className="flex">
          {/* Left Sidebar */}
          <aside
            className={cn(
              "fixed inset-y-0 z-30 top-[4.34rem] left-0 w-72 transform border-r bg-background transition-transform duration-200 ease-in-out lg:sticky lg:top-20 lg:block lg:h-[calc(100vh-5rem)] lg:translate-x-0 lg:self-start",
              mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <div className="flex h-full flex-col">
              <ScrollArea className="h-[calc(100vh-4rem)] flex-1 px-3 py-4">
                <nav className="space-y-1">
                  {sections.map((section) => (
                    <Collapsible
                      key={section.title}
                      open={isSectionOpen(section.title)}
                      onOpenChange={() => toggleSection(section.title)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-between px-2 text-sm font-semibold hover:bg-accent"
                        >
                          {section.title}
                          <HugeiconsIcon
                            className={cn(
                              "h-4 w-4 transition-transform",
                              isSectionOpen(section.title) && "rotate-90"
                            )}
                            icon={ChevronRight}
                          />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-1 ml-2 space-y-1 border-l pl-2">
                          {section.pages.map((page) => (
                            <Button
                              key={page.slug}
                              variant="ghost"
                              asChild
                              className={cn(
                                "w-full justify-start text-sm font-normal",
                                page.slug === currentSlug
                                  ? "bg-accent font-medium text-accent-foreground"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <Link to={page.href}>{page.title}</Link>
                            </Button>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </nav>
              </ScrollArea>
            </div>
          </aside>

          {/* Main Content */}
          <main className="min-w-0 flex-1">
            <article
              data-docs-content
              className="prose prose-slate dark:prose-invert max-w-none px-4 py-8 lg:px-8"
            >
              {children}
            </article>
            {/* Previous / Next Navigation */}
            <div className="px-4 lg:px-8">
              <DocsPager sections={sections} currentSlug={currentSlug} />
            </div>
          </main>
          {/* Right Rail */}
          <aside className="hidden w-64 shrink-0 xl:block">
            <div className="sticky top-20">
              {headings.length > 0 && (
                <div className="border-l pl-4">
                  <p className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    On this page
                  </p>
                  <ScrollArea className="h-[calc(100vh-8rem)]">
                    <nav className="space-y-1">
                      {headings.map((heading) => (
                        <button
                          key={heading.id}
                          onClick={() => scrollToHeading(heading.id)}
                          className={cn(
                            "block w-full text-left text-sm transition-colors hover:text-foreground",
                            heading.level === 3 && "ml-3",
                            activeHeading === heading.id
                              ? "font-medium text-primary"
                              : "text-muted-foreground"
                          )}
                        >
                          <span
                            className={cn(
                              "block border-l-2 py-1 pl-3 transition-colors",
                              activeHeading === heading.id
                                ? "border-primary"
                                : "border-transparent"
                            )}
                          >
                            {heading.text}
                          </span>
                        </button>
                      ))}
                    </nav>
                  </ScrollArea>
                </div>
              )}
            </div>
          </aside>
        </div>
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
        <Footer />
      </div>
    </div>
  )
}
