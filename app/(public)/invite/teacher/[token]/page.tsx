import { AcceptTeacherInvitePage } from "@/_pages/teacher/accept-invite";

export default async function Page({
  params,
}: Readonly<{
  params: Promise<{ token: string }>;
}>) {
  const { token } = await params;

  return <AcceptTeacherInvitePage token={token} />;
}
