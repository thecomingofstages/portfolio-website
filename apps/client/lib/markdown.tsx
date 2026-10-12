import ReactMarkdown from "react-markdown";

/**
 * Renders Markdown (article bodies) without raw HTML: HTML in the source is
 * dropped, never rendered. Unsafe link protocols (javascript: ...) are removed
 * by react-markdown's default URL check.
 */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={className}>
      <ReactMarkdown skipHtml>{children}</ReactMarkdown>
    </div>
  );
}
