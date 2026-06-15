"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Search, Globe, Mail, ShieldCheck, FileSearch, Network, Phone } from "lucide-react";

const DNS_URL = "https://dns.lidernetwork.com.tr";

export default function DnsCheckerCTA() {
  const locale = useLocale();
  const isTr = locale === "tr";
  const [domain, setDomain] = useState("");

  function go(e?: React.FormEvent) {
    e?.preventDefault();
    const d = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
    const url = d ? `${DNS_URL}/?d=${encodeURIComponent(d)}` : DNS_URL;
    window.open(url, "_blank", "noopener");
  }

  const feats = [
    { icon: Globe, label: isTr ? "DNS Kayıtları" : "DNS Records" },
    { icon: Mail, label: isTr ? "Mail (SPF/DKIM/DMARC)" : "Mail (SPF/DKIM/DMARC)" },
    { icon: FileSearch, label: "WHOIS" },
    { icon: ShieldCheck, label: isTr ? "SSL Sertifika" : "SSL Certificate" },
    { icon: Network, label: isTr ? "Propagasyon" : "Propagation" },
  ];

  return (
    <section className="section" style={{ backgroundColor: "var(--color-surface)" }} aria-label="DNS Aracı">
      <div className="container">
        <div
          className="relative overflow-hidden rounded-2xl p-8 md:p-14"
          style={{
            background: "linear-gradient(135deg, rgba(0,82,255,0.16) 0%, rgba(0,82,255,0.05) 55%, rgba(183,196,255,0.05) 100%)",
            border: "1px solid rgba(0,82,255,0.22)",
          }}
        >
          <div className="absolute top-0 right-1/4 w-72 h-72 rounded-full blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(0,82,255,0.16) 0%, transparent 70%)" }} aria-hidden="true" />

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-wide px-3 py-1.5 rounded-full mb-5"
              style={{ color: "var(--color-primary)", background: "rgba(0,82,255,0.1)", border: "1px solid rgba(0,82,255,0.25)" }}>
              <Search className="w-3.5 h-3.5" aria-hidden="true" />
              {isTr ? "ÜCRETSİZ ARAÇ" : "FREE TOOL"}
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4"
              style={{ fontFamily: "var(--font-family-headline)", color: "var(--color-on-surface)" }}>
              {isTr ? "DNS & Domain Sorgulama Aracı" : "DNS & Domain Lookup Tool"}
            </h2>
            <p className="text-lg mb-8" style={{ color: "var(--color-on-surface-variant)" }}>
              {isTr
                ? "Herhangi bir alan adının DNS kayıtlarını, mail yapılandırmasını (Google Workspace / Microsoft 365), WHOIS, SSL ve propagasyon durumunu saniyeler içinde görün."
                : "Check any domain's DNS records, mail configuration (Google Workspace / Microsoft 365), WHOIS, SSL and propagation in seconds."}
            </p>

            <form onSubmit={go} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-7">
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder={isTr ? "alan adı girin — ör. sirketiniz.com" : "enter a domain — e.g. yourcompany.com"}
                className="flex-1 px-5 py-4 rounded-xl text-base outline-none"
                style={{ background: "var(--color-background)", border: "1px solid var(--color-outline)", color: "var(--color-on-surface)" }}
                aria-label="Alan adı"
              />
              <button type="submit" className="btn-cta text-base px-7 py-4 justify-center whitespace-nowrap">
                <Search className="w-5 h-5" aria-hidden="true" />
                {isTr ? "Sorgula" : "Lookup"}
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {feats.map((f) => (
                <span key={f.label} className="flex items-center gap-1.5 text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
                  <f.icon className="w-4 h-4" style={{ color: "var(--color-primary)" }} aria-hidden="true" />
                  {f.label}
                </span>
              ))}
            </div>

            <div className="mt-9 pt-7" style={{ borderTop: "1px solid var(--color-outline)" }}>
              <p className="text-sm mb-3" style={{ color: "var(--color-on-surface-variant)" }}>
                {isTr ? "BT altyapınız için uzman desteğe mi ihtiyacınız var?" : "Need expert support for your IT infrastructure?"}
              </p>
              <a href="tel:+903122320288" className="btn-secondary text-sm px-6 py-3 justify-center inline-flex">
                <Phone className="w-4 h-4" aria-hidden="true" />
                +90 312 232 02 88
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
