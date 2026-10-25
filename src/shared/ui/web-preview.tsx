"use client";

import { useEffect, useRef, useState } from "react";
import type { WebFiles } from "@/shared/lib/web-exercise";
import { Button } from "@/shared/ui/button";
import { Select } from "@/shared/ui/form-controls";

export function WebPreview({ files }: Readonly<{ files: WebFiles }>) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [version, setVersion] = useState(0);
  const [width, setWidth] = useState("100%");
  const [messages, setMessages] = useState<string[]>([]);
  const snapshot = useRef(files);
  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.source !== frame.current?.contentWindow || event.origin !== "null") return;
      if (event.data?.type === "web-preview-ready") {
        frame.current?.contentWindow?.postMessage({ type: "web-preview-source", files: snapshot.current }, "*");
      } else if (event.data?.type === "web-preview-log" && typeof event.data.message === "string") {
        const message = String(event.data.level) + ": " + event.data.message.slice(0, 2000);
        setMessages((current) => (current.length < 100 ? [...current, message] : current));
      }
    }
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);
  return (
    <section className="space-y-3" aria-label="Предпросмотр решения">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            snapshot.current = files;
            setMessages([]);
            setVersion((value) => value + 1);
          }}
        >
          Обновить предпросмотр
        </Button>
        <label className="flex items-center gap-2 text-sm">
          Ширина
          <Select aria-label="Ширина предпросмотра" value={width} onChange={(event) => setWidth(event.target.value)}>
            <option value="100%">По ширине окна</option>
            <option value="375px">375 px</option>
            <option value="600px">600 px</option>
            <option value="1024px">1024 px</option>
          </Select>
        </label>
      </div>
      <div className="overflow-x-auto rounded-control border border-border bg-white">
        <iframe
          ref={frame}
          key={version}
          src="/web-preview"
          title="Результат HTML, CSS и JavaScript"
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          className="h-80 border-0"
          style={{ width, maxWidth: "none" }}
        />
      </div>
      <details className="rounded-control border border-border p-3 text-sm" open={messages.length > 0}>
        <summary>Консоль ({messages.length})</summary>
        <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-xs">
          {messages.join("\n") || "Сообщений пока нет."}
        </pre>
      </details>
    </section>
  );
}
