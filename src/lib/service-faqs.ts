import type { FaqItem } from "@/components/seo/FaqSection";

/**
 * Hizmet sayfaları için SSS içerikleri. Kısa, doğru ve doğrudan cevaplar
 * AI yanıt motorlarında ve Google zengin sonuçlarında öne çıkmayı sağlar.
 */

export const siberGuvenlikFaqs: FaqItem[] = [
  {
    q: "Lider Network hangi siber güvenlik hizmetlerini sunuyor?",
    a: "Lider Network; FortiGate NGFW (yeni nesil güvenlik duvarı), uç nokta güvenliği (EDR), sızma testleri (pentest), 7/24 SOC izleme, Zero-Trust ağ mimarisi ve KVKK uyumluluk danışmanlığı hizmetleri sunar. Fortinet Yetkili Partner olarak uçtan uca koruma sağlar.",
  },
  {
    q: "Sızma testi (pentest) nedir ve neden gereklidir?",
    a: "Sızma testi, sistemlerinizin saldırganlar tarafından istismar edilebilecek güvenlik açıklarını, gerçek bir saldırıyı taklit ederek tespit etme işlemidir. Lider Network'ün uzman ekibi açıkları saldırganlardan önce bulur, raporlar ve kapatır.",
  },
  {
    q: "KVKK uyumluluğu için Lider Network nasıl yardımcı oluyor?",
    a: "Lider Network, kurumunuzun kişisel verileri koruma süreçlerini KVKK'ya tam uyumlu hale getirir; teknik güvenlik önlemleri, erişim kontrolleri ve veri sınıflandırma çözümleriyle hem teknik hem hukuki gereklilikleri karşılar.",
  },
  {
    q: "Siber saldırıya müdahale süreniz nedir?",
    a: "7/24 SOC desteğimiz ile ortalama müdahale süremiz yaklaşık 15 dakikadır. AI tabanlı anomali tespiti ve FortiGuard tehdit istihbaratı ile saldırılar henüz gerçekleşmeden engellenir.",
  },
];

export const fortinetFaqs: FaqItem[] = [
  {
    q: "Lider Network Fortinet'in yetkili partneri mi?",
    a: "Evet, Lider Network resmi Fortinet Yetkili Partner'dır. FortiGate, FortiSwitch, FortiAP, FortiManager ve FortiAnalyzer dahil tüm Fortinet ürün ailesinde satış, kurulum, lisanslama ve teknik destek sağlar.",
  },
  {
    q: "FortiGate nedir ve ne işe yarar?",
    a: "FortiGate, Fortinet'in yeni nesil güvenlik duvarıdır (NGFW). Ağ trafiğini denetler, izinsiz erişimleri engeller, VPN ve SD-WAN sağlar, antivirüs/IPS ile tehditleri durdurur. İşletmenizin ağ güvenliğinin merkezinde yer alır.",
  },
  {
    q: "FortiGate kurulumu ve lisans yenilemesi Lider Network'ten alınabilir mi?",
    a: "Evet. Lider Network, FortiGate cihazlarının satışı, kurulumu, yapılandırması, lisans yenilemesi ve 7/24 teknik desteğini tek elden sağlar. İhtiyacınıza uygun model ve lisans seçiminde de danışmanlık yapar.",
  },
  {
    q: "FortiSwitch ve FortiAP nedir?",
    a: "FortiSwitch, Fortinet'in yönetilebilir ağ anahtarıdır; FortiAP ise kablosuz erişim noktasıdır. Her ikisi de FortiGate üzerinden tek merkezden yönetilerek güvenli, bütünleşik bir ağ altyapısı (Security Fabric) oluşturur.",
  },
];

export const agEntegrasyonFaqs: FaqItem[] = [
  {
    q: "Ağ entegrasyonu hizmeti neleri kapsar?",
    a: "Lider Network'ün ağ entegrasyonu hizmeti; yapısal kablolama, anahtar/yönlendirici yapılandırması, kablosuz ağ kurulumu, VLAN segmentasyonu, SD-WAN ve uçtan uca güvenli ağ altyapısı tasarımını kapsar.",
  },
  {
    q: "Mevcut ağ altyapımı kesintiye uğratmadan yenileyebilir misiniz?",
    a: "Evet. Projelerimizi iş sürekliliğini koruyacak şekilde planlarız; geçiş çalışmalarını mesai dışı saatlerde ve aşamalı olarak yaparak kesintiyi en aza indiririz.",
  },
  {
    q: "SD-WAN nedir ve işletmeme faydası nedir?",
    a: "SD-WAN, birden fazla internet/WAN bağlantısını akıllıca yöneterek şube-merkez bağlantılarında hız, süreklilik ve güvenlik sağlar. Maliyetleri düşürür, uygulama performansını artırır. Lider Network FortiGate SD-WAN çözümleri sunar.",
  },
];

export const bulutFaqs: FaqItem[] = [
  {
    q: "Lider Network hangi bulut çözümlerini sunuyor?",
    a: "Lider Network; özel bulut (private cloud), hibrit bulut, bulut yedekleme, felaket kurtarma (DR) ve bulut güvenliği çözümleri sunar. İşletmenize en uygun bulut mimarisini tasarlar ve yönetir.",
  },
  {
    q: "Bulut yedekleme neden önemli?",
    a: "Bulut yedekleme, verilerinizi donanım arızası, fidye yazılımı veya afet durumunda kaybolmaya karşı korur. Lider Network, otomatik ve şifreli yedekleme çözümleriyle iş sürekliliğinizi güvence altına alır.",
  },
  {
    q: "Hibrit bulut nedir?",
    a: "Hibrit bulut, şirket içi (on-premise) altyapı ile genel/özel bulutu birlikte kullanan modeldir. Kritik verileri kendi sunucunuzda tutarken esnek kaynakları bulutta çalıştırırsınız. Lider Network bu mimariyi uçtan uca kurar.",
  },
];

export const veriDepolamaFaqs: FaqItem[] = [
  {
    q: "Lider Network hangi veri depolama çözümlerini sunuyor?",
    a: "Lider Network; NAS/SAN depolama sistemleri, Synology çözümleri, yedekleme ve arşivleme, felaket kurtarma ve yüksek erişilebilirlikli (HA) depolama mimarileri sunar. Verileriniz güvenli, yedekli ve hızlı erişilebilir olur.",
  },
  {
    q: "Synology NAS kurulumu yapıyor musunuz?",
    a: "Evet. Lider Network, Synology NAS cihazlarının satışı, kurulumu, RAID yapılandırması, yedekleme senaryoları ve bakımını sağlar. KOBİ'den kurumsala kadar her ölçeğe uygun çözümler sunar.",
  },
  {
    q: "Verilerimi fidye yazılımına karşı nasıl korursunuz?",
    a: "Çok katmanlı yedekleme (3-2-1 kuralı), değişmez (immutable) yedekler, sürüm geçmişi ve izole edilmiş yedekleme depoları ile fidye yazılımı saldırılarında verilerinizin kurtarılabilir kalmasını sağlarız.",
  },
];
