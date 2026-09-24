import { PublicReportPage } from "@/_pages/public/report";

export default async function Page({ params }: Readonly<{ params: Promise<{ token: string }> }>) {
  const { token } = await params;
  return <PublicReportPage token={token} />;
}
