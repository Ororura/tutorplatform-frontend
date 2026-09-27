import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

function safeExternalUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function SafeMarkdown({ children }: Readonly<{ children: string }>) {
  return (
    <div className="min-w-0 max-w-prose break-words text-neutral-800">
      <Markdown
        remarkPlugins={[remarkGfm]}
        disallowedElements={["img"]}
        urlTransform={(url) => safeExternalUrl(url) ?? ""}
        components={{
          h1: ({ children }) => <h1 className="mb-4 mt-7 text-3xl font-bold leading-tight first:mt-0">{children}</h1>,
          h2: ({ children }) => (
            <h2 className="mb-3 mt-7 text-2xl font-semibold leading-tight first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => <h3 className="mb-3 mt-6 text-xl font-semibold leading-snug first:mt-0">{children}</h3>,
          h4: ({ children }) => <h4 className="mb-2 mt-5 text-lg font-semibold first:mt-0">{children}</h4>,
          h5: ({ children }) => <h5 className="mb-2 mt-4 text-base font-semibold first:mt-0">{children}</h5>,
          h6: ({ children }) => <h6 className="mb-2 mt-4 text-sm font-semibold first:mt-0">{children}</h6>,
          p: ({ children }) => <p className="my-3 leading-7 first:mt-0 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          a: ({ href, children }) =>
            href ? (
              <a
                className="text-blue-700 underline underline-offset-4 hover:text-blue-900"
                href={href}
                rel="noopener noreferrer"
                target="_blank"
              >
                {children}
              </a>
            ) : (
              <span>{children}</span>
            ),
          code: ({ children, className }) => (
            <code className={`rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[0.9em] ${className ?? ""}`}>
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="my-4 overflow-x-auto rounded-lg bg-neutral-950 p-4 font-mono text-sm leading-6 text-neutral-100 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit">
              {children}
            </pre>
          ),
          ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-6 leading-7">{children}</ul>,
          ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-6 leading-7">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-4 border-blue-200 bg-slate-50 py-1 pl-4 pr-3 text-neutral-700 [&_p]:my-2">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-6 border-neutral-200" />,
          table: ({ children }) => (
            <table className="my-4 block w-full overflow-x-auto border-collapse text-left text-sm">{children}</table>
          ),
          th: ({ children }) => (
            <th className="border border-neutral-300 bg-slate-50 px-3 py-2 font-semibold">{children}</th>
          ),
          td: ({ children }) => <td className="border border-neutral-300 px-3 py-2">{children}</td>,
        }}
      >
        {children}
      </Markdown>
    </div>
  );
}
