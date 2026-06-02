import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAdminSession } from "@/lib/admin-auth";
import { sendTaskDigestEmail, type DigestTask } from "@/lib/task-digest-mail";

/* ── GET /api/admin/tasks/daily-digest ─────────────────────────────
   Her sabah çalışır (Vercel Cron). Açık görevleri atanan personele
   göre gruplayıp her birine günlük görev özetini e-posta atar.

   Yetki:
   - Vercel Cron: Authorization: Bearer ${CRON_SECRET}
   - Manuel test:  ?key=${CRON_SECRET}  veya admin oturumu
─────────────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const key = new URL(req.url).searchParams.get("key");
  const secret = process.env.CRON_SECRET;

  const viaCron = !!secret && authHeader === `Bearer ${secret}`;
  const viaKey = !!secret && key === secret;
  const viaAdmin = await getAdminSession();

  if (!viaCron && !viaKey && !viaAdmin) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  // 1) Aktif personel (isim → e-posta)
  const { data: staff, error: staffErr } = await supabase
    .from("staff_users")
    .select("name, email, active")
    .eq("active", true);
  if (staffErr) return NextResponse.json({ error: staffErr.message }, { status: 500 });

  const emailByName = new Map<string, string>();
  (staff || []).forEach(s => { if (s.name && s.email) emailByName.set(s.name, s.email); });

  // 2) Açık görevler (tamamlanmamış)
  const { data: tasks, error: taskErr } = await supabase
    .from("work_tasks")
    .select("title, category, priority, status, due_date, assigned_to, companies(name)")
    .neq("status", "done");
  if (taskErr) return NextResponse.json({ error: taskErr.message }, { status: 500 });

  const today = new Date().toISOString().slice(0, 10);

  // 3) Atanan kişiye göre grupla
  const grouped = new Map<string, DigestTask[]>();
  for (const t of (tasks || []) as Array<{
    title: string; category?: string; priority?: string; status?: string;
    due_date?: string; assigned_to?: string; companies?: { name?: string } | null;
  }>) {
    if (!t.assigned_to) continue;
    const list = grouped.get(t.assigned_to) || [];
    list.push({
      title: t.title,
      category: t.category,
      priority: t.priority,
      status: t.status,
      due_date: t.due_date,
      company_name: t.companies?.name,
      overdue: !!t.due_date && t.due_date < today,
      dueToday: t.due_date === today,
    });
    grouped.set(t.assigned_to, list);
  }

  // 4) Her personele e-posta gönder
  const results: { name: string; email?: string; taskCount: number; sent: boolean; error?: string }[] = [];
  for (const [name, list] of grouped) {
    const email = emailByName.get(name);
    if (!email) { results.push({ name, taskCount: list.length, sent: false, error: "e-posta bulunamadı" }); continue; }
    // Önce gecikmiş, sonra bugün, sonra diğerleri
    list.sort((a, b) => (Number(b.overdue) - Number(a.overdue)) || (Number(b.dueToday) - Number(a.dueToday)));
    try {
      await sendTaskDigestEmail({ staffName: name, staffEmail: email, tasks: list });
      results.push({ name, email, taskCount: list.length, sent: true });
    } catch (e) {
      results.push({ name, email, taskCount: list.length, sent: false, error: e instanceof Error ? e.message : "hata" });
    }
  }

  return NextResponse.json({
    success: true,
    date: today,
    staffNotified: results.filter(r => r.sent).length,
    results,
  });
}
