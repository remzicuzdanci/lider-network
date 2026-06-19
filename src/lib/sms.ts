/**
 * SMS gönderimi — Netgsm HTTP API
 * Env vars: NETGSM_USERCODE, NETGSM_PASSWORD, NETGSM_MSGHEADER
 */

export async function sendSms(phone: string, message: string): Promise<{ ok: boolean; error?: string }> {
  const usercode  = process.env.NETGSM_USERCODE;
  const password  = process.env.NETGSM_PASSWORD;
  const msgheader = process.env.NETGSM_MSGHEADER || "LIDERNETWORK";

  if (!usercode || !password) {
    console.warn("[SMS] NETGSM_USERCODE veya NETGSM_PASSWORD tanımlı değil — SMS gönderilmedi");
    return { ok: false, error: "SMS yapılandırılmamış" };
  }

  // Netgsm, Türkiye numaralarını 905XXXXXXXXX formatında ister
  const gsm = phone.replace(/\D/g, "").replace(/^0/, "90").replace(/^(\d{10})$/, "90$1");

  const params = new URLSearchParams({
    usercode,
    password,
    gsmno:     gsm,
    message,
    msgheader,
    encoding:  "TR",
  });

  try {
    const r = await fetch(`https://api.netgsm.com.tr/sms/send/get/?${params.toString()}`, {
      signal: AbortSignal.timeout(8_000),
    });
    const body = await r.text();
    // Netgsm, başarıda "00 <msgid>" döner; hata kodları: 20, 30, 40, 70...
    if (body.startsWith("00")) return { ok: true };
    return { ok: false, error: `Netgsm hata kodu: ${body.slice(0, 30)}` };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
