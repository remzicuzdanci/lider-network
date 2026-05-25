import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import AdminDashboard from "./AdminDashboard";

export default async function AdminDestek() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) redirect("/admin/login");
  return <AdminDashboard />;
}
