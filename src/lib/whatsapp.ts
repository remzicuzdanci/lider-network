/**
 * WhatsApp Business API entegrasyonu (hazırlık)
 * WHATSAPP_TOKEN ve WHATSAPP_PHONE_ID env değişkenleri ayarlandıktan sonra aktif olacak.
 */
export async function sendWhatsAppUrgentAlert(ticket: {
  ticket_number: number;
  subject: string;
  priority: string;
  company?: string | null;
}): Promise<void> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const groupNumber = process.env.WHATSAPP_GROUP_NUMBER; // e.g. "905xxxxxxxxx"

  if (!token || !phoneId || !groupNumber) {
    console.log("[WhatsApp] Henüz yapılandırılmadı — env değişkenleri eksik");
    return;
  }

  const message = `🚨 *ACİL Destek Talebi*\n\nTalep: #${String(ticket.ticket_number).padStart(4, "0")}\nKonu: ${ticket.subject}\nŞirket: ${ticket.company || "—"}\n\nLider Network Admin Paneli'nden inceleyiniz.`;

  await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: groupNumber,
      type: "text",
      text: { body: message },
    }),
  }).catch(console.error);
}
