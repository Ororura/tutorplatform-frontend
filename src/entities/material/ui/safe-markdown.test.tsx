import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SafeMarkdown } from "./safe-markdown";

describe("SafeMarkdown", () => {
  it("renders emphasis, inline code, and Russian text", () => {
    const { container } = render(
      <SafeMarkdown>{"Русский **жирный текст**, *курсив* и `python3 --version`."}</SafeMarkdown>,
    );
    expect(screen.getByText("жирный текст", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText("курсив", { selector: "em" })).toBeInTheDocument();
    expect(screen.getByText("python3 --version", { selector: "code" })).toBeInTheDocument();
    expect(container.textContent).not.toContain("**");
    expect(container.textContent).not.toContain("`");
  });

  it("renders fenced Python code with indentation intact", () => {
    const code = 'if ready:\n    print("Hello World")';
    const { container } = render(<SafeMarkdown>{`\`\`\`python\n${code}\n\`\`\``}</SafeMarkdown>);
    expect(container.querySelector("pre code")?.textContent).toBe(`${code}\n`);
  });

  it("renders all heading levels, lists, quotes, rules, and GFM tables", () => {
    const markdown = [
      "# H1",
      "## H2",
      "### H3",
      "#### H4",
      "##### H5",
      "###### H6",
      "",
      "- first",
      "  - nested",
      "",
      "1. one",
      "2. two",
      "",
      "> quoted",
      "",
      "---",
      "",
      "| Name | Value |",
      "| --- | --- |",
      "| Python | 3.11 |",
    ].join("\n");
    const { container } = render(<SafeMarkdown>{markdown}</SafeMarkdown>);
    for (let level = 1; level <= 6; level++) {
      expect(screen.getByRole("heading", { level, name: `H${level}` })).toBeInTheDocument();
    }
    expect(container.querySelector("ul ul")).toBeInTheDocument();
    expect(container.querySelector("ol li")).toHaveTextContent("one");
    expect(container.querySelector("blockquote")).toHaveTextContent("quoted");
    expect(container.querySelector("hr")).toBeInTheDocument();
    expect(container.querySelector("table")).toHaveTextContent("Python");
  });

  it("allows only safe external links and blocks raw HTML and images", () => {
    const markdown = [
      "[safe](https://example.com/path)",
      "[unsafe](javascript:alert%281%29)",
      '<script>alert("x")</script>',
      '<a href="https://example.com" onclick="alert(1)">raw</a>',
      "![remote](https://example.com/image.png)",
    ].join("\n\n");
    const { container } = render(<SafeMarkdown>{markdown}</SafeMarkdown>);
    expect(screen.getByRole("link", { name: "safe" })).toHaveAttribute("href", "https://example.com/path");
    expect(screen.getByRole("link", { name: "safe" })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "safe" })).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.queryByRole("link", { name: "unsafe" })).not.toBeInTheDocument();
    expect(container.querySelector("script, img, a[onclick]")).toBeNull();
    expect(container.textContent).toContain("<script>");
  });

  it("renders empty Markdown without content", () => {
    const { container } = render(<SafeMarkdown>{""}</SafeMarkdown>);
    expect(container.querySelector("div")).toBeEmptyDOMElement();
  });
});
