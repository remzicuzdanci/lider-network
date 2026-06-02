import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import TicketDetailClient from "./TicketDetailClient";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const isAdmin = await getAdminSession();
  if (!isAdmin) redirect("/admin/login");
  const { id } = await params;
  return <TicketDetailClient ticketId={id} />;
}
