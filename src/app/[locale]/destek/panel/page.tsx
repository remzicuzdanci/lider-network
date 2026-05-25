import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { supabase } from "@/lib/supabase";
import PanelClient from "./PanelClient";

export default async function PanelPage() {
  const sb = await createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) redirect("/tr/destek/giris");

  const { data: profile } = await supabase
    .from("customer_profiles")
    .select("full_name, company, phone, approved")
    .eq("id", user.id)
    .single();

  if (!profile?.approved) redirect("/tr/destek/giris");

  return (
    <PanelClient
      userId={user.id}
      userEmail={user.email!}
      fullName={profile.full_name}
      company={profile.company}
    />
  );
}
