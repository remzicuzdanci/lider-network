import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const isAdmin = await getAdminSession();
  if (isAdmin) redirect("/admin/destek");
  return <LoginForm />;
}
