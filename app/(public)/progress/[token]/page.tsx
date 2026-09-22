import { PublicProgressPage } from "@/_pages/public/progress";

export default async function Page({ params }: Readonly<{ params: Promise<{ token: string }> }>) {
  const { token } = await params;

  return <PublicProgressPage token={token} />;
}
