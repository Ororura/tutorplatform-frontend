"use client";

import { Download } from "lucide-react";
import { useState } from "react";

import { downloadPublicReportPdf, downloadTeacherReportPdf } from "@/entities/report";
import { ApiClientError } from "@/shared/api/client";
import { Button } from "@/shared/ui/button";

type Props =
  { audience: "teacher"; reportId: string; token?: never } | { audience: "parent"; token: string; reportId?: never };

export function ReportPdfDownloadButton(props: Readonly<Props>) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function download() {
    setPending(true);
    setError("");
    try {
      if (props.audience === "teacher") await downloadTeacherReportPdf(props.reportId);
      else await downloadPublicReportPdf(props.token);
    } catch (cause) {
      const status = cause instanceof ApiClientError ? cause.status : undefined;
      if (status === 404) setError("PDF отчёта не найден.");
      else if (status === 410) setError("Ссылка больше не действует.");
      else setError("Не удалось скачать PDF. Попробуйте ещё раз.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="secondary" disabled={pending} onClick={() => void download()}>
        <Download className="mr-2" size={16} aria-hidden="true" />
        {pending ? "Скачиваем…" : "Скачать PDF"}
      </Button>
      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
