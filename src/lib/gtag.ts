const AW_ID = "AW-18181879824";

type Gtag = (...args: unknown[]) => void;

function fire(...args: unknown[]): void {
  if (typeof window === "undefined") return;
  const g = (window as Window & { gtag?: Gtag }).gtag;
  if (typeof g !== "function") return;
  g(...args);
}

// Telefon tıklaması — Footer, iletişim sayfası, CTA alanları
export function trackPhoneClick(source = "unknown") {
  fire("event", "phone_click", { event_category: "contact", event_label: source });
  fire("event", "conversion", { send_to: AW_ID, event_category: "contact" });
}

// WhatsApp butonu
export function trackWhatsAppClick() {
  fire("event", "whatsapp_click", { event_category: "contact", event_label: "floating_button" });
  fire("event", "conversion", { send_to: AW_ID, event_category: "contact" });
}

// İletişim / teklif form gönderimi
export function trackLeadGeneration(source = "contact_form") {
  fire("event", "generate_lead", { event_category: "form", event_label: source });
  fire("event", "conversion", { send_to: AW_ID, event_category: "form" });
}
