export interface FaqItem {
  q: string;
  a: string;
}

/**
 * Görünür SSS bölümü + FAQPage JSON-LD şeması.
 * Görünür metin AI yanıt motorlarının (Google AI Overviews, ChatGPT,
 * Perplexity) içeriği alıntılamasını kolaylaştırır; şema ise Google
 * zengin sonuçlarını besler. Native <details> kullanır — JS gerektirmez.
 */
export default function FaqSection({
  items,
  title = "Sıkça Sorulan Sorular",
}: {
  items: FaqItem[];
  title?: string;
}) {
  if (!items?.length) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };

  return (
    <section
      className="py-20 px-5 lg:px-20"
      style={{ backgroundColor: "#0b0f10", borderTop: "1px solid rgba(141,144,162,0.15)" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="max-w-[860px] mx-auto">
        <h2
          className="text-3xl lg:text-4xl font-semibold text-white mb-10 text-center"
          style={{ fontFamily: "var(--font-family-headline)" }}
        >
          {title}
        </h2>
        <div className="space-y-4">
          {items.map((item, idx) => (
            <details
              key={idx}
              className="group rounded-xl overflow-hidden"
              style={{ backgroundColor: "#191c1e", border: "1px solid rgba(141,144,162,0.2)" }}
            >
              <summary
                className="flex items-center justify-between gap-4 cursor-pointer list-none p-5 lg:p-6 text-white font-semibold"
                style={{ fontFamily: "var(--font-family-headline)", fontSize: "17px" }}
              >
                <span>{item.q}</span>
                <span
                  className="shrink-0 transition-transform duration-300 group-open:rotate-45"
                  style={{ color: "var(--color-primary)", fontSize: "24px", lineHeight: 1 }}
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <div
                className="px-5 lg:px-6 pb-5 lg:pb-6 leading-relaxed"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
