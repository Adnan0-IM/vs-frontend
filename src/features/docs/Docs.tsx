import { DocsContent } from "./component/DocsContent"
import { DocsLayout } from "./component/DocsLayout"
import type { DocSection } from "./types"
import { useLocation } from "react-router"
import Markdown from "react-markdown"
import { content } from "./contents.ts"
import Footer from "@/components/Footer.tsx"

const sections: DocSection[] = [
  {
    title: "Overview",
    pages: [
      {
        slug: "introduction",
        title: "Introduction",
        href: "/docs/introduction",
      },
      { slug: "features", title: "Features", href: "/docs/features" },
    ],
  },
  {
    title: "Getting Started ",
    pages: [
      {
        slug: "requirements",
        title: "System Requirements",
        href: "/docs/requirements",
      },
      {
        slug: "installation",
        title: "Installation",
        href: "/docs/installation",
      },
      {
        slug: "environment-setup",
        title: "Environment Setup",
        href: "/docs/environment-setup",
      },
    ],
  },
  {
    title: "User Guide",
    pages: [
      {
        slug: "organization-account",
        title: "Organization Account",
        href: "/docs/organization-account",
      },
      {
        slug: "upload-document",
        title: "Upload Document",
        href: "/docs/upload-document",
      },
      {
        slug: "generate-qr-code",
        title: "Generate QR Code",
        href: "/docs/generate-qr-code",
      },
      {
        slug: "verify-document",
        title: "Verify Document",
        href: "/docs/verify-document",
      },
    ],
  },
  {
    title: "Developer Guide",
    pages: [
      {
        slug: "backend-development",
        title: "Backend Development",
        href: "/docs/backend-development",
      },
      {
        slug: "frontend-development",
        title: "Frontend Development",
        href: "/docs/frontend-development",
      },
      { slug: "api-usage", title: "API Usage", href: "/docs/api-usage" },
    ],
  },
  {
    title: "Troubleshooting",
    pages: [
      {
        slug: "common-problems",
        title: "Common Problems",
        href: "/docs/common-problems",
      },
      { slug: "faq", title: "FAQ", href: "/docs/faq" },
    ],
  },
]

function Docs() {
  const location = useLocation()
  const currentSlug = location.pathname.split("/").pop() || "introduction"

  const markdown =
    content.find((doc) => doc.slug.trim() === currentSlug)?.content ||
    "# Not Found\n\nThe requested document was not found."

  console.log(currentSlug)
  console.log(content)
  console.log(markdown)
  return (
    <>
      <DocsLayout sections={sections} currentSlug={currentSlug}>
        <DocsContent>
          <Markdown>{markdown}</Markdown>
        </DocsContent>
      </DocsLayout>
      <Footer />
    </>
  )
}

export default Docs
