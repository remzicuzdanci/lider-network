/**
 * SMS gönderimi — İleti Merkezi JSON API
 * Env vars: ILETIMERKEZI_KEY, ILETIMERKEZI_HASH, ILETIMERKEZI_SENDER
 */

export async function sendSms(phone: string, message: string): Promise<{ ok: boolean; error?: string }> {
  const key    = process.env.ILETIMERKEZI_KEY;
  const hash   = process.env.ILETIMERKEZI_HASH;
  const sender = process.env.ILETIMERKEZI_SENDER || "LIDERNETWORK";

  if (!key || !hash) {
    console.warn("[SMS] ILETIMERKEZI_KEY veya ILETIMERKEZI_HASH tanımlı değil — SMS gönderilmedi");
    return { ok: false, error: "SMS yapılandırılmamış" };
  }

  // İleti Merkezi, Türkiye numaralarını 905XXXXXXXXX formatında ister
  const gsm = phone.replace(/\D/g, "").replace(/^0/, "90").replace(/^(\d{10})$/, "90$1");

  const body = {
    request: {
      authentication: { key, hash },
      order: {
        sender,
        iys: "0",
        message: {
          text: message,
          receipients: { number: [gsm] },
        },
      },
    },
  };

  console.log("[SMS] Gönderiliyor →", gsm, "| key ilk 6:", key.slice(0, 6));
  try {
    const r = await fetch("https://api.iletimerkezi.com/v1/send-sms/json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8_000),
    });
    const raw = await r.text();
    console.log("[SMS] Ham yanıt:", raw);
    const data = JSON.parse(raw);
    const code = data?.response?.status?.code;
    if (code === 200) return { ok: true };
    return { ok: false, error: `İleti Merkezi hata kodu: ${code} — ${data?.response?.status?.message ?? ""}` };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
