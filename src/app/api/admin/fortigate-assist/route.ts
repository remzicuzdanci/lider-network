import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAdminSession, getSessionUser } from "@/lib/admin-auth";
import { posts } from "@/data/blog";

export const maxDuration = 60;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

// Soruyla en alakalı blog yazılarını basit anahtar kelime eşleşmesiyle bul
function relevantPosts(problem: string, limit = 4) {
  const stop = new Set(["için", "veya", "gibi", "olan", "nedir", "nasıl", "sorun", "hata", "ama", "the", "and", "için"]);
  const tokens = problem.toLowerCase().replace(/[^\wçğıöşü\s]/gi, " ").split(/\s+/).filter(w => w.length >= 3 && !stop.has(w));
  const scored = posts.map(p => {
    const hay = `${p.title} ${p.tags.join(" ")} ${p.excerpt} ${p.category}`.toLowerCase();
    let score = 0;
    for (const t of tokens) if (hay.includes(t)) score++;
    return { p, score };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
  return scored.map(x => x.p);
}

export async function POST(req: NextRequest) {
  const isAdmin = await getAdminSession();
  const user = await getSessionUser();
  if (!isAdmin && !user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI yapılandırılmamış: ANTHROPIC_API_KEY ekleyin." }, { status: 503 });
  }

  const { problem } = await req.json();
  if (!problem || !String(problem).trim()) {
    return NextResponse.json({ error: "Sorun açıklaması gerekli" }, { status: 400 });
  }

  const refs = relevantPosts(String(problem));
  const refsText = refs.length
    ? refs.map((p, i) => `[${i + 1}] ${p.title}\nÖzet: ${p.excerpt}`).join("\n\n")
    : "(İlgili dahili makale bulunamadı.)";

  const system = `Sen FortiGate ve Fortinet ürünlerinde uzman, deneyimli bir kıdemli ağ güvenliği mühendisisin. Lider Network'ün teknik destek ekibine, müşteri sorunlarını çözmeleri için Türkçe, net ve uygulanabilir rehberlik veriyorsun.

KURALLAR:
- Yalnızca FortiGate/Fortinet (ve ilgili ağ) bağlamında, pratik ve doğru adımlar ver.
- Emin olmadığın bir komutu uydurma; genel ve güvenli yönlendirme yap.
- GUI yollarını "Menü > Alt Menü" biçiminde, CLI komutlarını gerçekçi FortiOS sözdizimiyle ver.
- Yanıtı SADECE geçerli JSON olarak ver. Markdown, açıklama, kod bloğu kullanma.

JSON ŞEMASI:
{
  "ozet": "1-2 cümle durum/çözüm özeti",
  "olasiSebepler": ["olası sebep", "..."],
  "adimlar": [
    { "baslik": "kısa adım başlığı", "aciklama": "ne yapılacağı", "gui": "System > ... (yoksa null)", "cli": ["komut", "..."] }
  ],
  "diyagram": "Mermaid flowchart kodu. 'flowchart TD' ile başla, kısa Türkçe düğümler, karar noktaları kullan. Sadece diyagram kodu.",
  "uyari": "varsa kritik uyarı, yoksa null"
}

Dahili bilgi kaynakları (Lider Network blog) — uygunsa adımları bunlarla tutarlı kur:
${refsText}`;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system,
      messages: [{ role: "user", content: `Destek ekibinin karşılaştığı sorun:\n\n"${String(problem).trim()}"\n\nLütfen şemaya uygun JSON yanıtı ver.` }],
    });

    const raw = msg.content.filter(c => c.type === "text").map(c => (c as { text: string }).text).join("").trim();
    const jsonStr = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

    let parsed: unknown;
    try { parsed = JSON.parse(jsonStr); }
    catch { return NextResponse.json({ error: "AI yanıtı işlenemedi", raw }, { status: 502 }); }

    return NextResponse.json({
      ...(parsed as object),
      relatedPosts: refs.map(p => ({ slug: p.slug, title: p.title })),
    });
  } catch (e) {
    console.error("FortiGate asistan hatası:", e);
    return NextResponse.json({ error: "AI çağrısı başarısız: " + (e instanceof Error ? e.message : "hata") }, { status: 500 });
  }
}
