import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Shield, Mail, Phone, MapPin, FileText } from "lucide-react";

const baseUrl = "https://www.lidernetwork.com.tr";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isTr = locale === "tr";
  return {
    title: isTr
      ? "KVKK Aydınlatma Metni & Gizlilik Politikası | Lider Network"
      : "GDPR / KVKK Notice & Privacy Policy | Lider Network",
    description: isTr
      ? "Lider Network Teknoloji Danışmanlık'ın kişisel verilerin korunması (KVKK) aydınlatma metni ve gizlilik politikası."
      : "Lider Network Technology Consulting's personal data protection (KVKK/GDPR) notice and privacy policy.",
    alternates: {
      canonical: `${baseUrl}/${locale}/kvkk`,
    },
  };
}

const BLUE = "#0052ff";
const FN_RED = "#EE3124";

/* Şirket bilgileri */
const COMPANY = {
  name: "Lider Network Teknoloji Danışmanlık Tic. Ltd. Şti.",
  address: "Birlik Mh. 448. Cd No:119/2, 06610 Çankaya / Ankara",
  phone: "+90 312 232 02 88",
  email: "info@lidernetwork.com.tr",
  web: "www.lidernetwork.com.tr",
};

const sections = [
  {
    id: "veri-sorumlusu",
    title: "1. Veri Sorumlusu",
    content: `6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında Veri Sorumlusu, Lider Network Teknoloji Danışmanlık Tic. Ltd. Şti.'dir (bundan sonra "Şirket" olarak anılacaktır).\n\nŞirket bilgileri:\n• Unvan: Lider Network Teknoloji Danışmanlık Tic. Ltd. Şti.\n• Adres: Birlik Mh. 448. Cd No:119/2, 06610 Çankaya / Ankara\n• Telefon: +90 312 232 02 88\n• E-posta: info@lidernetwork.com.tr`,
  },
  {
    id: "islem-amaci",
    title: "2. Kişisel Verilerin İşlenme Amacı",
    content: `Kişisel verileriniz aşağıdaki amaçlar doğrultusunda işlenmektedir:\n\n• Sunulan hizmetlerin yerine getirilmesi ve hizmet kalitesinin iyileştirilmesi\n• Teknik destek, proje yönetimi ve müşteri ilişkilerinin sürdürülmesi\n• Ürün ve hizmet teklifleri ile bilgilendirme iletişimlerinin yapılması\n• Sözleşme süreçleri ve ticari ilişkilerin yönetilmesi\n• Yasal yükümlülüklerin yerine getirilmesi (vergi, muhasebe, denetim)\n• Şirket güvenliği ve bilgi sistemleri güvenliğinin sağlanması\n• İş başvurularının değerlendirilmesi`,
  },
  {
    id: "islenen-veriler",
    title: "3. İşlenen Kişisel Veri Kategorileri",
    content: `Şirketimiz aşağıdaki kategorilerdeki kişisel verileri işleyebilmektedir:\n\n• Kimlik Bilgileri: Ad, soyad, T.C. kimlik numarası\n• İletişim Bilgileri: E-posta adresi, telefon numarası, adres\n• Müşteri İşlem Bilgileri: Hizmet talepleri, teklifler, sözleşmeler\n• Finansal Bilgiler: Fatura bilgileri, ödeme kayıtları\n• Teknik Bilgiler: IP adresi, web sitesi kullanım verileri (çerezler)\n• Mesleki Bilgiler: Ünvan, şirket adı, iş e-postası\n• Özgeçmiş Bilgileri: İş başvurusunda paylaşılan veriler`,
  },
  {
    id: "hukuki-dayanak",
    title: "4. Hukuki Dayanaklar",
    content: `Kişisel verileriniz KVKK'nın 5. ve 6. maddeleri uyarınca aşağıdaki hukuki sebeplere dayanılarak işlenmektedir:\n\n• Sözleşmenin kurulması ve ifası için zorunlu olması\n• Veri sorumlusunun hukuki yükümlülüğünü yerine getirmesi\n• Temel hak ve özgürlüklere zarar vermemek kaydıyla meşru menfaatlerimiz\n• Açık rıza (pazarlama iletişimleri için)\n• Kanunlarda açıkça öngörülmüş olması`,
  },
  {
    id: "aktarim",
    title: "5. Kişisel Verilerin Aktarımı",
    content: `Kişisel verileriniz; yasal zorunluluklar ve hizmet gereklilikleri çerçevesinde aşağıdaki taraflarla paylaşılabilir:\n\n• Yetkili kamu kurum ve kuruluşları (yasal yükümlülük kapsamında)\n• Hizmet aldığımız iş ortakları ve tedarikçiler (Fortinet, Microsoft, VMware gibi)\n• Muhasebe, hukuk ve denetim danışmanları\n• Bulut altyapısı sağlayıcıları (ISO 27001 uyumlu)\n\nVerileriniz, açık rızanız olmaksızın yurt dışına aktarılmamaktadır.`,
  },
  {
    id: "saklama",
    title: "6. Saklama Süreleri",
    content: `Kişisel verileriniz, işlenme amacının gerektirdiği süre boyunca ve yasal yükümlülükler çerçevesinde saklanmaktadır:\n\n• Müşteri ve sözleşme verileri: Sözleşme bitiş tarihinden itibaren 10 yıl\n• Fatura ve finansal kayıtlar: 5 yıl (Vergi mevzuatı)\n• İş başvuruları: Başvuru sürecinin bitiminden 2 yıl\n• Web sitesi çerez verileri: En fazla 2 yıl\n• Pazarlama onayı: Onay geri çekilene kadar`,
  },
  {
    id: "haklar",
    title: "7. KVKK Kapsamındaki Haklarınız",
    content: `KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:\n\n• Kişisel verilerinizin işlenip işlenmediğini öğrenme\n• İşlenmişse bu konuda bilgi talep etme\n• İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme\n• Yurt içinde veya yurt dışında verilerin aktarıldığı üçüncü kişileri bilme\n• Eksik veya yanlış işlenmişse düzeltilmesini isteme\n• Kanunda öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme\n• Yapılan işlemlerin, verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme\n• İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analizi nedeniyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme\n• Hukuka aykırı veri işleme sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme`,
  },
  {
    id: "basvuru",
    title: "8. Başvuru Yöntemi",
    content: `Haklarınızı kullanmak için aşağıdaki kanallar üzerinden başvurabilirsiniz:\n\n• E-posta: info@lidernetwork.com.tr (konu: KVKK Başvurusu)\n• Posta/Elden: Birlik Mh. 448. Cd No:119/2, 06610 Çankaya / Ankara\n\nBaşvurularınız, kimliğinizin doğrulanmasından sonra en geç 30 gün içinde ücretsiz olarak yanıtlanacaktır. Ancak yanıtın ayrıca bir maliyet gerektirmesi halinde Kişisel Verileri Koruma Kurulu tarafından belirlenen tarife esas alınabilir.`,
  },
  {
    id: "cerezler",
    title: "9. Çerez (Cookie) Politikası",
    content: `Web sitemiz (www.lidernetwork.com.tr) aşağıdaki çerez türlerini kullanmaktadır:\n\n• Zorunlu Çerezler: Sitenin temel işlevleri için gereklidir, rıza gerektirmez.\n• Analitik Çerezler: Ziyaretçi istatistiklerini toplar (Google Analytics). Rıza ile aktif olur.\n• Pazarlama Çerezleri: Hedefli reklamlar için kullanılır. Açık rıza gerektirir.\n\nTarayıcı ayarlarınızdan çerezleri dilediğiniz zaman devre dışı bırakabilirsiniz. Ancak bazı özellikler çerez gerektirdiğinden çalışmayabilir.`,
  },
  {
    id: "degisiklikler",
    title: "10. Politika Değişiklikleri",
    content: `Bu aydınlatma metni ve gizlilik politikası, yasal değişiklikler veya iş süreçlerindeki güncellemeler doğrultusunda revize edilebilir. Önemli değişiklikler web sitemiz üzerinden duyurulacaktır.\n\nGüncel versiyon tarih: Mayıs 2025`,
  },
];

