import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAdminSession, getSessionUser } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";
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

ÖNEMLİ — ARAYÜZ ÖNCELİĞİ:
- Destek ekibimiz çoğunlukla FortiGate ve FortiClient ARAYÜZÜNÜ (GUI) kullanır, CLI'a nadiren girer.
- Bu yüzden HER adımda ÖNCELİKLE arayüzde tam olarak ne yapılacağını yaz: hangi menü/sekme, hangi KUTUCUK (checkbox), açılır liste veya ALAN değiştirilecek — somut isimleriyle.
  Örnek: "VPN > IPsec Tunnels > [tünel] > Edit; Phase 2 Selectors altında Source ve Destination address'i 0.0.0.0/0 yap"
  Örnek: "FortiClient > VPN Bağlantısı > Ayarlar; 'DNS Mode / Otomatik DNS' kutucuğunu KALDIR ve manuel DNS gir (ör. 9.9.9.9)"
- Çoğu sorunun çözümü arayüzdeki BASİT bir ayar veya kutucuktur — önce bu pratik GUI çözümlerini düşün, derin CLI'a yönelme.
- Hem FortiGate (sunucu) hem FortiClient (istemci) tarafındaki ayarları değerlendir.

KURALLAR:
- 'gui' alanına net, tıklanabilir arayüz yolunu VE yapılacak işlemi (kutucuk işaretle/kaldır, alana değer gir vb.) yaz. Bu alanı boş bırakma.
- 'cli' yalnızca EK/alternatif olarak, GUI mümkün değilse ver. Her adımda CLI zorunlu değildir.
- Emin olmadığın bir komutu/menüyü uydurma; genel ama güvenli yönlendirme yap.
- Diyagram için Mermaid 'flowchart TD' sözdizimi kullan; kısa Türkçe düğüm metinleri, karar noktaları. Düğüm metinlerinde parantez, tırnak, noktalı virgül kullanma.
- Yanıtını yalnızca 'cozum_sun' aracını çağırarak ver.

Dahili bilgi kaynakları (Lider Network blog) — uygunsa adımları bunlarla tutarlı kur:
${refsText}`;

  const tool: Anthropic.Tool = {
    name: "cozum_sun",
    description: "FortiGate sorununa yapılandırılmış çözüm sunar.",
    input_schema: {
      type: "object",
      properties: {
        ozet: { type: "string", description: "1-2 cümle durum/çözüm özeti" },
        olasiSebepler: { type: "array", items: { type: "string" } },
        adimlar: {
          type: "array",
          items: {
            type: "object",
            properties: {
              baslik: { type: "string" },
              aciklama: { type: "string" },
              gui: { type: "string", description: "Arayüzde tam yol + yapılacak işlem (menü/sekme/kutucuk/alan). Mutlaka doldur." },
              cli: { type: "array", items: { type: "string" }, description: "Yalnızca ek/alternatif CLI komutları (zorunlu değil)" },
            },
            required: ["baslik", "aciklama"],
          },
        },
        diyagram: { type: "string", description: "Mermaid flowchart TD kodu" },
        uyari: { type: "string", description: "Varsa kritik uyarı" },
      },
      required: ["ozet", "olasiSebepler", "adimlar", "diyagram"],
    },
  };

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 2500,
      system,
      tools: [tool],
      tool_choice: { type: "tool", name: "cozum_sun" },
      messages: [{ role: "user", content: `Destek ekibinin karşılaştığı sorun:\n\n"${String(problem).trim()}"` }],
    });

    const toolUse = msg.content.find(c => c.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return NextResponse.json({ error: "AI yapılandırılmış yanıt vermedi" }, { status: 502 });
    }

    const result = toolUse.input as { adimlar?: Array<{ baslik?: string; aciklama?: string; gui?: string; gorsel?: { url: string; title: string } }> };

    // ── Her adıma en uygun ekran görüntüsünü eşleştir (kütüphaneden) ──
    try {
      const { data: shots } = await supabase
        .from("fg_screenshots")
        .select("title, tags, menu_path, image_url");
      if (shots?.length && Array.isArray(result.adimlar)) {
        const norm = (s: string) => (s || "").toLowerCase();
        for (const adim of result.adimlar) {
          const text = norm(`${adim.baslik || ""} ${adim.gui || ""} ${adim.aciklama || ""}`);
          let best: { image_url: string; title: string } | null = null;
          let bestScore = 0;
          for (const sh of shots) {
            const hay = norm(`${sh.title} ${sh.tags || ""} ${sh.menu_path || ""}`);
            const words = [...new Set(hay.split(/[^a-z0-9çğıöşü]+/).filter(w => w.length >= 3))];
            let score = 0;
            for (const w of words) if (text.includes(w)) score++;
            if (score > bestScore) { bestScore = score; best = sh; }
          }
          if (best && bestScore >= 1) adim.gorsel = { url: best.image_url, title: best.title };
        }
      }
    } catch { /* görsel eşleştirme opsiyonel */ }

    return NextResponse.json({
      ...result,
      relatedPosts: refs.map(p => ({ slug: p.slug, title: p.title })),
    });
  } catch (e) {
    console.error("FortiGate asistan hatası:", e);
    return NextResponse.json({ error: "AI çağrısı başarısız: " + (e instanceof Error ? e.message : "hata") }, { status: 500 });
  }
}
