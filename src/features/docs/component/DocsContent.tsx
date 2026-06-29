import { cn } from "@/lib/utils";

interface DocsContentProps {
  children: React.ReactNode;
  className?: string;
}

export function DocsContent({ children, className }: DocsContentProps) {
  return (
    <div
      className={cn(
        // Headings
        "[&_h1]:scroll-mt-20 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:mb-6",
        "[&_h2]:scroll-mt-20 [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight",
        "[&_h3]:scroll-mt-20 [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold",
        // Paragraphs
        "[&_p]:leading-7 [&_p]:text-muted-foreground [&_p]:mb-4",
        // Lists
        "[&_ul]:my-6 [&_ul]:ml-6 [&_ul]:list-disc [&_ul]:space-y-2",
        "[&_ol]:my-6 [&_ol]:ml-6 [&_ol]:list-decimal [&_ol]:space-y-2",
        // Code
        "[&_code]:relative [&_code]:rounded [&_code]:bg-muted [&_code]:px-[0.3rem] [&_code]:py-[0.2rem] [&_code]:font-mono [&_code]:text-sm",
        // Pre/code blocks
        "[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:my-6",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
        // Links
        "[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4",
        // Blockquotes
        "[&_blockquote]:mt-6 [&_blockquote]:border-l-2 [&_blockquote]:pl-6 [&_blockquote]:italic",
        // Tables
        "[&_table]:w-full [&_table]:my-6 [&_table]:text-sm",
        "[&_thead]:border-b [&_tr]:border-b [&_td]:p-2",
        className
      )}
    >
      {children}
    </div>
  );
}