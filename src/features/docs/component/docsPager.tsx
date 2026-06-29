import { ArrowLeft, ArrowRight } from "@hugeicons/core-free-icons";
import {HugeiconsIcon} from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import type { DocSection } from "../types";
import { Link } from "react-router";
import { Separator } from "@/components/ui/separator";

interface DocsPagerProps {
  sections: DocSection[];
  currentSlug: string;
}


export function DocsPager({ sections, currentSlug }: DocsPagerProps) {
  const allPages = sections.flatMap((section) => section.pages);
  const currentIndex = allPages.findIndex((page) => page.slug === currentSlug);
  
  const prevPage = currentIndex > 0 ? allPages[currentIndex - 1] : null;
  const nextPage = currentIndex < allPages.length - 1 ? allPages[currentIndex + 1] : null;

  if (!prevPage && !nextPage) return null;

  return (
    <div className="mt-16">
      <Separator className="mb-8" />
      <nav aria-label="Pager">
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">
          
          {/* Previous */}
          {prevPage ? (
            <Button
              variant="ghost"
              asChild
              className="group h-auto py-3 px-4 -mx-4 hover:bg-accent"
            >
              <Link to={prevPage.href} className="flex items-center gap-3 no-underline">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background group-hover:border-primary/50 transition-colors">
                  <HugeiconsIcon icon={ArrowLeft} className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Previous
                  </span>
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {prevPage.title}
                  </span>
                </div>
              </Link>
            </Button>
          ) : (
            <div className="hidden sm:block" />
          )}

          {/* Next */}
          {nextPage ? (
            <Button
              variant="ghost"
              asChild
              className="group h-auto py-3 px-4 -mx-4 hover:bg-accent sm:ml-auto"
            >
              <Link to={nextPage.href} className="flex items-center gap-3 no-underline">
                <div className="flex flex-col items-end text-right">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Next
                  </span>
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {nextPage.title}
                  </span>
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background group-hover:border-primary/50 transition-colors">
                  <HugeiconsIcon icon={ArrowRight} className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
            </Button>
          ) : (
            <div className="hidden sm:block" />
          )}
          
        </div>
      </nav>
    </div>
  );
}