export default async function KVKKPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isTr = locale === "tr";

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-background)", color: "var(--color-on-surface)" }}
    >
      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="pt-28 pb-14 circuit-bg"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-4xl mx-auto px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 mb-8 text-xs" style={{ color: "var(--color-outline)" }}>
            <Link href={`/${locale}`} className="hover:text-white transition-colors">
              {isTr ? "Ana Sayfa" : "Home"}
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/${locale}/hakkimizda`} className="hover:text-white transition-colors">
              {isTr ? "Kurumsal" : "Corporate"}
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span style={{ color: "var(--color-primary)" }}>
              KVKK ve Gizlilik
            </span>
          </nav>

          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6"
            style={{
              backgroundColor: `${BLUE}15`,
              border: `1px solid ${BLUE}25`,
              color: "#60a5fa",
              fontFamily: "var(--font-family-label)",
            }}
          >
            <Shield className="w-3.5 h-3.5" />
            6698 Sayılı KVKK — Kişisel Verilerin Korunması
          </div>

          <h1
            className="text-4xl md:text-5xl font-black mb-4 leading-tight"
            style={{ fontFamily: "var(--font-family-headline)" }}
          >
            {isTr ? (
              <>KVKK Aydınlatma Metni<br /><span style={{ color: BLUE }}>&amp; Gizlilik Politikası</span></>
            ) : (
              <>Personal Data Protection<br /><span style={{ color: BLUE }}>&amp; Privacy Policy</span></>
            )}
          </h1>

          <p className="text-base" style={{ color: "var(--color-on-surface-variant)" }}>
            {isTr
              ? "Lider Network Teknoloji Danışmanlık olarak kişisel verilerinizin güvenliği ve gizliliği bizim için önceliktir. Bu metin, 6698 sayılı KVKK kapsamındaki haklarınızı ve verilerinizin nasıl işlendiğini açıklamaktadır."
              : "As Lider Network Technology Consulting, the security and privacy of your personal data is our priority. This text explains your rights and how your data is processed under KVKK Law No. 6698."}
          </p>
        </div>
      </section>

      {/* ─── İÇERİK ───────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar — TOC */}
          <aside className="hidden lg:block">
            <div
              className="sticky top-24 p-4 rounded-2xl"
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                className="text-xs font-bold mb-3 uppercase tracking-widest"
                style={{ color: "var(--color-outline)", fontFamily: "var(--font-family-label)" }}
              >
                İçindekiler
              </div>
              <nav className="space-y-1">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="block text-xs py-1.5 px-2 rounded transition-colors hover:text-white"
                    style={{ color: "var(--color-on-surface-variant)", fontFamily: "var(--font-family-label)" }}
                  >
                    {s.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Veri sorumlusu bilgi kartı */}
            <div
              className="p-5 rounded-2xl"
              style={{
                backgroundColor: `${BLUE}08`,
                border: `1px solid ${BLUE}20`,
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4" style={{ color: BLUE }} />
                <span className="text-sm font-bold" style={{ color: BLUE, fontFamily: "var(--font-family-label)" }}>
                  Veri Sorumlusu Bilgileri
                </span>
              </div>
              <div className="space-y-2 text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
                <div className="font-semibold" style={{ color: "var(--color-on-surface)" }}>{COMPANY.name}</div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: BLUE }} />
                  {COMPANY.address}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: BLUE }} />
                  <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className="hover:text-white transition-colors">
                    {COMPANY.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: BLUE }} />
                  <a href={`mailto:${COMPANY.email}`} className="hover:text-white transition-colors">
                    {COMPANY.email}
                  </a>
                </div>
              </div>
            </div>

            {/* Sections */}
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2
                  className="text-xl font-black mb-4"
                  style={{ fontFamily: "var(--font-family-headline)", color: "var(--color-on-surface)" }}
                >
                  {s.title}
                </h2>
                <div
                  className="p-5 rounded-2xl text-sm leading-relaxed whitespace-pre-line"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "var(--color-on-surface-variant)",
                  }}
                >
                  {s.content}
                </div>
              </section>
            ))}

            {/* Başvuru CTA */}
            <div
              className="p-6 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${BLUE}10, ${FN_RED}08)`,
                border: `1px solid ${BLUE}20`,
              }}
            >
              <div
                className="text-xs font-bold mb-2 uppercase tracking-widest"
                style={{ color: BLUE, fontFamily: "var(--font-family-label)" }}
              >
                KVKK Başvurusu
              </div>
              <h3
                className="text-xl font-black mb-3"
                style={{ fontFamily: "var(--font-family-headline)", color: "var(--color-on-surface)" }}
              >
                Haklarınızı Kullanmak İster misiniz?
              </h3>
              <p className="text-sm mb-4" style={{ color: "var(--color-on-surface-variant)" }}>
                Kişisel verilerinizle ilgili başvurularınız için e-posta veya posta ile iletişime geçebilirsiniz. Başvurular en geç 30 gün içinde yanıtlanır.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="mailto:info@lidernetwork.com.tr?subject=KVKK%20Ba%C5%9Fvurusu"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${BLUE}, #0040cc)`,
                    fontFamily: "var(--font-family-label)",
                  }}
                >
                  <Mail className="w-4 h-4" />
                  E-posta ile Başvur
                </a>
                <Link
                  href={`/${locale}/iletisim`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:bg-white/10"
                  style={{
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "var(--color-on-surface-variant)",
                    fontFamily: "var(--font-family-label)",
                  }}
                >
                  İletişim Formu
                </Link>
              </div>
            </div>

            {/* Last updated */}
            <div
              className="text-xs text-center pt-4"
              style={{
                color: "var(--color-outline)",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                fontFamily: "var(--font-family-label)",
              }}
            >
              Son güncelleme: Mayıs 2025 · Lider Network Teknoloji Danışmanlık Tic. Ltd. Şti.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
