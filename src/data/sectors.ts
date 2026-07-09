export interface SectorPainPoint {
  title: string;
  description: string;
}

export interface SectorSolution {
  title: string;
  description: string;
  tags: string[];
}

export interface SectorData {
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  heroImage: string;
  accentColor: string;
  badge: string;
  painPoints: SectorPainPoint[];
  solutions: SectorSolution[];
  stats: { value: string; label: string }[];
  compliance: string[];
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
}

export const sectors: SectorData[] = [
  {
    slug: "finans",
    title: "Finans & Bankacılık",
    subtitle: "BDDK Uyumlu, Sıfır Kesinti",
    excerpt:
      "Bankacılık ve finans sektörüne özel BDDK ve PCI-DSS uyumlu siber güvenlik, ağ altyapısı ve veri koruma çözümleri.",
    heroImage:
      "https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?auto=format&fit=crop&w=1920&q=80",
    accentColor: "#0052ff",
    badge: "BDDK & PCI-DSS",
    painPoints: [
      {
        title: "BDDK & PCI-DSS Uyumluluğu",
        description:
          "Bankacılık Düzenleme ve Denetleme Kurumu gereksinimleri ile PCI-DSS standartları, finans kuruluşlarına ağır teknik yükümlülükler getirmektedir. Uyumsuzluk durumunda ciddi idari ve mali yaptırımlar söz konusu olabilir.",
      },
      {
        title: "Finansal Dolandırıcılık ve Siber Saldırılar",
        description:
          "Finans sektörü; fidye yazılımı, kimlik avı (phishing), SWIFT dolandırıcılığı ve dağıtık hizmet engelleme (DDoS) saldırıları açısından en yüksek riskli sektörler arasındadır.",
      },
      {
        title: "Veri İhlali ve Müşteri Verisi Güvenliği",
        description:
          "Müşteri finansal verilerinin ifşası hem KVKK hem de uluslararası regülasyonlar açısından ağır sonuçlar doğurur. Veri sınıflandırma, şifreleme ve erişim kontrolü zorunludur.",
      },
      {
        title: "ATM, POS ve Şube Ağı Güvenliği",
        description:
          "Çok sayıda şube, ATM ve POS terminali; merkezi güvenlik politikasından yönetilmesi gereken karmaşık bir ağ topolojisi oluşturur. Her uç nokta potansiyel bir giriş kapısıdır.",
      },
    ],
    solutions: [
      {
        title: "FortiGate NGFW ile Merkezi Güvenlik",
        description:
          "Tüm şube ve genel müdürlük trafiğini FortiGate NGFW üzerinden merkezi politikalarla yönetin. Saldırı önleme sistemi (IPS), uygulama kontrolü ve SSL incelemesiyle tehditler ağa girmeden engellenir.",
        tags: ["FortiGate", "NGFW", "IPS", "SSL İnceleme"],
      },
      {
        title: "SD-WAN ile Şube ve ATM Bağlantısı",
        description:
          "FortiGate SD-WAN, ATM ve şube bağlantılarını optimize ederek MPLS maliyetlerini düşürür ve kesintisizliği artırır. Güvenlik politikaları merkezi FortiManager'dan tüm şubelere eş zamanlı uygulanır.",
        tags: ["SD-WAN", "FortiManager", "ATM", "Şube Bağlantısı"],
      },
      {
        title: "KVKK & PCI-DSS Uyumluluk Altyapısı",
        description:
          "FortiAnalyzer ile tüm ağ günlükleri toplanır, uzun süreli saklanır ve düzenleyici raporlar otomatik oluşturulur. SIEM entegrasyonu ile güvenlik olayları anlık tespit edilir ve raporlanır.",
        tags: ["FortiAnalyzer", "KVKK", "PCI-DSS", "SIEM"],
      },
      {
        title: "Synology ile Yedekleme ve Felaket Kurtarma",
        description:
          "Kritik finansal verilerin AES-256 şifreli yedeklemesi, anlık geri yükleme ve coğrafi olarak ayrı felaket kurtarma merkezi. Fidye yazılımına karşı değişmez yedekleme (WORM) desteği.",
        tags: ["Synology", "Active Backup", "WORM", "Felaket Kurtarma"],
      },
    ],
    stats: [
      { value: "99.99%", label: "Uptime Garantisi" },
      { value: "15 dk", label: "Müdahale Süresi" },
      { value: "AES-256", label: "Veri Şifreleme" },
      { value: "7/24", label: "Sürekli İzleme" },
    ],
    compliance: ["BDDK", "PCI-DSS", "KVKK", "ISO 27001", "SOX"],
    metaTitle:
      "Finans & Bankacılık Sektörü Siber Güvenlik | BDDK Uyumlu — Lider Network",
    metaDescription:
      "Lider Network, finans ve bankacılık sektörüne özel BDDK ve PCI-DSS uyumlu siber güvenlik, ağ altyapısı ve veri depolama çözümleri sunar. FortiGate ve Synology uzmanı.",
    keywords: [
      "finans sektörü siber güvenlik",
      "bankacılık BDDK uyumluluk",
      "PCI-DSS Türkiye",
      "banka FortiGate",
      "finans BT altyapısı",
    ],
  },
  {
    slug: "saglik",
    title: "Sağlık & Hastane",
    subtitle: "Hasta Verisi Güvenliği, Kesintisiz Sistem",
    excerpt:
      "Sağlık ve hastane kuruluşlarına özel KVKK uyumlu tıbbi cihaz güvenliği, ağ segmentasyonu ve veri yedekleme çözümleri.",
    heroImage:
      "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1920&q=80",
    accentColor: "#059669",
    badge: "KVKK & Sağlık BT",
    painPoints: [
      {
        title: "Hasta Verisi ve KVKK Uyumluluğu",
        description:
          "Kişisel sağlık verileri KVKK kapsamında özel nitelikli kişisel veri statüsündedir. İhlal durumunda idari para cezası ve cezai yaptırımlar gündeme gelebilir.",
      },
      {
        title: "Tıbbi Cihaz ve IoT Güvenliği",
        description:
          "MRI, ultrason, infüzyon pompası gibi tıbbi cihazlar genellikle eski ve yamalanması mümkün olmayan işletim sistemleri üzerinde çalışır. Bu cihazların ağdan izole edilmesi kritik önem taşır.",
      },
      {
        title: "Fidye Yazılımı Tehdidi",
        description:
          "Hastaneler fidye yazılımı saldırılarının birincil hedefleri arasındadır. Sistemlerin devre dışı kalması ameliyat ertelemelerine ve doğrudan hasta güvenliği riskine yol açabilir.",
      },
      {
        title: "HIS/PACS/RIS Sistem Entegrasyonu",
        description:
          "Hastane bilgi sistemi, görüntü arşivleme ve radyoloji bilgi sistemleri gibi kritik uygulamalar; yüksek erişilebilirlik ve güvenli ağ altyapısı gerektirmektedir.",
      },
    ],
    solutions: [
      {
        title: "Tıbbi Cihaz Ağ Segmentasyonu",
        description:
          "FortiGate ile tıbbi cihazlar, idari sistemler ve misafir WiFi ayrı ağ segmentlerine ayrılır. Hasta izleme cihazları kritik segment içinde izole edilerek saldırı yüzeyi minimize edilir.",
        tags: ["FortiGate", "Mikro-Segmentasyon", "IoT", "VLAN"],
      },
      {
        title: "FortiClient EDR ile Uç Nokta Koruması",
        description:
          "Hekim iş istasyonları, hemşire terminalleri ve idari bilgisayarlara FortiClient EDR kurularak fidye yazılımı dahil tüm kötü amaçlı yazılımlar davranış analiziyle engellenir.",
        tags: ["FortiClient", "EDR", "Uç Nokta", "Fidye Yazılımı"],
      },
      {
        title: "Synology ile Tıbbi Veri Yedekleme",
        description:
          "DICOM görüntüleri, hasta kayıtları ve HIS verilerinin otomatik şifreli yedeklenmesi. Fidye yazılımı saldırısında saatler içinde tam geri yükleme, sıfır veri kaybı.",
        tags: ["Synology", "DICOM", "AES-256", "Active Backup"],
      },
      {
        title: "Yüksek Erişilebilirlik Altyapısı",
        description:
          "Çift güç kaynağı, yüksek erişilebilirlik (HA) kümeleri ve çoklu WAN bağlantısıyla kritik sistemlerde kesintisizlik. Acil servis ve yoğun bakım sistemleri hiçbir zaman durmaz.",
        tags: ["HA Cluster", "Çift WAN", "UPS", "Yüksek Erişilebilirlik"],
      },
    ],
    stats: [
      { value: "0", label: "Veri İhlali Hedefi" },
      { value: "99.99%", label: "Sistem Uptime" },
      { value: "KVKK", label: "Tam Uyumluluk" },
      { value: "1 saat", label: "Geri Yükleme" },
    ],
    compliance: ["KVKK", "ISO 27001", "Sağlık Bakanlığı Yönergeleri", "ISO 9001"],
    metaTitle:
      "Sağlık Sektörü BT Güvenliği | Hastane Ağ Altyapısı — Lider Network",
    metaDescription:
      "Sağlık ve hastane kuruluşlarına özel KVKK uyumlu ağ güvenliği, tıbbi cihaz segmentasyonu ve veri yedekleme çözümleri. FortiGate ve Synology uzmanı.",
    keywords: [
      "sağlık sektörü siber güvenlik",
      "hastane BT altyapısı",
      "tıbbi cihaz güvenliği",
      "KVKK sağlık",
      "hastane fidye yazılımı koruması",
    ],
  },
  {
    slug: "kamu",
    title: "Kamu & E-Devlet",
    subtitle: "Kritik Altyapı Güvenliği",
    excerpt:
      "Kamu kurumları ve e-devlet altyapılarına özel BTK/USOM uyumlu siber güvenlik, log yönetimi ve kritik altyapı koruma çözümleri.",
    heroImage:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1920&q=80",
    accentColor: "#dc2626",
    badge: "BTK & USOM Uyumlu",
    painPoints: [
      {
        title: "BTK ve USOM Uyumluluğu",
        description:
          "Bilgi Teknolojileri ve İletişim Kurumu ile Ulusal Siber Olaylara Müdahale Merkezi'nin yayımladığı tehdit istihbaratı ve güvenlik yönergelerine uyum zorunludur. USOM tehdit listelerinin uygulanması beklenmektedir.",
      },
      {
        title: "Kritik Altyapı Koruma",
        description:
          "Enerji, su, ulaşım ve iletişim gibi kritik ulusal altyapıyla entegre kamu sistemleri, devlet destekli tehdit aktörlerinin öncelikli hedefindedir.",
      },
      {
        title: "Vatandaş Verilerinin Korunması",
        description:
          "Milyonlarca vatandaşın kimlik ve kişisel bilgilerini barındıran kamu veritabanları, siber saldırıların ve veri ihlallerinin en büyük hedefleri arasında yer almaktadır.",
      },
      {
        title: "Eski Sistemler ve Kademeli Modernizasyon",
        description:
          "Kamu BT altyapısı çoğunlukla yamalama güçlüğü olan eski sistemlere dayanmaktadır. Modernizasyon sürecinde güvenlik sürekliliğinin korunması kritik önem taşır.",
      },
    ],
    solutions: [
      {
        title: "USOM Tehdit İstihbaratı Entegrasyonu",
        description:
          "Lider Network tehdit portalı USOM verilerini gerçek zamanlı çekerek FortiGate'e aktarır. Zararlı IP ve domain listeleri otomatik güncellenir; manuel müdahaleye gerek kalmaz.",
        tags: ["USOM", "Tehdit İstihbaratı", "FortiGate", "Otomatik Güncelleme"],
      },
      {
        title: "Merkezi Log ve Denetim Altyapısı",
        description:
          "FortiAnalyzer ile tüm sistemlerin günlükleri merkezi toplanır, uzun süreli arşivlenir. 5651 sayılı kanun kapsamında log saklama gereksinimleri karşılanır, denetim raporları otomatik oluşturulur.",
        tags: ["FortiAnalyzer", "SIEM", "5651", "Denetim Günlüğü"],
      },
      {
        title: "Zero Trust Ağ Mimarisi",
        description:
          "Sıfır güven (Zero Trust) yaklaşımıyla her kullanıcı ve cihaz, ağ konumundan bağımsız olarak doğrulanır. İç tehditler ve yanal hareketler minimize edilir.",
        tags: ["Zero Trust", "ZTNA", "İç Tehdit", "Kimlik Doğrulama"],
      },
      {
        title: "Synology ile Devlet Verisi Arşivleme",
        description:
          "Kamu belgelerinin ve sistem yapılandırmalarının şifreli, değişmez (WORM) arşivlenmesi. Bilgi edinme hakkı ve saklama süreleri kapsamında belge yönetimi.",
        tags: ["Synology", "WORM", "Arşivleme", "Değişmez Kayıt"],
      },
    ],
    stats: [
      { value: "7/24", label: "Sürekli İzleme" },
      { value: "USOM", label: "Uyumlu" },
      { value: "100%", label: "Log Arşivleme" },
      { value: "Zero Trust", label: "Mimari" },
    ],
    compliance: ["BTK", "USOM", "KVKK", "ISO 27001", "5651 Sayılı Kanun"],
    metaTitle:
      "Kamu Kurumları Siber Güvenlik | BTK & USOM Uyumlu — Lider Network",
    metaDescription:
      "Kamu ve e-devlet kurumlarına özel BTK/USOM uyumlu siber güvenlik, kritik altyapı koruması ve merkezi log yönetimi. Ankara'nın güvenilen Fortinet yetkili partneri.",
    keywords: [
      "kamu kurumları siber güvenlik",
      "BTK uyumluluk Türkiye",
      "USOM tehdit istihbaratı",
      "e-devlet BT güvenliği",
      "kamu BT altyapısı Ankara",
    ],
  },
  {
    slug: "egitim",
    title: "Eğitim & Üniversite",
    subtitle: "Kampüs Ağı Güvenli, Öğrenci Verisi Korumalı",
    excerpt:
      "Üniversite ve K12 okullarına özel kampüs WiFi yönetimi, içerik filtreleme, öğrenci verisi koruması ve uzaktan öğrenim güvenliği.",
    heroImage:
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1920&q=80",
    accentColor: "#7c3aed",
    badge: "Kampüs Ağı & KVKK",
    painPoints: [
      {
        title: "Büyük Ölçekli Kullanıcı ve Cihaz Yönetimi",
        description:
          "Üniversitelerde binlerce öğrenci, öğretim üyesi ve idari personelin farklı kişisel cihazları ağa bağlanmaktadır. Ağ erişim kontrolü ve politika uygulaması karmaşık bir yönetim gerektirir.",
      },
      {
        title: "Öğrenci Verisi ve KVKK",
        description:
          "Öğrenci kimlik, not, disiplin ve kişisel bilgileri KVKK kapsamında korunması gereken kişisel verilerdir. Öğrenci bilgi sistemlerinin güvenliği ve erişim kontrolü önceliklidir.",
      },
      {
        title: "İçerik Filtreleme ve Uygun Kullanım",
        description:
          "K12 okullarında zararlı içeriklere erişimin engellenmesi hem yasal hem de etik bir gerekliliktir. Üniversitelerde akademik özgürlükle dengelenmesi gereken nüanslı bir politika yönetimi gerekir.",
      },
      {
        title: "Uzaktan ve Hibrit Öğrenim Güvenliği",
        description:
          "Uzaktan öğrenim modelleri, VPN ve güvenli uzak erişim ihtiyacını kalıcı olarak artırmıştır. Öğrenci ve öğretmenlerin farklı ağlardan güvenli sisteme erişimi sağlanmalıdır.",
      },
    ],
    solutions: [
      {
        title: "FortiGate ile Rol Tabanlı İçerik Filtreleme",
        description:
          "Kullanıcı rolüne ve yaş grubuna göre özelleştirilmiş içerik filtreleme politikaları. Öğrenci, öğretmen ve misafir ağları için ayrı güvenlik profilleri; tek cihazdan merkezi yönetim.",
        tags: ["FortiGate", "Web Filtreleme", "Rol Tabanlı Politika", "VLAN"],
      },
      {
        title: "FortiAP ile Kampüs WiFi Yönetimi",
        description:
          "Onlarca veya yüzlerce erişim noktasını merkezi FortiManager üzerinden tek panelden yönetin. 802.1X kimlik doğrulama ile her kullanıcı kendi güvenlik seviyesine tabi tutulur.",
        tags: ["FortiAP", "WiFi", "802.1X", "Merkezi Yönetim"],
      },
      {
        title: "FortiClient ile Güvenli Uzak Erişim",
        description:
          "Ev, yurt veya yurt dışından SSL-VPN üzerinden güvenli kampüs kaynağına erişim. Öğrenci ve öğretim üyelerinin kurumsal sistemlere güvenli bağlantısı sağlanır.",
        tags: ["FortiClient", "SSL-VPN", "Uzaktan Erişim", "MFA"],
      },
      {
        title: "Synology ile Akademik Veri Yönetimi",
        description:
          "Araştırma verileri, tez arşivleri ve öğrenci dosyalarının merkezi, yedekli depolanması. Fakülte bazlı erişim kontrolü ve Synology Drive ile dosya paylaşımı.",
        tags: ["Synology", "NAS", "Akademik Arşiv", "Drive"],
      },
    ],
    stats: [
      { value: "10.000+", label: "Eş Zamanlı Kullanıcı" },
      { value: "99%", label: "Filtreleme Doğruluğu" },
      { value: "KVKK", label: "Uyumlu" },
      { value: "7/24", label: "Ağ İzleme" },
    ],
    compliance: ["KVKK", "ISO 27001", "MEB Yönergeleri", "YÖK Gereksinimleri"],
    metaTitle:
      "Eğitim & Üniversite BT Güvenliği | Kampüs Ağı, KVKK — Lider Network",
    metaDescription:
      "Üniversite ve okullara özel kampüs WiFi güvenliği, öğrenci verisi koruması, içerik filtreleme ve uzaktan öğrenim altyapısı. FortiGate ve Synology çözümleri.",
    keywords: [
      "üniversite BT güvenliği",
      "kampüs ağı güvenlik",
      "okul siber güvenlik Türkiye",
      "K12 içerik filtreleme",
      "eğitim sektörü BT altyapısı",
    ],
  },
  {
    slug: "uretim",
    title: "Üretim & Sanayi",
    subtitle: "OT/SCADA Güvenliği, Fabrika Ağı",
    excerpt:
      "Üretim ve sanayi tesislerine özel OT/SCADA güvenliği, endüstriyel IoT koruması ve Purdue modeli ağ segmentasyonu.",
    heroImage:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1920&q=80",
    accentColor: "#ea580c",
    badge: "OT & ICS Güvenliği",
    painPoints: [
      {
        title: "IT/OT Ağ Yakınsamasının Riskleri",
        description:
          "Kurumsal IT ağları ile fabrika OT/ICS ağlarının birleşimi; siber tehditlerin üretim sistemlerine sızma riskini dramatik biçimde artırmaktadır. Bir fidye yazılımı üretim hattını durdurabilir.",
      },
      {
        title: "Eski PLC, SCADA ve DCS Sistemleri",
        description:
          "Üretim tesislerindeki kontrol sistemleri genellikle güncelleme imkânı olmayan eski yazılımlar çalıştırır. Yama uygulanamayan bu sistemler ciddi güvenlik açıkları barındırır.",
      },
      {
        title: "Fidye Yazılımı ve Üretim Durması",
        description:
          "Bir fidye yazılımı saldırısı saatler veya günler süren üretim duraksaması anlamına gelebilir. Her saatlik kayıp, doğrudan mali kayba ve müşteri taahhütlerinin ihlalına dönüşür.",
      },
      {
        title: "Tedarik Zinciri ve Uzak Bakım Riskleri",
        description:
          "Tedarikçi ve servis firmalarının OT ağına uzaktan erişimleri kontrol altına alınmadığında ciddi güvenlik açıkları oluşur. Üçüncü taraf erişimi izlenip kısıtlanmalıdır.",
      },
    ],
    solutions: [
      {
        title: "Purdue Modeli OT Ağ Segmentasyonu",
        description:
          "FortiGate ile IT ve OT ağları birbirinden güvenli biçimde izole edilir. SCADA, DCS ve PLC'ler ayrı güvenlik bölgelerinde çalışır; IT kaynaklı tehditler OT tarafına geçemez.",
        tags: ["FortiGate", "OT Güvenliği", "SCADA", "Purdue Modeli"],
      },
      {
        title: "FortiNAC ile Cihaz Kimlik Doğrulama",
        description:
          "Fabrika ağına bağlanan her cihaz otomatik tespit edilir, sınıflandırılır ve güvenlik politikasına tabi tutulur. Yetkisiz cihaz bağlantısı anında engellenir ve uyarı üretilir.",
        tags: ["FortiNAC", "NAC", "Cihaz Görünürlüğü", "IoT"],
      },
      {
        title: "Endüstriyel Protokol Derin Paket İncelemesi",
        description:
          "FortiGate, Modbus, DNP3 ve IEC 61850 gibi endüstriyel protokolleri tanıyan derin paket incelemesiyle OT trafiğinde anormal komutları ve tehditleri tespit eder.",
        tags: ["DPI", "Modbus", "IEC 61850", "Endüstriyel Protokol"],
      },
      {
        title: "Synology ile Fabrika Verisi Yedekleme",
        description:
          "PLC mantık dosyaları, SCADA konfigürasyonları ve üretim verilerinin şifreli, düzenli yedeklenmesi. Üretim durmasında saatler içinde geri yükleme ile kayıp minimize edilir.",
        tags: ["Synology", "Felaket Kurtarma", "PLC Yedek", "Geri Yükleme"],
      },
    ],
    stats: [
      { value: "0", label: "İzinsiz OT Erişimi" },
      { value: "IEC 62443", label: "Standart" },
      { value: "30 dk", label: "Kurtarma Süresi" },
      { value: "7/24", label: "Fabrika İzleme" },
    ],
    compliance: ["IEC 62443", "ISO 27001", "NIST CSF", "KVKK"],
    metaTitle:
      "Üretim & Sanayi OT/SCADA Güvenliği | Fabrika Ağı — Lider Network",
    metaDescription:
      "Üretim ve sanayi tesislerine özel OT/SCADA güvenliği, endüstriyel IoT koruması ve Purdue modeli ağ segmentasyonu. FortiGate OT ve Synology çözümleri.",
    keywords: [
      "endüstriyel siber güvenlik",
      "OT güvenliği Türkiye",
      "SCADA güvenliği",
      "fabrika ağ güvenliği",
      "ICS güvenliği",
    ],
  },
  {
    slug: "perakende",
    title: "Perakende & E-Ticaret",
    subtitle: "PCI-DSS, Çok Şubeli Ağ, Müşteri Güveni",
    excerpt:
      "Perakende zinciri ve e-ticaret işletmelerine özel PCI-DSS uyumlu ödeme güvenliği, çok şubeli SD-WAN ve müşteri verisi koruma çözümleri.",
    heroImage:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1920&q=80",
    accentColor: "#0891b2",
    badge: "PCI-DSS & E-Ticaret",
    painPoints: [
      {
        title: "PCI-DSS Uyumluluğu",
        description:
          "Kredi kartı verilerini işleyen tüm işletmeler PCI-DSS standartlarına uymak zorundadır. Uyumsuzluk; kart şirketi yaptırımları, para cezaları ve kart kabul yetkisinin iptaliyle sonuçlanabilir.",
      },
      {
        title: "Çok Şubeli Ağ Yönetimi",
        description:
          "Onlarca veya yüzlerce şube, merkezi güvenlik politikasından yönetilmesi gereken karmaşık bir ağ topolojisi oluşturur. Her şubenin güvenliği bütünün güvenliğini belirler.",
      },
      {
        title: "E-Ticaret ve Uygulama Güvenliği",
        description:
          "Online ödeme sayfaları, müşteri hesapları ve API uç noktaları; XSS, SQL injection ve kart kopyalama (skimming) saldırılarının doğrudan hedefindedir.",
      },
      {
        title: "Müşteri Verisi ve KVKK",
        description:
          "Müşteri alışveriş geçmişi, adres ve ödeme bilgileri KVKK kapsamında özel koruma gerektirir. Veri ihlali hem müşteri güveni hem de regülatif açıdan ciddi sonuçlar doğurur.",
      },
    ],
    solutions: [
      {
        title: "FortiGate SD-WAN ile Şube Bağlantısı",
        description:
          "Tüm mağaza lokasyonlarını merkezi yönetilen, güvenli SD-WAN ile birbirine bağlayın. POS terminalleri izole ağ segmentinde çalışır; kart verisi kurumsal ağdan tamamen ayrışır.",
        tags: ["FortiGate", "SD-WAN", "POS Güvenliği", "Şube Bağlantısı"],
      },
      {
        title: "PCI-DSS Uyumluluk Altyapısı",
        description:
          "Kart veri ortamı (CDE) segmentasyonu, şifreli iletişim ve erişim kontrolü ile PCI-DSS gereksinimleri karşılanır. FortiAnalyzer ile otomatik uyumluluk raporları oluşturulur.",
        tags: ["PCI-DSS", "CDE Segmentasyonu", "Şifreleme", "FortiAnalyzer"],
      },
      {
        title: "FortiWeb ile Web Uygulama Güvenlik Duvarı",
        description:
          "E-ticaret platformunuzu OWASP Top 10 saldırılarından koruyun. Ödeme sayfaları ve API uç noktaları gerçek zamanlı izlenir; bot trafiği ve kart kopyalama denemelerine karşı aktif önleme.",
        tags: ["FortiWeb", "WAF", "OWASP", "Bot Koruması"],
      },
      {
        title: "Synology ile Satış ve Müşteri Verisi Yedekleme",
        description:
          "POS işlem kayıtları, müşteri veritabanları ve e-ticaret siparişlerinin şifreli, otomatik yedeklenmesi. Sistem arızasında dakikalar içinde geri yükleme ile satış sürekliliği korunur.",
        tags: ["Synology", "Yedekleme", "Satış Verisi", "Hızlı Geri Yükleme"],
      },
    ],
    stats: [
      { value: "PCI-DSS", label: "Uyumlu" },
      { value: "500+", label: "Şube Kapasitesi" },
      { value: "7/24", label: "E-Ticaret İzleme" },
      { value: "KVKK", label: "Müşteri Verisi" },
    ],
    compliance: ["PCI-DSS", "KVKK", "ISO 27001", "GDPR"],
    metaTitle:
      "Perakende & E-Ticaret Siber Güvenlik | PCI-DSS — Lider Network",
    metaDescription:
      "Perakende ve e-ticaret işletmelerine özel PCI-DSS uyumlu ağ güvenliği, çok şubeli SD-WAN bağlantısı ve müşteri verisi koruma. FortiGate WAF uzmanı.",
    keywords: [
      "perakende siber güvenlik",
      "PCI-DSS Türkiye",
      "mağaza ağ güvenliği",
      "e-ticaret güvenliği",
      "perakende BT altyapısı",
    ],
  },
];

export function getSector(slug: string): SectorData | undefined {
  return sectors.find((s) => s.slug === slug);
}
