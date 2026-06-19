/**
 * SMS gönderimi — İleti Merkezi JSON API
 * Env vars: ILETIMERKEZI_USERNAME (kayıtlı tel no), ILETIMERKEZI_PASSWORD, ILETIMERKEZI_SENDER
 */

export async function sendSms(phone: string, message: string): Promise<{ ok: boolean; error?: string }> {
  const key    = process.env.ILETIMERKEZI_USERNAME;
  const hash   = process.env.ILETIMERKEZI_PASSWORD;
  const sender = process.env.ILETIMERKEZI_SENDER || "APITEST";

  if (!key || !hash) {
    console.warn("[SMS] ILETIMERKEZI_USERNAME veya ILETIMERKEZI_PASSWORD tanımlı değil — SMS gönderilmedi");
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
