import { AcceptStudentInvitePage } from "@/_pages/accept-student-invite";

export default async function Page({ params }: Readonly<{ params: Promise<{ token: string }> }>) {
  const { token } = await params;

  return <AcceptStudentInvitePage token={token} />;
}
