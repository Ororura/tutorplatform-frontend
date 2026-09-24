import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiTransport } from "@/shared/api/client";

import { downloadPublicReportPdf, downloadTeacherReportPdf } from "./report-download";

vi.mock("@/shared/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/client")>()),
  apiTransport: vi.fn(),
}));

const transport = vi.mocked(apiTransport);

describe("report PDF download", () => {
  beforeEach(() => {
    transport.mockReset();
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:report"),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  });

  it("downloads a teacher PDF using the backend filename", async () => {
    transport.mockResolvedValue(
      new Response("pdf", {
        status: 200,
        headers: { "Content-Disposition": 'attachment; filename="report-september.pdf"' },
      }),
    );

    await downloadTeacherReportPdf("report/id");
    expect(transport).toHaveBeenCalledWith("/api/v1/teacher/reports/report%2Fid/pdf", { method: "GET" });
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:report");
  });

  it("uses the public PDF endpoint and preserves 410", async () => {
    transport.mockResolvedValue(
      new Response(
        JSON.stringify({
          code: "REPORT_SHARE_EXPIRED",
          message: "expired",
          timestamp: "2026-09-24T10:00:00Z",
          traceId: "trace",
          details: [],
        }),
        { status: 410, headers: { "Content-Type": "application/json" } },
      ),
    );

    await expect(downloadPublicReportPdf("token/value")).rejects.toMatchObject({ status: 410 });
    expect(transport).toHaveBeenCalledWith("/api/v1/public/reports/token%2Fvalue/pdf", { method: "GET" });
  });
});
