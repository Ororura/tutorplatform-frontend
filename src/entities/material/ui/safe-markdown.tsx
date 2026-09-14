import type { ReactNode } from "react";

function safeExternalUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function renderInline(value: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(value)) !== null) {
    parts.push(value.slice(cursor, match.index));
    const href = safeExternalUrl(match[2]);
    parts.push(href ? (
      <a className="underline underline-offset-4" href={href} key={`${match.index}-${href}`} rel="noopener noreferrer" target="_blank">
        {match[1]}
      </a>
    ) : match[1]);
    cursor = match.index + match[0].length;
  }
  parts.push(value.slice(cursor));
  return parts;
}

export function SafeMarkdown({ children }: Readonly<{ children: string }>) {
  const lines = children.split("\n");
  const blocks: ReactNode[] = [];
  let code: string[] | null = null;

  lines.forEach((line, index) => {
    if (line.startsWith("```")) {
      if (code) {
        blocks.push(<pre className="overflow-x-auto rounded-md bg-neutral-950 p-4 text-sm text-neutral-100" key={`code-${index}`}><code>{code.join("\n")}</code></pre>);
        code = null;
      } else {
        code = [];
      }
      return;
    }
    if (code) {
      code.push(line);
      return;
    }
    if (line.startsWith("### ")) {
      blocks.push(<h4 className="font-semibold" key={index}>{renderInline(line.slice(4))}</h4>);
    } else if (line.startsWith("## ")) {
      blocks.push(<h3 className="text-lg font-semibold" key={index}>{renderInline(line.slice(3))}</h3>);
    } else if (line.startsWith("# ")) {
      blocks.push(<h2 className="text-xl font-semibold" key={index}>{renderInline(line.slice(2))}</h2>);
    } else if (line.startsWith("- ")) {
      blocks.push(<div className="pl-4" key={index}>• {renderInline(line.slice(2))}</div>);
    } else if (line.trim()) {
      blocks.push(<p key={index}>{renderInline(line)}</p>);
    } else {
      blocks.push(<div className="h-2" key={index} />);
    }
  });

  const trailingCode = code as string[] | null;
  if (trailingCode) {
    blocks.push(<pre className="overflow-x-auto rounded-md bg-neutral-950 p-4 text-sm text-neutral-100" key="code-unclosed"><code>{trailingCode.join("\n")}</code></pre>);
  }

  return <div className="space-y-2 leading-7">{blocks}</div>;
}
