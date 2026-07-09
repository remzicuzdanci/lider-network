export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  categoryColor: string;
  tags: string[];
  publishedAt: string;
  readTime: number;
  featured?: boolean;
}

export const categories = [
  { id: "tumu", label: "Tümü" },
  { id: "siber-guvenlik", label: "Siber Güvenlik" },
  { id: "ag-teknolojileri", label: "Ağ Teknolojileri" },
  { id: "fortigate-ngfw", label: "FortiGate & NGFW" },
  { id: "cloud-sase", label: "Cloud & SASE" },
  { id: "soc-yonetim", label: "SOC & Yönetim" },
  { id: "synology", label: "Synology & Depolama" },
  { id: "microsoft", label: "Microsoft & Azure" },
  { id: "veeam", label: "Veeam & Yedekleme" },
  { id: "vmware", label: "VMware & Sanallaştırma" },
  { id: "google-workspace", label: "Google Workspace" },
  { id: "windows-server", label: "Windows Server" },
  { id: "windows-11", label: "Windows 11" },
  { id: "iso-uyumluluk", label: "ISO & Uyumluluk" },
  { id: "network-temelleri", label: "Ağ & Güvenlik Temelleri" },
  { id: "hpe", label: "HPE & Sunucu" },
  { id: "qnap", label: "QNAP & NAS" },
  { id: "bitdefender", label: "Bitdefender & EDR" },
  { id: "guvenlik-kamera", label: "IP Kamera & CCTV" },
];

export const categoryColorMap: Record<string, string> = {
  "siber-guvenlik": "#EE3124",
  "ag-teknolojileri": "#0052ff",
  "fortigate-ngfw": "#EE3124",
  "cloud-sase": "#059669",
  "soc-yonetim": "#f59e0b",
  "synology": "#B5121B",
  "microsoft": "#00a4ef",
  "veeam": "#00b336",
  "vmware": "#1d428a",
  "google-workspace": "#4285F4",
  "windows-server": "#0078d4",
  "windows-11": "#7719aa",
  "iso-uyumluluk": "#6366f1",
  "network-temelleri": "#0ea5e9",
  "hpe": "#01a982",
  "qnap": "#1ba3e0",
  "bitdefender": "#ed1c24",
  "guvenlik-kamera": "#374151",
};

export const posts: BlogPost[] = [
  {
    slug: "fortibleed-fortinet-firewall-guvenligi-kontrol-listesi",
    title: "FortiBleed: 73.000+ Fortinet Cihazı Ele Geçirildi — Hemen Yapılması Gerekenler",
    excerpt:
      "Hudson Rock'ın yayımladığı FortiBleed istihbaratı, dünya genelinde 73.932+ Fortinet firewall ve VPN cihazının ele geçirildiğini ortaya koydu. Saldırı vektörü, etkilenen sistemlerin kontrolü ve acil yapılması gerekenler.",
    category: "fortigate-ngfw",
    categoryColor: "#EE3124",
    tags: ["FortiBleed", "FortiGate", "Fortinet", "VPN Güvenliği", "Kimlik Bilgisi Sızıntısı", "FortiOS", "Güvenlik Açığı"],
    publishedAt: "2026-06-22",
    readTime: 9,
    featured: true,
    content: `
<h2>FortiBleed Nedir?</h2>
<p>Hudson Rock'ın Haziran 2026'da yayımladığı <strong>FortiBleed</strong> istihbarat raporu, dünya genelinde <strong>73.932 Fortinet firewall ve VPN cihazının</strong> 194 ülkede ele geçirildiğini ortaya koyuyor. Tehdit seviyesi <strong>Kritik</strong> olarak değerlendirilmiş; 21.387 kurum etkilenmiş durumda.</p>

<p>FortiBleed, tek bir CVE'ye dayalı klasik bir güvenlik açığı değildir. Asıl tehdit vektörü <strong>infostealer (bilgi hırsızı) yazılımlardır</strong>. Saldırı zinciri şu şekilde işler:</p>

<ol>
  <li>Çalışanın kişisel veya kurumsal bilgisayarına infostealer bulaşır (RedLine, Lumma, Raccoon vb.)</li>
  <li>Tarayıcıda kayıtlı şifreler, oturum çerezleri ve otomatik doldurma verileri çalınır</li>
  <li>Eğer bu bilgisayardan daha önce FortiGate yönetim paneline veya SSL-VPN portalına girilmişse, o kimlik bilgileri de sızar</li>
  <li>Saldırganlar bu verileri darkweb pazarlarından satın alarak doğrudan firewall yönetimine giriş yapar</li>
</ol>

<p>Sonuç: Fortinet ürünlerinin kendisinde kritik bir 0-day olmak zorunda değil. <strong>Yönetim arayüzüne giriş yapan her çalışanın bilgisayarı potansiyel bir sızıntı noktasıdır.</strong></p>

<h2>Saldırı Ne Kadar Ciddi?</h2>
<p>Firewall yönetimine yetkisiz erişim sağlayan bir saldırgan şunları yapabilir:</p>
<ul>
  <li>Tüm güvenlik politikalarını değiştirme veya devre dışı bırakma</li>
  <li>VPN kullanıcısı ekleyerek kalıcı arka kapı oluşturma</li>
  <li>Ağ trafiğini kendi sunucularına yönlendirme (traffic mirroring)</li>
  <li>IPS/Antivirus imzalarını devre dışı bırakarak iç ağa sızmayı kolaylaştırma</li>
  <li>Tüm logları silme</li>
  <li>SSL-VPN üzerinden iç ağa tam erişim kazanma</li>
</ul>
<p>Kısacası: firewall ele geçirildiğinde <strong>ağ güvenliği sıfırlanır.</strong></p>

<h2>Hemen Yapılması Gerekenler</h2>

<h3>1. Yönetici Hesaplarını Denetle</h3>
<p>FortiGate CLI veya GUI üzerinden mevcut admin hesaplarını listeleyin. Tanımadığınız, açıklaması olmayan veya son giriş tarihi belirsiz olan tüm hesaplar şüpheli kabul edilmelidir.</p>
<pre><code># CLI
get system admin
# Son girişler
diagnose sys session list | grep 443</code></pre>

<h3>2. Tüm Parolaları Değiştirin</h3>
<p>Sadece admin şifresi değil; SNMP community string, API token, SSL-VPN kullanıcı şifrelerinin tamamı değiştirilmeli. Parola değişimi yapılmadan önce aktif oturumları sonlandırın:</p>
<pre><code>diagnose sys session clear</code></pre>

<h3>3. VPN Kullanıcılarını Gözden Geçirin</h3>
<p>SSL-VPN veya IPsec kullanıcı listesini inceleyin. Kurumda çalışmayan, ayrılmış veya bilinmeyen kullanıcı hesapları varsa derhal silin. Aktif VPN tünellerini kontrol edin:</p>
<pre><code>get vpn ssl monitor
get vpn ipsec tunnel summary</code></pre>

<h3>4. Yönetim Erişimini İnternete Kapatın</h3>
<p>Firewall yönetim arayüzü (HTTPS/SSH) hiçbir zaman doğrudan internete açık olmamalıdır. Trusted Host kısıtlaması ekleyin — admin hesaplarına yalnızca belirli IP'lerden erişim izni verin:</p>
<pre><code>config system admin
  edit admin
    set trusthost1 x.x.x.x 255.255.255.255
  next
end</code></pre>

<h3>5. Log Analizini Yapın</h3>
<p>Son 30 günlük yönetim girişlerini inceleyin. Farklı konumlardan, mesai dışı saatlerde veya bilinmeyen IP'lerden yapılan girişler ciddi uyarı işaretidir:</p>
<pre><code>execute log filter category 1
execute log display</code></pre>
<p>FortiAnalyzer kullanıyorsanız <strong>Compromised Hosts</strong> ve <strong>Admin Login</strong> raporlarını inceleyin.</p>

<h3>6. Firmware Güncellemesi</h3>
<p>Fortinet'in PSIRT sayfasından (fortinet.com/psirt) mevcut FortiOS versiyonunuzun bilinen aktif açıklarını kontrol edin. Güncel FortiOS sürümüne geçiş planlanmalıdır. Güncelleme öncesi config yedeği alın:</p>
<pre><code>execute backup config ftp [ip] [path] [user] [pass]</code></pre>

<h2>Kalıcı Güvenlik Önlemleri</h2>

<h3>İki Faktörlü Doğrulama (2FA)</h3>
<p>FortiGate yönetim girişi için FortiToken veya TOTP entegrasyonu zorunlu hale getirilmelidir. Şifre çalınsa dahi ikinci faktör olmadan giriş yapılamaz. Bu önlem infostealer saldırılarını büyük ölçüde etkisiz kılar:</p>
<pre><code>config system admin
  edit admin
    set two-factor fortitoken
    set fortitoken [TOKEN_SERIAL]
  next
end</code></pre>

<h3>Management VLAN Ayrımı</h3>
<p>Yönetim trafiği ayrı bir VLAN üzerinden yönetilmeli; bu VLAN'a yalnızca yönetici iş istasyonlarından erişim sağlanmalıdır. Out-of-band management (OOB) ideali olmakla birlikte VLAN izolasyonu minimum standart olarak uygulanmalıdır.</p>

<h3>FortiManager ile Merkezi Yönetim</h3>
<p>Birden fazla cihaz yönetiyorsanız yönetim trafiği FortiManager üzerinden yürütülmeli, cihazların doğrudan GUI/SSH erişimi kapatılmalıdır. Bu şekilde saldırı yüzeyi tek noktaya indirilir ve tüm değişiklikler denetim altında tutulur.</p>

<h3>Çalışan Uç Nokta Güvenliği</h3>
<p>FortiBleed saldırılarının temel vektörü çalışan bilgisayarlarıdır. Yönetim işlemleri yalnızca:</p>
<ul>
  <li>EDR/XDR çözümü yüklü kurumsal cihazlardan</li>
  <li>FortiClient EMS tarafından yönetilen endpoint'lerden</li>
  <li>Tercihen ayrılmış bir jump server/bastion host üzerinden</li>
</ul>
<p>yapılmalıdır. Kişisel bilgisayardan yönetim paneline girmek kesinlikle önlenmelidir.</p>

<h3>Düzenli Erişim Denetimi</h3>
<p>Admin hesapları, VPN kullanıcıları ve API token'ları aylık bazda gözden geçirilmeli; kullanılmayan hesaplar silinmeli ve şifreler 90 günde bir rotasyona tabi tutulmalıdır.</p>

<h2>Özet: Kontrol Listesi</h2>
<table>
  <thead><tr><th>Adım</th><th>Öncelik</th><th>Süre</th></tr></thead>
  <tbody>
    <tr><td>Yönetici hesaplarını listele ve bilinmeyenleri sil</td><td>🔴 Acil</td><td>15 dk</td></tr>
    <tr><td>Tüm admin/VPN parolalarını değiştir</td><td>🔴 Acil</td><td>30 dk</td></tr>
    <tr><td>Aktif VPN oturumlarını kontrol et</td><td>🔴 Acil</td><td>15 dk</td></tr>
    <tr><td>Son 30 gün login loglarını incele</td><td>🟠 Yüksek</td><td>1 saat</td></tr>
    <tr><td>Yönetim arayüzünü internetten kapat / Trusted Host ekle</td><td>🟠 Yüksek</td><td>30 dk</td></tr>
    <tr><td>2FA zorunlu kıl</td><td>🟠 Yüksek</td><td>1 saat</td></tr>
    <tr><td>Firmware güncel mi kontrol et</td><td>🟡 Orta</td><td>30 dk</td></tr>
    <tr><td>Endpoint güvenlik politikasını gözden geçir</td><td>🟡 Orta</td><td>Planlı</td></tr>
  </tbody>
</table>

<p>FortiBleed, yalnızca bir güvenlik açığının değil; <strong>operasyonel güvenlik (OpSec) zafiyetlerinin</strong> nasıl büyük çaplı bir tehlikeye dönüşebileceğinin somut bir kanıtıdır. Kimlik bilgisi hijyeni, endpoint koruması ve yönetim erişim kontrolü bir arada uygulanmadan sadece firewall güncellemesi yeterli olmayacaktır.</p>
`,
  },
  {
    slug: "fortigate-nedir-kurumsal-aglarda-yeni-nesil-guvenlik",
    title: "FortiGate Nedir? Kurumsal Ağlarda Yeni Nesil Güvenlik",
    excerpt:
      "FortiGate, Fortinet tarafından geliştirilen yeni nesil firewall (NGFW) çözümüdür. Geleneksel firewall sistemlerinden farklı olarak çok katmanlı güvenlik sağlar. Kurumsal ağların merkezine yerleşen FortiGate'i detaylıca inceliyoruz.",
    category: "fortigate-ngfw",
    categoryColor: "#EE3124",
    tags: ["FortiGate", "NGFW", "Firewall", "Security Fabric", "SD-WAN"],
    publishedAt: "2026-05-15",
    readTime: 6,
    featured: true,
    content: `
<h2>FortiGate Nedir?</h2>
<p>FortiGate, Fortinet tarafından geliştirilen yeni nesil firewall (NGFW) çözümüdür. Geleneksel firewall sistemlerinden farklı olarak yalnızca port ve IP bazlı filtreleme yapmakla kalmaz; <strong>uygulama kontrolü, IPS, antivirüs, SSL inspection</strong> ve gelişmiş tehdit koruması gibi çok katmanlı güvenlik sağlar.</p>

<h2>Neden FortiGate?</h2>
<p>Modern şirketler artık hibrit çalışma, bulut dönüşümü ve uzaktan erişim nedeniyle çok daha karmaşık ağ yapılarına sahiptir. FortiGate cihazları bu karmaşık yapıları merkezi olarak yönetebilmek için geliştirilmiştir.</p>
<p>Özellikle <strong>SD-WAN, SASE ve Zero Trust</strong> mimarileriyle entegre çalışabilmesi FortiGate'i kurumsal ağların merkezine yerleştirmektedir. Fortinet'in Security Fabric mimarisi sayesinde firewall, switch, access point ve endpoint çözümleri tek platform altında yönetilebilir.</p>

<h2>FortiGate'in Temel Özellikleri</h2>
<ul>
  <li><strong>Next-Generation Firewall (NGFW):</strong> Derin paket incelemesi, uygulama tanıma ve kullanıcı bazlı politikalar</li>
  <li><strong>Intrusion Prevention System (IPS):</strong> Bilinen ve sıfır gün tehditlerine karşı gerçek zamanlı koruma</li>
  <li><strong>SSL/TLS İnceleme:</strong> Şifreli trafik içindeki tehditleri tespit etme kapasitesi</li>
  <li><strong>SD-WAN Entegrasyonu:</strong> WAN bağlantılarını uygulama bazlı optimize etme</li>
  <li><strong>Zero Trust Network Access (ZTNA):</strong> Her kullanıcı ve cihazı doğrulama prensibi</li>
  <li><strong>FortiGuard Threat Intelligence:</strong> Dünya genelinde 7/24 güncellenen tehdit veri tabanı</li>
</ul>

<h2>Hangi Ölçeklerde Kullanılır?</h2>
<p>FortiGate cihazları küçük işletmelerden büyük veri merkezlerine kadar geniş bir ürün gamına sahiptir. Masaüstü modellerden (<strong>FortiGate 40F, 60F</strong>) yüksek performanslı datacenter firewall cihazlarına (<strong>FortiGate 7000 Serisi</strong>) kadar farklı ölçeklerde çözümler sunmaktadır.</p>
<ul>
  <li><strong>Küçük İşletme:</strong> FortiGate 40F / 60F / 80F serisi</li>
  <li><strong>Orta Ölçekli Kurum:</strong> FortiGate 100F / 200F / 400F serisi</li>
  <li><strong>Enterprise / Veri Merkezi:</strong> FortiGate 1000F / 3000F / 7000 serisi</li>
</ul>

<h2>Security Fabric Entegrasyonu</h2>
<p>FortiGate tek başına güçlü bir güvenlik çözümü olsa da asıl gücü Fortinet Security Fabric ekosistemiyle birleşince ortaya çıkar. FortiSwitch, FortiAP, FortiAnalyzer ve FortiManager ile entegre çalışarak tüm ağ altyapısının merkezi yönetimini ve görünürlüğünü sağlar.</p>

<h2>Sonuç</h2>
<p>FortiGate, kurumsal ağ güvenliğini tek bir platform altında toplamak isteyen işletmeler için ideal çözümdür. Gartner Magic Quadrant'ta <strong>13 yıl üst üste Lider</strong> olarak gösterilen Fortinet'in amiral gemisi ürünü olan FortiGate, performans ve güvenliği bir arada sunar.</p>
<p>Lider Network olarak FortiGate tasarımı, kurulumu ve yönetiminde uzman mühendislerimizle yanınızdayız.</p>
    `,
  },
  {
    slug: "sase-teknolojisi-nedir-modern-ag-guvenligi",
    title: "SASE Teknolojisi Nedir? Modern Ağ Güvenliğinin Yeni Modeli",
    excerpt:
      "SASE (Secure Access Service Edge), modern ağ güvenliği mimarilerinin en önemli yapı taşıdır. Hibrit çalışma ve cloud dönüşümüyle birlikte neden bu kadar kritik hale geldiğini ve Fortinet SASE çözümünü inceliyoruz.",
    category: "cloud-sase",
    categoryColor: "#059669",
    tags: ["SASE", "SD-WAN", "Zero Trust", "Cloud Security", "Fortinet"],
    publishedAt: "2026-05-12",
    readTime: 5,
    content: `
<h2>SASE Nedir?</h2>
<p>SASE (Secure Access Service Edge), modern ağ güvenliği mimarilerinin en önemli yapı taşlarından biridir. Özellikle hibrit çalışma modeli ve cloud dönüşümüyle birlikte kullanıcıların güvenli bağlantı ihtiyacı dramatik şekilde artmıştır.</p>

<h2>Neden SASE'ye İhtiyaç Var?</h2>
<p>Geleneksel ağ güvenliği mimarileri, tüm kullanıcıların ofisteki fiziksel ağa bağlı olduğu dönem için tasarlanmıştı. Ancak bugün:</p>
<ul>
  <li>Çalışanların büyük bölümü uzaktan ya da hibrit çalışıyor</li>
  <li>Uygulamalar ve veriler buluta taşınıyor</li>
  <li>Şube ofisler artık merkez bağlantısına muhtaç değil</li>
  <li>Geleneksel VPN çözümleri ölçeklenebilirlik sorunu yaşıyor</li>
</ul>

<h2>Fortinet Unified SASE Çözümü</h2>
<p>Fortinet'in unified SASE çözümü; <strong>SD-WAN, Zero Trust, CASB, Firewall-as-a-Service</strong> ve güvenli uzaktan erişim teknolojilerini tek platform altında toplar. Bu yapı sayesinde şirketler farklı lokasyonlardaki kullanıcılarını merkezi olarak yönetebilir.</p>

<h2>SASE'nin Temel Bileşenleri</h2>
<ul>
  <li><strong>FortiSASE:</strong> Bulut tabanlı güvenli erişim hizmeti</li>
  <li><strong>FortiSD-WAN:</strong> Zeki WAN bağlantı yönetimi</li>
  <li><strong>ZTNA (Zero Trust Network Access):</strong> Sıfır güven erişim kontrolü</li>
  <li><strong>CASB (Cloud Access Security Broker):</strong> Bulut uygulama güvenliği</li>
  <li><strong>FWaaS (Firewall as a Service):</strong> Bulut tabanlı güvenlik duvarı</li>
  <li><strong>SWG (Secure Web Gateway):</strong> Web trafiği güvenliği</li>
</ul>

<h2>Kurumsal Faydalar</h2>
<p>SASE mimarisine geçen kurumlar şu avantajları elde eder:</p>
<ul>
  <li>Uzaktan çalışanlar için merkezi, güvenli erişim</li>
  <li>MPLS maliyetlerinde ciddi düşüş</li>
  <li>Tüm bağlantı noktalarında tutarlı güvenlik politikaları</li>
  <li>IT operasyon yükünde azalma</li>
  <li>Kullanıcı deneyiminde iyileşme</li>
</ul>

<h2>Sonuç</h2>
<p>SASE mimarileri geleceğin kurumsal ağ altyapılarının temelini oluşturmaktadır. Fortinet'in unified yaklaşımı, tek bir vendor üzerinden eksiksiz bir SASE deneyimi sunar. Lider Network olarak SASE dönüşüm projelerinizde uzman ekibimizle yanınızdayız.</p>
    `,
  },
  {
    slug: "ransomware-saldirilarina-karsi-sirketler-nasil-korunmali",
    title: "Ransomware Saldırılarına Karşı Şirketler Nasıl Korunmalı?",
    excerpt:
      "Ransomware saldırıları son yıllarda dünya genelinde ciddi artış gösteriyor. Yapay zeka destekli saldırılar geleneksel güvenlik yöntemlerini zorlarken, Fortinet çözümleriyle nasıl korunabileceğinizi anlatıyoruz.",
    category: "siber-guvenlik",
    categoryColor: "#EE3124",
    tags: ["Ransomware", "Siber Güvenlik", "IPS", "EDR", "Backup", "Fortinet"],
    publishedAt: "2026-05-10",
    readTime: 7,
    content: `
<h2>Ransomware Tehdidi Büyüyor</h2>
<p>Ransomware saldırıları son yıllarda dünya genelinde ciddi artış göstermektedir. Özellikle <strong>yapay zekâ destekli saldırılar</strong>, geleneksel güvenlik yöntemlerini zorlamaktadır. 2025 yılında küresel ransomware kayıplarının 265 milyar doları aştığı tahmin edilmektedir.</p>

<h2>Tek Katman Yeterli Değil</h2>
<p>Şirketlerin yalnızca firewall kullanması artık yeterli değildir. Günümüzde kapsamlı bir ransomware koruması için şu katmanların birlikte kullanılması gerekmektedir:</p>
<ul>
  <li><strong>Endpoint Security (EDR):</strong> Cihaz bazlı gerçek zamanlı tehdit tespiti</li>
  <li><strong>Network Segmentation:</strong> Yan hareketleri sınırlandırma</li>
  <li><strong>Multi-Factor Authentication (MFA):</strong> Kimlik doğrulama katmanı ekleme</li>
  <li><strong>Yedekleme Sistemleri:</strong> Düzenli ve test edilmiş yedekler</li>
  <li><strong>SOC Operasyonları:</strong> 7/24 izleme ve müdahale kapasitesi</li>
  <li><strong>Kullanıcı Eğitimi:</strong> Phishing farkındalığı</li>
</ul>

<h2>Fortinet Çözümleriyle Ransomware Koruması</h2>

<h3>1. FortiGate IPS ve Sandbox</h3>
<p>FortiGate'in entegre IPS motoru ve FortiSandbox, şüpheli dosyaları izole bir ortamda çalıştırarak zararlı aktiviteleri tespit eder. Bu sayede sıfır gün saldırıları bile ağa girmeden engellenir.</p>

<h3>2. FortiEDR ile Endpoint Koruması</h3>
<p>FortiEDR, şifrelenmiş dosyalara ilişkin anormal aktiviteleri gerçek zamanlı olarak tespit eder. Ransomware şifreleme sürecini başlar başlamaz durdurabilir.</p>

<h3>3. FortiGuard AI Tehdit İstihbaratı</h3>
<p>Dünya genelinde milyonlarca cihazdan toplanan verilerle güncellenen FortiGuard Labs tehdit istihbaratı, en yeni ransomware varyantlarını tanıyarak engeller.</p>

<h3>4. Network Segmentation</h3>
<p>FortiGate ile ağınızı segmentlere ayırarak ransomware'in bir cihazdan diğerine yayılmasını önlüyorsunuz. Mikro segmentasyon ile kritik sistemler izole edilir.</p>

<h2>Yedekleme Stratejisi: 3-2-1 Kuralı</h2>
<p>En iyi fidye yazılımı koruması verilerinizin kurtarılabilir olduğunu bilmektir. 3-2-1 yedekleme kuralını uygulayın:</p>
<ul>
  <li><strong>3</strong> farklı kopya bulundurun</li>
  <li><strong>2</strong> farklı ortamda saklayın (disk + bulut)</li>
  <li><strong>1</strong> kopya off-site/offline olsun</li>
</ul>

<h2>Düzenli Güvenlik Değerlendirmesi</h2>
<p>Düzenli firmware güncellemeleri ve güvenlik politikalarının sürekli gözden geçirilmesi kritik önem taşımaktadır. Lider Network olarak yılda en az iki kez kapsamlı güvenlik denetimi yapılmasını öneriyoruz.</p>
    `,
  },
  {
    slug: "fortianalyzer-ile-merkezi-log-yonetimi",
    title: "FortiAnalyzer ile Merkezi Log Yönetimi ve Güvenlik Analizi",
    excerpt:
      "Kurumsal ağlarda log yönetimi ve görünürlük artık kritik bir ihtiyaç. FortiAnalyzer, Fortinet ekosistemindeki cihazlardan gelen logları merkezi olarak toplayan ve analiz eden güçlü bir platformdur.",
    category: "soc-yonetim",
    categoryColor: "#f59e0b",
    tags: ["FortiAnalyzer", "Log Yönetimi", "SIEM", "SOC", "Fortinet", "Güvenlik Analizi"],
    publishedAt: "2026-05-08",
    readTime: 5,
    content: `
<h2>Log Yönetimi Neden Kritik?</h2>
<p>Kurumsal ağlarda log yönetimi ve görünürlük artık kritik bir ihtiyaç haline gelmiştir. Bir güvenlik olayının ortalama tespit süresi hâlâ 200 günü aşmaktadır. Merkezi log yönetimi bu süreyi dramatik biçimde kısaltır.</p>

<h2>FortiAnalyzer Nedir?</h2>
<p>FortiAnalyzer, Fortinet ekosistemindeki cihazlardan gelen logları merkezi olarak toplayan, analiz eden ve raporlayan gelişmiş bir platformdur. Bir SIEM'in ötesinde, Fortinet Security Fabric ile entegre çalışır.</p>

<h2>FortiAnalyzer'ın Temel Yetenekleri</h2>
<ul>
  <li><strong>Merkezi Log Toplama:</strong> Tüm FortiGate, FortiSwitch, FortiAP ve FortiClient cihazlarından log toplama</li>
  <li><strong>Gerçek Zamanlı Korelasyon:</strong> Farklı kaynaklardan gelen logları ilişkilendirerek tehdit tespiti</li>
  <li><strong>Gelişmiş Raporlama:</strong> Compliance raporları (ISO 27001, PCI-DSS, KVKK) otomatik üretimi</li>
  <li><strong>Otomatik Alarm Sistemi:</strong> Tanımlı kurallara göre anlık bildirimler</li>
  <li><strong>Forensic Analiz:</strong> Güvenlik olaylarını geriye dönük inceleme</li>
  <li><strong>AI Tehdit Tespiti:</strong> Makine öğrenmesi ile anormal davranış analizi</li>
</ul>

<h2>Hangi Loglar Toplanır?</h2>
<ul>
  <li>Firewall logları (allow/deny kuralları)</li>
  <li>VPN bağlantı logları</li>
  <li>IPS/IDS olayları</li>
  <li>Web filtreleme aktiviteleri</li>
  <li>Kullanıcı kimlik doğrulama logları</li>
  <li>Uygulama kullanım istatistikleri</li>
  <li>Bandwidth ve performans verileri</li>
</ul>

<h2>FortiAnalyzer + FortiSIEM Kombinasyonu</h2>
<p>Daha büyük kurumsal yapılarda FortiAnalyzer, FortiSIEM ile birlikte çalışarak çok daha kapsamlı bir güvenlik operasyon merkezi (SOC) altyapısı oluşturur. Bu kombinasyon, 50.000 EPS (Events Per Second) kapasitesine kadar ölçeklenebilir.</p>

<h2>Sonuç</h2>
<p>FortiAnalyzer, güvenlik operasyonlarını görünür kılan ve ekiplerin olaylara hızlı müdahale etmesini sağlayan vazgeçilmez bir platformdur. Lider Network olarak FortiAnalyzer kurulumu, konfigürasyonu ve SOC danışmanlığı konusunda hizmet veriyoruz.</p>
    `,
  },
  {
    slug: "zero-trust-guvenlik-modeli-nedir",
    title: "Zero Trust Güvenlik Modeli: Hiçbir Şeye Güvenme, Her Şeyi Doğrula",
    excerpt:
      "Zero Trust yaklaşımı, modern siber güvenlik mimarilerinin temel prensiplerinden biri. Hiçbir kullanıcı veya cihazın varsayılan olarak güvenilir kabul edilmediği bu modeli ve Fortinet'in ZTNA çözümlerini inceliyoruz.",
    category: "siber-guvenlik",
    categoryColor: "#EE3124",
    tags: ["Zero Trust", "ZTNA", "FortiNAC", "MFA", "Kimlik Güvenliği", "Fortinet"],
    publishedAt: "2026-05-06",
    readTime: 6,
    content: `
<h2>Zero Trust Nedir?</h2>
<p>Zero Trust (Sıfır Güven) yaklaşımı, modern siber güvenlik mimarilerinin temel prensiplerinden biridir. Bu modele göre <strong>hiçbir kullanıcı veya cihaz varsayılan olarak güvenilir kabul edilmez</strong> — ağ içinde ya da dışında olması fark etmeksizin.</p>
<p>Klasik güvenlik anlayışı "dışarıdan içeriye" tehdit varsayımına dayanıyordu. Ancak günümüzde tehditler ağ içinden, ele geçirilmiş hesaplardan ve güvenilen cihazlardan gelebilmektedir.</p>

<h2>Zero Trust'ın Temel Prensipleri</h2>
<ul>
  <li><strong>Her Zaman Doğrula (Always Verify):</strong> Kullanıcı, cihaz ve uygulama her erişim talebinde kimliğini kanıtlamalı</li>
  <li><strong>En Az Ayrıcalık (Least Privilege):</strong> Kullanıcılara yalnızca ihtiyaç duydukları kaynaklara erişim hakkı tanı</li>
  <li><strong>İhlal Varsay (Assume Breach):</strong> Her zaman ihlal yaşandığını varsay, hasarı sınırlandırmak için tasarım yap</li>
  <li><strong>Sürekli İzle (Continuous Monitoring):</strong> Tüm aktiviteleri gerçek zamanlı izle ve kayıt al</li>
</ul>

<h2>Fortinet Zero Trust Çözümleri</h2>

<h3>FortiNAC — Network Access Control</h3>
<p>FortiNAC, ağa bağlanan her cihazı otomatik olarak tanımlar, sınıflandırır ve politika uygular. Bilinmeyen ya da uyumsuz cihazlar karantinaya alınır.</p>

<h3>FortiAuthenticator — Merkezi Kimlik Yönetimi</h3>
<p>Fortinet'in FortiAuthenticator çözümü sayesinde kullanıcı doğrulama süreçleri merkezi hale gelir. LDAP, RADIUS ve SAML entegrasyonuyla mevcut kimlik sistemleriyle sorunsuz çalışır.</p>

<h3>ZTNA — Zero Trust Network Access</h3>
<p>FortiGate ve FortiClient üzerinde çalışan ZTNA, VPN'in yerini alan modern uzaktan erişim mimarisidir. Kullanıcı → uygulama erişimi, kullanıcının konumundan bağımsız olarak güvenli hale getirilir.</p>

<h3>MFA — Çok Faktörlü Kimlik Doğrulama</h3>
<p>FortiToken ile donanım ya da yazılım bazlı OTP'ler, SMS ve push bildirimleri desteklenir. MFA artık kurumsal yapılarda standart hale gelmektedir.</p>

<h2>Uzaktan Çalışmada Zero Trust</h2>
<p>Özellikle uzaktan çalışma döneminde kimlik güvenliği ve erişim yönetimi büyük önem kazanmıştır. Geleneksel VPN çözümleri tüm ağa erişim sağlarken, ZTNA yalnızca belirli uygulamalara erişim verir — bu da ihlal durumunda hasarı minimize eder.</p>

<h2>Sonuç</h2>
<p>Zero Trust bir ürün değil, bir stratejidir. Lider Network olarak Zero Trust mimarisi tasarımı ve Fortinet çözümleriyle implementasyonunda kapsamlı danışmanlık hizmeti sunuyoruz.</p>
    `,
  },
  {
    slug: "sd-wan-cozumleri-ile-daha-guclu-ag-yonetimi",
    title: "SD-WAN Çözümleri ile Daha Güçlü ve Ekonomik Ağ Yönetimi",
    excerpt:
      "SD-WAN teknolojileri, şirketlerin WAN bağlantılarını daha verimli ve güvenli şekilde yönetmesini sağlar. Fortinet SD-WAN çözümleriyle MPLS maliyetlerini düşürürken performansı nasıl artırırsınız?",
    category: "ag-teknolojileri",
    categoryColor: "#0052ff",
    tags: ["SD-WAN", "WAN", "MPLS", "Fortinet", "Ağ Yönetimi", "Şube Ofis"],
    publishedAt: "2026-05-04",
    readTime: 5,
    content: `
<h2>SD-WAN Nedir?</h2>
<p>SD-WAN (Software-Defined Wide Area Network), yazılım tanımlı ağ teknolojisini geniş alan ağlarına uygulayan bir mimaridir. Şirketlerin WAN bağlantılarını daha verimli, güvenli ve maliyet etkin şekilde yönetmesini sağlar.</p>

<h2>Geleneksel WAN'ın Sorunları</h2>
<p>Geleneksel MPLS tabanlı WAN mimarileri şu sorunları taşımaktadır:</p>
<ul>
  <li>Yüksek bant genişliği maliyetleri</li>
  <li>Cloud uygulamalarında performans sorunları</li>
  <li>Şube konfigürasyonlarının karmaşıklığı</li>
  <li>Failover sürelerinin uzunluğu</li>
  <li>Merkezi internet çıkışı nedeniyle gecikme artışı</li>
</ul>

<h2>Fortinet SD-WAN Avantajları</h2>

<h3>Uygulama Bazlı Trafik Yönlendirmesi</h3>
<p>Fortinet SD-WAN, kritik uygulamaları (Office 365, Salesforce, SAP) otomatik olarak tanıyarak en iyi WAN linkinden yönlendirir. Sesli ve görüntülü konferanslar düşük gecikmeli linkleri tercih eder.</p>

<h3>Otomatik Failover</h3>
<p>Birincil WAN bağlantısı kesildiğinde ikincil bağlantıya (4G/5G yedek dahil) saniyeler içinde geçiş yapar. Kullanıcılar bağlantı kesintisini hissetmez.</p>

<h3>Merkezi Yönetim</h3>
<p>FortiManager üzerinden tüm şube cihazları tek bir konsoldan yönetilir. Konfigürasyon değişiklikleri anında tüm ağa uygulanabilir.</p>

<h3>Güvenlik Entegrasyonu</h3>
<p>Fortinet'in SD-WAN çözümü FortiGate ile entegre gelir. Bu sayede ayrıca bir edge güvenlik cihazına gerek kalmadan tüm WAN trafiği NGFW, IPS ve uygulama kontrolüyle korunur.</p>

<h2>ROI Analizi</h2>
<p>Fortinet SD-WAN'e geçen kurumlar tipik olarak:</p>
<ul>
  <li>WAN maliyetlerinde <strong>%40-60 düşüş</strong></li>
  <li>Uygulama performansında <strong>%60+ iyileşme</strong></li>
  <li>IT operasyon saatlerinde <strong>%50 azalma</strong></li>
  <li>Hesaplanan <strong>3 yıllık ROI: %308</strong> (Forrester araştırması)</li>
</ul>

<h2>Sonuç</h2>
<p>Özellikle çok şubeli yapılarda SD-WAN merkezi yönetim, maliyet avantajı ve güvenlik entegrasyonu açısından büyük avantaj sağlamaktadır. Lider Network olarak SD-WAN tasarımı ve implementasyonunda deneyimli ekibimizle hizmetinizdeyiz.</p>
    `,
  },
  {
    slug: "fortiap-kurumsal-kablosuz-ag-cozumleri",
    title: "FortiAP ile Kurumsal Kablosuz Ağ Çözümleri ve WiFi 7",
    excerpt:
      "Kablosuz ağ altyapıları artık kurumsal operasyonların vazgeçilmez parçası. FortiAP cihazları ve yeni nesil WiFi 7 teknolojisiyle kurumsal kablosuz ağ güvenliğini ve performansını nasıl artırırsınız?",
    category: "ag-teknolojileri",
    categoryColor: "#0052ff",
    tags: ["FortiAP", "WiFi 7", "Kablosuz Ağ", "Fortinet", "WiFi 6E", "Enterprise WiFi"],
    publishedAt: "2026-05-02",
    readTime: 5,
    content: `
<h2>Kurumsal WiFi'nin Önemi</h2>
<p>Kablosuz ağ altyapıları artık kurumsal operasyonların vazgeçilmez parçası haline gelmiştir. Akıllı ofisler, IoT cihazları, video konferans sistemleri ve mobil çalışma trendi, kurumsal WiFi altyapısına yönelik talebi katlayarak artırmıştır.</p>

<h2>FortiAP Ürün Ailesi</h2>
<p>Fortinet'in FortiAP ürün ailesi, küçük ofislerden büyük kampüslere kadar geniş bir yelpazede çözümler sunar:</p>
<ul>
  <li><strong>FortiAP 231K:</strong> WiFi 7, 2x2 MIMO, iç mekan kullanımı</li>
  <li><strong>FortiAP 432K:</strong> WiFi 7, 4x4 MIMO, yüksek yoğunluklu ortamlar</li>
  <li><strong>FortiAP 234K:</strong> WiFi 6E, tri-band, 6 GHz desteği</li>
  <li><strong>FortiAP 433K:</strong> Outdoor, hava alanı ve stadyum gibi açık alanlar</li>
</ul>

<h2>WiFi 7'nin Avantajları</h2>
<p>IEEE 802.11be standardı olan WiFi 7, önceki nesillere göre ciddi performans artışları sunar:</p>
<ul>
  <li><strong>Maksimum Hız:</strong> 17.3 Gbps (WiFi 6'nın 9.6 Gbps'sine karşı)</li>
  <li><strong>Multi-Link Operation (MLO):</strong> Birden fazla frekans bandını eş zamanlı kullanma</li>
  <li><strong>320 MHz Kanal Genişliği:</strong> WiFi 6'nın 160 MHz'ine karşı 2 kat artış</li>
  <li><strong>4K-QAM:</strong> Daha yüksek spektral verimlilik</li>
  <li><strong>Düşük Gecikme:</strong> AR/VR ve gerçek zamanlı uygulamalar için ideal</li>
</ul>

<h2>FortiLink Merkezi Yönetim</h2>
<p>FortiAP'ların en büyük avantajlarından biri <strong>FortiLink</strong> üzerinden FortiGate ile entegre yönetimdir. Bu sayede:</p>
<ul>
  <li>Tüm access point'ler FortiGate konsolundan yönetilir</li>
  <li>Ayrı bir wireless controller donanımı gerekmez</li>
  <li>Misafir ağı, kullanıcı segmentasyonu ve güvenlik politikaları merkezi uygulanır</li>
  <li>Kablosuz trafik de FortiGate'in NGFW ve IPS korumasından geçer</li>
</ul>

<h2>Kurumsal Güvenlik Özellikleri</h2>
<ul>
  <li>WPA3 Enterprise şifreleme</li>
  <li>Rogue AP tespiti ve engelleme</li>
  <li>Wireless IDS/IPS</li>
  <li>Client isolation ve VLAN segmentasyonu</li>
  <li>802.1X kimlik doğrulama entegrasyonu</li>
</ul>

<h2>Sonuç</h2>
<p>Yeni nesil WiFi 7 destekli FortiAP modelleri, yüksek yoğunluklu ortamlarda güçlü performans ve kurumsal güvenliği bir arada sunar. Lider Network olarak kablosuz ağ tasarımı, site survey ve FortiAP kurulumunda uzman ekibimizle hizmetinizdeyiz.</p>
    `,
  },
  {
    slug: "soc-ve-xdr-teknolojileri-neden-onemli",
    title: "SOC ve XDR Teknolojileri: Modern Güvenlik Operasyonları",
    excerpt:
      "Security Operations Center (SOC) yapıları artık yalnızca büyük kurumlar için değil, orta ölçekli işletmeler için de kritik. Fortinet XDR çözümleri ve modern SOC mimarisini inceliyoruz.",
    category: "soc-yonetim",
    categoryColor: "#f59e0b",
    tags: ["SOC", "XDR", "FortiSIEM", "FortiSOAR", "Güvenlik Operasyonları", "SIEM"],
    publishedAt: "2026-04-28",
    readTime: 6,
    content: `
<h2>SOC Nedir ve Neden Gerekli?</h2>
<p>Security Operations Center (SOC) yapıları artık yalnızca büyük kurumlar için değil orta ölçekli işletmeler için de kritik hale gelmiştir. Siber tehditlerin karmaşıklığı ve sıklığı, 7/24 izleme ve müdahale kapasitesini zorunlu kılmaktadır.</p>

<h2>XDR Nedir?</h2>
<p>XDR (Extended Detection and Response), siber güvenlik tehditlerini çoklu kontrol noktalarında — endpoint, network, cloud ve email — birleşik olarak tespit edip yanıtlayan bir yaklaşımdır. SIEM'in evrimsel bir üst kümesi olarak değerlendirilebilir.</p>

<h2>Fortinet XDR Çözümleri</h2>
<p>Fortinet XDR çözümleri endpoint, network, cloud ve kullanıcı aktivitelerini tek merkezden analiz eder:</p>

<h3>FortiSIEM</h3>
<p>Fortinet'in SIEM platformu, ağdaki tüm cihaz ve sistemlerden log ve olay verisi toplar. AI destekli korelasyon motoru ile gerçek tehditler gürültüden ayrılır.</p>
<ul>
  <li>50.000 EPS (Events Per Second) kapasitesi</li>
  <li>500+ entegrasyon (third-party cihazlar dahil)</li>
  <li>MITRE ATT&CK çerçevesiyle uyumlu tespit kuralları</li>
  <li>Otomatik varlık keşfi ve risk skorlaması</li>
</ul>

<h3>FortiSOAR</h3>
<p>FortiSOAR, güvenlik operasyonlarını otomatize eden bir SOAR platformudur. Tekrarlayan güvenlik görevlerini playbook'lar ile otomatik hale getirir.</p>
<ul>
  <li>Phishing mail analizi otomasyonu</li>
  <li>IP/Domain reputation sorgulaması</li>
  <li>Otomatik ticket oluşturma ve eskalasyon</li>
  <li>Ortalama müdahale süresini (MTTR) %70 azaltma</li>
</ul>

<h3>FortiAnalyzer</h3>
<p>SOC operasyonlarının log yönetimi ve raporlama katmanını oluşturur. Tüm Fortinet ekosisteminden merkezi log toplama ve korelasyon yapar.</p>

<h2>Managed SOC Seçeneği</h2>
<p>Kendi SOC altyapısını kurmak için yeterli bütçe veya personeli olmayan kurumlar için <strong>Managed SOC</strong> modeli uygun bir alternatiftir. Lider Network olarak FortiSIEM altyapısı üzerinde yönetilen SOC hizmeti sunuyoruz.</p>

<h2>Sonuç</h2>
<p>AI destekli güvenlik operasyonları modern SOC yapılarının temelini oluşturmaktadır. Tehditler daha hızlı tespit edilir, otomatik müdahale süreçleri çalıştırılır ve güvenlik ekiplerinin yükü azalır.</p>
    `,
  },
  {
    slug: "fortinet-security-fabric-nedir",
    title: "Fortinet Security Fabric: Entegre Güvenlik Ekosistemi",
    excerpt:
      "Fortinet Security Fabric mimarisi, firewall, switch, access point, endpoint ve cloud güvenlik çözümlerini tek platform altında birleştiren entegre bir yapıdır. Bu yaklaşım kurumsal güvenliği nasıl dönüştürüyor?",
    category: "fortigate-ngfw",
    categoryColor: "#EE3124",
    tags: ["Security Fabric", "Fortinet", "FortiGate", "Entegre Güvenlik", "NOC", "SOC"],
    publishedAt: "2026-04-25",
    readTime: 5,
    content: `
<h2>Security Fabric Nedir?</h2>
<p>Fortinet Security Fabric mimarisi; firewall, switch, access point, endpoint ve cloud güvenlik çözümlerini tek platform altında birleştiren entegre bir yapıdır. Bu yaklaşım sayesinde tüm güvenlik altyapısı merkezi olarak yönetilebilir.</p>

<h2>Neden Entegre Güvenlik?</h2>
<p>Pek çok kurum, farklı vendorlardan aldığı güvenlik ürünlerini bir arada kullanmaktadır. Bu durum şu sorunlara yol açar:</p>
<ul>
  <li>Farklı konsollar arasında geçiş karmaşası</li>
  <li>Cihazlar arası görünürlük eksikliği</li>
  <li>Olay korelasyonunun güçleşmesi</li>
  <li>Yüksek operasyonel maliyet</li>
  <li>Yavaş müdahale süreleri</li>
</ul>

<h2>Security Fabric Bileşenleri</h2>
<p>Fortinet Security Fabric'in temel bileşenleri:</p>
<ul>
  <li><strong>FortiGate:</strong> Ağın kalbi, NGFW ve SD-WAN</li>
  <li><strong>FortiSwitch:</strong> Güvenli kurumsal anahtarlama</li>
  <li><strong>FortiAP:</strong> Entegre kablosuz güvenlik</li>
  <li><strong>FortiClient / FortiEDR:</strong> Endpoint koruması</li>
  <li><strong>FortiAnalyzer:</strong> Merkezi log yönetimi</li>
  <li><strong>FortiManager:</strong> Merkezi konfigürasyon yönetimi</li>
  <li><strong>FortiSIEM:</strong> Güvenlik olayı yönetimi</li>
  <li><strong>FortiSASE:</strong> Bulut tabanlı güvenlik erişimi</li>
</ul>

<h2>Security Fabric'in Avantajları</h2>

<h3>Tek Pane of Glass</h3>
<p>FortiManager ve FortiAnalyzer üzerinden tüm ağ altyapısı tek bir ekrandan görüntülenebilir ve yönetilebilir. Bu operasyonel verimliliği ciddi ölçüde artırır.</p>

<h3>Otomatik Otomasyon</h3>
<p>Security Fabric'teki cihazlar birbiriyle otomatik olarak iletişim kurar. FortiEDR bir tehdidi tespit ettiğinde FortiGate otomatik olarak o cihazın ağ erişimini kısıtlayabilir.</p>

<h3>Zengin Telemetri</h3>
<p>Tüm Fabric bileşenlerinden toplanan veriler, olay korelasyonu ve tehdit avcılığı (threat hunting) için kullanılır. Görünürlük %360'a çıkar.</p>

<h2>Sonuç</h2>
<p>Fortinet Security Fabric, modern kurumsal güvenlik ihtiyaçlarını karşılamak için tasarlanmış bütüncül bir yaklaşımdır. Olay korelasyonu ve otomasyon süreçleri daha verimli hale gelir, operasyonel verimlilik ve görünürlük ciddi şekilde artar.</p>
    `,
  },
  {
    slug: "kurumsal-sirketler-icin-firewall-secimi",
    title: "Kurumsal Şirketler İçin Doğru Firewall Nasıl Seçilir?",
    excerpt:
      "Firewall seçimi yaparken yalnızca throughput değerlerine bakmak yeterli değil. IPS performansı, SSL inspection kapasitesi, lisans yapısı ve toplam sahip olma maliyeti de kritik faktörler. Doğru seçim için kapsamlı rehber.",
    category: "fortigate-ngfw",
    categoryColor: "#EE3124",
    tags: ["Firewall", "NGFW", "Güvenlik Duvarı", "Fortinet", "FortiGate", "Firewall Seçimi"],
    publishedAt: "2026-04-22",
    readTime: 7,
    content: `
<h2>Firewall Seçimi Neden Kritik?</h2>
<p>Kurumsal ağ güvenliğinin temel taşı olan firewall, yanlış seçildiğinde ya güvenlik açıkları bırakır ya da performans darboğazı oluşturur. Doğru firewall seçimi kurumun büyüklüğüne, sektörüne ve ihtiyaçlarına göre şekillenmelidir.</p>

<h2>Sadece Throughput Yeterli Değil</h2>
<p>Firewall seçiminde sıkça yapılan hata, yalnızca "firewall throughput" değerine bakılmasıdır. Ancak gerçek performans, şu koşullarda ölçülmelidir:</p>
<ul>
  <li><strong>NGFW Throughput:</strong> Tüm güvenlik özellikleri aktifken (IPS + App Control + AV) gerçek değer</li>
  <li><strong>SSL Inspection Throughput:</strong> Şifreli trafik incelenirken kapasite</li>
  <li><strong>Concurrent Sessions:</strong> Aynı anda açık tutulabilen bağlantı sayısı</li>
  <li><strong>New Sessions/Second:</strong> Yeni bağlantı açma hızı</li>
</ul>

<h2>Değerlendirme Kriterleri</h2>

<h3>1. Performans</h3>
<p>Gerçek dünya koşullarında, tüm güvenlik özellikleri aktifken performans ölçülmelidir. Fortinet'in özel ASIC işlemcileri (NP7, CP9), yazılım tabanlı rakiplerden çok daha yüksek performans sunar.</p>

<h3>2. Güvenlik Yetenekleri</h3>
<ul>
  <li>IPS imza güncellik durumu ve hızı</li>
  <li>Zero-day tehdit koruması (sandbox entegrasyonu)</li>
  <li>SSL/TLS inspection kapasitesi</li>
  <li>Uygulama tanıma derinliği (kaç uygulama imzası var?)</li>
  <li>Tehdit istihbaratı güncellik sıklığı</li>
</ul>

<h3>3. Yönetim ve Görünürlük</h3>
<ul>
  <li>Merkezi yönetim platformu var mı? (FortiManager)</li>
  <li>Log ve raporlama kapasitesi</li>
  <li>API ve entegrasyon olanakları</li>
  <li>Öğrenme eğrisi ve arayüz kullanım kolaylığı</li>
</ul>

<h3>4. Lisans ve Toplam Maliyet (TCO)</h3>
<p>Bazı üreticiler cihaz fiyatı düşük tutup lisans maliyetlerini yüksek tutar. Karşılaştırma yaparken 3-5 yıllık toplam sahip olma maliyetine (TCO) bakın:</p>
<ul>
  <li>Cihaz lisans bedeli</li>
  <li>Tehdit istihbaratı aboneliği</li>
  <li>Teknik destek maliyeti</li>
  <li>Kapasite artışı için yükseltme maliyeti</li>
</ul>

<h3>5. Ölçeklenebilirlik</h3>
<p>İş büyüdükçe firewall da büyüyebilmeli. Aynı platform ailesinde yukarı geçiş, konfigürasyon aktarımı ve cluster oluşturma kolaylığı değerlendirilmelidir.</p>

<h2>Fortinet FortiGate'in Üstünlükleri</h2>
<ul>
  <li>Özel ASIC işlemcilerle endüstri liderliği performansı</li>
  <li>Gartner MQ'da 13 yıl üst üste lider konumu</li>
  <li>FortiManager ile çok cihaz merkezi yönetimi</li>
  <li>Security Fabric ekosistemiyle tam entegrasyon</li>
  <li>Güçlü TCO avantajı ve esnek lisans modelleri</li>
</ul>

<h2>Sonuç</h2>
<p>Doğru firewall seçimi; şirketin büyüklüğü, kullanıcı sayısı, internet trafiği ve güvenlik ihtiyaçlarına göre belirlenmelidir. Lider Network olarak ihtiyaç analizi, ürün karşılaştırması ve demo düzenlemesi konusunda ücretsiz danışmanlık sunuyoruz.</p>
    `,
  },

  /* ── SYNOLOGY MAKALELERİ ─────────────────────────────────────────────── */
  {
    slug: "synology-nas-nedir-kurumsal-veri-depolama",
    title: "Synology NAS Nedir? Kurumsal Veri Depolama Çözümleri",
    excerpt:
      "Synology NAS sistemleri, küçük işletmelerden büyük kurumlara kadar yüksek performanslı, yönetilebilir ve güvenli veri depolama altyapısı sunar. Synology'nin kurumsal çözümlerini ve DiskStation Manager (DSM) platformunu detaylıca inceliyoruz.",
    category: "synology",
    categoryColor: "#B5121B",
    tags: ["Synology", "NAS", "Veri Depolama", "DSM", "DiskStation", "Kurumsal Depolama"],
    publishedAt: "2026-05-19",
    readTime: 6,
    featured: false,
    content: `
<h2>Synology NAS Nedir?</h2>
<p>NAS (Network Attached Storage), ağa bağlı depolama anlamına gelir. Synology NAS sistemleri, sunucu altyapısı gerektirmeksizin kurumsal düzeyde dosya depolama, yedekleme ve işbirliği imkânı sunar. Synology'nin özel işletim sistemi <strong>DiskStation Manager (DSM)</strong>, bu cihazları son derece güçlü ve yönetilebilir kılar.</p>

<h2>Synology Ürün Aileleri</h2>
<ul>
  <li><strong>DiskStation (DS) Serisi:</strong> Masaüstü NAS modelleri, küçük ve orta ölçekli işletmeler için ideal</li>
  <li><strong>RackStation (RS) Serisi:</strong> Rack montajlı modeller, veri merkezleri ve kurumsal ortamlar için</li>
  <li><strong>FlashStation (FS) Serisi:</strong> Tüm flash (SSD) kurumsal depolama, maksimum performans</li>
  <li><strong>Unified Controller (UC) Serisi:</strong> Büyük ölçekli kurumsal ve SAN benzeri mimariler</li>
</ul>

<h2>DiskStation Manager (DSM) Neler Sunar?</h2>
<p>DSM, Synology NAS cihazlarının işletim sistemidir. Web tabanlı arayüzüyle kolayca yönetilebilen DSM üzerinde yüzlerce uygulama çalışabilir:</p>
<ul>
  <li><strong>Dosya Paylaşımı:</strong> SMB, NFS, AFP protokolleriyle Windows, Linux ve macOS entegrasyonu</li>
  <li><strong>Active Directory Entegrasyonu:</strong> Mevcut AD/LDAP altyapısıyla sorunsuz kullanıcı yönetimi</li>
  <li><strong>Snapshot & Replikasyon:</strong> Veri tutarlılığı için anlık görüntüler ve uzak replikasyon</li>
  <li><strong>iSCSI / Fiber Channel:</strong> SAN benzeri blok depolama desteği</li>
  <li><strong>Şifreleme:</strong> AES-256 bit volume ve klasör şifreleme</li>
  <li><strong>Uygulama Ekosistemi:</strong> Mail Server, Chat, Drive, Calendar ve daha fazlası</li>
</ul>

<h2>RAID Seçenekleri</h2>
<p>Synology NAS sistemleri Synology Hybrid RAID (SHR) dahil tüm standart RAID seviyelerini destekler:</p>
<ul>
  <li><strong>SHR / SHR-2:</strong> Farklı boyutlardaki diskleri optimize eden Synology'ye özgü RAID</li>
  <li><strong>RAID 5 / 6:</strong> Kurumsal veri güvenliği ve performans dengesi</li>
  <li><strong>RAID 10:</strong> Maksimum performans ve redundancy</li>
</ul>

<h2>Kimler Kullanmalı?</h2>
<ul>
  <li>Merkezi dosya sunucusu arayan KOBİ'ler</li>
  <li>Veri yedekleme altyapısı kurmak isteyen kurumlar</li>
  <li>IP kamera kaydı için depolama ihtiyacı duyanlar</li>
  <li>VM depolama katmanı arayan sanallaştırma altyapıları</li>
  <li>Çok şubeli dosya paylaşımı gerektiren yapılar</li>
</ul>

<h2>Sonuç</h2>
<p>Synology NAS sistemleri, kurumsal veri depolama ihtiyaçlarını uygun maliyet ve yüksek performansla karşılar. Lider Network olarak Synology Yetkili Partner sıfatıyla doğru model seçimi, kurulum ve yönetim konularında yanınızdayız.</p>
    `,
  },
  {
    slug: "synology-active-backup-kurumsal-yedekleme-cozumu",
    title: "Synology Active Backup: Kurumsal Yedekleme Altyapısının Yeni Standardı",
    excerpt:
      "Synology Active Backup Suite, PC'ler, sunucular, sanal makineler ve Microsoft 365/Google Workspace verilerini tek bir arayüzden yedekleyen lisanssız bir kurumsal yedekleme platformudur. Nasıl çalıştığını ve avantajlarını inceliyoruz.",
    category: "synology",
    categoryColor: "#B5121B",
    tags: ["Synology", "Active Backup", "Yedekleme", "Backup", "VM Backup", "Microsoft 365"],
    publishedAt: "2026-05-17",
    readTime: 6,
    content: `
<h2>Active Backup Suite Nedir?</h2>
<p>Synology Active Backup Suite, kurumsal yedekleme ihtiyaçlarını tek platformda toplayan <strong>ek lisans ücreti olmaksızın</strong> sunulan bir çözüm paketidir. DSM üzerinde çalışır ve NAS cihazınızı tam kapsamlı bir yedekleme merkezine dönüştürür.</p>

<h2>Active Backup Suite Bileşenleri</h2>

<h3>Active Backup for Business</h3>
<p>Windows PC, Mac ve Linux sunucularını ajanla veajansız yedekleme imkânı sunar:</p>
<ul>
  <li>Blok düzeyinde artımlı yedekleme ile minimum depolama tüketimi</li>
  <li>Global tekilleştirme (global deduplication) ile disk verimliliği</li>
  <li>Anlık restorasyon (bare-metal recovery)</li>
  <li>Çoklu cihaz için merkezi yönetim paneli</li>
</ul>

<h3>Active Backup for Virtual Machines</h3>
<p>VMware vSphere ve Microsoft Hyper-V ortamlarını ajanssız olarak yedekler:</p>
<ul>
  <li>VMware CBT (Changed Block Tracking) desteği ile hızlı artımlı yedek</li>
  <li>Anlık VM kurtarma ve granüler dosya düzeyinde geri yükleme</li>
  <li>Yedekleme doğrulama (Backup Verification) ile güvenilirlik testi</li>
  <li>RPO (Recovery Point Objective) 15 dakikaya kadar düşürülebilir</li>
</ul>

<h3>Active Backup for Microsoft 365</h3>
<p>Exchange Online, SharePoint, OneDrive ve Teams verilerini otomatik olarak Synology NAS'a yedekler:</p>
<ul>
  <li>Sürekli yedekleme — saatlik otomatik senkronizasyon</li>
  <li>E-posta, dosya, kanal mesajı ve takvim verisi kurtarma</li>
  <li>Microsoft'un yerel yedekleme eksikliğine karşı 3. parti koruma</li>
</ul>

<h3>Active Backup for Google Workspace</h3>
<p>Gmail, Drive, Contacts ve Calendar verilerini yerel NAS depolama üzerine alır.</p>

<h2>3-2-1 Yedekleme Kuralını Kolaylaştırıyor</h2>
<p>Active Backup + Synology Hyper Backup kombinasyonu ile 3-2-1 yedekleme stratejisini kolayca uygulayabilirsiniz:</p>
<ul>
  <li><strong>3 kopya</strong> — yerel NAS üzerinde birden fazla versiyon</li>
  <li><strong>2 farklı ortam</strong> — NAS diski + Synology C2 Cloud</li>
  <li><strong>1 off-site kopya</strong> — C2 Cloud veya uzak NAS replikasyonu</li>
</ul>

<h2>Maliyet Avantajı</h2>
<p>Geleneksel kurumsal yedekleme çözümleri (Veeam, Commvault, Veritas) ciddi lisans maliyetleri gerektirir. Synology Active Backup Suite, NAS cihazıyla birlikte <strong>ek lisans ücreti olmadan</strong> gelir. Bu, özellikle KOBİ ve orta ölçekli kurumlar için büyük maliyet avantajı sağlar.</p>

<h2>Sonuç</h2>
<p>Synology Active Backup Suite, uygun maliyetle kurumsal düzey yedekleme altyapısı arayan işletmeler için mükemmel bir seçimdir. Lider Network olarak Active Backup kurulumu, konfigürasyonu ve yedekleme stratejisi danışmanlığı sunuyoruz.</p>
    `,
  },
  {
    slug: "synology-surveillance-station-ip-kamera-yonetimi",
    title: "Synology Surveillance Station ile Kurumsal IP Kamera Yönetimi",
    excerpt:
      "Synology Surveillance Station, yüzlerce IP kamerayı merkezi olarak yöneten, kayıt, izleme ve analiz özellikleri sunan güçlü bir video yönetim sistemidir. NAS tabanlı güvenlik kamerası altyapısının avantajlarını inceleyelim.",
    category: "synology",
    categoryColor: "#B5121B",
    tags: ["Synology", "Surveillance Station", "IP Kamera", "NVR", "VMS", "Güvenlik Kamerası"],
    publishedAt: "2026-05-14",
    readTime: 5,
    content: `
<h2>Surveillance Station Nedir?</h2>
<p>Synology Surveillance Station, Synology NAS cihazları üzerinde çalışan profesyonel bir Video Yönetim Sistemi (VMS) uygulamasıdır. IP güvenlik kameralarınızı merkezi olarak bağlar, kayıt alır, izler ve gelişmiş analiz özellikleri sunar.</p>

<h2>Temel Özellikler</h2>

<h3>Kamera Desteği</h3>
<ul>
  <li><strong>8.500+ kamera modeli</strong> uyumluluğu (Hikvision, Dahua, Bosch, Axis ve daha fazlası)</li>
  <li>ONVIF standardı ile uyumlu tüm markalar</li>
  <li>Çözünürlük desteği: SD'den 4K ve 8K'ya kadar</li>
  <li>Fisheye, panoramik ve PTZ kamera desteği</li>
</ul>

<h3>Kayıt Seçenekleri</h3>
<ul>
  <li><strong>Sürekli kayıt:</strong> 7/24 kesintisiz video arşivi</li>
  <li><strong>Hareket algılamada kayıt:</strong> Depolama tasarrufu için akıllı tetikleme</li>
  <li><strong>Zamanlama tabanlı kayıt:</strong> Çalışma saatlerine göre esnek planlama</li>
  <li><strong>Olay bazlı kayıt:</strong> Alarm, kapı sensörü vb. entegrasyon</li>
</ul>

<h3>Yapay Zeka Destekli Analiz</h3>
<p>Synology Deep Learning paketi ile gelişmiş analitik özellikler:</p>
<ul>
  <li><strong>Yüz tanıma:</strong> Yetkili/yetkisiz kişi tespiti</li>
  <li><strong>Plaka tanıma (LPR):</strong> Araç giriş-çıkış takibi</li>
  <li><strong>Sanal bölge ihlali:</strong> Tanımlanan alanları geçme alarmları</li>
  <li><strong>İnsan/araç sınıflandırması:</strong> Yanlış alarm oranını azaltma</li>
</ul>

<h3>Canlı İzleme ve Playback</h3>
<ul>
  <li>Web tarayıcısı, Windows/Mac istemcisi ve mobil uygulama (iOS/Android)</li>
  <li>Çok ekranlı görüntüleme (1, 4, 9, 16, 64 bölme)</li>
  <li>Akıllı arama: Belirli bir bölgede hareket olduğu anların hızla bulunması</li>
  <li>Video ihracatı ve kanıt belgesi oluşturma</li>
</ul>

<h2>NAS Tabanlı NVR'ın Avantajları</h2>
<p>Geleneksel donanım NVR sistemlerine kıyasla Synology NAS tabanlı çözüm şu avantajları sunar:</p>
<ul>
  <li><strong>Ölçeklenebilirlik:</strong> Disk ekleyerek depolama kapasitesi artırılabilir</li>
  <li><strong>Çok fonksiyonluluk:</strong> Aynı cihaz hem NVR hem dosya sunucusu hem de yedekleme sistemi</li>
  <li><strong>Düşük maliyet:</strong> Ayrı NVR donanımı gerekmez</li>
  <li><strong>Merkezi yönetim:</strong> DSM üzerinden tek panelden tüm işlevler</li>
  <li><strong>RAID ile veri güvenliği:</strong> Disk arızasında kayıt kaybı olmaz</li>
</ul>

<h2>Lisanslama</h2>
<p>Synology Surveillance Station, cihazla birlikte <strong>2 kamera lisansı ücretsiz</strong> gelir. Ek kameralar için uygun fiyatlı kamera lisansı paketi satın alınır. Büyük ölçekli kurulumlar için kurumsal lisans seçenekleri de mevcuttur.</p>

<h2>Sonuç</h2>
<p>Synology Surveillance Station, güvenlik kamerası altyapısını NAS ile birleştirerek maliyet etkin ve güçlü bir çözüm sunar. Lider Network olarak kamera seçimi, NAS boyutlandırması ve Surveillance Station kurulumunda hizmetinizdeyiz.</p>
    `,
  },
  {
    slug: "synology-high-availability-kurumsal-sureklilik",
    title: "Synology High Availability ile Kurumsal İş Sürekliliği",
    excerpt:
      "Synology High Availability (SHA), iki NAS cihazını aktif-pasif küme olarak yapılandırarak veri depolama altyapınızda sıfıra yakın kesinti süresi garanti eder. Kurumsal HA mimarisini ve Synology çözümünü inceliyoruz.",
    category: "synology",
    categoryColor: "#B5121B",
    tags: ["Synology", "High Availability", "HA Cluster", "İş Sürekliliği", "Failover", "NAS"],
    publishedAt: "2026-05-11",
    readTime: 5,
    content: `
<h2>High Availability (HA) Nedir?</h2>
<p>High Availability (Yüksek Erişilebilirlik), bir sistemin planlı ya da plansız kesintilerde hizmet vermeye devam etmesini sağlayan mimari yaklaşımdır. Kritik iş süreçlerinin depolama altyapısına bağımlılığı göz önüne alındığında, NAS tarafında HA çözümü artık bir lüks değil zorunluluktur.</p>

<h2>Synology High Availability (SHA)</h2>
<p>Synology High Availability paketi, iki identik Synology NAS cihazını <strong>aktif-pasif küme</strong> yapısında çalıştırır. Aktif sunucu tüm hizmetleri sunarken, pasif sunucu her an devralabilecek şekilde senkronize hâlde bekler.</p>

<h2>SHA Nasıl Çalışır?</h2>
<ul>
  <li><strong>Heartbeat Bağlantısı:</strong> İki NAS cihazı özel bir ağ bağlantısıyla birbirini sürekli izler</li>
  <li><strong>Gerçek Zamanlı Replikasyon:</strong> Aktif sunucudaki tüm yazma işlemleri anlık olarak pasif sunucuya yansıtılır</li>
  <li><strong>Otomatik Failover:</strong> Aktif sunucu yanıt vermediğinde pasif sunucu otomatik olarak devreye girer</li>
  <li><strong>Sanal IP:</strong> İstemciler tek bir sanal IP'ye bağlanır — failover sırasında bağlantı kopukluğu minimuma iner</li>
</ul>

<h2>SHA'nın Temel Avantajları</h2>
<ul>
  <li><strong>RTO (Recovery Time Objective):</strong> Birkaç dakika içinde otomatik geçiş</li>
  <li><strong>RPO (Recovery Point Objective):</strong> Sıfıra yakın veri kaybı (gerçek zamanlı replikasyon)</li>
  <li><strong>Otomatik Geçiş:</strong> Manuel müdahale gerektirmez</li>
  <li><strong>Kolay Yönetim:</strong> DSM üzerinden tek panelden küme izleme ve yönetimi</li>
  <li><strong>Uygun Maliyet:</strong> Kurumsal SAN sistemlere kıyasla çok daha erişilebilir</li>
</ul>

<h2>Hangi Senaryolarda Kritik?</h2>
<ul>
  <li>7/24 erişim gerektiren paylaşımlı dosya sunucuları</li>
  <li>VM depolama katmanı olarak kullanılan NAS sistemleri</li>
  <li>Sürekli erişim gerektiren güvenlik kamerası kayıt altyapıları</li>
  <li>E-posta veya veritabanı arka uç depolama sistemleri</li>
  <li>SLA taahhüdü olan hizmet sağlayıcılar</li>
</ul>

<h2>Donanım Gereksinimleri</h2>
<p>SHA kurulumu için iki identik Synology NAS modeli ve identik disk konfigürasyonu gereklidir. Heartbeat bağlantısı için ayrı bir ağ arayüzü kullanılması önerilir. SHA uyumlu modeller için Synology uyumluluk listesi kontrol edilmelidir.</p>

<h2>Sonuç</h2>
<p>Synology High Availability, kurumsal düzeyde depolama sürekliliğini uygun maliyetle sağlamak isteyen yapılar için ideal çözümdür. Lider Network olarak SHA tasarımı, kurulumu ve test süreçlerinde uzman ekibimizle hizmetinizdeyiz.</p>
    `,
  },
  {
    slug: "synology-c2-cloud-hibrit-yedekleme",
    title: "Synology C2 Cloud ile Hibrit Yedekleme ve Felaket Kurtarma",
    excerpt:
      "Synology C2, Synology'nin kendi bulut altyapısıdır. Yerel NAS yedeklemelerini otomatik olarak buluta taşıyarak 3-2-1 yedekleme stratejisini kolaylaştırır ve felaket kurtarma senaryolarını mümkün kılar.",
    category: "synology",
    categoryColor: "#B5121B",
    tags: ["Synology", "C2 Cloud", "Hibrit Bulut", "Yedekleme", "Felaket Kurtarma", "DR"],
    publishedAt: "2026-05-08",
    readTime: 5,
    content: `
<h2>Synology C2 Nedir?</h2>
<p>Synology C2, Synology'nin işlettiği özel bulut platformudur. Avrupa (Frankfurt), Amerika (Seattle/Virginia) ve Asya (Tokyo) veri merkezlerinde çalışan C2, Synology NAS cihazlarıyla mükemmel entegrasyon sunar.</p>

<h2>C2 Servis Ailesi</h2>

<h3>C2 Backup (Hyper Backup ile)</h3>
<p>NAS üzerindeki Hyper Backup uygulaması aracılığıyla yerel yedeklemeler C2 Cloud'a otomatik olarak gönderilir:</p>
<ul>
  <li>AES-256 bit şifreleme ile güvenli depolama</li>
  <li>Artımlı yedekleme ile bant genişliği tasarrufu</li>
  <li>Çoklu versiyon geçmişi (istenen zaman noktasına geri dönüş)</li>
  <li>Avrupa GDPR uyumlu veri merkezi seçeneği</li>
</ul>

<h3>C2 Object Storage</h3>
<p>S3 uyumlu nesne depolama hizmeti. Üçüncü parti uygulamalarla (Veeam, Acronis vb.) doğrudan entegre çalışır.</p>

<h3>C2 Transfer</h3>
<p>Kurumlar arası güvenli dosya transferi için uçtan uca şifreli paylaşım platformu.</p>

<h3>C2 Password</h3>
<p>Kurumsal şifre yönetimi ve sıfır-bilgi mimarisiyle güvenli kimlik bilgisi paylaşımı.</p>

<h2>Hibrit Yedekleme Mimarisi</h2>
<p>Synology NAS + C2 Cloud kombinasyonu ile kusursuz 3-2-1 yedekleme stratejisi:</p>
<ul>
  <li><strong>Birincil veri:</strong> Üretim sunucuları / kullanıcı PC'leri</li>
  <li><strong>Yerel yedek:</strong> Synology NAS (Active Backup ile anlık yedekleme)</li>
  <li><strong>Off-site yedek:</strong> C2 Cloud (Hyper Backup ile otomatik senkronizasyon)</li>
</ul>

<h2>Felaket Kurtarma Senaryosu</h2>
<p>Ofis yangını, sel veya fiziksel hırsızlık gibi felaket senaryolarında yerel NAS'a erişim imkânsız olsa dahi C2 Cloud'daki veriler tam olarak korunmuş durumdadır. Yeni bir NAS cihazı ile C2'den tam restorasyon yapılabilir.</p>

<h2>Maliyet Analizi</h2>
<p>C2 Cloud, aylık abonelik modeliyle çalışır. 1 TB, 2 TB ve 5 TB paketleri mevcuttur. Public cloud alternatifleri (AWS S3, Azure Blob) ile kıyaslandığında Synology C2 çok daha uygun fiyatlıdır ve Synology arayüzüyle derin entegrasyonu nedeniyle kurulum ve yönetim çok daha kolaydır.</p>

<h2>Sonuç</h2>
<p>Synology C2, yerel NAS altyapınızı bulutla tamamlayarak gerçek anlamda kapsamlı bir yedekleme çözümü sunar. Lider Network olarak C2 entegrasyon, kapasite planlaması ve DR test süreçlerinde danışmanlık sunuyoruz.</p>
    `,
  },
  {
    slug: "synology-drive-kurumsal-dosya-isbirligi",
    title: "Synology Drive ile Kurumsal Dosya İşbirliği ve Sürüm Yönetimi",
    excerpt:
      "Synology Drive, Google Drive ve SharePoint'e alternatif olarak şirket içinde barındırılan (on-premise) kurumsal dosya senkronizasyonu ve işbirliği platformudur. Veri kontrolü sizde kalırken bulut konforu yaşarsınız.",
    category: "synology",
    categoryColor: "#B5121B",
    tags: ["Synology", "Synology Drive", "Dosya Paylaşımı", "On-Premise", "İşbirliği", "Sürüm Yönetimi"],
    publishedAt: "2026-05-05",
    readTime: 5,
    content: `
<h2>Synology Drive Nedir?</h2>
<p>Synology Drive, Synology NAS üzerinde çalışan kurumsal dosya senkronizasyonu ve işbirliği platformudur. Google Drive veya OneDrive'ın sağladığı konforu, verilerinizi kendi sunucunuzda tutarak elde etmenizi sağlar. Bu yaklaşım özellikle veri gizliliği ve KVKK/GDPR uyumu açısından kritik avantaj sunar.</p>

<h2>Temel Özellikler</h2>

<h3>Dosya Senkronizasyonu</h3>
<ul>
  <li>Windows, macOS ve Linux için masaüstü istemcisi</li>
  <li>iOS ve Android mobil uygulaması</li>
  <li>Gerçek zamanlı senkronizasyon — değişiklikler anında tüm cihazlara yansır</li>
  <li>Seçici senkronizasyon — hangi klasörlerin senkronize edileceğini seçme</li>
  <li>Bant genişliği limitleyici ile ağ yükünü kontrol etme</li>
</ul>

<h3>Sürüm Geçmişi</h3>
<p>Synology Drive'ın en güçlü özelliklerinden biri kapsamlı sürüm yönetimidir:</p>
<ul>
  <li>Her dosyanın belirli sayıda önceki versiyonu saklanır</li>
  <li>Yanlışlıkla silinen ya da üzerine yazılan dosyaları kolayca geri yükleme</li>
  <li>Ransomware şifrelemesi sonrasında dosyaları temiz versiyona döndürme</li>
  <li>Versiyon geçmişi DSM yönetici tarafından ayarlanabilir</li>
</ul>

<h3>Takım İşbirliği</h3>
<ul>
  <li><strong>Synology Drive ShareLink:</strong> Dışarıdan erişim için şifreli, süreli paylaşım linkleri</li>
  <li><strong>Ortak Düzenleme:</strong> Office Online veya LibreOffice entegrasyonuyla eş zamanlı belge düzenleme</li>
  <li><strong>Yorum Sistemi:</strong> Dosya bazlı yorum ve görev atama</li>
  <li><strong>Bildirimler:</strong> Dosya değişikliği ve paylaşım bildirimleri</li>
</ul>

<h3>Drive Admin Console</h3>
<p>IT yöneticileri için merkezi yönetim paneli:</p>
<ul>
  <li>Kullanıcı bazlı depolama kotası yönetimi</li>
  <li>Paylaşım politikalarını merkezi kontrol</li>
  <li>Bağlı cihazları görüntüleme ve uzaktan silme</li>
  <li>Detaylı audit log (kim, ne zaman, hangi dosyaya erişti)</li>
</ul>

<h2>Google Drive / OneDrive'a Karşı Avantajlar</h2>
<ul>
  <li><strong>Veri Kontrolü:</strong> Veriler kendi sunucunuzda, üçüncü parti buluta bağımlılık yok</li>
  <li><strong>KVKK / GDPR Uyumu:</strong> Veri lokasyonunu tam olarak kontrol etme imkânı</li>
  <li><strong>Maliyet:</strong> Kullanıcı başına aylık abonelik yoktur — NAS cihazıyla sınırsız kullanım</li>
  <li><strong>Ağ Bağımsızlığı:</strong> İnternet kesilse de LAN üzerinde çalışmaya devam eder</li>
  <li><strong>Özelleştirme:</strong> Depolama yapısı, politikalar ve entegrasyonlar tam kontrolünüzde</li>
</ul>

<h2>Kimler Kullanmalı?</h2>
<ul>
  <li>Veri gizliliğine duyarlı sağlık, hukuk ve finans sektörleri</li>
  <li>Kamu kurumları ve kamu verisi işleyen şirketler</li>
  <li>Bulut abonelik maliyetlerini düşürmek isteyen KOBİ'ler</li>
  <li>Çok şubeli yapılarda merkezi dosya yönetimi arayan kurumlar</li>
</ul>

<h2>Sonuç</h2>
<p>Synology Drive, kurumsal dosya işbirliğini kendi altyapınızda yönetmenin en akıllı yollarından biridir. Lider Network olarak Synology Drive kurulumu, AD entegrasyonu ve kullanıcı eğitimi konularında hizmet sunuyoruz.</p>
    `,
  },
  /* ── MİCROSOFT & AZURE MAKALELERİ ──────────────────────────────────────── */
  {
    slug: "microsoft-365-nedir-kurumsal-bulut-ofis-paketi",
    title: "Microsoft 365 Nedir? Kurumsal Bulut Ofis Paketinin Tam Rehberi",
    excerpt:
      "Microsoft 365, Word ve Excel'in çok ötesinde; e-posta, Teams, SharePoint, güvenlik ve cihaz yönetimini tek abonelikte sunan kapsamlı bir kurumsal platform. Hangi plan sizin için doğru?",
    category: "microsoft",
    categoryColor: "#00a4ef",
    tags: ["Microsoft 365", "Office 365", "Teams", "SharePoint", "Exchange Online", "Bulut Ofis"],
    publishedAt: "2026-05-20",
    readTime: 7,
    content: `
<h2>Microsoft 365 Nedir?</h2>
<p>Microsoft 365 (eski adıyla Office 365), Word, Excel, PowerPoint gibi tanıdık ofis uygulamalarının çok ötesine geçen kapsamlı bir kurumsal bulut platformudur. E-posta, anlık mesajlaşma, dosya depolama, video konferans, güvenlik ve cihaz yönetimini <strong>tek abonelik altında</strong> sunar.</p>

<h2>Microsoft 365'in Temel Bileşenleri</h2>

<h3>Üretkenlik Uygulamaları</h3>
<ul>
  <li><strong>Word, Excel, PowerPoint, OneNote:</strong> Masaüstü ve web uygulamaları</li>
  <li><strong>Microsoft Teams:</strong> Mesajlaşma, toplantı, dosya paylaşımı ve uygulama entegrasyonu</li>
  <li><strong>Outlook:</strong> E-posta istemcisi (Exchange Online ile bağlantılı)</li>
  <li><strong>OneDrive for Business:</strong> Kişisel bulut depolama (1 TB/kullanıcı)</li>
  <li><strong>SharePoint Online:</strong> Kurumsal intranet ve belge yönetim sistemi</li>
</ul>

<h3>İletişim ve İşbirliği</h3>
<ul>
  <li><strong>Exchange Online:</strong> Kurumsal e-posta ve takvim altyapısı (50–100 GB posta kutusu)</li>
  <li><strong>Teams Phone:</strong> Bulut tabanlı PBX ve PSTN çağrı sistemi</li>
  <li><strong>Viva:</strong> Çalışan deneyimi ve eğitim platformu</li>
</ul>

<h3>Güvenlik ve Uyumluluk</h3>
<ul>
  <li><strong>Microsoft Defender for Office 365:</strong> E-posta ve dosya tehditlerine karşı koruma</li>
  <li><strong>Microsoft Purview:</strong> Veri kaybı önleme (DLP), uyumluluk ve bilgi koruma</li>
  <li><strong>Conditional Access:</strong> Koşullu erişim ve çok faktörlü kimlik doğrulama</li>
</ul>

<h3>Cihaz Yönetimi</h3>
<ul>
  <li><strong>Microsoft Intune:</strong> Mobil ve masaüstü cihaz yönetimi (MDM/MAM)</li>
  <li><strong>Azure Active Directory (Entra ID):</strong> Kimlik ve erişim yönetimi</li>
  <li><strong>Windows Autopilot:</strong> Sıfır dokunuşla cihaz dağıtımı</li>
</ul>

<h2>Kurumsal Plan Karşılaştırması</h2>
<ul>
  <li><strong>Microsoft 365 Business Basic:</strong> Web uygulamaları, Teams, Exchange — küçük ekipler için</li>
  <li><strong>Microsoft 365 Business Standard:</strong> Masaüstü Office uygulamaları dahil — KOBİ standardı</li>
  <li><strong>Microsoft 365 Business Premium:</strong> Intune + Defender dahil — güvenlik odaklı KOBİ</li>
  <li><strong>Microsoft 365 E3:</strong> Kurumsal uyumluluk ve gelişmiş güvenlik özellikleri</li>
  <li><strong>Microsoft 365 E5:</strong> Tam güvenlik paketi — Defender, Sentinel, Purview dahil</li>
</ul>

<h2>On-Premise'den Microsoft 365'e Geçiş</h2>
<p>Exchange Server veya yerel dosya sunucularından Microsoft 365'e geçiş; doğru planlama ile kesintisiz gerçekleşir. Kritik adımlar:</p>
<ul>
  <li>Mevcut e-posta ve veri envanteri çıkarma</li>
  <li>Hybrid veya tam bulut geçiş yöntemi seçimi</li>
  <li>DNS kayıtları ve MX kaydı güncelleme</li>
  <li>Kullanıcı eğitimi ve değişim yönetimi</li>
  <li>Güvenlik politikalarının yeniden yapılandırılması</li>
</ul>

<h2>Sonuç</h2>
<p>Microsoft 365, kurumsal verimliliği, güvenliği ve işbirliğini tek platformda birleştiren güçlü bir çözümdür. Lider Network olarak Microsoft 365 lisanslama, geçiş projesi tasarımı ve uygulama süreçlerinde yanınızdayız.</p>
    `,
  },
  {
    slug: "exchange-online-vs-on-premise-exchange-karsilastirma",
    title: "Exchange Online vs On-Premise Exchange: Kurumsal E-posta Platformu Seçimi",
    excerpt:
      "Exchange Server'ınızı buluta taşımalı mısınız? Exchange Online'ın avantajları, hibrit dağıtım seçenekleri ve hangi kurumun hangi modeli tercih etmesi gerektiğini detaylıca karşılaştırıyoruz.",
    category: "microsoft",
    categoryColor: "#00a4ef",
    tags: ["Exchange Online", "Exchange Server", "Kurumsal E-posta", "Microsoft 365", "Hibrit Exchange", "Mail Sunucu"],
    publishedAt: "2026-05-18",
    readTime: 7,
    content: `
<h2>Kurumsal E-posta: Üç Seçenek</h2>
<p>Kurumsal e-posta altyapısı söz konusu olduğunda üç temel seçenek bulunur: tamamen şirket içi (on-premise) Exchange Server, tamamen bulut tabanlı Exchange Online ve her ikisini birleştiren hibrit dağıtım.</p>

<h2>Exchange Online Nedir?</h2>
<p>Exchange Online, Microsoft 365 aboneliğinin bir parçası olarak sunulan bulut tabanlı e-posta, takvim ve kişi yönetim platformudur. Microsoft'un küresel veri merkezlerinde çalışır, bakımı ve güncellemeleri Microsoft tarafından yapılır.</p>

<h3>Exchange Online Avantajları</h3>
<ul>
  <li><strong>Sıfır sunucu bakımı:</strong> Güncelleme, yama ve donanım yönetimi Microsoft'ta</li>
  <li><strong>%99,9 SLA:</strong> Microsoft'un garantili erişilebilirlik taahhüdü</li>
  <li><strong>50–100 GB posta kutusu:</strong> Kullanıcı başına büyük depolama alanı</li>
  <li><strong>Microsoft Defender entegrasyonu:</strong> Anti-spam, anti-phishing, safe links, safe attachments</li>
  <li><strong>Her yerden erişim:</strong> Outlook, web arayüzü ve mobil uygulama</li>
  <li><strong>Arşivleme ve uyumluluk:</strong> Litigation Hold, eDiscovery, DLP politikaları</li>
  <li><strong>Ölçeklenebilirlik:</strong> Kullanıcı eklemek dakikalar içinde gerçekleşir</li>
</ul>

<h3>Exchange Online Dezavantajları</h3>
<ul>
  <li>İnternet bağlantısı zorunluluğu (offline çalışmada sınırlı özellik)</li>
  <li>Veri lokasyonu üzerinde sınırlı kontrol (Microsoft veri merkezleri)</li>
  <li>Özelleştirme esnekliği on-premise kadar geniş değil</li>
  <li>Aylık abonelik maliyeti (kullanıcı başına)</li>
</ul>

<h2>On-Premise Exchange Server Nedir?</h2>
<p>Şirketin kendi veri merkezinde çalışan Exchange Server, tam kontrol ve özelleştirme imkânı sunar. Exchange Server 2019 güncel sürümdür; Exchange Server 2025 duyurusu yapılmıştır.</p>

<h3>On-Premise Exchange Avantajları</h3>
<ul>
  <li><strong>Tam veri kontrolü:</strong> Tüm e-posta verileri kendi sunucunuzda</li>
  <li><strong>İnternet bağımsızlığı:</strong> İç ağda tamamen çevrimdışı çalışabilme</li>
  <li><strong>Derin özelleştirme:</strong> Transport kuralları, connector ve politika esnekliği</li>
  <li><strong>Mevcut lisans yatırımı korunur</strong></li>
  <li><strong>Kamu/sektörel uyumluluk:</strong> Bazı sektörlerde zorunlu yerel veri depolama</li>
</ul>

<h3>On-Premise Exchange Dezavantajları</h3>
<ul>
  <li>Donanım, yazılım lisansı ve bakım maliyeti</li>
  <li>IT ekibi yönetim yükü (yamalar, güncellemeler, disk yönetimi)</li>
  <li>Ölçeklendirme için donanım yatırımı gerekir</li>
  <li>Felaket kurtarma için ek altyapı (DAG, yedek site)</li>
</ul>

<h2>Hibrit Exchange Dağıtımı</h2>
<p>Hibrit dağıtım, on-premise Exchange ve Exchange Online'ı birlikte çalıştırır. Geçiş sürecinde ya da bazı kullanıcıları bulutta, bazılarını yerelde tutmak isteyenler için idealdir:</p>
<ul>
  <li>Posta kutuları kademeli olarak Exchange Online'a taşınabilir</li>
  <li>On-premise ve bulut kullanıcıları arasında sorunsuz e-posta akışı</li>
  <li>Ortak Global Adres Listesi (GAL) korunur</li>
  <li>Free/busy takvim bilgisi her iki taraf arasında çalışır</li>
</ul>

<h2>Hangi Modeli Seçmeli?</h2>
<ul>
  <li><strong>Exchange Online seçin:</strong> Sunucu yönetiminden kurtulmak, ölçeklenebilirlik ve modern güvenlik öncelikliyse</li>
  <li><strong>On-Premise seçin:</strong> Veri lokasyonu zorunluluğu, derin özelleştirme veya düzenleyici gereklilik varsa</li>
  <li><strong>Hibrit seçin:</strong> Kademeli bulut geçişi planlıyorsanız veya karma yapı zorunluysa</li>
</ul>

<h2>Sonuç</h2>
<p>Doğru e-posta platformu seçimi kurumun büyüklüğüne, sektörüne ve güvenlik gereksinimlerine göre değişir. Lider Network olarak Exchange kurulumu, Exchange Online geçişi ve hibrit yapı tasarımında deneyimli ekibimizle hizmetinizdeyiz.</p>
    `,
  },
  {
    slug: "microsoft-azure-nedir-kurumsal-bulut-altyapisi",
    title: "Microsoft Azure Nedir? Kurumsal Bulut Altyapısının Temelleri",
    excerpt:
      "Microsoft Azure, 200'den fazla bulut hizmetiyle dünyanın önde gelen bulut platformlarından biridir. Sanal makinelerden AI hizmetlerine kadar Azure'u ve Türkiye veri merkezini detaylıca inceliyoruz.",
    category: "microsoft",
    categoryColor: "#00a4ef",
    tags: ["Microsoft Azure", "Bulut", "IaaS", "PaaS", "Azure VM", "Azure Türkiye", "Hibrit Bulut"],
    publishedAt: "2026-05-16",
    readTime: 7,
    content: `
<h2>Microsoft Azure Nedir?</h2>
<p>Microsoft Azure, Microsoft'un işlettiği kapsamlı bulut bilişim platformudur. Dünya genelinde 60'tan fazla coğrafi bölgede, 200'den fazla hizmetle işletmecilere altyapı, platform ve yazılım düzeyinde bulut çözümleri sunar.</p>
<p>Azure; sanal makinelerden, veri tabanlarına, yapay zekâya, IoT'ye ve hibrit bulut bağlantısına kadar geniş bir yelpazede hizmet sunar. <strong>Türkiye'de ise Azure, 2021'den itibaren yerli veri merkezleriyle hizmet vermektedir.</strong></p>

<h2>Azure Hizmet Kategorileri</h2>

<h3>IaaS — Altyapı Hizmetleri</h3>
<ul>
  <li><strong>Azure Virtual Machines:</strong> Windows ve Linux sanal sunucular, onlarca VM ailesi</li>
  <li><strong>Azure Virtual Network (VNet):</strong> İzole sanal ağ, VPN Gateway, ExpressRoute</li>
  <li><strong>Azure Storage:</strong> Blob, File, Queue ve Table depolama hizmetleri</li>
  <li><strong>Azure Load Balancer:</strong> Yük dengeleme ve yüksek erişilebilirlik</li>
</ul>

<h3>PaaS — Platform Hizmetleri</h3>
<ul>
  <li><strong>Azure App Service:</strong> Web ve API uygulamalarını kod yazarak yönetmeden çalıştırma</li>
  <li><strong>Azure SQL Database:</strong> Yönetilen ilişkisel veritabanı hizmeti</li>
  <li><strong>Azure Kubernetes Service (AKS):</strong> Yönetilen container orkestrasyon platformu</li>
  <li><strong>Azure Functions:</strong> Serverless uygulama geliştirme</li>
</ul>

<h3>Güvenlik ve Kimlik</h3>
<ul>
  <li><strong>Microsoft Entra ID (Azure AD):</strong> Bulut kimlik ve erişim yönetimi</li>
  <li><strong>Microsoft Defender for Cloud:</strong> Çoklu bulut güvenlik duruş yönetimi</li>
  <li><strong>Azure Key Vault:</strong> Sertifika, şifre ve gizli anahtar yönetimi</li>
  <li><strong>Azure DDoS Protection:</strong> Dağıtık hizmet engelleme saldırılarına karşı koruma</li>
</ul>

<h3>Hibrit Bulut</h3>
<ul>
  <li><strong>Azure Arc:</strong> On-premise ve çoklu bulut ortamlarını Azure'dan yönetme</li>
  <li><strong>Azure Stack HCI:</strong> Veri merkezinde çalışan Azure deneyimi</li>
  <li><strong>Azure ExpressRoute:</strong> Veri merkezinizden Azure'a özel ağ bağlantısı</li>
  <li><strong>Azure VPN Gateway:</strong> Şifreli site-to-site VPN tüneli</li>
</ul>

<h2>Azure Türkiye Veri Merkezi</h2>
<p>Microsoft'un Türkiye veri merkezleri (Turkey North — İstanbul), yerli veri depolama zorunluluğu olan kurumlar için önemli bir seçenek sunar:</p>
<ul>
  <li>KVKK kapsamında yurt içi veri depolama gereksinimi karşılanır</li>
  <li>Düşük gecikme süresi (on-premise uygulamalarla hibrit kullanım için ideal)</li>
  <li>Kamu kurumları ve bankacılık sektörü için regülatör uyumluluğu</li>
</ul>

<h2>Azure'a Geçiş Yolculuğu</h2>
<p>On-premise'den Azure'a başarılı geçiş için izlenmesi gereken adımlar:</p>
<ul>
  <li><strong>Keşif ve Değerlendirme:</strong> Azure Migrate ile mevcut iş yüklerini analiz etme</li>
  <li><strong>Strateji Seçimi:</strong> Lift & Shift, yeniden platform veya yeniden geliştirme</li>
  <li><strong>Maliyet Optimizasyonu:</strong> Azure Pricing Calculator ile bütçe planlaması</li>
  <li><strong>Güvenlik Yapılandırması:</strong> Landing Zone tasarımı, RBAC, politikalar</li>
  <li><strong>Geçiş ve Test:</strong> Kademeli geçiş, doğrulama ve performans testi</li>
</ul>

<h2>Maliyet Yönetimi</h2>
<p>Azure'da maliyet kontrolü kritiktir. <strong>Azure Cost Management + Billing</strong> aracı ile harcamaları izleyebilir, Reserved Instances ile %72'ye kadar tasarruf edebilirsiniz.</p>

<h2>Sonuç</h2>
<p>Azure, kurumsal bulut dönüşümünün en kapsamlı platformlarından biridir. Lider Network olarak Azure altyapı tasarımı, geçiş projesi yönetimi ve süregelen optimizasyon hizmetleri sunuyoruz.</p>
    `,
  },
  {
    slug: "microsoft-entra-id-kimlik-ve-erisim-yonetimi",
    title: "Microsoft Entra ID ile Kurumsal Kimlik ve Erişim Yönetimi",
    excerpt:
      "Microsoft Entra ID (eski adıyla Azure Active Directory), kurumsal kullanıcıların bulut ve on-premise uygulamalara güvenli erişimini yöneten kimlik platformudur. SSO, MFA, Conditional Access ve Zero Trust mimarisini inceliyoruz.",
    category: "microsoft",
    categoryColor: "#00a4ef",
    tags: ["Microsoft Entra ID", "Azure AD", "SSO", "MFA", "Conditional Access", "Zero Trust", "Kimlik Yönetimi"],
    publishedAt: "2026-05-13",
    readTime: 6,
    content: `
<h2>Microsoft Entra ID Nedir?</h2>
<p>Microsoft Entra ID (Azure Active Directory'nin yeni adı), Microsoft'un bulut tabanlı kimlik ve erişim yönetimi (IAM) platformudur. Kullanıcıların Microsoft 365, Azure, Salesforce, ServiceNow ve binlerce başka uygulamaya <strong>tek oturum açmayla (SSO)</strong> güvenli erişimini sağlar.</p>

<h2>Temel Özellikler</h2>

<h3>Tek Oturum Açma (SSO)</h3>
<p>Kullanıcılar Entra ID kimlik bilgileriyle bir kez giriş yaparak tüm kurumsal uygulamalara erişir. 3.000'den fazla önceden entegre uygulama (SaaS) ile doğrudan çalışır. SAML, OAuth 2.0 ve OpenID Connect protokolleri desteklenir.</p>

<h3>Çok Faktörlü Kimlik Doğrulama (MFA)</h3>
<ul>
  <li><strong>Microsoft Authenticator:</strong> Uygulama tabanlı push bildirimi veya TOTP</li>
  <li><strong>SMS / Telefon araması:</strong> Ek doğrulama kanalları</li>
  <li><strong>FIDO2 güvenlik anahtarları:</strong> Phishing'e dayanıklı donanım kimlik doğrulama</li>
  <li><strong>Passkey (passwordless):</strong> Şifresiz kimlik doğrulama</li>
</ul>

<h3>Koşullu Erişim (Conditional Access)</h3>
<p>Koşullu Erişim, "doğru kullanıcı, doğru cihaz, doğru koşulda erişebilir" prensibini uygular:</p>
<ul>
  <li>Kullanıcı konumuna göre erişim kısıtlama (ülke/IP bazlı)</li>
  <li>Yönetilmeyen cihazlardan erişimde MFA zorunluluğu</li>
  <li>Riskli oturum açma tespitinde otomatik engelleme</li>
  <li>Uyumlu cihaz (Intune'a kayıtlı) şartı</li>
  <li>Hassas uygulamalar için güçlendirilmiş kimlik doğrulama</li>
</ul>

<h3>On-Premise Active Directory ile Hibrit Kimlik</h3>
<p>Mevcut şirket içi AD altyapısını <strong>Microsoft Entra Connect Sync</strong> ile Entra ID'ye senkronize ederek hibrit kimlik mimarisi kurulur. Bu sayede kullanıcılar şirket içi ve bulut uygulamalarına aynı kimlik bilgileriyle erişir.</p>

<h3>Privileged Identity Management (PIM)</h3>
<p>Yönetici hesaplarının ayrıcalıklı erişimini kontrol altına alır:</p>
<ul>
  <li>Just-in-Time (JIT) yönetici erişimi — kalıcı admin yetkisi yerine geçici yükseltme</li>
  <li>Tüm ayrıcalıklı işlemlerin audit log kaydı</li>
  <li>Erişim onay iş akışları</li>
</ul>

<h3>Kimlik Koruma (Identity Protection)</h3>
<p>Makine öğrenmesi ile oturum açma risklerini tespit eder:</p>
<ul>
  <li>Sızdırılmış kimlik bilgisi tespiti (leaked credentials)</li>
  <li>Anomali oturum açma davranışı</li>
  <li>Impossible travel (fiziksel olarak imkânsız konum değişimi)</li>
  <li>Riskli oturum açmalarda otomatik MFA tetikleme</li>
</ul>

<h2>Entra ID Lisans Seviyeleri</h2>
<ul>
  <li><strong>Entra ID Free:</strong> Temel SSO ve MFA — Microsoft 365 ile dahil gelir</li>
  <li><strong>Entra ID P1:</strong> Conditional Access, Hybrid Identity, Self-Service Password Reset</li>
  <li><strong>Entra ID P2:</strong> Identity Protection + PIM — tam Zero Trust için</li>
</ul>

<h2>Sonuç</h2>
<p>Microsoft Entra ID, modern kurumsal kimlik güvenliğinin temelini oluşturur. Zero Trust mimarisinin kimlik katmanını güçlendirmek için vazgeçilmez bir platformdur. Lider Network olarak Entra ID yapılandırması, AD senkronizasyonu ve Conditional Access politika tasarımında hizmetinizdeyiz.</p>
    `,
  },
  {
    slug: "microsoft-defender-365-kurumsal-guvenlik",
    title: "Microsoft Defender for 365: Kurumsal E-posta ve Uç Nokta Güvenliği",
    excerpt:
      "Microsoft Defender for Office 365, e-posta kaynaklı tehditlere karşı gelişmiş koruma sağlarken Defender for Endpoint kurumsal cihazları korur. Microsoft'un bütünleşik güvenlik ekosistemini detaylıca inceliyoruz.",
    category: "microsoft",
    categoryColor: "#00a4ef",
    tags: ["Microsoft Defender", "Office 365 Güvenlik", "EDR", "Anti-Phishing", "Safe Links", "XDR", "Microsoft 365"],
    publishedAt: "2026-05-10",
    readTime: 6,
    content: `
<h2>Microsoft Defender Ailesi</h2>
<p>Microsoft Defender, birden fazla güvenlik ürününü kapsayan geniş bir ekosistemdir. Microsoft 365 Defender (artık <strong>Microsoft Defender XDR</strong> olarak bilinir) bu ürünleri tek bir güvenlik operasyon platformunda birleştirir.</p>

<h2>Microsoft Defender for Office 365</h2>
<p>Exchange Online ve SharePoint üzerindeki tehditlere karşı gelişmiş koruma sağlar:</p>

<h3>Safe Links</h3>
<p>E-posta ve Teams mesajlarındaki URL'leri tıklama anında gerçek zamanlı analiz eder. Zararlı tespit edilirse bağlantı engellenir ve kullanıcı uyarılır. Yeniden yazılan URL'ler, daha sonra zararlıya dönen siteler için de korumalıdır.</p>

<h3>Safe Attachments</h3>
<p>E-posta eklerini kullanıcıya iletmeden önce izole bir sandbox ortamında çalıştırarak analiz eder. Sıfır gün zararlı yazılımlarını tespit eder.</p>

<h3>Anti-Phishing</h3>
<ul>
  <li>Domain sahteciliği (spoofing) tespiti ve engelleme</li>
  <li>Makine öğrenmesiyle kullanıcı taklit saldırısı (impersonation) tespiti</li>
  <li>DKIM, DMARC ve SPF doğrulaması</li>
  <li>Mailbox intelligence ile anormal gönderim davranışı tespiti</li>
</ul>

<h3>Attack Simulator</h3>
<p>Gerçek phishing saldırısı simülasyonu yaparak kullanıcıların farkındalık seviyesini ölçer ve eğitim içerikleri sunar.</p>

<h2>Microsoft Defender for Endpoint</h2>
<p>Kurumsal cihazlara (Windows, macOS, Linux, Android, iOS) yönelik EDR ve XDR platformudur:</p>
<ul>
  <li><strong>Threat & Vulnerability Management:</strong> Cihaz güvenlik açıklarını öncelik sıralamasıyla tespit</li>
  <li><strong>Attack Surface Reduction (ASR):</strong> Kötüye kullanım vektörlerini kapatma kuralları</li>
  <li><strong>Next-Gen Antivirus:</strong> Davranış tabanlı ve AI destekli zararlı yazılım tespiti</li>
  <li><strong>EDR:</strong> Saldırı zincirini geriye dönük analiz, threat hunting</li>
  <li><strong>Automated Investigation & Response (AIR):</strong> Olaylara otomatik müdahale</li>
  <li><strong>Microsoft Secure Score:</strong> Güvenlik duruşunuzu puanlayan ölçüm sistemi</li>
</ul>

<h2>Microsoft Defender XDR — Bütünleşik Görünürlük</h2>
<p>Defender XDR portalı, e-posta, kimlik, cihaz ve bulut uygulaması sinyallerini tek platformda birleştirir:</p>
<ul>
  <li>Çapraz platform olay korelasyonu</li>
  <li>Otomatik saldırı hikâyesi oluşturma</li>
  <li>Microsoft Sentinel ile SIEM entegrasyonu</li>
  <li>Tehdit avcılığı (Advanced Hunting) — KQL sorgu dili</li>
</ul>

<h2>Plan Seçimi</h2>
<ul>
  <li><strong>Defender for Office 365 Plan 1:</strong> Safe Links, Safe Attachments, Anti-Phishing</li>
  <li><strong>Defender for Office 365 Plan 2:</strong> Plan 1 + Threat Explorer, AIR, Attack Simulator</li>
  <li><strong>Microsoft 365 E5:</strong> Tüm Defender ürünleri dahil (Office 365, Endpoint, Identity, Cloud Apps)</li>
</ul>

<h2>Sonuç</h2>
<p>Microsoft Defender ekosistemi, özellikle Microsoft 365 kullanan kurumlar için e-posta, kimlik ve cihaz güvenliğini bütünleşik biçimde sağlar. Lider Network olarak Defender yapılandırması, politika tasarımı ve güvenlik duruşu iyileştirme projelerinde hizmetinizdeyiz.</p>
    `,
  },
  {
    slug: "azure-site-recovery-felaket-kurtarma-dr",
    title: "Azure Site Recovery ile Kurumsal Felaket Kurtarma (DR) Planlaması",
    excerpt:
      "Azure Site Recovery (ASR), on-premise sunucuları ve Azure VM'leri Azure'a ya da farklı bir Azure bölgesine çoğaltarak kurumsal felaket kurtarma altyapısını uygun maliyetle hayata geçirir. DR tasarımını ve ASR'yi detaylıca inceliyoruz.",
    category: "microsoft",
    categoryColor: "#00a4ef",
    tags: ["Azure Site Recovery", "Felaket Kurtarma", "DR", "RTO", "RPO", "Azure", "İş Sürekliliği"],
    publishedAt: "2026-05-07",
    readTime: 6,
    content: `
<h2>Felaket Kurtarma (DR) Neden Kritik?</h2>
<p>Doğal afetler, siber saldırılar veya donanım arızaları kritik iş sistemlerini çalışamaz hale getirebilir. Felaket kurtarma planı olmayan kurumlar saatlerce hatta günlerce veri ve itibar kaybı yaşar. Araştırmalar, DR planı olmayan küçük işletmelerin %60'ının felaket sonrası 6 ay içinde kapandığını göstermektedir.</p>

<h2>Azure Site Recovery (ASR) Nedir?</h2>
<p>Azure Site Recovery, şirket içi sanal makineler ve fiziksel sunucuları Azure'a (ya da ikincil bir Azure bölgesine) çoğaltarak felaket anında hızla devreye girilmesini sağlayan bir DRaaS (Disaster Recovery as a Service) çözümüdür.</p>

<h2>ASR'nin Desteklediği Senaryolar</h2>
<ul>
  <li><strong>VMware vSphere → Azure:</strong> VMware sanal makinelerini Azure'a çoğaltma</li>
  <li><strong>Hyper-V → Azure:</strong> Microsoft Hyper-V VM'lerini Azure'a çoğaltma</li>
  <li><strong>Fiziksel Sunucu → Azure:</strong> Bare-metal Windows/Linux sunucuları Azure'a alma</li>
  <li><strong>Azure VM → Azure (bölgeler arası):</strong> Birincil bölgeden ikincil bölgeye DR</li>
</ul>

<h2>Temel Kavramlar</h2>

<h3>RPO ve RTO</h3>
<ul>
  <li><strong>RPO (Recovery Point Objective):</strong> Kabul edilebilir maksimum veri kaybı süresi. ASR ile VMware için <strong>RPO 30 saniyeye</strong> kadar düşürülebilir.</li>
  <li><strong>RTO (Recovery Time Objective):</strong> Sistemlerin ne kadar sürede ayağa kalkması gerektiği. ASR ile planlı testlerde RTO birkaç dakikadır.</li>
</ul>

<h3>Replikasyon ve Failover</h3>
<p>ASR, kaynak sistemleri sürekli olarak Azure'daki kurtarma kasasına (Recovery Services Vault) çoğaltır. Felaket anında tek tıkla <strong>Unplanned Failover</strong> başlatılır. Testler için üretimi etkilemeyen <strong>Test Failover</strong> özelliği kullanılır.</p>

<h2>Recovery Plan ile Orchestrasyon</h2>
<p>ASR'nin Recovery Plan özelliği, birden fazla sanal makineyi belirli sıra ve koşullarla ayağa kaldırır:</p>
<ul>
  <li>Önce veritabanı sunucusu → sonra uygulama sunucusu → sonra web sunucusu</li>
  <li>Her adım arasında özel script veya Azure Automation Runbook çalıştırma</li>
  <li>Otomatik test senaryoları ile periyodik DR tatbikatı</li>
</ul>

<h2>Maliyet Avantajı</h2>
<p>Geleneksel DR altyapısı (ikincil veri merkezi + donanım + lisans) ciddi sabit maliyet gerektirir. ASR ile:</p>
<ul>
  <li>Azure'da çoğaltılan VM'ler için yalnızca depolama maliyeti ödenir</li>
  <li>VM'ler yalnızca failover sırasında işlem maliyeti oluşturur</li>
  <li>DR tatbikatı sırasında da yalnızca test süresi kadar ücretlendirilir</li>
</ul>

<h2>ASR + Azure Backup Kombinasyonu</h2>
<p>ASR, sistemi korurken Azure Backup veri düzeyinde koruma sağlar. Bu iki çözümü birlikte kullanmak kapsamlı bir iş sürekliliği stratejisi oluşturur:</p>
<ul>
  <li><strong>ASR:</strong> Çalışan sistemlerin Azure'a failover'ı (DR senaryosu)</li>
  <li><strong>Azure Backup:</strong> Dosya, VM ve veritabanı düzeyinde yedekleme (veri kurtarma)</li>
</ul>

<h2>Sonuç</h2>
<p>Azure Site Recovery, kurumsal felaket kurtarma altyapısını on-premise'in çok altında maliyetle gerçekleştirmenin en etkili yollarından biridir. Lider Network olarak ASR tasarımı, kurulumu, DR planı geliştirme ve periyodik tatbikat hizmetlerinde yanınızdayız.</p>
    `,
  },
  {
    slug: "microsoft-intune-kurumsal-cihaz-yonetimi",
    title: "Microsoft Intune ile Kurumsal Cihaz ve Uygulama Yönetimi (MDM/MAM)",
    excerpt:
      "Microsoft Intune, şirkete ait ve çalışanlara ait (BYOD) cihazları merkezi olarak yöneten, uygulama politikalarını uygulayan bulut tabanlı MDM/MAM platformudur. Mobil iş gücünüzü nasıl güvenle yönetirsiniz?",
    category: "microsoft",
    categoryColor: "#00a4ef",
    tags: ["Microsoft Intune", "MDM", "MAM", "BYOD", "Cihaz Yönetimi", "Microsoft 365", "Endpoint Manager"],
    publishedAt: "2026-05-03",
    readTime: 5,
    content: `
<h2>Microsoft Intune Nedir?</h2>
<p>Microsoft Intune, Microsoft Endpoint Manager platformunun cihaz ve uygulama yönetimi bileşenidir. Windows, macOS, iOS, Android ve Linux cihazlarını merkezi olarak yönetir. Şirkete ait cihazları (MDM) ve çalışanların kişisel cihazlarındaki kurumsal verileri (MAM) ayrı politikalarla yönetebilir.</p>

<h2>MDM — Mobile Device Management</h2>
<p>MDM ile şirkete ait cihazlar üzerinde tam kontrol sağlanır:</p>
<ul>
  <li><strong>Cihaz kaydı:</strong> Windows Autopilot, Apple DEP ve Android Zero-Touch ile sıfır dokunuşla kayıt</li>
  <li><strong>Konfigürasyon profilleri:</strong> Wi-Fi, VPN, e-posta ve sertifika ayarlarını otomatik uygulama</li>
  <li><strong>Uyumluluk politikaları:</strong> Minimum OS versiyonu, şifreleme, disk şifrelemesi zorunlu kılma</li>
  <li><strong>Uygulama dağıtımı:</strong> Uygulama mağazasından veya kurumsal paketten otomatik kurulum</li>
  <li><strong>Uzaktan silme:</strong> Kayıp veya çalınan cihazı uzaktan tamamen temizleme</li>
</ul>

<h2>MAM — Mobile Application Management</h2>
<p>MAM, çalışanların kişisel cihazlarındaki (BYOD) yalnızca kurumsal verileri yönetir — kişisel verilere dokunmaz:</p>
<ul>
  <li>Outlook, Teams, OneDrive gibi kurumsal uygulamalara PIN zorunluluğu</li>
  <li>Kurumsal verinin kişisel uygulamalara kopyalanmasının engellenmesi</li>
  <li>İş çıkışında yalnızca kurumsal verilerin silinmesi (kişisel veriler korunur)</li>
  <li>Yönetilmeyen tarayıcıya veri yapıştırma kısıtlaması</li>
</ul>

<h2>Windows Autopilot ile Sıfır Dokunuşlu Dağıtım</h2>
<p>Intune + Windows Autopilot kombinasyonu, yeni bir bilgisayarın IT departmanına uğramadan doğrudan kullanıcıya ulaşmasını sağlar:</p>
<ul>
  <li>Kullanıcı bilgisayarı açar, kurumsal hesabıyla oturum açar</li>
  <li>Intune tüm yazılımları, politikaları ve ayarları otomatik uygular</li>
  <li>IT personeli müdahalesi gerekmez — ciddi operasyon tasarrufu</li>
</ul>

<h2>Defender for Endpoint ile Entegrasyon</h2>
<p>Intune, Microsoft Defender for Endpoint ile derin entegrasyon sunar:</p>
<ul>
  <li>Yönetilen cihazların güvenlik duruşunu Defender'dan alarak uyumluluk değerlendirmesine yansıtma</li>
  <li>Yüksek riskli cihazlara Conditional Access ile erişim kısıtlama</li>
  <li>Zararlı yazılım tespitinde otomatik karantina aksiyonu</li>
</ul>

<h2>Lisanslama</h2>
<p>Microsoft Intune, <strong>Microsoft 365 Business Premium</strong> ve <strong>Microsoft 365 E3/E5</strong> planlarına dahildir. Ayrıca <strong>Microsoft Intune Plan 1</strong> ve <strong>Plan 2</strong> olarak ayrı abonelik alınabilir.</p>

<h2>Sonuç</h2>
<p>Microsoft Intune, uzaktan ve hibrit çalışan ekiplerinin güvenli ve yönetilebilir olmasını sağlayan kritik bir platformdur. Lider Network olarak Intune yapılandırması, Autopilot kurulumu ve MDM politika tasarımında hizmetinizdeyiz.</p>
    `,
  },


  // ─── VEEAM ────────────────────────────────────────────────────────────────
  {
    slug: "veeam-backup-replication-nedir-kurumsal-yedekleme",
    title: "Veeam Backup & Replication Nedir? Kurumsal Yedekleme Rehberi",
    excerpt:
      "Veeam Backup & Replication, sanal, fiziksel ve bulut ortamlarını tek platformdan yedekleyen sektörün önde gelen çözümüdür. RPO/RTO hedeflerinize nasıl ulaşacağınızı detaylıca anlatıyoruz.",
    category: "veeam",
    categoryColor: "#00b336",
    tags: ["Veeam", "Backup", "Replication", "Disaster Recovery", "Yedekleme"],
    publishedAt: "2026-05-10",
    readTime: 7,
    content: `
<h2>Veeam Backup & Replication Nedir?</h2>
<p>Veeam Backup & Replication, Veeam Software tarafından geliştirilen ve <strong>sanal, fiziksel ve bulut tabanlı</strong> iş yüklerini kapsamlı biçimde koruyan kurumsal yedekleme platformudur. VMware vSphere, Microsoft Hyper-V, Nutanix AHV ve AWS/Azure/GCP gibi ortamları tek konsoldan yönetebilirsiniz.</p>
<p>Gartner Magic Quadrant'ta yıllardır "Lider" konumunda yer alan Veeam, dünya genelinde 450.000'den fazla müşteriye hizmet vermektedir.</p>

<h2>Temel Kavramlar: RPO ve RTO</h2>
<p>Bir yedekleme stratejisi oluştururken iki kritik metrik belirler:</p>
<ul>
  <li><strong>RPO (Recovery Point Objective):</strong> Bir felaket anında kabul edebileceğiniz maksimum veri kaybı süresi. Örneğin RPO = 1 saat ise, en fazla 1 saatlik veri kaybına toleransınız var demektir.</li>
  <li><strong>RTO (Recovery Time Objective):</strong> Sistemlerin ne kadar sürede ayağa kalkması gerektiği. RTO = 4 saat ise, kesintiden sonra 4 saat içinde hizmet devam etmelidir.</li>
</ul>
<p>Veeam'in <strong>Instant VM Recovery</strong> özelliği, yedek deposundan doğrudan sanal makineyi çalıştırarak RTO'yu dakikaların altına indirir.</p>

<h2>Veeam'in Öne Çıkan Özellikleri</h2>
<ul>
  <li><strong>Agentless Backup:</strong> VMware ve Hyper-V ortamlarında VM içine agent kurmadan yedekleme yapılır; performans etkisi minimum düzeydedir.</li>
  <li><strong>Changed Block Tracking (CBT):</strong> Sadece değişen bloğu yedekleyerek yedekleme penceresi ve depolama alanı büyük ölçüde azalır.</li>
  <li><strong>Instant VM Recovery:</strong> Bir VM arızalanınca yedek doğrudan çalıştırılır; üretim ortamı dakikalar içinde devreye girer.</li>
  <li><strong>SureBackup:</strong> Yedeklerin geri yüklenebilirliğini otomatik olarak doğrular; insan müdahalesi gerektirmez.</li>
  <li><strong>Scale-Out Backup Repository (SOBR):</strong> Birden fazla depolama hedefini (disk, tape, object storage) tek havuzda birleştiren mimari.</li>
  <li><strong>Veeam Cloud Connect:</strong> İnternet üzerinden güvenli offsite yedekleme ve DRaaS imkânı sunar.</li>
</ul>

<h2>Mimari Bileşenler</h2>
<p>Veeam kurulumu üç temel bileşenden oluşur:</p>
<ul>
  <li><strong>Veeam Backup Server:</strong> Tüm yedekleme işlerini orkestre eden merkezi sunucu. Windows Server üzerinde çalışır.</li>
  <li><strong>Backup Repository:</strong> Yedek verilerinin saklandığı depolama hedefi. Windows/Linux sunucu, NAS, S3 veya tape olabilir.</li>
  <li><strong>Proxy Server:</strong> Yedekleme verisini kaynak ile repository arasında taşıyan iş yükü sunucusu. Performansa göre çoğaltılabilir.</li>
</ul>

<h2>3-2-1-1-0 Kuralı</h2>
<p>Veeam, günümüzde yaygın kabul gören <strong>3-2-1-1-0 yedekleme kuralını</strong> destekler:</p>
<ul>
  <li><strong>3</strong> kopya veri (1 üretim + 2 yedek)</li>
  <li><strong>2</strong> farklı medya türü (örn. disk ve object storage)</li>
  <li><strong>1</strong> kopya offsite (farklı lokasyon veya bulut)</li>
  <li><strong>1</strong> kopya air-gapped veya değiştirilemez (immutable)</li>
  <li><strong>0</strong> hata — SureBackup ile doğrulanmış geri yüklenebilirlik</li>
</ul>

<h2>Lisanslama Modeli</h2>
<p>Veeam, 2023 itibarıyla abonelik bazlı lisanslama modeline geçmiştir:</p>
<ul>
  <li><strong>Veeam Data Platform Foundation:</strong> Temel yedekleme ve kurtarma; KOBİ'ler için ideal başlangıç noktası.</li>
  <li><strong>Veeam Data Platform Advanced:</strong> SOBR, Veeam ONE izleme ve gelişmiş raporlama eklenir.</li>
  <li><strong>Veeam Data Platform Premium:</strong> Siber dayanıklılık, otomatik IR planları ve SIEM entegrasyonu dahil.</li>
</ul>
<p>Lisanslama, korunan iş yükü başına (workload/socket) veya kapasiteye (TB) göre yapılır.</p>

<h2>Sonuç</h2>
<p>Veeam Backup & Replication, modern veri koruma ihtiyaçlarını karşılayan olgunlaşmış bir platformdur. Doğru boyutlandırma ve mimari tasarım, yatırımınızın verimliliğini doğrudan belirler. Lider Network olarak Veeam lisanslama, kurulum ve yapılandırma süreçlerinin tamamında yanınızdayız.</p>
    `,
  },
  {
    slug: "veeam-vmware-vsphere-yedekleme-en-iyi-uygulamalar",
    title: "Veeam ile VMware vSphere Yedekleme: En İyi Uygulamalar",
    excerpt:
      "VMware ortamlarında Veeam ile etkin yedekleme stratejisi kurmak için proxy boyutlandırma, CBT kullanımı, SOBR yapılandırması ve SureBackup otomasyonu konularında kapsamlı rehber.",
    category: "veeam",
    categoryColor: "#00b336",
    tags: ["Veeam", "VMware", "vSphere", "Proxy", "SOBR", "SureBackup"],
    publishedAt: "2026-05-08",
    readTime: 8,
    content: `
<h2>VMware + Veeam: Neden İdeal Bir İkili?</h2>
<p>VMware vSphere ortamları, Veeam'in agent gerektirmeden çalışan mimarisinden en çok fayda sağlayan platformdur. vSphere API (VADP) üzerinden gerçekleştirilen yedeklemeler, üretim VM'lerine yük bindirmeden anlık görüntü (snapshot) tabanlı veri kopyası alır.</p>

<h2>Veeam Proxy Boyutlandırması</h2>
<p>Proxy sunucusu, veri transferinin gerçekleştiği bileşendir. Doğru boyutlandırılmamış bir proxy, yedekleme pencerelerinin uzamasına yol açar.</p>
<ul>
  <li><strong>Hot-Add (Virtual Proxy):</strong> Proxy, yedeklenecek VM ile aynı ESXi host veya datastore üzerindeyse storage I/O üzerinden veri çeker. Düşük ağ yükü sağlar.</li>
  <li><strong>Network Mode:</strong> Proxy ile veri deposu ağ üzerinden bağlantılıdır. 10 GbE altyapısı zorunludur.</li>
  <li><strong>Direct SAN Access:</strong> FC veya iSCSI SAN ortamlarında en yüksek performansı sağlar; proxy doğrudan storage'a erişir.</li>
</ul>
<p><strong>Kural:</strong> Her 5–10 eşzamanlı yedekleme işi için 1 proxy. Her proxy'ye minimum 4 vCPU ve 8 GB RAM atayın.</p>

<h2>Changed Block Tracking (CBT) Yönetimi</h2>
<p>CBT, VMware'in sadece değişen disk bloğunu takip eden mekanizmasıdır. Veeam, incremental yedeklemelerde CBT verilerini kullanarak transfer edilen veri miktarını %90'a kadar düşürebilir.</p>
<p><strong>Önemli uyarılar:</strong></p>
<ul>
  <li>CBT bozulması durumunda Veeam otomatik olarak aktif tam yedekleme (active full) başlatır.</li>
  <li>VMware depolama vMotion veya snapshot konsolidasyonu sonrası CBT sıfırlanabilir.</li>
  <li>Periyodik tam yedekleme (haftalık veya aylık) CBT tutarsızlıklarının önüne geçer.</li>
</ul>

<h2>Scale-Out Backup Repository (SOBR) Yapılandırması</h2>
<p>SOBR, birden fazla depolama hedefini tek sanal havuzda toplar. Tipik yapılandırma:</p>
<ul>
  <li><strong>Performance Tier:</strong> Hızlı erişim için lokal disk (NAS veya DAS). Son yedekler burada tutulur.</li>
  <li><strong>Capacity Tier:</strong> S3-uyumlu object storage (AWS S3, Synology C2, MinIO). Arşiv ve uzun süreli saklama için maliyet avantajı sağlar.</li>
  <li><strong>Archive Tier:</strong> Soğuk depolama (AWS Glacier, Azure Archive). Yıllık saklama için uygundur.</li>
</ul>

<h2>SureBackup ile Otomatik Doğrulama</h2>
<p>SureBackup, yedeklenen VM'leri izole edilmiş sanal bir laboratuvarda (Virtual Lab) çalıştırarak geri yüklenebilirliği test eder. Testler şunları içerir:</p>
<ul>
  <li>VM heartbeat ve güç durumu kontrolü</li>
  <li>Özelleştirilebilir uygulama testleri (ping, web, SQL sorgulama)</li>
  <li>Otomatik rapor ve bildirim</li>
</ul>
<p>SureBackup sayesinde bir felaket anında "yedeklerim çalışıyor mu?" sorusu yanıtsız kalmaz; haftalık otomatik test bunu garanti altına alır.</p>

<h2>Yedekleme Penceresi Optimizasyonu</h2>
<ul>
  <li>Yedekleme işlerini ağ yoğunluğunun düşük olduğu saatlere (gece 22:00–06:00) zamanlayın.</li>
  <li>Paralel işlem sayısını (simultaneous job) proxy kapasitesiyle orantılı tutun.</li>
  <li>Büyük VM'leri küçük VM'lerden ayrı job'lara koyun; öncelik sıralaması belirleyin.</li>
  <li>Deduplication ve compression ayarlarını depolama türüne göre seçin (disk için "Optimal", tape için "High").</li>
</ul>

<h2>Sonuç</h2>
<p>VMware vSphere ortamlarında Veeam'i doğru mimari ve en iyi uygulamalarla kurmak, hem RPO/RTO hedeflerini karşılar hem de altyapı kaynaklarının verimli kullanılmasını sağlar. Lider Network, Veeam tasarım, kurulum ve optimizasyon süreçlerinde deneyimli mühendis kadrosuyla hizmetinizdedir.</p>
    `,
  },
  {
    slug: "veeam-immutable-backup-ransomware-koruması",
    title: "Veeam ile Immutable Backup: Ransomware'e Karşı Son Savunma Hattı",
    excerpt:
      "Fidye yazılımı saldırılarına karşı en etkili koruma, değiştirilemez (immutable) yedeklerdir. Veeam'in hardened repository, S3 Object Lock ve air-gap çözümleriyle verilerinizi nasıl koruduğunu anlatıyoruz.",
    category: "veeam",
    categoryColor: "#00b336",
    tags: ["Veeam", "Immutable Backup", "Ransomware", "Object Lock", "Air-Gap"],
    publishedAt: "2026-05-06",
    readTime: 6,
    content: `
<h2>Ransomware ve Yedekleme Sistemleri</h2>
<p>Modern ransomware saldırıları artık yedekleme sistemlerini de hedef almaktadır. Saldırganlar ağa sızdıktan sonra <strong>aylar boyunca sessizce kalabilir</strong> ve asıl saldırıdan önce yedekleri silmeye veya şifrelemeye çalışır. Bu durum, geleneksel yedekleme yaklaşımlarını yetersiz kılmaktadır.</p>
<p>Çözüm: <strong>İmmutability (Değiştirilemezlik)</strong> — bir kez yazılan verinin belirli bir süre boyunca hiçbir şekilde değiştirilememesi veya silinememesi.</p>

<h2>Veeam Hardened Repository (Linux)</h2>
<p>Veeam'in en güçlü immutability çözümlerinden biri, Linux tabanlı <strong>Hardened Repository</strong>'dir:</p>
<ul>
  <li>Yedek dosyaları, Linux'un <code>chattr +i</code> (immutable flag) özelliğiyle kilitlenir.</li>
  <li>Veeam Backup Server dahil hiçbir sistem bu dosyaları tanımlanmış süre dolmadan silemez veya değiştiremez.</li>
  <li>SSH port erişimi devre dışı bırakılır; sunucu yalnızca Veeam protokolüyle iletişim kurar.</li>
  <li>Minimum donanım gereksinimi: ayrı bir Linux sunucu (Veeam Backup Server ile aynı makinede çalışmamalıdır).</li>
</ul>

<h2>S3 Object Lock ile Bulut Immutability</h2>
<p>SOBR Capacity Tier olarak kullanılan S3-uyumlu object storage, <strong>Object Lock</strong> özelliğiyle immutability sağlar:</p>
<ul>
  <li><strong>Compliance Mode:</strong> Hiçbir kullanıcı (root dahil) kilitli nesneyi süre dolmadan silemez. Regülasyon uyumu için kullanılır.</li>
  <li><strong>Governance Mode:</strong> Özel izne sahip yöneticiler kilidi kaldırabilir. Daha esnek yönetim sunar.</li>
  <li>AWS S3, Wasabi, Backblaze B2 ve Synology C2 Object Storage bu özelliği destekler.</li>
</ul>

<h2>Air-Gap: Fiziksel İzolasyon</h2>
<p>En güçlü koruma, yedek medyanın ağdan tamamen fiziksel olarak izole edilmesidir:</p>
<ul>
  <li><strong>Tape Yedekleme:</strong> Yedek bantları kasaya kaldırıldığında gerçek bir air-gap oluşur. Veeam, tape library entegrasyonunu destekler.</li>
  <li><strong>Veeam Cloud Connect:</strong> Servis sağlayıcı bünyesindeki izole havuzlara yedek gönderme; üretim ağıyla doğrudan bağlantısı yoktur.</li>
  <li><strong>Rotasyonlu Medya:</strong> Farklı lokasyonlara taşınan disk veya NAS cihazları periyodik olarak değiştirilir.</li>
</ul>

<h2>4-3-2 Siber Dayanıklılık Stratejisi</h2>
<p>Veeam'in önerdiği gelişmiş strateji:</p>
<ul>
  <li><strong>4</strong> yedek kopyası</li>
  <li><strong>3</strong> farklı medya (disk + object storage + tape)</li>
  <li><strong>2</strong> kopya offsite; en az 1'i immutable, 1'i air-gapped</li>
</ul>

<h2>Veeam Threat Center</h2>
<p>Veeam Data Platform Premium lisanslarda gelen <strong>Veeam Threat Center</strong>, yedekleme verisini tarayarak şüpheli şifrelenmiş dosya varlığını tespit eder. Böylece temiz bir kurtarma noktası seçmenize yardımcı olur ve ransomware'i temiz yedekle geri döndürme riskini ortadan kaldırır.</p>

<h2>Sonuç</h2>
<p>Ransomware tehdidine karşı immutable yedek, güvenlik stratejinizin vazgeçilmez bir parçasıdır. Lider Network olarak Veeam Hardened Repository tasarımı, S3 Object Lock yapılandırması ve kapsamlı DR planlaması konularında ücretsiz analiz sunuyoruz.</p>
    `,
  },
  {
    slug: "veeam-one-izleme-raporlama-kapasite-planlama",
    title: "Veeam ONE ile Yedekleme Ortamı İzleme ve Kapasite Planlama",
    excerpt:
      "Veeam ONE, yedekleme altyapınızı gerçek zamanlı izler, anormallikleri tespit eder ve gelecekteki kapasite ihtiyacınızı tahmin eder. Alarm, rapor ve dashboard özelliklerini inceliyoruz.",
    category: "veeam",
    categoryColor: "#00b336",
    tags: ["Veeam ONE", "Monitoring", "Kapasite Planlama", "Raporlama", "Alarm"],
    publishedAt: "2026-05-04",
    readTime: 5,
    content: `
<h2>Veeam ONE Nedir?</h2>
<p>Veeam ONE, Veeam Data Platform'un izleme ve raporlama bileşenidir. Hem <strong>sanal altyapıyı</strong> (VMware, Hyper-V) hem de <strong>Veeam yedekleme ortamını</strong> tek konsoldan izleyerek proaktif yönetim imkânı sunar.</p>
<p>Veeam Data Platform Advanced ve Premium lisanslara dahildir; ayrıca bağımsız lisans olarak da edinilebilir.</p>

<h2>Gerçek Zamanlı İzleme ve Alarm</h2>
<p>Veeam ONE, 200'den fazla önceden tanımlı alarm içerir:</p>
<ul>
  <li><strong>Yedekleme Alarmları:</strong> İş başarısızlıkları, uyarılar, uzayan yedekleme pencereleri, repository doluluk eşiği</li>
  <li><strong>VM Alarmları:</strong> CPU/RAM darboğazı, disk gecikmesi (latency), snapshot birikimi</li>
  <li><strong>Güvenlik Alarmları:</strong> Alışılmadık veri değişim oranı (ransomware şüphesi), yedek dosyalarına yetkisiz erişim girişimi</li>
</ul>
<p>Alarmlar e-posta, SNMP trap veya REST API aracılığıyla ITSM sistemlerine (ServiceNow, Jira) yönlendirilebilir.</p>

<h2>Dashboard ve Raporlar</h2>
<p>Veeam ONE'ın hazır raporları yöneticilere ve üst yönetime farklı seviyelerde görünürlük sağlar:</p>
<ul>
  <li><strong>Executive Summary:</strong> Yedekleme başarı oranı, korunan VM sayısı, SLA uyumu — haftalık üst yönetim raporu için idealdir.</li>
  <li><strong>Job Session Report:</strong> Hangi işlerin ne zaman, ne kadar sürede, hangi sonuçla tamamlandığını gösterir.</li>
  <li><strong>VM Change Rate:</strong> Günlük veri değişim hızı; incremental yedek boyutunu öngörmek için kullanılır.</li>
  <li><strong>Protected/Unprotected VMs:</strong> Yedeklenmeyen VM'leri tespit eder; kapsam boşluklarını kapatır.</li>
</ul>

<h2>Kapasite Planlama</h2>
<p>Veeam ONE'ın <strong>Capacity Planning</strong> özelliği, mevcut büyüme trendini analiz ederek gelecekteki depolama ve işlem gücü ihtiyacını tahmin eder:</p>
<ul>
  <li>Repository doluluk tarihini gün bazında öngörür; zamanında depolama kapasitesi artırımı planlanmasını sağlar.</li>
  <li>VM sayısındaki artışa göre proxy sunucu gereksinimini hesaplar.</li>
  <li>"What-if" senaryolarıyla yeni iş yüklerinin etkisini simüle eder.</li>
</ul>

<h2>Chargeback ve Maliyet Görünürlüğü</h2>
<p>Birden fazla departmanı veya müşteriyi aynı Veeam ortamıyla yedekleyen organizasyonlar için <strong>Chargeback</strong> raporları, tüketilen yedek kaynağını bölüm veya VM başına raporlar. Bu sayede IT maliyetleri iç muhasebede bölüm bazına dağıtılabilir.</p>

<h2>Sonuç</h2>
<p>Veeam ONE, reaktif sorun giderme yerine proaktif yönetim anlayışını mümkün kılar. Lider Network olarak Veeam ONE kurulumu, alarm yapılandırması ve kapasite planlama danışmanlığında hizmetinizdeyiz.</p>
    `,
  },

  // ─── VMWARE & BROADCOM ────────────────────────────────────────────────────
  {
    slug: "broadcom-vmware-satin-alma-sonrasi-ne-degisti",
    title: "Broadcom VMware'i Satın Aldıktan Sonra Ne Değişti?",
    excerpt:
      "Broadcom'un 2023 sonunda VMware'i satın almasıyla lisanslama, ürün portföyü ve destek politikaları köklü biçimde değişti. Bu değişikliklerin kurumunuzu nasıl etkileyeceğini ve alternatif seçenekleri detaylandırıyoruz.",
    category: "vmware",
    categoryColor: "#1d428a",
    tags: ["VMware", "Broadcom", "Lisanslama", "vSphere", "Perpetual License"],
    publishedAt: "2026-05-09",
    readTime: 8,
    content: `
<h2>Tarihin En Büyük Yazılım Satın Almalarından Biri</h2>
<p>Broadcom, Kasım 2023'te yaklaşık <strong>69 milyar dolar</strong> ödeyerek VMware'i satın aldı. Bu işlem, yazılım sektörünün tarihindeki en büyük birleşmelerden biri olarak kayıtlara geçti. Ancak ardından gelen lisanslama ve ürün değişiklikleri kurumsal müşteriler arasında büyük endişe yarattı.</p>

<h2>Kalıcı Lisansların Sonu</h2>
<p>Broadcom, satın alma sonrasında VMware'in <strong>perpetual (kalıcı) lisans modelini tamamen kaldırdı.</strong> Artık yalnızca abonelik tabanlı lisanslama geçerlidir:</p>
<ul>
  <li>ESXi, vCenter, vSAN, NSX gibi ürünlerin kalıcı lisansları satıştan kaldırıldı.</li>
  <li>Mevcut kalıcı lisans sahiplerinin destek anlaşmaları sonlandığında aboneliğe geçmeleri bekleniyor.</li>
  <li>Yeni VMware Cloud Foundation (VCF) ve VMware vSphere Foundation (VVF) paketleri, ürün lisanslarını zorunlu olarak birleştirir; ihtiyaç duyulmayan bileşenlerin ayrı alınması artık mümkün değildir.</li>
</ul>

<h2>Yeni Paketler: VCF ve VVF</h2>
<p><strong>VMware Cloud Foundation (VCF):</strong> vSphere, vSAN, NSX ve Aria (eski vRealize) bileşenlerini kapsayan üst seviye paket. Hyper-converged altyapı kurmak isteyen büyük kuruluşlar için tasarlanmıştır.</p>
<p><strong>VMware vSphere Foundation (VVF):</strong> vSphere + vCenter + Aria Ops for Networks içerir. Daha küçük ölçekli veya yalnızca sanallaştırma altyapısı kurmak isteyen kuruluşlar için sunulmuştur.</p>
<p>Her iki pakette de lisanslama <strong>çekirdek (core) başına</strong> yapılmaktadır; minimum 16 çekirdek zorunludur.</p>

<h2>Fiyat Artışları ve Müşteri Tepkisi</h2>
<p>Birçok kurum, yeni lisanslama modeliyle mevcut altyapı maliyetlerinin <strong>3 ila 5 kat artacağını</strong> raporladı. Bu durum kurumsal müşterileri alternatif platformlara yönelmeye itti:</p>
<ul>
  <li><strong>Microsoft Hyper-V / Azure Stack HCI:</strong> Özellikle Microsoft lisansı zaten olan kurumlar için cazip seçenek.</li>
  <li><strong>Nutanix AHV:</strong> Hyper-converged altyapı arayanlar için VMware VCF'ye güçlü alternatif.</li>
  <li><strong>Proxmox VE:</strong> Açık kaynak, KVM tabanlı; lisanssız veya düşük maliyetli destek seçenekleri mevcut.</li>
  <li><strong>Red Hat OpenShift Virtualization:</strong> Kubernetes tabanlı VM yönetimi; bulut-yerel dönüşümü hedefleyen kuruluşlar için.</li>
</ul>

<h2>Partner Programında Değişiklikler</h2>
<p>Broadcom, VMware partner ekosistemini de köklü biçimde yeniden yapılandırdı:</p>
<ul>
  <li>Binlerce VMware iş ortağı programdan çıkarıldı; yalnızca "seçilmiş" partnerler yeni programda yer aldı.</li>
  <li>Distribütör kanalı daraltıldı; doğrudan Broadcom üzerinden satın alma zorunlu hale geldi.</li>
  <li>Teknik destek kanalları merkezileştirildi; yerel partner desteği azaldı.</li>
</ul>

<h2>Kurumunuz Nasıl Etkilenecek?</h2>
<p>Mevcut VMware altyapınızın durumu için şu soruları yanıtlamanız gerekir:</p>
<ul>
  <li>Hangi VMware ürünleri aktif olarak kullanılıyor ve destek sözleşmesi ne zaman bitiyor?</li>
  <li>Yeni VCF/VVF fiyatlandırmasıyla toplam sahip olma maliyeti (TCO) nasıl değişiyor?</li>
  <li>Mevcut iş yüklerini başka bir platforma taşıma (migration) maliyeti ve riski nedir?</li>
  <li>Hibrit bir yaklaşım (bazı iş yükleri VMware, diğerleri alternatif) mümkün mü?</li>
</ul>

<h2>Sonuç</h2>
<p>Broadcom'un VMware üzerindeki değişiklikleri, kurumsal IT bütçelerini ve strateji planlarını derinden etkiliyor. Lider Network olarak VMware lisans analizi, maliyet karşılaştırması ve migration planlaması konularında ücretsiz danışmanlık hizmeti sunuyoruz.</p>
    `,
  },
  {
    slug: "vmware-vsphere-8-yeni-ozellikler-ve-yukseltme-rehberi",
    title: "VMware vSphere 8: Yeni Özellikler ve Yükseltme Rehberi",
    excerpt:
      "vSphere 8, DPU desteği, geliştirilmiş vMotion, yeni vCenter arayüzü ve Kubernetes entegrasyonuyla önemli yenilikler getirdi. Yükseltme öncesi bilmeniz gerekenler bu rehberde.",
    category: "vmware",
    categoryColor: "#1d428a",
    tags: ["vSphere 8", "ESXi", "vCenter", "DPU", "Kubernetes", "vMotion"],
    publishedAt: "2026-05-07",
    readTime: 7,
    content: `
<h2>vSphere 8'in Öne Çıkan Yenilikleri</h2>
<p>VMware vSphere 8, 2022 sonunda genel kullanıma sunuldu ve ardından gelen 8.0 Update sürümleriyle olgunlaştı. Broadcom yönetiminde ürün geliştirme hızı yavaşlamış olsa da vSphere 8, kurumsal altyapılar için hâlâ güçlü bir platform olmaya devam ediyor.</p>

<h2>DPU (Data Processing Unit) Desteği</h2>
<p>vSphere 8'in en büyük mimari yeniliği, <strong>Data Processing Unit (DPU)</strong> entegrasyonudur. NVIDIA BlueField ve Intel IPU gibi DPU'lar, ağ, depolama ve güvenlik işlevlerini CPU'dan alarak özel donanıma taşır:</p>
<ul>
  <li>Hypervisor güvenlik fonksiyonları (firewall, şifreleme) DPU üzerinde çalışır; VM'ler bu kaynaklara dokunmaz.</li>
  <li>CPU kaynaklarının yalnızca iş yüküne ayrılması, yoğun sanal makine yoğunluğunda performansı artırır.</li>
  <li>Güvenlik seviyesi yükselir: DPU üzerinde çalışan servisler, VM tarafından ele geçirilmiş olsa bile tehlikeye girmez.</li>
</ul>

<h2>vCenter Server Yenilikleri</h2>
<p>vSphere 8 ile vCenter arayüzü yeniden tasarlandı:</p>
<ul>
  <li><strong>Yeni UI:</strong> HTML5 tabanlı arayüz tamamen yenilendi; Flash ve eski C# client tamamen kaldırıldı.</li>
  <li><strong>vCenter Lifecycle Manager (vLCM):</strong> ESXi host imaj yönetimi merkezi hale getirildi; patch ve sürüm yönetimi basitleşti.</li>
  <li><strong>Enhanced vMotion:</strong> Büyük VM'lerin canlı taşınma süresi kısaldı; bellek sıkıştırma algoritmaları iyileştirildi.</li>
  <li><strong>Cluster Quickstart:</strong> Yeni cluster kurulumu ve yapılandırması rehberli adımlarla hızlandırıldı.</li>
</ul>

<h2>vSphere ile Kubernetes (vSphere IaaS Control Plane)</h2>
<p>Eskiden Tanzu adıyla bilinen Kubernetes entegrasyonu, vSphere 8'de <strong>vSphere IaaS Control Plane</strong> olarak yeniden adlandırıldı:</p>
<ul>
  <li>Kubernetes namespace'lerini doğrudan vCenter üzerinden yönetin.</li>
  <li>VM ve container iş yüklerini aynı altyapıda çalıştırın.</li>
  <li>DevOps ekipleri için self-service namespace kapasite sınırlandırması.</li>
</ul>
<p>Bu özellik, VCF veya özel add-on lisansı gerektirmektedir.</p>

<h2>Donanım Uyumluluğu ve Minimum Gereksinimler</h2>
<p>vSphere 8 yükseltmesi öncesinde kontrol edilmesi gerekenler:</p>
<ul>
  <li><strong>CPU:</strong> Intel Skylake veya AMD Zen 1 ve üzeri. Eski Broadwell/Haswell işlemciler desteklenmez.</li>
  <li><strong>vCenter:</strong> Önce vCenter 8'e yükseltilir, ardından ESXi host'lar güncellenir (asla tersi yapılmaz).</li>
  <li><strong>Hardware Compatibility List (HCL):</strong> Tüm sunucu, storage ve ağ bileşenlerinin vSphere 8 HCL'de bulunduğu doğrulanmalıdır.</li>
  <li><strong>Üçüncü taraf çözümler:</strong> Backup (Veeam, Commvault), monitoring ve NSX eklentilerinin vSphere 8 ile uyumlu versiyonları kullanılmalıdır.</li>
</ul>

<h2>Yükseltme Öncesi Checklist</h2>
<ul>
  <li>Mevcut ortamın tam yedeklenmesi (Veeam veya snapshot)</li>
  <li>vCenter ve ESXi versiyonlarının HCL kontrolü</li>
  <li>Tüm VM'lerin VMware Tools güncellemesi</li>
  <li>Orphaned ve powered-off VM'lerin temizlenmesi</li>
  <li>Yükseltme sırası: vCenter → ESXi (yüksek öncelikli host'lardan başlayarak)</li>
  <li>Maintenance Mode ve vMotion testinin başarılı geçmesi</li>
</ul>

<h2>Sonuç</h2>
<p>vSphere 8, özellikle DPU desteği ve geliştirilmiş Kubernetes entegrasyonu ile modern altyapı gereksinimlerini karşılıyor. Yükseltme planlaması ve Broadcom lisans değerlendirmesi için Lider Network mühendisleri hizmetinizdedir.</p>
    `,
  },
  {
    slug: "vmware-vsan-hyper-converged-altyapi-rehberi",
    title: "VMware vSAN ile Hyper-Converged Altyapı (HCI) Kurulumu",
    excerpt:
      "VMware vSAN, sunucu disklerini birleştirerek SAN/NAS ihtiyacını ortadan kaldırır. Cluster tasarımı, disk grubu yapılandırması, deduplication ve RAID-6 politikalarını bu rehberde bulabilirsiniz.",
    category: "vmware",
    categoryColor: "#1d428a",
    tags: ["VMware vSAN", "HCI", "Hyper-Converged", "All-Flash", "Storage Policy"],
    publishedAt: "2026-05-05",
    readTime: 7,
    content: `
<h2>vSAN Nedir?</h2>
<p>VMware vSAN (Virtual SAN), ESXi host'larındaki yerel disk kaynaklarını bir araya getirerek dağıtık, paylaşımlı bir depolama katmanı oluşturan <strong>software-defined storage</strong> çözümüdür. Geleneksel SAN/NAS altyapısına gerek kalmaksızın yüksek performanslı ve dayanıklı depolama sağlar.</p>
<p>vSAN; vSphere Foundation ve Cloud Foundation lisanslarına dahildir.</p>

<h2>Minimum Cluster Gereksinimleri</h2>
<ul>
  <li><strong>Minimum 3 host:</strong> Veri koruması için en az 3 node gereklidir.</li>
  <li><strong>Her host'ta en az 1 disk grubu:</strong> 1 önbellek (cache) diski + 1–7 kapasite diski.</li>
  <li><strong>Cache diski:</strong> NVMe veya SAS SSD (All-Flash modelde NVMe tercih edilir).</li>
  <li><strong>Kapasite diskleri:</strong> All-Flash modelde NVMe/SSD; Hybrid modelde HDD.</li>
  <li><strong>10 GbE ağ:</strong> vSAN trafiği için ayrı bir vmkernel portgroup zorunludur.</li>
</ul>

<h2>vSAN Depolama Politikaları (SPBM)</h2>
<p>vSAN, Storage Policy-Based Management (SPBM) ile her VM'e bireysel depolama politikası atanmasına izin verir:</p>
<ul>
  <li><strong>FTT (Failures to Tolerate):</strong> Kaç host/disk arızasında veri korunmaya devam eder? FTT=1 için RAID-1, FTT=2 için RAID-6 kullanılabilir.</li>
  <li><strong>RAID-1 (Mirroring):</strong> Verinin iki kopyası tutulur. FTT=1 için minimum 3 host gerektirir; %50 kapasiteden daha az alan kullanımı sağlar.</li>
  <li><strong>RAID-5/6 (Erasure Coding):</strong> Kapasiteyi daha verimli kullanır. RAID-5 için 4, RAID-6 için 6 host gerekir. Kritik olmayan iş yükleri için tercih edilir.</li>
</ul>

<h2>All-Flash ve Hybrid Mimariler</h2>
<p><strong>All-Flash:</strong> Hem cache hem kapasite katmanında SSD/NVMe kullanılır. Üretim veritabanları ve VDI için önerilen yapıdır; düşük gecikme (1 ms altı) sağlar.</p>
<p><strong>Hybrid:</strong> Cache katmanında SSD, kapasite katmanında HDD. Geliştirme ortamları ve arşiv için maliyet avantajı sunar; ancak performans All-Flash'ın çok altındadır.</p>

<h2>Deduplication ve Compression</h2>
<p>vSAN, All-Flash modellerde cluster genelinde <strong>deduplication ve compression</strong> uygular:</p>
<ul>
  <li>Deduplication, aynı veri bloğunu tek seferinde saklar; özellikle VDI ortamlarında %50–80 alan tasarrufu sağlar.</li>
  <li>Compression, benzersiz blokları sıkıştırarak ek alan kazanımı sağlar.</li>
  <li>Bu özellikler cluster düzeyinde açılıp kapatılır; bireysel VM politikasında değiştirilemez.</li>
</ul>

<h2>vSAN Stretched Cluster ve 2 Site DR</h2>
<p>İki farklı fiziksel konumdaki host'ları tek vSAN cluster'ında birleştiren <strong>Stretched Cluster</strong> mimarisi:</p>
<ul>
  <li>Her site veri kopyasının bir örneğini barındırır; site arızasında diğer site otomatik devreye girer.</li>
  <li>Üçüncü bir konumda <strong>witness host</strong> gereklidir (yalnızca metadata; düşük kaynak gerektirir).</li>
  <li>Siteler arası maksimum gecikme 5 ms'dir.</li>
</ul>

<h2>Sonuç</h2>
<p>VMware vSAN, ayrı bir storage altyapısı olmaksızın yüksek dayanıklılıklı, ölçeklenebilir depolama katmanı oluşturur. Lider Network olarak vSAN cluster tasarımı, disk grubu yapılandırması ve politika yönetiminde danışmanlık hizmeti sunuyoruz.</p>
    `,
  },
  {
    slug: "vmware-nsx-ag-sanallaştirma-ve-mikro-segmentasyon",
    title: "VMware NSX ile Ağ Sanallaştırma ve Mikro-Segmentasyon",
    excerpt:
      "VMware NSX, veri merkezinizdeki ağ ve güvenlik katmanını yazılım tanımlı hale getirir. Mikro-segmentasyon ile yanal (east-west) saldırı yüzeyini minimuma indirmenin yollarını anlatıyoruz.",
    category: "vmware",
    categoryColor: "#1d428a",
    tags: ["VMware NSX", "Mikro-Segmentasyon", "SDN", "Zero Trust", "Distributed Firewall"],
    publishedAt: "2026-05-03",
    readTime: 6,
    content: `
<h2>VMware NSX Nedir?</h2>
<p>VMware NSX, fiziksel ağ donanımından bağımsız olarak çalışan <strong>Software-Defined Networking (SDN)</strong> platformudur. Yönlendirme, yük dengeleme, firewall ve VPN gibi ağ fonksiyonlarını donanım yerine yazılım katmanında uygular.</p>
<p>Broadcom'un paketlemesiyle NSX, VMware Cloud Foundation (VCF) lisansına dahildir.</p>

<h2>Mikro-Segmentasyon Neden Kritik?</h2>
<p>Geleneksel "kuzey-güney" (north-south) trafiğe odaklanan perimeter güvenliği, veri merkezindeki "doğu-batı" (east-west) trafiği görmezden gelir. Saldırganlar bir VM'ye sızdıktan sonra ağ içinde serbestçe hareket edebilir — bu lateral movement saldırılarının temelidir.</p>
<p>NSX mikro-segmentasyonu, her workload etrafında <strong>sanal bir güvenlik çemberi</strong> oluşturarak bu hareketi engeller.</p>

<h2>NSX Distributed Firewall (DFW)</h2>
<p>NSX'in en güçlü bileşeni olan DFW, her ESXi host'un hypervisor katmanında çalışır:</p>
<ul>
  <li>VM'lerin sanal NIC'lerine (vNIC) doğrudan politika uygulanır; trafik fiziksel bir firewall'a çıkmadan denetlenir.</li>
  <li>Politikalar IP adresine değil, <strong>güvenlik grubuna (Security Group)</strong> göre tanımlanır; VM taşındığında politika otomatik takip eder.</li>
  <li>Kimlik tabanlı filtreleme (Active Directory grubu bazında kural yazılabilir).</li>
  <li>Layer 7 uygulama kimliği ile belirli bir uygulamanın portunu filtreleme.</li>
</ul>

<h2>NSX Overlay Ağı (Geneve Tünelleme)</h2>
<p>NSX, fiziksel ağ üzerinde Geneve protokolüyle sanal ağ (overlay) oluşturur:</p>
<ul>
  <li>Her sanal ağ kendi VNI (Virtual Network Identifier) ile izole edilir; VLAN tasarımına bağımlılık kalkar.</li>
  <li>VM'ler host'lar arasında taşındığında ağ yapılandırması değişmez; IP adresleri sabit kalır.</li>
  <li>On-premise ile bulut arasında tutarlı ağ politikası uygulanabilir (NSX Federation).</li>
</ul>

<h2>NSX ile Zero Trust Mimarisi</h2>
<p>NSX, Zero Trust prensiplerini ağ katmanında uygular:</p>
<ul>
  <li><strong>Varsayılan Reddet (Default Deny):</strong> Her iş yükü için açıkça izin verilmeyen tüm trafik engellenir.</li>
  <li><strong>En Az Ayrıcalık:</strong> Uygulama katmanları (web, uygulama, veritabanı) arası yalnızca zorunlu portlara izin verilir.</li>
  <li><strong>Sürekli Doğrulama:</strong> NSX Intelligence ile trafik akışları analiz edilerek anormal davranışlar tespit edilir.</li>
</ul>

<h2>NSX Gateway Firewall ve Load Balancer</h2>
<ul>
  <li><strong>Gateway Firewall:</strong> North-south trafik için merkezi güvenlik noktası; stateful inspection ve URL filtreleme desteği.</li>
  <li><strong>NSX Advanced Load Balancer (Avi):</strong> L4/L7 yük dengeleme, WAF ve SSL offloading. Eski NSX Edge LB'nin yerini almıştır.</li>
</ul>

<h2>Sonuç</h2>
<p>VMware NSX, veri merkezinizi içten dışa güvence altına alan kapsamlı bir ağ sanallaştırma platformudur. Mikro-segmentasyon tasarımı, DFW politika yazımı ve NSX kurulumu konularında Lider Network mühendisleri yanınızdadır.</p>
    `,
  },

  // ─── GOOGLE WORKSPACE ─────────────────────────────────────────────────────
  {
    slug: "google-workspace-nedir-kurumsal-gmail-ve-bulut-ofis",
    title: "Google Workspace Nedir? Kurumsal Gmail ve Bulut Ofis Çözümü",
    excerpt:
      "Google Workspace, Gmail, Drive, Meet, Docs ve Calendar gibi araçları kurumsal kullanım için bir araya getiren bulut tabanlı iş birliği platformudur. Planlar, özellikler ve Microsoft 365 karşılaştırması bu makalede.",
    category: "google-workspace",
    categoryColor: "#4285F4",
    tags: ["Google Workspace", "Gmail", "Google Drive", "Google Meet", "Kurumsal Bulut"],
    publishedAt: "2026-05-11",
    readTime: 6,
    content: `
<h2>Google Workspace Nedir?</h2>
<p>Google Workspace (eski adıyla G Suite), Google'ın kurumsal müşteriler için sunduğu entegre bulut tabanlı iş birliği ve üretkenlik platformudur. Gmail, Drive, Docs, Sheets, Slides, Meet, Calendar, Chat ve daha onlarca aracı tek çatı altında toplar.</p>
<p>Dünya genelinde 10 milyondan fazla kuruluş Google Workspace kullanmakta olup küçük işletmelerden Fortune 500 şirketlerine kadar geniş bir müşteri tabanına sahiptir.</p>

<h2>Google Workspace Plan Karşılaştırması</h2>
<ul>
  <li><strong>Business Starter:</strong> Kullanıcı başına 30 GB bulut depolama (Pooled), özel alan adıyla Gmail, 100 katılımcılı Meet. KOBİ'ler için başlangıç noktası.</li>
  <li><strong>Business Standard:</strong> 2 TB Pooled depolama, 150 katılımcılı Meet + kayıt özelliği, uygulama kasası (Vault) eklentisi. Büyüyen ekipler için ideal.</li>
  <li><strong>Business Plus:</strong> 5 TB Pooled depolama, 500 katılımcılı Meet, Vault ve gelişmiş eDiscovery. Uyumluluk gereksinimleri olan kuruluşlar için.</li>
  <li><strong>Enterprise:</strong> Sınırsız depolama, 1000 katılımcılı Meet, gelişmiş DLP, S/MIME e-posta şifrelemesi ve öncelikli destek.</li>
</ul>

<h2>Temel Bileşenler</h2>
<ul>
  <li><strong>Gmail:</strong> Özel alan adıyla kurumsal e-posta (@sirketiniz.com.tr). Güçlü spam filtreleme, S/MIME şifreleme, 99,9% SLA.</li>
  <li><strong>Google Drive:</strong> Bulut depolama ve dosya paylaşımı. Gerçek zamanlı ortak düzenleme (eş zamanlı 100'den fazla kullanıcı).</li>
  <li><strong>Google Meet:</strong> Video konferans, ekran paylaşımı, otomatik altyazı, toplantı kaydı. Harici katılımcılar uygulama yüklemeden katılabilir.</li>
  <li><strong>Google Docs/Sheets/Slides:</strong> Tarayıcı tabanlı ofis uygulamaları. Microsoft Office formatlarıyla (docx, xlsx, pptx) tam uyumlu.</li>
  <li><strong>Google Chat:</strong> Anlık mesajlaşma ve Spaces (proje bazlı iş birliği kanalları).</li>
  <li><strong>Google Calendar:</strong> Ekip takvimleri, kaynak rezervasyonu (toplantı odaları), dış takvim entegrasyonu.</li>
</ul>

<h2>Güvenlik ve Uyumluluk</h2>
<ul>
  <li><strong>Admin Console:</strong> Merkezi kullanıcı, cihaz ve uygulama yönetimi. 2FA zorunluluğu, uygulama izinleri, veri bölgesi seçimi.</li>
  <li><strong>Vault:</strong> E-posta, Drive ve Chat verilerini yasal saklama politikalarına göre arşivler; eDiscovery ve denetim için arama yapar.</li>
  <li><strong>DLP (Data Loss Prevention):</strong> Hassas veri (kredi kartı, TC kimlik numarası) içeren dosyaların dışarı çıkmasını engeller.</li>
  <li><strong>GDPR & ISO 27001:</strong> Google Workspace, ISO 27001, SOC 2/3, GDPR ve HIPAA uyum gereksinimlerini destekler.</li>
</ul>

<h2>Google Workspace vs Microsoft 365</h2>
<p>Her iki platform da güçlü kurumsal özellikler sunmaktadır. Seçim, organizasyonun önceliklerine göre yapılmalıdır:</p>
<ul>
  <li><strong>Google Workspace güçlü yönleri:</strong> Gerçek zamanlı ortak düzenleme, sıfır kurulum gereksinimiyle tarayıcı tabanlı kullanım, Google yapay zeka entegrasyonu (Gemini), maliyet verimliliği.</li>
  <li><strong>Microsoft 365 güçlü yönleri:</strong> Masaüstü Office uygulamaları, derin Windows/Active Directory entegrasyonu, Teams'in geniş ekosistemi, SharePoint kurumsal içerik yönetimi.</li>
</ul>

<h2>Sonuç</h2>
<p>Google Workspace, gerçek zamanlı iş birliğini ve ölçeklenebilirliği ön plana çıkaran kurumsal bulut platformudur. Lider Network olarak Google Workspace kurumsal kurulum, alan adı yapılandırması, veri migrasyonu ve yönetici eğitimi konularında tam destek sağlıyoruz.</p>
    `,
  },
  {
    slug: "google-workspace-kurumsal-kurulum-ve-alan-adi-yapilandirmasi",
    title: "Google Workspace Kurumsal Kurulum: Alan Adı Yapılandırması ve DNS Ayarları",
    excerpt:
      "Google Workspace'i şirket alan adınızla kurmak için MX kayıtları, SPF, DKIM ve DMARC yapılandırması kritik öneme sahiptir. Adım adım kurulum rehberini bu makalede bulabilirsiniz.",
    category: "google-workspace",
    categoryColor: "#4285F4",
    tags: ["Google Workspace", "DNS", "MX Kaydı", "SPF", "DKIM", "DMARC", "Kurulum"],
    publishedAt: "2026-05-09",
    readTime: 7,
    content: `
<h2>Kuruluma Başlamadan Önce</h2>
<p>Google Workspace kurulumu basit görünse de DNS yanlış yapılandırıldığında e-postalar spam'e düşer veya hiç teslim edilmez. Kurulum öncesinde şunlara ihtiyacınız vardır:</p>
<ul>
  <li>Şirket alan adınız (örn. sirketiniz.com.tr) ve DNS paneline erişim</li>
  <li>Admin yetkisi olan bir e-posta adresi (Google hesabı olması gerekmez)</li>
  <li>Kullanıcı listesi ve geçiş yapılacaksa mevcut e-posta verileri</li>
</ul>

<h2>Alan Adı Doğrulama</h2>
<p>Google Workspace, alan adınızın size ait olduğunu doğrulamak için DNS TXT kaydı ekletir:</p>
<ul>
  <li>Admin Console'da "Alan adı ekle" seçilir; Google size benzersiz bir TXT değeri verir.</li>
  <li>DNS panelinizde (Cloudflare, GoDaddy, Natro, İsimtescil vb.) bu TXT kaydını ekleyin.</li>
  <li>DNS yayılımı 5 dakika ile 24 saat arasında tamamlanır. Google otomatik kontrol eder.</li>
</ul>

<h2>MX Kayıtları: E-postayı Google'a Yönlendirme</h2>
<p>MX (Mail Exchanger) kayıtları, gelen e-postaların hangi sunucuya yönlendirileceğini belirler. Google Workspace için eklenecek MX kayıtları:</p>
<ul>
  <li>ASPMX.L.GOOGLE.COM — Öncelik 1</li>
  <li>ALT1.ASPMX.L.GOOGLE.COM — Öncelik 5</li>
  <li>ALT2.ASPMX.L.GOOGLE.COM — Öncelik 5</li>
  <li>ALT3.ASPMX.L.GOOGLE.COM — Öncelik 10</li>
  <li>ALT4.ASPMX.L.GOOGLE.COM — Öncelik 10</li>
</ul>
<p><strong>Uyarı:</strong> Mevcut e-posta sunucunuz varsa MX kayıtlarını değiştirmeden önce e-posta migrasyonunu tamamlayın; aksi takdirde gelen e-postalar kaybolabilir.</p>

<h2>SPF Kaydı</h2>
<p>SPF (Sender Policy Framework), alan adınız adına e-posta göndermeye yetkili sunucuları tanımlar. Spam gönderimini ve kimlik sahtekârlığını engeller:</p>
<p>DNS TXT kaydı olarak ekleyin:</p>
<p><code>v=spf1 include:_spf.google.com ~all</code></p>
<ul>
  <li><code>include:_spf.google.com</code> — Google sunucuları yetkili gönderici olarak tanımlanır.</li>
  <li><code>~all</code> — Listede olmayan sunuculardan gelen e-postalar "soft fail" ile işaretlenir (reddedilmez ama şüpheli görülür). Daha sıkı koruma için <code>-all</code> kullanılabilir.</li>
</ul>

<h2>DKIM İmzalama</h2>
<p>DKIM (DomainKeys Identified Mail), e-posta içeriğinin transit sırasında değiştirilmediğini kriptografik imzayla doğrular:</p>
<ul>
  <li>Google Admin Console → Uygulamalar → Gmail → E-posta kimlik doğrulama bölümünden DKIM anahtarı oluşturulur.</li>
  <li>Oluşturulan TXT kaydı DNS'e eklenir (genellikle <code>google._domainkey.sirketiniz.com.tr</code> adına).</li>
  <li>DKIM etkinleştirildikten sonra Google tüm giden e-postaları imzalar.</li>
</ul>

<h2>DMARC Politikası</h2>
<p>DMARC (Domain-based Message Authentication), SPF ve DKIM kontrollerinin sonuçlarına göre alıcı sunucunun ne yapacağını belirler:</p>
<p>Başlangıç için önerilen yapılandırma (izleme modu):</p>
<p><code>v=DMARC1; p=none; rua=mailto:dmarc-raporlar@sirketiniz.com.tr; ruf=mailto:dmarc-raporlar@sirketiniz.com.tr; fo=1</code></p>
<ul>
  <li><code>p=none</code> — İzleme modunda kimlik doğrulama başarısız olsa dahi e-postalar engellenmez; raporlar toplanır.</li>
  <li>Raporları birkaç hafta analiz ettikten sonra <code>p=quarantine</code> ve ardından <code>p=reject</code>'e yükseltin.</li>
</ul>

<h2>E-posta Migrasyonu</h2>
<p>Mevcut e-posta verilerini Google Workspace'e aktarmak için:</p>
<ul>
  <li><strong>Google Workspace Migration for Microsoft Exchange (GWMME):</strong> Exchange veya Outlook PST dosyalarından migration için ücretsiz araç.</li>
  <li><strong>Data Migration Service:</strong> Admin Console içindeki yerleşik araç; IMAP protokolü üzerinden (Gmail, Yahoo, Yandex vb.) veri aktarımı sağlar.</li>
  <li><strong>Google Takeout / Import:</strong> Bireysel kullanıcıların kendi IMAP e-postalarını içe aktarması için.</li>
</ul>

<h2>Sonuç</h2>
<p>Doğru DNS yapılandırması, Google Workspace kurulumunun temel taşıdır. SPF, DKIM ve DMARC eksik bırakıldığında gönderilen e-postalar spam'e düşer ve marka itibarı zarar görür. Lider Network, Google Workspace kurulum ve DNS yapılandırması süreçlerini baştan sona yönetmektedir.</p>
    `,
  },
  {
    slug: "google-workspace-admin-console-guvenlik-ve-yonetim",
    title: "Google Workspace Admin Console: Güvenlik Politikaları ve Kullanıcı Yönetimi",
    excerpt:
      "Google Workspace Admin Console ile 2FA zorunluluğu, cihaz yönetimi (MDM), veri bölgesi seçimi, uygulama izinleri ve DLP politikalarını nasıl yapılandıracağınızı anlatıyoruz.",
    category: "google-workspace",
    categoryColor: "#4285F4",
    tags: ["Google Workspace", "Admin Console", "2FA", "MDM", "DLP", "Güvenlik"],
    publishedAt: "2026-05-07",
    readTime: 6,
    content: `
<h2>Admin Console'a Giriş</h2>
<p>Google Workspace yönetimi, <strong>admin.google.com</strong> adresindeki Admin Console üzerinden yapılır. Süper Yönetici rolüne sahip kullanıcılar tüm ayarlara erişebilirken özel yönetici rolleri belirli bölümlere kısıtlanabilir.</p>

<h2>İki Faktörlü Kimlik Doğrulama (2FA) Zorunluluğu</h2>
<p>Kurumsal güvenliğin en kritik adımlarından biri, tüm kullanıcılar için 2FA zorunlu hale getirmektir:</p>
<ul>
  <li>Admin Console → Güvenlik → 2 Adımlı Doğrulama → "Zorunlu kıl" seçeneği etkinleştirilir.</li>
  <li>Geçiş süresi (1–4 hafta) tanınarak kullanıcılara kademeli geçiş imkânı sunulur.</li>
  <li>Desteklenen yöntemler: Google Authenticator, SMS, donanım güvenlik anahtarı (YubiKey), Google prompt.</li>
  <li>Donanım anahtarı, en güçlü kimlik avı (phishing) korumasını sağlar; yöneticiler için zorunlu tutulması tavsiye edilir.</li>
</ul>

<h2>Cihaz Yönetimi (Endpoint Management / MDM)</h2>
<p>Admin Console, kurumsal cihazları merkezi yönetme imkânı sunar:</p>
<ul>
  <li><strong>Temel MDM (Ücretsiz):</strong> Mobil cihazlarda (Android/iOS) ekran kilidi zorunluluğu, uzaktan hesap silme, cihaz envanteri.</li>
  <li><strong>Gelişmiş MDM (Business Plus ve üzeri):</strong> Uygulama yönetimi, uygulama politikaları, iş profili (kişisel/kurumsal veri ayrımı).</li>
  <li><strong>Windows Endpoint Yönetimi:</strong> Windows 10/11 cihazlar Azure AD (Entra ID) veya doğrudan Admin Console ile yönetilebilir.</li>
</ul>
<p>Kayıp veya çalıntı cihazlarda <strong>uzaktan silme (remote wipe)</strong> yalnızca kurumsal verileri ya da tüm cihazı temizleyebilir.</p>

<h2>Uygulama İzinleri ve OAuth Yönetimi</h2>
<p>Kullanıcıların Google hesaplarına bağladığı üçüncü taraf uygulamalar veri güvenlik riski oluşturabilir:</p>
<ul>
  <li>Admin Console → Güvenlik → API Denetimleri bölümünden tüm bağlı uygulamalar listelenir.</li>
  <li>Güvenilmeyen veya gereksiz uygulamaların erişimi iptal edilebilir.</li>
  <li>"Güvenilir uygulamalar" listesi tanımlanarak yalnızca onaylı uygulamaların Google hesabına bağlanmasına izin verilir.</li>
</ul>

<h2>Veri Bölgesi (Data Region) Seçimi</h2>
<p>KVKK ve veri egemenliği gereksinimlerine uyum için verilerin nerede saklanacağı belirlenebilir:</p>
<ul>
  <li>Business Plus ve Enterprise planlarında veri bölgesi politikası etkinleştirilebilir.</li>
  <li>Gmail, Drive, Docs verileri Avrupa (AB) veri merkezlerinde tutulabilir.</li>
  <li>Türkiye'ye özgü yasal gereksinimler için yerel hukuki danışmanlıkla birlikte değerlendirilmesi önerilir.</li>
</ul>

<h2>DLP (Veri Kaybı Önleme) Politikaları</h2>
<p>Enterprise planında gelen DLP özellikleri, hassas verinin organizasyon dışına çıkmasını engeller:</p>
<ul>
  <li>Gmail için içerik tabanlı kurallar: Belirli anahtar kelimeler veya veri desenleri (kredi kartı, TC kimlik no) içeren e-postaları engelle veya karantinaya al.</li>
  <li>Drive için paylaşım kısıtlaması: DLP koşullarını karşılayan dosyaların organizasyon dışıyla paylaşılması otomatik olarak engellenir.</li>
  <li>Özelleştirilmiş dedektörler: Türkçe iş belgelerine özel anahtar kelime listeleri tanımlanabilir.</li>
</ul>

<h2>Güvenlik Skoru ve Güvenlik Merkezi</h2>
<p>Admin Console'daki <strong>Güvenlik Merkezi</strong> (Enterprise), organizasyonun güvenlik durumunu puanlar ve iyileştirme önerisi sunar:</p>
<ul>
  <li>2FA benimseme oranı, riskli uygulama izinleri, şüpheli giriş aktiviteleri gibi metrikler tek sayfada görüntülenir.</li>
  <li>Güvenlik uyarıları (şüpheli giriş, büyük çaplı dosya indirmesi) yöneticilere e-posta veya SMS ile iletilir.</li>
</ul>

<h2>Sonuç</h2>
<p>Google Workspace Admin Console, doğru yapılandırıldığında kurumsal güvenlik için güçlü bir kontrol noktasına dönüşür. Lider Network olarak Admin Console yapılandırması, 2FA zorunluluğu, MDM politikası ve DLP kurallarının tasarımında hizmetinizdeyiz.</p>
    `,
  },
  {
    slug: "google-workspace-veri-migrasyonu-ve-entegrasyon",
    title: "Google Workspace'e Geçiş: Veri Migrasyonu ve Sistem Entegrasyonları",
    excerpt:
      "Exchange, Outlook veya başka bir e-posta sisteminden Google Workspace'e geçmek için hazırlık, migration araçları, takvim/kişi aktarımı ve Active Directory entegrasyonu konularında kapsamlı rehber.",
    category: "google-workspace",
    categoryColor: "#4285F4",
    tags: ["Google Workspace", "Migrasyon", "Exchange", "LDAP", "Google Cloud Directory Sync"],
    publishedAt: "2026-05-05",
    readTime: 7,
    content: `
<h2>Geçiş Öncesi Hazırlık</h2>
<p>Başarılı bir Google Workspace migrasyonu, teknik çalışmadan önce doğru hazırlık gerektirir:</p>
<ul>
  <li><strong>Kullanıcı envanteri:</strong> Aktif kullanıcı listesi, kullanıcı başına posta kutusu boyutu ve arşiv gereksinimi belirlenir.</li>
  <li><strong>E-posta dışı veriler:</strong> Paylaşımlı takvimler, kişi listeleri, dağıtım grupları ve ortak posta kutuları ayrıca planlanır.</li>
  <li><strong>Uygulamalar:</strong> SMTP relay kullanan uygulamalar (yazıcılar, form araçları, ERP sistemleri) Google SMTP ayarlarıyla güncellenmesi gerekir.</li>
  <li><strong>Pilot grup:</strong> Önce 5–10 gönüllü kullanıcıyla geçiş test edilir; sorunlar büyük ölçekli geçişten önce çözülür.</li>
</ul>

<h2>E-posta Migrasyonu: Araç Seçenekleri</h2>
<p><strong>Google Workspace Migration for Microsoft Exchange (GWMME):</strong></p>
<ul>
  <li>Microsoft Exchange 2007–2019 ve Microsoft 365'ten doğrudan MAPI protokolü ile migration.</li>
  <li>E-posta, takvim ve kişiler aktarılır; büyük kuruluşlar için paralel migration desteklenir.</li>
  <li>Ücretsiz araç; Exchange yönetici erişimi gerektirir.</li>
</ul>
<p><strong>Google Workspace Data Migration Service (Admin Console):</strong></p>
<ul>
  <li>IMAP protokolü üzerinden Gmail, Yahoo, Yandex, Exchange vb. kaynaklardan migration.</li>
  <li>Tek konsoldan tüm kullanıcıların migration durumu izlenir.</li>
  <li>Takvim ve kişi migrasyonu ayrı araçlarla yapılır.</li>
</ul>
<p><strong>Üçüncü Taraf Araçlar:</strong> MigrationWiz, Cloudiway ve BitTitan, karmaşık senaryolar (çok sayıda alan adı, özel etiket yapısı) için ek esneklik sunar.</p>

<h2>Takvim Migrasyonu</h2>
<p>Exchange veya Office 365 takvimlerini Google Calendar'a aktarmak için:</p>
<ul>
  <li>GWMME, Exchange takvimlerini otomatik olarak Google Calendar'a aktarır.</li>
  <li>Tekrarlayan etkinlikler, katılımcı listeleri ve toplantı odası rezervasyonları korunur.</li>
  <li>ICS formatında dışa aktarılan takvimler Google Calendar'a Manuel olarak içe aktarılabilir (küçük ölçekli kullanıcılar için).</li>
</ul>

<h2>Active Directory Entegrasyonu: Google Cloud Directory Sync (GCDS)</h2>
<p>On-premise Active Directory ile Google Workspace kullanıcı senkronizasyonu için <strong>Google Cloud Directory Sync (GCDS)</strong> kullanılır:</p>
<ul>
  <li>AD kullanıcılarını, grupları ve org unit yapısını Google Workspace'e yansıtır.</li>
  <li>Tek yönlü senkronizasyon (AD → Google); şifreler AD'de kalır.</li>
  <li>Periyodik çalıştırma (cron job) veya tetikleyici olay ile anlık senkronizasyon yapılandırılabilir.</li>
</ul>
<p><strong>SSO Entegrasyonu:</strong> Google Workspace, SAML 2.0 destekler. AD FS veya Azure AD (Entra ID) ile SSO kurulduğunda kullanıcılar kurumsal kimlik bilgileriyle Google'a giriş yapar; şifre yönetimi merkezi kalır.</p>

<h2>SMTP Relay Yapılandırması</h2>
<p>Yazıcılar, ERP sistemleri ve form araçları gibi SMTP kullanan uygulamalar için Google Workspace iki seçenek sunar:</p>
<ul>
  <li><strong>Gmail SMTP Server:</strong> smtp.gmail.com (TLS 587 veya SSL 465). Kullanıcı başına kimlik doğrulaması gerektirir; küçük ölçek için uygundur.</li>
  <li><strong>Google SMTP Relay Service:</strong> IP tabanlı kimlik doğrulama. Alan adı adına gönderim yapan uygulamalar için ölçeklenebilir seçenek.</li>
</ul>

<h2>Geçiş Sırasında İş Sürekliliği</h2>
<p>Kesintisiz e-posta akışı için dual delivery (çift teslim) yapılandırması kritiktir:</p>
<ul>
  <li>MX kayıtları değiştirilmeden önce Google Workspace gelen e-postaları eski sistemdeki posta kutularına da iletmek üzere yapılandırılır.</li>
  <li>Bu sayede migration sırasında ne eski ne yeni sistemde e-posta kaybı yaşanmaz.</li>
  <li>Migration tamamlandıktan sonra çift teslim devre dışı bırakılır.</li>
</ul>

<h2>Sonuç</h2>
<p>Google Workspace geçişi, doğru planlama ve araç seçimiyle sorunsuz gerçekleştirilebilir. Lider Network olarak Exchange/Outlook'tan Google Workspace'e migration, DNS yapılandırması, GCDS kurulumu ve kullanıcı eğitimi süreçlerini uçtan uca yönetiyoruz.</p>
    `,
  },

  // ─── WINDOWS SERVER ───────────────────────────────────────────────────────
  {
    slug: "windows-server-2025-nedir-yeni-ozellikler-ve-yenilikler",
    title: "Windows Server 2025 Nedir? Yeni Özellikler ve Kurumsal Yenilikler",
    excerpt:
      "Microsoft'un en güncel sunucu işletim sistemi Windows Server 2025, AD yenilikleri, SMB sıkıştırma, Hyper-V geliştirmeleri ve gelişmiş güvenlik özellikleriyle kurumsal altyapıları yeniden şekillendiriyor.",
    category: "windows-server",
    categoryColor: "#0078d4",
    tags: ["Windows Server 2025", "Active Directory", "Hyper-V", "SMB", "Güvenlik"],
    publishedAt: "2026-05-19",
    readTime: 8,
    content: `
<h2>Windows Server 2025 Nedir?</h2>
<p>Windows Server 2025, Microsoft'un Ekim 2024'te genel kullanıma sunduğu en güncel sunucu işletim sistemidir. <strong>Long-Term Servicing Channel (LTSC)</strong> olarak yayımlanan bu sürüm, 2034 yılına kadar ana akım destek, 2029 yılına kadar genişletilmiş güvenlik güncellemesi alacaktır.</p>
<p>Windows Server 2025, Windows 11 ile ortak bir çekirdek (kernel) tabanı paylaşır; bu sayede modern donanım desteği, güvenlik mimarisi ve yönetim araçları açısından hizalanmış bir ekosistem sunar.</p>

<h2>Active Directory Yenilikleri</h2>
<p>Windows Server 2025 ile Active Directory Domain Services (AD DS) önemli güncellemeler aldı:</p>
<ul>
  <li><strong>Yeni İşlev Düzeyi (Domain/Forest Functional Level 2025):</strong> Şifreleme algoritmaları güncellendi; AES-256 tabanlı Kerberos şifrelemesi varsayılan hale getirildi.</li>
  <li><strong>Kerberos Armoring (FAST):</strong> Kerberos kimlik doğrulama trafiği ek şifreleme katmanıyla korunur; offline saldırılara karşı direnci artırır.</li>
  <li><strong>Microsoft Entra ID (Azure AD) Hibrit Join Geliştirmeleri:</strong> On-premise AD ile Entra ID arasındaki senkronizasyon daha hızlı ve sorunsuz hale getirildi.</li>
  <li><strong>DC Klonlama:</strong> Hızlı domain controller dağıtımı için mevcut DC'nin kopyalanması sürecinde iyileştirmeler yapıldı.</li>
</ul>

<h2>SMB (Server Message Block) Güncellemeleri</h2>
<p>Windows Server 2025, dosya paylaşım protokolü SMB'de kapsamlı yenilikler getirdi:</p>
<ul>
  <li><strong>SMB over QUIC:</strong> TCP yerine QUIC protokolü üzerinden SMB bağlantısı; UDP tabanlı çalışarak NAT ve güvenlik duvarlarıyla daha uyumlu, daha hızlı bağlantı sağlar. VPN gerektirmeden güvenli dosya paylaşımı için idealdir.</li>
  <li><strong>SMB Sıkıştırma:</strong> Aktarım sırasında veriyi sıkıştırarak WAN üzerinden dosya aktarım hızını artırır. LZ4 algoritmasıyla düşük CPU yükü sağlanır.</li>
  <li><strong>SMB İmzalama Zorunluluğu:</strong> Tüm SMB bağlantılarında imzalama varsayılan olarak zorunlu hale geldi; ortadaki adam (MITM) saldırılarına karşı koruma güçlendi.</li>
  <li><strong>SMB Dialect Yönetimi:</strong> Eski ve güvensiz SMB 1.0 protokolü artık varsayılan olarak tamamen devre dışı.</li>
</ul>

<h2>Hyper-V Geliştirmeleri</h2>
<ul>
  <li><strong>GPU Partitioning (GPU-P):</strong> Fiziksel GPU'yu birden fazla sanal makineye bölüştürerek paylaştırma; VDI ve yapay zeka iş yükleri için kritik önem taşır.</li>
  <li><strong>Hibernet (Hibernate) Desteği:</strong> Sanal makineler artık uyku durumuna alınabilir; hızlı yeniden başlatma imkânı sunar.</li>
  <li><strong>VM'e Doğrudan NVMe Disk Bağlama:</strong> Paravirtualized NVMe controller sayesinde depolama gecikmesi azaldı.</li>
  <li><strong>Cluster-Aware Updating Geliştirmeleri:</strong> Failover Cluster'larda güncelleme süreci daha güvenli ve hızlı hale getirildi.</li>
</ul>

<h2>Güvenlik ve Sertleştirme (Hardening)</h2>
<p>Windows Server 2025, "Secure by Default" prensibini benimsemektedir:</p>
<ul>
  <li><strong>Credential Guard Varsayılan:</strong> NTLM hash'lerinin bellekten çalınmasını engelleyen Credential Guard, desteklenen donanımlarda otomatik aktif gelir.</li>
  <li><strong>NTLM Kısıtlamaları:</strong> NTLMv1 tamamen kaldırıldı. NTLMv2 kullanımı Group Policy ile denetim altına alınabilir; Kerberos öncelikli hale getirildi.</li>
  <li><strong>Virtualization-Based Security (VBS):</strong> Kernel Isolated bileşenler VBS sayesinde izole çalışır; zararlı yazılımların kernel'e erişimi engellenir.</li>
  <li><strong>Secured-Core Server:</strong> TPM 2.0, UEFI Secure Boot ve VBS'nin birlikte çalıştığı donanım-yazılım güvenlik katmanı.</li>
</ul>

<h2>Depolama ve Ağ Yenilikleri</h2>
<ul>
  <li><strong>Storage Spaces Direct (S2D) Geliştirmeleri:</strong> Küme performansı için adaptif I/O ve gelişmiş deduplication. NVMe-oF (NVMe over Fabrics) desteği eklendi.</li>
  <li><strong>Network ATC (Automated Traffic Control):</strong> Cluster ağ yapılandırmasını otomatikleştirir; yanlış yapılandırma riskini azaltır.</li>
  <li><strong>Wi-Fi 6E ve Bluetooth 5.3:</strong> Sunucu donanım uyumluluğu genişletildi.</li>
</ul>

<h2>Lisanslama</h2>
<p>Windows Server 2025, önceki sürümlerle aynı çekirdek (core) tabanlı lisanslama modeli kullanır:</p>
<ul>
  <li><strong>Standard Edition:</strong> İki adet Hyper-V sanal makinesi veya fiziksel sunucu kullanımı için; ek VM lisansı ek maliyet getirir.</li>
  <li><strong>Datacenter Edition:</strong> Sınırsız sanal makine çalıştırma hakkı; S2D, Network Controller ve SDN özellikleri dahil.</li>
  <li><strong>Essentials Edition:</strong> 25 kullanıcıya kadar küçük işletmeler için; tek sunucu lisansı, CAL gerektirmez.</li>
</ul>

<h2>Sonuç</h2>
<p>Windows Server 2025, güvenlik, performans ve yönetilebilirlik açısından önemli atılımlar içermektedir. Lider Network olarak Windows Server 2025 lisanslama, kurulum, Active Directory tasarımı ve güvenlik sertleştirme konularında hizmetinizdeyiz.</p>
    `,
  },
  {
    slug: "windows-server-2022-vs-2025-karsilastirma-hangisini-secmeli",
    title: "Windows Server 2022 vs 2025: Hangisini Seçmeli?",
    excerpt:
      "Windows Server 2022 ile 2025 arasında özellik, güvenlik ve maliyet açısından kapsamlı karşılaştırma. Yükseltme kararı verirken dikkat edilmesi gerekenler ve migration rehberi.",
    category: "windows-server",
    categoryColor: "#0078d4",
    tags: ["Windows Server 2022", "Windows Server 2025", "Migration", "Karşılaştırma", "Lisanslama"],
    publishedAt: "2026-05-17",
    readTime: 6,
    content: `
<h2>Genel Bakış: İki Nesil Arasındaki Fark</h2>
<p>Windows Server 2022, Ağustos 2021'de piyasaya sürüldü ve Ekim 2031'e kadar genişletilmiş destek alacaktır. Windows Server 2025 ise Ekim 2024'te yayımlandı ve 2034 sonuna kadar desteklenecektir. Her iki sürüm de aktif olarak kullanımdadır; yükseltme kararı, kurumun mevcut altyapısına ve ihtiyaçlarına göre şekillenir.</p>

<h2>Güvenlik Karşılaştırması</h2>
<ul>
  <li><strong>Credential Guard:</strong> 2022'de manuel etkinleştirme gerekir; 2025'te desteklenen donanımlarda varsayılan olarak açık gelir.</li>
  <li><strong>NTLM:</strong> 2022'de NTLMv1 Group Policy ile devre dışı bırakılabilir; 2025'te NTLMv1 tamamen kaldırıldı, NTLMv2 kısıtlanabilir.</li>
  <li><strong>SMB İmzalama:</strong> 2022'de isteğe bağlı; 2025'te tüm bağlantılarda zorunlu (domain ortamlarında).</li>
  <li><strong>Secured-Core:</strong> Her iki sürüm de destekler; ancak 2025'te sertleştirme politikaları daha kapsamlı.</li>
  <li><strong>TLS 1.0/1.1:</strong> 2025'te tamamen kaldırıldı; 2022'de hâlâ etkinleştirilebilir (uyumluluk için).</li>
</ul>

<h2>Performans ve Özellik Karşılaştırması</h2>
<ul>
  <li><strong>SMB over QUIC:</strong> Yalnızca 2025'te mevcut; VPN olmadan güvenli dosya paylaşımı sunar.</li>
  <li><strong>GPU Partitioning (GPU-P):</strong> 2025 ile geldi; 2022'de Discrete Device Assignment (DDA) ile sınırlı GPU paylaşımı yapılabilir.</li>
  <li><strong>NVMe-oF Desteği:</strong> 2025'te Storage Spaces Direct ile entegre; 2022'de mevcut değil.</li>
  <li><strong>Hyper-V Hibernet:</strong> Yalnızca 2025'te; VM'lerin uyku moduna alınabilmesi.</li>
  <li><strong>AD İşlev Düzeyi:</strong> 2025, yeni DFL/FFL getiriyor; 2022, 2016 düzeyini kullanmaya devam eder.</li>
</ul>

<h2>Donanım Gereksinimleri</h2>
<p>Her iki sürüm için minimum gereksinimler benzerdir:</p>
<ul>
  <li><strong>İşlemci:</strong> 1.4 GHz 64-bit; 2025 için daha iyi donanım önerilir (özellikle VBS için).</li>
  <li><strong>RAM:</strong> Minimum 512 MB (Core), önerilen 2 GB+ (Desktop Experience).</li>
  <li><strong>Disk:</strong> Minimum 32 GB sistem diski; 2025 güncellemeleri için daha fazlası önerilir.</li>
  <li><strong>TPM 2.0:</strong> 2025'te Secured-Core için zorunlu; 2022'de isteğe bağlı.</li>
</ul>

<h2>Ne Zaman 2022'de Kalınmalı?</h2>
<ul>
  <li>Mevcut ortam istikrarlı çalışıyor ve kısa vadede değişiklik planlanmıyor.</li>
  <li>Kurulum için uygulamaların 2025 uyumluluğu henüz doğrulanmamış.</li>
  <li>TLS 1.0/1.1 kullanan eski uygulamalar hâlâ kritik üretim ortamında çalışıyor.</li>
  <li>Mevcut lisans anlaşmaları 2022'yi kapsıyor ve SA (Software Assurance) kapsamı dışında.</li>
</ul>

<h2>Ne Zaman 2025'e Geçilmeli?</h2>
<ul>
  <li>Yeni sunucu kurulumlarında 2025 başlangıç noktası olarak seçilmelidir.</li>
  <li>Güvenlik gereksinimleri yüksek (finans, sağlık, kamu) ortamlar için 2025'in sertleştirilmiş varsayılanları avantaj sağlar.</li>
  <li>GPU-P ile VDI veya yapay zeka iş yükleri planlanıyorsa 2025 zorunludur.</li>
  <li>SMB over QUIC ile uzak ofis dosya erişimi (VPN'siz) isteniyorsa 2025 tercih edilmelidir.</li>
</ul>

<h2>Yükseltme Süreci</h2>
<p>Windows Server 2022'den 2025'e yükseltme yöntemleri:</p>
<ul>
  <li><strong>In-Place Upgrade:</strong> Mevcut sunucu üzerinde doğrudan yükseltme. Uygulama ve ayarlar korunur; en az kesinti süresi.</li>
  <li><strong>Clean Install + Migration:</strong> Yeni sunucuya temiz kurulum, ardından roller ve veriler taşınır. Daha temiz yapılandırma sağlar; daha uzun planlama gerektirir.</li>
  <li><strong>Hyper-V / VM Migration:</strong> Sanal ortamda çalışıyorsa yeni bir VM'e 2025 kurulup roller taşınır; eski VM yedek olarak bekletilir.</li>
</ul>

<h2>Sonuç</h2>
<p>Yeni projeler için Windows Server 2025 tercih edilmelidir. Mevcut kararlı 2022 ortamları için ise planlı bir migration döneminde geçiş yapılması önerilir. Lider Network, Windows Server sürüm değerlendirmesi ve migration planlamasında danışmanlık hizmeti vermektedir.</p>
    `,
  },
  {
    slug: "windows-server-active-directory-kurulum-ve-en-iyi-uygulamalar",
    title: "Windows Server Active Directory: Kurulum, Tasarım ve En İyi Uygulamalar",
    excerpt:
      "Active Directory Domain Services (AD DS) kurumsal kimlik yönetiminin temel taşıdır. DC tasarımı, OU yapısı, Group Policy, replikasyon ve güvenlik sertleştirme konularında kapsamlı rehber.",
    category: "windows-server",
    categoryColor: "#0078d4",
    tags: ["Active Directory", "AD DS", "Group Policy", "Domain Controller", "LDAP", "Kerberos"],
    publishedAt: "2026-05-15",
    readTime: 9,
    content: `
<h2>Active Directory Nedir?</h2>
<p>Active Directory Domain Services (AD DS), Microsoft'un kimlik ve erişim yönetimi için geliştirdiği dizin servisidir. Kullanıcı hesapları, bilgisayarlar, gruplar ve politikaları merkezi olarak yönetir. 1999'dan bu yana kurumsal Windows ortamlarının temel bileşeni olarak yer alan AD DS, günümüzde on binlerce kullanıcı ölçeğinde çalışan küresel kuruluşlarda aktif olarak kullanılmaktadır.</p>

<h2>Temel Kavramlar</h2>
<ul>
  <li><strong>Domain:</strong> Ortak bir güvenlik politikası paylaşan nesneler topluluğu (örn. lidernetwork.local).</li>
  <li><strong>Domain Controller (DC):</strong> AD veritabanını barındıran ve kimlik doğrulama hizmetlerini sunan sunucu. Yüksek erişilebilirlik için en az iki DC zorunludur.</li>
  <li><strong>Forest:</strong> Bir veya birden fazla domain'in güven ilişkisiyle bağlandığı en üst seviye yapı. Tüm domain'ler ortak bir Schema ve Global Catalog paylaşır.</li>
  <li><strong>Organizational Unit (OU):</strong> Nesneleri (kullanıcı, bilgisayar, grup) mantıksal olarak gruplamak ve Group Policy uygulamak için kullanılan kapsayıcılar.</li>
  <li><strong>Group Policy Object (GPO):</strong> Kullanıcı ve bilgisayar yapılandırmalarını merkezi olarak yöneten politika nesneleri.</li>
</ul>

<h2>DC Tasarım İlkeleri</h2>
<p>Kurumsal bir ortamda DC tasarımı yapılırken dikkat edilmesi gerekenler:</p>
<ul>
  <li><strong>Her site için en az 2 DC:</strong> Tek DC arızalanırsa tüm kimlik doğrulama durur; ikinci DC bu riski ortadan kaldırır.</li>
  <li><strong>FSMO Rolleri:</strong> PDC Emulator, RID Master, Infrastructure Master, Schema Master ve Domain Naming Master rollerinin hangi DC'de olduğunu belgeleyin. PDC Emulator, en güçlü ve en iyi bağlantılı DC'de olmalıdır.</li>
  <li><strong>Global Catalog (GC):</strong> Çok domain'li forest yapılarında her sitede en az bir GC sunucu bulundurulmalıdır.</li>
  <li><strong>Read-Only Domain Controller (RODC):</strong> Fiziksel güvenliğin yetersiz olduğu şube ofisler için RODC, AD veritabanının salt okunur kopyasını barındırır; kimlik bilgileri RODC'de saklanmaz.</li>
</ul>

<h2>OU Yapısı Tasarımı</h2>
<p>İyi tasarlanmış bir OU yapısı GPO yönetimini ve yetkilendirmeyi kolaylaştırır. Yaygın yaklaşımlar:</p>
<ul>
  <li><strong>Coğrafi yapı:</strong> Ankara → Kullanıcılar / Bilgisayarlar / Gruplar. Büyük coğrafi dağılımlı kuruluşlar için uygundur.</li>
  <li><strong>Fonksiyonel yapı:</strong> IT / Muhasebe / İK → kendi OU'ları. Departman bazlı GPO uygulaması kolaylaşır.</li>
  <li><strong>Hibrit yapı:</strong> İlk seviye lokasyon, ikinci seviye departman. En yaygın tercih edilen yöntemdir.</li>
</ul>
<p><strong>Altın kural:</strong> Varsayılan "Users" ve "Computers" container'larına nesne koymayın; GPO uygulanamaz. Tüm nesneler özel OU'larda bulunmalıdır.</p>

<h2>Group Policy En İyi Uygulamalar</h2>
<ul>
  <li>Her GPO tek bir amaca hizmet etmelidir (örn. "Parola Politikası" ayrı, "Masaüstü Arka Planı" ayrı GPO).</li>
  <li>GPO adları açıklayıcı olmalıdır: <code>SEC-PasswordPolicy-AllUsers</code>, <code>SW-ChromeInstall-ITDept</code>.</li>
  <li>Default Domain Policy'yi mümkün olduğunca az düzenleyin; ayrı GPO'lar oluşturun.</li>
  <li>GPO bağlantılarını OU düzeyinde yapın; domain düzeyinde bağlantıyı sınırlı tutun.</li>
  <li>Loopback Processing: Kullanıcı ayarlarını bilgisayar bazında uygulamak için (kiosk, terminal server) kullanılır.</li>
</ul>

<h2>AD Replikasyonu ve Site Yapılandırması</h2>
<p>Çok lokasyonlu kurumlarda AD replikasyonu doğru yapılandırılmalıdır:</p>
<ul>
  <li><strong>Site Link:</strong> Lokasyonlar arası bağlantıyı temsil eder; maliyet ve replikasyon aralığı tanımlanır.</li>
  <li><strong>KCC (Knowledge Consistency Checker):</strong> DC'ler arasındaki replikasyon topolojisini otomatik olarak oluşturur.</li>
  <li>Yavaş WAN bağlantılarında replikasyon sıkıştırması etkinleştirilmelidir.</li>
  <li><strong>Replikasyon Sorun Giderme:</strong> <code>repadmin /showrepl</code> ve <code>dcdiag</code> komutları ile replikasyon sağlığı izlenir.</li>
</ul>

<h2>AD Güvenlik Sertleştirme</h2>
<ul>
  <li><strong>Ayrıcalıklı Erişim İş İstasyonları (PAW):</strong> Domain Admin hesapları yalnızca izole PAW'lardan kullanılmalıdır.</li>
  <li><strong>Tier Model:</strong> Tier 0 (DC/AD), Tier 1 (Sunucular), Tier 2 (İş İstasyonları) arasında kesin hesap ayrımı yapılmalıdır.</li>
  <li><strong>Protected Users Grubu:</strong> Bu gruba eklenen hesaplar NTLM, DES ve RC4 kullananlar için kimlik doğrulaması reddeder; yalnızca Kerberos AES kabul edilir.</li>
  <li><strong>LAPS (Local Administrator Password Solution):</strong> Her bilgisayardaki yerel admin şifresini otomatik, benzersiz ve döngüsel olarak yönetir.</li>
  <li><strong>AD Audit Logging:</strong> Hesap değişiklikleri, grup üyeliği değişiklikleri ve oturum açma olayları denetim günlüğüne kaydedilmelidir.</li>
</ul>

<h2>Sonuç</h2>
<p>Active Directory, kurumsal IT'nin bel kemiğidir. Doğru tasarlanmış bir AD altyapısı yönetim yükünü azaltır, güvenliği güçlendirir ve ölçeklenebilirlik sağlar. Lider Network olarak AD tasarımı, GPO yapılandırması ve güvenlik sertleştirme projelerinde deneyimli mühendis kadrosuyla hizmet veriyoruz.</p>
    `,
  },
  {
    slug: "windows-server-hyper-v-sanallaştirma-kurulum-ve-yonetim",
    title: "Windows Server Hyper-V ile Sanallaştırma: Kurulum, Yönetim ve Best Practice",
    excerpt:
      "Microsoft Hyper-V, Windows Server'a dahil yerleşik sanallaştırma platformudur. VM oluşturma, live migration, Failover Cluster, replikasyon ve VMware ile karşılaştırma konularında kapsamlı rehber.",
    category: "windows-server",
    categoryColor: "#0078d4",
    tags: ["Hyper-V", "Sanallaştırma", "Failover Cluster", "Live Migration", "Windows Server"],
    publishedAt: "2026-05-13",
    readTime: 8,
    content: `
<h2>Hyper-V Nedir?</h2>
<p>Microsoft Hyper-V, Windows Server ve Windows 10/11 Pro/Enterprise'a dahil, donanım üzerinde doğrudan çalışan (Type-1 / bare-metal) bir hypervisor'dür. Ayrıca <strong>Microsoft Hyper-V Server</strong>, yalnızca sanallaştırma rolünü barındıran ücretsiz bir işletim sistemi olarak da ayrıca sunulmaktadır.</p>
<p>Hyper-V, Windows Server 2025 Datacenter Edition lisansına dahildir ve sınırsız sanal makine çalıştırma hakkı sağlar.</p>

<h2>Hyper-V Kurulum Gereksinimleri</h2>
<ul>
  <li><strong>İşlemci:</strong> 64-bit CPU, SLAT (Second Level Address Translation) desteği (Intel EPT veya AMD RVI). Modern tüm işlemciler bu özelliği destekler.</li>
  <li><strong>BIOS/UEFI:</strong> Virtualization Technology (Intel VT-x / AMD-V) etkin olmalıdır.</li>
  <li><strong>RAM:</strong> Minimum 4 GB; üretim ortamları için 64 GB ve üzeri önerilir.</li>
  <li><strong>Depolama:</strong> VM'ler için ayrı bir disk grubu veya SAN/NAS bağlantısı önerilir.</li>
</ul>

<h2>Sanal Makine Oluşturma: Generation 1 vs Generation 2</h2>
<ul>
  <li><strong>Generation 1:</strong> BIOS tabanlı; eski işletim sistemleri (Windows Server 2003, eski Linux dağıtımları) için gereklidir. IDE controller kullanır.</li>
  <li><strong>Generation 2:</strong> UEFI tabanlı; Secure Boot desteği, daha hızlı önyükleme ve SCSI controller. Modern işletim sistemleri için her zaman Generation 2 tercih edilmelidir.</li>
</ul>

<h2>Dynamic Memory ve NUMA</h2>
<p><strong>Dynamic Memory:</strong> VM'in kullandığı RAM miktarını iş yüküne göre otomatik ayarlar. Minimum, maksimum ve başlangıç değerleri tanımlanarak bellek overcommit yönetilir.</p>
<p><strong>NUMA Aware:</strong> Hyper-V, sanal NUMA topolojisi oluşturarak büyük VM'lerin fiziksel NUMA sınırlarını verimli kullanmasını sağlar. Veritabanı ve HPC iş yükleri için kritik öneme sahiptir.</p>

<h2>Ağ Yapılandırması</h2>
<ul>
  <li><strong>External Virtual Switch:</strong> VM'leri fiziksel ağa bağlar; en yaygın kullanılan tür.</li>
  <li><strong>Internal Virtual Switch:</strong> VM'ler ve host arasında iletişim; dış ağa çıkış yoktur.</li>
  <li><strong>Private Virtual Switch:</strong> Yalnızca VM'ler arası iletişim; host bile dahil değil. Test ve izole ortamlar için uygundur.</li>
  <li><strong>SR-IOV:</strong> Ağ kartını VM'lere doğrudan sunar; yüksek performanslı ağ gereksinimleri için kullanılır.</li>
  <li><strong>NIC Teaming + SET (Switch Embedded Teaming):</strong> Hyper-V switch'e birden fazla fiziksel NIC bağlanarak bant genişliği arttırılır ve yedeklilik sağlanır.</li>
</ul>

<h2>Live Migration ve Storage Migration</h2>
<p><strong>Live Migration:</strong> Çalışan bir VM'i, kesinti olmaksızın başka bir Hyper-V host'a taşır. Gereksinimler:</p>
<ul>
  <li>Her iki host'un aynı veya uyumlu CPU ailesine sahip olması (Intel-Intel veya AMD-AMD).</li>
  <li>Paylaşımlı depolama (SAN/NAS/S2D) veya SMB 3.0 dosya paylaşımı.</li>
  <li>Kerberos veya CredSSP kimlik doğrulaması yapılandırılmış olmalıdır.</li>
</ul>
<p><strong>Storage Live Migration:</strong> VM çalışırken VHD/VHDX dosyalarını farklı bir depolama konumuna taşır. Paylaşımlı depolama gerektirmez; doğrudan host diskine de migration yapılabilir.</p>

<h2>Hyper-V Failover Cluster</h2>
<p>Yüksek erişilebilirlik (HA) için Hyper-V, Windows Failover Clustering ile birlikte çalışır:</p>
<ul>
  <li>Bir host arızalanırsa VM'ler otomatik olarak başka bir cluster node'una taşınır (failover).</li>
  <li>Shared storage zorunludur: iSCSI, FC SAN veya Storage Spaces Direct (S2D).</li>
  <li><strong>Cluster Shared Volume (CSV):</strong> Tüm cluster node'larının aynı anda erişebildiği paylaşımlı disk; VM failover süresini kısaltır.</li>
  <li><strong>Quorum:</strong> Cluster kararlarında oy sayısı dengesini sağlar; tek sayıda node veya witness (disk/bulut) kullanılmalıdır.</li>
</ul>

<h2>Hyper-V Replica</h2>
<p>Hyper-V Replica, ek maliyet olmadan VM düzeyinde asenkron replikasyon sağlar:</p>
<ul>
  <li>Birincil site VM'si, ikincil siteye 30 saniye, 5 dakika veya 15 dakika aralıklarla kopyalanır.</li>
  <li>Felaket durumunda ikincil sitedeki replika VM'i planlanmış veya plansız failover ile devreye alınır.</li>
  <li>Veeam veya Windows Server Backup ile birlikte kullanıldığında kapsamlı bir DR stratejisi oluşturulabilir.</li>
</ul>

<h2>Hyper-V vs VMware vSphere</h2>
<ul>
  <li><strong>Maliyet:</strong> Hyper-V, Windows Server lisansına dahildir; ek maliyet yoktur. VMware VCF/VVF lisansları önemli ek maliyet getirir.</li>
  <li><strong>Özellik seti:</strong> vSphere, DRS (Distributed Resource Scheduler) ve vSAN gibi Hyper-V'de varsayılan olmayan gelişmiş özellikler sunar.</li>
  <li><strong>Ekosistem:</strong> Hyper-V, Windows tabanlı kurulumlarda daha derin entegrasyon sağlar; VMware daha geniş üçüncü taraf destek ekosistemi sunar.</li>
  <li><strong>Yönetim araçları:</strong> Hyper-V Manager, Windows Admin Center ve System Center VMM; vSphere için vCenter.</li>
</ul>

<h2>Sonuç</h2>
<p>Hyper-V, özellikle Windows tabanlı altyapılarda güçlü ve maliyet-etkin bir sanallaştırma platformudur. Lider Network olarak Hyper-V tasarımı, Failover Cluster kurulumu ve S2D yapılandırmasında deneyimli ekibimizle hizmetinizdeyiz.</p>
    `,
  },

  // ─── WINDOWS 11 ───────────────────────────────────────────────────────────
  {
    slug: "windows-11-24h2-guncellemesi-yeni-ozellikler-ve-yenilikler",
    title: "Windows 11 24H2 Güncellemesi: Tüm Yeni Özellikler ve Yenilikler",
    excerpt:
      "Windows 11 24H2 (2024 yıllık güncellemesi), yapay zeka destekli Copilot+, yeni Recall özelliği, HDR kalibrasyon araçları ve önemli güvenlik geliştirmeleriyle geliyor. Tüm yenilikleri detaylı inceliyoruz.",
    category: "windows-11",
    categoryColor: "#7719aa",
    tags: ["Windows 11", "24H2", "Copilot+", "Recall", "AI", "Güvenlik"],
    publishedAt: "2026-05-20",
    readTime: 8,
    content: `
<h2>Windows 11 24H2 Nedir?</h2>
<p>Windows 11 24H2, Microsoft'un Ekim 2024'te yayımladığı yıllık özellik güncellemesidir. Bu güncelleme yalnızca arayüz iyileştirmeleri değil; yapay zeka entegrasyonu, çekirdek düzeyinde güvenlik güncellemeleri ve donanım gereksinimleri açısından da köklü değişiklikler içermektedir.</p>
<p>24H2, aynı zamanda <strong>ARM64 mimarisi için önemli bir kilometre taşıdır</strong>; x86 uygulamalarının ARM işlemcilerde çalışması optimize edilmiştir.</p>

<h2>Copilot+ PC ve Yapay Zeka Özellikleri</h2>
<p>Microsoft, 24H2 ile birlikte <strong>Copilot+ PC</strong> kategorisini tanıttı. Bu özellikler, minimum 40 TOPS kapasitesinde NPU (Neural Processing Unit) içeren cihazlarda çalışır (Qualcomm Snapdragon X Elite/Plus, Intel Core Ultra 200V serisi, AMD Ryzen AI 300):</p>
<ul>
  <li><strong>Recall:</strong> Yapay zeka destekli "zamanında geri dönme" özelliği. Ekran görüntülerini periyodik olarak alarak semantik arama yapılmasını sağlar. "İki hafta önce baktığım o PDF" gibi doğal dil araması mümkün olur. Tüm veriler yerel olarak şifrelenerek saklanır; buluta gönderilmez.</li>
  <li><strong>Click to Do:</strong> Ekrandaki içerik üzerine tıklayarak AI destekli eylemler gerçekleştirme (metin çevirisi, nesne kaldırma, bağlantı açma).</li>
  <li><strong>Live Captions Çeviri:</strong> Herhangi bir uygulamadan gelen sesi gerçek zamanlı olarak çeviri ile altyazıya çevirir; 44 dil desteği.</li>
  <li><strong>Cocreator in Paint:</strong> Çizim yaparken yapay zeka sahneleri tamamlar ve önerilerde bulunur.</li>
  <li><strong>Super Resolution:</strong> Video ve görsel içerikleri AI ile yüksek çözünürlüğe dönüştürür.</li>
</ul>

<h2>Güvenlik Güncellemeleri</h2>
<p>24H2, güvenlik açısından da önemli adımlar içermektedir:</p>
<ul>
  <li><strong>Windows Hello Enhanced Sign-in Security:</strong> Biyometrik kimlik doğrulamasının koruması güçlendirildi; sahte kamera/mikrofon saldırılarına karşı donanım doğrulaması eklendi.</li>
  <li><strong>Credential Guard Varsayılan:</strong> NTLM kimlik bilgisi hırsızlığına karşı Credential Guard, desteklenen donanımlarda otomatik aktif gelir.</li>
  <li><strong>SMB İmzalama Zorunluluğu:</strong> Domain ortamlarında tüm SMB bağlantılarında imzalama varsayılan olarak zorunlu; MITM saldırılarına karşı koruma.</li>
  <li><strong>TLS 1.0/1.1 Kaldırıldı:</strong> Eski ve güvensiz TLS sürümleri artık desteklenmez; TLS 1.2+ zorunlu hale geldi.</li>
  <li><strong>VBS (Virtualization-Based Security) Genişletildi:</strong> Kernel bütünlük koruması daha fazla senaryoyu kapsar.</li>
</ul>

<h2>Arayüz ve Kullanılabilirlik Yenilikleri</h2>
<ul>
  <li><strong>Başlat Menüsü İyileştirmeleri:</strong> Telefon bağlantısı entegrasyonu; Android cihazdan son uygulamalar ve fotoğraflar Başlat menüsünde görünür.</li>
  <li><strong>Görev Çubuğu Tarih/Saat Özelleştirme:</strong> Saat bölümünde saniye gösterimi artık mümkün.</li>
  <li><strong>Snap Layouts Geliştirmeleri:</strong> Pencere düzeni şablonları genişletildi; ultra-geniş monitörler için yeni bölüm seçenekleri.</li>
  <li><strong>HDR Arka Plan Kalibrasyon:</strong> HDR monitör sahipleri için sistem genelinde otomatik renk kalibrasyonu.</li>
  <li><strong>Bluetooth LE Audio:</strong> Düşük enerji tüketimli yeni Bluetooth ses standardı desteği; kulaklık pil ömrü uzar.</li>
  <li><strong>Wi-Fi 7 Desteği:</strong> 46 Gbps'e kadar hız sunan Wi-Fi 7 standart desteği eklendi.</li>
</ul>

<h2>Dosya Gezgini Yenilikleri</h2>
<ul>
  <li><strong>7-Zip ve RAR Açma Desteği:</strong> Artık ek program kurmadan .7z ve .rar dosyaları Dosya Gezgini ile açılabilir.</li>
  <li><strong>ARM64 Aygıt Sürücüsü Desteği:</strong> Daha fazla çevre birimi ARM cihazlarda sorunsuz çalışır.</li>
  <li><strong>Gelişmiş Ağ Sürücüleri:</strong> SMB over QUIC desteği; domain dışı cihazlar için de etkinleştirilebilir.</li>
</ul>

<h2>Oyun ve Performans Geliştirmeleri</h2>
<ul>
  <li><strong>DirectStorage 1.2:</strong> Oyun varlıklarının GPU'ya doğrudan yüklenmesi; yükleme süreleri belirgin şekilde azaldı.</li>
  <li><strong>Auto HDR Genişletildi:</strong> Daha fazla eski oyunda otomatik HDR iyileştirmesi.</li>
  <li><strong>Game Bar Yenilikleri:</strong> Xbox oyunlarının PC'ye akışı iyileştirildi.</li>
</ul>

<h2>Donanım Gereksinimleri</h2>
<p>24H2 için minimum Windows 11 gereksinimleri değişmedi:</p>
<ul>
  <li>64-bit işlemci, minimum 1 GHz, 2 veya daha fazla çekirdek</li>
  <li>4 GB RAM (8 GB önerilir)</li>
  <li>64 GB depolama</li>
  <li>TPM 2.0 ve Secure Boot</li>
  <li>DirectX 12 uyumlu grafik kartı</li>
</ul>
<p>Copilot+ PC özellikleri için ek olarak <strong>40 TOPS+ NPU</strong> gereklidir.</p>

<h2>Sonuç</h2>
<p>Windows 11 24H2, yapay zeka entegrasyonu ve güvenlik sertleştirmeleriyle önemli bir güncelleme olarak öne çıkmaktadır. Lider Network, kurumsal Windows 11 dağıtımı, Intune ile yönetim ve güvenlik politikaları konularında destek sunmaktadır.</p>
    `,
  },
  {
    slug: "windows-11-kurumsal-guvenlik-bitlocker-windows-hello-defender",
    title: "Windows 11 Kurumsal Güvenlik: BitLocker, Windows Hello ve Microsoft Defender",
    excerpt:
      "Windows 11'in kurumsal güvenlik katmanları olan BitLocker disk şifrelemesi, Windows Hello biyometrik kimlik doğrulaması ve Microsoft Defender Antivirus'u kurumsal ortamda nasıl yönetirsiniz?",
    category: "windows-11",
    categoryColor: "#7719aa",
    tags: ["Windows 11", "BitLocker", "Windows Hello", "Microsoft Defender", "Kurumsal Güvenlik"],
    publishedAt: "2026-05-18",
    readTime: 7,
    content: `
<h2>Windows 11'in Güvenlik Mimarisi</h2>
<p>Windows 11, "güvenli varsayılan" (Secure by Default) anlayışıyla tasarlanmıştır. TPM 2.0 ve Secure Boot zorunluluğu, Windows 10'dan farklı olarak bu güvenlik özelliklerinin donanım düzeyinde garanti altına alınmasını sağlar. Kurumsal ortamlarda bu temel, BitLocker, Windows Hello ve Defender ile güçlendirilir.</p>

<h2>BitLocker Disk Şifrelemesi</h2>
<p>BitLocker, Windows 11 Pro ve Enterprise'da bulunan tam disk şifreleme çözümüdür. AES-XTS-128 veya AES-XTS-256 algoritmalarını kullanır.</p>

<h3>BitLocker Kurumsal Yönetim Senaryoları</h3>
<ul>
  <li><strong>Sessiz Şifreleme (Silent Encryption):</strong> Intune veya Group Policy aracılığıyla kullanıcı etkileşimi olmaksızın tüm cihazları otomatik şifreler. BitLocker anahtarları Azure AD veya on-premise AD'e kaydedilir.</li>
  <li><strong>Kurtarma Anahtarı Yönetimi:</strong> Her cihaz için benzersiz kurtarma anahtarı Microsoft Endpoint Manager (Intune) veya AD'de saklanır; kaybolan cihazlar için IT uzaktan kurtarma sağlayabilir.</li>
  <li><strong>Pre-Boot Authentication:</strong> Sunucu gibi yüksek güvenlikli cihazlarda PIN veya USB anahtar gerektiren ön-başlatma kimlik doğrulaması.</li>
  <li><strong>Network Unlock:</strong> Etki alanına bağlı cihazlar kurumsal ağa bağlıyken TPM+PIN yerine ağ üzerinden otomatik kilit açar; kullanıcı deneyimini korur.</li>
</ul>

<h3>BitLocker Politika Önerileri</h3>
<ul>
  <li>Tüm dizüstü bilgisayarlarda BitLocker zorunlu tutulmalıdır (fiziksel çalınma riski).</li>
  <li>AES-256 şifreleme tercih edilmelidir (varsayılan AES-128 yerine).</li>
  <li>Kurtarma anahtarları merkezi olarak AD veya Intune'da saklanmalı; yerel kayıt tercih edilmemelidir.</li>
</ul>

<h2>Windows Hello for Business</h2>
<p>Windows Hello, parola yerine PIN, yüz tanıma veya parmak izi kullanarak kimlik doğrulama sunar. Kurumsal versiyon olan <strong>Windows Hello for Business</strong> ek güvenlik katmanları içerir:</p>
<ul>
  <li><strong>Asimetrik Kriptografi:</strong> Parola sunucuya gönderilmez; cihaz özel anahtarı TPM'de saklar ve sunucu halka açık anahtarla doğrulama yapar. Kimlik avı (phishing) saldırılarına karşı doğal koruma sağlar.</li>
  <li><strong>Hibrit Azure AD Join:</strong> On-premise AD ve Azure AD'ye birleşik cihazlarda Windows Hello for Business, her iki ortamda da çalışır.</li>
  <li><strong>Anti-Spoofing:</strong> Yüz tanıma özelliği fotoğraf veya video ile kandırılamaması için kızılötesi sensör kullanır (Windows Hello Enhanced Sign-in Security).</li>
</ul>

<h3>Intune ile Windows Hello Politikası</h3>
<p>Microsoft Intune üzerinden Windows Hello for Business şu ayarlarla yapılandırılabilir:</p>
<ul>
  <li>Minimum PIN uzunluğu (önerilen: 8+)</li>
  <li>PIN karmaşıklığı (büyük/küçük harf, rakam, özel karakter)</li>
  <li>Biyometrik zorunluluğu (PIN fallback ile birlikte)</li>
  <li>PIN süresi ve geçmiş denetimi</li>
</ul>

<h2>Microsoft Defender Antivirus</h2>
<p>Windows 11'e dahil gelen Microsoft Defender Antivirus, ek yazılım gerektirmeden gerçek zamanlı koruma sunar:</p>
<ul>
  <li><strong>Bulut Tabanlı Koruma:</strong> Şüpheli dosyalar Microsoft'un bulut altyapısında anlık analiz edilir; imza güncellemesi beklemeden sıfır gün tehditlere karşı koruma sağlar.</li>
  <li><strong>Davranış İzleme:</strong> Yalnızca bilinen zararlı yazılım imzaları değil; şüpheli davranış desenleri de tespit edilir.</li>
  <li><strong>Tamper Protection:</strong> Zararlı yazılımların Defender'ı devre dışı bırakmasını engeller; Intune veya SCCM olmadan ayarlar değiştirilemez.</li>
  <li><strong>Controlled Folder Access:</strong> Kritik klasörlere (Belgeler, Masaüstü) yetkisiz uygulama erişimini engeller; ransomware koruması için kritik bir katman.</li>
</ul>

<h3>Microsoft Defender for Endpoint (MDE)</h3>
<p>Defender Antivirus'un ötesinde, Microsoft 365 E5 veya ayrı lisansla gelen <strong>Defender for Endpoint</strong> ek EDR (Endpoint Detection & Response) yetenekleri sunar:</p>
<ul>
  <li>Tehdit avı (Threat Hunting): Güvenlik analistleri olayları geriye dönük olarak sorgular.</li>
  <li>Otomatik soruşturma ve yanıt (AIR): Uyarıları analiz eder, saldırı zincirini haritalandırır ve otomatik düzeltme önerir.</li>
  <li>Attack Surface Reduction (ASR) kuralları: Makro tabanlı saldırılar, credential dumping ve process injection gibi teknikleri proaktif olarak engeller.</li>
</ul>

<h2>Windows Güvenlik Duvarı (Windows Firewall)</h2>
<ul>
  <li>Domain, Private ve Public profilleri için ayrı kural setleri tanımlanabilir.</li>
  <li>Intune veya Group Policy ile merkezi kural yönetimi yapılır.</li>
  <li>Uygulama bazlı filtreleme: Yalnızca belirli uygulamalara ağ erişimi izni verilir.</li>
</ul>

<h2>Sonuç</h2>
<p>Windows 11'in yerleşik güvenlik araçları, doğru yapılandırıldığında kurumsal ortamlarda güçlü bir koruma katmanı oluşturur. Lider Network olarak BitLocker politika tasarımı, Windows Hello for Business kurulumu ve Defender for Endpoint yönetimi konularında destek sağlıyoruz.</p>
    `,
  },
  {
    slug: "windows-11-kurumsal-yonetim-intune-ve-group-policy",
    title: "Windows 11 Kurumsal Yönetim: Intune ve Group Policy ile Merkezi Kontrol",
    excerpt:
      "Windows 11 cihazlarını Microsoft Intune veya Group Policy ile merkezi yönetmek için cihaz kaydı, uyumluluk politikaları, uygulama dağıtımı ve yapılandırma profilleri konularında kapsamlı rehber.",
    category: "windows-11",
    categoryColor: "#7719aa",
    tags: ["Windows 11", "Intune", "Group Policy", "MDM", "Cihaz Yönetimi", "Autopilot"],
    publishedAt: "2026-05-16",
    readTime: 7,
    content: `
<h2>Yönetim Yaklaşımları: GPO mu, Intune mi?</h2>
<p>Windows 11 cihazlarını merkezi yönetmek için iki temel yaklaşım mevcuttur:</p>
<ul>
  <li><strong>Group Policy (GPO):</strong> On-premise Active Directory tabanlı, on yıllardır olgun ve kapsamlı; on-premise domain'e bağlı cihazlarda en iyi sonucu verir.</li>
  <li><strong>Microsoft Intune (MDM/MAM):</strong> Bulut tabanlı, internet üzerinden yönetim; hibrit ve tam bulut ortamlar, BYOD ve uzak çalışanlar için idealdir.</li>
  <li><strong>Co-Management:</strong> Her iki yaklaşımı birlikte kullanarak geçiş döneminde iş yüklerini aşamalı olarak Intune'a taşıyan hibrit model.</li>
</ul>

<h2>Microsoft Intune ile Cihaz Kaydı</h2>
<p>Windows 11 cihazlarını Intune'a kaydetme yöntemleri:</p>
<ul>
  <li><strong>Windows Autopilot:</strong> Doğrudan üreticiden gelen cihaz, kutu açıldığında şirkete ait yapılandırmayla hazır gelir. IT masasına uğramadan self-service kurulum imkânı sunar. OEM veya distribütör cihazı Autopilot profiline kaydeder; kullanıcı OOBE sırasında kurumsal kimliğiyle giriş yaparak kurulumu tamamlar.</li>
  <li><strong>Azure AD Join + Intune Auto-Enrollment:</strong> Kullanıcı Azure AD kimliğiyle giriş yaptığında cihaz otomatik olarak Intune'a kaydolur.</li>
  <li><strong>Bulk Enrollment:</strong> Hazırlama paketleri (provisioning package) ile çok sayıda cihaz aynı anda kaydedilir.</li>
</ul>

<h2>Uyumluluk Politikaları</h2>
<p>Intune uyumluluk politikaları, cihazların güvenlik gereksinimlerini karşılayıp karşılamadığını denetler:</p>
<ul>
  <li>Minimum işletim sistemi sürümü (örn. Windows 11 23H2 ve üzeri)</li>
  <li>BitLocker şifrelemesinin etkin olması</li>
  <li>Güvenlik duvarının aktif olması</li>
  <li>TPM 2.0 ve Secure Boot zorunluluğu</li>
  <li>Microsoft Defender Antivirus'un güncel ve etkin olması</li>
</ul>
<p>Uyumsuz cihazlar Conditional Access ile kurumsal kaynaklara (Exchange, SharePoint, Teams) erişimden engellenebilir.</p>

<h2>Yapılandırma Profilleri</h2>
<p>Intune yapılandırma profilleri, GPO'nun bulut karşılığıdır:</p>
<ul>
  <li><strong>Settings Catalog:</strong> 1.500'den fazla Windows ayarını tek bir arayüzden yapılandırın. GPO'daki her Administrative Template ayarı buradan uygulanabilir.</li>
  <li><strong>Endpoint Protection:</strong> Windows Defender, BitLocker, Windows Firewall ve SmartScreen ayarları.</li>
  <li><strong>Device Restrictions:</strong> USB depolama engeli, kamera devre dışı bırakma, ekran görüntüsü yasağı, mağaza uygulaması kısıtlaması.</li>
  <li><strong>Wi-Fi ve VPN Profilleri:</strong> Kurumsal Wi-Fi ve VPN ayarları cihaza otomatik iletilir; kullanıcı manuel yapılandırma yapmaz.</li>
  <li><strong>Sertifika Profilleri:</strong> SCEP veya PKCS sertifikaları cihazlara otomatik dağıtılır; Wi-Fi 802.1X ve VPN kimlik doğrulaması için kullanılır.</li>
</ul>

<h2>Uygulama Dağıtımı</h2>
<p>Intune, Windows 11 cihazlarına merkezi uygulama dağıtımı yapar:</p>
<ul>
  <li><strong>Microsoft Store for Business (Win32 Uygulama):</strong> .exe veya .msi uygulamalarını IntuneWinAppUtil aracıyla paketleyip dağıtın.</li>
  <li><strong>Microsoft 365 Apps:</strong> Tek tıklamayla tüm cihazlara Office uygulamaları dağıtımı; kanal (Current, Monthly Enterprise, Semi-Annual) seçimi.</li>
  <li><strong>Windows Package Manager (winget):</strong> PowerShell scripti aracılığıyla winget ile ücretsiz uygulamaların (7-Zip, VLC, Chrome) toplu kurulumu.</li>
  <li><strong>Zorunlu / İsteğe Bağlı / Kaldırma:</strong> Her uygulama için kullanıcı grubuna göre zorunlu kurulum, kendi kendine servis portalından isteğe bağlı kurulum veya kaldırma işlemi tanımlanabilir.</li>
</ul>

<h2>Windows Update Yönetimi</h2>
<ul>
  <li><strong>Update Rings:</strong> Güncelleme halkalarıyla pilot grup önce güncellenir, sorun yoksa geniş dağıtım yapılır. Kritik güvenlik güncellemelerinin gecikmesi en fazla 30 gün ile sınırlandırılmalıdır.</li>
  <li><strong>Feature Update Politikası:</strong> Yıllık Windows sürüm güncellemelerinin zamanını kontrol edin; uygulamalar test edilmeden yeni sürüme geçişi engelleyin.</li>
  <li><strong>Quality Updates:</strong> Aylık güvenlik yamalarını 0–30 gün arasında erteleyerek test grubuyla doğrulama yapın.</li>
  <li><strong>Driver Update Yönetimi:</strong> Otomatik sürücü güncellemelerini Intune üzerinden kontrol altına alın; sorun çıkaran sürücüler geri alınabilir.</li>
</ul>

<h2>Raporlama ve İzleme</h2>
<p>Intune'un raporlama modülü kurumsal görünürlük sağlar:</p>
<ul>
  <li>Cihaz uyumluluk özeti: Kaç cihaz uyumlu, kaçı uyumsuz?</li>
  <li>Uygulama kurulum durumu: Hangi cihazlarda kurulum başarısız oldu?</li>
  <li>Güvenlik açığı raporu: Güvenlik güncellemesi eksik cihazlar listesi.</li>
  <li>Endpoint Analytics: Başlangıç süresi, uygulama performansı ve çökme analizleri ile cihaz sağlığı ölçümü.</li>
</ul>

<h2>Sonuç</h2>
<p>Windows 11 cihazlarının Intune ile merkezi yönetimi, hem güvenliği hem de IT operasyon verimliliğini artırır. Lider Network olarak Autopilot yapılandırması, Intune politika tasarımı ve Co-Management geçiş danışmanlığında hizmetinizdeyiz.</p>
    `,
  },
  {
    slug: "windows-10-windows-11-gecis-rehberi-kurumsal-upgrade",
    title: "Windows 10'dan Windows 11'e Geçiş Rehberi: Kurumsal Upgrade Stratejisi",
    excerpt:
      "Windows 10 desteği Ekim 2025'te sona eriyor. Kurumsal Windows 11 geçişinde donanım uyumluluğu, uygulama testi, Autopilot ile yenileme ve aşamalı dağıtım stratejilerini detaylıca anlatıyoruz.",
    category: "windows-11",
    categoryColor: "#7719aa",
    tags: ["Windows 10", "Windows 11", "Kurumsal Geçiş", "Upgrade", "Donanım Uyumluluğu"],
    publishedAt: "2026-05-14",
    readTime: 7,
    content: `
<h2>Neden Acil? Windows 10 Destek Bitiş Tarihi</h2>
<p>Microsoft, <strong>14 Ekim 2025</strong> itibarıyla Windows 10'un ana akım desteğini sonlandırmaktadır. Bu tarihten sonra güvenlik güncellemesi almayan Windows 10 cihazlar, kurumsal ortamlar için kabul edilemez bir güvenlik riski oluşturmaktadır.</p>
<p>Kurumlar için seçenekler:</p>
<ul>
  <li>Windows 11'e yükseltme (tercih edilen)</li>
  <li>ESU (Extended Security Updates) — ücretli, 3 yıla kadar uzatma imkânı; bir köprü çözümüdür</li>
  <li>Desteklenmeyen cihazların ağdan izole edilmesi</li>
</ul>

<h2>Donanım Uyumluluk Değerlendirmesi</h2>
<p>Windows 11'in katı donanım gereksinimleri nedeniyle mevcut cihaz filosunun önemli bir kısmı uyumsuz olabilir. Toplu uyumluluk değerlendirmesi için:</p>
<ul>
  <li><strong>Microsoft Intune Endpoint Analytics:</strong> Tüm Intune yönetimli cihazların Windows 11 uyumluluğunu raporlar; hangi cihazların yükseltilip hangilerinin değiştirileceğini gösterir.</li>
  <li><strong>Microsoft PC Health Check Aracı:</strong> Bireysel cihazda TPM, CPU ve Secure Boot kontrolü yapar.</li>
  <li><strong>Readiness Toolkit for Office and Windows:</strong> Kuruluş genelinde envanter çıkarma ve uyumluluk analizi.</li>
</ul>
<p><strong>Windows 11 Minimum Gereksinimleri:</strong></p>
<ul>
  <li>64-bit CPU, minimum 1 GHz, 2+ çekirdek (Intel 8. nesil+, AMD Zen 2+, Qualcomm 7/8c+)</li>
  <li>4 GB RAM (8 GB önerilen)</li>
  <li>64 GB depolama</li>
  <li><strong>TPM 2.0</strong> (en kritik gereksinim — birçok eski cihazda yoktur)</li>
  <li>UEFI + Secure Boot</li>
  <li>DirectX 12 uyumlu GPU</li>
</ul>

<h2>TPM 2.0 Sorunu ve Çözümler</h2>
<p>Kurumsal Windows 11 geçişinde en yaygın engel TPM 2.0'dır:</p>
<ul>
  <li>2018 öncesi birçok iş bilgisayarında TPM 1.2 bulunur veya TPM devre dışı bırakılmıştır.</li>
  <li>BIOS/UEFI ayarlarında TPM, bazı sistemlerde "PTT" (Intel Platform Trust Technology) veya "fTPM" (AMD Firmware TPM) olarak adlandırılabilir; etkinleştirilerek Windows 11 uyumlu hale getirilebilir.</li>
  <li>TPM 1.2 donanımı olan cihazlar fiziksel TPM 2.0 modülü eklenerek (eğer anakart destekliyorsa) yükseltilebilir.</li>
</ul>

<h2>Uygulama Uyumluluk Testi</h2>
<p>Yükseltme öncesinde kritik iş uygulamalarının Windows 11 ile test edilmesi zorunludur:</p>
<ul>
  <li><strong>Microsoft App Assure:</strong> Microsoft'un ücretsiz uyumluluk yardım programı; Windows 11'de sorun yaşayan kurumsal uygulamalar için destek sağlar.</li>
  <li><strong>Test Grubu Oluşturma:</strong> Her departmandan gönüllü 5–10 kullanıcıyla pilot Windows 11 yüklemesi yapın. Sorunlar büyük ölçekli dağıtımdan önce tespit edilir.</li>
  <li><strong>Uygulama Paketleme:</strong> Eski kurulum (.msi/.exe) yöntemleri büyük ölçüde çalışmaya devam eder; ancak 16-bit uygulamalar Windows 11'de çalışmaz.</li>
  <li><strong>Sürücü Uyumluluğu:</strong> Özellikle endüstriyel yazıcılar, etiket makineleri ve özel donanımların sürücülerinin Windows 11 versiyonlarının mevcut olduğu doğrulanmalıdır.</li>
</ul>

<h2>Yükseltme Yöntemleri</h2>
<p><strong>In-Place Upgrade (Yerinde Yükseltme):</strong></p>
<ul>
  <li>Mevcut Windows 10 üzerine doğrudan Windows 11 yüklenir; uygulamalar, dosyalar ve ayarlar korunur.</li>
  <li>WSUS, Intune veya Configuration Manager (SCCM) ile toplu dağıtım yapılabilir.</li>
  <li>Hızlı ve düşük IT maliyetli; ancak "kirli" yapılandırmalar taşınabilir.</li>
</ul>
<p><strong>Wipe and Reload (Temiz Kurulum):</strong></p>
<ul>
  <li>Yeni Windows 11 kurulumu + uygulamalar yeniden dağıtılır. Autopilot ile otomatize edildiğinde IT müdahalesi minimuma iner.</li>
  <li>Daha temiz bir başlangıç; özellikle çok eski kurulumlar için önerilir.</li>
  <li>Kullanıcı verilerinin OneDrive veya yedek ile önceden güvence altına alınması zorunludur.</li>
</ul>
<p><strong>Donanım Yenileme:</strong></p>
<ul>
  <li>TPM uyumsuz veya 5+ yıl eski cihazlar için doğrudan Windows 11 uyumlu yeni donanım alınır.</li>
  <li>Autopilot ile kutu açıldığında hazır yapılandırmayla kullanıcıya teslim edilir.</li>
</ul>

<h2>Aşamalı Dağıtım Stratejisi</h2>
<p>Büyük kurumlar için önerilen 4 aşamalı geçiş planı:</p>
<ul>
  <li><strong>Aşama 1 — Pilot (1–2 ay):</strong> IT departmanı ve gönüllüler. Sorunlar tespit ve çözülür.</li>
  <li><strong>Aşama 2 — Erken Çoğunluk (%20–30 cihaz):</strong> Düşük riskli departmanlar (İK, muhasebe). Geri bildirim toplanır.</li>
  <li><strong>Aşama 3 — Geniş Dağıtım (%60–70):</strong> Üretim ve kritik olmayan operasyon birimleri.</li>
  <li><strong>Aşama 4 — Son Kalan (%10–20):</strong> Özel uygulamalara bağımlı veya uyumsuz donanımlı cihazlar; bu grupta donanım yenileme gerekebilir.</li>
</ul>

<h2>Sonuç</h2>
<p>Windows 10 destek bitiş tarihi göz önüne alındığında kurumsal Windows 11 geçişi artık ertelenebilir bir proje değil, acil bir güvenlik gereksinimidir. Lider Network olarak donanım uyumluluk analizi, pilot kurulum, Autopilot yapılandırması ve aşamalı dağıtım planlamasında uçtan uca destek sunuyoruz.</p>
    `,
  },


  // ─── ISO & UYUMLULUK ──────────────────────────────────────────────────────
  {
    slug: "iso-27001-nedir-bilgi-guvenligi-yonetim-sistemi",
    title: "ISO 27001 Nedir? Bilgi Güvenliği Yönetim Sistemi Rehberi",
    excerpt:
      "ISO/IEC 27001, dünya genelinde en yaygın bilgi güvenliği standardıdır. Sertifikasyon süreci, risk yönetimi, kontrol maddeleri ve kurumunuza sağladığı faydaları detaylıca açıklıyoruz.",
    category: "iso-uyumluluk",
    categoryColor: "#6366f1",
    tags: ["ISO 27001", "BGYS", "Bilgi Güvenliği", "Sertifikasyon", "Risk Yönetimi"],
    publishedAt: "2026-05-21",
    readTime: 9,
    content: `
<h2>ISO 27001 Nedir?</h2>
<p>ISO/IEC 27001, Uluslararası Standardizasyon Örgütü (ISO) ve Uluslararası Elektroteknik Komisyonu (IEC) tarafından ortaklaşa yayımlanan ve <strong>Bilgi Güvenliği Yönetim Sistemi (BGYS)</strong> kurulumu, uygulanması, izlenmesi ve sürekli iyileştirilmesi için gereksinimleri tanımlayan uluslararası standarttır.</p>
<p>2022 yılında güncellenen ISO/IEC 27001:2022 sürümü, bulut güvenliği, tehdit istihbaratı ve veri maskeleme gibi güncel konuları kapsayan yeni kontrol maddeleriyle birlikte gelmiştir.</p>

<h2>Neden ISO 27001?</h2>
<ul>
  <li><strong>Müşteri ve İş Ortağı Güveni:</strong> Sertifika, bilgi güvenliğine yatırım yaptığınızın bağımsız denetimle doğrulanmış kanıtıdır.</li>
  <li><strong>Yasal Uyumluluk:</strong> KVKK, GDPR ve PCI DSS gibi düzenlemelerin gerektirdiği güvenlik tedbirlerini sistematik biçimde karşılar.</li>
  <li><strong>İhale ve Tedarikçi Gereksinimleri:</strong> Kamu ihaleleri ve büyük kurumsal sözleşmelerde ISO 27001 sertifikası giderek zorunlu hale gelmektedir.</li>
  <li><strong>Olay Azaltma:</strong> Standart risk yönetimi yaklaşımı, güvenlik olaylarının sıklığını ve etkisini azaltır.</li>
  <li><strong>Rekabet Avantajı:</strong> Sektörde güvenilir tedarikçi konumunu pekiştirir.</li>
</ul>

<h2>BGYS'nin Kapsamı</h2>
<p>ISO 27001, yalnızca teknoloji değil; <strong>insan, süreç ve teknoloji</strong> üçlüsünü kapsayan bütünleşik bir yaklaşım benimser:</p>
<ul>
  <li>Bilgi varlıklarının envanteri ve sınıflandırması</li>
  <li>Risk değerlendirme ve risk işleme süreci</li>
  <li>Güvenlik politikaları ve prosedürleri</li>
  <li>Personel farkındalık eğitimleri</li>
  <li>Fiziksel ve çevresel güvenlik</li>
  <li>Erişim kontrolü ve kimlik yönetimi</li>
  <li>Olay yönetimi ve iş sürekliliği</li>
</ul>

<h2>ISO 27001:2022 Yapısı — Yüksek Seviye Yapı (HLS)</h2>
<p>Standart, 10 ana maddeden oluşur:</p>
<ul>
  <li><strong>Madde 4:</strong> Kuruluşun bağlamı — iç/dış paydaşlar, kapsam belirleme</li>
  <li><strong>Madde 5:</strong> Liderlik — üst yönetim taahhüdü, politika, roller</li>
  <li><strong>Madde 6:</strong> Planlama — risk değerlendirme, hedefler</li>
  <li><strong>Madde 7:</strong> Destek — kaynaklar, yetkinlik, iletişim, dokümantasyon</li>
  <li><strong>Madde 8:</strong> Operasyon — risk işleme planının uygulanması</li>
  <li><strong>Madde 9:</strong> Performans değerlendirme — iç denetim, yönetim gözden geçirme</li>
  <li><strong>Madde 10:</strong> İyileştirme — uygunsuzluk yönetimi, sürekli iyileştirme</li>
</ul>

<h2>Ek A Kontrolleri — ISO 27001:2022</h2>
<p>ISO 27001:2022, Ek A'da <strong>4 tema altında 93 kontrol</strong> içerir (önceki sürümde 114 kontrol vardı):</p>
<ul>
  <li><strong>Örgütsel Kontroller (37):</strong> Politikalar, roller, tedarikçi güvenliği, iş sürekliliği</li>
  <li><strong>İnsan Kontrolleri (8):</strong> İşe alım güvenliği, eğitim, disiplin süreci</li>
  <li><strong>Fiziksel Kontroller (14):</strong> Çevre güvenliği, fiziksel erişim, temiz masa politikası</li>
  <li><strong>Teknolojik Kontroller (34):</strong> Kimlik doğrulama, şifreleme, güvenli geliştirme, log yönetimi</li>
</ul>
<p>2022 sürümüyle eklenen <strong>11 yeni kontrol</strong> şunlardır: Tehdit istihbaratı, bulut güvenliği, ICT sürekliliği, veri maskeleme, fiziksel güvenlik izleme, yapılandırma yönetimi, bilgi silme, veri sızıntısı önleme, web filtreleme, güvenli kodlama, uygulama güvenliği.</p>

<h2>Sertifikasyon Süreci</h2>
<ul>
  <li><strong>Aşama 1 — Gap Analizi:</strong> Mevcut durum ile standart gereksinimleri karşılaştırılır; eksiklikler tespit edilir.</li>
  <li><strong>Aşama 2 — Uygulama:</strong> Politikalar, prosedürler ve teknik kontroller hayata geçirilir. Tipik süre: 6–18 ay.</li>
  <li><strong>Aşama 3 — İç Denetim:</strong> Sertifikasyon öncesi iç denetimle eksiklikler giderilir.</li>
  <li><strong>Aşama 4 — Belgelendirme Denetimi (Aşama 1):</strong> Akredite belgelendirme kuruluşu dokümantasyonu ve hazırlık durumunu inceler.</li>
  <li><strong>Aşama 5 — Belgelendirme Denetimi (Aşama 2):</strong> Saha denetimi; kontrollerin fiilen uygulandığı doğrulanır.</li>
  <li><strong>Aşama 6 — Gözetim Denetimleri:</strong> Yılda bir gözetim, 3 yılda bir yeniden belgelendirme denetimi yapılır.</li>
</ul>

<h2>SOA (Uygulanabilirlik Beyanı)</h2>
<p>Statement of Applicability (SOA), 93 kontrolün hangilerinin uygulandığını, hangilerinin kapsam dışı tutulduğunu ve gerekçelerini içeren zorunlu belgedir. Denetçilerin incelediği temel belgeler arasında yer alır.</p>

<h2>Sonuç</h2>
<p>ISO 27001 sertifikası, bilgi güvenliğini kurum kültürünün bir parçası haline getiren ve sürekli iyileştirme döngüsünü tetikleyen en güçlü uluslararası araçtır. Lider Network, ISO 27001 gap analizi, BGYS kurulumu ve sertifikasyon danışmanlığı konularında hizmet vermektedir.</p>
    `,
  },
  {
    slug: "kvkk-nedir-kisisel-verilerin-korunmasi-kanunu-rehberi",
    title: "KVKK Nedir? Kişisel Verilerin Korunması Kanunu Kapsamlı Rehberi",
    excerpt:
      "6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK), kişisel verilerin işlenmesinde temel hakları düzenler. Veri sorumlusu yükümlülükleri, açık rıza, VERBİS kaydı ve idari para cezaları bu rehberde.",
    category: "iso-uyumluluk",
    categoryColor: "#6366f1",
    tags: ["KVKK", "Kişisel Veri", "VERBİS", "Veri Sorumlusu", "Açık Rıza", "GDPR"],
    publishedAt: "2026-05-21",
    readTime: 8,
    content: `
<h2>KVKK Nedir?</h2>
<p>6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK), 7 Nisan 2016 tarihinde yürürlüğe giren ve Türkiye'de kişisel verilerin işlenmesine ilişkin esas ve usulleri düzenleyen temel yasal düzenlemedir. Avrupa Birliği'nin GDPR (Genel Veri Koruma Tüzüğü) ile büyük ölçüde uyumlu olan KVKK, bireylerin kişisel verileri üzerindeki haklarını koruma altına alır.</p>

<h2>Temel Kavramlar</h2>
<ul>
  <li><strong>Kişisel Veri:</strong> Kimliği belirli veya belirlenebilir gerçek kişiye ilişkin her türlü bilgi. Ad-soyad, T.C. kimlik numarası, e-posta, telefon, konum verisi, IP adresi, fotoğraf bu kapsamdadır.</li>
  <li><strong>Özel Nitelikli Kişisel Veri:</strong> Irk, etnik köken, siyasi düşünce, din, sağlık, cinsel hayat, biyometrik ve genetik veriler. Bu veriler için işleme koşulları daha kısıtlıdır.</li>
  <li><strong>Veri Sorumlusu:</strong> Kişisel verilerin işleme amaçlarını ve vasıtalarını belirleyen, veri kayıt sisteminin kurulmasından ve yönetilmesinden sorumlu gerçek veya tüzel kişi.</li>
  <li><strong>Veri İşleyen:</strong> Veri sorumlusunun verdiği yetkiye dayanarak onun adına kişisel verileri işleyen gerçek veya tüzel kişi (örn. bulut hizmet sağlayıcısı).</li>
  <li><strong>Açık Rıza:</strong> Belirli bir konuya ilişkin, bilgilendirilmeye dayanan ve özgür iradeyle açıklanan rıza.</li>
</ul>

<h2>Kişisel Veri İşleme Şartları</h2>
<p>Kişisel veriler yalnızca aşağıdaki koşullardan en az birinin varlığı halinde işlenebilir:</p>
<ul>
  <li>İlgili kişinin açık rızasının bulunması</li>
  <li>Kanunlarda açıkça öngörülmesi</li>
  <li>Sözleşmenin kurulması veya ifası için zorunlu olması</li>
  <li>Hukuki yükümlülüğün yerine getirilmesi için zorunlu olması</li>
  <li>İlgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla veri sorumlusunun meşru menfaatlerinin bulunması</li>
</ul>

<h2>VERBİS — Veri Sorumluları Sicil Bilgi Sistemi</h2>
<p>VERBİS, veri sorumlularının Kişisel Verileri Koruma Kurumu'na (KVKK Kurumu) kayıt yaptırdığı çevrimiçi sistemdir:</p>
<ul>
  <li>Yıllık çalışan sayısı 50'nin üzerinde veya yıllık mali bilanço toplamı 25 milyon TL'nin üzerinde olan veri sorumluları VERBİS'e kayıt olmak zorundadır.</li>
  <li>Kayıt kapsamında: İşlenen kişisel veri kategorileri, işleme amaçları, alıcı grupları ve yurt dışı aktarım bilgileri beyan edilir.</li>
  <li>VERBİS kaydı yapılmaması 20.000 TL ile 1.000.000 TL arasında idari para cezasına yol açar.</li>
</ul>

<h2>İlgili Kişinin Hakları</h2>
<ul>
  <li>Kişisel verilerinin işlenip işlenmediğini öğrenme hakkı</li>
  <li>İşlenme amacını ve bu amaca uygun kullanılıp kullanılmadığını öğrenme hakkı</li>
  <li>Yurt içinde veya yurt dışında verilerin aktarıldığı üçüncü kişileri bilme hakkı</li>
  <li>Eksik veya yanlış işlenmiş verilerin düzeltilmesini talep etme hakkı</li>
  <li>Kişisel verilerin silinmesini veya yok edilmesini talep etme hakkı (unutulma hakkı)</li>
  <li>İşlemeye itiraz etme hakkı</li>
  <li>Otomatik sistemler vasıtasıyla analiz edilmesine itiraz etme hakkı</li>
</ul>
<p>Veri sorumlusu bu taleplere en geç <strong>30 gün</strong> içinde yanıt vermek zorundadır.</p>

<h2>Teknik ve İdari Tedbirler</h2>
<p>KVKK, kişisel verilerin güvenliğini sağlamak için teknik ve idari tedbirlerin alınmasını zorunlu kılar:</p>
<p><strong>Teknik Tedbirler:</strong></p>
<ul>
  <li>Ağ güvenliği ve uygulama güvenliği sağlanması</li>
  <li>Kişisel veri güvenliğinin takibi (log yönetimi, SIEM)</li>
  <li>Kişisel veri içeren ortamların güvenliğinin sağlanması (şifreleme, erişim kontrolü)</li>
  <li>Güvenlik açıklarının tespiti ve giderilmesi (sızma testi, zafiyet taraması)</li>
  <li>Yedekleme sistemlerinin kurulması</li>
</ul>
<p><strong>İdari Tedbirler:</strong></p>
<ul>
  <li>Çalışanların KVKK konusunda eğitilmesi ve farkındalık oluşturulması</li>
  <li>Kişisel veri işleme envanterinin hazırlanması</li>
  <li>Gizlilik taahhütnameleri ve veri işleme sözleşmelerinin imzalanması</li>
  <li>Veri imha politikasının oluşturulması ve uygulanması</li>
  <li>İç denetim mekanizmalarının kurulması</li>
</ul>

<h2>Veri İhlali Bildirimi</h2>
<p>Kişisel verilerin yetkisiz kişilerce ele geçirilmesi durumunda veri sorumlusu:</p>
<ul>
  <li>İhlali fark ettiği tarihten itibaren <strong>72 saat</strong> içinde KVKK Kurumu'na bildirmek zorundadır.</li>
  <li>İhlalden etkilenen kişilere de en kısa sürede bildirim yapılmalıdır.</li>
</ul>

<h2>İdari Para Cezaları</h2>
<ul>
  <li>Aydınlatma yükümlülüğüne aykırılık: 13.129 TL – 262.618 TL</li>
  <li>Veri güvenliğini sağlama yükümlülüğüne aykırılık: 26.258 TL – 1.965.088 TL</li>
  <li>Kurul kararlarına aykırılık: 52.516 TL – 1.965.088 TL</li>
  <li>VERBİS'e kayıt yükümlülüğüne aykırılık: 39.387 TL – 1.965.088 TL</li>
</ul>

<h2>KVKK ve GDPR Farkları</h2>
<ul>
  <li>GDPR, tüzel kişilerin yanı sıra AB'li bireylerin verilerini işleyen AB dışındaki kuruluşlara da uygulanır; KVKK yalnızca Türkiye'de yerleşik veri sorumlularını kapsar.</li>
  <li>GDPR cezaları küresel ciro üzerinden hesaplanır (en fazla %4); KVKK'da sabit bant aralıkları söz konusudur.</li>
  <li>Her iki düzenleme de veri minimizasyonu, amaç sınırlılığı ve şeffaflık ilkelerini paylaşır.</li>
</ul>

<h2>Sonuç</h2>
<p>KVKK uyumu yalnızca ceza riskini azaltmakla kalmaz; kurumsal güveni artırır ve veri yönetişim olgunluğunu geliştirir. Lider Network, KVKK gap analizi, teknik tedbirlerin uygulanması ve VERBİS kaydı süreçlerinde danışmanlık hizmeti sunmaktadır.</p>
    `,
  },
  {
    slug: "iso-22301-is-surekliligi-yonetim-sistemi",
    title: "ISO 22301 İş Sürekliliği Yönetim Sistemi: Felaket Senaryolarına Hazırlık",
    excerpt:
      "ISO 22301, kuruluşların beklenmedik kesintilere karşı dirençli olmasını sağlayan iş sürekliliği standardıdır. BIA, RTO/RPO belirleme ve test süreçlerini detaylıca ele alıyoruz.",
    category: "iso-uyumluluk",
    categoryColor: "#6366f1",
    tags: ["ISO 22301", "İş Sürekliliği", "BIA", "Disaster Recovery", "BCMS"],
    publishedAt: "2026-05-21",
    readTime: 7,
    content: `
<h2>ISO 22301 Nedir?</h2>
<p>ISO 22301, İş Sürekliliği Yönetim Sistemi (BCMS — Business Continuity Management System) için uluslararası gereksinimleri tanımlayan standarttır. Sel, deprem, siber saldırı, pandemi veya kritik tedarikçi kaybı gibi yıkıcı olaylar karşısında kurumun hayatta kalmasını ve operasyonlarını sürdürmesini güvence altına almak amacıyla tasarlanmıştır.</p>

<h2>Temel Kavramlar</h2>
<ul>
  <li><strong>BIA (Business Impact Analysis — İş Etkisi Analizi):</strong> Her iş sürecinin kesintiye uğraması durumundaki mali, operasyonel ve itibar etkisini sayısal olarak ortaya koyar. Hangi süreçlerin önce kurtarılacağına bu analiz karar verir.</li>
  <li><strong>MTPD (Maximum Tolerable Period of Disruption):</strong> Bir sürecin kesintiye uğrayabileceği maksimum kabul edilebilir süre. Aşılırsa kurum için geri dönüşü zor sonuçlar doğar.</li>
  <li><strong>RTO (Recovery Time Objective):</strong> Kesinti sonrasında sistemin hedef sürede yeniden devreye alınması.</li>
  <li><strong>RPO (Recovery Point Objective):</strong> Veri kurtarmada kabul edilen maksimum veri kaybı süresi.</li>
  <li><strong>MBCO (Minimum Business Continuity Objective):</strong> Kabul edilebilir minimum hizmet düzeyi; tam kapasite yerine hayatta kalma için yeterli seviye.</li>
</ul>

<h2>ISO 22301 Uygulama Aşamaları</h2>
<ul>
  <li><strong>1. Kapsam Belirleme:</strong> Hangi lokasyonlar, süreçler ve hizmetler BCMS kapsamına alınacak? Kritik ürün ve hizmetler öncelikli olarak seçilir.</li>
  <li><strong>2. Risk Değerlendirme:</strong> Olası tehditler (doğal afet, siber saldırı, tedarik zinciri kesintisi) ve bunların gerçekleşme olasılığı ile etkisi değerlendirilir.</li>
  <li><strong>3. BIA Yürütme:</strong> Her kritik süreç için MTPD, RTO ve RPO değerleri belirlenir; kaynaklar (insan, sistem, tesis) eşlenir.</li>
  <li><strong>4. Sürekliliği Stratejileri Geliştirme:</strong> Her kritik süreç için alternatif çalışma yöntemi tanımlanır (ikincil site, bulut yedek, manuel süreç vb.).</li>
  <li><strong>5. BCP Planları Hazırlama:</strong> İş Sürekliliği Planı (BCP), Felaket Kurtarma Planı (DRP) ve Kriz İletişim Planı yazılır.</li>
  <li><strong>6. Test ve Tatbikat:</strong> Masa başı tatbikatı, fonksiyonel test ve tam ölçekli tatbikatla planların işlerliği doğrulanır.</li>
  <li><strong>7. Sürekli İyileştirme:</strong> Tatbikat sonuçları, gerçek olaylar ve değişen iş gereksinimleri doğrultusunda planlar güncellenir.</li>
</ul>

<h2>İş Sürekliliği Stratejileri</h2>
<ul>
  <li><strong>Hot Site:</strong> Hazır ekipman ve güncel veriyle ikincil tesis; en hızlı devreye alma (dakikalar). En yüksek maliyet.</li>
  <li><strong>Warm Site:</strong> Ekipman hazır ama veri senkronizasyonu periyodik; devreye alma süresi saatler. Orta maliyet.</li>
  <li><strong>Cold Site:</strong> Fiziksel alan hazır, ekipman kurulmamış; günler içinde devreye alınır. En düşük maliyet.</li>
  <li><strong>Cloud DR:</strong> Bulut tabanlı ikincil altyapı; esnek ölçekleme, düşük sabit maliyet. Azure Site Recovery, AWS Elastic Disaster Recovery.</li>
</ul>

<h2>Test Türleri</h2>
<ul>
  <li><strong>Masa Başı Tatbikatı (Tabletop Exercise):</strong> Senaryolar üzerinden tartışma; sistemler gerçekten kapatılmaz. En az maliyetli test.</li>
  <li><strong>Fonksiyonel Test:</strong> Belirli süreçler gerçek koşullarda test edilir (örn. yedekten geri yükleme).</li>
  <li><strong>Kesintisiz Sürekliliği Testi:</strong> Tam ölçekli tatbikat; üretim sistemleri gerçekten devredışı bırakılarak ikincil altyapıya geçilir. En kapsamlı ve maliyetli test.</li>
</ul>

<h2>ISO 27001 ile İlişkisi</h2>
<p>ISO 22301 ve ISO 27001 birbirini tamamlar. ISO 27001'in Ek A'sında yer alan "Bilgi Güvenliği Sürekliliği" kontrolleri (A.17) doğrudan ISO 22301 ile örtüşür. Birlikte uygulanan kuruluşlar hem bilgi güvenliği hem de operasyonel dayanıklılık açısından güçlü bir çerçeveye sahip olur.</p>

<h2>Sonuç</h2>
<p>ISO 22301, bir felaket senaryosunda kurumun ayakta kalmasını planlı ve test edilmiş biçimde güvence altına alır. Lider Network, BIA yürütme, DR planı hazırlama ve tatbikat organizasyonu konularında danışmanlık hizmeti sunmaktadır.</p>
    `,
  },
  {
    slug: "iso-20000-it-servis-yonetimi-standardi",
    title: "ISO 20000: IT Servis Yönetimi Standardı ve ITIL ile İlişkisi",
    excerpt:
      "ISO/IEC 20000, IT hizmet yönetimi için uluslararası standarttır. Servis kataloğu, SLA yönetimi, değişiklik ve olay yönetimi süreçlerini ve ITIL v4 ile uyumunu ele alıyoruz.",
    category: "iso-uyumluluk",
    categoryColor: "#6366f1",
    tags: ["ISO 20000", "ITSM", "ITIL", "SLA", "Servis Yönetimi", "IT"],
    publishedAt: "2026-05-20",
    readTime: 6,
    content: `
<h2>ISO/IEC 20000 Nedir?</h2>
<p>ISO/IEC 20000, IT hizmet yönetim sisteminin (ITSM) kurulumu, uygulanması ve sürekli iyileştirilmesi için uluslararası gereksinimleri tanımlayan standarttır. 2018 yılında güncellenen ISO/IEC 20000-1:2018 sürümü, ISO'nun Yüksek Seviye Yapısına (HLS) uyumludur; bu sayede ISO 27001 ve ISO 22301 ile entegre yönetim sistemi kurulabilir.</p>

<h2>Neden ISO 20000?</h2>
<ul>
  <li>IT hizmetlerinin tutarlı ve ölçülebilir kalitede sunulduğunu kanıtlar.</li>
  <li>Müşteri ve hizmet kullanıcısı memnuniyetini artırır.</li>
  <li>MSP (Managed Service Provider) ve teknoloji şirketleri için rekabetçi farklılaştırıcıdır.</li>
  <li>Olay yönetimi, değişiklik yönetimi ve kapasite yönetimi süreçlerini standardize eder.</li>
</ul>

<h2>Temel Süreçler</h2>
<ul>
  <li><strong>Servis Kataloğu Yönetimi:</strong> Sunulan tüm IT hizmetlerinin açıklaması, SLA koşulları ve sorumluları tanımlanır.</li>
  <li><strong>SLA Yönetimi:</strong> Müşteri ile hizmet seviyesi anlaşmaları (SLA) ve iç operasyonel anlaşmalar (OLA) izlenir; raporlanır.</li>
  <li><strong>Olay Yönetimi (Incident Management):</strong> Hizmet kesintilerini en kısa sürede çözüme kavuşturma süreci. Önceliklendirme, eskalasyon ve kapatma adımlarını kapsar.</li>
  <li><strong>Problem Yönetimi:</strong> Tekrar eden olayların kök nedenini araştırarak kalıcı çözüm üretir. Bilinen Hata Veritabanı (KEDB) tutulur.</li>
  <li><strong>Değişiklik Yönetimi:</strong> IT altyapısındaki değişikliklerin risk değerlendirmesi yapılarak kontrollü biçimde hayata geçirilmesi.</li>
  <li><strong>Konfigürasyon Yönetimi (CMDB):</strong> Tüm IT varlıklarının ve aralarındaki ilişkilerin merkezi veritabanı.</li>
  <li><strong>Kapasite Yönetimi:</strong> Mevcut ve gelecekteki hizmet talebini karşılayacak kapasiteyi planlama.</li>
  <li><strong>Süreklilik ve Uygunluk:</strong> ISO 22301 ile entegre iş sürekliliği planlaması.</li>
</ul>

<h2>ISO 20000 ve ITIL v4 İlişkisi</h2>
<p>ISO 20000, <em>ne</em> yapılması gerektiğini tanımlarken ITIL v4 <em>nasıl</em> yapılacağına dair best-practice rehberlik sunar. İkisi birbirinin rakibi değil, tamamlayıcısıdır:</p>
<ul>
  <li>ITIL v4 Dört Boyut Modeli (ürünler ve hizmetler, insanlar ve organizasyon, değer akışları, ortaklar ve tedarikçiler), ISO 20000 gereksinimlerini karşılamak için pratik bir çerçeve sunar.</li>
  <li>ITIL Hizmet Değer Sistemi (SVS), ISO 20000'in süreç gereksinimlerini destekler.</li>
  <li>ITIL 4 Foundation sertifikası, ISO 20000 uyum çalışmalarını hızlandırır.</li>
</ul>

<h2>SLA Tasarımı ve KPI'lar</h2>
<p>Başarılı ISO 20000 uyumu için ölçülebilir SLA'ların tanımlanması gerekir:</p>
<ul>
  <li><strong>Kullanılabilirlik (Availability):</strong> %99,9 gibi yıllık hizmet süresi hedefi.</li>
  <li><strong>Olay Yanıt Süresi:</strong> Kritik olaylar için 15 dakika, yüksek öncelikli için 1 saat yanıt.</li>
  <li><strong>Olay Çözüm Süresi:</strong> Kritik P1 için 4 saat, P2 için 8 iş saati.</li>
  <li><strong>Değişiklik Başarı Oranı:</strong> Geri alma gerektirmeyen başarılı değişiklik yüzdesi.</li>
</ul>

<h2>Sonuç</h2>
<p>ISO 20000, IT hizmet kalitesini ölçülebilir ve sürdürülebilir bir çerçeveye oturtarak müşteri güvenini artırır. Lider Network, servis kataloğu tasarımı, ITSM araç seçimi ve ISO 20000 uyum danışmanlığında hizmet sunmaktadır.</p>
    `,
  },
  {
    slug: "iso-27701-gizlilik-bilgi-yonetimi-gdpr-kvkk-uyumu",
    title: "ISO 27701: Gizlilik Bilgi Yönetimi ve GDPR/KVKK Uyumu",
    excerpt:
      "ISO 27701, ISO 27001'i gizlilik yönetimi boyutuyla genişleten standarttır. GDPR ve KVKK gereksinimlerini karşılamak için nasıl kullanılacağını ve veri koruma rolleri olan veri sorumlusu ile işleyeni nasıl desteklediğini anlatıyoruz.",
    category: "iso-uyumluluk",
    categoryColor: "#6366f1",
    tags: ["ISO 27701", "GDPR", "KVKK", "Gizlilik", "PII", "Veri Koruma"],
    publishedAt: "2026-05-19",
    readTime: 6,
    content: `
<h2>ISO 27701 Nedir?</h2>
<p>ISO/IEC 27701:2019, ISO 27001 ve ISO 27002 standartlarını <strong>Kişisel Olarak Tanımlanabilir Bilgi (PII — Personally Identifiable Information)</strong> yönetimi perspektifinden genişleten bir uzantı standarttır. Doğrudan ISO 27001 sertifikasının üzerine inşa edilir; bağımsız bir sertifika değil, ek bir katman olarak konumlanır.</p>
<p>GDPR, KVKK ve benzeri gizlilik düzenlemelerine uyumun kanıtlanması için güçlü bir çerçeve sunar.</p>

<h2>ISO 27001 ile Farkı</h2>
<ul>
  <li>ISO 27001 bilgi güvenliğini (gizlilik, bütünlük, erişilebilirlik) kapsar.</li>
  <li>ISO 27701, bu üç boyuta ek olarak <strong>mahremiyet (privacy)</strong> boyutunu ekler ve PII'nin korunmasına odaklanır.</li>
  <li>Kuruluş, önce ISO 27001 sertifikasına sahip olmalı ya da aynı anda iki standardı birlikte uygulayabilir.</li>
</ul>

<h2>Veri Sorumlusu ve Veri İşleyen Kontrolleri</h2>
<p>Standart, iki farklı rol için ayrı kontrol setleri içerir:</p>
<p><strong>Veri Sorumlusu (Controller) Kontrolleri:</strong></p>
<ul>
  <li>PII toplamanın sınırlandırılması ve amaçla orantılılık</li>
  <li>Açık rıza mekanizmasının kurulması</li>
  <li>Veri sahibinin haklarını kullanmasını sağlayan prosedürler</li>
  <li>PII aktarımında uygun güvenceler</li>
</ul>
<p><strong>Veri İşleyen (Processor) Kontrolleri:</strong></p>
<ul>
  <li>Veri sorumlusunun talimatları dışında işlem yapmama</li>
  <li>Alt yüklenicilerin denetlenmesi</li>
  <li>Veri sorumlusuna işleme faaliyetleri hakkında raporlama</li>
</ul>

<h2>GDPR ile Eşleştirme</h2>
<p>ISO 27701'in Ek D'si, kontrolleri GDPR maddeleriyle eşleştirir. Bu eşleştirme sayesinde:</p>
<ul>
  <li>ISO 27701 denetimi, GDPR uyumunun kanıtı olarak kullanılabilir.</li>
  <li>DPA (Data Protection Authority) denetimleri için güçlü bir belgelendirme altyapısı oluşturulur.</li>
  <li>Veri Koruma Etki Değerlendirmesi (DPIA) gereksinimleri sistematik biçimde karşılanır.</li>
</ul>

<h2>KVKK ile Uyum</h2>
<p>ISO 27701, KVKK'nın gerektirdiği teknik ve idari tedbirleri sistematik biçimde belgelemek için kullanılabilir:</p>
<ul>
  <li>Kişisel veri envanteri ve veri akışı haritalama</li>
  <li>Veri sahibi talep yönetimi prosedürleri</li>
  <li>Üçüncü taraf (veri işleyen) sözleşmelerinin yönetimi</li>
  <li>VERBİS kaydı için gerekli bilgilerin sistematik toplanması</li>
</ul>

<h2>Sertifikasyon Süreci</h2>
<ul>
  <li>ISO 27001 denetimcisi, ek olarak ISO 27701 gereksinimlerini de denetler.</li>
  <li>Tek bir denetimle hem ISO 27001 hem ISO 27701 sertifikası alınabilir.</li>
  <li>Her iki sertifikanın gözetim ve yenileme döngüleri senkronize çalışır.</li>
</ul>

<h2>Sonuç</h2>
<p>ISO 27701, gizlilik yönetimini bilgi güvenliği yönetim sisteminizin ayrılmaz bir parçası haline getirir ve KVKK/GDPR uyumunu bağımsız denetimle kanıtlar. Lider Network, ISO 27701 hazırlık analizi ve uyum danışmanlığında hizmet sunmaktadır.</p>
    `,
  },
  {
    slug: "pci-dss-nedir-odeme-karti-guvenligi-standardi",
    title: "PCI DSS Nedir? Ödeme Kartı Güvenliği Standardı Rehberi",
    excerpt:
      "PCI DSS (Payment Card Industry Data Security Standard), kredi ve banka kartı verilerini işleyen tüm kuruluşları kapsayan güvenlik standardıdır. 12 gereksinim, uyumluluk seviyeleri ve sızma testi zorunluluklarını ele alıyoruz.",
    category: "iso-uyumluluk",
    categoryColor: "#6366f1",
    tags: ["PCI DSS", "Ödeme Kartı", "Kart Güvenliği", "SAQ", "QSA", "Sızma Testi"],
    publishedAt: "2026-05-19",
    readTime: 7,
    content: `
<h2>PCI DSS Nedir?</h2>
<p>PCI DSS (Payment Card Industry Data Security Standard), Visa, Mastercard, American Express, Discover ve JCB tarafından kurulan <strong>Ödeme Kartı Endüstrisi Güvenlik Standartları Konseyi (PCI SSC)</strong> tarafından yayımlanan güvenlik standardıdır. Kart sahibi verilerini (CHD — Cardholder Data) işleyen, saklayan veya ileten tüm kuruluşlar için uyumluluk zorunludur.</p>
<p>2022 yılında yayımlanan <strong>PCI DSS v4.0</strong>, sıfır güven mimarisi ve bulut ortamlarına yönelik güncellemeler içermektedir.</p>

<h2>Kapsam: Hangi Veriler Korunmalı?</h2>
<ul>
  <li><strong>PAN (Primary Account Number):</strong> Kart üzerindeki 16 haneli numara — en kritik veri.</li>
  <li><strong>Kart Sahibi Adı, Son Kullanma Tarihi, Hizmet Kodu:</strong> PAN ile birlikte saklandığında kapsam dahilinde.</li>
  <li><strong>CAV2/CVV2/CVC2/CID:</strong> Kartın arka yüzündeki güvenlik kodu — <strong>kesinlikle saklanamaz.</strong></li>
  <li><strong>PIN ve PIN Bloğu:</strong> Kesinlikle şifresiz saklanamaz.</li>
</ul>

<h2>12 PCI DSS Gereksinimi</h2>
<ul>
  <li><strong>1.</strong> Ağ güvenlik kontrollerinin kurulması ve sürdürülmesi (firewall, segmentasyon)</li>
  <li><strong>2.</strong> Satıcı varsayılan şifrelerin değiştirilmesi ve gereksiz servislerin kapatılması</li>
  <li><strong>3.</strong> Saklanan kart sahibi verilerinin korunması (şifreleme, maskeleme, token)</li>
  <li><strong>4.</strong> Açık ağlarda iletilen verilerin şifrelenmesi (TLS 1.2+)</li>
  <li><strong>5.</strong> Tüm sistemlerin zararlı yazılıma karşı korunması</li>
  <li><strong>6.</strong> Güvenli sistem ve yazılımların geliştirilmesi ve sürdürülmesi</li>
  <li><strong>7.</strong> Kart sahibi verilerine erişimin iş gereksinimine göre kısıtlanması</li>
  <li><strong>8.</strong> Kullanıcı tanımlama ve kimlik doğrulamanın yönetimi (MFA zorunluluğu)</li>
  <li><strong>9.</strong> Kart sahibi verilerine fiziksel erişimin kısıtlanması</li>
  <li><strong>10.</strong> Ağ kaynaklarına ve kart sahibi verilerine erişimin log kaydı ve izlenmesi</li>
  <li><strong>11.</strong> Güvenlik sistemlerinin ve süreçlerinin düzenli test edilmesi (sızma testi, zafiyet taraması)</li>
  <li><strong>12.</strong> Bilgi güvenliği politikasının tüm personel için sürdürülmesi</li>
</ul>

<h2>Uyumluluk Seviyeleri (SAQ vs ROC)</h2>
<p>Uyumluluk seviyesi, yıllık işlem hacmine göre belirlenir:</p>
<ul>
  <li><strong>Level 1:</strong> Yılda 6 milyondan fazla kart işlemi. Akredite QSA (Qualified Security Assessor) tarafından yıllık ROC (Report on Compliance) denetimi zorunludur.</li>
  <li><strong>Level 2:</strong> 1–6 milyon işlem. Yıllık öz değerlendirme (SAQ) ve üç ayda bir zafiyet taraması.</li>
  <li><strong>Level 3:</strong> 20.000–1 milyon e-ticaret işlemi. Yıllık SAQ ve üç aylık tarama.</li>
  <li><strong>Level 4:</strong> Yılda 20.000'den az e-ticaret işlemi. Yıllık SAQ önerilir.</li>
</ul>

<h2>Sızma Testi Zorunluluğu</h2>
<p>PCI DSS, yılda en az bir kez ve önemli altyapı değişikliklerinin ardından sızma testi yapılmasını zorunlu kılar:</p>
<ul>
  <li>Uygulama katmanı (web, mobil) ve ağ katmanı sızma testi ayrı ayrı yapılmalıdır.</li>
  <li>Test kapsamı, kart sahibi veri ortamını (CDE) ve ona bağlı sistemleri içermelidir.</li>
  <li>Segmentasyon kontrolleri (CDE'yi izole eden sistemler) de test edilmelidir.</li>
</ul>

<h2>Tokenizasyon ve Şifreleme</h2>
<p>PCI DSS kapsamını daraltmanın en etkili yolu, kart verisiyle temas noktalarını azaltmaktır:</p>
<ul>
  <li><strong>Tokenizasyon:</strong> Gerçek kart numarası yerine anlamsız bir token saklanır; token çalınsa dahi kullanılamaz.</li>
  <li><strong>P2PE (Point-to-Point Encryption):</strong> Kart verisini okuma noktasından itibaren şifreleyerek yalnızca ödeme işlemcisine açık tutar. PCI onaylı P2PE çözümü uyumluluk kapsamını dramatik biçimde daraltır.</li>
</ul>

<h2>Sonuç</h2>
<p>PCI DSS uyumu, ödeme kartı verilerini işleyen her kuruluş için yasal değil ama sözleşmeden doğan zorunluluktur; uyumsuzluk halinde kart markaları tarafından ağır para cezası uygulanabilir. Lider Network, PCI DSS gap analizi, ağ segmentasyonu ve sızma testi süreçlerinde danışmanlık hizmeti sunmaktadır.</p>
    `,
  },
  {
    slug: "bilgi-guvenligi-politikasi-nasil-hazirlanir",
    title: "Bilgi Güvenliği Politikası Nasıl Hazırlanır? Kurumsal Rehber",
    excerpt:
      "Bilgi güvenliği politikası, ISO 27001'in temel belgelerinden biridir. Politika yapısı, kabul edilebilir kullanım, erişim kontrolü, şifreleme ve olay yönetimi politikalarının nasıl hazırlanacağını adım adım anlatıyoruz.",
    category: "iso-uyumluluk",
    categoryColor: "#6366f1",
    tags: ["Bilgi Güvenliği", "Politika", "ISO 27001", "Kabul Edilebilir Kullanım", "Prosedür"],
    publishedAt: "2026-05-18",
    readTime: 6,
    content: `
<h2>Bilgi Güvenliği Politikası Nedir?</h2>
<p>Bilgi güvenliği politikası, bir kuruluşun bilgi varlıklarını korumaya yönelik üst düzey taahhüdünü, hedeflerini ve genel çerçevesini tanımlayan belgedir. ISO 27001'in <strong>zorunlu belgelerinden biridir</strong>; üst yönetim tarafından onaylanmış ve tüm personele duyurulmuş olması gerekir.</p>

<h2>Politika Hiyerarşisi</h2>
<ul>
  <li><strong>Seviye 1 — Ana Politika:</strong> Üst düzey taahhüt ve prensipler. Kısa, sade ve tüm çalışanların anlayacağı dilde yazılır.</li>
  <li><strong>Seviye 2 — Konu Bazlı Politikalar:</strong> Erişim kontrolü, şifreleme, fiziksel güvenlik gibi konulara özgü kurallar.</li>
  <li><strong>Seviye 3 — Prosedürler:</strong> Politikaları hayata geçiren adım adım talimatlar. Teknik ekibe yöneliktir.</li>
  <li><strong>Seviye 4 — İş Talimatları ve Formlar:</strong> Belirli görevler için detaylı yönergeler ve kayıt formları.</li>
</ul>

<h2>Ana Bilgi Güvenliği Politikasında Olması Gerekenler</h2>
<ul>
  <li>Politikanın amacı ve kapsamı</li>
  <li>Üst yönetimin bilgi güvenliğine taahhüdü</li>
  <li>Bilgi güvenliği hedefleri ve temel prensipleri (gizlilik, bütünlük, erişilebilirlik)</li>
  <li>Bilgi güvenliği sorumluluklarının atanması</li>
  <li>İhlal durumunda uygulanacak disiplin sürecine atıf</li>
  <li>İlgili mevzuata ve standartlara uyum taahhüdü (KVKK, ISO 27001)</li>
  <li>Gözden geçirme periyodu (genellikle yılda bir)</li>
</ul>

<h2>Temel Konu Bazlı Politikalar</h2>
<p><strong>Kabul Edilebilir Kullanım Politikası (AUP):</strong></p>
<ul>
  <li>Kurumsal cihaz ve internet erişiminin kabul edilebilir kullanım sınırları</li>
  <li>Kişisel kullanım için kurumsal kaynakların ne ölçüde kullanılabileceği</li>
  <li>Sosyal medya, bulut depolama ve harici depolama aygıtlarına ilişkin kurallar</li>
</ul>
<p><strong>Erişim Kontrolü Politikası:</strong></p>
<ul>
  <li>En az ayrıcalık ilkesi — kullanıcılara yalnızca ihtiyaç duydukları erişim hakkı verilir</li>
  <li>Ayrıcalıklı hesap (admin) yönetimi kuralları</li>
  <li>Kullanıcı hesap yaşam döngüsü (oluşturma, revize, silme)</li>
</ul>
<p><strong>Şifre ve Kimlik Doğrulama Politikası:</strong></p>
<ul>
  <li>Minimum şifre uzunluğu ve karmaşıklık gereksinimleri</li>
  <li>Çok faktörlü kimlik doğrulama (MFA) zorunlulukları</li>
  <li>Şifre paylaşımının yasak olduğuna dair açık hüküm</li>
</ul>
<p><strong>Veri Sınıflandırma Politikası:</strong></p>
<ul>
  <li>Gizli, Dahili, Genel gibi sınıflandırma seviyeleri tanımlanır</li>
  <li>Her seviye için etiketleme, saklama ve imha kuralları belirlenir</li>
</ul>
<p><strong>Uzaktan Çalışma ve Mobil Cihaz Politikası:</strong></p>
<ul>
  <li>Ev ağından kurumsal sistemlere erişim için VPN zorunluluğu</li>
  <li>Ekran kilidi, cihaz şifreleme ve kayıp/çalıntı cihaz bildirim prosedürü</li>
</ul>

<h2>Politika Yaşam Döngüsü</h2>
<ul>
  <li><strong>Taslak:</strong> Konuya hâkim ekip tarafından yazılır.</li>
  <li><strong>Gözden Geçirme:</strong> IT, hukuk ve üst yönetim incelemesi.</li>
  <li><strong>Onay:</strong> Üst yönetim imzası veya yönetim kurulu kararı.</li>
  <li><strong>Yayın ve Duyuru:</strong> Tüm çalışanlara duyurulur; okudum-anladım formu imzalatılır.</li>
  <li><strong>Eğitim:</strong> Farkındalık eğitimleriyle desteklenir.</li>
  <li><strong>Periyodik Gözden Geçirme:</strong> Yılda en az bir kez veya önemli değişiklik anında.</li>
</ul>

<h2>Sonuç</h2>
<p>İyi hazırlanmış bir bilgi güvenliği politikası seti, ISO 27001 denetiminin temel belgelerini oluşturur ve kurumsal güvenlik kültürünün inşasında belirleyici rol oynar. Lider Network, politika yazımı, gözden geçirme ve personel eğitimi konularında danışmanlık hizmeti sunmaktadır.</p>
    `,
  },

  // ─── AĞ & GÜVENLİK TEMELLERİ ─────────────────────────────────────────────
  {
    slug: "lan-wan-vlan-nedir-ag-temelleri-rehberi",
    title: "LAN, WAN, VLAN Nedir? Ağ Temelleri Kapsamlı Rehberi",
    excerpt:
      "LAN, WAN, VLAN ve DMZ gibi ağ kavramları kurumsal altyapının temel taşlarıdır. Firewall üzerindeki ağ bölgelerini, VLAN tasarımını ve güvenli ağ segmentasyonunu detaylıca açıklıyoruz.",
    category: "network-temelleri",
    categoryColor: "#0ea5e9",
    tags: ["LAN", "WAN", "VLAN", "DMZ", "Ağ Segmentasyonu", "Firewall"],
    publishedAt: "2026-05-21",
    readTime: 8,
    content: `
<h2>LAN Nedir? (Local Area Network)</h2>
<p>LAN (Yerel Alan Ağı), sınırlı bir coğrafi alanda — bir bina, kat ya da ofis içinde — bilgisayarları ve cihazları birbirine bağlayan ağdır. Ethernet kablosu veya Wi-Fi üzerinden çalışır; yüksek hız (1 Gbps–10 Gbps) ve düşük gecikme sağlar.</p>
<p>Kurumsal ortamda LAN, switch'ler aracılığıyla oluşturulan ve genellikle 192.168.x.x veya 10.x.x.x IP aralıklarını kullanan iç ağdır. Firewall'ın <strong>LAN veya INTERNAL arayüzü</strong> bu ağa bağlıdır.</p>

<h2>WAN Nedir? (Wide Area Network)</h2>
<p>WAN (Geniş Alan Ağı), coğrafi olarak birbirinden uzak ağları birbirine bağlar. İnternet en büyük WAN örneğidir; şirket merkezi ile şubeler arasındaki MPLS veya VPN bağlantıları da WAN kapsamındadır.</p>
<p>Firewall'ın <strong>WAN arayüzü</strong>, İSS (İnternet Servis Sağlayıcısı) tarafından atanan genel (public) IP adresini taşır ve internete açılan kapıdır.</p>

<h2>INTERNAL / LAN Arayüzü — Firewall'da Ne İfade Eder?</h2>
<p>Kurumsal firewall'larda (FortiGate dahil) arayüzler mantıksal bölgelere (zone) atanır:</p>
<ul>
  <li><strong>WAN (port1/wan1):</strong> İnternet bağlantısı — güvenilmez, en kısıtlı bölge.</li>
  <li><strong>LAN / INTERNAL (port2/internal):</strong> Kurumun iç ağı — güvenilir kullanıcılar ve sunucular. Genellikle internet çıkışına izin verilir, dışarıdan erişim kısıtlıdır.</li>
  <li><strong>DMZ (Demilitarized Zone):</strong> İnternete açık sunucuların (web, mail, FTP) bulunduğu ara bölge. Ne iç ağ kadar güvenilir ne de internet kadar açık.</li>
  <li><strong>GUEST:</strong> Misafir Wi-Fi ağı — internet erişimi var, iç ağa erişim yok.</li>
</ul>

<h2>VLAN Nedir? (Virtual Local Area Network)</h2>
<p>VLAN, fiziksel ağ altyapısında mantıksal olarak ayrılmış sanal ağ segmentleridir. Aynı fiziksel switch'e bağlı cihazlar, farklı VLAN'lara atanarak birbirini göremez hale getirilir.</p>
<p><strong>VLAN'ların Faydaları:</strong></p>
<ul>
  <li><strong>Güvenlik:</strong> Muhasebe sunucularını, IP kameraları ve misafir ağını birbirinden ayırır. Bir VLAN'da yaşanan güvenlik olayı diğerlerine sıçramaz.</li>
  <li><strong>Performans:</strong> Broadcast trafiği her VLAN içinde sınırlı kalır; tüm ağa yayılmaz. Broadcast fırtınası riski azalır.</li>
  <li><strong>Yönetilebilirlik:</strong> Departman bazlı politika uygulamak kolaylaşır. IT, Muhasebe, Üretim, Misafir VLAN'ları bağımsız yönetilir.</li>
  <li><strong>Ölçeklendirme:</strong> Yeni bir bölüm veya lokasyon eklemek fiziksel kablo çekmeden mantıksal VLAN oluşturmayla mümkündür.</li>
</ul>

<h2>VLAN Nasıl Çalışır?</h2>
<p>VLAN'lar, IEEE 802.1Q standardını kullanır. Switch portları iki modda yapılandırılır:</p>
<ul>
  <li><strong>Access Port:</strong> Bilgisayar, yazıcı gibi son cihazlara bağlanır. Yalnızca tek bir VLAN'a aittir; cihaz VLAN varlığından habersizdir.</li>
  <li><strong>Trunk Port:</strong> Switch-switch veya switch-firewall arasındaki bağlantı. Birden fazla VLAN trafiğini 802.1Q etiketi (tag) ile taşır.</li>
</ul>
<p>Firewall üzerinde VLAN sub-interface'ler oluşturularak her VLAN için ayrı IP, DHCP ve politika tanımlanabilir. FortiGate'de bu yapılandırma <code>config system interface</code> → type: vlan altında yapılır.</p>

<h2>Tipik Kurumsal VLAN Tasarımı</h2>
<ul>
  <li>VLAN 10 — Yönetim (172.16.10.0/24): Sunucular, ağ ekipmanları yönetim IP'leri</li>
  <li>VLAN 20 — Kullanıcılar (192.168.20.0/24): Masaüstü bilgisayarlar, dizüstü</li>
  <li>VLAN 30 — Sunucular (10.10.30.0/24): Domain controller, dosya sunucusu, ERP</li>
  <li>VLAN 40 — VoIP (10.10.40.0/24): IP telefonlar — QoS ve SIP ALG için ayrı segment</li>
  <li>VLAN 50 — Misafir (192.168.50.0/24): Yalnızca internet erişimi</li>
  <li>VLAN 60 — IoT/Kamera (10.10.60.0/24): IP kameralar, akıllı cihazlar — en kısıtlı</li>
</ul>

<h2>DMZ Nedir ve Ne Zaman Kullanılır?</h2>
<p>DMZ (Demilitarized Zone), internete doğrudan hizmet veren sunucuların konumlandırıldığı ağ bölgesidir. Firewall, DMZ'ye gelen trafiği denetler:</p>
<ul>
  <li>İnternetten DMZ'ye → Yalnızca yayımlanan servislere izin (HTTP/443, SMTP/25)</li>
  <li>DMZ'den iç ağa → En kısıtlı politika; yalnızca zorunlu veri tabanı bağlantısı</li>
  <li>İç ağdan DMZ'ye → Yönetim erişimi için kontrollü izin</li>
</ul>

<h2>Sonuç</h2>
<p>LAN, WAN ve VLAN kavramlarını doğru anlamak, güvenli ve ölçeklenebilir ağ tasarımının temelidir. Lider Network, ağ segmentasyon tasarımı ve FortiGate VLAN yapılandırması konularında hizmetinizdedir.</p>
    `,
  },
  {
    slug: "mac-adresi-nedir-nasil-calisir",
    title: "MAC Adresi Nedir? Fiziksel Adres ve Ağ Kimliği Rehberi",
    excerpt:
      "MAC adresi, her ağ cihazına üreticide atanan benzersiz fiziksel tanımlayıcıdır. Yapısı, IP adresiyle farkı, MAC filtreleme ve güvenlik uygulamaları bu makalede.",
    category: "network-temelleri",
    categoryColor: "#0ea5e9",
    tags: ["MAC Adresi", "Fiziksel Adres", "ARP", "MAC Filtreleme", "Ağ"],
    publishedAt: "2026-05-20",
    readTime: 5,
    content: `
<h2>MAC Adresi Nedir?</h2>
<p>MAC (Media Access Control) adresi, her ağ arayüz kartına (NIC) üretici tarafından kalıcı olarak atanan <strong>48 bitlik benzersiz fiziksel tanımlayıcıdır</strong>. Genellikle <code>00:1A:2B:3C:4D:5E</code> veya <code>00-1A-2B-3C-4D-5E</code> biçiminde onaltılık (hexadecimal) gösterilir.</p>

<h2>MAC Adresi Yapısı</h2>
<ul>
  <li><strong>İlk 3 oktet (OUI — Organizationally Unique Identifier):</strong> Üreticiyi tanımlar. Örneğin <code>00:1A:2B</code> belirli bir üreticiye aittir. IEEE tarafından tahsis edilir.</li>
  <li><strong>Son 3 oktet:</strong> Üreticinin kendi belirlediği seri numarası — her cihaz için benzersizdir.</li>
</ul>

<h2>MAC Adresi vs IP Adresi</h2>
<ul>
  <li><strong>MAC Adresi</strong> → Layer 2 (Veri Bağlantısı katmanı) — yerel ağ içinde çalışır, sabit (donanıma yazılı).</li>
  <li><strong>IP Adresi</strong> → Layer 3 (Ağ katmanı) — yönlendirme ve ağlar arası iletişim için kullanılır, değişebilir.</li>
  <li>Paket yerel ağda gönderilirken hedefin MAC adresine ihtiyaç duyulur; ARP (Address Resolution Protocol) bu dönüşümü sağlar.</li>
</ul>

<h2>ARP — MAC ve IP'yi Birleştiren Protokol</h2>
<p>Bir cihaz aynı ağdaki başka bir cihaza veri göndermek istediğinde IP adresini bilir ama MAC adresini bilmez. ARP bu sorunu çözer:</p>
<ul>
  <li>Kaynak cihaz ağa <strong>ARP Broadcast</strong> gönderir: "192.168.1.100 IP adresine sahip cihaz, MAC adresini bildirir misin?"</li>
  <li>Hedef cihaz <strong>ARP Reply</strong> ile kendi MAC adresini döndürür.</li>
  <li>Kaynak, bu bilgiyi ARP önbelleğinde saklar; tekrar ARP yapmadan iletişim sürer.</li>
</ul>
<p><strong>ARP Spoofing/Poisoning:</strong> Saldırgan sahte ARP yanıtlarıyla ağ trafiğini üzerine yönlendirebilir (Man-in-the-Middle). Bu nedenle kurumsal switch'lerde <strong>Dynamic ARP Inspection (DAI)</strong> etkinleştirilmesi önerilir.</p>

<h2>MAC Filtreleme</h2>
<p>Wi-Fi erişim noktalarında ve bazı switch'lerde, yalnızca tanımlı MAC adreslerine ağ erişimi izni verilebilir. Ancak dikkat edilmesi gereken sınırlılıklar şunlardır:</p>
<ul>
  <li>MAC adresleri yazılımsal olarak değiştirilebilir (MAC spoofing); bu nedenle MAC filtreleme tek başına güvenlik önlemi değildir.</li>
  <li>Kurumsal ortamlarda MAC filtreleme yerine <strong>802.1X port kimlik doğrulaması</strong> (RADIUS sunucu + sertifika/kullanıcı adı) tercih edilmelidir.</li>
</ul>

<h2>Firewall ve Switch'te MAC Adresinin Rolü</h2>
<ul>
  <li><strong>MAC Adres Tablosu (CAM Table):</strong> Switch, hangi MAC adresinin hangi porta bağlı olduğunu bu tabloda saklar. Bilinmeyen MAC adresleri için trafik tüm portlara gönderilir (flood).</li>
  <li><strong>FortiGate'de MAC Adresi Kullanımı:</strong> DHCP rezervasyonu (belirli MAC'e sabit IP atama), güvenlik politikalarında kaynak MAC eşleştirme ve MAC tabanlı kimlik doğrulama.</li>
  <li><strong>MAC Adresine Göre DHCP Rezervasyonu:</strong> Yazıcı, sunucu veya IP kamera gibi cihazlara sabit IP vermek için DHCP sunucusunda MAC rezervasyonu yapılır; IP değişimi engellenir.</li>
</ul>

<h2>Sonuç</h2>
<p>MAC adresi, yerel ağ iletişiminin temel taşıdır. Güvenlik açısından ARP Inspection ve 802.1X kimlik doğrulaması ile desteklenmesi önerilir. Lider Network, ağ güvenliği tasarımı ve FortiGate yapılandırması konularında hizmetinizdedir.</p>
    `,
  },
  {
    slug: "vpn-nedir-ipsec-ssl-vpn-karsilastirma",
    title: "VPN Nedir? IPSec VPN ile SSL VPN Arasındaki Farklar",
    excerpt:
      "VPN (Virtual Private Network), uzak kullanıcıların ve şube ofislerin şifreli tünel üzerinden kurumsal ağa güvenli erişimini sağlar. IPSec VPN, SSL VPN ve FortiClient ile yapılandırmayı detaylandırıyoruz.",
    category: "network-temelleri",
    categoryColor: "#0ea5e9",
    tags: ["VPN", "IPSec VPN", "SSL VPN", "FortiClient", "Uzak Erişim", "Site-to-Site"],
    publishedAt: "2026-05-21",
    readTime: 8,
    content: `
<h2>VPN Nedir?</h2>
<p>VPN (Virtual Private Network — Sanal Özel Ağ), güvensiz bir ağ (internet) üzerinden iki nokta arasında şifreli ve kimlik doğrulamalı bir tünel oluşturarak <strong>özel ağ davranışını simüle eden teknolojidir.</strong></p>
<p>VPN sayesinde uzak çalışanlar evden veya seyahatte iken, şubeler de internet üzerinden kurumsal kaynaklara sanki aynı fiziksel ağdaymış gibi güvenle erişebilir.</p>

<h2>VPN Türleri</h2>
<ul>
  <li><strong>Site-to-Site VPN:</strong> İki farklı lokasyondaki ağı (merkez–şube) kalıcı olarak birbirine bağlar. Her iki uçta da firewall bulunur; tünel otomatik olarak kurulur ve sürekli açık kalır.</li>
  <li><strong>Remote Access VPN:</strong> Uzak kullanıcının bireysel olarak kurumsal ağa bağlanmasını sağlar. Kullanıcı bilgisayarına VPN istemcisi kurulur.</li>
  <li><strong>MPLS / SD-WAN:</strong> ISP altyapısı üzerinden özel WAN bağlantısı; teknik olarak VPN değil ancak benzer amaçla kullanılır.</li>
</ul>

<h2>IPSec VPN Nedir?</h2>
<p>IPSec (Internet Protocol Security), ağ katmanında (Layer 3) çalışan ve IP paketlerini kimlik doğrulama ile şifrelemeyle koruyan bir protokol paketidir.</p>
<p><strong>IPSec'in İki Modu:</strong></p>
<ul>
  <li><strong>Tunnel Mode:</strong> Orijinal IP paketi tamamen şifrelenerek yeni bir IP başlığıyla sarılır. Site-to-Site VPN için kullanılır.</li>
  <li><strong>Transport Mode:</strong> Yalnızca veri yükü (payload) şifrelenir; IP başlığı korunur. Uçtan uca L2TP gibi protokollerle kombinlenir.</li>
</ul>
<p><strong>IPSec Faz 1 ve Faz 2 (IKEv1 / IKEv2):</strong></p>
<ul>
  <li><strong>Faz 1 (IKE SA):</strong> İki taraf kimlik doğrular (pre-shared key veya sertifika) ve güvenli bir kanal kurar. IKEv2 daha hızlı ve güvenlidir; tercih edilmelidir.</li>
  <li><strong>Faz 2 (IPSec SA):</strong> Gerçek veri trafiğini şifreleyecek parametreler anlaşılır (şifreleme algoritması AES-256, hash SHA-256, DH Group 20+).</li>
</ul>
<p><strong>Kullanım Alanı:</strong> Site-to-Site tünel, yüksek bant genişliği gerektiren şube bağlantıları, kritik altyapılar arası güvenli iletişim.</p>

<h2>SSL VPN Nedir?</h2>
<p>SSL VPN (veya TLS VPN), web tarayıcısı tabanlı veya hafif istemci kullanan ve <strong>uygulama katmanında (Layer 7)</strong> çalışan VPN türüdür. IPSec'e kıyasla NAT ve firewall geçişinde daha az sorun yaşar; kurulumu daha kolaydır.</p>
<p><strong>İki Modu:</strong></p>
<ul>
  <li><strong>Web Mode (Clientless):</strong> Yalnızca tarayıcı üzerinden; web uygulamaları, RDP ve SSH portallarına erişim. Uygulama kurulmaz. BYOD senaryoları ve sınırlı erişim için idealdir.</li>
  <li><strong>Tunnel Mode:</strong> FortiClient veya benzeri istemci kurularak tüm ağ trafiği VPN tüneline yönlendirilir. Remote Access VPN'in tam işlevselliğini sağlar.</li>
</ul>
<p><strong>Kullanım Alanı:</strong> Uzak çalışan erişimi, BYOD, geçici erişim ihtiyaçları, NAT arkasındaki kullanıcılar.</p>

<h2>IPSec VPN vs SSL VPN — Karşılaştırma</h2>
<ul>
  <li><strong>Katman:</strong> IPSec → Layer 3 (Ağ); SSL VPN → Layer 7 (Uygulama)</li>
  <li><strong>Kurulum Karmaşıklığı:</strong> IPSec daha karmaşık, SSL daha kolay</li>
  <li><strong>NAT Geçişi:</strong> IPSec NAT-T gerektirebilir; SSL VPN sorunsuz geçer</li>
  <li><strong>Performans:</strong> IPSec genellikle daha yüksek throughput; SSL VPN işlem yükü biraz fazla</li>
  <li><strong>İstemci Gereksinimi:</strong> IPSec için genellikle istemci şart; SSL Web Mode'da tarayıcı yeterli</li>
  <li><strong>Güvenlik:</strong> İkisi de güvenlidir; doğru yapılandırılırsa eşdeğer koruma</li>
  <li><strong>En İyi Senaryo:</strong> IPSec → Site-to-Site; SSL VPN → Remote Access</li>
</ul>

<h2>FortiGate'de VPN Yapılandırması</h2>
<p><strong>IPSec Site-to-Site:</strong></p>
<ul>
  <li>VPN → IPSec Wizard ile rehberli kurulum veya manuel Phase1/Phase2 yapılandırması</li>
  <li>Her iki uç için aynı pre-shared key veya sertifika</li>
  <li>Statik rota veya BGP ile karşı taraf subneti yönlendirilir</li>
  <li>Firewall politikasında VPN arayüzü kaynak/hedef olarak tanımlanır</li>
</ul>
<p><strong>SSL VPN Remote Access:</strong></p>
<ul>
  <li>VPN → SSL-VPN Settings: Dinleme portu (443), sertifika, IP havuzu</li>
  <li>SSL-VPN Portal: Web mode veya tunnel mode seçimi, ayrılan IP aralığı</li>
  <li>Kullanıcı grubu ve kimlik doğrulama (yerel, LDAP, RADIUS, MFA)</li>
  <li>Split Tunneling: Yalnızca kurumsal trafiği VPN'e, interneti doğrudan ISP'ye yönlendirir</li>
</ul>

<h2>VPN Güvenlik Önerileri</h2>
<ul>
  <li>Zayıf şifreleme algoritmaları (3DES, MD5, DH Group 1/2/5) kullanmayın; AES-256 + SHA-256 + DH Group 20+ tercih edin.</li>
  <li>SSL VPN'de MFA (çok faktörlü kimlik doğrulama) zorunlu olmalıdır; parola tek başına yeterli değildir.</li>
  <li>IPSec pre-shared key 30+ karakterden oluşmalı ve periyodik değiştirilmelidir.</li>
  <li>SSL VPN erişimini IP adresi veya ülke bazında kısıtlayın.</li>
  <li>FortiGate'de SSL VPN portunu varsayılan 443'ten farklı bir porta taşıyın (güvenlik taraması azalır).</li>
</ul>

<h2>Sonuç</h2>
<p>VPN, modern kurumsal ağların vazgeçilmez güvenlik katmanıdır. Doğru VPN türü ve yapılandırma seçimi, performans ve güvenlik dengesini belirler. Lider Network, FortiGate IPSec ve SSL VPN tasarımı, yapılandırması ve sorun giderme konularında hizmetinizdedir.</p>
    `,
  },
  {
    slug: "sip-alg-nedir-neden-kapatilmali",
    title: "SIP ALG Nedir ve Neden Kapatılmalıdır?",
    excerpt:
      "SIP ALG (Application Layer Gateway), firewall'larda VoIP trafiğini yönetmek için tasarlanmış bir özelliktir. Ancak çoğu kurumsal ortamda ses kalitesini bozmakta ve arıza sorunlarına yol açmaktadır. Neden kapatılması gerektiğini anlatıyoruz.",
    category: "network-temelleri",
    categoryColor: "#0ea5e9",
    tags: ["SIP ALG", "VoIP", "SIP", "FortiGate", "IP Telefon", "NAT"],
    publishedAt: "2026-05-20",
    readTime: 6,
    content: `
<h2>SIP Nedir?</h2>
<p>SIP (Session Initiation Protocol), VoIP (Voice over IP) telefon görüşmelerini, video konferansları ve anlık mesajlaşmayı başlatmak, yönetmek ve sonlandırmak için kullanılan uygulama katmanı protokolüdür. Modern IP telefon santralleri (Asterisk, FreePBX, Microsoft Teams Direct Routing) ve IP telefon cihazları SIP protokolüne dayanır.</p>
<p>SIP, sinyal için <strong>UDP/TCP port 5060</strong> (şifreli için 5061/TLS) kullanır; medya (ses verisi) ise ayrıca <strong>RTP (Real-time Transport Protocol)</strong> üzerinden akar ve dinamik UDP portlarında iletilir.</p>

<h2>SIP ALG Nedir?</h2>
<p>ALG (Application Layer Gateway), firewall'ın belirli uygulama protokollerini anlayarak NAT çevirisi sırasında protokol içindeki IP adreslerini ve port bilgilerini de güncelleyen mekanizmadır.</p>
<p>SIP ALG, şu sorunları çözmeye çalışır: SIP paketlerinin başlıklarında ve gövdesinde (SDP — Session Description Protocol) IP adresleri ve port numaraları bulunur. NAT'ın dışarıya aktardığı IP adresi ile SIP mesajı içindeki IP adresi çelişebilir. SIP ALG bu çelişkiyi düzeltmeye çalışır.</p>

<h2>SIP ALG Neden Sorun Çıkarır?</h2>
<p>Teoride iyi niyetle tasarlanan SIP ALG, pratikte aşağıdaki yaygın sorunlara yol açar:</p>
<ul>
  <li><strong>Tek Yönlü Ses (One-Way Audio):</strong> En yaygın şikâyet. Arayan karşı tarafı duyar ama karşı taraf arayı duyamaz veya tam tersi. ALG'nin RTP oturumlarını yanlış yönlendirmesinden kaynaklanır.</li>
  <li><strong>Çağrı Kurulamıyor (Call Drops):</strong> SIP REGISTER veya INVITE mesajlarının ALG tarafından bozulması, kayıt veya çağrı başlatma hatalarına neden olur.</li>
  <li><strong>Kayıt Sorunları:</strong> IP telefon santrale kaydolamıyor; "408 Request Timeout" veya "403 Forbidden" hatası alınıyor.</li>
  <li><strong>NAT İçin Çift Dönüşüm:</strong> ALG SIP paketini değiştiriyor, IP telefon veya santral de kendi NAT traversal mekanizmasını (STUN) kullanıyorsa çelişki oluşur ve paket bozulur.</li>
  <li><strong>Şifreli SIP'te (TLS/SRTP) İşe Yaramaz:</strong> ALG, şifreli SIP trafiğini çözemez; müdahalesi anlamsız ve zararlı hale gelir.</li>
</ul>

<h2>Modern Ortamlarda SIP ALG'ye Neden Gerek Yok?</h2>
<ul>
  <li>Günümüz IP telefon sistemleri ve UCaaS platformları (Zoom Phone, Teams, 3CX) kendi NAT traversal yöntemlerini kullanır: <strong>STUN, TURN, ICE.</strong></li>
  <li>SBC (Session Border Controller) kullanılan ortamlarda tüm NAT dönüşümü SBC tarafından profesyonelce yönetilir; firewall'ın müdahalesine gerek yoktur.</li>
  <li>Full-cone NAT veya doğru yapılandırılmış stateful NAT, SIP ALG olmadan da çalışır.</li>
</ul>

<h2>FortiGate'de SIP ALG Nasıl Kapatılır?</h2>
<p>FortiGate'de SIP ALG, <strong>VoIP profili</strong> aracılığıyla yönetilir ve varsayılan politikalara uygulanır. Kapatmak için:</p>
<p><strong>GUI üzerinden:</strong></p>
<ul>
  <li>Policy &amp; Objects → Security Profiles → VoIP → İlgili profili düzenle → SIP devre dışı bırak</li>
  <li>İlgili firewall politikasından VoIP profilini kaldır</li>
</ul>
<p><strong>CLI üzerinden (önerilen — tam devre dışı bırakma):</strong></p>
<ul>
  <li><code>config system settings</code></li>
  <li><code>set sip-helper disable</code></li>
  <li><code>set sip-nat-trace disable</code></li>
  <li><code>end</code></li>
</ul>
<ul>
  <li><code>config system session-helper</code></li>
  <li>SIP helper girişini (genellikle id 13) silin: <code>delete 13</code></li>
  <li><code>end</code></li>
</ul>

<h2>SIP ALG Kapatıldıktan Sonra</h2>
<p>SIP ALG kapatıldığında şunları yapmanız gerekebilir:</p>
<ul>
  <li>IP telefon veya santralın SIP portları için firewall politikasında izin kuralı oluşturun (UDP 5060, 5061 ve RTP aralığı genellikle UDP 10000–20000).</li>
  <li>IP telefon santralı olarak SBC kullanıyorsanız, yalnızca SBC IP adreslerine izin verin.</li>
  <li>Ses kalitesi sorunları için QoS politikasıyla VoIP trafiğini önceliklendirin (DSCP EF markası).</li>
</ul>

<h2>Sonuç</h2>
<p>SIP ALG, iyi niyetle tasarlanmış ancak modern VoIP ortamlarında çoğunlukla zararlı olan bir özelliktir. VoIP sorunlarınızın çözümünde ilk adım SIP ALG'yi kapatmaktır. Lider Network, FortiGate VoIP yapılandırması ve SIP sorun giderme konularında uzman desteği sunmaktadır.</p>
    `,
  },
  {
    slug: "dhcp-nedir-nasil-calisir-kurumsal-yapilandirma",
    title: "DHCP Nedir? Nasıl Çalışır ve Kurumsal Yapılandırma Rehberi",
    excerpt:
      "DHCP (Dynamic Host Configuration Protocol), ağdaki cihazlara otomatik IP adresi atar. Çalışma prensibi, DORA süreci, DHCP rezervasyonu, DHCP Snooping ve FortiGate DHCP sunucu yapılandırmasını anlatıyoruz.",
    category: "network-temelleri",
    categoryColor: "#0ea5e9",
    tags: ["DHCP", "IP Adresi", "DORA", "DHCP Snooping", "FortiGate", "Ağ Yönetimi"],
    publishedAt: "2026-05-20",
    readTime: 6,
    content: `
<h2>DHCP Nedir?</h2>
<p>DHCP (Dynamic Host Configuration Protocol), ağa bağlanan cihazlara <strong>otomatik olarak IP adresi, subnet mask, varsayılan ağ geçidi (gateway) ve DNS sunucu</strong> bilgilerini atayan ağ protokolüdür. DHCP olmadan her cihazın IP adresi manuel olarak girilmek zorunda kalırdı; bu da büyük ağlarda yönetimi imkânsız hale getirirdi.</p>

<h2>DORA Süreci — DHCP Nasıl Çalışır?</h2>
<p>Bir cihaz ağa bağlandığında şu 4 adım gerçekleşir:</p>
<ul>
  <li><strong>D — Discover:</strong> Cihaz, DHCP sunucusunu bulmak için ağa broadcast mesaj yollar (UDP port 67). "Bana IP verecek DHCP sunucusu var mı?"</li>
  <li><strong>O — Offer:</strong> DHCP sunucusu, müsait bir IP adresi ve yapılandırma bilgilerini içeren teklif (Offer) mesajıyla yanıtlar.</li>
  <li><strong>R — Request:</strong> Cihaz, teklifi kabul ettiğini broadcast ile bildirir (birden fazla DHCP sunucusu varsa hangisinin teklifini seçtiğini diğerleri de öğrenir).</li>
  <li><strong>A — Acknowledge:</strong> DHCP sunucusu, atama onayını (ACK) gönderir; cihaz IP adresini kullanmaya başlar.</li>
</ul>

<h2>DHCP Kira Süresi (Lease Time)</h2>
<p>IP adresi kalıcı değil; belirli bir süreliğine (lease) atanır:</p>
<ul>
  <li>Kira süresinin yarısında cihaz, mevcut DHCP sunucusuna yenileme isteği (Renew) gönderir.</li>
  <li>Sunucu yanıt vermezse kira süresinin %87,5'inde başka bir DHCP sunucusuna dener (Rebind).</li>
  <li>Kira tamamen dolduğunda IP adresini bırakır ve DORA sürecini yeniden başlatır.</li>
</ul>
<p><strong>Önerilen Kira Süreleri:</strong> Kullanıcı ağı için 8–24 saat; misafir ağı için 1–4 saat; sunucu ağı için rezervasyon önerilir (statik IP mantığı).</p>

<h2>DHCP Rezervasyonu (Static DHCP)</h2>
<p>DHCP sunucusu, belirli bir MAC adresine her seferinde aynı IP adresini atayabilir. Buna <strong>DHCP Rezervasyonu</strong> veya Static DHCP denir:</p>
<ul>
  <li>Yazıcılar, IP kameralar, sunucular ve ağ cihazları için kullanılır.</li>
  <li>Cihaz yine DHCP üzerinden IP alır ama her zaman aynı adresi alır.</li>
  <li>Manuel statik IP yapılandırmasının dezavantajları (yanlış subnet mask, yanlış gateway girme riski) ortadan kalkar.</li>
</ul>

<h2>DHCP Relay (DHCP Helper)</h2>
<p>DHCP, broadcast tabanlı çalıştığı için router/firewall sınırlarını geçemez. Farklı VLAN'lar veya subnet'lerdeki cihazlar merkezi DHCP sunucusunu nasıl bulur?</p>
<p><strong>DHCP Relay Agent</strong> bu sorunu çözer: Router veya firewall (FortiGate dahil), broadcast DHCP Discover mesajını unicast'a çevirerek merkezi DHCP sunucusuna iletir. Yanıtı da ilgili VLAN'a geri gönderir.</p>
<p>FortiGate'de DHCP Relay yapılandırması: <code>config system interface</code> → interface → <code>set ip-managed-by-fortiipam disable</code> → <code>set dhcp-relay-ip [DHCP sunucu IP]</code></p>

<h2>FortiGate'de DHCP Sunucu Yapılandırması</h2>
<p>FortiGate her arayüz için bağımsız DHCP sunucu çalıştırabilir:</p>
<ul>
  <li>Network → Interfaces → İlgili arayüz → DHCP Server</li>
  <li>Address Range (IP havuzu), Netmask, Gateway, DNS Server ve Lease Time tanımlanır.</li>
  <li>Reserved Address (MAC bazlı rezervasyon) eklenebilir.</li>
  <li>Seçenekler (Options): Option 43 (VoIP için TFTP sunucu), Option 66/67 (PXE boot) gibi özel DHCP seçenekleri tanımlanabilir.</li>
</ul>

<h2>DHCP Snooping — Güvenlik Katmanı</h2>
<p>Ağda sahte DHCP sunucusu çalıştıran saldırgan, cihazlara kendi IP'sini gateway olarak atayarak MITM saldırısı yapabilir. <strong>DHCP Snooping</strong> bunu engeller:</p>
<ul>
  <li>Switch portları "güvenilir" (trusted) ve "güvenilmez" (untrusted) olarak sınıflandırılır.</li>
  <li>Yalnızca trusted portlardan gelen DHCP Offer ve ACK mesajlarına izin verilir.</li>
  <li>Kullanıcı portları (PC, yazıcı) daima untrusted; yalnızca firewall/router portu trusted olarak işaretlenir.</li>
</ul>

<h2>Sonuç</h2>
<p>DHCP, kurumsal ağların yönetilemez hale gelmesini engelleyen kritik bir altyapı servisidir. Doğru yapılandırılmış DHCP rezervasyonları ve DHCP Snooping ile hem yönetilebilirlik hem güvenlik sağlanır. Lider Network, DHCP altyapısı tasarımı ve FortiGate yapılandırması konularında hizmetinizdedir.</p>
    `,
  },
  {
    slug: "ntp-nedir-neden-kullanilir-kurumsal-yapilandirma",
    title: "NTP Nedir? Neden Kullanılır ve Kurumsal NTP Yapılandırması",
    excerpt:
      "NTP (Network Time Protocol), ağdaki tüm cihazların saatini senkronize eden protokoldür. Log yönetimi, sertifika doğrulama, Kerberos kimlik doğrulaması ve FortiGate NTP yapılandırması bu makalede.",
    category: "network-temelleri",
    categoryColor: "#0ea5e9",
    tags: ["NTP", "Saat Senkronizasyonu", "Stratum", "Log Yönetimi", "FortiGate"],
    publishedAt: "2026-05-19",
    readTime: 5,
    content: `
<h2>NTP Nedir?</h2>
<p>NTP (Network Time Protocol), internet veya yerel ağ üzerindeki cihazların saatlerini milisaniye hassasiyetinde senkronize eden protokoldür. UDP port 123 üzerinde çalışır ve 1985'ten bu yana kullanılmaktadır.</p>

<h2>Neden Bu Kadar Kritik?</h2>
<ul>
  <li><strong>Log Yönetimi ve Adli Analiz:</strong> Bir güvenlik olayı incelenirken farklı cihazlardaki log satırlarının zaman damgalarının uyuşması zorunludur. Saatler farklıysa olay sırasını doğru analiz etmek imkânsızlaşır.</li>
  <li><strong>Kerberos Kimlik Doğrulaması:</strong> Active Directory Kerberos protokolü, istemci ile sunucu arasındaki maksimum saat farkını <strong>5 dakika</strong> olarak sınırlar. Bu fark aşılırsa kimlik doğrulama başarısız olur ve kullanıcılar domain'e giremez.</li>
  <li><strong>SSL/TLS Sertifika Doğrulama:</strong> Sertifikaların geçerlilik süresi kontrol edilirken cihaz saati esas alınır. Saat yanlışsa geçerli sertifikalar "süresi dolmuş" gibi görünebilir.</li>
  <li><strong>SIEM Korelasyonu:</strong> SIEM sistemleri log olaylarını zaman damgasına göre ilişkilendirir. Saat farkı korelasyon kalitesini düşürür.</li>
  <li><strong>Zamanlama Tabanlı Politikalar:</strong> Firewall, VPN ve erişim politikalarında zaman bazlı kurallar (gece erişim yasağı gibi) doğru saate ihtiyaç duyar.</li>
</ul>

<h2>Stratum Hiyerarşisi</h2>
<p>NTP, hiyerarşik bir katman (stratum) modeliyle çalışır:</p>
<ul>
  <li><strong>Stratum 0:</strong> Referans saat kaynağı — GPS uydusu, atom saati, radyo sinyali. Ağa doğrudan bağlanmaz.</li>
  <li><strong>Stratum 1:</strong> Stratum 0 kaynağına doğrudan bağlı NTP sunucusu. Ulusal zaman laboratuvarlarının sunucuları bu seviyededir.</li>
  <li><strong>Stratum 2:</strong> Stratum 1 sunucularından senkronize olan sunucular. Kurumsal iç NTP sunucusu buraya yerleştirilir.</li>
  <li><strong>Stratum 3–15:</strong> Hiyerarşinin devamı; her seviyede küçük bir gecikme eklenir.</li>
</ul>
<p>Kurumsal en iyi uygulama: Stratum 1/2 kamuya açık NTP havuzlarından (pool.ntp.org veya time.cloudflare.com) senkronize olan <strong>iç NTP sunucusu</strong> kurarak tüm cihazların bu iç sunucuyu kullanması sağlanır. Böylece tüm cihazlar dış sunuculara çıkış yapmaz.</p>

<h2>Kamuya Açık NTP Sunucuları</h2>
<ul>
  <li><code>pool.ntp.org</code> — Dünya genelinde gönüllü sunucu havuzu; güvenilir ve ücretsiz</li>
  <li><code>time.cloudflare.com</code> — Cloudflare, gizlilik odaklı NTP (NTS desteği)</li>
  <li><code>time.google.com</code> — Google'ın genel NTP servisi</li>
  <li><code>tr.pool.ntp.org</code> — Türkiye'ye yakın sunucular için</li>
  <li>TÜBİTAK ULAKBİM NTP sunucuları — Kamu kurumları için tercih edilebilir</li>
</ul>

<h2>FortiGate NTP Yapılandırması</h2>
<p><strong>GUI üzerinden:</strong> System → Settings → System Time → Sync with NTP Server</p>
<p><strong>CLI üzerinden:</strong></p>
<ul>
  <li><code>config system ntp</code></li>
  <li><code>set status enable</code></li>
  <li><code>set syncinterval 60</code> (dakika cinsinden senkronizasyon aralığı)</li>
  <li><code>config ntpserver</code></li>
  <li><code>edit 1</code></li>
  <li><code>set server "pool.ntp.org"</code></li>
  <li><code>set ntpv3 disable</code> (NTPv4 kullan)</li>
  <li><code>next</code></li>
  <li><code>end</code></li>
</ul>
<p>FortiGate ayrıca iç ağdaki cihazlar için NTP sunucu olarak da kullanılabilir; firewall politikasında UDP 123 trafiğine izin verilmesi yeterlidir.</p>

<h2>NTP Güvenliği</h2>
<ul>
  <li><strong>NTP Amplification Saldırısı:</strong> Açık NTP sunucuları DDoS amplifikasyonu için istismar edilebilir. Firewall'da gelen UDP 123 trafiğini kısıtlayın.</li>
  <li><strong>NTS (Network Time Security):</strong> NTP'nin şifreli ve kimlik doğrulamalı versiyonu; Cloudflare ve modern Linux dağıtımları destekler.</li>
  <li><strong>Kimlik Doğrulamalı NTP:</strong> Kurumsal ortamlarda MD5 veya SHA kimlik doğrulaması ile sahte NTP sunucularına karşı koruma sağlanabilir.</li>
</ul>

<h2>Sonuç</h2>
<p>NTP, görünmez ama kritik bir altyapı servisidir. Saat senkronizasyonu bozulduğunda güvenlik, kimlik doğrulama ve log analizi etkilenir. Lider Network, kurumsal NTP altyapısı ve FortiGate zaman yapılandırması konularında hizmetinizdedir.</p>
    `,
  },
  {
    slug: "virtual-ip-nedir-firewall-nat-port-yonlendirme",
    title: "Virtual IP (VIP) Nedir? Firewall'da NAT ve Port Yönlendirme Rehberi",
    excerpt:
      "Virtual IP (VIP), FortiGate ve diğer firewall'larda internetten gelen bağlantıları iç ağdaki sunuculara yönlendirmek için kullanılan NAT mekanizmasıdır. DNAT, port yönlendirme ve VIP havuzlarını detaylıca anlatıyoruz.",
    category: "network-temelleri",
    categoryColor: "#0ea5e9",
    tags: ["Virtual IP", "VIP", "NAT", "Port Yönlendirme", "DNAT", "FortiGate"],
    publishedAt: "2026-05-19",
    readTime: 6,
    content: `
<h2>Virtual IP (VIP) Nedir?</h2>
<p>Virtual IP (Sanal IP), FortiGate ve kurumsal firewall'larda kullanılan ve internetten gelen bağlantıları iç ağdaki özel IP adresli sunuculara yönlendiren <strong>Destination NAT (DNAT)</strong> mekanizmasıdır.</p>
<p>Örnek senaryo: Şirketin tek bir genel (public) IP adresi var — 203.0.113.10. Bu IP'ye gelen HTTPS bağlantılarının (port 443) iç ağdaki web sunucusuna (192.168.1.50) iletilmesi gerekiyor. Bunu VIP sağlar.</p>

<h2>NAT Türleri</h2>
<ul>
  <li><strong>SNAT (Source NAT):</strong> İç ağdan dışarı giden trafikte kaynak IP'yi firewall'ın WAN IP'siyle değiştirir. İnternet erişimi için standart NAT budur.</li>
  <li><strong>DNAT (Destination NAT):</strong> Dışarıdan gelen trafikte hedef IP'yi iç sunucunun özel IP'siyle değiştirir. VIP budur.</li>
  <li><strong>Full NAT (Bire-bir NAT):</strong> Hem kaynak hem hedef IP değiştirilir. Farklı IP aralıkları arası iletişimde kullanılır.</li>
</ul>

<h2>FortiGate'de VIP Oluşturma</h2>
<p><strong>GUI üzerinden:</strong></p>
<ul>
  <li>Policy &amp; Objects → Virtual IPs → Create New</li>
  <li><strong>External IP/Range:</strong> Dışarıdan erişilecek genel IP (WAN IP veya farklı genel IP)</li>
  <li><strong>Mapped IP/Range:</strong> İç ağdaki gerçek sunucu IP'si (192.168.1.50)</li>
  <li><strong>Port Forwarding etkin:</strong> Belirli port(lar) için yönlendirme</li>
  <li><strong>External Port:</strong> Dışarıdan gelen port (443)</li>
  <li><strong>Mapped Port:</strong> Sunucunun dinlediği port (443 veya farklıysa 8443)</li>
</ul>
<p><strong>CLI üzerinden:</strong></p>
<ul>
  <li><code>config firewall vip</code></li>
  <li><code>edit "WEB-SUNUCU-HTTPS"</code></li>
  <li><code>set extip 203.0.113.10</code></li>
  <li><code>set mappedip 192.168.1.50</code></li>
  <li><code>set extintf "wan1"</code></li>
  <li><code>set portforward enable</code></li>
  <li><code>set extport 443</code></li>
  <li><code>set mappedport 443</code></li>
  <li><code>next</code></li>
  <li><code>end</code></li>
</ul>

<h2>VIP Firewall Politikasına Eklenmesi</h2>
<p>VIP oluşturduktan sonra mutlaka bir firewall politikasına eklenmesi gerekir, aksi hâlde trafik geçmez:</p>
<ul>
  <li>Kaynak: WAN arayüzü, Kaynak adres: all (veya kısıtlamak istediğiniz IP)</li>
  <li>Hedef: İlgili VIP nesnesi</li>
  <li>Servis: HTTPS (veya özel port)</li>
  <li>Aksiyon: Accept</li>
  <li>NAT: VIP'te zaten tanımlı olduğu için politikada ayrıca NAT etkinleştirmeye gerek yoktur.</li>
</ul>

<h2>Yaygın VIP Senaryoları</h2>
<ul>
  <li><strong>Web Sunucusu Yayımlama:</strong> Dışarıdan 80/443 → iç web sunucusu</li>
  <li><strong>Mail Sunucusu:</strong> 25/587 → iç Exchange veya Postfix</li>
  <li><strong>RDP Erişimi:</strong> 3389 (veya farklı port) → Terminal Server. Güvenlik için RDP'yi VPN arkasına almak çok daha güvenlidir.</li>
  <li><strong>SIP / VoIP:</strong> 5060/5061 → IP santral</li>
  <li><strong>Özel Uygulama Portu:</strong> Herhangi bir TCP/UDP port eşlemesi</li>
</ul>

<h2>VIP Havuzu (VIP Pool / IP Pool)</h2>
<p>Tek WAN IP yerine birden fazla genel IP kullanıldığında VIP havuzu devreye girer:</p>
<ul>
  <li><strong>One-to-One NAT:</strong> Her iç IP'ye ayrı bir dış IP eşlenir. Tam bire bir çeviri.</li>
  <li><strong>Overload (PAT):</strong> Çok sayıda iç IP → tek dış IP; port numarasıyla ayırt edilir. Standart SNAT budur.</li>
  <li><strong>Fixed Port Range:</strong> Her kullanıcıya belirli bir port aralığı ayrılır; log takibi kolaylaşır.</li>
</ul>

<h2>VIP Güvenlik Önerileri</h2>
<ul>
  <li>VIP üzerinde gereksiz portları açmayın; yalnızca zorunlu portları yönlendirin.</li>
  <li>Yayımlanan sunucular DMZ VLAN'ında olmalı; iç ağdan izole edilmelidir.</li>
  <li>Web sunucuları için VIP'e ek olarak WAF (Web Application Firewall) profili ve IPS imzaları etkinleştirin.</li>
  <li>RDP ve SSH gibi yönetim portlarını doğrudan internete açmayın; VPN üzerinden erişim sağlayın.</li>
  <li>Kaynak IP kısıtlaması: Belirli ülkelerden veya IP aralıklarından erişime izin verin.</li>
</ul>

<h2>Sonuç</h2>
<p>Virtual IP, iç ağdaki sunucuları internete güvenli biçimde açmanın standart yöntemidir. Doğru konfigürasyon ve ek güvenlik katmanlarıyla sunucu maruziyeti minimize edilir. Lider Network, FortiGate VIP yapılandırması ve sunucu yayımlama güvenliği konularında hizmetinizdedir.</p>
    `,
  },
  {
    slug: "cli-konsol-nedir-fortigate-komut-satiri-yonetimi",
    title: "CLI Konsol Nedir? FortiGate Komut Satırı Yönetimi Rehberi",
    excerpt:
      "CLI (Command Line Interface), ağ ve güvenlik cihazlarını komut satırından yönetmenin en güçlü yoludur. FortiGate CLI'a nasıl erişilir, temel komutlar, yapılandırma, sorun giderme ve otomasyon konularını ele alıyoruz.",
    category: "network-temelleri",
    categoryColor: "#0ea5e9",
    tags: ["CLI", "FortiGate", "Komut Satırı", "SSH", "Konsol", "FortiOS"],
    publishedAt: "2026-05-18",
    readTime: 7,
    content: `
<h2>CLI Nedir?</h2>
<p>CLI (Command Line Interface — Komut Satırı Arayüzü), ağ cihazları ve sunucularla metin tabanlı komutlar aracılığıyla etkileşime geçilen yönetim ortamıdır. GUI (grafik arayüz) ile yapılamayan veya güç olan işlemler CLI ile hızla gerçekleştirilebilir; otomasyon ve script desteği sunar.</p>
<p>FortiGate, Cisco, Palo Alto, Juniper gibi kurumsal ağ cihazlarının tamamı CLI desteği sunar. FortiGate'in CLI ortamına <strong>FortiOS CLI</strong> adı verilir.</p>

<h2>FortiGate CLI'a Erişim Yöntemleri</h2>
<ul>
  <li><strong>Konsol Kablosu (Console Port):</strong> RJ-45 veya USB-C console kablosuyla fiziksel erişim. Ağ bağlantısı olmadan bile erişilebilir; fabrika ayarlarına dönüş ve kurtarma senaryolarında kullanılır. Terminal emülatörü: PuTTY (115200 baud, 8N1).</li>
  <li><strong>SSH (Secure Shell):</strong> Ağ üzerinden şifreli yönetim. Port 22, yönetim IP'si üzerinden bağlantı. En yaygın uzaktan CLI yöntemi.</li>
  <li><strong>GUI üzerinden CLI Widget:</strong> FortiGate web arayüzünde sağ üst köşedeki CLI simgesiyle tarayıcı üzerinden CLI erişimi.</li>
  <li><strong>FortiCloud / FortiManager:</strong> Merkezi yönetim platformları üzerinden CLI oturumu açılabilir.</li>
</ul>

<h2>FortiOS CLI Temel Yapısı</h2>
<p>FortiGate CLI'ın hiyerarşik yapısı vardır:</p>
<ul>
  <li><code>config [modül]</code> — Yapılandırma moduna giriş</li>
  <li><code>edit [nesne adı/ID]</code> — Nesne düzenleme</li>
  <li><code>set [parametre] [değer]</code> — Değer atama</li>
  <li><code>get</code> — Mevcut değerleri görüntüleme</li>
  <li><code>show</code> — Yapılandırmayı gösterme (tüm ağaç veya tek nesne)</li>
  <li><code>next</code> — Bir sonraki nesneye geç (çok nesne düzenlerken)</li>
  <li><code>end</code> — Yapılandırma modundan çık ve kaydet</li>
  <li><code>abort</code> — Değişiklikleri kaydetmeden çık</li>
</ul>

<h2>En Sık Kullanılan CLI Komutları</h2>
<p><strong>Sistem Bilgisi:</strong></p>
<ul>
  <li><code>get system status</code> — FortiOS sürümü, seri numarası, lisans durumu</li>
  <li><code>get system performance status</code> — CPU ve bellek kullanımı, oturum sayısı</li>
  <li><code>diagnose sys top</code> — Çalışan süreçler ve kaynak tüketimi (Linux top gibi)</li>
</ul>
<p><strong>Ağ ve Arayüz:</strong></p>
<ul>
  <li><code>get system interface physical</code> — Tüm fiziksel arayüzlerin durumu, hız ve bağlantı bilgisi</li>
  <li><code>diagnose ip address list</code> — IP adresi atamaları</li>
  <li><code>diagnose netlink interface list</code> — Arayüz istatistikleri (paket sayaçları)</li>
  <li><code>get router info routing-table all</code> — Yönlendirme tablosu</li>
  <li><code>execute ping [IP]</code> — Ping testi</li>
  <li><code>execute traceroute [IP]</code> — Rota izleme</li>
</ul>
<p><strong>Oturum ve Bağlantı:</strong></p>
<ul>
  <li><code>diagnose sys session list</code> — Aktif oturum tablosu</li>
  <li><code>diagnose sys session stat</code> — Oturum istatistikleri</li>
  <li><code>diagnose sys session filter [parametre]</code> — Oturum filtresi (kaynak IP, hedef IP, port)</li>
</ul>
<p><strong>VPN:</strong></p>
<ul>
  <li><code>get vpn ipsec tunnel summary</code> — IPSec tünel durumu özeti</li>
  <li><code>diagnose vpn ike status</code> — IKE görüşme detayları</li>
  <li><code>get vpn ssl monitor</code> — Aktif SSL VPN kullanıcıları</li>
  <li><code>diagnose vpn tunnel list</code> — Tünel listesi ve istatistikleri</li>
</ul>
<p><strong>Log ve Debug:</strong></p>
<ul>
  <li><code>diagnose debug enable</code> — Debug modunu başlat</li>
  <li><code>diagnose debug application ike -1</code> — IKE debug (VPN sorun giderme)</li>
  <li><code>diagnose debug flow filter addr [IP]</code> — Belirli IP için paket akışını izle</li>
  <li><code>diagnose debug flow show function-name enable</code></li>
  <li><code>diagnose debug flow trace start 100</code> — 100 paket izle</li>
  <li><code>diagnose debug disable</code> — Debug modunu kapat (önemli! üretimde açık bırakmayın)</li>
</ul>

<h2>Yapılandırma Yedekleme ve Geri Yükleme</h2>
<ul>
  <li><code>execute backup config ftp [dosyaadı] [FTP-IP] [kullanıcı] [şifre]</code></li>
  <li><code>execute backup config tftp [dosyaadı] [TFTP-IP]</code></li>
  <li><code>execute restore config ftp [dosyaadı] [FTP-IP] [kullanıcı] [şifre]</code></li>
  <li>GUI üzerinden: Dashboard → System → Backup — en kolay yöntem</li>
</ul>

<h2>CLI ile Yapılabilecek Kritik İşlemler</h2>
<ul>
  <li>Fabrika ayarlarına dönüş: <code>execute factoryreset</code></li>
  <li>Firmware güncelleme: <code>execute restore image [kaynak]</code></li>
  <li>Admin şifre sıfırlama (konsol erişimiyle)</li>
  <li>HA (High Availability) senkronizasyon kontrolü</li>
  <li>Özel BGP/OSPF yönlendirme yapılandırması (GUI'de sınırlı)</li>
  <li>Script ile toplu kural oluşturma: <code>execute batch [script-dosyası]</code></li>
</ul>

<h2>CLI Güvenlik Önerileri</h2>
<ul>
  <li>SSH erişimini yalnızca yönetim VLAN'ına ve belirli IP aralıklarına kısıtlayın.</li>
  <li>Güçlü admin şifreleri kullanın; varsayılan "admin/admin" değiştirin.</li>
  <li>SSH için anahtar tabanlı kimlik doğrulaması (public key) kullanın.</li>
  <li>İdletime (session timeout) değerini kısıtlayın: <code>set admintimeout 15</code></li>
  <li>Tüm admin giriş ve yapılandırma değişikliklerini loglandırın.</li>
</ul>

<h2>Sonuç</h2>
<p>CLI, ağ ve güvenlik cihazlarının en derinlemesine yönetildiği, en hızlı sorun giderme yapılan ortamdır. FortiGate CLI bilgisi, bir ağ mühendisinin en değerli becerilerinden biridir. Lider Network, FortiGate CLI eğitimi, yapılandırma ve sorun giderme konularında hizmetinizdedir.</p>
    `,
  },
  {
    slug: "siem-nedir-log-yonetimi-ve-guvenlik-izleme",
    title: "SIEM Nedir? Log Yönetimi ve Güvenlik İzleme Platformları",
    excerpt:
      "SIEM (Security Information and Event Management), farklı kaynaklardan gelen log verilerini toplayarak gerçek zamanlı güvenlik tehdidi tespiti ve olay yönetimi sağlar. SIEM mimarisi, kullanım senaryoları ve kurumsal faydalarını anlatıyoruz.",
    category: "network-temelleri",
    categoryColor: "#0ea5e9",
    tags: ["SIEM", "Log Yönetimi", "SOC", "Güvenlik İzleme", "FortiAnalyzer", "SOAR"],
    publishedAt: "2026-05-18",
    readTime: 7,
    content: `
<h2>SIEM Nedir?</h2>
<p>SIEM (Security Information and Event Management — Güvenlik Bilgi ve Olay Yönetimi), farklı ağ cihazları, sunucular, uygulamalar ve güvenlik araçlarından gelen log verilerini <strong>merkezi olarak toplayan, normalleştiren, ilişkilendiren ve analiz eden</strong> platformdur.</p>
<p>SIEM, iki eski teknolojinin birleşimidir: <strong>SIM</strong> (Security Information Management — log toplama ve saklama) + <strong>SEM</strong> (Security Event Management — gerçek zamanlı izleme ve uyarı). Modern SIEM'ler bu iki işlevi tek platformda sunar.</p>

<h2>SIEM Nasıl Çalışır?</h2>
<ul>
  <li><strong>1. Veri Toplama:</strong> Firewall, IDS/IPS, endpoint, Active Directory, VPN, web proxy, cloud hizmetleri gibi kaynaklardan Syslog, API, agent veya log collector aracılığıyla loglar toplanır.</li>
  <li><strong>2. Normalleştirme:</strong> Farklı formatlardaki loglar (CEF, LEEF, JSON, Syslog) ortak bir veri modeline dönüştürülür.</li>
  <li><strong>3. Korelasyon:</strong> Tek başına anlamsız görünen olaylar birleştirilerek tehdit örüntüleri tespit edilir. Örnek: "Başarısız giriş → Başarılı giriş → Büyük veri transferi" dizisi şüpheli olarak işaretlenir.</li>
  <li><strong>4. Alarm Üretme:</strong> Korelasyon kuralları veya ML modeli eşiği aşıldığında SOC analistlerine uyarı iletilir.</li>
  <li><strong>5. Soruşturma ve Yanıt:</strong> Analist alarmı araştırır; SIEM detaylı log arama ve zaman çizelgesi sunar. SOAR entegrasyonuyla otomatik yanıt mümkün olur.</li>
</ul>

<h2>SIEM'in Temel Yetenekleri</h2>
<ul>
  <li><strong>Gerçek Zamanlı İzleme:</strong> Tüm altyapının canlı güvenlik durumu tek ekranda.</li>
  <li><strong>Tehdit Tespiti:</strong> Bilinen saldırı imzaları + davranış analizi (UEBA) ile iç ve dış tehditleri tespit.</li>
  <li><strong>Log Saklama:</strong> Log verilerini uyumluluk gereksinimlerine göre (ISO 27001, PCI DSS, KVKK) uzun süreli saklama ve erişilebilir kılma.</li>
  <li><strong>Adli Analiz (Forensics):</strong> Bir olay sonrasında geriye dönük log araması ile saldırı zincirinin yeniden oluşturulması.</li>
  <li><strong>Uyumluluk Raporlaması:</strong> Denetçiler için hazır uyumluluk raporları (PCI DSS, ISO 27001, HIPAA).</li>
  <li><strong>UEBA (User and Entity Behavior Analytics):</strong> Kullanıcı ve varlık davranışının temel profilini çıkararak anormallik tespiti. İçeriden tehdit ve hesap ele geçirme senaryolarında etkilidir.</li>
</ul>

<h2>SIEM Mimarisi</h2>
<ul>
  <li><strong>Log Collector / Agent:</strong> Kaynaklardan log toplayan ve merkeze ileten bileşen.</li>
  <li><strong>SIEM Engine:</strong> Toplanan verileri normalleştiren, indeksleyen ve korelasyon kurallarını çalıştıran ana bileşen.</li>
  <li><strong>Arama ve Analiz Motoru:</strong> Milyonlarca log satırında saniyeler içinde arama yapılmasını sağlar (Elasticsearch tabanlı çözümler yaygındır).</li>
  <li><strong>Dashboard ve Raporlama:</strong> Görsel panolar, trend analizleri ve yönetim raporları.</li>
</ul>

<h2>Yaygın SIEM Çözümleri</h2>
<ul>
  <li><strong>FortiAnalyzer:</strong> Fortinet ekosistemi için entegre SIEM ve log yönetimi. FortiGate, FortiMail, FortiWeb loglarını analiz eder.</li>
  <li><strong>Microsoft Sentinel:</strong> Bulut tabanlı SIEM; Azure, Microsoft 365 ve çok sayıda üçüncü taraf entegrasyonu.</li>
  <li><strong>Splunk:</strong> Endüstrinin en olgun ve kapsamlı SIEM platformu; büyük ölçekli kuruluşlar için.</li>
  <li><strong>IBM QRadar:</strong> Kurumsal sınıf SIEM; davranış analizi ve tehdit istihbaratı entegrasyonu.</li>
  <li><strong>Elastic SIEM:</strong> Açık kaynak tabanlı; özelleştirilebilir ve maliyet-etkin.</li>
  <li><strong>Wazuh:</strong> Açık kaynak SIEM + EDR; KOBİ'ler için erişilebilir alternatif.</li>
</ul>

<h2>SIEM ve SOAR Entegrasyonu</h2>
<p>SOAR (Security Orchestration, Automation and Response), SIEM'in ürettiği alarmları otomatik olarak işleyerek SOC analistlerinin yükünü azaltır:</p>
<ul>
  <li>Şüpheli IP adresi tespitinde otomatik engelleme (firewall kural güncelleme)</li>
  <li>Zararlı yazılım tespitinde endpoint karantinaya alma</li>
  <li>Bilet oluşturma ve ilgili analistlere atama</li>
  <li>Tehdit istihbaratı platformlarıyla otomatik sorgulama</li>
</ul>

<h2>Sonuç</h2>
<p>SIEM, modern SOC'un (Güvenlik Operasyon Merkezi) merkez bileşenidir. Doğru yapılandırılmış SIEM, ortalama tehdit tespit süresini (MTTD) ve yanıt süresini (MTTR) dramatik biçimde kısaltır. Lider Network, FortiAnalyzer kurulumu, SIEM kural tasarımı ve SOC danışmanlığı konularında hizmet sunmaktadır.</p>
    `,
  },

  // ─── FORTILOGGER & FORTIANALYZER ─────────────────────────────────────────
  {
    slug: "fortilogger-nedir-kucuk-olcekli-log-yonetimi",
    title: "FortiLogger Nedir? Küçük ve Orta Ölçekli İşletmeler için Log Yönetimi",
    excerpt:
      "FortiLogger, Fortinet'in SMB segmentine yönelik uygun maliyetli log toplama ve analiz çözümüdür. FortiAnalyzer ile farkları, kullanım senaryoları ve lisanslama modelini detaylıca ele alıyoruz.",
    category: "soc-yonetim",
    categoryColor: "#f59e0b",
    tags: ["FortiLogger", "Log Yönetimi", "Fortinet", "SMB", "SIEM", "FortiGate"],
    publishedAt: "2026-05-21",
    readTime: 5,
    content: `
<h2>FortiLogger Nedir?</h2>
<p>FortiLogger, Fortinet'in küçük ve orta ölçekli işletmeler (SMB/KOBİ) için geliştirdiği <strong>bulut tabanlı log yönetimi ve analiz servisidir.</strong> FortiGate cihazlarından gelen logları merkezi olarak toplar; olay görünürlüğü, depolama ve temel raporlama işlevleri sunar.</p>
<p>FortiLogger, donanım yatırımı gerektirmeyen SaaS modeli ile çalışır. Fortinet'in bulut altyapısında barındırılır; kurulum ve bakım yükü yoktur.</p>

<h2>FortiLogger Ne Yapar?</h2>
<ul>
  <li><strong>Merkezi Log Toplama:</strong> FortiGate, FortiWifi ve FortiAP cihazlarından trafik, olay ve güvenlik logları toplanır.</li>
  <li><strong>Log Saklama:</strong> Seçilen plana göre 7 gün ile 1 yıl arasında log arşivleme. KVKK ve ISO 27001 uyumu için belgeleme imkânı.</li>
  <li><strong>Temel Raporlama:</strong> Trafik özetleri, en çok engellenen tehditler, bant genişliği kullanımı ve kullanıcı aktivitesi raporları.</li>
  <li><strong>FortiCloud Entegrasyonu:</strong> FortiCloud üzerinden yönetilen cihazlarla entegre çalışır; tek konsoldan erişim sağlanır.</li>
</ul>

<h2>FortiLogger vs FortiAnalyzer</h2>
<ul>
  <li><strong>FortiLogger:</strong> Bulut tabanlı, abonelik modeli, kurulum gerektirmez. Temel log saklama ve raporlama. KOBİ'ler ve şube ofisler için idealdir.</li>
  <li><strong>FortiAnalyzer:</strong> On-premise veya bulut sanal cihaz, gelişmiş korelasyon, SIEM yetenekleri, özelleştirilebilir raporlar, FortiSOAR entegrasyonu. Kurumsal ve büyük ölçekli ortamlar için tasarlanmıştır.</li>
</ul>
<p>FortiLogger'ı tercih etmeniz gereken durum: 1–10 FortiGate cihazı, karmaşık korelasyon gereksinimi yok, bütçe kısıtlı, IT ekibi küçük.</p>

<h2>Lisanslama</h2>
<p>FortiLogger, <strong>FortiGate başına yıllık abonelik</strong> modeliyle lisanslanır. Lisans seçenekleri log saklama süresine (7 gün, 1 ay, 1 yıl) ve depolama kotasına göre farklılaşır. FortiCloud Premium aboneliğiyle birlikte daha avantajlı fiyatlandırma mevcuttur.</p>

<h2>Sonuç</h2>
<p>FortiLogger, FortiAnalyzer'ın karmaşıklığı ve maliyetine ihtiyaç duymayan KOBİ'ler için görünürlük ve uyumluluk açısından yeterli temel log yönetimi sağlar. Lider Network, FortiLogger ve FortiAnalyzer lisanslama danışmanlığında hizmetinizdedir.</p>
    `,
  },
  {
    slug: "fortianalyzer-gelismis-log-analizi-korelasyon-raporlama",
    title: "FortiAnalyzer: Gelişmiş Log Analizi, Korelasyon ve Kurumsal Raporlama",
    excerpt:
      "FortiAnalyzer, Fortinet Security Fabric'in merkezi log yönetimi ve SIEM bileşenidir. Log toplama mimarisi, korelasyon kuralları, NOC/SOC dashboard'ları, HA yapılandırması ve FortiSOAR entegrasyonunu detaylıca ele alıyoruz.",
    category: "soc-yonetim",
    categoryColor: "#f59e0b",
    tags: ["FortiAnalyzer", "SIEM", "Log Yönetimi", "Korelasyon", "FortiSOAR", "SOC"],
    publishedAt: "2026-05-21",
    readTime: 8,
    content: `
<h2>FortiAnalyzer Nedir?</h2>
<p>FortiAnalyzer, Fortinet Security Fabric ekosisteminin merkezi log yönetimi, analiz ve SIEM platformudur. FortiGate, FortiMail, FortiWeb, FortiClient, FortiSandbox ve diğer Fortinet ürünlerinden gelen logları toplar; korelasyon, olay tespiti ve kapsamlı raporlama sunar.</p>
<p>Fiziksel donanım (appliance), sanal makine (VMware, Hyper-V, KVM) veya bulut (AWS, Azure) olarak dağıtılabilir.</p>

<h2>Mimari ve Log Akışı</h2>
<ul>
  <li><strong>Log Toplama:</strong> FortiGate'ler UDP/TCP Syslog veya FortiAnalyzer'a özgü şifreli protokol (OFTP) ile log gönderir. FortiAnalyzer, gelen logları normalleştirir ve indeksler.</li>
  <li><strong>Veri Depolama:</strong> Loglar sıkıştırılmış ve şifreli olarak diskte saklanır. Depolama kapasitesi model ve ek disk genişletmesiyle ölçeklendirilir.</li>
  <li><strong>Arama Motoru:</strong> Milyarlarca log satırında saniyeler içinde SQL benzeri sorgulama yapılabilir. Tarih aralığı, kaynak IP, kullanıcı, politika ID gibi filtreler desteklenir.</li>
  <li><strong>ADOMs (Administrative Domains):</strong> Çok müşterili veya çok bölümlü ortamlarda her ADOM bağımsız log alanı ve yönetici erişimi sağlar. MSSP'ler için kritik bir özelliktir.</li>
</ul>

<h2>Korelasyon Kuralları ve Olay Tespiti</h2>
<p>FortiAnalyzer'ın korelasyon motoru, birden fazla kaynaktan gelen olayları ilişkilendirerek tehdit örüntülerini tespit eder:</p>
<ul>
  <li><strong>Hazır Korelasyon Kuralları:</strong> Brute force giriş denemesi, port tarama, lateral movement, C2 iletişimi gibi saldırı senaryoları için önceden tanımlı kurallar.</li>
  <li><strong>Özel Kural Oluşturma:</strong> SQL benzeri koşul ifadeleriyle kuruma özgü korelasyon kuralları yazılabilir.</li>
  <li><strong>Olay Yönetimi:</strong> Tetiklenen alarmlar Incident Management modülüne düşer; atama, önceliklendirme ve kapatma adımları takip edilir.</li>
  <li><strong>Tehdit Puanı:</strong> Her cihaz ve kullanıcıya risk skoru atanır; yüksek riskli varlıklar öncelikli inceleme için öne çıkarılır.</li>
</ul>

<h2>NOC ve SOC Dashboard'ları</h2>
<ul>
  <li><strong>NOC (Network Operations Center):</strong> Ağ trafik özetleri, bant genişliği kullanımı, en aktif kullanıcılar ve uygulamalar, WAN bağlantı kalitesi.</li>
  <li><strong>SOC (Security Operations Center):</strong> Aktif tehditler, IPS olay özeti, engellenen URL kategorileri, VPN oturumları, kimlik doğrulama hataları.</li>
  <li><strong>Executive Dashboard:</strong> Üst yönetim için yüksek seviyeli güvenlik durumu — başarılı/başarısız politika uygulamaları, en büyük tehditler, SLA metrikleri.</li>
</ul>

<h2>Raporlama</h2>
<p>FortiAnalyzer, 100'den fazla hazır rapor şablonu içerir:</p>
<ul>
  <li>PCI DSS, ISO 27001, HIPAA uyumluluk raporları</li>
  <li>Kullanıcı aktivite raporları (hangi kullanıcı hangi siteye girdi)</li>
  <li>Uygulama kullanım raporları</li>
  <li>Tehdit analiz raporları — haftalık veya aylık otomatik gönderim</li>
  <li>Özelleştirilebilir drag-and-drop rapor tasarımcısı</li>
</ul>

<h2>FortiAnalyzer HA (Yüksek Erişilebilirlik)</h2>
<p>Kurumsal ortamlarda FortiAnalyzer kesintisiz çalışmalıdır:</p>
<ul>
  <li><strong>Aktif-Pasif HA:</strong> İki FortiAnalyzer birbirine bağlanır; aktif cihaz log alırken pasif anlık olarak senkronize olur. Aktif cihaz arızalanırsa pasif otomatik devreye girer.</li>
  <li><strong>Küme Modu:</strong> Birden fazla FortiAnalyzer, yük dengeleme ve ölçeklendirme için küme oluşturabilir.</li>
</ul>

<h2>FortiSOAR Entegrasyonu</h2>
<p>FortiAnalyzer alarmları FortiSOAR'a otomatik aktarılabilir. FortiSOAR, playbook tabanlı otomatik yanıt sağlar:</p>
<ul>
  <li>Zararlı IP tespitinde FortiGate'e otomatik engelleme kuralı gönderme</li>
  <li>Etkilenen kullanıcı hesabını Active Directory'den devre dışı bırakma</li>
  <li>ServiceNow veya Jira'ya otomatik ticket açma</li>
  <li>Tehdit istihbarat platformlarıyla (VirusTotal, MISP) otomatik zenginleştirme</li>
</ul>

<h2>Boyutlandırma</h2>
<p>FortiAnalyzer model seçiminde belirleyici faktörler: günlük log hacmi (GB/gün), saklama süresi (ay/yıl), yönetilen cihaz sayısı ve sorgu performans beklentisi. FAZ-150G küçük ölçek için yeterliyken FAZ-3000G ve üzeri büyük kurumsal ortamlar için tercih edilir.</p>

<h2>Sonuç</h2>
<p>FortiAnalyzer, Fortinet altyapısı olan her kurumsal ortamın güvenlik görünürlüğünü köklü biçimde artıran kritik bir platformdur. Lider Network, FortiAnalyzer boyutlandırma, kurulum, ADOM yapılandırması ve korelasyon kural tasarımı konularında hizmetinizdedir.</p>
    `,
  },

  // ─── HPE ─────────────────────────────────────────────────────────────────
  {
    slug: "hpe-proliant-sunucular-dl-serisi-kurumsal-rehber",
    title: "HPE ProLiant Sunucular: DL Serisi Kurumsal Altyapı Rehberi",
    excerpt:
      "Hewlett Packard Enterprise ProLiant DL serisi, veri merkezi ve kurumsal sunucu altyapısının en yaygın tercihlerinden biridir. DL360, DL380, DL560 model karşılaştırması, iLO yönetimi ve Gen10 Plus yenilikleri bu makalede.",
    category: "hpe",
    categoryColor: "#01a982",
    tags: ["HPE ProLiant", "DL Serisi", "Sunucu", "iLO", "Gen10 Plus", "Veri Merkezi"],
    publishedAt: "2026-05-21",
    readTime: 7,
    content: `
<h2>HPE ProLiant Nedir?</h2>
<p>HPE (Hewlett Packard Enterprise) ProLiant, kurumsal sunucu altyapısında dünya genelinde en yaygın kullanılan sunucu serilerinden biridir. Rack montajlı (DL serisi), tower (ML serisi) ve blade (BL/Synergy serisi) formlarıyla farklı altyapı ihtiyaçlarına yanıt verir.</p>
<p>DL (Dense/Rack) serisi, 1U ile 4U arasında değişen yükseklikleriyle veri merkezi raflarında yoğun kaynak paketi sunar.</p>

<h2>DL Serisi Modeller ve Kullanım Senaryoları</h2>
<ul>
  <li><strong>HPE ProLiant DL20 Gen10 Plus (1U):</strong> Tek soketli giriş seviyesi sunucu. Şube ofis, edge computing ve KOBİ uygulamaları için. Intel Xeon E-2300 serisi.</li>
  <li><strong>HPE ProLiant DL360 Gen10 Plus (1U):</strong> Çift soketli, yüksek yoğunluklu 1U sunucu. Veritabanı, sanallaştırma ve yüksek hesaplama gerektiren uygulamalar için. Intel Xeon Scalable 3. Nesil.</li>
  <li><strong>HPE ProLiant DL380 Gen10 Plus (2U):</strong> En popüler kurumsal sunucu modeli. Çift soket, geniş depolama kapasitesi (24 LFF veya 48 SFF disk yuvası), güçlü I/O genişleme. Genel amaçlı kurumsal kullanım, VMware/Hyper-V sanallaştırma.</li>
  <li><strong>HPE ProLiant DL560 Gen10 Plus (2U):</strong> 4 soketli yüksek çekirdekli sunucu. Büyük veritabanı (SAP HANA, Oracle), bellek yoğun uygulamalar için. 24 TB'a kadar RAM desteği.</li>
  <li><strong>HPE ProLiant DL580 Gen10 (4U):</strong> 4 soket, maksimum bellek kapasitesi. Misyon kritik uygulamalar için.</li>
</ul>

<h2>HPE Gen10 Plus Yenilikleri</h2>
<ul>
  <li><strong>AMD EPYC 7003 ve Intel Xeon 3. Nesil Desteği:</strong> PCIe Gen4, daha yüksek çekirdek sayısı ve bellek bant genişliği.</li>
  <li><strong>Silicon Root of Trust:</strong> BIOS/firmware'in kötü amaçlı değişikliğe karşı korunması için donanım düzeyinde güvenlik zinciri. Sektörde öncü bir güvenlik özelliği.</li>
  <li><strong>Persistent Memory (NVDIMM):</strong> Intel Optane PMem ile bellek ve depolama sınırının bulanıklaşması; SAP HANA gibi in-memory veritabanları için dramatik performans artışı.</li>
  <li><strong>OCP 3.0 Ağ Kartları:</strong> Düşük profilli OCP slota takılan 10/25/100 GbE kartlarla yüksek hızlı ağ bağlantısı.</li>
</ul>

<h2>HPE iLO (Integrated Lights-Out)</h2>
<p>iLO, HPE sunucularının ayrı bir yönetim işlemcisi üzerinde çalışan uzaktan yönetim arayüzüdür:</p>
<ul>
  <li>Sunucu açık olsun olmasın web arayüzüyle erişilebilir; güç kapalıyken bile yönetim yapılabilir.</li>
  <li>Uzaktan konsol (KVM over IP): Sanki sunucunun başındasınız gibi ekran, klavye ve mouse erişimi.</li>
  <li>Sanal Medya: ISO dosyasını uzaktan mount ederek işletim sistemi kurulumu veya kurtarma.</li>
  <li>Donanım sağlığı izleme: CPU sıcaklığı, fan hızı, güç tüketimi, bellek hataları gerçek zamanlı takip.</li>
  <li>iLO Amplifier Pack: Yüzlerce sunucunun iLO'sunu merkezi yönetim konsolundan yönetme.</li>
  <li><strong>iLO Advanced Lisansı:</strong> Temel iLO ücretsizdir; gelişmiş özellikler (grafik konsol, güç yönetimi, IPMI) için Advanced lisans gerekir.</li>
</ul>

<h2>HPE Smart Array — RAID Kontrolörü</h2>
<p>HPE sunucularına özgü donanımsal RAID kontrolörü:</p>
<ul>
  <li>HPE Smart Array P408i, P816i ve P100i modelleri.</li>
  <li>RAID 0, 1, 5, 6, 10, 50, 60 desteği; önbellek destekli yüksek performans.</li>
  <li>FBWC (Flash-Backed Write Cache): Güç kesintisinde önbellekteki veriyi flash'a yazar; veri kaybı riski sıfır.</li>
  <li>HPE Smart Storage Administrator (SSA) ile GUI veya CLI tabanlı yönetim.</li>
</ul>

<h2>HPE Insight Online ve GreenLake</h2>
<ul>
  <li><strong>HPE Insight Online:</strong> Sunucu sağlığı, garanti durumu ve bakım uyarılarını bulut üzerinden izleme.</li>
  <li><strong>HPE GreenLake:</strong> Sunucu altyapısını "as-a-service" modelle kullanım başına ödeme; sermaye yatırımı yerine operasyonel maliyet.</li>
</ul>

<h2>Sonuç</h2>
<p>HPE ProLiant DL serisi, güvenilirlik, yönetilebilirlik ve genişletilebilirlik açısından kurumsal veri merkezlerinin tercih ettiği sunucu platformudur. Lider Network, HPE sunucu satışı, kurulum, iLO yapılandırması ve garanti yönetimi konularında hizmetinizdedir.</p>
    `,
  },
  {
    slug: "hpe-aruba-kurumsal-ag-cozumleri-switching-wireless",
    title: "HPE Aruba Kurumsal Ağ Çözümleri: Switching, Wireless ve Network Analytics",
    excerpt:
      "HPE Aruba, kurumsal ağ altyapısında switch, kablosuz erişim noktası ve merkezi yönetim çözümleriyle öne çıkar. CX serisi switch'ler, Aruba Central bulut yönetimi ve AI-Powered network analytics rehberi.",
    category: "hpe",
    categoryColor: "#01a982",
    tags: ["HPE Aruba", "Aruba CX", "Kurumsal Switch", "Aruba Central", "Wi-Fi 6", "Network Analytics"],
    publishedAt: "2026-05-20",
    readTime: 6,
    content: `
<h2>HPE Aruba Nedir?</h2>
<p>Aruba Networks, 2015 yılında HPE tarafından satın alınan ve kurumsal ağ (LAN, WLAN, WAN) alanında güçlü bir portföye sahip ağ teknolojisi şirketidir. HPE Aruba, özellikle <strong>kampüs ve kurumsal Wi-Fi, akıllı switch ve Zero Trust ağ güvenliği</strong> alanlarında ön plana çıkar.</p>

<h2>Aruba CX Switching Serisi</h2>
<p>Aruba CX, AOS-CX işletim sistemiyle çalışan modern kurumsal switch serisidir:</p>
<ul>
  <li><strong>Aruba CX 6000:</strong> Erişim katmanı; PoE+ ve PoE++ destekli, kablolu cihazlar ve IP telefonlar için.</li>
  <li><strong>Aruba CX 6100/6200:</strong> Orta ölçekli erişim katmanı switch'leri; 10G uplink seçeneği.</li>
  <li><strong>Aruba CX 6300/6400:</strong> Dağıtım (distribution) ve çekirdek (core) katmanı; yüksek bant genişliği, ECMP, OSPF, BGP desteği.</li>
  <li><strong>Aruba CX 8325/8400:</strong> Veri merkezi ve çekirdek switch; 100GbE, programlanabilir ASIC, ağ otomasyonu.</li>
</ul>
<p><strong>AOS-CX Özellikleri:</strong></p>
<ul>
  <li>REST API ve Python scriptleme desteği — ağ otomasyonu için yerel yetenek.</li>
  <li>VSF (Virtual Switching Framework): Birden fazla switch'i tek sanal cihaz gibi yönetme.</li>
  <li>Anlık konfigürasyon checkpoint ve rollback.</li>
  <li>NetEdit ile sürüm kontrollü konfigürasyon yönetimi (GitOps tarzı).</li>
</ul>

<h2>Aruba Wireless — Wi-Fi 6 ve Wi-Fi 6E</h2>
<p>Aruba erişim noktaları (AP), kurumsal Wi-Fi'nin önde gelen tercihlerinden biridir:</p>
<ul>
  <li><strong>Aruba AP-635 (Wi-Fi 6E):</strong> 6 GHz bant desteği; yüksek yoğunluklu ortamlar (konferans salonu, fabrika zemin katı) için.</li>
  <li><strong>Aruba AP-515/535 (Wi-Fi 6):</strong> Kurumsal kampüs ortamı; MU-MIMO, OFDMA ve dinamik bant yönetimi.</li>
  <li><strong>Aruba AP-505 (Wi-Fi 6):</strong> Sınıf ortamı, ofis kullanımı için maliyet-etkin seçenek.</li>
</ul>
<p><strong>ClientMatch ve AirMatch:</strong> Aruba'ya özgü yapay zeka tabanlı özellikler. ClientMatch, istemciyi en iyi AP'ye yönlendirir; AirMatch, tüm ağın kanal ve güç planını otomatik optimize eder.</p>

<h2>Aruba Central — Bulut Yönetim Platformu</h2>
<p>Aruba Central, switch, AP ve gateway cihazlarını tek bulut konsolundan yönetir:</p>
<ul>
  <li>Sıfır dokunuşlu kurulum (Zero Touch Provisioning): Cihaz kutudan çıkıp internete bağlanınca Aruba Central'a otomatik kaydolur ve konfigürasyonunu çeker.</li>
  <li>AI Insights: Ağ sağlığını sürekli izler; olası sorunları çıkmadan önce tespit eder ve öneri sunar.</li>
  <li>Client Health Score: Her kablosuz istemcinin bağlantı kalitesini puanlar; sinyal gücü, gürültü, throughput ve gecikme baz alınır.</li>
  <li>Çok site yönetimi: Tüm lokasyonlar tek konsoldan izlenir ve yönetilir.</li>
</ul>

<h2>Aruba ve Zero Trust — Dynamic Segmentation</h2>
<p>Aruba'nın Dynamic Segmentation özelliği, kablolu ve kablosuz ağda tutarlı güvenlik politikası uygular:</p>
<ul>
  <li>Kullanıcı kimliği ve cihaz türüne göre dinamik VLAN ve politika ataması.</li>
  <li>802.1X kimlik doğrulamasıyla güvenli port erişimi; yetkisiz cihazlar izole edilir.</li>
  <li>ClearPass Policy Manager ile entegrasyon: Kullanıcı rolü, cihaz sağlığı ve konuma göre ağ erişim politikası.</li>
</ul>

<h2>Sonuç</h2>
<p>HPE Aruba, modern ağ altyapısında yapay zeka destekli yönetim ve Zero Trust yaklaşımıyla öne çıkan güçlü bir platformdur. Lider Network, Aruba switch ve AP kurulumu, Aruba Central yapılandırması ve kablosuz ağ tasarımı konularında hizmetinizdedir.</p>
    `,
  },


  // ─── QNAP ────────────────────────────────────────────────────────────────
  {
    slug: "qnap-nas-nedir-kurumsal-depolama-rehberi",
    title: "QNAP NAS Nedir? Kurumsal Veri Depolama ve Paylaşım Rehberi",
    excerpt:
      "QNAP NAS, kurumsal dosya paylaşımı, yedekleme, sanallaştırma ve güvenlik kamerası depolama gibi çok amaçlı işlevleri tek cihazda sunar. QTS işletim sistemi, model seçimi ve kurumsal kullanım senaryolarını anlatıyoruz.",
    category: "qnap",
    categoryColor: "#1ba3e0",
    tags: ["QNAP", "NAS", "Depolama", "QTS", "iSCSI", "Veri Yönetimi"],
    publishedAt: "2026-05-21",
    readTime: 7,
    content: `
<h2>QNAP NAS Nedir?</h2>
<p>QNAP (Quality Network Appliance Provider), Tayvan merkezli bir ağa bağlı depolama (NAS) üreticisidir. QNAP NAS cihazları, dosya depolama ve paylaşımının çok ötesine geçen <strong>çok amaçlı sunucu platformları</strong>dır; sanallaştırma, veritabanı, güvenlik kamera kaydı, yedekleme ve konteyner çalıştırma gibi işlevleri tek cihazda sunar.</p>

<h2>QTS İşletim Sistemi</h2>
<p>QNAP'ın özel Linux tabanlı işletim sistemi QTS, uygulama merkezi aracılığıyla genişletilebilir:</p>
<ul>
  <li><strong>File Station:</strong> Web tabanlı dosya yöneticisi; SMB, NFS, AFP, FTP, WebDAV protokolleriyle paylaşım.</li>
  <li><strong>Storage Manager:</strong> RAID yapılandırması, disk sağlığı izleme, depolama havuzu yönetimi.</li>
  <li><strong>App Center:</strong> Surveillance Station, Backup Station, Container Station, Virtualization Station gibi uygulamaları tek tıkla yükleme.</li>
  <li><strong>QuTS hero:</strong> ZFS tabanlı gelişmiş işletim sistemi; yüksek kapasiteli kurumsal depolama için veri bütünlüğü garantisi ve anlık görüntü (snapshot) yönetimi.</li>
</ul>

<h2>Kurumsal Model Seçimi</h2>
<ul>
  <li><strong>TS Serisi:</strong> Tower formunda, masaüstü veya KOBİ ofis kullanımı. TS-464 (4 bay), TS-873A (8 bay) gibi modeller.</li>
  <li><strong>TVS Serisi:</strong> Yüksek performanslı; Intel Core işlemci, PCIe genişleme yuvası, 10GbE port. Küçük-orta işletmeler için.</li>
  <li><strong>TS-x73AU / TS-x73AEU Serisi:</strong> AMD Ryzen işlemci; 4K medya transkodlama, sanallaştırma ve ağır uygulama yükü için.</li>
  <li><strong>ES Serisi (Enterprise Storage):</strong> Çift kontrolör (HA), SAS disk desteği, büyük kapasiteli kurumsal depolama. Bankalık ve sağlık sektörü.</li>
  <li><strong>TES / TL Genişletme Üniteleri:</strong> Mevcut QNAP'a bağlanarak kapasite artırımı; SAS veya SATA disk destekli.</li>
</ul>

<h2>iSCSI ve Blok Depolama</h2>
<p>QNAP, VMware ve Hyper-V ortamlarına iSCSI hedefi olarak bağlanabilir:</p>
<ul>
  <li>iSCSI LUN oluşturarak vSphere datastoresine veya Windows sunucu disk olarak bağlama.</li>
  <li>Thin provisioning ile esnek kapasite yönetimi; anlık snapshot ile VM yedekleme.</li>
  <li>Multipath I/O (MPIO) desteği; yüksek erişilebilirlik ve yük dengeleme.</li>
  <li>QNAP QES (Enterprise Storage) platformunda çift kontrolör ile active-active iSCSI erişimi.</li>
</ul>

<h2>Yedekleme Senaryoları</h2>
<ul>
  <li><strong>Hybrid Backup Sync:</strong> Yerel disk → QNAP → Bulut (AWS S3, Azure Blob, Google Cloud, Backblaze B2) zinciri. 3-2-1 yedekleme kuralını kolayca uygular.</li>
  <li><strong>Veeam Depolama Hedefi:</strong> QNAP, Veeam Backup Repository olarak kullanılabilir; immutable backup için WORM (Write Once Read Many) özelliği aktif edilebilir.</li>
  <li><strong>Snapshot:</strong> Dosya sistemini veya LUN'u anlık olarak kopyalar; yanlışlıkla silme veya fidye yazılımı sonrası hızlı geri yükleme.</li>
  <li><strong>Active Backup for Business:</strong> PC, sunucu ve VMware yedeklemesi için ücretsiz lisanslı Veeam benzeri ajan tabanlı çözüm.</li>
</ul>

<h2>Güvenlik ve Erişim Kontrolü</h2>
<ul>
  <li>Active Directory / LDAP entegrasyonu ile kurumsal kullanıcı ve grup yönetimi.</li>
  <li>Klasör bazında izin yönetimi; departman bazlı erişim segmentasyonu.</li>
  <li>AES-256 disk şifrelemesi; fiziksel güvenlik için zorunlu.</li>
  <li>2FA desteği; admin paneline yetkisiz erişime karşı ek koruma katmanı.</li>
  <li>Güvenlik Danışman Merkezi (Security Counselor): Güvenlik açığı taraması ve yapılandırma önerileri.</li>
  <li><strong>Önemli Not:</strong> QNAP cihazları internete doğrudan açılmamalıdır; VPN veya firewall arkasında tutulmalıdır. Geçmişte DeadBolt ve Qlocker fidye yazılımı saldırıları QNAP cihazlarını hedef almıştır.</li>
</ul>

<h2>Sonuç</h2>
<p>QNAP NAS, uygun maliyet ve geniş özellik seti ile KOBİ'lerden orta ölçekli kurumlara kadar esnek depolama çözümü sunar. Lider Network, QNAP model seçimi, kurulum, Active Directory entegrasyonu ve güvenlik yapılandırması konularında hizmetinizdedir.</p>
    `,
  },
  {
    slug: "qnap-surveillance-station-guvenlik-kamera-kayit",
    title: "QNAP Surveillance Station: IP Kamera Kaydı ve NVR Çözümü",
    excerpt:
      "QNAP'ın Surveillance Station uygulaması, NAS cihazını güçlü bir NVR'a dönüştürür. IP kamera bağlantısı, hareket algılama, olay kaydı ve uzaktan izleme özelliklerini detaylıca anlatıyoruz.",
    category: "qnap",
    categoryColor: "#1ba3e0",
    tags: ["QNAP", "Surveillance Station", "NVR", "IP Kamera", "Güvenlik Kamera", "Kayıt"],
    publishedAt: "2026-05-20",
    readTime: 5,
    content: `
<h2>QNAP Surveillance Station Nedir?</h2>
<p>Surveillance Station, QNAP NAS cihazlarını çalıştıran bir NVR (Network Video Recorder) uygulamasıdır. Geleneksel DVR/NVR donanımı yerine zaten kullanılan NAS cihazının kapasitesinden yararlanır; ek donanım maliyeti olmadan güvenlik kamera sistemini genişletir.</p>

<h2>Özellikler</h2>
<ul>
  <li><strong>ONVIF ve RTSP Desteği:</strong> Hikvision, Dahua, Axis, Bosch ve yüzlerce üreticinin IP kamerasıyla uyumlu. 8.000'den fazla kamera modeli sertifikalıdır.</li>
  <li><strong>Sürekli ve Olay Tabanlı Kayıt:</strong> 7/24 sürekli kayıt veya hareket algılandığında kayıt; depolama alanı verimliliği sağlanır.</li>
  <li><strong>Hareket Algılama ve Akıllı Video Analitik:</strong> Bölge tabanlı hareket algılama, çizgi geçiş tespiti, alan girişi uyarısı.</li>
  <li><strong>Anlık Bildirim:</strong> Hareket veya olay algılandığında e-posta, push bildirimi veya SMS ile uyarı.</li>
  <li><strong>Uzaktan İzleme:</strong> QVR Pro Client (Windows/Mac) ve mobil uygulama ile her yerden canlı görüntü ve kayıt erişimi.</li>
  <li><strong>Çoklu Ekran Düzeni:</strong> 4, 9, 16 kamera bölünmüş ekran görünümü; tam ekran ve e-map desteği.</li>
</ul>

<h2>Kapasite Planlaması</h2>
<p>Saklama süresi hesaplaması şu faktörlere bağlıdır:</p>
<ul>
  <li>Kamera sayısı ve çözünürlük (1080p, 4MP, 4K)</li>
  <li>Sıkıştırma formatı (H.264 vs H.265 — H.265 yaklaşık %50 daha az yer kaplar)</li>
  <li>Kayıt türü (sürekli vs hareket tabanlı)</li>
  <li>Kare hızı (fps)</li>
</ul>
<p>Tipik örnek: 8 adet 1080p kamera, H.265, 15 fps, 30 gün kayıt ≈ 8–12 TB depolama gerektirir.</p>

<h2>Lisanslama</h2>
<p>Her QNAP NAS ile 2 kamera lisansı ücretsiz gelir. Ek kameralar için QNAP kamera lisansı veya üçüncü taraf lisanslar satın alınır. 8, 16 veya sınırsız kamera paketi seçenekleri mevcuttur.</p>

<h2>Sonuç</h2>
<p>QNAP Surveillance Station, özellikle zaten QNAP NAS altyapısı olan kurumlar için ek maliyet olmadan kapsamlı NVR işlevi sağlar. Lider Network, QNAP ve IP kamera entegrasyon projelerinde hizmetinizdedir.</p>
    `,
  },

  // ─── BİTDEFENDER ─────────────────────────────────────────────────────────
  {
    slug: "bitdefender-gravityzone-kurumsal-guvenlik-platformu",
    title: "Bitdefender GravityZone: Kurumsal Endpoint Güvenlik Platformu",
    excerpt:
      "Bitdefender GravityZone, kurumsal endpoint koruması, EDR ve XDR yeteneklerini merkezi bir konsolda birleştiren önde gelen güvenlik platformudur. Katmanlı koruma mimarisi, politika yönetimi ve Gartner Magic Quadrant konumunu ele alıyoruz.",
    category: "bitdefender",
    categoryColor: "#ed1c24",
    tags: ["Bitdefender", "GravityZone", "Endpoint Security", "EDR", "XDR", "Antivirüs"],
    publishedAt: "2026-05-21",
    readTime: 7,
    content: `
<h2>Bitdefender GravityZone Nedir?</h2>
<p>Bitdefender GravityZone, kurumsal endpoint güvenliği, EDR (Endpoint Detection & Response), XDR (Extended Detection & Response) ve risk yönetimini tek platformda sunan güvenlik çözümüdür. Gartner Magic Quadrant'ta sürekli "Lider" konumunda yer alan Bitdefender, özellikle <strong>düşük sistem etkisi ve yüksek tespit oranı</strong> ile öne çıkar.</p>

<h2>GravityZone Ürün Katmanları</h2>
<ul>
  <li><strong>GravityZone Business Security:</strong> Temel endpoint koruması; antivirüs, web filtreleme, uygulama kontrolü. KOBİ'ler için başlangıç noktası.</li>
  <li><strong>GravityZone Business Security Premium:</strong> Makine öğrenimi tabanlı tehdit tespiti, HyperDetect, Sandbox Analyzer, Ransomware Mitigation. Orta ölçekli kurumlar için.</li>
  <li><strong>GravityZone Business Security Enterprise:</strong> Tam EDR yetenekleri, gelişmiş tehdit avı, olay görselleştirme ve ağ saldırısı savunması eklenir.</li>
  <li><strong>GravityZone Ultra (XDR):</strong> Endpoint'in ötesine geçer; ağ, e-posta, bulut ve kimlik kaynaklarından korelasyon. Tam XDR platformu.</li>
</ul>

<h2>Katmanlı Koruma Mimarisi</h2>
<ul>
  <li><strong>İmza Tabanlı Tarama:</strong> Bilinen zararlı yazılım veritabanıyla eşleştirme; hızlı ve düşük kaynak tüketimli.</li>
  <li><strong>HyperDetect (Makine Öğrenimi):</strong> İmzası bilinmeyen tehditleri davranış kalıplarına göre tespit eder. Çalıştırılmadan önce değerlendirme (pre-execution ML).</li>
  <li><strong>Process Inspector:</strong> Çalışan her sürecin davranışını gerçek zamanlı izler; anormal aktivite tespitinde otomatik işlem sonlandırma.</li>
  <li><strong>Exploit Defense:</strong> Tarayıcı, Office uygulamaları ve PDF okuyuculardaki exploit girişimlerini engeller; fileless malware koruması.</li>
  <li><strong>Network Attack Defense:</strong> Ağ tabanlı saldırıları endpoint katmanında tespit eder ve engeller.</li>
  <li><strong>Ransomware Mitigation:</strong> Fidye yazılımı aktivitesi tespit edildiğinde dosyaları otomatik yedekler ve saldırı sonrası geri yükleme imkânı sunar.</li>
  <li><strong>Sandbox Analyzer:</strong> Şüpheli dosyalar izole bir sanal ortamda çalıştırılarak davranışı analiz edilir.</li>
</ul>

<h2>GravityZone Control Center — Merkezi Yönetim</h2>
<p>Tüm GravityZone ürünleri, tek web konsolundan (Control Center) yönetilir:</p>
<ul>
  <li>On-premise sanal cihaz veya Bitdefender bulutunda barındırılabilir.</li>
  <li>Politika oluşturma: Departman, cihaz türü veya işletim sistemine göre farklı güvenlik politikaları.</li>
  <li>Görev zamanlama: Tarama, güncelleme ve yama görevleri özelleştirilebilir.</li>
  <li>Active Directory entegrasyonu: Kullanıcı ve bilgisayar gruplarını AD'den otomatik içe aktarır.</li>
  <li>Raporlama: Tehdit özeti, cihaz sağlığı, uyumluluk durumu raporları.</li>
</ul>

<h2>EDR — Tehdit Görünürlüğü ve Yanıt</h2>
<p>GravityZone EDR, endpoint'lerde yaşanan her olayı kaydeder ve görselleştirir:</p>
<ul>
  <li><strong>Olay Zaman Çizelgesi:</strong> Bir tehdidin nasıl başladığını, hangi süreçleri tetiklediğini ve nereye yayıldığını görsel olarak gösterir.</li>
  <li><strong>MITRE ATT&CK Eşleştirme:</strong> Tespit edilen her olay ilgili ATT&CK taktik ve teknikleriyle etiketlenir.</li>
  <li><strong>Uzak Müdahale:</strong> Etkilenen endpoint'i ağdan izole etme, şüpheli dosyayı karantinaya alma, süreç sonlandırma — tümü konsoldan uzaktan yapılabilir.</li>
</ul>

<h2>Sistem Etkisi ve Performans</h2>
<p>Bitdefender, bağımsız testlerde (AV-TEST, AV-Comparatives, SE Labs) sürekli olarak en düşük sistem etkisi ve en yüksek tespit oranı elde eden ürünler arasında yer almaktadır. Merkezi güncelleme mimarisi sayesinde bant genişliği tüketimi minimumda tutulur.</p>

<h2>Sonuç</h2>
<p>Bitdefender GravityZone, yüksek tespit oranı, düşük sistem etkisi ve kapsamlı EDR/XDR yetenekleriyle kurumsal endpoint güvenliğinin güçlü tercihlerinden biridir. Lider Network, GravityZone lisanslama, kurulum, politika tasarımı ve olay müdahale konularında hizmetinizdedir.</p>
    `,
  },
  {
    slug: "bitdefender-edr-xdr-tehdit-avlama-ve-olay-yonetimi",
    title: "Bitdefender EDR ve XDR: Tehdit Avlama ve Gelişmiş Olay Yönetimi",
    excerpt:
      "Bitdefender'ın EDR ve XDR yetenekleri, SOC ekiplerine bilinmeyen tehditleri avlama, saldırı zincirini görselleştirme ve hızlı yanıt verme gücü kazandırır. MITRE ATT&CK entegrasyonu ve proaktif tehdit avlama süreçlerini ele alıyoruz.",
    category: "bitdefender",
    categoryColor: "#ed1c24",
    tags: ["Bitdefender", "EDR", "XDR", "Tehdit Avlama", "MITRE ATT&CK", "SOC"],
    publishedAt: "2026-05-20",
    readTime: 6,
    content: `
<h2>EDR ve XDR'ın Kurumsal Güvenlikteki Yeri</h2>
<p>Geleneksel antivirüs, bilinen imzalara dayanır ve "önle" paradigmasını benimser. Ancak sofistike saldırıların %60'ından fazlası antivirüsü atlatır. <strong>EDR (Endpoint Detection & Response)</strong>, bu boşluğu kapatar: Saldırıyı engellemenin ötesinde, gerçekleşen saldırıyı tespit eder, analiz eder ve yanıt verir.</p>
<p><strong>XDR (Extended Detection & Response)</strong> ise EDR'ı endpoint'in ötesine taşır: Ağ, e-posta, bulut ve kimlik kaynaklarından gelen verileri birleştirerek daha geniş saldırı zincirlerini görünür kılar.</p>

<h2>Bitdefender EDR — Temel Yetenekler</h2>
<ul>
  <li><strong>Sürekli Kayıt:</strong> Her endpoint'te dosya oluşturma/silme, süreç başlatma, ağ bağlantısı, kayıt defteri değişikliği gibi tüm sistem aktiviteleri kaydedilir. Bu kayıtlar 90 gün veya daha uzun süre saklanabilir.</li>
  <li><strong>Tehdit Görselleştirme:</strong> Bir zararlı yazılımın nasıl yürütüldüğünü, hangi süreçleri oluşturduğunu ve hangi dosyalara eriştiğini ağaç diyagramıyla gösterir.</li>
  <li><strong>Uyarı Önceliklendirme:</strong> Makine öğrenimi ile uyarılar kritiklik seviyesine göre puanlanır; SOC analistleri en kritik olaylara odaklanır.</li>
  <li><strong>Soruşturma Araçları:</strong> Endpoint'e uzaktan bağlanarak anlık süreç listesi, açık ağ bağlantıları, çalışan servisler görüntülenir; şüpheli dosya hashları VirusTotal'a sorgulanır.</li>
</ul>

<h2>MITRE ATT&CK Çerçevesi Entegrasyonu</h2>
<p>Bitdefender EDR, tespit ettiği her aktiviteyi MITRE ATT&CK matrisinin taktik ve teknikleriyle eşleştirir:</p>
<ul>
  <li>Bir alert geldiğinde hangi ATT&CK taktiğine (Initial Access, Lateral Movement, Exfiltration vb.) karşılık geldiği hemen görünür.</li>
  <li>SOC analistleri ATT&CK bağlamında soruşturma yaparak daha hızlı karar verir.</li>
  <li>Kırmızı takım (Red Team) tatbikat sonuçları ATT&CK teknikleriyle eşleştirilerek savunma açıkları tespit edilir.</li>
</ul>

<h2>Proaktif Tehdit Avlama (Threat Hunting)</h2>
<p>Bitdefender EDR, bekleme modunda değil aktif arama modunda çalışır:</p>
<ul>
  <li><strong>Sorgulama Motoru:</strong> SQL benzeri sorgularla tüm endpoint verisi aranır. "Son 30 gün içinde powershell.exe hangi dış IP'lere bağlandı?" gibi sorular yanıtlanabilir.</li>
  <li><strong>Hazır Sorgular:</strong> Fidye yazılımı göstergesi, credential dumping, WMI persistence gibi yaygın tehdit senaryolarına yönelik hazır sorgu kütüphanesi.</li>
  <li><strong>Özel Kurallar:</strong> Kuruma özgü tehdit senaryoları için YARA kuralı veya özel davranış kuralı yazılabilir.</li>
</ul>

<h2>XDR — Çok Katmanlı Korelasyon</h2>
<p>GravityZone Ultra (XDR) şu kaynaklardan veri toplayarak korelasyon yapar:</p>
<ul>
  <li><strong>Endpoint:</strong> Tüm GravityZone sensörleri</li>
  <li><strong>Ağ:</strong> Ağ trafiği anomali tespiti</li>
  <li><strong>E-posta:</strong> Phishing, zararlı ek ve bağlantı tespiti</li>
  <li><strong>Bulut:</strong> AWS, Azure, Google Cloud aktivite logları</li>
  <li><strong>Kimlik:</strong> Active Directory ve Azure AD oturum açma anomalileri</li>
</ul>
<p>Bu kaynaklardan gelen verilerin korelasyonuyla, bir endpoint'teki zararlı yazılımın e-posta yoluyla geldiği, AD'de yetki yükseltme denediği ve bulut depolama üzerinden veri sızdırmaya çalıştığı tek bir olay zinciri olarak görülebilir.</p>

<h2>Otomatik Yanıt Eylemleri</h2>
<ul>
  <li>Şüpheli endpoint'i ağdan izole etme (yalnızca GravityZone sunucusuna erişim kalır)</li>
  <li>Zararlı süreçleri sonlandırma</li>
  <li>Dosyaları karantinaya alma ve hashı engelleme</li>
  <li>Kullanıcı hesabını devre dışı bırakma (AD entegrasyonu gerekir)</li>
</ul>

<h2>Sonuç</h2>
<p>Bitdefender EDR/XDR, modern SOC ekiplerinin bilinmeyen tehditlere karşı görünürlük ve yanıt hızı kazanmasını sağlar. Lider Network, Bitdefender GravityZone Enterprise/Ultra kurulumu ve SOC entegrasyon danışmanlığında hizmetinizdedir.</p>
    `,
  },


  // ─── IP KAMERA & CCTV ────────────────────────────────────────────────────
  {
    slug: "ip-kamera-nedir-dahua-hikvision-kurumsal-guevenlik-kamera",
    title: "IP Kamera Nedir? Dahua ve Hikvision ile Kurumsal Güvenlik Kamera Sistemleri",
    excerpt:
      "IP kamera sistemleri, geleneksel analog CCTV'nin yerini alan dijital gözetleme altyapısıdır. Dahua ve Hikvision markalarının kurumsal özellikleri, NVR seçimi, kablo altyapısı ve sistem tasarımını detaylıca anlatıyoruz.",
    category: "guvenlik-kamera",
    categoryColor: "#374151",
    tags: ["IP Kamera", "Dahua", "Hikvision", "NVR", "CCTV", "Güvenlik Kamera"],
    publishedAt: "2026-05-21",
    readTime: 8,
    content: `
<h2>IP Kamera Nedir?</h2>
<p>IP (Internet Protocol) kamera, görüntü verisini dijital olarak işleyerek <strong>ağ üzerinden ileten</strong> güvenlik kamerasıdır. Analog CCTV sistemlerinin aksine, yüksek çözünürlük (4MP, 8MP, 4K), iki yönlü ses, akıllı video analiz ve uzaktan erişim gibi gelişmiş özellikler sunar.</p>
<p>Kurumsal güvenlik kamera pazarında <strong>Dahua Technology</strong> ve <strong>Hikvision</strong>, birlikte dünya pazarının büyük bölümünü oluşturan iki Çinli üreticidir. Her ikisi de geniş ürün yelpazesi, rekabetçi fiyat ve güçlü teknik destek ile öne çıkar.</p>

<h2>IP Kamera Türleri</h2>
<ul>
  <li><strong>Dome Kamera:</strong> Tavan montajlı, geniş açılı görüş. İç mekân, mağaza, koridor ve ofis için. Vandal-proof modeller dış mekânda da kullanılır.</li>
  <li><strong>Bullet Kamera:</strong> Silindirik formda, uzun menzilli. Dış mekân, otopark, bina çevresi için. Işıklandırma koşullarına karşı daha toleranslı.</li>
  <li><strong>PTZ Kamera (Pan-Tilt-Zoom):</strong> Uzaktan yön ve zoom kontrolü. Geniş alanlarda (fabrika sahası, büyük otopark) operatörlü izleme için. Preset noktalar ve otomatik tur desteği.</li>
  <li><strong>Fisheye / 360° Kamera:</strong> Tek kamerayla 360 derecelik panoramik görüntü. Dewarping yazılımıyla çoklu sanal bakış açısı oluşturulabilir.</li>
  <li><strong>Termal Kamera:</strong> Isı farkına dayalı görüntüleme; karanlık veya sisli ortamda tespit. Kritik altyapı ve çevre güvenliği için.</li>
</ul>

<h2>Çözünürlük ve Görüntü Kalitesi</h2>
<ul>
  <li><strong>2MP (1080p Full HD):</strong> Standart kurumsal kullanım; yüz tanıma için orta mesafede yeterli.</li>
  <li><strong>4MP / 5MP:</strong> Geniş alanları kapsamak ve yüz detayı yakalamak için denge noktası. En yaygın kurumsal tercih.</li>
  <li><strong>8MP (4K):</strong> Yüksek detay gerektiren alanlar (kasa, turnike, araç plakası). Depolama gereksinimi 2 katına çıkar.</li>
  <li><strong>H.265+ (Akıllı Sıkıştırma):</strong> Dahua ve Hikvision'ın tescilli kodlama teknolojisi. Standart H.265'e göre %50–80 daha az depolama alanı kullanır. Özellikle hareket olmayan sahnelerde dramatik tasarruf sağlar.</li>
</ul>

<h2>Dahua Technology</h2>
<p>Dahua, 2001 yılında kurulan ve güvenlik kamerası, NVR, erişim kontrolü ve video analitik alanında geniş ürün portföyüne sahip bir üreticidir:</p>
<ul>
  <li><strong>WizSense Serisi:</strong> AI tabanlı; insan ve araç filtresi sayesinde yalnızca gerçek alarm tetikler, hayvandan veya yapraktan kaynaklanan yanlış alarm vermez.</li>
  <li><strong>WizMind Serisi:</strong> Gelişmiş AI — yüz tanıma, kalabalık analizi, davranış tespiti (kavga, terkedilmiş nesne, çizgi geçiş). Kritik altyapı ve büyük alan güvenliği için.</li>
  <li><strong>Cooper Serisi:</strong> KOBİ ve küçük işletmeler için ekonomik, plug-and-play çözümler.</li>
  <li><strong>Starlight Teknolojisi:</strong> Düşük ışık koşullarında renkli görüntü; 0,001 lux'ten az ışıkta gerçek renkli görüntü üretebilir.</li>
</ul>

<h2>Hikvision</h2>
<p>Hikvision, 2001 yılında kurulan ve dünyada en yüksek satış rakamlarına sahip güvenlik kamera üreticisidir:</p>
<ul>
  <li><strong>AcuSense Serisi:</strong> AI tabanlı insan ve araç sınıflandırması; yanlış alarm oranını dramatik biçimde düşürür. Entegre spotlight ile karanlıkta renkli aydınlatma.</li>
  <li><strong>ColorVu Serisi:</strong> F1.0 büyük diyafram ve warm light LED ile tam karanlıkta renkli görüntü. Gece gözetleme için pazar standardı haline gelmiştir.</li>
  <li><strong>DeepinView Serisi:</strong> Gelişmiş AI analitik — yüz tanıma, plaka tanıma (ANPR), davranış analizi. Şehir güvenliği ve büyük kurumsal kullanım.</li>
  <li><strong>PanoVu Serisi:</strong> Çok sensörlü panoramik kameralar; 180° veya 360° kesintisiz görüntü.</li>
</ul>

<h2>NVR Seçimi</h2>
<p>IP kamera sistemi, görüntüleri kaydeden ve yöneten <strong>NVR (Network Video Recorder)</strong> gerektirir:</p>
<ul>
  <li><strong>Kapasite:</strong> 4, 8, 16, 32, 64 veya 128 kamera kanalı destekleyen modeller. İleride büyüme için kanal sayısının %20–30 üzerinde seçin.</li>
  <li><strong>Bant Genişliği:</strong> NVR'ın işleyebileceği toplam Mbps kapasitesi. 4MP H.265 kamera yaklaşık 2–4 Mbps kullanır; toplam kamera bant genişliğini aşmamalıdır.</li>
  <li><strong>Depolama:</strong> NVR'a takılan HDD kapasitesi. Güvenlik kamerası için WD Purple veya Seagate SkyHawk gibi sürekli yazma için optimize edilmiş diskler kullanılmalıdır.</li>
  <li><strong>AI NVR:</strong> Kamerada AI işlemi yoksa NVR'da analiz yapılabilir; maliyet dengesini optimize eder.</li>
</ul>

<h2>Ağ Altyapısı ve PoE</h2>
<ul>
  <li>IP kameralar genellikle <strong>PoE (Power over Ethernet)</strong> ile beslenir; tek CAT6 kablo hem veri hem güç taşır.</li>
  <li>PoE standartları: IEEE 802.3af (15W), 802.3at/PoE+ (30W), 802.3bt/PoE++ (60–90W). PTZ ve ısıtmalı kameralar yüksek güç gerektirir.</li>
  <li>Kamera başına maksimum kablo uzunluğu 100 metredir; uzun mesafeler için PoE Extender veya fiber kullanılır.</li>
  <li>Kurumsal ağa kamera VLAN'ı oluşturarak üretim ağından izole edilmesi güvenlik açısından zorunludur.</li>
</ul>

<h2>Siber Güvenlik Uyarısı</h2>
<p>IP kamera sistemleri siber güvenlik riskleri taşır:</p>
<ul>
  <li>Varsayılan şifreleri mutlaka değiştirin; üretici varsayılanları saldırganlar tarafından iyi bilinir.</li>
  <li>Kamera yönetim arayüzünü internete doğrudan açmayın; VPN veya güvenli uzak erişim portalı kullanın.</li>
  <li>Firmware güncellemelerini düzenli uygulayın; kritik güvenlik açıkları yamalarla kapatılır.</li>
  <li>Kamera trafiğini ayrı VLAN'da tutun; internet erişimini engelleyin (NVR üzerinden yönetim yeterli).</li>
</ul>

<h2>Sonuç</h2>
<p>Dahua ve Hikvision, kurumsal IP kamera projelerinde geniş ürün yelpazesi, AI analitik yetenekleri ve uygun fiyatıyla güçlü tercihlerdir. Lider Network, kamera sistem tasarımı, NVR seçimi, kurulum ve ağ entegrasyonu konularında hizmetinizdedir.</p>
    `,
  },
  {
    slug: "hikvision-deeplearning-yapay-zeka-kamera-ozellikleri",
    title: "Hikvision Deep Learning: Yapay Zeka Destekli Kamera Özellikleri ve Analitik",
    excerpt:
      "Hikvision'ın Deep Learning teknolojisi, geleneksel video analitiği yapay zeka ile buluşturuyor. Yüz tanıma, plaka okuma, davranış analizi, AcuSense ve ColorVu özelliklerini kurumsal kullanım perspektifinden ele alıyoruz.",
    category: "guvenlik-kamera",
    categoryColor: "#374151",
    tags: ["Hikvision", "Deep Learning", "Yapay Zeka", "Yüz Tanıma", "ANPR", "Video Analitik"],
    publishedAt: "2026-05-20",
    readTime: 6,
    content: `
<h2>Hikvision Deep Learning Nedir?</h2>
<p>Hikvision, 2016 yılından itibaren ürünlerine derin öğrenme (deep learning) tabanlı yapay zeka işlemcileri entegre ederek video analitiği alanında çığır açmıştır. Geleneksel piksel farklılığı temelli hareket algılama yerine, kameralar <strong>nesneleri sınıflandırabilir, yüzleri tanıyabilir, araç plaklarını okuyabilir ve anormal davranışları tespit edebilir.</strong></p>

<h2>AcuSense: Akıllı Alarm Filtresi</h2>
<p>AcuSense, Hikvision'ın orta segment kameralarındaki AI özelliğidir. Temel işlevi şudur: Hareket algılandığında, hareket kaynağı yapay zeka tarafından sınıflandırılır:</p>
<ul>
  <li><strong>İnsan veya araç:</strong> Gerçek alarm tetiklenir; operatör veya mobil cihaza bildirim gönderilir.</li>
  <li><strong>Hayvan, yaprak hareketi, ışık değişimi:</strong> Alarm tetiklenmez; yanlış alarm önlenir.</li>
</ul>
<p>Geleneksel sistemlerde çoğu güvenlik personeli alarm yorgunluğu yaşar ve gerçek olayları kaçırır. AcuSense bu problemi kökten çözer.</p>

<h2>ColorVu: Karanlıkta Renkli Görüntü</h2>
<p>ColorVu serisi, F1.0 büyük diyaframlı lens ve warm light LED kombinasyonuyla tam karanlıkta bile renkli görüntü üretir:</p>
<ul>
  <li>Geleneksel gece görüş (IR): Siyah-beyaz görüntü, kıyafet rengi veya araç rengi ayrımı yapılamaz.</li>
  <li>ColorVu: Şüpheli kişinin kıyafet rengi, araç rengi gibi kritik detaylar renkli olarak görüntülenir; delil değeri çok daha yüksektir.</li>
  <li>LED aktivasyonu hareket algılandığında otomatik yapılabilir; sürekli açık kalmak zorunda değil.</li>
</ul>

<h2>Yüz Tanıma (Face Recognition)</h2>
<p>Hikvision DeepinView ve Pro serisi kameralarda yüz tanıma:</p>
<ul>
  <li>Veritabanındaki kişilerin kameradan geçişte otomatik eşleştirilmesi.</li>
  <li><strong>İzin Listesi:</strong> Çalışanlar, misafirler — eşleşme bulunduğunda bildirim veya kapı açma aksiyonu.</li>
  <li><strong>Kara Liste:</strong> Güvenlik tehdidi olarak işaretlenmiş kişiler — alarm tetiklenir.</li>
  <li>Yüz veritabanı boyutu: Model bağımlı; genellikle 100 bin – 1 milyon yüz profili.</li>
</ul>
<p><strong>Yasal Uyarı:</strong> Yüz tanıma sistemi KVKK kapsamında biyometrik veri işleme niteliği taşır; açık rıza ve KVKK uyum gereksinimleri karşılanmalıdır.</p>

<h2>ANPR — Otomatik Plaka Tanıma</h2>
<p>Hikvision ANPR kameraları, araç plakalarını yüksek hız ve doğrulukla okur:</p>
<ul>
  <li>Otopark yönetimi: İzinli araçlar bariyer açar; yabancı araçlar alarm üretir.</li>
  <li>Hız tespiti ile entegrasyon: Geçiş süresiyle hesaplanan ortalama hız.</li>
  <li>Çoklu şerit ve yüksek hız (120 km/h'e kadar) desteği.</li>
  <li>Plaka veritabanı sorgulaması: Çalıntı araç, kara listeli plaka eşleştirme.</li>
</ul>

<h2>Davranış Analizi</h2>
<ul>
  <li><strong>Çizgi Geçiş Tespiti:</strong> Belirlenen sanal çizgiyi geçen kişi veya araç alarm üretir.</li>
  <li><strong>Alan Girişi/Çıkışı:</strong> Yasak bölgeye giriş veya çıkışta alarm.</li>
  <li><strong>Bırakılan/Kaybolan Nesne:</strong> Belirli süre hareketsiz kalan yabancı nesne veya kaybolan eşya tespiti.</li>
  <li><strong>Kalabalık Tespiti:</strong> Belirlenen alandaki insan sayısı eşiği aşıldığında uyarı.</li>
  <li><strong>Kavga Tespiti:</strong> Anormal fiziksel hareket örüntüsü tespiti.</li>
</ul>

<h2>Entegrasyon ve VMS</h2>
<p>Hikvision kamera sistemi, üçüncü taraf VMS (Video Management Software) yazılımlarıyla entegre olur:</p>
<ul>
  <li>Milestone XProtect, Genetec Security Center, Avigilon Control Center gibi kurumsal VMS platformlarıyla ONVIF/SDK entegrasyonu.</li>
  <li>Hikvision'ın kendi VMS'i: iVMS-4200 (PC) ve Hik-Connect (mobil). Kurumsal ortam için Hik-ProConnect.</li>
  <li>Erişim kontrolü entegrasyonu: Kapı geçiş sistemi ile kamera kayıtları senkronize edilir; kim, ne zaman, hangi kapıdan geçti bilgisi video kanıtıyla eşlenir.</li>
</ul>

<h2>Sonuç</h2>
<p>Hikvision'ın Deep Learning tabanlı ürünleri, güvenlik kamera sistemlerini pasif kayıt cihazlarından aktif güvenlik bileşenlerine dönüştürür. Lider Network, Hikvision kamera sistem tasarımı, AI analitik yapılandırması ve entegrasyon projelerinde hizmetinizdedir.</p>
    `,
  },
  {
    slug: "dahua-nvr-yapılandırma-ve-uzaktan-izleme-rehberi",
    title: "Dahua NVR Yapılandırması ve Uzaktan İzleme Rehberi",
    excerpt:
      "Dahua NVR kurulumu, disk yapılandırması, kamera ekleme, kayıt planlaması ve DMSS/DSS Pro ile uzaktan izleme ayarlarını adım adım ele alıyoruz. Kurumsal güvenlik kamera altyapısı için pratik rehber.",
    category: "guvenlik-kamera",
    categoryColor: "#374151",
    tags: ["Dahua", "NVR", "Kurulum", "DMSS", "Uzaktan İzleme", "Güvenlik Kamera"],
    publishedAt: "2026-05-19",
    readTime: 6,
    content: `
<h2>Dahua NVR Nedir?</h2>
<p>Dahua NVR (Network Video Recorder), IP kameralardan gelen video akışını kaydeden, depolayan ve yöneten merkezi cihazdır. Analog sistemlerdeki DVR'ın yerini alan NVR, tamamen ağ tabanlı çalışır; yüksek çözünürlük ve akıllı analitik desteği sunar.</p>

<h2>Model Seçimi</h2>
<ul>
  <li><strong>NVR4xxx-4KS3 Serisi:</strong> SMB; 4–32 kanal, H.265+, AI özellikli. Küçük-orta ölçekli projeler.</li>
  <li><strong>NVR5xxx-4KS3 Serisi:</strong> Kurumsal; 16–128 kanal, gelişmiş AI analitik, yüksek bant genişliği desteği.</li>
  <li><strong>Ultra Serisi NVR7xxx:</strong> Büyük ölçekli kurumsal; 256 kanal, çift güç kaynağı, RAID disk yapısı, yüksek erişilebilirlik.</li>
</ul>

<h2>Disk Yapılandırması ve Kapasite Hesabı</h2>
<ul>
  <li>Dahua NVR'lar 1–16 HDD yuvası içerir; güvenlik kamerası için <strong>Dahua Guardian veya WD Purple / Seagate SkyHawk</strong> diskler kullanılmalıdır (7/24 yazma için optimize).</li>
  <li>Kapasite hesabı: Kamera sayısı × bit hızı × saniye × saklama günü. Dahua'nın web üzerindeki kapasite hesaplama aracı (Storage Calculator) bu hesabı otomatik yapar.</li>
  <li>RAID yapılandırması: Üst model NVR'larda RAID 1/5/6 desteği; disk arızasında veri kaybı önlenir.</li>
</ul>

<h2>Kamera Ekleme ve Yapılandırma</h2>
<ul>
  <li><strong>Otomatik Keşif:</strong> NVR, aynı ağ segmentindeki Dahua kameraları otomatik bulur ve Dahua protokolüyle ekler.</li>
  <li><strong>ONVIF:</strong> Dahua dışı markalar (Hikvision dahil) ONVIF profiliyle eklenir; temel kayıt ve canlı izleme çalışır ancak gelişmiş AI özellikler Dahua kamerasında tam desteklenir.</li>
  <li>Her kanal için bağımsız çözünürlük, kare hızı ve kalite ayarı yapılabilir; bant genişliği yönetimi önem taşır.</li>
</ul>

<h2>Kayıt Planlaması</h2>
<ul>
  <li><strong>Sürekli Kayıt:</strong> 7/24 tüm kanal; maksimum depolama kullanımı.</li>
  <li><strong>Zamanlı Kayıt:</strong> Belirli saat dilimlerinde (mesai saatleri, gece) farklı kalite veya kapasite.</li>
  <li><strong>Olay Tabanlı Kayıt:</strong> Hareket algılama, alarm girişi veya AI tespitinde kayıt başlar; öncesi (pre-record 5–30 sn) ve sonrası (post-record) da kaydedilir.</li>
  <li><strong>Hibrit Plan:</strong> Mesai saatlerinde düşük kalite sürekli + hareket anında yüksek kalite. Depolamayı optimize eder.</li>
</ul>

<h2>Uzaktan İzleme — DMSS ve DSS Pro</h2>
<ul>
  <li><strong>DMSS (Dahua Mobile Surveillance System):</strong> iOS ve Android için ücretsiz uygulama. Canlı izleme, kayıt oynatma, anlık bildirim, PTZ kontrolü. P2P bağlantı sayesinde statik IP gerekmez.</li>
  <li><strong>DSS Pro:</strong> Büyük ölçekli kurumsal yönetim yazılımı (Windows/Linux). Çoklu NVR, kamera, erişim kontrolü ve alarm panellerini tek konsoldan yönetir. Olay yönetimi ve e-map entegrasyonu.</li>
  <li><strong>Dahua DMSS Cloud:</strong> P2P bağlantı servis ücretsizdir; NVR'a port açma veya statik IP gerektirmez. Güvenlik için P2P tüneli şifrelenmiştir.</li>
</ul>

<h2>Güvenlik Yapılandırması</h2>
<ul>
  <li>Varsayılan admin şifresini ilk kurulumda mutlaka değiştirin.</li>
  <li>NVR yönetim arayüzüne (HTTP/HTTPS) erişimi yalnızca yönetim VLAN'ından izin verin.</li>
  <li>Firmware güncellemelerini düzenli kontrol edin; Dahua önemli güvenlik yamalarını periyodik yayımlar.</li>
  <li>HTTPS yönetim arayüzü aktif edin; HTTP'yi devre dışı bırakın.</li>
  <li>Gereksiz açık portları (Telnet, FTP) kapatın.</li>
</ul>

<h2>Sonuç</h2>
<p>Dahua NVR sistemi, uygun maliyet ve gelişmiş AI analitik özellikleriyle kurumsal güvenlik kamera altyapısında güçlü bir seçenektir. Lider Network, Dahua kamera sistem tasarımı, NVR kurulumu ve uzaktan izleme yapılandırması konularında hizmetinizdedir.</p>
    `,
  },
  {
    slug: "ddos-saldirisi-nedir-korunma-yontemleri",
    title: "DDoS Saldırısı Nedir? Türleri, Nasıl Çalışır ve Korunma Yöntemleri",
    excerpt:
      "DDoS (Dağıtık Hizmet Engelleme) saldırıları, kurumsal web sitelerini ve altyapıyı çevrimdışı bırakabilen en yaygın siber tehditlerden biridir. Volumetrik, protokol ve uygulama katmanı saldırılarını ve FortiDDoS ile korumayı anlatıyoruz.",
    category: "siber-guvenlik",
    categoryColor: "#EE3124",
    tags: ["DDoS", "Siber Saldırı", "FortiDDoS", "Cloudflare", "Botnet", "Ağ Güvenliği"],
    publishedAt: "2026-05-21",
    readTime: 7,
    content: `
<h2>DDoS Nedir?</h2>
<p>DDoS (Distributed Denial of Service — Dağıtık Hizmet Engelleme), onlarca binlerce ele geçirilmiş cihazdan (botnet) eş zamanlı saldırıyla bir hedefe aşırı trafik göndererek hizmeti aksatmayı veya tamamen durdurmayı hedefleyen siber saldırı türüdür.</p>
<p>DoS (Denial of Service) tek kaynaktan gelirken DDoS, coğrafi olarak dağıtık binlerce kaynaktan geldiği için filtrelenmesi çok daha zordur. Saldırılar saniyeler içinde yüzlerce Gbps trafik üretebilir.</p>

<h2>DDoS Saldırı Türleri</h2>
<p><strong>1. Volumetrik Saldırılar (Hacim Bazlı):</strong></p>
<ul>
  <li>Hedefin bant genişliğini tüketmeyi amaçlar. UDP Flood, ICMP Flood, DNS Amplification, NTP Amplification.</li>
  <li>Amplifikasyon saldırısı: Saldırgan küçük bir istek gönderir, sunucu çok daha büyük yanıt döndürür ve bu yanıt hedefe yönlendirilir. NTP Amplification'da 1 bayt istek → 556 bayt yanıt (556x büyütme).</li>
</ul>
<p><strong>2. Protokol Saldırıları (State Exhaustion):</strong></p>
<ul>
  <li>Firewall, yük dengeleyici ve sunucuların durum tablosunu doldurarak kaynak tüketir. SYN Flood (TCP el sıkışmasının yarıda bırakılması), Ping of Death, Smurf Attack.</li>
  <li>SYN Flood: Saldırgan binlerce yarım açık TCP bağlantısı bırakır; sunucu her biri için durum bilgisi tutar ve bellek dolar.</li>
</ul>
<p><strong>3. Uygulama Katmanı Saldırıları (Layer 7):</strong></p>
<ul>
  <li>Az trafikle maksimum etki. HTTP GET/POST Flood, Slowloris (bağlantıları çok yavaş tutar), DNS Query Flood.</li>
  <li>Tespit en zordur; saldırı trafiği meşru trafiğe benzer görünür.</li>
</ul>

<h2>Korunma Yöntemleri</h2>
<p><strong>ISP Düzeyinde Korunma:</strong></p>
<ul>
  <li>Büyük ölçekli volumetrik saldırılarda kaynak ISP veya upstream sağlayıcı trafik temizleme (scrubbing) hizmeti sunar.</li>
  <li>Anycast ağı üzerinden trafik dağıtımı: Cloudflare, Akamai gibi CDN/DDoS koruma sağlayıcıları.</li>
</ul>
<p><strong>Cloudflare / CDN Tabanlı Koruma:</strong></p>
<ul>
  <li>DNS kayıtları Cloudflare'e yönlendirilir; tüm trafik Cloudflare'in anycast ağından geçer, temizlenir, ardından gerçek sunucuya iletilir.</li>
  <li>Cloudflare Magic Transit: Ağ katmanında (BGP) DDoS koruma; tam IP aralığı koruması.</li>
</ul>
<p><strong>FortiDDoS:</strong></p>
<ul>
  <li>Fortinet'in özel DDoS koruma cihazı. Temel trafik profilini öğrenir ve sapmayı gerçek zamanlı tespit eder.</li>
  <li>Hardware tabanlı işlem: 100+ Gbps saldırı trafiğini yazılım olmadan filtreler.</li>
  <li>FortiGate ile entegre çalışarak katmanlı koruma sunar.</li>
</ul>
<p><strong>Ağ Yapılandırması:</strong></p>
<ul>
  <li>Rate limiting: Kaynak IP başına saniyede maksimum bağlantı sayısı sınırı.</li>
  <li>SYN Cookie: SYN Flood'a karşı; sunucu yarım açık bağlantılar için durum tutmaz.</li>
  <li>ACL ile kaynak IP/ülke filtreleme: İş yapmadığınız coğrafyalardan gelen trafiği engelleme.</li>
  <li>Anycast DNS: DNS sunucularını coğrafi dağıtarak tek nokta arızasını önleme.</li>
</ul>

<h2>DDoS Müdahale Planı</h2>
<ul>
  <li>Saldırı trafiğini tanımlayın ve kaynak analizi yapın (NetFlow, SIEM).</li>
  <li>ISP ile iletişime geçin; upstream filtreleme talep edin.</li>
  <li>Acil durum CDN / scrubbing servisine geçiş yapın.</li>
  <li>Kritik servislerin durumunu izleyin; önceliklendirme yapın.</li>
  <li>Olay sonrası: Log analizi, saldırı vektörü tespiti ve önlem güncellemesi.</li>
</ul>

<h2>Sonuç</h2>
<p>DDoS koruması katmanlı bir yaklaşım gerektirir: ISP, CDN ve yerel altyapı önlemleri birlikte değerlendirilmelidir. Lider Network, FortiDDoS kurulumu, DDoS koruma stratejisi tasarımı ve acil müdahale planlaması konularında hizmetinizdedir.</p>
    `,
  },
  {
    slug: "sosyal-muhendislik-phishing-saldirisi-korunma",
    title: "Sosyal Mühendislik ve Phishing: Saldırı Yöntemleri ve Korunma Stratejileri",
    excerpt:
      "Siber saldırıların %90'ından fazlası insan faktöründen başlar. E-posta phishing, vishing, smishing, pretexting ve spear phishing saldırı türlerini ve kurumsal korunma yöntemlerini ele alıyoruz.",
    category: "siber-guvenlik",
    categoryColor: "#EE3124",
    tags: ["Sosyal Mühendislik", "Phishing", "Siber Güvenlik", "Farkındalık", "BEC", "Email Güvenliği"],
    publishedAt: "2026-05-20",
    readTime: 7,
    content: `
<h2>Sosyal Mühendislik Nedir?</h2>
<p>Sosyal mühendislik, teknik açıkları istismar etmek yerine <strong>insan psikolojisini manipüle ederek</strong> hedefi kandırmayı hedefleyen saldırı metodolojisidir. Aciliyet yaratma, otorite taklidi, korku veya merak gibi duygusal tetikleyiciler kullanılır.</p>
<p>Verizon 2024 DBIR (Data Breach Investigations Report) verilerine göre doğrulanmış veri ihlallerinin <strong>%68'inde insan faktörü</strong> belirleyici rol oynamaktadır.</p>

<h2>Phishing Türleri</h2>
<ul>
  <li><strong>Email Phishing:</strong> Geniş kitleye gönderilen sahte e-postalar. Banka, kargo şirketi veya kurumsal servis taklidi. Zararlı bağlantı veya ek içerir.</li>
  <li><strong>Spear Phishing:</strong> Belirli bir kişiye veya kuruma hedeflenmiş, kişiselleştirilmiş phishing. "Merhaba [Gerçek Ad], [Gerçek Şirket] muhasebe departmanından..." Çok daha yüksek başarı oranı.</li>
  <li><strong>Whaling:</strong> CEO, CFO gibi üst yöneticileri hedef alan spear phishing. Yüksek değerli hedeflere yöneliktir.</li>
  <li><strong>BEC (Business Email Compromise):</strong> Yönetici e-posta hesabı ele geçirilir veya taklit edilir; muhasebeden acil havale talep edilir. Global kayıp yılda milyarlarca dolar.</li>
  <li><strong>Vishing (Voice Phishing):</strong> Telefon üzerinden sosyal mühendislik. IT desteği veya banka yetkilisi taklidi yaparak şifre veya OTP kodu alınması.</li>
  <li><strong>Smishing (SMS Phishing):</strong> SMS ile sahte bağlantı gönderimi. Kargo bildirimi, ödül kazanma veya hesap uyarısı temalı.</li>
  <li><strong>Quishing (QR Phishing):</strong> Sahte QR kod içeren fiziksel veya dijital materyal. Tarandığında zararlı siteye yönlendirir.</li>
</ul>

<h2>Saldırı Anatomisi — Phishing E-postası Nasıl Çalışır?</h2>
<ul>
  <li><strong>Hazırlık:</strong> Saldırgan LinkedIn, şirket web sitesi ve sosyal medyadan hedef hakkında bilgi toplar (OSINT).</li>
  <li><strong>Alan Adı Sahtekârlığı:</strong> İnce değişikliklerle gerçeğe benzeyen alan adı (lider-network.com.tr yerine lidernetwork-destek.com gibi) tescil edilir.</li>
  <li><strong>E-posta Gönderimi:</strong> SPF/DKIM bypass veya ele geçirilmiş bir hesaptan gönderim. Aciliyet yaratan konu satırı: "Acil: Hesabınız 24 saat içinde kapanacak."</li>
  <li><strong>Tıklama ve Kimlik Çalma:</strong> Sahte giriş sayfası gerçek site görünümünü taklit eder; girilen kimlik bilgileri saldırgana iletilir.</li>
  <li><strong>Erişim ve Yayılma:</strong> Çalınan kimlik bilgileriyle sisteme giriş, lateral movement ve veri sızdırma.</li>
</ul>

<h2>Teknik Korunma Yöntemleri</h2>
<ul>
  <li><strong>SPF, DKIM ve DMARC:</strong> E-posta kimlik doğrulama protokolleri. Alan adı taklidi yapan e-postaları reddeder veya karantinaya alır. <code>p=reject</code> politikası en güçlü korumadır.</li>
  <li><strong>E-posta Güvenlik Geçidi (SEG):</strong> Fortimail, Microsoft Defender for Office 365, Proofpoint, Mimecast. Gelen e-postaları sandbox'ta analiz eder; zararlı ekler ve bağlantılar engellenir.</li>
  <li><strong>URL Rewriting ve Safe Links:</strong> Tüm bağlantılar tıklama anında güvenlik servisine sorgulanır; zararlıysa engellenir.</li>
  <li><strong>MFA (Çok Faktörlü Kimlik Doğrulama):</strong> Kimlik bilgileri çalınsa bile hesaba erişim engellenir. Phishing'in etkisini dramatik biçimde kısıtlar.</li>
  <li><strong>FIDO2 / Passkey:</strong> Phishing'e karşı tamamen bağışık kimlik doğrulama; şifre yoktur ve kimlik avı sayfası kullanıcı kimliğini çalamaz.</li>
</ul>

<h2>İnsan Faktörü — Farkındalık Eğitimi</h2>
<ul>
  <li><strong>Simüle Phishing Kampanyası:</strong> KnowBe4, Proofpoint Security Awareness gibi platformlarla gerçek saldırı senaryoları simüle edilir; tıklayan çalışanlara anında eğitim verilir.</li>
  <li>Farkındalık eğitimi yılda bir değil, sürekli olmalıdır; tehdit manzarası değişir.</li>
  <li>Rapor etme kültürü: Şüpheli e-postaları raporlayan çalışanlar ödüllendirilmeli; korkan değil, güvenen ortam oluşturulmalı.</li>
  <li>Simüle saldırı sonuçları HR ile paylaşılmamalı; cezalandırıcı değil, eğitici amaçlı kullanılmalı.</li>
</ul>

<h2>BEC Özel Korumaları</h2>
<ul>
  <li>Havale taleplerine çift onay süreci zorunlu tutulmalı (telefon veya yüz yüze doğrulama).</li>
  <li>Muhasebe personeline CEO veya CFO'dan gelen acil havale taleplerinde doğrulama prosedürü öğretilmeli.</li>
  <li>E-posta sistemlerinde "Dış gönderici" etiketi etkinleştirilmeli; dışarıdan gelen e-postalar görsel uyarıyla işaretlenmeli.</li>
</ul>

<h2>Sonuç</h2>
<p>Sosyal mühendislik ve phishing saldırılarına karşı en etkili savunma, teknik kontroller ile insan farkındalığının birlikte kullanılmasıdır. Lider Network, e-posta güvenliği çözümleri, simüle phishing kampanyaları ve güvenlik farkındalık eğitimi konularında destek sunmaktadır.</p>
    `,
  },


  // ─── FAİLOVER & HA ───────────────────────────────────────────────────────
  {
    slug: "fortigate-ha-failover-active-passive-active-active",
    title: "FortiGate HA Failover: Active-Passive ve Active-Active Yapılandırması",
    excerpt:
      "FortiGate HA (High Availability), firewall arızasında kesintisiz ağ erişimi sağlayan kritik altyapı özelliğidir. Active-Passive ve Active-Active modları, heartbeat yapılandırması, session senkronizasyonu ve failover testini detaylıca anlatıyoruz.",
    category: "fortigate-ngfw",
    categoryColor: "#EE3124",
    tags: ["FortiGate", "HA", "Failover", "Active-Passive", "Active-Active", "Yüksek Erişilebilirlik"],
    publishedAt: "2026-05-21",
    readTime: 7,
    content: `
<h2>FortiGate HA Nedir?</h2>
<p>FortiGate HA (High Availability — Yüksek Erişilebilirlik), iki veya daha fazla FortiGate'i küme (cluster) halinde çalıştırarak donanım arızasında veya yazılım sorununda <strong>sıfır veya minimum kesinti</strong> ile ağ güvenliği hizmetini sürdürmeyi sağlar.</p>
<p>Kurumsal ortamlarda firewall tek arıza noktası (SPOF) olmamalıdır. HA küme, hem arıza dayanıklılığı hem de bakım kolaylığı sağlar.</p>

<h2>HA Modları</h2>
<p><strong>Active-Passive (A-P):</strong></p>
<ul>
  <li>Bir FortiGate aktif olarak tüm trafiği işler; diğeri pasif modda bekler ve aktifi sürekli izler.</li>
  <li>Aktif cihaz arızalandığında pasif cihaz saniyeler (genellikle 1–3 sn) içinde devreye girer.</li>
  <li>Oturum tablosu ve yapılandırma anlık olarak senkronize edilir; TCP oturumları bile korunur.</li>
  <li>Pasif cihaz atıl durmadığı için donanım verimliliği düşük; ancak yönetim basittir ve tam kapasite yedeklilik garantilenir.</li>
</ul>
<p><strong>Active-Active (A-A):</strong></p>
<ul>
  <li>Her iki FortiGate de aktif trafik işler; yük paylaşımı yapılır.</li>
  <li>Bir cihaz arızalandığında diğeri tüm yükü üstlenir.</li>
  <li>Kapasite iki katına çıktığı için yüksek trafik hacminde tercih edilir; ancak UTM/NGFW özellikleri (IPS, SSL inspection) yük dengelemeyi desteklemeyebilir.</li>
</ul>

<h2>Heartbeat Bağlantısı</h2>
<p>HA kümesinde cihazlar birbirini <strong>heartbeat</strong> bağlantısı üzerinden izler:</p>
<ul>
  <li>Ayrı bir ağ arayüzü (veya portlar) heartbeat trafiğine ayrılır; üretim trafiğiyle karışmamalıdır.</li>
  <li>İdeal yapılandırma: İki bağımsız heartbeat bağlantısı (farklı fiziksel kablo/switch); tek kablo kopması failover'a neden olmamalıdır.</li>
  <li>Heartbeat veri: Konfigürasyon senkronizasyonu, oturum tablosu, ARP tablosu, HA sağlık bilgisi.</li>
  <li>Ağ aralığı varsayılan: 169.254.0.x (link-local); özelleştirilebilir.</li>
</ul>

<h2>Oturum Senkronizasyonu</h2>
<ul>
  <li>TCP oturumları A-P modunda anlık olarak pasif cihaza senkronize edilir.</li>
  <li>Failover anında aktif TCP bağlantıları kesilmez; kullanıcılar yeniden bağlanma yapmak zorunda kalmaz.</li>
  <li>UDP oturumları kısa TTL'li olduğundan genellikle senkronize edilmez; VoIP çağrıları yeniden bağlanabilir.</li>
</ul>

<h2>Öncelik ve Failover Koşulları</h2>
<ul>
  <li>Her cihaza öncelik (priority) atanır; yüksek öncelikli cihaz primary (aktif) olur.</li>
  <li>Failover tetikleyicileri: Donanım arızası, monitör edilen arayüz down, link izleme (link monitor) başarısızlığı.</li>
  <li><strong>Link Monitor:</strong> FortiGate belirli IP'leri (örn. ISP gateway) ping eder; yanıt gelmezse failover tetiklenir. ISP arızasında otomatik geçiş için kritik.</li>
</ul>

<h2>HA Yönetim Erişimi</h2>
<ul>
  <li>Her iki cihazın bağımsız yönetim IP'si olmalıdır; bakım sırasında pasif cihaza ayrıca bağlanılabilir.</li>
  <li>Konfigürasyon değişiklikleri yalnızca primary cihazdan yapılır; otomatik olarak secondary'ye senkronize edilir.</li>
  <li>Firmware güncelleme HA kümesinde: FortiGate önce secondary'yi günceller, failover yapar, ardından yeni primary'yi günceller. Minimum kesinti.</li>
</ul>

<h2>HA Kurulum Adımları (CLI)</h2>
<ul>
  <li><code>config system ha</code></li>
  <li><code>set mode a-p</code> (veya a-a)</li>
  <li><code>set group-id 1</code></li>
  <li><code>set group-name "LiderNetwork-HA"</code></li>
  <li><code>set password "guçlu-ha-sifresi"</code></li>
  <li><code>set priority 200</code> (primary için yüksek, secondary için düşük)</li>
  <li><code>set hbdev "port3" 100 "port4" 50</code> (heartbeat arayüzleri)</li>
  <li><code>set session-pickup enable</code></li>
  <li><code>end</code></li>
</ul>

<h2>Failover Testi</h2>
<p>HA kurulumu sonrası mutlaka test yapılmalıdır:</p>
<ul>
  <li>Aktif cihazın güç kablosunu çekin veya <code>execute ha failover set 1</code> komutuyla yazılımsal failover tetikleyin.</li>
  <li>Ağ bağlantısının kesilmediğini doğrulayın; pasif cihaz aktif olmalı.</li>
  <li>Failover süresi ölçün: Hedef 1–3 saniye olmalıdır.</li>
  <li>Orijinal primary geri geldiğinde preempt ayarına bağlı olarak geri dönebilir (override enable).</li>
</ul>

<h2>Sonuç</h2>
<p>FortiGate HA, misyon kritik ağ altyapılarında güvenlik hizmetinin sürekliliğini garanti eder. Lider Network, FortiGate HA tasarımı, kurulumu ve failover testi konularında hizmetinizdedir.</p>
    `,
  },
  {
    slug: "active-directory-guvenlik-sertlestirme-tier-model",
    title: "Active Directory Güvenlik Sertleştirme: Tier Model, PAW ve Red Forest",
    excerpt:
      "Active Directory, kurumsal IT'nin en kritik ve en çok hedef alınan bileşenidir. Tier Admin Modeli, Privileged Access Workstation, Protected Users, Credential Guard ve AD Tiering ile saldırı yüzeyini minimuma indirgeme rehberi.",
    category: "windows-server",
    categoryColor: "#0078d4",
    tags: ["Active Directory", "Tier Model", "PAW", "Credential Guard", "LAPS", "AD Güvenlik"],
    publishedAt: "2026-05-21",
    readTime: 8,
    content: `
<h2>Neden Active Directory Hedef Alınıyor?</h2>
<p>Active Directory (AD), kurumsal kimlik ve erişim yönetiminin merkezidir. Bir saldırgan Domain Admin yetkisi kazanırsa tüm altyapıya sahip olur: Tüm sunucular, çalışanların e-postaları, dosya sistemleri ve yedekler. Bu nedenle fidye yazılımı gruplarından devlet destekli APT'lere kadar her gelişmiş tehdit aktörünün ilk hedefi AD'yi ele geçirmektir.</p>

<h2>En Yaygın AD Saldırı Yöntemleri</h2>
<ul>
  <li><strong>Pass-the-Hash (PtH):</strong> NTLM hash değeri çalınarak şifre bilinmeden kimlik doğrulama.</li>
  <li><strong>Pass-the-Ticket (PtT):</strong> Kerberos ticket çalınarak yetki yükseltme veya lateral movement.</li>
  <li><strong>Kerberoasting:</strong> Servis hesaplarının Kerberos ticket'ı çalınarak offline brute force ile şifre kırma.</li>
  <li><strong>DCSync:</strong> Domain Controller gibi davranarak AD veritabanından hash dump etme (genellikle Mimikatz ile).</li>
  <li><strong>Golden Ticket:</strong> KRBTGT hesabının hash'i ele geçirilirse sınırsız Kerberos ticket üretme. Tespit çok zordur.</li>
</ul>

<h2>Tier Admin Modeli</h2>
<p>Microsoft'un önerdiği Tier Model, ayrıcalıklı hesapların yalnızca kendi katmanlarındaki sistemlere erişmesini sağlar:</p>
<ul>
  <li><strong>Tier 0 — Kimlik Katmanı:</strong> Domain Controller'lar, AD yönetim araçları, AAD Connect. Tier 0 admini yalnızca DC'leri yönetir; başka hiçbir sisteme bu hesapla giriş yapılmaz.</li>
  <li><strong>Tier 1 — Sunucu Katmanı:</strong> Uygulama sunucuları, veritabanları, dosya sunucuları. Tier 1 admini sunucuları yönetir; kullanıcı PC'lerine bu hesapla giriş yapılmaz.</li>
  <li><strong>Tier 2 — İş İstasyonu Katmanı:</strong> Kullanıcı bilgisayarları. Helpdesk hesapları yalnızca bu katmanda yetkilidir.</li>
</ul>
<p>Katmanlar arası geçiş yasaktır: Tier 1 hesabıyla DC'ye, Tier 0 hesabıyla kullanıcı PC'sine giriş yapılamaz. GPO veya Authentication Policy Silo ile uygulanır.</p>

<h2>PAW — Privileged Access Workstation</h2>
<p>Ayrıcalıklı işlemler için kullanılan izole iş istasyonları:</p>
<ul>
  <li>PAW, yalnızca yönetim görevleri için kullanılır; e-posta okuma, web gezintisi veya belge düzenleme yapılmaz.</li>
  <li>Sertleştirilmiş işletim sistemi: AppLocker/WDAC ile yalnızca onaylı uygulamalar çalışır.</li>
  <li>Ağ erişimi kısıtlı: Yalnızca yönetim hedeflerine erişim izni vardır.</li>
  <li>Fiziksel güvenlik: PAW'lar kilitli rafta veya güvenli alanda saklanır.</li>
</ul>

<h2>Protected Users Güvenlik Grubu</h2>
<p>AD'deki Protected Users grubuna eklenen hesaplar otomatik olarak kısıtlanır:</p>
<ul>
  <li>NTLM kimlik doğrulama kullanılamaz (yalnızca Kerberos).</li>
  <li>DES ve RC4 şifreleme reddedilir (AES zorunlu).</li>
  <li>Kerberos TGT ömrü 4 saate sınırlanır.</li>
  <li>Kimlik bilgileri bellekte önbelleğe alınmaz (Pass-the-Hash'e karşı doğal koruma).</li>
</ul>
<p>Tüm Tier 0 ve Tier 1 hesapları Protected Users grubuna eklenmelidir.</p>

<h2>Credential Guard</h2>
<p>Windows 10/11 ve Server 2016+ üzerinde Virtualization-Based Security (VBS) kullanarak kimlik bilgilerini izole eder:</p>
<ul>
  <li>NTLM hash ve Kerberos ticket'ları korumalı sanal alanda (Secure World) saklanır.</li>
  <li>Kernel düzeyinde çalışan zararlı yazılım bile (Mimikatz dahil) bu bilgilere erişemez.</li>
  <li>GPO veya Intune ile aktif edilebilir: <code>Device Guard → Turn on Windows Defender Credential Guard</code></li>
</ul>

<h2>LAPS — Yerel Admin Şifre Yönetimi</h2>
<p>Her bilgisayardaki yerel administrator hesabının şifresini otomatik, benzersiz ve döngüsel olarak yönetir:</p>
<ul>
  <li>Aynı yerel admin şifresi tüm bilgisayarlarda kullanılıyorsa bir bilgisayar ele geçirildiğinde lateral movement kolaylaşır.</li>
  <li>LAPS her 30 günde (yapılandırılabilir) şifreyi değiştirir; şifre AD'de şifreli saklanır.</li>
  <li>Windows LAPS (Windows Server 2022 ve Windows 11 22H2+ dahil yerel): Azure AD veya AD'de şifre yönetimi; artık ayrı kurulum gerektirmiyor.</li>
</ul>

<h2>AD Audit ve Tehdit Tespiti</h2>
<ul>
  <li>Oturum açma olayları (Event ID 4624, 4625), grup üyeliği değişiklikleri (4728, 4732), GPO değişiklikleri (5136) SIEM'e gönderilmelidir.</li>
  <li>Microsoft Defender for Identity (MDI): AD ortamındaki şüpheli aktiviteleri (Kerberoasting, DCSync, Golden Ticket) gerçek zamanlı tespit eder.</li>
  <li>Honeypot hesapları: Hiç kullanılmaması gereken decoy hesaplara erişim girişimi anında alarm üretir.</li>
</ul>

<h2>Sonuç</h2>
<p>Active Directory güvenliği katmanlı bir yaklaşım gerektirir: Tier Model, PAW, Credential Guard ve LAPS birlikte uygulandığında saldırı yüzeyi dramatik biçimde daralır. Lider Network, AD güvenlik değerlendirmesi ve sertleştirme projelerinde hizmetinizdedir.</p>
    `,
  },
  {
    slug: "group-policy-ileri-seviye-tasarim-ve-en-iyi-uygulamalar",
    title: "Group Policy İleri Seviye: Tasarım, Sorun Giderme ve En İyi Uygulamalar",
    excerpt:
      "Group Policy Objects (GPO), Windows altyapısının merkezi yönetim motorudur. Miras zinciri, WMI filtresi, Loopback işlemi, Starter GPO'lar, GPO yedekleme ve gpresult/rsop ile sorun giderme konularını kapsamlı şekilde ele alıyoruz.",
    category: "windows-server",
    categoryColor: "#0078d4",
    tags: ["Group Policy", "GPO", "Active Directory", "WMI Filtresi", "Loopback", "Windows"],
    publishedAt: "2026-05-21",
    readTime: 8,
    content: `
<h2>Group Policy Temelleri</h2>
<p>Group Policy, Active Directory ortamındaki kullanıcı ve bilgisayarlara merkezi yapılandırma uygulamak için kullanılan mekanizmadır. GPO'lar (Group Policy Objects), OU'lara, domain'e veya site'a bağlanarak uygulanır.</p>
<p>Windows'un hemen hemen her ayarı GPO ile yönetilebilir: Şifre politikaları, yazılım dağıtımı, ağ sürücüleri, ekran koruyucu, güvenlik duvarı kuralları, uygulama kısıtlamaları ve daha fazlası.</p>

<h2>GPO Uygulama Sırası — LSDOU</h2>
<p>Çakışan ayarlar olduğunda GPO uygulama sırası belirleyicidir:</p>
<ul>
  <li><strong>L — Local Policy:</strong> Yerel bilgisayar politikası. En düşük öncelik.</li>
  <li><strong>S — Site:</strong> AD Site'a bağlı GPO'lar.</li>
  <li><strong>D — Domain:</strong> Domain kök OU'ya bağlı GPO'lar.</li>
  <li><strong>OU — Organizational Unit:</strong> İç içe OU'larda üstten alta doğru uygulanır; en derin OU en yüksek önceliğe sahiptir.</li>
</ul>
<p><strong>Kural:</strong> Sonraki sıradaki GPO öncekini ezer (last write wins). Birden fazla GPO aynı OU'ya bağlıysa link sırası belirleyicidir; en üstteki en yüksek önceliklidir.</p>

<h2>Enforce (Zorunlu) ve Block Inheritance</h2>
<ul>
  <li><strong>Enforce (Zorla):</strong> GPO bağlantısına "Enforced" seçeneği eklenince alt OU'ların Block Inheritance ayarını geçersiz kılar. Domain genelinde kritik güvenlik politikaları için kullanılır.</li>
  <li><strong>Block Inheritance:</strong> Bir OU, üst container'lardan gelen GPO miras zincirini keser. Yalnızca doğrudan bağlı GPO'lar ve Enforced GPO'lar uygulanır. Test ortamı OU'ları için kullanışlı.</li>
</ul>

<h2>WMI Filtresi</h2>
<p>GPO'yu yalnızca belirli koşulları karşılayan bilgisayarlara uygulamak için WMI sorgusu kullanılır:</p>
<ul>
  <li>Yalnızca Windows 11 bilgisayarlara uygula: <code>SELECT * FROM Win32_OperatingSystem WHERE Version LIKE "10.0.2%"</code></li>
  <li>Yalnızca laptop'lara uygula (dizüstü bilgisayar): <code>SELECT * FROM Win32_SystemEnclosure WHERE ChassisTypes="9" OR ChassisTypes="10"</code></li>
  <li>Belirli marka/modele uygula: Enerji yönetimi GPO'larını yalnızca Dell bilgisayarlara uygulama.</li>
</ul>
<p>WMI filtresi GPO işleme süresini uzatır; karmaşık sorgulardan kaçının.</p>

<h2>Loopback İşlemi</h2>
<p>Varsayılan davranış: Kullanıcı ayarları, kullanıcının bulunduğu OU'daki GPO'dan alınır. Loopback, bunun yerine bilgisayarın bulunduğu OU'daki GPO'nun kullanıcı ayarlarını da belirlemesini sağlar:</p>
<ul>
  <li><strong>Merge Mode:</strong> Bilgisayar OU'sundaki kullanıcı ayarları, kullanıcı OU'sununkiyle birleşir; çakışmada bilgisayar OU'su kazanır.</li>
  <li><strong>Replace Mode:</strong> Yalnızca bilgisayar OU'sundaki kullanıcı ayarları uygulanır; kullanıcı OU'su yok sayılır.</li>
  <li>Kullanım senaryosu: Kiosk, terminal server, sınıf bilgisayarları — hangi kullanıcı giriş yaparsa yapsın aynı kısıtlı ortam.</li>
</ul>

<h2>Önemli GPO Güvenlik Politikaları</h2>
<p><strong>Şifre Politikası (Default Domain Policy altında):</strong></p>
<ul>
  <li>Minimum uzunluk: 12+ karakter</li>
  <li>Karmaşıklık: Büyük/küçük harf, rakam, özel karakter zorunlu</li>
  <li>Şifre geçmişi: Son 24 şifre tekrar edilemez</li>
  <li>Maksimum kullanım süresi: 90 gün (veya MFA varsa sınırsız)</li>
</ul>
<p><strong>Hesap Kilitleme Politikası:</strong></p>
<ul>
  <li>Hatalı giriş sayısı eşiği: 5 deneme</li>
  <li>Kilitleme süresi: 30 dakika (admin manuel açabilir)</li>
  <li>Sayaç sıfırlama süresi: 15 dakika</li>
</ul>
<p><strong>Audit Policy:</strong></p>
<ul>
  <li>Account Logon Events: Başarılı ve başarısız</li>
  <li>Account Management: Tüm değişiklikler</li>
  <li>Policy Change: Tüm değişiklikler</li>
  <li>Object Access: Başarısız (aşırı log üretilebilir; dikkatli kullanın)</li>
</ul>

<h2>Yazılım Dağıtımı (Software Installation)</h2>
<ul>
  <li>GPO → Computer Configuration → Software Settings → Software Installation: MSI paketleri OU'daki bilgisayarlara otomatik kurulur.</li>
  <li>Assign (Bilgisayar): Bilgisayar açıldığında otomatik kurulum; kullanıcıya seçenek sunulmaz.</li>
  <li>Publish (Kullanıcı): Kullanıcı "Programlar ve Özellikler"den isteğe bağlı kurabilir.</li>
  <li>Yalnızca MSI desteklenir; .exe paketler için dönüştürme veya Intune gibi MDM tercih edilmelidir.</li>
</ul>

<h2>GPO Sorun Giderme Araçları</h2>
<ul>
  <li><code>gpupdate /force</code>: GPO'yu hemen uygula (bekleme süresi olmadan).</li>
  <li><code>gpresult /r</code>: Mevcut kullanıcı ve bilgisayara hangi GPO'ların uygulandığını gösterir.</li>
  <li><code>gpresult /h C:\rapor.html</code>: Detaylı HTML rapor; hangi ayar nereden geliyor gösterir.</li>
  <li><strong>RSOP (Resultant Set of Policy):</strong> <code>rsop.msc</code> — Grafik arayüzle uygulanan tüm politikaları görüntüler.</li>
  <li><strong>Group Policy Management Console (GPMC):</strong> <code>gpmc.msc</code> — GPO oluşturma, bağlama, modelleme ve raporlama.</li>
  <li><strong>GPO Modeling:</strong> GPMC'de bir kullanıcının belirli bir bilgisayarda hangi politikaları alacağını simüle eder.</li>
</ul>

<h2>GPO Yedekleme ve Sürüm Kontrolü</h2>
<ul>
  <li>GPMC'den tüm GPO'ları düzenli olarak yedekleyin (haftada bir).</li>
  <li>GPO değişikliklerini bir ITSM sistemiyle kayıt altına alın; yanlış değişiklik durumunda geri dönüş yapılabilsin.</li>
  <li>Starter GPO'lar: Sık kullanılan temel ayarları içeren şablon GPO; yeni GPO oluştururken başlangıç noktası olarak kullanılır.</li>
  <li>Microsoft AGPM (Advanced Group Policy Management): GPO için sürüm kontrolü, onay iş akışı ve check-in/check-out özelliği.</li>
</ul>

<h2>Sonuç</h2>
<p>Group Policy, kurumsal Windows yönetiminin en güçlü araçlarından biridir. Doğru tasarım, tutarlı adlandırma ve sorun giderme becerileri, IT yöneticilerinin verimliliğini ve güvenlik duruşunu doğrudan etkiler. Lider Network, AD ve GPO tasarımı, politika denetimi ve Active Directory danışmanlığı konularında hizmetinizdedir.</p>
    `,
  },

  // ── YENİ MAKALELER ──────────────────────────────────────────────────────

  {
    slug: "fortigate-administrative-access-ayarlari",
    title: "FortiGate Administrative Access Ayarları: Her Seçenek Ne İşe Yarar?",
    excerpt:
      "FortiGate arayüzünde karşılaşılan Administrative Access bölümü; HTTPS, SSH, PING, FMG-Access, Security Fabric Connection, LLDP gibi onlarca seçenek barındırır. Bu seçeneklerin tamamını, ne zaman açılıp kapatılması gerektiğini adım adım açıklıyoruz.",
    category: "fortigate-ngfw",
    categoryColor: "#EE3124",
    tags: ["FortiGate", "Administrative Access", "Security Fabric", "HTTPS", "SSH", "LLDP"],
    publishedAt: "2026-05-22",
    readTime: 7,
    content: `
<h2>Administrative Access Nedir?</h2>
<p>FortiGate'te her fiziksel veya sanal arayüze (interface) bağımsız olarak hangi yönetim protokollerinin erişebileceğini <strong>Administrative Access</strong> bölümünden belirlersiniz. Bu ayar; güvenliği doğrudan etkiler — gereksiz protokolleri kapatmak saldırı yüzeyini ciddi ölçüde azaltır.</p>
<p>Aşağıda ekrandaki tüm seçenekler tek tek açıklanmıştır.</p>

<h2>IPv4 Administrative Access Seçenekleri</h2>

<h3>HTTPS</h3>
<p>FortiGate'in web tabanlı yönetim arayüzüne (GUI) erişim için kullanılır. Varsayılan port 443'tür. <strong>Yönetim amacıyla kullanacağınız arayüzde mutlaka açık olmalıdır.</strong> WAN (internet) tarafına bakan arayüzde kapalı tutulması önerilir; yönetimi sadece iç ağ veya özel yönetim arayüzü üzerinden yapın.</p>

<h3>HTTP</h3>
<p>Şifresiz HTTP üzerinden GUI erişimidir. <strong>Güvenlik açısından kesinlikle önerilmez.</strong> Yalnızca özel test ortamlarında veya HTTPS yönlendirmesi için geçici olarak açılabilir. Üretim ortamında kapalı tutun.</p>

<h3>PING</h3>
<p>ICMP ping sorgularına yanıt verip vermeyeceğini belirler. Ağ bağlantısını test etmek ve arıza tespitinde kullanışlıdır. <strong>İç ağ arayüzlerinde açık tutmak normaldir;</strong> WAN tarafında açmak, cihazın internette "görünür" olmasına neden olur — genellikle kapalı tutulur.</p>

<h3>FMG-Access</h3>
<p>FortiManager'ın bu arayüz üzerinden FortiGate'e bağlanmasına izin verir. Merkezi yönetim için FortiManager kullanıyorsanız, FortiManager'ın bağlandığı arayüzde bu seçenek <strong>açık olmalıdır.</strong> FortiManager kullanmıyorsanız kapalı bırakın.</p>

<h3>SSH</h3>
<p>Komut satırı (CLI) üzerinden şifreli erişim sağlar. Güvenli olmasına karşın <strong>sadece yönetim arayüzünde açık tutulması önerilir.</strong> Brute-force saldırılarına karşı SSH portunu değiştirmek ve login attempt limit ayarlamak iyi bir pratiktir.</p>

<h3>SNMP</h3>
<p>Ağ izleme araçlarının (Zabbix, PRTG, SolarWinds vb.) FortiGate'den istatistik ve durum bilgisi çekmesi için kullanılır. SNMP kullanıyorsanız açın ve mutlaka <strong>SNMPv3 ile community string güvenliği</strong> uygulayın. Kullanmıyorsanız kapalı tutun.</p>

<h3>FTM (FortiToken Mobile)</h3>
<p>FortiToken Mobile ile iki faktörlü kimlik doğrulama (2FA) push bildirimlerinin bu arayüz üzerinden iletilmesini sağlar. FortiToken tabanlı VPN veya yönetici girişi kullanıyorsanız ilgili arayüzde açık olmalıdır.</p>

<h3>RADIUS Accounting</h3>
<p>RADIUS sunucusundan gelen accounting mesajlarını (kullanıcı oturum başlangıç/bitiş bilgileri) kabul eder. Captive portal veya 802.1X kimlik doğrulama kullanan yapılarda gereklidir. Kullanmıyorsanız kapalı bırakın.</p>

<h3>Security Fabric Connection</h3>
<p>Fortinet Security Fabric ekosisteminin en kritik ayarlarından biridir. <strong>FortiAP, FortiSwitch ve diğer Fabric cihazlarının FortiGate'i "root" olarak tanıyabilmesi için bu seçenek açık olmalıdır.</strong></p>
<p>Security Fabric Connection kapalıysa:</p>
<ul>
  <li>FortiAP cihazları FortiGate'e bağlanıp authorize edilemez</li>
  <li>FortiSwitch yönetimi FortiGate üzerinden yapılamaz</li>
  <li>FortiAnalyzer log bağlantısı kurulmayabilir</li>
</ul>
<p><strong>Hangi arayüzde açık olmalı?</strong> FortiAP veya FortiSwitch'in bağlı olduğu iç ağ arayüzünde (örn. internal, lan, port2) mutlaka açık olmalıdır.</p>

<h3>Speed Test</h3>
<p>FortiGate GUI'sindeki dahili bant genişliği ölçüm aracının bu arayüz üzerinden çalışmasına izin verir. Genellikle WAN arayüzünde kullanılır; yönetim ve test amaçlıdır, üretimde opsiyoneldir.</p>

<h2>Receive LLDP ve Transmit LLDP</h2>
<p>LLDP (Link Layer Discovery Protocol), komşu cihazları otomatik olarak keşfetmek için kullanılan bir Layer 2 protokolüdür. Cisco'nun CDP'sine benzer, ancak vendor bağımsızdır.</p>

<h3>Receive LLDP</h3>
<p>Komşu cihazlardan gelen LLDP paketlerini dinler ve cihaz bilgilerini (hostname, port, capabilities) öğrenir. <strong>"Use VDOM Setting"</strong> seçeneği, VDOM genelindeki varsayılan ayarı kullanır. "Enable" ile bu arayüz için bağımsız olarak açılabilir.</p>

<h3>Transmit LLDP</h3>
<p>FortiGate'in kendi bilgilerini komşulara LLDP ile duyurmasını sağlar. Ağ haritalaması ve otomatik topoloji keşfi için kullanışlıdır. FortiSwitch ile entegre çalışırken LLDP'nin açık olması önerilir.</p>

<h3>Use VDOM Setting</h3>
<p>LLDP için "Use VDOM Setting" seçilirse, arayüz VDOM düzeyindeki genel LLDP yapılandırmasını miras alır. Her arayüz için ayrı ayrı ayar yapmak yerine merkezi yönetim sağlar.</p>

<h2>Güvenlik Önerileri: Hangi Protokoller Nerede Açık Olmalı?</h2>
<table style="width:100%; border-collapse: collapse; margin: 16px 0;">
  <thead>
    <tr style="background:#EE312420;">
      <th style="padding:8px; border:1px solid #EE312430; text-align:left;">Arayüz</th>
      <th style="padding:8px; border:1px solid #EE312430; text-align:left;">Önerilen Açık Protokoller</th>
      <th style="padding:8px; border:1px solid #EE312430; text-align:left;">Kapalı Tutulacaklar</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">WAN (İnternet)</td>
      <td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">—</td>
      <td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Tümü kapalı (mümkünse)</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">LAN / Internal</td>
      <td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">HTTPS, PING, Security Fabric, LLDP</td>
      <td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">HTTP, FTM (gerekmedikçe)</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Yönetim (MGMT)</td>
      <td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">HTTPS, SSH, PING, FMG-Access</td>
      <td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">HTTP, SNMP (kullanılmıyorsa)</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">FortiAP / FortiSwitch</td>
      <td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Security Fabric Connection, LLDP</td>
      <td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">SSH, SNMP (gerekmedikçe)</td>
    </tr>
  </tbody>
</table>

<h2>Sonuç</h2>
<p>Administrative Access ayarları, FortiGate güvenliğinin temel taşlarından biridir. "İhtiyacın kadar aç, geri kalanını kapat" prensibi ile hareket etmek, saldırı yüzeyini minimuma indirir. Lider Network uzman mühendisleri olarak FortiGate güvenlik denetimleri ve yapılandırma optimizasyonu konularında yanınızdayız.</p>
    `,
  },

  {
    slug: "fortiswitch-olmadan-fortiap-kurulumu-security-fabric",
    title: "FortiSwitch Olmadan FortiAP Kurulumu: Security Fabric ile AP Nasıl Tanıtılır?",
    excerpt:
      "FortiSwitch olmadan doğrudan FortiGate'e bağlı FortiAP cihazlarını nasıl authorize edersiniz? Security Fabric Connection ayarının önemi, adım adım FortiAP kurulumu ve sık karşılaşılan sorunların çözümü.",
    category: "fortigate-ngfw",
    categoryColor: "#EE3124",
    tags: ["FortiAP", "FortiGate", "Security Fabric", "Wireless", "WiFi Kurulumu"],
    publishedAt: "2026-05-22",
    readTime: 8,
    content: `
<h2>Giriş</h2>
<p>Kurumsal ağlarda FortiAP cihazlarını yönetmek için genellikle FortiSwitch kullanılır. Ancak küçük ve orta ölçekli ortamlarda FortiSwitch olmadan, FortiAP'yi doğrudan FortiGate'in bir portuna bağlayarak da tam işlevsel kablosuz ağ kurabilirsiniz.</p>
<p>Bu makalede FortiSwitch'siz FortiAP kurulumunun adımlarını, <strong>Security Fabric Connection'ın neden kritik olduğunu</strong> ve sık karşılaşılan sorunları ele alıyoruz.</p>

<h2>Gereksinimler</h2>
<ul>
  <li>FortiGate (herhangi bir model — yazılımda AP Controller lisansı dahildir)</li>
  <li>FortiAP cihazı (FortiAP-U veya FortiAP serisi)</li>
  <li>FortiAP ile FortiGate arasında Layer 2 bağlantı (aynı VLAN veya doğrudan bağlantı)</li>
  <li>FortiOS 6.4 veya üzeri (önerilir)</li>
</ul>

<h2>1. Adım: Arayüzde Security Fabric Connection'ı Açın</h2>
<p>FortiAP'nin bağlandığı arayüzde (örn. <code>internal</code>, <code>port3</code>) <strong>Security Fabric Connection</strong> seçeneği açık olmalıdır. Bu ayar olmadan FortiGate, FortiAP'yi keşfetse bile authorize edemez.</p>
<ol>
  <li><strong>Network → Interfaces</strong>'e gidin</li>
  <li>FortiAP'nin bağlı olduğu arayüzü düzenleyin</li>
  <li><strong>Administrative Access</strong> bölümünde <strong>Security Fabric Connection</strong> kutucuğunu işaretleyin</li>
  <li><strong>OK</strong> ile kaydedin</li>
</ol>
<p><strong>Not:</strong> Security Fabric Connection açık olmayan bir arayüze bağlı FortiAP, "Unauthorized" olarak listelenir ve authorize işlemi başarısız olur.</p>

<h2>2. Adım: FortiAP'yi Fiziksel Olarak Bağlayın</h2>
<p>FortiAP'yi PoE destekli bir switch portu veya PoE enjektör aracılığıyla FortiGate'in ilgili portuna bağlayın. FortiAP, DHCP ile IP alacaktır — FortiGate'in DHCP sunucusunun o arayüzde aktif olduğundan emin olun.</p>
<p>FortiGate arayüzünde DHCP sunucusu yoksa:</p>
<ol>
  <li><strong>Network → Interfaces</strong> → ilgili arayüzü düzenleyin</li>
  <li><strong>DHCP Server</strong> → Enable</li>
  <li>IP aralığını belirleyin (örn. 192.168.10.100 – 192.168.10.200)</li>
</ol>

<h2>3. Adım: FortiAP'yi Authorize Edin</h2>
<ol>
  <li>FortiGate GUI'de <strong>WiFi &amp; Switch Controller → Managed FortiAPs</strong>'e gidin</li>
  <li>FortiAP listede <strong>"Unauthorized"</strong> olarak görünecektir</li>
  <li>Cihaza sağ tıklayın → <strong>Authorize</strong></li>
  <li>Birkaç saniye içinde durum <strong>"Online"</strong> olarak değişecektir</li>
</ol>
<p>Eğer FortiAP listede görünmüyorsa Security Fabric Connection ayarını kontrol edin (1. Adım).</p>

<h2>4. Adım: SSID Oluşturun</h2>
<ol>
  <li><strong>WiFi &amp; Switch Controller → SSIDs</strong> → <strong>Create New</strong></li>
  <li>SSID adı, şifre ve güvenlik modunu belirleyin (WPA2/WPA3 önerilir)</li>
  <li>IP/Ağ: Bridge modda veya tunnel modda çalışabilir
    <ul>
      <li><strong>Bridge Modu:</strong> Kablosuz istemciler kablolu ağla aynı subnet'te olur</li>
      <li><strong>Tunnel Modu:</strong> Trafik FortiGate üzerinden geçer, ayrı bir subnet kullanılır</li>
    </ul>
  </li>
</ol>

<h2>5. Adım: AP Profiline SSID Atayın</h2>
<ol>
  <li><strong>WiFi &amp; Switch Controller → AP Profiles</strong>'e gidin</li>
  <li>Mevcut profili düzenleyin veya yeni profil oluşturun</li>
  <li>Radio 1 (2.4 GHz) ve/veya Radio 2 (5 GHz) için oluşturduğunuz SSID'yi ekleyin</li>
  <li>Authorize ettiğiniz FortiAP'ye bu profili atayın</li>
</ol>

<h2>Sık Karşılaşılan Sorunlar</h2>

<h3>FortiAP listede görünmüyor</h3>
<ul>
  <li>Security Fabric Connection açık mı? → En sık karşılaşılan neden</li>
  <li>FortiAP DHCP'den IP alıyor mu? → FortiAP konsol veya DHCP lease tablosunu kontrol edin</li>
  <li>Arayüzler arasında firewall politikası var mı? → CAPWAP portu (UDP 5246, 5247) açık olmalı</li>
</ul>

<h3>FortiAP "Unauthorized" kalıyor</h3>
<ul>
  <li>Authorize işlemi sonrası 1-2 dakika bekleyin</li>
  <li>FortiAP'yi yeniden başlatın</li>
  <li>FortiGate CLI'dan: <code>diagnose wireless-controller wlac -c sta-db</code> ile durumu kontrol edin</li>
</ul>

<h3>FortiAP Online ama SSID yayınlanmıyor</h3>
<ul>
  <li>AP Profili doğru atanmış mı?</li>
  <li>Radio etkin mi? (disable durumunda olabilir)</li>
  <li>Kanal ve güç ayarları otomatik modda mı?</li>
</ul>

<h2>CAPWAP Nedir ve Neden Önemlidir?</h2>
<p>FortiAP ile FortiGate arasındaki iletişim <strong>CAPWAP (Control and Provisioning of Wireless Access Points)</strong> protokolü üzerinden gerçekleşir. CAPWAP, UDP 5246 (kontrol) ve UDP 5247 (veri) portlarını kullanır. FortiAP ile FortiGate arasında bir firewall politikası varsa bu portların açık olması zorunludur.</p>

<h2>Sonuç</h2>
<p>FortiSwitch olmadan FortiAP kurulumu, doğru adımlar izlendiğinde oldukça pratiktir. Sürecin en kritik noktası <strong>Security Fabric Connection</strong> ayarının doğru arayüzde etkinleştirilmesidir. Lider Network olarak FortiAP tasarımı, kurulumu ve sorun giderme konularında uzman mühendislerimizle destek sağlıyoruz.</p>
    `,
  },

  {
    slug: "fortigate-ftp-helper-nedir-nasil-calisir",
    title: "FortiGate FTP Helper Nedir? Pasif ve Aktif FTP Trafiğini Yönetme",
    excerpt:
      "FTP protokolü, NAT arkasındaki ortamlarda bağlantı sorunlarına yol açabilir. FortiGate'teki FTP Helper (ALG), bu sorunu otomatik olarak çözer. FTP Helper'ın ne yaptığını, nasıl çalıştığını ve ne zaman devre dışı bırakılması gerektiğini açıklıyoruz.",
    category: "fortigate-ngfw",
    categoryColor: "#EE3124",
    tags: ["FortiGate", "FTP Helper", "ALG", "NAT", "FTP", "Firewall"],
    publishedAt: "2026-05-22",
    readTime: 6,
    content: `
<h2>FTP Protokolü ve NAT Sorunu</h2>
<p>FTP (File Transfer Protocol), kontrol bağlantısı için TCP 21 portunu, veri aktarımı için ise ayrı bir port kullanır. Bu ikili port yapısı, NAT (Network Address Translation) arkasındaki ortamlarda ciddi sorunlara yol açar.</p>
<p>İki FTP modu vardır:</p>
<ul>
  <li><strong>Aktif FTP:</strong> Sunucu, istemcinin belirttiği porta doğru veri bağlantısı kurar. NAT arkasındaki istemcilerde sunucu özel IP'ye erişemediği için bağlantı başarısız olur.</li>
  <li><strong>Pasif FTP:</strong> İstemci, sunucunun belirttiği porta bağlanır. Modern FTP istemcilerinde varsayılandır ancak NAT ortamında hâlâ sorun yaşanabilir.</li>
</ul>

<h2>FTP Helper (ALG) Nedir?</h2>
<p><strong>FTP Helper</strong>, FortiGate'in Application Layer Gateway (ALG) özelliğinin bir parçasıdır. FTP kontrol trafiğini (TCP 21) izleyerek, içindeki IP adresi ve port bilgilerini NAT çevirisine göre dinamik olarak günceller. Bu sayede FTP veri bağlantıları otomatik olarak kurulabilir hale gelir.</p>

<p>FortiGate, FTP Helper sayesinde şunları yapar:</p>
<ul>
  <li>FTP PORT ve PASV komutlarını dinler</li>
  <li>Paket içindeki özel IP adresini public IP ile değiştirir</li>
  <li>Dinamik veri kanalı için geçici firewall politikası açar</li>
  <li>Veri transferi tamamlandığında geçici politikayı kapatır</li>
</ul>

<h2>FortiGate'te FTP Helper Yapılandırması</h2>

<h3>GUI Üzerinden Kontrol</h3>
<p>FortiOS'ta FTP Helper varsayılan olarak etkindir. Durumu kontrol etmek için:</p>
<ol>
  <li><strong>Network → Helpers</strong> menüsüne gidin (bazı sürümlerde <strong>Policy &amp; Objects → Helper</strong>)</li>
  <li>Listede <strong>ftp</strong> helper'ını bulun</li>
  <li>Port 21 üzerinde aktif olduğunu doğrulayın</li>
</ol>

<h3>CLI Üzerinden Kontrol</h3>
<pre><code>config system session-helper
    show
end</code></pre>
<p>Çıktıda şuna benzer bir satır görmelisiniz:</p>
<pre><code>edit 13
    set name ftp
    set protocol 6
    set port 21
next</code></pre>

<h3>FTP Helper'ı Devre Dışı Bırakmak</h3>
<p>Belirli durumlarda FTP Helper'ı devre dışı bırakmak gerekebilir:</p>
<pre><code>config system session-helper
    delete 13
end</code></pre>
<p><strong>Not:</strong> ID numarası (13) sisteme göre değişebilir. Önce <code>show</code> ile doğru ID'yi tespit edin.</p>

<h2>FTP Helper Ne Zaman Sorun Çıkarır?</h2>

<h3>1. FTPS (FTP over SSL) Kullananlar</h3>
<p>FTP Helper, şifresiz FTP trafiğini parse eder. <strong>FTPS (implicit/explicit TLS)</strong> kullanılıyorsa trafik şifreli olduğundan Helper içeriği okuyamaz ve bağlantıyı bozabilir. Bu durumda FTP Helper'ı devre dışı bırakmak gerekir.</p>

<h3>2. Standart Dışı Port Kullananlar</h3>
<p>FTP sunucunuz 21 dışında bir port kullanıyorsa (örn. 2121), Helper bu trafiği yakalamaz. Helper'ı farklı porta taşıyabilirsiniz:</p>
<pre><code>config system session-helper
    edit 13
        set port 2121
    next
end</code></pre>

<h3>3. UTM/SSL İnceleme ile Çakışma</h3>
<p>Bazı FortiGate sürümlerinde derin paket inceleme (DPI) ve FTP Helper aynı anda çalışırken çakışma yaşanabilir. Bu durumda loglarda "FTP bağlantısı kurulamadı" hatası görülür.</p>

<h2>FTP Helper ve Firewall Politikası İlişkisi</h2>
<p>FTP Helper aktif olduğunda, FortiGate veri kanalı için <strong>dinamik pinhole</strong> açar. Yani manuel olarak FTP veri portlarını (20 veya ephemeral portlar) firewall politikasına eklemenize gerek kalmaz.</p>
<p>Eğer FTP Helper'ı devre dışı bıraktıysanız, firewall politikanızda:</p>
<ul>
  <li>Aktif FTP için: TCP 20 portunu inbound olarak açın</li>
  <li>Pasif FTP için: Sunucunun kullandığı ephemeral port aralığını açın (genellikle 49152-65535)</li>
</ul>

<h2>Tanılama Komutları</h2>
<pre><code># FTP oturumlarını izle
diagnose sys session filter dport 21
diagnose sys session list

# FTP Helper loglarını gör
diagnose debug application ftp -1
diagnose debug enable</code></pre>

<h2>Özet: FTP Helper Açık mı Kapalı mı Olmalı?</h2>
<table style="width:100%; border-collapse: collapse; margin: 16px 0;">
  <thead>
    <tr style="background:#EE312420;">
      <th style="padding:8px; border:1px solid #EE312430; text-align:left;">Senaryo</th>
      <th style="padding:8px; border:1px solid #EE312430; text-align:left;">FTP Helper</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Standart FTP, NAT arkası</td>
      <td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">✅ Açık olmalı</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">FTPS (TLS şifreli)</td>
      <td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">❌ Kapalı olmalı</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Standart dışı port</td>
      <td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">⚙️ Port ayarı güncellenmeli</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">SFTP (SSH üzerinden)</td>
      <td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">❌ Helper gerekmez (TCP 22)</td>
    </tr>
  </tbody>
</table>

<h2>Sonuç</h2>
<p>FTP Helper, NAT arkasındaki FTP bağlantılarını sorunsuz hale getiren FortiGate'in akıllı bir özelliğidir. Ancak FTPS veya standart dışı konfigürasyonlarda dikkatli yapılandırma gerektirir. Lider Network olarak FortiGate politika tasarımı, NAT yapılandırması ve uygulama katmanı sorunlarında uzman mühendislerimizle destek veriyoruz.</p>
    `,
  },

  {
    slug: "fortiextender-nedir-lte-wan-yedekleme",
    title: "FortiExtender Nedir? LTE/5G ile WAN Yedekleme ve Şube Bağlantısı",
    excerpt:
      "FortiExtender, Fortinet'in hücresel (LTE/5G) WAN çözümüdür. İnternet bağlantısının koptuğu anlarda devreye girerek kesintisiz WAN sağlar. FortiExtender'ın mimarisini, kurulum adımlarını ve kullanım senaryolarını inceliyoruz.",
    category: "fortigate-ngfw",
    categoryColor: "#EE3124",
    tags: ["FortiExtender", "LTE", "5G", "WAN Yedekleme", "SD-WAN", "FortiGate"],
    publishedAt: "2026-05-22",
    readTime: 7,
    content: `
<h2>FortiExtender Nedir?</h2>
<p><strong>FortiExtender</strong>, Fortinet tarafından geliştirilen hücresel WAN genişletme cihazıdır. 4G LTE veya 5G modem entegrasyonuyla birincil internet bağlantısının yedeği olarak veya tek başına WAN bağlantısı olarak kullanılır. FortiGate ile doğrudan entegre çalışır ve SD-WAN politikaları kapsamında yönetilebilir.</p>
<p>Temel kullanım senaryoları şunlardır:</p>
<ul>
  <li>Fiber/ADSL bağlantısı olmayan şube veya saha ofisleri</li>
  <li>Mevcut WAN bağlantısına LTE/5G yedek hat eklenmesi</li>
  <li>Geçici konumlar (fuar, şantiye, mobil araç)</li>
  <li>Afet ve acil durum ağları</li>
</ul>

<h2>FortiExtender Modelleri</h2>
<p>Fortinet, farklı ihtiyaçlara yönelik birkaç FortiExtender modeli sunar:</p>
<ul>
  <li><strong>FortiExtender 100 Serisi:</strong> Masa üstü kullanım, küçük şubeler için LTE Cat-6/Cat-12 destek</li>
  <li><strong>FortiExtender 200 Serisi:</strong> Outdoor montaj, saha ve taşıt uygulamaları, geniş sıcaklık aralığı</li>
  <li><strong>FortiExtender 400 Serisi:</strong> 5G NR desteği, yüksek bant genişliği gerektiren uygulamalar</li>
  <li><strong>FortiExtender VM:</strong> Sanal ortamlarda yazılım tabanlı genişletici</li>
</ul>

<h2>FortiExtender Mimarisi: Nasıl Çalışır?</h2>
<p>FortiExtender iki farklı modda çalışabilir:</p>

<h3>1. Standalone Mod</h3>
<p>FortiExtender bağımsız bir modem/router olarak çalışır. FortiGate'e USB veya Ethernet üzerinden bağlanır ve NAT yaparak WAN bağlantısı sağlar. Küçük yapılandırmalar için uygundur ancak merkezi yönetim imkânı sınırlıdır.</p>

<h3>2. FortiGate Managed Mod (Önerilen)</h3>
<p>FortiExtender, FortiGate tarafından tamamen yönetilir. CAPWAP protokolü üzerinden FortiGate'e bağlanır ve şu avantajları sunar:</p>
<ul>
  <li>FortiGate GUI'den merkezi yapılandırma</li>
  <li>SD-WAN politikalarına dahil edilebilme</li>
  <li>FortiManager ile merkezi yönetim</li>
  <li>Otomatik failover ve load balancing</li>
  <li>FortiAnalyzer ile log ve raporlama entegrasyonu</li>
</ul>

<h2>FortiGate ile FortiExtender Kurulumu</h2>

<h3>1. Adım: Fiziksel Bağlantı</h3>
<p>FortiExtender'ı FortiGate'in WAN veya özel bir portuna Ethernet kablosuyla bağlayın. SIM kartı takın ve antenleri bağlayın.</p>

<h3>2. Adım: FortiGate'te FortiExtender'ı Etkinleştirin</h3>
<pre><code>config extender-controller extender
    set admin enable
end</code></pre>
<p>Ya da GUI'den: <strong>Network → FortiExtender</strong> menüsü (FortiOS sürümüne göre konum değişebilir).</p>

<h3>3. Adım: Authorize İşlemi</h3>
<ol>
  <li><strong>Network → FortiExtender</strong>'a gidin</li>
  <li>Listelenen FortiExtender cihazını bulun</li>
  <li><strong>Authorize</strong> butonuna tıklayın</li>
  <li>Cihaz birkaç saniye içinde "Connected" durumuna geçecektir</li>
</ol>

<h3>4. Adım: Veri Planı (Data Plan) Yapılandırması</h3>
<p>FortiGate GUI'den SIM kart ayarlarını yapılandırın:</p>
<ul>
  <li>APN (Access Point Name) — operatöre göre değişir: <code>internet</code>, <code>mgbs</code>, <code>web</code> vs.</li>
  <li>PIN kodu (SIM kilidi varsa)</li>
  <li>Kimlik doğrulama türü (PAP/CHAP — çoğu operatörde None)</li>
  <li>Aylık veri limiti (opsiyonel uyarı eşiği)</li>
</ul>

<h3>5. Adım: SD-WAN'a Entegrasyon</h3>
<p>FortiExtender bağlantısını SD-WAN member olarak ekleyerek fiber bağlantısıyla birlikte yönetebilirsiniz:</p>
<ol>
  <li><strong>Network → SD-WAN → SD-WAN Members</strong> → <strong>Create New</strong></li>
  <li>Interface olarak FortiExtender WAN arayüzünü seçin</li>
  <li>Gateway ve öncelik ayarlarını yapın</li>
  <li>SD-WAN kurallarında failover veya load balancing politikası tanımlayın</li>
</ol>

<h2>WAN Yedekleme Senaryosu: Fiber + LTE</h2>
<p>En yaygın kullanım senaryosu: birincil hat fiber, yedek hat LTE olan yapılandırmadır.</p>
<ul>
  <li><strong>Normal durum:</strong> Tüm trafik fiber üzerinden gider (düşük gecikme, yüksek bant genişliği)</li>
  <li><strong>Fiber kesintisi:</strong> SD-WAN politikası otomatik olarak LTE'ye geçer (genellikle 3-5 saniye içinde)</li>
  <li><strong>Fiber geri geldiğinde:</strong> Trafik otomatik olarak fiber'e döner</li>
</ul>
<p>SD-WAN performance SLA ile bağlantı kalitesi sürekli ölçülür. Paket kaybı veya gecikme eşiği aşıldığında failover tetiklenir.</p>

<h2>FortiExtender ile SD-WAN SLA Yapılandırması</h2>
<pre><code>config system sdwan
    config health-check
        edit "ISP_Check"
            set server "8.8.8.8"
            set interval 500
            set failtime 5
            set recoverytime 5
            set members 1 2
        next
    end
end</code></pre>
<p>Bu yapılandırmada Google DNS'e 500ms aralıklarla ping gönderilir. 5 ardışık başarısız denemede failover tetiklenir.</p>

<h2>FortiExtender Kullanım Alanları</h2>

<h3>Şube Ofisler</h3>
<p>Fiber altyapısı olmayan şube ofislere LTE bağlantısı sağlar. FortiGate SD-WAN ile merkez ofise güvenli VPN tüneli kurulur, tüm politikalar merkezi olarak yönetilir.</p>

<h3>Şantiye ve Geçici Lokasyonlar</h3>
<p>İnşaat şantiyeleri, fuar alanları, açık hava etkinlikleri gibi geçici lokasyonlarda hızlı kurulum imkânı sunar. Outdoor modeller (-40°C ile +70°C arasında çalışabilir) sert iklim koşullarına dayanıklıdır.</p>

<h3>Araç ve Mobil Uygulamalar</h3>
<p>Zırhlı araçlar, kargo kamyonları, mobil komuta araçları gibi taşıt uygulamalarında FortiExtender araç antenlerine bağlanarak sürekli bağlantı sağlar.</p>

<h3>OT ve Endüstriyel Ağlar</h3>
<p>Kablolu altyapı kurulamayan fabrika veya enerji tesislerinde hücresel bağlantı ile SCADA ve OT sistemleri internete güvenli şekilde bağlanabilir.</p>

<h2>Lisanslama</h2>
<p>FortiExtender'ın FortiGate tarafından yönetilebilmesi için:</p>
<ul>
  <li>FortiGate üzerinde <strong>FortiExtender lisansı</strong> gereklidir (cihaz başına)</li>
  <li>Bazı FortiGate modellerinde belirli sayıda FortiExtender lisansı dahildir</li>
  <li>Lisans durumunu kontrol etmek için: <strong>Dashboard → License Information</strong></li>
</ul>

<h2>Sonuç</h2>
<p>FortiExtender, Fortinet ekosisteminin WAN tarafını güçlendiren kritik bir bileşendir. Özellikle SD-WAN ile birleştiğinde; fiber kesintilerine karşı otomatik failover, şube bağlantısı ve mobil kullanım senaryolarında güvenilir ve merkezi yönetilebilir bir çözüm sunar. Lider Network olarak FortiExtender tasarımı, kurulumu ve SD-WAN entegrasyonunda uzman mühendislerimizle hizmetinizdeyiz.</p>
    `,
  },

  {
    slug: "fortiview-nedir-nasil-kullanilir-trafik-analizi",
    title: "FortiView Nedir? Sources, Destinations, Applications, Sessions ile Trafik Analizi",
    excerpt:
      "FortiGate'in dahili trafik izleme paneli olan FortiView; Sources, Destinations, Applications, Web Sites, Policies ve Sessions ekranlarıyla ağınızdaki her hareketi görünür kılar. Her sekmenin ne gösterdiğini ve nasıl kullanılacağını adım adım açıklıyoruz.",
    category: "soc-yonetim",
    categoryColor: "#f59e0b",
    tags: ["FortiView", "FortiGate", "Trafik Analizi", "DHCP Monitor", "Network Monitoring", "SOC"],
    publishedAt: "2026-05-22",
    readTime: 8,
    content: `
<h2>FortiView Nedir?</h2>
<p><strong>FortiView</strong>, FortiGate'in yerleşik gerçek zamanlı trafik analiz ve izleme panelidir. Harici bir araç gerektirmeden ağınızdaki tüm trafiği; kaynak, hedef, uygulama, web sitesi, politika ve oturum bazında anlık olarak görüntülemenizi sağlar.</p>
<p>FortiView; güvenlik olaylarını tespit etmek, bant genişliği tüketen cihaz veya uygulamaları bulmak ve firewall politikalarının doğru çalışıp çalışmadığını doğrulamak için günlük olarak kullanılan bir araçtır.</p>
<p>FortiGate GUI'de <strong>FortiView</strong> menüsü altında şu ekranlar bulunur:</p>
<ul>
  <li>FortiView Sources</li>
  <li>FortiView Destinations</li>
  <li>FortiView Applications</li>
  <li>FortiView Web Sites</li>
  <li>FortiView Policies</li>
  <li>FortiView Sessions</li>
  <li>DHCP Monitor</li>
</ul>

<h2>FortiView Sources — Kaynaklar</h2>
<p><strong>Ne gösterir:</strong> Ağınızdaki hangi kaynak IP adreslerinin (cihazların) en fazla trafik ürettiğini listeler. Her kaynak için bant genişliği kullanımı, oturum sayısı ve tehdit durumu görüntülenir.</p>

<h3>Ne için kullanılır?</h3>
<ul>
  <li>İnterneti en çok kullanan cihazı veya kullanıcıyı tespit etmek</li>
  <li>Anormal miktarda trafik üreten bir cihazı (virüs, botnet vb.) bulmak</li>
  <li>Mesai saatlerinde bant genişliği tüketen kaynakları izlemek</li>
</ul>

<h3>Nasıl okunur?</h3>
<p>Listede en üstteki IP en fazla trafik üreten cihazdır. IP adresine tıklayarak o cihazın hangi uygulamalara ve web sitelerine eriştiğini drilldown ile görüntüleyebilirsiniz.</p>
<p><strong>İpucu:</strong> Sağ üstteki zaman filtresini "Son 1 Saat", "Son 24 Saat" veya özel aralıkta ayarlayabilirsiniz.</p>

<h2>FortiView Destinations — Hedefler</h2>
<p><strong>Ne gösterir:</strong> Ağınızdaki trafiğin hangi hedef IP adresleri veya ülkelere gittiğini gösterir. Coğrafi harita görünümüyle ülke bazlı trafik dağılımı da izlenebilir.</p>

<h3>Ne için kullanılır?</h3>
<ul>
  <li>Bilinmeyen veya şüpheli IP adresleriyle iletişim olup olmadığını kontrol etmek</li>
  <li>Belirli bir ülkeyle (örn. Kuzey Kore, Rusya) trafik gidip gitmediğini görmek</li>
  <li>C&amp;C (Command &amp; Control) sunucularına bağlantı tespiti</li>
  <li>DNS veya NTP trafiğinin nereye gittiğini doğrulamak</li>
</ul>

<h3>Nasıl okunur?</h3>
<p>Hedef IP'ye tıklayarak hangi kaynak cihazların o adrese bağlandığını, hangi uygulamanın kullanıldığını görebilirsiniz. Şüpheli bir hedefe tıklayıp "Quarantine Source" ile kaynak cihazı hızla karantinaya alabilirsiniz.</p>

<h2>FortiView Applications — Uygulamalar</h2>
<p><strong>Ne gösterir:</strong> Ağınızda hangi uygulamaların kullanıldığını ve ne kadar bant genişliği tükettiğini listeler. FortiGate'in Uygulama Kontrolü (App Control) motoru, şifreli trafiği bile deep inspection ile tanımlayabilir.</p>

<h3>Ne için kullanılır?</h3>
<ul>
  <li>Onaylanmamış uygulamaları (shadow IT) tespit etmek — örn. kurumsal onay olmadan kullanılan bulut depolama</li>
  <li>Yüksek bant genişliği tüketen uygulamaları (YouTube, Netflix, BitTorrent) bulmak</li>
  <li>App Control politikasının etkin çalışıp çalışmadığını doğrulamak</li>
  <li>Risk skoru yüksek uygulamaları izlemek</li>
</ul>

<h3>Nasıl okunur?</h3>
<p>Her uygulama için <strong>Risk Seviyesi</strong> (1-5 arası), oturum sayısı ve bant genişliği gösterilir. Risk 4-5 olan uygulamalar kırmızı ile işaretlenir. Uygulamaya tıklayarak hangi kullanıcıların veya cihazların kullandığını görebilirsiniz.</p>
<p><strong>Örnek senaryo:</strong> BitTorrent veya TeamViewer gibi uygulamaların listede görünmesi, politika dışı kullanımın işaretidir.</p>

<h2>FortiView Web Sites — Web Siteleri</h2>
<p><strong>Ne gösterir:</strong> Ağınızdaki cihazların eriştiği web sitelerini, kategorileri ve bant genişliği kullanımını listeler. Web Filtreleme (Web Filter) modülüyle entegre çalışır.</p>

<h3>Ne için kullanılır?</h3>
<ul>
  <li>En çok ziyaret edilen web sitelerini görmek</li>
  <li>Engellenen sitelere erişim denemelerini izlemek</li>
  <li>Zararlı veya phishing sitelerine erişim tespiti</li>
  <li>Web Filter politikasını tune etmek için kullanım verisi toplamak</li>
</ul>

<h3>Nasıl okunur?</h3>
<p>Listede her alan adı için kategori, erişim sayısı ve bant genişliği görünür. "Blocked" olarak işaretlenenler kırmızı renkte gösterilir. Bir site adına tıklayarak hangi kullanıcıların erişmeye çalıştığını ve kaç kez engellendiğini görebilirsiniz.</p>
<p><strong>İpucu:</strong> Sık engellenen ama zararsız bir siteyi burada tespit edip Web Filter politikasına whitelist olarak ekleyebilirsiniz.</p>

<h2>FortiView Policies — Politikalar</h2>
<p><strong>Ne gösterir:</strong> Her firewall politikasının ne kadar trafik işlediğini, kaç oturum oluşturduğunu ve bant genişliği kullanımını gösterir.</p>

<h3>Ne için kullanılır?</h3>
<ul>
  <li>Hiç trafik geçmeyen (kullanılmayan) politikaları tespit etmek ve temizlemek</li>
  <li>En yoğun kullanılan politikaları belirlemek</li>
  <li>Yanlış politikaya düşen trafiği yakalamak</li>
  <li>Politika optimizasyonu ve güvenlik denetimi için kanıt toplamak</li>
</ul>

<h3>Nasıl okunur?</h3>
<p>Her politika satırında ID, kaynak/hedef zone, servis ve trafik istatistikleri görünür. "0 oturum" olan bir politika ya gereksizdir ya da beklenmedik bir şekilde çalışmıyordur. Politikaya tıklayarak hangi kaynakların ve hedeflerin o politikadan geçtiğini görebilirsiniz.</p>
<p><strong>İyi pratik:</strong> Aylık düzenli FortiView Policies incelemesi yaparak kullanılmayan kuralları kaldırın — bu hem performansı artırır hem de güvenlik riskini azaltır.</p>

<h2>FortiView Sessions — Aktif Oturumlar</h2>
<p><strong>Ne gösterir:</strong> FortiGate üzerinden geçen tüm aktif TCP/UDP oturumlarını gerçek zamanlı olarak listeler. En granüler FortiView ekranıdır.</p>

<h3>Ne için kullanılır?</h3>
<ul>
  <li>Belirli bir IP'nin şu an hangi bağlantıları açık tuttuğunu görmek</li>
  <li>Port tarama veya DDoS saldırısı sırasında anormal oturum sayısını tespit etmek</li>
  <li>Bir uygulamanın gerçekte hangi IP ve porta bağlandığını doğrulamak</li>
  <li>VPN oturumlarını izlemek</li>
  <li>Şüpheli bir oturumu anında sonlandırmak</li>
</ul>

<h3>Nasıl okunur?</h3>
<p>Her oturum satırında kaynak IP:port, hedef IP:port, protokol, politika ve veri transferi görünür. Bir oturuma sağ tıklayarak <strong>"Block Source"</strong> veya <strong>"Terminate Session"</strong> seçenekleriyle anında müdahale edebilirsiniz.</p>
<p><strong>Örnek senaryo:</strong> Bir sunucunun binlerce eş zamanlı oturumu varsa port tarama veya botnet aktivitesi olabilir — Sessions ekranı bunu anında gösterir.</p>

<h3>CLI ile Oturum Sorgusu</h3>
<p>Daha detaylı filtreler için CLI kullanılabilir:</p>
<pre><code># Belirli bir IP'nin oturumlarını filtrele
diagnose sys session filter src 192.168.1.100
diagnose sys session list

# Tüm aktif oturum sayısını gör
diagnose sys session stat</code></pre>

<h2>DHCP Monitor</h2>
<p><strong>Ne gösterir:</strong> FortiGate'in DHCP sunucusundan IP adresi almış tüm cihazları listeler. IP, MAC adresi, hostname ve lease süresi görüntülenir.</p>

<h3>Ne için kullanılır?</h3>
<ul>
  <li>Ağa bağlanan tüm cihazların envanterini görmek</li>
  <li>Bilinmeyen MAC adresine sahip cihazları tespit etmek (yetkisiz cihaz bağlantısı)</li>
  <li>Bir cihazın IP adresini hostname'den bulmak (veya tersi)</li>
  <li>IP çakışmalarını önlemek için lease durumunu kontrol etmek</li>
  <li>FortiAP üzerinden bağlanan kablosuz istemcileri görmek</li>
</ul>

<h3>Nasıl okunur?</h3>
<p>Listede her cihaz için IP adresi, MAC adresi, hostname (mümkünse), arayüz ve lease bitiş zamanı görünür. Bilinmeyen bir MAC adresi görürseniz fiziksel ağınızda yetkisiz bir cihaz var demektir.</p>
<p><strong>İpucu:</strong> DHCP Monitor'dan bir cihaza sağ tıklayarak o IP için statik DHCP rezervasyonu oluşturabilirsiniz — bu sayede cihaz her zaman aynı IP'yi alır.</p>

<h2>FortiView'i Etkin Kullanmak için 5 İpucu</h2>
<ol>
  <li><strong>Zaman filtresini kullanın:</strong> Olayları doğru zaman dilimiyle ilişkilendirmek için "Son 5 Dakika", "Son 1 Saat" veya özel aralık seçin.</li>
  <li><strong>Drilldown yapın:</strong> Her ekranda satıra tıklayarak bir alt katmana (kaynak → uygulama → oturum) inin.</li>
  <li><strong>Log'ları etkin tutun:</strong> FortiView verileri log kayıtlarına dayanır. Politikalarınızda loglama kapalıysa FortiView boş görünür.</li>
  <li><strong>FortiAnalyzer ile genişletin:</strong> FortiView 7 günlük veri gösterir. Daha uzun geçmişe erişmek için FortiAnalyzer kullanın.</li>
  <li><strong>Düzenli inceleme alışkanlığı edinin:</strong> Her sabah 5 dakika FortiView Sources ve Applications ekranını kontrol etmek, anormallikleri erken yakalamanızı sağlar.</li>
</ol>

<h2>Sonuç</h2>
<p>FortiView, FortiGate'in en güçlü yerleşik araçlarından biridir. Ek bir yazılım veya lisans gerektirmeden ağınızdaki trafiği tam görünürlükle izlemenizi sağlar. Kaynak, hedef, uygulama, web sitesi, politika ve oturum katmanlarında birbirini tamamlayan bu ekranlar, hem günlük operasyon hem de olay müdahalesi için vazgeçilmezdir. Lider Network olarak FortiGate izleme, SOC kurulumu ve güvenlik denetimi konularında uzman mühendislerimizle yanınızdayız.</p>
    `,
  },

  {
    slug: "security-fabric-nedir-physical-logical-topology-security-rating",
    title: "Fortinet Security Fabric: Physical Topology, Logical Topology, Security Rating ve Daha Fazlası",
    excerpt:
      "FortiGate'in Security Fabric menüsü altındaki Physical Topology, Logical Topology, Security Rating, Automation, Fabric Connectors, External Connectors ve Asset Identity Center ekranlarının tamamını açıklıyoruz. Her biri ne gösterir, nasıl kullanılır?",
    category: "fortigate-ngfw",
    categoryColor: "#EE3124",
    tags: ["Security Fabric", "FortiGate", "Physical Topology", "Security Rating", "Automation", "Fabric Connectors"],
    publishedAt: "2026-05-22",
    readTime: 9,
    content: `
<h2>Security Fabric Nedir?</h2>
<p><strong>Fortinet Security Fabric</strong>, Fortinet ürünlerinin (FortiGate, FortiSwitch, FortiAP, FortiClient, FortiAnalyzer vb.) tek bir merkezi platform altında birbirleriyle iletişim kurduğu ve koordineli çalıştığı entegrasyon mimarisidir. Her ürün ayrı ayrı değil, birbirini gören ve birbirini tamamlayan bir ekosistem olarak hareket eder.</p>
<p>FortiGate GUI'deki <strong>Security Fabric</strong> menüsü, bu ekosistemin görünürlüğünü ve yönetimini sağlayan ekranları barındırır. Aşağıda her birini ayrıntılı ele alıyoruz.</p>

<h2>Physical Topology — Fiziksel Topoloji</h2>
<p><strong>Ne gösterir:</strong> Security Fabric'e dahil tüm cihazların fiziksel bağlantı haritasını otomatik olarak çizer. FortiGate, FortiSwitch, FortiAP ve bunlara bağlı son kullanıcı cihazları hiyerarşik bir ağaç yapısında görüntülenir.</p>

<h3>Ne için kullanılır?</h3>
<ul>
  <li>Ağ topolojisini belgeleye gerek kalmadan otomatik görselleştirme</li>
  <li>Hangi cihazın hangi switch portuna, hangi AP'ye bağlı olduğunu anlık görmek</li>
  <li>Yeni bağlanan veya yetkisiz cihazları tespit etmek</li>
  <li>Fiber/kablo arızalarında hangi cihazların etkilendiğini görmek</li>
</ul>

<h3>Nasıl okunur?</h3>
<p>En üstte FortiGate bulunur. Altında FortiSwitch'ler, onların altında FortiAP'ler ve son olarak istemci cihazlar yer alır. Her düğüme tıklayarak cihaz detaylarını (IP, MAC, model, firmware) görebilirsiniz. Sarı veya kırmızı ikonlar sorunlu bağlantıyı işaret eder.</p>
<p><strong>Gereksinim:</strong> Physical Topology'nin çalışması için FortiSwitch ve FortiAP cihazlarının Security Fabric'e dahil edilmiş (authorize) ve LLDP'nin aktif olması gerekir.</p>

<h2>Logical Topology — Mantıksal Topoloji</h2>
<p><strong>Ne gösterir:</strong> Fiziksel bağlantı yerine ağın mantıksal katmanını gösterir. VLAN'lar, zone'lar, VPN tünelleri ve bunlar arasındaki trafik akışı görselleştirilir.</p>

<h3>Ne için kullanılır?</h3>
<ul>
  <li>Ağ segmentasyonunu (VLAN, zone) görsel olarak doğrulamak</li>
  <li>VPN tünellerinin hangi ağları birbirine bağladığını anlamak</li>
  <li>SD-WAN mantıksal akışını izlemek</li>
  <li>Güvenlik politikalarının zone bazlı doğru uygulanıp uygulanmadığını kontrol etmek</li>
</ul>

<h3>Farkı nedir?</h3>
<p>Physical Topology kablo ve port düzeyinde gösterirken, Logical Topology IP adresleme, VLAN ve zone düzeyinde gösterir. İkisi birbirini tamamlar: fiziksel sorunlar için Physical, politika ve segmentasyon sorunları için Logical kullanılır.</p>

<h2>Security Rating — Güvenlik Puanı</h2>
<p><strong>Ne gösterir:</strong> FortiGate ve Fabric'e bağlı cihazların güvenlik yapılandırmasını Fortinet'in en iyi pratiklerine göre otomatik olarak değerlendirir ve 0-100 arası bir puan verir.</p>

<h3>Değerlendirme Kategorileri</h3>
<ul>
  <li><strong>Security Controls:</strong> Firewall politikaları, UTM özellikleri, SSL inspection durumu</li>
  <li><strong>Fabric Coverage:</strong> Kaç Fortinet ürününün Fabric'e dahil olduğu</li>
  <li><strong>Optimization:</strong> Kullanılmayan politikalar, gereksiz açık portlar, default şifreler</li>
</ul>

<h3>Ne için kullanılır?</h3>
<ul>
  <li>Güvenlik açıklarını otomatik tespit etmek (örn. "Admin şifresi default bırakılmış")</li>
  <li>ISO 27001, NIST gibi uyumluluk çerçevelerine hazırlık için referans almak</li>
  <li>Yöneticilere ve üst yönetime güvenlik durumu raporu sunmak</li>
  <li>Zaman içindeki güvenlik puanı değişimini takip etmek</li>
</ul>

<h3>Nasıl iyileştirilir?</h3>
<p>Her başarısız kontrol için Security Rating, somut düzeltme adımı önerir. Örneğin "IPS imzaları güncel değil" uyarısı için direkt FortiGuard güncelleme linkine yönlendirir. Önerileri sırayla uygulayarak puanı artırabilirsiniz.</p>

<h2>Automation — Otomasyon</h2>
<p><strong>Ne gösterir:</strong> Belirli bir olay gerçekleştiğinde otomatik aksiyon tetikleyen kural tabanlı otomasyon motorudur. "Eğer X olursa, Y'yi yap" mantığıyla çalışır.</p>

<h3>Otomasyon Örnekleri</h3>
<ul>
  <li>Bir IP 100'den fazla başarısız giriş denemesi yaparsa → o IP'yi otomatik engelle</li>
  <li>FortiClient'sız bir cihaz ağa bağlanırsa → cihazı karantinaya al ve e-posta gönder</li>
  <li>CPU %90'ı geçerse → Slack veya e-posta ile uyarı gönder</li>
  <li>Yeni bir IoT cihazı tespit edilirse → güvenlik ekibine bildir</li>
  <li>Kritik bir CVE tespit edilirse → otomatik imza güncellemesi başlat</li>
</ul>

<h3>Nasıl yapılandırılır?</h3>
<ol>
  <li><strong>Security Fabric → Automation → Create New</strong></li>
  <li><strong>Trigger (Tetikleyici):</strong> Olay türünü seçin (FortiOS Event, FortiAnalyzer Alert, Scheduled vb.)</li>
  <li><strong>Condition (Koşul):</strong> Tetikleyiciye ek filtre ekleyin</li>
  <li><strong>Action (Aksiyon):</strong> Yapılacak işlemi seçin (IP Ban, Email, Webhook, AWS Lambda vb.)</li>
</ol>
<p><strong>İpucu:</strong> Webhook aksiyonu ile Slack, Teams veya özel sistemlerinize entegrasyon kurabilirsiniz.</p>

<h2>Fabric Connectors — Fabric Bağlayıcıları</h2>
<p><strong>Ne gösterir:</strong> FortiGate'i diğer Fortinet ürünleri ve üçüncü taraf platformlarla entegre eden bağlayıcılardır.</p>

<h3>Dahili Fabric Connector'lar</h3>
<ul>
  <li><strong>FortiAnalyzer:</strong> Merkezi log ve raporlama entegrasyonu</li>
  <li><strong>FortiManager:</strong> Merkezi yapılandırma yönetimi</li>
  <li><strong>FortiClient EMS:</strong> Endpoint güvenlik ve ZTNA entegrasyonu</li>
  <li><strong>FortiSandbox:</strong> Bilinmeyen dosyaları sandbox'ta analiz etme</li>
  <li><strong>FortiMail:</strong> E-posta güvenliği entegrasyonu</li>
</ul>

<h3>Ne için kullanılır?</h3>
<ul>
  <li>FortiAnalyzer bağlantısı kurarak tüm logların merkezi toplanması</li>
  <li>FortiClient EMS ile endpoint bilgilerini (kullanıcı, cihaz uyumluluk) politikalarda kullanma</li>
  <li>FortiSandbox ile sıfır gün tehditlerine karşı dosya analizi</li>
</ul>

<h2>External Connectors — Dış Bağlayıcılar</h2>
<p><strong>Ne gösterir:</strong> Fortinet ekosistemi dışındaki üçüncü taraf sistemlerle entegrasyon sağlayan bağlayıcılardır.</p>

<h3>Desteklenen Platformlar</h3>
<ul>
  <li><strong>Bulut platformları:</strong> AWS, Microsoft Azure, Google Cloud, Oracle Cloud</li>
  <li><strong>SDN çözümleri:</strong> VMware NSX, Cisco ACI, Nuage</li>
  <li><strong>Tehdit istihbaratı:</strong> Threat Intelligence feeds (özel IP listelerini otomatik güncelleme)</li>
  <li><strong>ITSM sistemleri:</strong> ServiceNow entegrasyonu</li>
</ul>

<h3>Ne için kullanılır?</h3>
<ul>
  <li>AWS ortamındaki sanal makinelerin IP adreslerini dinamik olarak FortiGate adres nesnesine çekme</li>
  <li>Tehdit istihbarat servislerinden gelen kötü amaçlı IP listelerini otomatik engelleme</li>
  <li>VMware NSX ile mikro segmentasyon politikalarını senkronize etme</li>
</ul>

<h2>Asset Identity Center — Varlık Kimlik Merkezi</h2>
<p><strong>Ne gösterir:</strong> Security Fabric'e görünen tüm cihaz ve kullanıcıların kimlik bilgilerini, risk skorlarını ve davranışsal profillerini tek bir ekranda toplar.</p>

<h3>Ne için kullanılır?</h3>
<ul>
  <li><strong>Cihaz envanteri:</strong> Ağdaki tüm cihazların OS, model, IP, MAC bilgilerini görme</li>
  <li><strong>Kullanıcı kimliği:</strong> IP adresini Active Directory veya LDAP kullanıcısıyla eşleştirme</li>
  <li><strong>Risk skoru:</strong> FortiClient uyumluluğu, güncel olmayan OS, eksik antivirus gibi riskleri puanlama</li>
  <li><strong>ZTNA (Zero Trust):</strong> Her cihazın güven skoruna göre erişim politikası uygulama</li>
  <li><strong>IoT cihaz tespiti:</strong> Yazıcı, kamera, IP telefon gibi cihazları otomatik sınıflandırma</li>
</ul>

<h3>Nasıl okunur?</h3>
<p>Her cihaz için risk seviyesi (Yüksek/Orta/Düşük) renkli ikonla gösterilir. Yüksek riskli cihaza tıklayarak nedenini (güncel olmayan FortiClient, zayıf OS sürümü vb.) ve önerilen aksiyonu görürsünüz. Buradan doğrudan karantina veya politika uygulama aksiyonu alınabilir.</p>

<h2>Security Fabric Kurulumu için Gereksinimler</h2>
<ul>
  <li>Root FortiGate (Fabric'i yöneten ana cihaz) ve downstream FortiGate'ler aynı Fabric'te olmalı</li>
  <li>Her cihazda <strong>Security Fabric Connection</strong> arayüz ayarı açık olmalı</li>
  <li>FortiGate'ler arasında yönetim trafiğine izin veren firewall politikası bulunmalı</li>
  <li>Tüm cihazlarda NTP senkronizasyonu yapılmış olmalı (log korelasyonu için kritik)</li>
</ul>

<h2>Sonuç</h2>
<p>Security Fabric menüsü, FortiGate'i sadece bir firewall olmaktan çıkarıp tüm ağın görünürlük ve yönetim merkezine dönüştürür. Physical Topology ile kabloyu, Logical Topology ile politikayı, Security Rating ile güvenlik açıklarını, Automation ile tekrarlayan işleri otomatize edebilir, Connector'larla ekosistemi genişletebilirsiniz. Lider Network olarak Security Fabric tasarımı, kurulumu ve optimizasyonu konularında uzman mühendislerimizle yanınızdayız.</p>
    `,
  },

  {
    slug: "fortigate-network-menusu-interfaces-dns-sdwan-routing-diagnostics",
    title: "FortiGate Network Menüsü: Interfaces'tan BGP'ye Tüm Seçenekler",
    excerpt:
      "FortiGate'in Network menüsündeki Interfaces, DNS, IPAM, SD-WAN, Static Routes, Policy Routes, OSPF, BGP, Routing Objects ve Diagnostics ekranlarının tamamını açıklıyoruz. Hangisi ne zaman kullanılır, ne işe yarar?",
    category: "ag-teknolojileri",
    categoryColor: "#0052ff",
    tags: ["FortiGate", "Network", "SD-WAN", "Static Routes", "OSPF", "BGP", "DNS", "Diagnostics", "Routing"],
    publishedAt: "2026-05-22",
    readTime: 12,
    content: `
<h2>Giriş</h2>
<p>FortiGate'in <strong>Network</strong> menüsü, cihazın tüm ağ katmanı yapılandırmasını barındırır. Arayüz tanımlamalarından dinamik yönlendirme protokollerine, DNS ayarlarından ağ tanılama araçlarına kadar her şey bu menü altında toplanmıştır. Aşağıda her alt menü tek tek ele alınmıştır.</p>

<h2>Interfaces — Arayüzler</h2>
<p><strong>Ne gösterir:</strong> FortiGate üzerindeki tüm fiziksel ve sanal ağ arayüzlerinin listesini, IP adreslerini, durumlarını ve bağlı cihaz sayısını gösterir.</p>

<h3>Arayüz Türleri</h3>
<ul>
  <li><strong>Physical:</strong> Fiziksel portlar (port1, port2, WAN1 vb.)</li>
  <li><strong>VLAN:</strong> Bir fiziksel port üzerinde tanımlanan sanal arayüz (802.1Q)</li>
  <li><strong>Aggregate (LAG):</strong> Birden fazla fiziksel portu birleştirerek bant genişliği artırma veya yedekleme</li>
  <li><strong>Redundant:</strong> İki fiziksel portu active/standby modda birleştirme</li>
  <li><strong>Loopback:</strong> Yönetim veya BGP/OSPF için sanal IP arayüzü</li>
  <li><strong>Tunnel (IPsec, GRE):</strong> VPN tünellerinin arayüz temsili</li>
  <li><strong>Software Switch:</strong> Birden fazla portu Layer 2 switch gibi birleştirme</li>
</ul>

<h3>Ne için kullanılır?</h3>
<ul>
  <li>WAN ve LAN arayüzlerine IP adresi atama</li>
  <li>VLAN segmentasyonu oluşturma</li>
  <li>Administrative Access ayarlarını yapılandırma (HTTPS, SSH, Security Fabric)</li>
  <li>DHCP sunucusunu arayüz bazında etkinleştirme</li>
  <li>MTU, speed/duplex ayarlarını manuel belirleme</li>
</ul>

<h2>DNS</h2>
<p><strong>Ne gösterir:</strong> FortiGate'in kendi kullandığı DNS sunucularını ve isteğe bağlı olarak iç ağ istemcilerinin DNS sorgularını nasıl işleyeceğini yapılandırır.</p>

<h3>DNS Modları</h3>
<ul>
  <li><strong>Forward to System DNS:</strong> Tüm DNS sorguları FortiGate'in tanımlı DNS sunucularına iletilir (varsayılan)</li>
  <li><strong>Local DNS Database:</strong> FortiGate kendisi yerel DNS kaydı tutar — belirli hostname'leri statik IP ile eşleştirme</li>
  <li><strong>DNS over TLS/HTTPS:</strong> Şifreli DNS sorguları için DoT/DoH desteği</li>
</ul>

<h3>Ne için kullanılır?</h3>
<ul>
  <li>ISP DNS yerine güvenilir DNS sunucusu tanımlamak (8.8.8.8, 1.1.1.1 veya kurumsal DNS)</li>
  <li>İç ağ hostlarını dahili DNS ile çözmek</li>
  <li>DNS filtreleme (FortiGuard DNS Filter) için DNS trafiğini FortiGate üzerinden geçirmek</li>
  <li>DNS rebinding saldırılarına karşı koruma etkinleştirmek</li>
</ul>

<h2>IPAM — IP Adres Yönetimi</h2>
<p><strong>Ne gösterir:</strong> FortiGate'in ağınızdaki IP adres havuzlarını merkezi olarak yönetmesini sağlar. Özellikle çok sayıda şube veya segment olan ortamlarda IP çakışmalarını önler.</p>

<h3>Ne için kullanılır?</h3>
<ul>
  <li>Subnet havuzları oluşturmak ve kullanılan/boş IP'leri görselleştirmek</li>
  <li>Şube FortiGate'lere otomatik subnet atamak (SD-WAN senaryolarında)</li>
  <li>IP çakışması tespiti ve önlenmesi</li>
</ul>
<p><strong>Not:</strong> IPAM özelliği FortiOS 7.0 ve sonrasında geliştirilmiştir. Küçük ağlarda genellikle kullanılmaz; onlarca subnet'i olan kurumsal yapılar için değerlidir.</p>

<h2>SD-WAN</h2>
<p><strong>Ne gösterir:</strong> Birden fazla WAN bağlantısını (fiber, ADSL, LTE) tek bir mantıksal arayüz altında birleştirerek akıllı trafik yönetimi sağlar.</p>

<h3>Temel Bileşenler</h3>
<ul>
  <li><strong>SD-WAN Members:</strong> WAN arayüzleri ve öncelikleri</li>
  <li><strong>Performance SLA:</strong> Her bağlantının gecikme, jitter ve paket kaybı ölçümü</li>
  <li><strong>SD-WAN Rules:</strong> Uygulamaya veya hedefe göre hangi WAN hattının kullanılacağı kuralları</li>
</ul>

<h3>Ne için kullanılır?</h3>
<ul>
  <li><strong>Failover:</strong> Birincil hat koptuğunda trafiği otomatik yedek hatta taşıma</li>
  <li><strong>Load Balancing:</strong> Trafiği birden fazla hat arasında dağıtma</li>
  <li><strong>Uygulama bazlı yönlendirme:</strong> VoIP trafiğini düşük gecikmeli hattan, bulk veriyi ucuz hattan gönderme</li>
  <li><strong>Bant genişliği optimizasyonu:</strong> En iyi performanslı hattı otomatik seçme</li>
</ul>

<h3>Örnek SD-WAN Kuralı</h3>
<p>Microsoft Teams trafiğini her zaman fiber hattan geçirmek için:</p>
<pre><code>config system sdwan
    config service
        edit 1
            set name "Teams_Fiber"
            set mode manual
            set dst "Microsoft-Teams"
            set priority-members 1
        next
    end
end</code></pre>

<h2>Static Routes — Statik Rotalar</h2>
<p><strong>Ne gösterir:</strong> Manuel olarak tanımlanan ağ yollarını listeler. FortiGate, bir paketi nereye göndereceğini bilmediğinde bu tabloya bakar.</p>

<h3>Ne için kullanılır?</h3>
<ul>
  <li><strong>Default route (0.0.0.0/0):</strong> İnternete çıkış için gateway tanımı — en temel rota</li>
  <li><strong>İç ağ rotaları:</strong> Farklı subnette bulunan ağlara ulaşmak için next-hop tanımı</li>
  <li><strong>VPN rotaları:</strong> Uzak sitelere tünel üzerinden erişim için statik rota</li>
  <li><strong>Blackhole rota:</strong> Belirli trafiği düşürmek için null arayüze yönlendirme</li>
</ul>

<h3>Rota Önceliği (Distance ve Priority)</h3>
<p>Aynı hedefe birden fazla rota varsa <strong>Administrative Distance</strong> düşük olan tercih edilir. Eşit distance'ta <strong>Priority</strong> devreye girer. Bu mekanizma failover rotaları oluşturmak için kullanılır:</p>
<pre><code># Birincil rota (distance 10)
dst: 0.0.0.0/0  gateway: 1.1.1.1  distance: 10

# Yedek rota (distance 20 - yalnızca birincil düşünce aktif olur)
dst: 0.0.0.0/0  gateway: 2.2.2.2  distance: 20</code></pre>

<h2>Policy Routes — Politika Rotaları</h2>
<p><strong>Ne gösterir:</strong> Kaynak IP, hedef IP, protokol veya gelen arayüze göre trafiği farklı gateway'lere yönlendirme kuralları. Statik rotadan daha granüler kontrol sağlar.</p>

<h3>Ne için kullanılır?</h3>
<ul>
  <li>Belirli bir subnet'in trafiğini her zaman belirli bir WAN hattından çıkarmak</li>
  <li>Yönetim trafiğini (SSH, HTTPS) farklı hattan geçirmek</li>
  <li>Çok ISP'li ortamlarda gelişmiş trafik mühendisliği</li>
</ul>
<p><strong>Örnek:</strong> 192.168.10.0/24 subnet'indeki kullanıcıların trafiği her zaman ISP2'den çıksın — Policy Route ile tek kuralla sağlanır.</p>

<h2>RIP — Routing Information Protocol</h2>
<p>En eski dinamik yönlendirme protokollerinden biridir. Hop sayısını (maksimum 15) metrik olarak kullanır. <strong>Modern kurumsal ağlarda genellikle tercih edilmez</strong> — OSPF veya BGP daha güvenilirdir. Yalnızca eski altyapılarla uyumluluk için kullanılır.</p>

<h2>OSPF — Open Shortest Path First</h2>
<p><strong>Ne gösterir:</strong> Link-state tabanlı interior gateway protokolü. Ağ topolojisini tüm routerlar arasında paylaşarak en kısa yolu hesaplar.</p>

<h3>Ne için kullanılır?</h3>
<ul>
  <li>Çok sayıda router içeren kurumsal ağlarda otomatik rota öğrenme</li>
  <li>Şube-merkez topolojilerinde dinamik failover</li>
  <li>Data center içi ağ yönlendirmesi</li>
  <li>FortiGate'i mevcut OSPF ağına dahil etme</li>
</ul>

<h3>Temel Kavramlar</h3>
<ul>
  <li><strong>Area:</strong> OSPF ağını segmentlere böler. Area 0 (backbone) zorunludur.</li>
  <li><strong>Hello paketi:</strong> Komşu routerları keşfetmek için periyodik gönderilir</li>
  <li><strong>LSA (Link State Advertisement):</strong> Topoloji bilgisinin yayıldığı mesajlar</li>
  <li><strong>DR/BDR:</strong> Multi-access ağlarda seçilen designated router</li>
</ul>

<h2>BGP — Border Gateway Protocol</h2>
<p><strong>Ne gösterir:</strong> İnternetin omurgasını oluşturan exterior gateway protokolü. AS (Autonomous System) numaraları arasında rota değişimi yapar.</p>

<h3>Ne için kullanılır?</h3>
<ul>
  <li>Birden fazla ISP bağlantısı olan kurumlar için çoklu uplink yönetimi (Multi-homing)</li>
  <li>MPLS/leased line ile bağlı şubeler arasında rota öğrenme</li>
  <li>Veri merkezi ve büyük kurumsal ağlarda trafik mühendisliği</li>
  <li>SD-WAN overlay ağlarında underlay BGP kullanımı</li>
</ul>
<p><strong>Not:</strong> BGP, RIP ve OSPF'e göre daha karmaşık bir yapılandırma gerektirir. Yanlış yapılandırma ciddi routing sorunlarına yol açabilir — uzman desteği önerilir.</p>

<h2>Routing Objects — Yönlendirme Nesneleri</h2>
<p><strong>Ne gösterir:</strong> OSPF ve BGP yapılandırmalarında kullanılan route-map, prefix-list ve access-list gibi yardımcı nesneleri barındırır.</p>

<h3>Ne için kullanılır?</h3>
<ul>
  <li><strong>Prefix List:</strong> Belirli ağ bloklarını filtrele veya izin ver</li>
  <li><strong>Route Map:</strong> Rota özelliklerini (metric, next-hop, community) değiştir</li>
  <li><strong>Access List:</strong> Dinamik yönlendirme protokollerinde rota filtreleme</li>
</ul>
<p>Bu nesneler tek başına işlev görmez; OSPF veya BGP yapılandırmalarında referans olarak kullanılır.</p>

<h2>Multicast</h2>
<p><strong>Ne gösterir:</strong> IP multicast trafiğinin yönetimi için PIM (Protocol Independent Multicast) ve IGMP (Internet Group Management Protocol) ayarlarını barındırır.</p>

<h3>Ne için kullanılır?</h3>
<ul>
  <li>IP TV ve video akış altyapıları</li>
  <li>IPTV dağıtım ağları</li>
  <li>Video konferans sistemlerinde multicast optimizasyonu</li>
  <li>Finansal sistemlerde piyasa verisi (market data) dağıtımı</li>
</ul>
<p><strong>Not:</strong> Multicast, özel bir ihtiyaç olmadıkça kurumsal ağlarda aktif tutulmaz. Devre dışı bırakılmış bırakmak güvenlik açısından önerilir.</p>

<h2>Diagnostics — Ağ Tanılama</h2>
<p><strong>Ne gösterir:</strong> FortiGate GUI üzerinden çalıştırılabilen ağ tanılama araçlarını sunar. Komut satırına gerek kalmadan temel testler yapılabilir.</p>

<h3>Araçlar</h3>
<ul>
  <li><strong>Ping:</strong> Hedef IP'ye ICMP echo testi. Kaynak arayüzü seçilebilir — bu özellikle çok arayüzlü ortamlarda kritiktir.</li>
  <li><strong>Traceroute:</strong> Hedefe giden yol üzerindeki her atlamayı (hop) ve gecikmeyi gösterir.</li>
  <li><strong>DNS Lookup:</strong> Belirli bir domain'in DNS çözümlemesini FortiGate üzerinden test eder.</li>
  <li><strong>Sniffer (Packet Capture):</strong> Belirli bir arayüzdeki trafiği anlık yakalar — sorun gidermede en güçlü araç.</li>
</ul>

<h3>Packet Capture (Sniffer) Kullanımı</h3>
<p>CLI üzerinden daha gelişmiş filtreleme mümkündür:</p>
<pre><code># port1 arayüzünde tüm ICMP trafiğini yakala
diagnose sniffer packet port1 "icmp" 4 10

# Belirli bir IP'nin trafiğini izle
diagnose sniffer packet any "host 192.168.1.100" 4

# HTTP trafiğini izle
diagnose sniffer packet any "port 80" 4 100</code></pre>

<h3>Ping'de Kaynak Arayüzü Seçimi Neden Önemli?</h3>
<p>FortiGate'de ping yaparken kaynak arayüzünü seçmezseniz, FortiGate en uygun arayüzü otomatik seçer ve bu test sonucunu yanıltabilir. Örneğin WAN üzerinden bir hedefe erişimi test etmek istiyorsanız kaynak olarak WAN arayüzünü seçmelisiniz.</p>

<h2>Hangi Senaryo için Hangi Menü?</h2>
<table style="width:100%; border-collapse: collapse; margin: 16px 0;">
  <thead>
    <tr style="background:#0052ff20;">
      <th style="padding:8px; border:1px solid #0052ff30; text-align:left;">Senaryo</th>
      <th style="padding:8px; border:1px solid #0052ff30; text-align:left;">Kullanılacak Menü</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">WAN bağlantısı kurulamıyor</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Interfaces → WAN arayüzü, Static Routes → Default Route, Diagnostics → Ping</td></tr>
    <tr><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">DNS çözümlenmiyor</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">DNS → DNS sunucusu, Diagnostics → DNS Lookup</td></tr>
    <tr><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">İki WAN hattı var, failover isteniyorr</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">SD-WAN veya Static Routes → farklı distance ile</td></tr>
    <tr><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Şube ağları otomatik öğrenilsin</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">OSPF veya BGP</td></tr>
    <tr><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Belirli bir subnet farklı ISP'den çıksın</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Policy Routes</td></tr>
    <tr><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Ağda paket kaybı var, nerede sorun?</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Diagnostics → Traceroute, Sniffer</td></tr>
  </tbody>
</table>

<h2>Sonuç</h2>
<p>FortiGate'in Network menüsü, basit bir arayüz IP atamasından BGP gibi karmaşık yönlendirme protokollerine kadar her ölçekteki ağ ihtiyacını karşılar. Günlük operasyonlarda en sık kullanılanlar Interfaces, Static Routes, DNS ve Diagnostics'tir. SD-WAN ise çok WAN hatlı ortamlarda vazgeçilmez hale gelmiştir. Lider Network olarak FortiGate ağ tasarımı, SD-WAN kurulumu ve yönlendirme protokolleri yapılandırmasında uzman mühendislerimizle yanınızdayız.</p>
    `,
  },

  {
    slug: "fortios-76-yenilikleri-neler-degisti",
    title: "FortiOS 7.6 Yenilikleri: Neler Değişti, Ne Getirildi?",
    excerpt:
      "Fortinet'in en güncel işletim sistemi FortiOS 7.6, SD-WAN, ZTNA, AI destekli tehdit algılama ve yönetim arayüzünde önemli yenilikler getirdi. Öne çıkan özellikleri ve yükseltme öncesi dikkat edilmesi gerekenleri inceliyoruz.",
    category: "fortigate-ngfw",
    categoryColor: "#EE3124",
    tags: ["FortiOS 7.6", "FortiGate", "Yeni Özellikler", "SD-WAN", "ZTNA", "AI Security"],
    publishedAt: "2026-05-22",
    readTime: 7,
    content: `
<h2>FortiOS 7.6 Neden Önemli?</h2>
<p>Fortinet, her büyük FortiOS sürümünde güvenlik, performans ve kullanılabilirlik açısından köklü yenilikler getirir. <strong>FortiOS 7.6</strong>, özellikle AI destekli tehdit algılama, gelişmiş SD-WAN telemetrisi ve Zero Trust mimarisi entegrasyonu açısından önceki sürümlere göre önemli adımlar atmıştır.</p>
<p>Bu makale FortiOS 7.6'nın öne çıkan özelliklerini, yükseltme öncesi dikkat edilmesi gerekenleri ve hangi donanımların desteklendiğini ele almaktadır.</p>

<h2>Öne Çıkan Yenilikler</h2>

<h3>1. AI/ML Destekli Tehdit Algılama</h3>
<p>FortiOS 7.6 ile FortiGuard'ın AI tabanlı threat intelligence motoru daha derin entegrasyon kazandı. Makine öğrenmesi modelleri, sıfır gün saldırılarını imza güncellemesi gerekmeden davranışsal analiz ile tespit edebiliyor. Özellikle:</p>
<ul>
  <li>Bilinmeyen dosyalar için gerçek zamanlı sandbox önizleme</li>
  <li>Kullanıcı davranış anormalliği tespiti (UEBA entegrasyonu)</li>
  <li>Otomatik politika önerisi motoru — eksik güvenlik kontrollerini tespit edip öneri sunuyor</li>
</ul>

<h3>2. SD-WAN Uygulama Performans İzleme (APM)</h3>
<p>SD-WAN'da uygulama bazlı SLA izleme artık çok daha granüler hale geldi:</p>
<ul>
  <li>Microsoft 365, Salesforce, Zoom gibi SaaS uygulamaları için önceden tanımlı APM profilleri</li>
  <li>Uygulama bazlı gerçek zamanlı gecikme/jitter görselleştirmesi FortiView'de doğrudan gösterilmesi</li>
  <li>Passive WAN Health Check — aktif probe göndermeden trafik analizi ile hat kalitesi ölçümü</li>
</ul>

<h3>3. ZTNA 2.0 Geliştirmeleri</h3>
<p>Zero Trust Network Access tarafında FortiOS 7.6 şunları getirdi:</p>
<ul>
  <li>Cihaz durum (posture) kontrolü gerçek zamanlı güncelleniyor — oturum sırasında uyumsuz hale gelen cihaz otomatik erişim kaybediyor</li>
  <li>SAML 2.0 ve OAuth 2.0 ile genişletilmiş kimlik sağlayıcı desteği</li>
  <li>Inline CASB entegrasyonu ile SaaS uygulama görünürlüğü artırıldı</li>
</ul>

<h3>4. GUI Yenilikleri</h3>
<ul>
  <li>Dashboard widget'ları özelleştirilebilir hale geldi — sürükle-bırak düzeni</li>
  <li>Policy yönetiminde arama ve filtreleme geliştirildi</li>
  <li>Log görünümünde korelasyon motoru — ilişkili logları otomatik gruplama</li>
  <li>Karanlık mod desteği (Dark mode)</li>
</ul>

<h3>5. IPsec VPN Performans İyileştirmeleri</h3>
<p>NP7 ve NP6 işlemci destekli modellerde IPsec şifreleme/şifre çözme hızları %20-30 artırıldı. Özellikle büyük şube ağlarında hub-and-spoke VPN topolojilerinde fark hissedilir düzeyde.</p>

<h3>6. FortiManager Cloud Entegrasyonu</h3>
<p>FortiOS 7.6 ile FortiManager Cloud'a bağlantı daha basit hale getirildi. Sıfır dokunuşlu (zero-touch) provision ile yeni bir FortiGate'in seri numarası girilerek fabrika çıkışından doğrudan production konfigürasyonuna geçmesi sağlanabilir.</p>

<h2>Hangi Donanımlar Destekleniyor?</h2>
<p>FortiOS 7.6, belirli eski model FortiGate cihazlarında desteklenmeyebilir. Genel kural:</p>
<ul>
  <li><strong>Tam destek:</strong> FortiGate 40F ve üzeri, 2020 sonrası modeller</li>
  <li><strong>Kısmi destek:</strong> Bazı eski 60D, 80D serileri — Release Notes'u kontrol edin</li>
  <li><strong>Desteklenmiyor:</strong> FortiGate 30D ve öncesi modeller</li>
</ul>
<p>Yükseltme öncesi mutlaka <a href="https://docs.fortinet.com" style="color:#EE3124;">docs.fortinet.com</a> adresinden Release Notes'u inceleyin.</p>

<h2>Yükseltme Öncesi Yapılması Gerekenler</h2>
<ol>
  <li><strong>Güncel backup alın:</strong> CLI'dan <code>execute backup full-config tftp</code></li>
  <li><strong>Upgrade path'i doğrulayın:</strong> Bazı sürüm atlamalarında ara sürümden geçmek gerekir (Fortinet Upgrade Path Tool kullanın)</li>
  <li><strong>Maintenance window belirleyin:</strong> Yükseltme sırasında kısa süreli kesinti yaşanır</li>
  <li><strong>HA ortamında:</strong> Önce secondary, sonra primary güncelleyin</li>
  <li><strong>Release Notes'u okuyun:</strong> Breaking change'leri ve deprecated özellikleri kontrol edin</li>
</ol>

<h2>Sonuç</h2>
<p>FortiOS 7.6, AI tabanlı güvenlik, gelişmiş SD-WAN telemetrisi ve ZTNA 2.0 ile kurumsal güvenlik gereksinimlerini karşılama konusunda önemli adımlar atmaktadır. Yükseltme planlaması ve test süreçlerinde Lider Network uzman mühendisleri olarak destek sağlıyoruz.</p>
    `,
  },

  {
    slug: "ssl-vpn-vs-ipsec-vpn-hangisini-secmeli",
    title: "SSL VPN vs IPsec VPN: Hangisini Seçmeli? FortiGate Üzerinde Karşılaştırma",
    excerpt:
      "SSL VPN mi, IPsec VPN mi? Her ikisi de uzaktan erişim ve site-to-site bağlantı için kullanılır ancak mimari, performans ve kullanım senaryoları açısından önemli farklar vardır. FortiGate özelinde detaylı karşılaştırma.",
    category: "siber-guvenlik",
    categoryColor: "#EE3124",
    tags: ["SSL VPN", "IPsec VPN", "FortiGate", "VPN", "Uzaktan Erişim", "Site-to-Site"],
    publishedAt: "2026-05-22",
    readTime: 8,
    content: `
<h2>VPN Türlerine Giriş</h2>
<p>Kurumsal ağlarda VPN iki temel amaç için kullanılır: <strong>uzaktan kullanıcı erişimi</strong> (remote access) ve <strong>şubeler arası bağlantı</strong> (site-to-site). FortiGate her iki senaryoyu da hem SSL VPN hem IPsec VPN ile karşılayabilir — peki hangisi ne zaman tercih edilmeli?</p>

<h2>SSL VPN Nedir?</h2>
<p>SSL VPN, HTTPS protokolü üzerinden (TCP 443) çalışan bir VPN türüdür. Kullanıcı cihazına FortiClient kurularak tünel modu veya tarayıcı tabanlı web modu ile erişim sağlanır.</p>

<h3>Avantajları</h3>
<ul>
  <li>Kurulum basitliği — son kullanıcı için kolay yapılandırma</li>
  <li>TCP 443 portu kullandığı için çoğu ağda (otel, kafe WiFi) çalışır — firewall/NAT arkasında sorun yaşanmaz</li>
  <li>Web modu ile istemci yazılımı gerekmeden tarayıcıdan erişim</li>
  <li>Kullanıcı bazlı ince taneli erişim kontrolü</li>
  <li>Çok faktörlü kimlik doğrulama (MFA) entegrasyonu kolaydır</li>
</ul>

<h3>Dezavantajları</h3>
<ul>
  <li>TCP üzerinde çalışması nedeniyle yüksek gecikme ve düşük performans (özellikle yoğun trafik için)</li>
  <li>FortiGate CPU'sunu daha fazla kullanır — çok sayıda eş zamanlı bağlantıda performans düşer</li>
  <li>Fortinet, FortiOS 7.4 ile SSL VPN'i <strong>deprecated</strong> ilan etti — yeni kurulumlar için ZTNA veya IPsec önerilmekte</li>
</ul>

<h2>IPsec VPN Nedir?</h2>
<p>IPsec VPN, Layer 3 düzeyinde şifreli tünel oluşturan standart bir protokoldür. UDP 500 ve 4500 portlarını, ESP (Encapsulating Security Payload) protokolünü kullanır. FortiGate'de hem site-to-site hem remote access için kullanılabilir.</p>

<h3>Avantajları</h3>
<ul>
  <li>Yüksek performans — NP işlemcisi ile donanım hızlandırma desteği</li>
  <li>UDP tabanlı olduğu için gerçek zamanlı uygulamalar (VoIP, video) için düşük gecikme</li>
  <li>Site-to-site bağlantılarda endüstri standardı</li>
  <li>IKEv2 ile mobil istemcilerde hızlı bağlantı yeniden kurma (re-keying)</li>
  <li>Fortinet'in uzun vadeli önerilen protokolü</li>
</ul>

<h3>Dezavantajları</h3>
<ul>
  <li>NAT arkasında bazı ağ ortamlarında sorun yaşanabilir (NAT-T ile genellikle çözülür)</li>
  <li>İstemci yapılandırması SSL VPN'e göre biraz daha karmaşık</li>
  <li>UDP 500/4500 portları bazı kısıtlı ağlarda engellenmiş olabilir</li>
</ul>

<h2>FortiGate Üzerinde Karşılaştırma Tablosu</h2>
<table style="width:100%; border-collapse: collapse; margin: 16px 0;">
  <thead>
    <tr style="background:#EE312420;">
      <th style="padding:8px; border:1px solid #EE312430; text-align:left;">Özellik</th>
      <th style="padding:8px; border:1px solid #EE312430; text-align:left;">SSL VPN</th>
      <th style="padding:8px; border:1px solid #EE312430; text-align:left;">IPsec VPN</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Protokol</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">TLS/HTTPS (TCP 443)</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">IKE/ESP (UDP 500, 4500)</td></tr>
    <tr><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Performans</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Orta (CPU yoğun)</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Yüksek (NP hızlandırma)</td></tr>
    <tr><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">NAT Uyumluluğu</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Mükemmel</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">İyi (NAT-T ile)</td></tr>
    <tr><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Kurulum Kolaylığı</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Kolay</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Orta</td></tr>
    <tr><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Site-to-Site</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Mümkün ama önerilmez</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Standart ve önerilen</td></tr>
    <tr><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Remote Access</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Yaygın (deprecated)</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">FortiClient ile mükemmel</td></tr>
    <tr><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Fortinet Yol Haritası</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Deprecated (7.4+)</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Aktif geliştirme</td></tr>
    <tr><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">MFA Desteği</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Mükemmel</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">IKEv2 ile iyi</td></tr>
  </tbody>
</table>

<h2>Hangi Senaryoda Hangisini Seçmeli?</h2>

<h3>Site-to-Site Bağlantı (Şube ↔ Merkez)</h3>
<p>✅ <strong>IPsec VPN</strong> — performans, kararlılık ve ölçeklenebilirlik açısından standart tercih. IKEv2 ile modern, dinamik şube topolojileri için idealdir.</p>

<h3>Uzaktan Çalışan Erişimi</h3>
<p>✅ <strong>IPsec VPN + FortiClient</strong> (önerilen) veya <strong>ZTNA</strong> (en güncel yaklaşım). SSL VPN hâlâ çalışır ancak Fortinet'in uzun vadeli desteği IPsec ve ZTNA yönünde.</p>

<h3>Kısıtlı Ağlardan Erişim (otel, havalimanı WiFi)</h3>
<p>✅ <strong>SSL VPN</strong> — TCP 443 neredeyse hiçbir zaman engellenmez. Bu senaryoda SSL VPN hâlâ avantajlıdır.</p>

<h3>Yüksek Performans Gerektiren Uygulamalar (VoIP, video)</h3>
<p>✅ <strong>IPsec VPN</strong> — UDP tabanlı yapısı ve NP donanım hızlandırma desteği ile üstün performans.</p>

<h2>SSL VPN Deprecated Mi Oldu?</h2>
<p>Fortinet, FortiOS 7.4 sürümüyle birlikte SSL VPN'i resmi olarak <strong>deprecated</strong> (kullanım dışı bırakılacak) ilan etti. Bu, SSL VPN'in aniden ortadan kalkmayacağı ancak aktif olarak geliştirilmeyeceği anlamına gelir. Yeni kurulumlar için <strong>IPsec IKEv2 + FortiClient</strong> veya <strong>ZTNA</strong> geçişi planlanması önerilir.</p>

<h2>Sonuç</h2>
<p>İki protokolün de güçlü ve zayıf tarafları vardır. Kısa vadede SSL VPN çalışmaya devam edecek ancak uzun vadede IPsec VPN ve ZTNA'ya geçiş planlamak stratejik bir karardır. Lider Network olarak VPN tasarımı, migrasyon planlaması ve FortiClient EMS kurulumunda uzman mühendislerimizle destek sağlıyoruz.</p>
    `,
  },

  {
    slug: "fortigate-high-availability-ha-kurulumu-active-passive",
    title: "FortiGate High Availability (HA) Nedir? Active-Passive ve Active-Active Kurulumu",
    excerpt:
      "FortiGate HA, iki veya daha fazla cihazın birlikte çalışarak kesintisiz erişim sağlamasıdır. Active-Passive ve Active-Active modları, failover süresi, heartbeat bağlantısı ve HA kurulum adımlarını kapsamlı şekilde açıklıyoruz.",
    category: "fortigate-ngfw",
    categoryColor: "#EE3124",
    tags: ["FortiGate", "High Availability", "HA", "Active-Passive", "Active-Active", "Failover"],
    publishedAt: "2026-05-22",
    readTime: 9,
    content: `
<h2>High Availability (HA) Nedir?</h2>
<p><strong>High Availability (HA)</strong>, iki veya daha fazla FortiGate cihazının bir küme (cluster) oluşturarak kesintisiz hizmet sunmasıdır. Birincil cihaz arızalandığında ikincil cihaz saniyeler içinde devreye girerek ağ trafiğinin kesintisiz akmasını sağlar.</p>
<p>HA, kurumsal ağlarda firewall'ın tek başarısızlık noktası (single point of failure) olmasını önleyen kritik bir mimarik unsurdur.</p>

<h2>FortiGate HA Modları</h2>

<h3>Active-Passive (A-P) Modu</h3>
<p>En yaygın kullanılan HA modudur. Bir cihaz <strong>aktif</strong> olarak tüm trafiği işlerken, diğeri <strong>pasif</strong> konumda bekler ve heartbeat paketiyle aktif cihazı sürekli izler.</p>
<ul>
  <li><strong>Failover:</strong> Aktif cihaz arızalandığında pasif cihaz 1-3 saniye içinde devreye girer</li>
  <li><strong>Performans:</strong> Pasif cihaz trafik işlemez, kapasite iki katına çıkmaz</li>
  <li><strong>Avantaj:</strong> Basit yapılandırma, düşük karmaşıklık, kolay sorun giderme</li>
  <li><strong>Dezavantaj:</strong> Pasif cihaz "boşa" çalışır — yatırım verimliliği düşer</li>
</ul>

<h3>Active-Active (A-A) Modu</h3>
<p>Her iki cihaz da aktif olarak trafik işler. Master cihaz, gelen trafiği cluster üyeleri arasında dağıtır.</p>
<ul>
  <li><strong>Performans:</strong> İki cihazın UTM işleme kapasitesi birleşir — yüksek trafik ortamlarında avantajlı</li>
  <li><strong>Failover:</strong> Bir cihaz düşerse diğeri tek başına devam eder</li>
  <li><strong>Avantaj:</strong> Her iki cihaz da aktif kullanılır, UTM throughput iki katına çıkar</li>
  <li><strong>Dezavantaj:</strong> Daha karmaşık yapılandırma, bazı özellikler A-A modda desteklenmez</li>
</ul>

<h2>HA Bileşenleri</h2>

<h3>Heartbeat Arayüzü</h3>
<p>Cluster üyeleri birbirini <strong>heartbeat paketleri</strong> ile izler. Heartbeat bağlantısı kopan veya yanıt vermeyen cihaz arızalı kabul edilir. En az bir, tercihen iki bağımsız heartbeat bağlantısı önerilir.</p>
<p><strong>Bağlantı türleri:</strong></p>
<ul>
  <li>Doğrudan kablo bağlantısı (önerilen — en güvenilir)</li>
  <li>Dedicated switch üzerinden bağlantı</li>
</ul>

<h3>Cluster Synchronization</h3>
<p>Aktif ve pasif cihazlar arasında yapılandırma, oturum tablosu ve routing tablosu sürekli senkronize edilir. Bu sayede failover sırasında aktif TCP oturumları kesilmeden devam edebilir (session pickup).</p>

<h3>Virtual MAC ve Virtual IP</h3>
<p>HA cluster'ı ağa tek bir sanal MAC adresiyle görünür. Failover sırasında MAC adresi değişmediği için switch tabloları güncellenmez ve bağlantı kesintisi minimale iner.</p>

<h2>FortiGate HA Kurulumu — Adım Adım</h2>

<h3>Ön Gereksinimler</h3>
<ul>
  <li>Aynı FortiGate modeli (örn. her ikisi de FG-100F)</li>
  <li>Aynı FortiOS sürümü</li>
  <li>Aynı lisanslar (UTM, TP vb.)</li>
  <li>En az 2 boş port heartbeat için ayrılmış</li>
</ul>

<h3>1. Primary (Master) Cihaz Yapılandırması</h3>
<pre><code>config system ha
    set mode a-p
    set group-name "LiderNetwork-HA"
    set group-id 1
    set password "HA_Cluster_Pass123"
    set priority 200
    set hbdev "port3" 50
    set hbdev "port4" 50
    set session-pickup enable
    set override enable
end</code></pre>

<h3>2. Secondary (Slave) Cihaz Yapılandırması</h3>
<pre><code>config system ha
    set mode a-p
    set group-name "LiderNetwork-HA"
    set group-id 1
    set password "HA_Cluster_Pass123"
    set priority 100
    set hbdev "port3" 50
    set hbdev "port4" 50
    set session-pickup enable
end</code></pre>
<p>Priority değeri yüksek olan cihaz master seçilir. Secondary'de daha düşük priority verilir.</p>

<h3>3. Cluster'ı Doğrulama</h3>
<pre><code># Cluster durumunu görüntüle
get system ha status

# Beklenen çıktı:
# Model: FortiGate-100F
# Mode: HA A-P
# Group: 1
# Debug: 0
# Master: FG100F-Master (prio=200, id=0)
# Slave : FG100F-Slave  (prio=100, id=1)</code></pre>

<h2>Failover Testi Nasıl Yapılır?</h2>
<p>Üretime geçmeden önce failover testini mutlaka yapın:</p>
<ol>
  <li>Aktif trafik varken (ping, iperf vb.) master cihazın güç kablosunu çekin</li>
  <li>Slave cihazın master olarak devreye girdiğini doğrulayın</li>
  <li>Kesinti süresini ölçün (hedef: 3 saniye altı)</li>
  <li>Master cihazı geri bağlayın — override enable ise master rolüne geri döner</li>
</ol>

<h2>HA Yönetimi: Her Cihaza Ayrı Erişim</h2>
<p>HA kurulumunda her cihazın yönetim IP'si ayrı tanımlanmalıdır — aksi halde slave cihaza ayrı erişim mümkün olmaz:</p>
<pre><code>config system ha
    set ha-mgmt-status enable
    config ha-mgmt-interfaces
        edit 1
            set interface "mgmt"
            set gateway 192.168.100.1
        next
    end
end</code></pre>
<p>Master'a cluster IP'sinden, slave'e ise ha-mgmt arayüzünün IP'sinden erişilir.</p>

<h2>Yaygın HA Sorunları ve Çözümleri</h2>
<ul>
  <li><strong>Split-brain:</strong> Her iki cihaz da kendini master sanıyor — heartbeat bağlantısı kesilmiş olabilir. İki bağımsız heartbeat arayüzü bu riski minimize eder.</li>
  <li><strong>Senkronizasyon hatası:</strong> <code>diagnose sys ha showcsum</code> ile checksum karşılaştırması yapın</li>
  <li><strong>Failover çok uzun sürüyor:</strong> heartbeat-interval ve dead-time değerlerini düşürün</li>
  <li><strong>Session pickup çalışmıyor:</strong> Her iki cihazda da <code>session-pickup enable</code> olmalı</li>
</ul>

<h2>Sonuç</h2>
<p>FortiGate HA, kurumsal ağlarda firewall katmanında kesintisizlik sağlamanın en güvenilir yoludur. Active-Passive mod çoğu senaryo için yeterli ve yönetimi kolaydır; yüksek UTM throughput gerektiren ortamlarda Active-Active değerlendirilebilir. Lider Network olarak FortiGate HA tasarımı, kurulumu ve failover testlerinde uzman mühendislerimizle yanınızdayız.</p>
    `,
  },

  {
    slug: "zero-trust-nedir-fortigate-ile-ztna-uygulamasi",
    title: "Zero Trust Nedir? FortiGate ile ZTNA Uygulaması",
    excerpt:
      "Zero Trust, 'kimseye güvenme, herkesi doğrula' prensibine dayalı modern ağ güvenliği yaklaşımıdır. FortiGate'in ZTNA çözümü nasıl çalışır, geleneksel VPN'den farkı nedir ve nasıl uygulanır? Kapsamlı rehber.",
    category: "siber-guvenlik",
    categoryColor: "#EE3124",
    tags: ["Zero Trust", "ZTNA", "FortiGate", "FortiClient", "Sıfır Güven", "Siber Güvenlik"],
    publishedAt: "2026-05-22",
    readTime: 8,
    content: `
<h2>Zero Trust Nedir?</h2>
<p><strong>Zero Trust</strong> (Sıfır Güven), "hiçbir kullanıcıya, cihaza veya ağa varsayılan olarak güvenme — her erişim isteğini doğrula" prensibine dayalı güvenlik mimarisidir. Geleneksel güvenlik modellerindeki "iç ağ güvenlidir" varsayımını tamamen reddeder.</p>
<p>Zero Trust'ın temel ilkeleri:</p>
<ul>
  <li><strong>Asla güvenme, her zaman doğrula:</strong> Ağ içinde bile her istek kimlik doğrulamadan geçer</li>
  <li><strong>En az ayrıcalık:</strong> Kullanıcı yalnızca ihtiyacı olan kaynağa erişebilir</li>
  <li><strong>Mikro segmentasyon:</strong> Ağ küçük segmentlere bölünerek lateral hareket engellenir</li>
  <li><strong>Sürekli doğrulama:</strong> Oturum süresince cihaz ve kullanıcı güveni anlık değerlendirilir</li>
</ul>

<h2>Neden Zero Trust?</h2>
<p>Geleneksel güvenlik modeli, kurumsal ağı bir kale gibi düşünür — dışarısı tehlikeli, içerisi güvenli. Ancak modern tehdit ortamında bu yaklaşım yetersiz kalır:</p>
<ul>
  <li>Uzaktan çalışma ile "iç ağ" kavramı bulanıklaştı</li>
  <li>Bulut ve SaaS uygulamaları veriyi çevre dışına taşıdı</li>
  <li>İç tehditler (insider threat) ve lateral movement saldırıları arttı</li>
  <li>VPN tüneli açıldığında cihaz tüm ağa erişebiliyor — gereğinden fazla ayrıcalık</li>
</ul>

<h2>ZTNA Nedir?</h2>
<p><strong>ZTNA (Zero Trust Network Access)</strong>, Zero Trust prensiplerini uzaktan erişim senaryolarına uygulayan teknolojidir. Kullanıcı VPN gibi tüm ağa bağlanmak yerine yalnızca erişim yetkisi olan uygulamaya bağlanır.</p>

<h3>VPN vs ZTNA Farkı</h3>
<table style="width:100%; border-collapse: collapse; margin: 16px 0;">
  <thead>
    <tr style="background:#EE312420;">
      <th style="padding:8px; border:1px solid #EE312430; text-align:left;">Özellik</th>
      <th style="padding:8px; border:1px solid #EE312430; text-align:left;">Geleneksel VPN</th>
      <th style="padding:8px; border:1px solid #EE312430; text-align:left;">ZTNA</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Erişim kapsamı</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Tüm ağ segmenti</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Yalnızca yetkili uygulama</td></tr>
    <tr><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Cihaz kontrolü</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Bağlantı sonrası kontrol yok</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Sürekli cihaz posture kontrolü</td></tr>
    <tr><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Lateral movement</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Mümkün</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Engellenir</td></tr>
    <tr><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Kimlik doğrulama</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Bağlantı başında tek seferlik</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Sürekli ve granüler</td></tr>
    <tr><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Uygulama görünürlüğü</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Sınırlı</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Tam görünürlük</td></tr>
  </tbody>
</table>

<h2>FortiGate ZTNA Mimarisi</h2>
<p>Fortinet'in ZTNA çözümü üç ana bileşenden oluşur:</p>
<ul>
  <li><strong>FortiClient:</strong> Son kullanıcı cihazında çalışan agent — kimlik, cihaz durumu ve bağlantıyı yönetir</li>
  <li><strong>FortiClient EMS (Enterprise Management Server):</strong> FortiClient politikalarını merkezi yönetir, cihaz güven skorunu hesaplar</li>
  <li><strong>FortiGate (ZTNA Access Proxy):</strong> Uygulama erişim noktası — kimlik ve cihaz bilgisine göre erişimi izin verir veya reddeder</li>
</ul>

<h2>ZTNA Erişim Akışı</h2>
<ol>
  <li>Kullanıcı korunan uygulamaya erişmek ister</li>
  <li>FortiClient, kullanıcı kimliğini (AD/LDAP/SAML) ve cihaz durumunu (OS güncel mi? AV aktif mi? Disk şifreli mi?) FortiClient EMS'e bildirir</li>
  <li>FortiClient EMS cihaza güven skoru atar ve FortiGate'e iletir</li>
  <li>FortiGate, politikayı değerlendirir: kullanıcı yetkili mi? Cihaz uyumlu mu?</li>
  <li>Her iki koşul da sağlanıyorsa FortiGate uygulamaya şifreli proxy tüneli açar</li>
  <li>Oturum süresince cihaz durumu anlık izlenir — uyumsuz hale gelen cihazın erişimi kesilir</li>
</ol>

<h2>FortiGate'de ZTNA Yapılandırması</h2>

<h3>1. ZTNA Server Tanımı</h3>
<pre><code>config firewall access-proxy
    edit "Internal-App-Proxy"
        set vip "ZTNA-VIP"
        set client-cert enable
        config api-gateway
            edit 1
                set url-map "/app1"
                set service tcp
                set realservers
                    edit 1
                        set ip 10.0.0.100
                        set port 443
                    next
                end
            next
        end
    next
end</code></pre>

<h3>2. ZTNA Politikası</h3>
<pre><code>config firewall policy
    edit 100
        set name "ZTNA-App-Access"
        set srcintf "wan1"
        set dstintf "internal"
        set srcaddr "all"
        set dstaddr "ZTNA-VIP"
        set action accept
        set ztna-status enable
        set ztna-tags-match-logic and
    next
end</code></pre>

<h2>Cihaz Posture Kontrolü Örnekleri</h2>
<p>ZTNA'da cihazın güvenilir kabul edilmesi için örnek koşullar:</p>
<ul>
  <li>FortiClient güncel sürümde yüklü mü?</li>
  <li>İşletim sistemi son yamalarla güncel mi?</li>
  <li>Antivirüs aktif ve güncel mi?</li>
  <li>Disk şifrelemesi (BitLocker/FileVault) etkin mi?</li>
  <li>Cihaz domain'e kayıtlı mı?</li>
  <li>Güvenlik duvarı aktif mi?</li>
</ul>
<p>Bu koşullardan herhangi biri sağlanmıyorsa kullanıcı kimlik doğrulaması başarılı olsa bile erişim reddedilir.</p>

<h2>Zero Trust Yolculuğuna Nereden Başlanmalı?</h2>
<ol>
  <li><strong>Varlık envanteri:</strong> Ağınızdaki tüm kullanıcı, cihaz ve uygulamaları listeleyin</li>
  <li><strong>Kritik uygulamaları belirleyin:</strong> ZTNA'yı önce en kritik uygulamalara uygulayın</li>
  <li><strong>FortiClient EMS kurun:</strong> Endpoint yönetimini merkezi hale getirin</li>
  <li><strong>Pilot grup oluşturun:</strong> Küçük bir kullanıcı grubuyla test edin</li>
  <li><strong>Kademeli genişletin:</strong> Başarılı pilot sonrası tüm uygulamalara yayın</li>
</ol>

<h2>Sonuç</h2>
<p>Zero Trust, "iç ağ güvenlidir" varsayımının geçerliliğini yitirdiği modern tehdit ortamında en doğru güvenlik yaklaşımıdır. Fortinet'in ZTNA çözümü, FortiGate, FortiClient ve EMS üçlüsüyle geleneksel VPN'e güçlü bir alternatif sunar. Lider Network olarak ZTNA mimari tasarımı, FortiClient EMS kurulumu ve Zero Trust yolculuğunuzda uzman mühendislerimizle yanınızdayız.</p>
    `,
  },

  {
    slug: "fortigate-ssl-deep-inspection-sifreli-trafik-tehdit-tespiti",
    title: "FortiGate SSL Deep Inspection: Şifreli Trafikte Tehdit Tespiti",
    excerpt:
      "İnternet trafiğinin %90'ından fazlası artık HTTPS ile şifreli. Geleneksel güvenlik araçları bu trafiği inceleyemez. FortiGate'in SSL Deep Inspection özelliği şifreli trafiği nasıl açar, inceler ve tehditleri nasıl tespit eder?",
    category: "siber-guvenlik",
    categoryColor: "#EE3124",
    tags: ["SSL Inspection", "HTTPS", "Deep Inspection", "FortiGate", "UTM", "Sertifika"],
    publishedAt: "2026-05-22",
    readTime: 7,
    content: `
<h2>Sorun: Şifreli Trafik Görünmez</h2>
<p>Günümüzde internet trafiğinin <strong>%90'ından fazlası HTTPS</strong> üzerinden iletiliyor. Bu şifreleme kullanıcı gizliliği için mükemmeldir; ancak firewall ve güvenlik cihazları için ciddi bir kör nokta oluşturur. Şifreli kanal içinde gelen zararlı yazılım, veri sızıntısı veya komuta-kontrol trafiği, SSL inspection olmadan tespit edilemez.</p>

<h2>SSL Deep Inspection Nedir?</h2>
<p><strong>SSL Deep Inspection</strong> (tam adıyla SSL/TLS Deep Packet Inspection), FortiGate'in şifreli HTTPS trafiğini "ortada adam" (man-in-the-middle) tekniğiyle şifresini çözdüğü, incelediği ve yeniden şifreleyerek hedefe ilettiği süreçtir.</p>
<p>Bu süreç şu şekilde işler:</p>
<ol>
  <li>İstemci HTTPS isteği gönderir</li>
  <li>FortiGate bağlantıyı keserek sunucuyla kendi adına yeni bir TLS oturumu kurar</li>
  <li>Sunucudan gelen şifreli yanıtı çözer ve içeriği IPS, antivirüs, web filtre gibi UTM motorlarına gönderir</li>
  <li>İçerik temizse yeniden şifreler ve istemciye iletir — istemci bağlantının kesildiğinden haberdar olmaz</li>
</ol>

<h2>SSL Certificate Inspection vs Deep Inspection Farkı</h2>
<table style="width:100%; border-collapse: collapse; margin: 16px 0;">
  <thead>
    <tr style="background:#EE312420;">
      <th style="padding:8px; border:1px solid #EE312430; text-align:left;">Özellik</th>
      <th style="padding:8px; border:1px solid #EE312430; text-align:left;">Certificate Inspection</th>
      <th style="padding:8px; border:1px solid #EE312430; text-align:left;">Deep Inspection</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Trafik şifresi çözülür mü?</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Hayır</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Evet</td></tr>
    <tr><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">İçerik taraması</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Hayır</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Evet (IPS, AV, Web Filter)</td></tr>
    <tr><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Sertifika kontrolü</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Evet</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Evet</td></tr>
    <tr><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">CPU yükü</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Düşük</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Yüksek</td></tr>
    <tr><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Sertifika uyarısı</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">Yok</td><td style="padding:8px; border:1px solid rgba(255,255,255,0.1);">CA sertifikası dağıtılmazsa var</td></tr>
  </tbody>
</table>

<h2>CA Sertifikası: Neden Kritik?</h2>
<p>Deep Inspection'da FortiGate, orijinal sunucu sertifikasını kendi CA sertifikasıyla imzalanmış bir sertifikayla değiştirir. İstemciler bu sertifikaya güvenmezse tarayıcıda güvenlik uyarısı alırlar.</p>
<p><strong>Çözüm:</strong> FortiGate'in CA sertifikasını tüm istemci cihazlara dağıtın:</p>
<ul>
  <li><strong>Domain ortamında:</strong> Group Policy (GPO) ile tüm bilgisayarlara otomatik push</li>
  <li><strong>Mac cihazlarda:</strong> MDM (Mobile Device Management) ile dağıtım</li>
  <li><strong>Mobil cihazlarda:</strong> Kurumsal MDM profili ile yükleme</li>
</ul>

<h3>CA Sertifikasını FortiGate'den İndirme</h3>
<pre><code># GUI: System → Certificates → Local Certificates
# "Fortinet_CA_SSL" sertifikasını export edin
# veya CLI:
execute vpn certificate local export tftp Fortinet_CA_SSL 192.168.1.100</code></pre>

<h2>SSL Inspection Profili Yapılandırması</h2>
<ol>
  <li><strong>Security Profiles → SSL/SSH Inspection</strong>'a gidin</li>
  <li><strong>Create New</strong> veya mevcut "deep-inspection" profilini düzenleyin</li>
  <li><strong>SSL Inspection Method:</strong> "Full SSL Inspection" seçin</li>
  <li><strong>CA Certificate:</strong> Fortinet_CA_SSL seçin</li>
  <li>Profili firewall politikasına ekleyin</li>
</ol>

<h2>SSL Inspection İstisnalar (Exemptions)</h2>
<p>Bazı uygulamalar ve web siteleri SSL inspection ile uyumsuz olabilir veya gizlilik nedeniyle muaf tutulmalıdır:</p>
<ul>
  <li><strong>Bankacılık siteleri:</strong> Sertifika pinning kullandıkları için inspection ile çakışabilir</li>
  <li><strong>Windows Update:</strong> Microsoft altyapısı genellikle muaf tutulur</li>
  <li><strong>HRMS/ERP sistemleri:</strong> Özel sertifika kullanan iç sistemler</li>
  <li><strong>Video konferans:</strong> Zoom, Teams gibi uygulamalar için özel exemption gerekebilir</li>
</ul>
<pre><code>config firewall ssl-ssh-profile
    edit "deep-inspection"
        config ssl-exempt
            edit 1
                set type address
                set address "Banking-Sites"
            next
        end
    next
end</code></pre>

<h2>Performans Etkisi</h2>
<p>SSL Deep Inspection CPU yoğun bir işlemdir. Dikkat edilmesi gerekenler:</p>
<ul>
  <li>NP7 veya NP6 işlemcili modellerde donanım hızlandırma desteği sınırlıdır — CPU'ya yük biner</li>
  <li>Çok sayıda eş zamanlı HTTPS bağlantısı olan ortamlarda throughput düşebilir</li>
  <li>Cihaz boyutlandırmasında SSL inspection throughput değerini (datasheet'teki NGFW throughput değil) referans alın</li>
</ul>

<h2>Hangi Trafik İncelenmeli?</h2>
<p>Tüm HTTPS trafiğini inspect etmek her zaman gerekli veya pratik değildir. Önerilen yaklaşım:</p>
<ul>
  <li>✅ Genel internet çıkışı trafiği — mutlaka inspect edin</li>
  <li>✅ İndirilen dosyalar — antivirüs için kritik</li>
  <li>⚠️ Bankacılık ve finans siteleri — muaf tutun veya certificate inspection kullanın</li>
  <li>❌ İç ağ HTTPS trafiği — genellikle inspect etmeye gerek yok</li>
</ul>

<h2>Sonuç</h2>
<p>SSL Deep Inspection, modern siber güvenliğin vazgeçilmez bir bileşenidir. Şifreli trafik içinde gizlenen tehditleri tespit etmeden IPS, antivirüs ve web filtresi tam anlamıyla işlev göremez. Doğru yapılandırılmış CA sertifika dağıtımı ve istisnalar ile kullanıcı deneyimini bozmadan maksimum güvenlik sağlanabilir. Lider Network olarak SSL Inspection yapılandırması, CA sertifika dağıtımı ve UTM politika optimizasyonunda uzman mühendislerimizle destek sağlıyoruz.</p>
    `,
  },

  {
    slug: "fortigate-yapilandirmasinda-yapilan-10-yaygin-hata",
    title: "FortiGate Yapılandırmasında Yapılan 10 Yaygın Hata ve Çözümleri",
    excerpt:
      "Yıllarca FortiGate kuran mühendislerin bile düştüğü tuzaklar var. Default şifre bırakmaktan yanlış SSL inspection yapılandırmasına, gereksiz açık portlardan log'u kapalı tutmaya kadar en sık yapılan 10 hatayı ve nasıl düzeltileceğini derledi.",
    category: "fortigate-ngfw",
    categoryColor: "#EE3124",
    tags: ["FortiGate", "Yapılandırma Hataları", "Güvenlik", "Best Practices", "Firewall"],
    publishedAt: "2026-05-22",
    readTime: 9,
    content: `
<p>FortiGate güçlü bir platform — ama bu güç, yanlış yapılandırıldığında güvenlik açığına dönüşür. Sahada yüzlerce kurulum yapan mühendislerimizin en sık karşılaştığı 10 hatayı ve çözümlerini derledik.</p>

<h2>Hata 1: Admin Şifresini Default Bırakmak</h2>
<p><strong>Ne oluyor:</strong> Fabrika çıkışında FortiGate'in varsayılan admin şifresi boş veya "admin"dir. Kurulum aceleye gelince şifre değiştirilmeden bırakılır.</p>
<p><strong>Risk:</strong> İnternete açık management portunda brute-force ile dakikalar içinde ele geçirilebilir. Fortinet'in güvenlik raporlarında en yaygın saldırı vektörlerinden biri.</p>
<p><strong>Çözüm:</strong></p>
<pre><code>config system admin
    edit admin
        set password "KompleksB1rSifre!2026"
    next
end</code></pre>
<p>Minimum 12 karakter, büyük/küçük harf + rakam + özel karakter. Tercihen FortiToken ile MFA ekleyin.</p>

<h2>Hata 2: WAN Arayüzünde Administrative Access Açık Bırakmak</h2>
<p><strong>Ne oluyor:</strong> HTTPS, SSH veya ping WAN tarafında açık kalıyor. Yönetim kolaylığı için yapılır ama unutulur.</p>
<p><strong>Risk:</strong> Cihaz internetten erişilebilir hale gelir. Fortinet CVE'leri keşfedildiğinde saldırganlar interneti tarayarak açık management port'larını hedef alır.</p>
<p><strong>Çözüm:</strong> WAN arayüzünde tüm Administrative Access seçeneklerini kapatın. Yönetimi yalnızca iç ağ veya özel management arayüzü üzerinden yapın. Uzaktan yönetim gerekiyorsa VPN üzerinden erişin.</p>

<h2>Hata 3: "Any/Any/Accept" Politikası Oluşturmak</h2>
<p><strong>Ne oluyor:</strong> "Şimdilik açalım, sonra kısıtlarız" düşüncesiyle her şeye izin veren geniş politika oluşturulur. Sonrası gelmez.</p>
<p><strong>Risk:</strong> Firewall'ın tüm değeri yok olur. Zararlı trafik, veri sızıntısı ve lateral movement engellenmez.</p>
<p><strong>Çözüm:</strong> En az ayrıcalık prensibi. Politikalar kaynak IP, hedef IP, port ve uygulama bazında olabildiğince dar tanımlanmalı. "İhtiyaç duyulduğunda aç, her şeyi kapalı bırak" anlayışı.</p>

<h2>Hata 4: Log'u Kapatmak veya Hiç Yapılandırmamak</h2>
<p><strong>Ne oluyor:</strong> Disk dolmasın diye veya performans kaygısıyla log'lama devre dışı bırakılır ya da hiç yapılandırılmaz.</p>
<p><strong>Risk:</strong> Saldırı tespit edilemez. Olay sonrası inceleme (forensics) yapılamaz. Uyumluluk gereksinimleri karşılanamaz.</p>
<p><strong>Çözüm:</strong> En azından kritik politikalarda log'u açın. FortiAnalyzer veya Syslog sunucusuna log gönderin — böylece FortiGate diski dolmaz, loglar kaybolmaz.</p>
<pre><code>config log setting
    set resolve-ip enable
    set log-user-in-upper enable
end

config log fortianalyzer setting
    set status enable
    set server "192.168.1.10"
end</code></pre>

<h2>Hata 5: FortiGuard Lisanslarını Yenilememeк</h2>
<p><strong>Ne oluyor:</strong> IPS, Antivirüs, Web Filter lisansları süresi dolduğunda uyarı çıkar ama atlanır. "Yine de çalışıyor" sanılır.</p>
<p><strong>Risk:</strong> İmzalar güncellenmez. Yeni zararlı yazılımlar ve CVE'ler tespit edilemez. Cihaz var görünür ama gerçek koruma sağlamaz.</p>
<p><strong>Çözüm:</strong> Dashboard'da lisans durumunu düzenli kontrol edin. Fortinet'in otomatik yenileme bildirimleri için e-posta uyarısı kurun. En az 1 yıllık lisans önceden yenileyin.</p>

<h2>Hata 6: SSL Inspection'ı Hiç Aktif Etmemek</h2>
<p><strong>Ne oluyor:</strong> IPS ve antivirüs aktif görünür ama SSL inspection kapalıdır. İnternet trafiğinin %90'ı HTTPS olduğu için UTM motorları aslında kör çalışmaktadır.</p>
<p><strong>Risk:</strong> Şifreli kanal içinde gelen zararlı yazılımlar, ransomware indirmeleri ve veri sızıntıları tespit edilemez.</p>
<p><strong>Çözüm:</strong> SSL Deep Inspection profilini aktif edin, CA sertifikasını GPO ile tüm istemcilere dağıtın ve internet çıkışı politikalarına ekleyin.</p>

<h2>Hata 7: Firmware'i Hiç Güncellememek</h2>
<p><strong>Ne oluyor:</strong> "Çalışan sisteme dokunma" prensibiyle FortiOS yıllarca güncellenmez. Bazı cihazlarda 5-6 yıl önceki firmware görüyoruz.</p>
<p><strong>Risk:</strong> Kritik CVE'ler açıkta kalır. Fortinet, özellikle SSL VPN ve management arayüzünde zaman zaman kritik güvenlik yamaları yayınlar. Güncellenmeyen cihazlar saldırılara açık hedef olur.</p>
<p><strong>Çözüm:</strong> Yılda en az 2 kez firmware güncellemesi planlayın. Kritik güvenlik yamaları (PSIRT advisory) için acil güncelleme yapın. Güncelleme öncesi backup almayı unutmayın.</p>

<h2>Hata 8: HA Kurulumunda Heartbeat'i Tek Hat Üzerinden Geçirmek</h2>
<p><strong>Ne oluyor:</strong> HA cluster kurulur ama heartbeat bağlantısı tek bir kablo veya switch üzerinden sağlanır.</p>
<p><strong>Risk:</strong> O kablo veya switch arızalandığında her iki cihaz da kendini master sanır (split-brain). İki cihaz çakışarak ağ kesintisi yaşanır — HA'nın kendisi sorun kaynağı olur.</p>
<p><strong>Çözüm:</strong> En az iki bağımsız heartbeat bağlantısı kullanın. Tercihen farklı fiziksel yollar üzerinden — doğrudan kablo bağlantısı en güvenilir seçenektir.</p>

<h2>Hata 9: Yedek Almadan Değişiklik Yapmak</h2>
<p><strong>Ne oluyor:</strong> "Küçük bir değişiklik yapacağım" deniyor, backup alınmıyor. Bir hata tüm konfigürasyonu bozuyor.</p>
<p><strong>Risk:</strong> Yanlış bir politika veya rota değişikliği tüm ağın internetten kopmasına yol açabilir. Geri dönmek için saatler harcanabilir.</p>
<p><strong>Çözüm:</strong> Her değişiklik öncesi backup alın:</p>
<pre><code>execute backup full-config tftp 192.168.1.100 backup_20260522.conf</code></pre>
<p>Otomatik zamanlanmış backup için FortiManager kullanın veya script ile düzenli yedekleme yapın.</p>

<h2>Hata 10: Kullanılmayan Politikaları ve Nesneleri Temizlememek</h2>
<p><strong>Ne oluyor:</strong> Yıllar içinde politika listesi şişer. Kullanılmayan adres nesneleri, servis grupları ve politikalar birikir. "Belki lazım olur" diye silinmez.</p>
<p><strong>Risk:</strong> Karmaşık politika tablosu yönetimi zorlaştırır. Gizli bir "allow all" politikası gözden kaçabilir. Performans etkilenebilir.</p>
<p><strong>Çözüm:</strong> Üç ayda bir FortiView Policies ekranına bakın — sıfır oturumlu politikaları tespit edin. Security Rating'deki "unused policies" uyarılarını takip edin. Yıllık politika denetimi alışkanlığı edinin.</p>

<h2>Özet Kontrol Listesi</h2>
<ul>
  <li>☐ Admin şifresi değiştirildi mi?</li>
  <li>☐ WAN'da management access kapalı mı?</li>
  <li>☐ "Any/Any/Accept" politikası yok mu?</li>
  <li>☐ Log'lama aktif ve merkezi log sunucusu var mı?</li>
  <li>☐ FortiGuard lisansları güncel mi?</li>
  <li>☐ SSL Deep Inspection açık mı?</li>
  <li>☐ Firmware güncel mi? (son 6 ay içinde kontrol edildi mi?)</li>
  <li>☐ HA'da çift heartbeat var mı?</li>
  <li>☐ Düzenli backup alınıyor mu?</li>
  <li>☐ Politika temizliği yapıldı mı?</li>
</ul>

<h2>Sonuç</h2>
<p>Bu hataların büyük bölümü tecrübesizlikten değil, zaman baskısı ve "sonra hallederim" ertelemesinden kaynaklanır. Düzenli güvenlik denetimleri bu riskleri minimuma indirir. Lider Network olarak FortiGate güvenlik denetimi, yapılandırma revizyonu ve best-practice uygulamaları konusunda uzman mühendislerimizle yanınızdayız.</p>
    `,
  },

  {
    slug: "kurumsal-ag-guvenliginde-yapilan-7-kritik-hata",
    title: "Kurumsal Ağ Güvenliğinde Yapılan 7 Kritik Hata",
    excerpt:
      "Büyük ölçekli siber saldırıların büyük çoğunluğu sıfır gün açıklarından değil, temel güvenlik hatalarından kaynaklanıyor. Kurumsal ağlarda en sık yapılan 7 hatayı ve bunların nasıl önleneceğini gerçek senaryolarla ele alıyoruz.",
    category: "siber-guvenlik",
    categoryColor: "#EE3124",
    tags: ["Ağ Güvenliği", "Siber Güvenlik", "Best Practices", "Kurumsal", "Güvenlik Hataları"],
    publishedAt: "2026-05-22",
    readTime: 8,
    content: `
<p>Verizon'un yıllık Data Breach raporuna göre büyük siber saldırıların <strong>%82'si insan hatası veya temel güvenlik eksikliği</strong> ile başlıyor. Çığır açan sıfır gün açıkları değil, fark edilmemiş basit hatalar şirketleri çökertir. İşte kurumsal ağlarda en sık karşılaştığımız 7 kritik hata.</p>

<h2>Hata 1: Yaması Yapılmamış Sistemler</h2>
<p><strong>Gerçek senaryo:</strong> 2017'de WannaCry fidye yazılımı, dünyanın dört bir yanındaki şirketleri felç etti. Saldırı, Microsoft'un 2 ay önce yamasını yayınladığı EternalBlue açığını kullanıyordu. Güncellemeyi erteleyen on binlerce sistem çöktü.</p>
<p><strong>Neden yapılmıyor?</strong> "Çalışan sisteme dokunma" kültürü, test ortamı yokluğu, güncellemenin kesinti yaratacağı endişesi.</p>
<p><strong>Çözüm:</strong></p>
<ul>
  <li>Kritik yamalar (CVSS 9.0+) için 72 saat içinde uygulama kuralı koyun</li>
  <li>Patch yönetimi için WSUS, SCCM veya üçüncü taraf araç kullanın</li>
  <li>Test → Staging → Production pipeline'ı oluşturun</li>
  <li>Güncelleme penceresi (maintenance window) takvimini önceden planlayın</li>
</ul>

<h2>Hata 2: Zayıf ve Tekrar Kullanılan Şifreler</h2>
<p><strong>Gerçek senaryo:</strong> Bir şirketin VPN'i ele geçirildi. Saldırgan tek bir çalışanın şifresini (başka bir sitede sızdırılmış) credential stuffing ile denedi. Şifre "Sifre123!" idi ve aynı zamanda kurumsal hesapta da kullanılıyordu.</p>
<p><strong>İstatistik:</strong> HaveIBeenPwned veri tabanında 12 milyardan fazla sızdırılmış şifre bulunuyor. Saldırganlar bu listeleri otomatik deniyor.</p>
<p><strong>Çözüm:</strong></p>
<ul>
  <li>Kurumsal parola politikası: minimum 14 karakter, karmaşıklık zorunlu, 90 günde bir değişim</li>
  <li>Tüm kritik sistemlerde MFA (çok faktörlü kimlik doğrulama) zorunlu kılın</li>
  <li>Parola yöneticisi kullanımını teşvik edin (Bitwarden, 1Password vb.)</li>
  <li>Active Directory'de "Password Spray" saldırısına karşı account lockout politikası uygulayın</li>
</ul>

<h2>Hata 3: Ağ Segmentasyonu Yapmamak</h2>
<p><strong>Gerçek senaryo:</strong> Bir hastane ağında muhasebe bilgisayarı zararlı yazılım kaptı. Ağ düz (flat) yapıda olduğu için zararlı yazılım hasta kayıt sistemlerine, tıbbi cihazlara ve sunuculara yayıldı. Otel Wi-Fi'ına bağlanan misafirler de kurumsal sunuculara erişebiliyordu.</p>
<p><strong>Çözüm:</strong></p>
<ul>
  <li>VLAN segmentasyonu: Sunucular, istemciler, misafirler, IoT cihazları ayrı segmentlerde</li>
  <li>Her segment arası trafik firewall politikasından geçmeli</li>
  <li>Kritik sistemler (ERP, finansal, tıbbi) izole segment veya DMZ'de</li>
  <li>Misafir WiFi kesinlikle kurumsal ağdan ayrı</li>
</ul>

<h2>Hata 4: Aşırı Geniş Erişim Yetkileri</h2>
<p><strong>Gerçek senaryo:</strong> Bir şirkette her çalışan aynı domain admin yetkisine sahipti — "kolaylık olsun diye." Bir çalışanın phishing e-postasına tıklaması tüm domain'in ele geçirilmesiyle sonuçlandı.</p>
<p><strong>İlke:</strong> En Az Ayrıcalık (Least Privilege) — her kullanıcı ve sistem yalnızca işini yapabilmesi için gereken minimum yetkiye sahip olmalı.</p>
<p><strong>Çözüm:</strong></p>
<ul>
  <li>Domain Admin hesabı sayısını minimuma indirin (2-3 kişi, günlük işler için kullanılmasın)</li>
  <li>Günlük işler için standart kullanıcı hesabı, yönetimsel işler için ayrı admin hesabı</li>
  <li>Dosya sunucularında klasör bazlı yetki revizyonu yapın</li>
  <li>Servis hesaplarına minimum yetki, belirli IP kısıtlaması</li>
  <li>PAM (Privileged Access Management) çözümü değerlendirin</li>
</ul>

<h2>Hata 5: Yedek Almak ama Test Etmemek</h2>
<p><strong>Gerçek senaryo:</strong> Bir firma 3 yıldır düzenli yedek alıyordu. Fidye yazılımı saldırısından sonra restore etmeye çalıştılar — yedekler bozuktu. Yedek sistemi kurulmuş ama hiç test edilmemişti.</p>
<p><strong>İstatistik:</strong> Gartner'a göre yedeklerini test etmeyen kurumların %23'ü kurtarma sırasında başarısız oluyor.</p>
<p><strong>Çözüm:</strong></p>
<ul>
  <li>3-2-1 kuralı: 3 kopya, 2 farklı medya, 1 offsite (uzak lokasyon)</li>
  <li>Ayda en az bir kez restore testi yapın</li>
  <li>Yedekler ağdan izole edilmeli — fidye yazılımı yedeklere de bulaşabilir</li>
  <li>RTO (Recovery Time Objective) ve RPO (Recovery Point Objective) hedefleri belirleyin ve test edin</li>
</ul>

<h2>Hata 6: Kullanıcı Güvenlik Farkındalığı Eğitimi Vermemek</h2>
<p><strong>Gerçek senaryo:</strong> Bir şirkete yapılan phishing simülasyonunda çalışanların %67'si sahte giriş sayfasına kullanıcı adı ve şifresini girdi. BT altyapısı mükemmeldi ama insanlar en zayıf halkaydı.</p>
<p><strong>İstatistik:</strong> IBM Security'e göre veri ihlallerinin %95'inde insan hatası faktör olarak yer alıyor.</p>
<p><strong>Çözüm:</strong></p>
<ul>
  <li>Yılda en az 2 kez güvenlik farkındalığı eğitimi</li>
  <li>Phishing simülasyon testleri — tıklayan kullanıcılar otomatik eğitime yönlendirilsin</li>
  <li>Şüpheli e-posta raporlama butonu (Outlook eklentisi)</li>
  <li>CEO fraud / BEC (Business Email Compromise) senaryoları için özel eğitim</li>
</ul>

<h2>Hata 7: Güvenlik Olaylarını İzlememek</h2>
<p><strong>Gerçek senaryo:</strong> Bir şirkette saldırgan ağda <strong>287 gün</strong> boyunca fark edilmeden kaldı. Bu sürede veriyi yavaş yavaş sızdırdı. Log'lar vardı ama kimse bakmıyordu.</p>
<p><strong>İstatistik:</strong> IBM Security'nin 2023 raporuna göre bir veri ihlalinin tespit edilmesi ortalama 204 gün sürüyor.</p>
<p><strong>Çözüm:</strong></p>
<ul>
  <li>Merkezi log yönetimi: FortiAnalyzer, SIEM veya ELK Stack</li>
  <li>Temel alert kuralları: başarısız giriş denemeleri, gece saatlerinde admin erişimi, büyük veri transferleri</li>
  <li>Güvenlik ekibinin log'lara günlük bakma alışkanlığı</li>
  <li>Bütçe varsa MDR (Managed Detection & Response) servisi veya SOC hizmeti</li>
</ul>

<h2>Sonuç: Temel Doğru Yapıldığında %80 Korunulur</h2>
<p>Siber güvenlik karmaşık görünür ama gerçekte büyük saldırıların çoğu temel önlemlerle önlenebilirdi. Yamalar, güçlü şifreler, segmentasyon, en az ayrıcalık, test edilmiş yedek, kullanıcı eğitimi ve izleme — bu 7 temel uygulandığında kurumlar saldırıların büyük bölümüne karşı korunmuş olur. Lider Network olarak kurumsal ağ güvenliği denetimi, sızma testi ve güvenlik politikası tasarımında yanınızdayız.</p>
    `,
  },

  {
    slug: "siber-saldiriya-ugramadan-once-yapilan-5-hata",
    title: "Siber Saldırıya Uğramadan Önce Yapılan 5 Hata — Çoğu Şirket Bunları Biliyor ama Yapmıyor",
    excerpt:
      "Siber saldırıya uğrayan şirketlerin büyük bölümü sonradan şunu söyler: 'Biliyorduk ama yapmadık.' İşte saldırı öncesinde yapılan ve saldırıyı mümkün kılan 5 kritik ihmal.",
    category: "siber-guvenlik",
    categoryColor: "#EE3124",
    tags: ["Siber Saldırı", "Güvenlik İhmali", "Ransomware", "Siber Güvenlik", "IT Güvenliği"],
    publishedAt: "2026-05-22",
    readTime: 6,
    content: `
<p>"Bize olmaz" — siber saldırıya uğrayan şirketlerin büyük çoğunluğunun olaydan önce kurumsal tutumu bu cümleyle özetlenebilir. Ancak saldırı sonrası incelemeler aynı tabloyu ortaya koyuyor: teknik bilgi eksikliği değil, <strong>bilinen risklerin ertelenmiş olması</strong> şirketleri çökertiyor.</p>

<h2>1. "Fidye Yazılımına Karşı Antivirus Yeterlidir" Yanılgısı</h2>
<p><strong>Ne oluyor:</strong> Şirket antivirüs lisansı var, firewall var. IT müdürü "korunuyoruz" diyor. Ancak modern fidye yazılımları (Ransomware-as-a-Service modeli) geleneksel antivirüsü kolayca atlatacak şekilde tasarlanıyor — imzasız, polimorfik, fileless teknikler kullanıyor.</p>
<p><strong>Gerçek:</strong> 2023-2024 Fortinet Threat Intelligence raporuna göre fidye yazılımı saldırılarının <strong>%68'i antivirüs aktif olan sistemlerde</strong> gerçekleşti.</p>
<p><strong>Ne yapılmalı:</strong></p>
<ul>
  <li>EDR (Endpoint Detection & Response) — davranış tabanlı tehdit tespiti</li>
  <li>NDR (Network Detection & Response) — ağ içi anormal hareketi izleme</li>
  <li>Email güvenliği — phishing ve zararlı ek engelleme</li>
  <li>Uygulama beyaz listesi — sadece onaylı yazılımların çalışmasına izin verme</li>
</ul>

<h2>2. IT Personelinin Güvenlik Konusunda Yetkilendirilmemesi</h2>
<p><strong>Ne oluyor:</strong> IT ekibi güvenlik risklerini biliyor, üst yönetime bildiriyor. "Bütçe yok, şimdi değil, daha acil işler var" yanıtını alıyor. Güvenlik yatırımı bir maliyet kalemi olarak görülüp erteleniyor.</p>
<p><strong>Gerçek maliyet karşılaştırması:</strong></p>
<ul>
  <li>Kurumsal güvenlik denetimi: 50.000 - 150.000 TL</li>
  <li>Ortalama fidye yazılımı saldırısı maliyeti (IBM Security 2024): <strong>1.35 milyon USD</strong> — kesinti, kurtarma, itibar kaybı dahil</li>
</ul>
<p><strong>Ne yapılmalı:</strong> Güvenliği "maliyet" değil "sigorta" olarak konumlandırın. Yönetim kuruluna risk bazlı raporlama yapın: "Bu güvenlik açığı kapatılmazsa beklenen kayıp X TL'dir."</p>

<h2>3. Tedarikçi ve Üçüncü Taraf Erişimini Denetlememek</h2>
<p><strong>Gerçek senaryo:</strong> 2020'deki SolarWinds saldırısı, doğrudan hedefleri değil tedarik zincirini vurdu. Yazılım güncellemesine yerleştirilen zararlı kod, 18.000 kurumun sistemine bulaştı — aralarında ABD hükümeti kurumları da vardı.</p>
<p><strong>Küçük ölçekte benzer senaryo:</strong> Teknik servis firmanız uzaktan erişim için TeamViewer veya AnyDesk kullanıyor. O firmanın sistemleri ele geçirilirse sizin ağınıza da giriş sağlanır.</p>
<p><strong>Ne yapılmalı:</strong></p>
<ul>
  <li>Tedarikçilere sadece ihtiyaç duydukları sistemlere, ihtiyaç duydukları süre kadar erişim verin</li>
  <li>Uzaktan erişimleri loglayin ve kayıt altına alın</li>
  <li>Tedarikçi erişimleri için ayrı, izole ağ segmenti</li>
  <li>Kritik tedarikçilerden yıllık güvenlik sertifikasyonu isteyin</li>
</ul>

<h2>4. Olay Müdahale Planı Hazırlamamak</h2>
<p><strong>Ne oluyor:</strong> Saldırı gerçekleşiyor. Ağ kapatılsın mı? Sistemi izole mi edelim? Yedekten mi dönsek? Polisi mi arasak? Müşterilere ne söyleyelim? Sigorta şirketini kim arayacak? Hiç düşünülmemiş, hiç pratik yapılmamış.</p>
<p><strong>Panik kararları maliyeti ikiye katlar.</strong> Yanlış karar (ağı kapatmadan önce yedeğe bakmamak, fidyeyi ödemeden sistemi silmek) kurtarılabilir durumu kurtarılamaz hale getirebilir.</p>
<p><strong>Ne yapılmalı:</strong> Incident Response (IR) Planı hazırlayın:</p>
<ul>
  <li>Olay tespiti → kim bilgilendirilecek, kim karar verecek?</li>
  <li>İzolasyon prosedürü — hangi sistem nasıl izole edilir?</li>
  <li>İletişim planı — çalışanlara, müşterilere, basına ne söylenecek?</li>
  <li>Yasal yükümlülükler — KVKK bildirimi (72 saat), sigorta bildirimi</li>
  <li>Yılda en az bir kez masa başı tatbikat (tabletop exercise) yapın</li>
</ul>

<h2>5. Güvenliği Proje Olarak Değil Süreç Olarak Yönetmemek</h2>
<p><strong>Ne oluyor:</strong> Firewall alındı, kuruldu, "güvenlik tamam" dendi. 3 yıl sonra hiç dokunulmadı. Tehdit ortamı değişti, altyapı büyüdü, eski çalışanların hesapları hâlâ aktif, firmware güncellenmedi, politikalar gözden geçirilmedi.</p>
<p><strong>Gerçek:</strong> Siber güvenlik bir ürün değil, süregelen bir süreçtir. Bir kez yapılıp biten bir proje değildir.</p>
<p><strong>Ne yapılmalı:</strong></p>
<ul>
  <li><strong>Aylık:</strong> Log gözden geçirme, hesap envanteri, patch durumu kontrolü</li>
  <li><strong>Üç aylık:</strong> Politika revizyonu, kullanılmayan hesapları kapatma, firewall kural temizliği</li>
  <li><strong>Yıllık:</strong> Sızma testi, güvenlik denetimi, IR planı tatbikatı, yetki matrisi revizyonu</li>
  <li><strong>Sürekli:</strong> Tehdit istihbaratı takibi, güvenlik haberleri, vendor advisory'leri</li>
</ul>

<h2>Son Söz</h2>
<p>Bu 5 hatanın ortak paydası ertelemedir. "Sonra yaparız" denen her güvenlik önlemi, saldırganlar için açık kapı bırakır. Siber güvenlik yatırımının geri dönüşü, hiçbir saldırı yaşanmadığında "görünmez" kalır — ta ki bir saldırı olana kadar. Lider Network olarak kurumsal güvenlik denetimi, zafiyet tespiti ve proaktif güvenlik danışmanlığı hizmetlerimizle yanınızdayız.</p>
    `,
  },

  {
    slug: "fortios-7412-surum-notlari-guncelleme-rehberi",
    title: "FortiOS 7.4.12 Sürüm Notları: Güvenlik Yamaları ve Dikkat Edilmesi Gerekenler",
    excerpt:
      "Fortinet, 7.4.x bakım dalında 7.4.12 sürümünü yayınladı. Kritik güvenlik yamaları, hata düzeltmeleri ve yükseltme öncesinde mutlaka dikkat edilmesi gereken noktaları adım adım inceliyoruz.",
    category: "fortigate-ngfw",
    categoryColor: "#EE3124",
    tags: ["FortiGate", "FortiOS 7.4.12", "Güvenlik Yaması", "CVE", "Firmware Güncelleme"],
    publishedAt: "2026-05-25",
    readTime: 9,
    featured: false,
    content: `
<h2>FortiOS 7.4.12 Nedir?</h2>
<p>FortiOS 7.4.12, Fortinet'in uzun vadeli bakım (maintenance) dalı olan <strong>7.4.x serisinin</strong> en güncel sürümüdür. 7.6 Feature Branch'ın aksine 7.4 serisi yeni özellik eklememekte; bunun yerine <strong>güvenlik yamaları, kararlılık iyileştirmeleri ve kritik hata düzeltmeleri</strong> ile odak noktasını üretim ortamlarının güvenliğine ve sürekliliğine bırakmaktadır.</p>
<p>Kurumsal ortamlarda <strong>"Eğer çalışıyorsa dokunma"</strong> prensibiyle çalışan FortiGate yöneticileri için bu güncelleme, özellikle önemli CVE düzeltmeleri ve SSL VPN stabilite iyileştirmeleri içerdiğinden mutlaka değerlendirilmelidir.</p>

<div style="background:rgba(238,49,36,0.07);border:1px solid rgba(238,49,36,0.25);border-radius:12px;padding:18px 22px;margin:24px 0;">
  <strong style="color:#EE3124;">⚠️ Önemli Hatırlatma</strong><br/>
  Yükseltme öncesinde mutlaka güncel Fortinet Release Notes ve PSIRT Advisory belgelerini resmi <a href="https://support.fortinet.com" target="_blank" rel="noopener noreferrer" style="color:#EE3124;">support.fortinet.com</a> adresinden kontrol edin. Bu makale genel rehberlik amacıyla hazırlanmıştır.
</div>

<h2>7.4.x Dalını Kimler Kullanmalı?</h2>
<p>7.4.x bakım dalı, <strong>üretim ortamında kararlılığı ön planda tutan</strong> kurumlar için tercih edilen güncelleme kanalıdır. Yeni özellik gerektirmeyen ve sistemi çalışır halde tutmayı öncelikleyen yapılar için idealdir.</p>

<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:0.92em;">
  <thead>
    <tr style="background:rgba(238,49,36,0.1);">
      <th style="padding:10px 14px;text-align:left;border:1px solid rgba(255,255,255,0.1);">Dal</th>
      <th style="padding:10px 14px;text-align:left;border:1px solid rgba(255,255,255,0.1);">Amaç</th>
      <th style="padding:10px 14px;text-align:left;border:1px solid rgba(255,255,255,0.1);">Tavsiye Edilen Kullanım</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:9px 14px;border:1px solid rgba(255,255,255,0.08);"><strong>7.4.x</strong></td>
      <td style="padding:9px 14px;border:1px solid rgba(255,255,255,0.08);">Bakım (Maintenance)</td>
      <td style="padding:9px 14px;border:1px solid rgba(255,255,255,0.08);">Üretim — güvenlik odaklı, kararlı</td>
    </tr>
    <tr style="background:rgba(255,255,255,0.02);">
      <td style="padding:9px 14px;border:1px solid rgba(255,255,255,0.08);"><strong>7.6.x</strong></td>
      <td style="padding:9px 14px;border:1px solid rgba(255,255,255,0.08);">Özellik (Feature)</td>
      <td style="padding:9px 14px;border:1px solid rgba(255,255,255,0.08);">Yeni özellik gerektiren ortamlar</td>
    </tr>
  </tbody>
</table>

<h2>7.4.12'de Öne Çıkan Güvenlik Düzeltmeleri</h2>
<p>Her bakım sürümünün kalbi güvenlik yamalarıdır. 7.4.12 sürümü aşağıdaki kategorilerde kritik düzeltmeler içermektedir:</p>

<h3>SSL VPN — Süregelen Odak Noktası</h3>
<p>Fortinet, son iki yılda SSL VPN bileşeninde birden fazla kritik zafiyet yayımladı (CVE-2023-27997, CVE-2024-21762 vb.). 7.4.12 bu bileşende yeni bulunan bellek yönetimi ve kimlik doğrulama bypass zafiyetlerini kapatmaktadır. SSL VPN kullanan tüm kurumların bu güncellemeyi <strong>aciliyet derecesine</strong> göre değerlendirmesi gerekir:</p>
<ul>
  <li>İnternete açık SSL VPN portali olan cihazlar → <strong>Yüksek öncelikli güncelleme</strong></li>
  <li>Yalnızca IPsec VPN kullanan cihazlar → Planlanmış bakım penceresinde güncellenebilir</li>
  <li>SSL VPN devre dışı olan cihazlar → Normal güncelleme takvimi yeterli</li>
</ul>

<h3>HTTP/HTTPS Yönetim Arayüzü</h3>
<p>Web GUI üzerinden erişilebilecek belirli güvenlik açıkları 7.4.12 ile kapatılmıştır. Bu durum özellikle yönetim arayüzünü internete açmış olan kurumlar için kritiktir. <strong>Yönetim arayüzü asla internete açılmamalıdır</strong> — ancak açık olan yapılar varsa derhal güncelleme yapılmalıdır.</p>

<h3>FortiGuard Servisleri Entegrasyonu</h3>
<p>FortiGuard Web Filtering, IPS ve Antivirus imza güncelleme kanallarında yaşanan bağlantı tutarsızlıkları giderilmiştir. Özellikle lisans sunucularıyla zaman zaman kopukluk yaşayan cihazlarda bu düzeltme fark yaratacaktır.</p>

<h3>IPsec VPN Stabilite İyileştirmeleri</h3>
<p>Yüksek oturumlu IPsec VPN ortamlarında, özellikle <strong>IKEv2 ile birden fazla tünel</strong> açık olduğunda yaşanan oturum düşme sorunları 7.4.12 ile giderilmiştir. Dial-up VPN ve Site-to-Site tünellerde IKE SA rekey sırasında yaşanan kesintiler azaltılmıştır.</p>

<h2>Önemli Hata Düzeltmeleri</h2>

<h3>HA (High Availability) Cluster</h3>
<ul>
  <li>Active-Passive cluster'da belirli trafik yoğunluklarında yaşanan heartbeat kaybı sorunu düzeltildi</li>
  <li>Failover sonrası secondary ünitenin primary rolüne geçişinde gecikme azaltıldı</li>
  <li>HA senkronizasyon sırasında session table tutarsızlığına yol açan race condition giderildi</li>
</ul>

<h3>SD-WAN</h3>
<ul>
  <li>SLA link monitoring'in, pasif WAN hatlarını yanlışlıkla "up" olarak değerlendirdiği hata düzeltildi</li>
  <li>Performance SLA probe paketlerinin belirli durumlarda çoğaltılması sorunu giderildi</li>
  <li>SD-WAN rule override'larının policy yeniden yüklenmesinde sıfırlanması hatası düzeltildi</li>
</ul>

<h3>GUI / Dashboard</h3>
<ul>
  <li>FortiView "Sources" sekmesinin yoğun oturum sayısında donduğu durum çözüldü</li>
  <li>Büyük policy tablolarında sayfalama hatası giderildi</li>
  <li>Certificate yönetim ekranında expired sertifikaların listelenmeme sorunu düzeltildi</li>
</ul>

<h3>DHCP Sunucu</h3>
<ul>
  <li>DHCP lease database'inin sürekli büyüyerek bellek tükettiği hafıza sızıntısı (memory leak) giderildi</li>
  <li>VLAN arayüzlerinde DHCP relay loopback durumu düzeltildi</li>
</ul>

<h2>Yükseltme Öncesi Dikkat Edilmesi Gerekenler</h2>

<div style="background:rgba(245,158,11,0.07);border:1px solid rgba(245,158,11,0.25);border-radius:12px;padding:18px 22px;margin:24px 0;">
  <strong style="color:#f59e0b;">📋 Yükseltme Kontrol Listesi</strong>
</div>

<h3>1. Desteklenen Yükseltme Yolunu Doğrulayın</h3>
<p>Fortinet, doğrudan yükseltme yapılabilecek sürümler için <strong>Upgrade Path Tool</strong> sunar. Her sürüm her sürümden doğrudan yükseltilemez. Özellikle:</p>
<ul>
  <li><strong>7.2.x → 7.4.12:</strong> Doğrudan destekleniyor (7.2.5+ önerilir)</li>
  <li><strong>7.0.x → 7.4.12:</strong> Ara sürüm gerekebilir — Upgrade Path Tool kontrol edin</li>
  <li><strong>6.4.x → 7.4.12:</strong> Kesinlikle ara sürüm üzerinden geçilmeli</li>
</ul>
<p>Resmi araç: <strong>support.fortinet.com → Product Life Cycle → Upgrade Path Tool</strong></p>

<h3>2. Konfigürasyon Yedeği Alın</h3>
<p>Yükseltme öncesi mutlaka tam konfigürasyon yedeği alınmalıdır:</p>
<pre style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:14px;overflow-x:auto;font-size:0.85em;"><code># CLI üzerinden yedek alma
execute backup config ftp &lt;dosya_adı&gt; &lt;ftp_ip&gt;

# TFTP ile yedek alma
execute backup config tftp &lt;dosya_adı&gt; &lt;tftp_ip&gt;

# Ayrıca GUI → Dashboard → System Information → Backup Config</code></pre>

<h3>3. HA Ortamında Sıralı Yükseltme</h3>
<p>HA cluster'da yükseltme yaparken dikkat:</p>
<ul>
  <li>Önce <strong>Secondary (Slave)</strong> üniteyi yükseltin</li>
  <li>Secondary yükseltme tamamlanıp tekrar senkronize olduğundan emin olun</li>
  <li>Ardından <strong>Primary (Master)</strong> üniteyi yükseltin — bu aşamada kısa failover yaşanır</li>
  <li>FortiManager kullanıyorsanız: FortiManager → FortiGate yükseltmesini destekleyen versiyonda olduğundan emin olun</li>
</ul>

<h3>4. SSL VPN Kullanıcılarını Bilgilendirin</h3>
<p>Yükseltme sırasında SSL VPN oturumları kesilecektir. Bakım penceresini mesai dışı saatlere alın ve kullanıcıları önceden bilgilendirin. Yükseltme sonrası FortiClient versiyonunun 7.4.x ile uyumlu olduğunu doğrulayın.</p>

<h3>5. VDOM Yapılandırması Kontrolü</h3>
<p>VDOM kullanan ortamlarda her VDOM'un politikaları ve route tablolarının yükseltme sonrası değişmediğini ayrı ayrı kontrol edin. Özellikle inter-VDOM link yapılandırmalarında davranış değişikliği yaşanabilir.</p>

<h3>6. Lisans Durumunu Kontrol Edin</h3>
<p>Yükseltme sonrası FortiGuard servislerinin aktif göründüğünü doğrulayın:</p>
<pre style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:14px;overflow-x:auto;font-size:0.85em;"><code>get system fortiguard-service status
diagnose autoupdate status</code></pre>

<h2>Bilinen Kısıtlamalar ve Geçici Çözümler</h2>
<p>7.4.12 sürümünde bazı bilinen davranışlar mevcuttur:</p>
<ul>
  <li><strong>FortiToken Mobile 2FA:</strong> Belirli iOS sürümlerinde push bildirimi gecikmesi yaşanabilir. Geçici çözüm: TOTP modu kullanımı</li>
  <li><strong>BGP Graceful Restart:</strong> 4-baytlık ASN kullanan ortamlarda graceful restart timer davranışı tutarsız olabilir — log takibi önerilir</li>
  <li><strong>Web Filter Override:</strong> LDAP group bazlı override kuralları yükseltme sonrası yeniden uygulanmalıdır</li>
</ul>

<h2>Yükseltme Sonrası Doğrulama Adımları</h2>
<p>Yükseltme tamamlandıktan sonra şu kontrolleri mutlaka gerçekleştirin:</p>

<pre style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:14px;overflow-x:auto;font-size:0.85em;"><code># Versiyon ve build doğrulama
get system status

# HA senkronizasyon kontrolü
get system ha status

# Interface durumu
get system interface physical

# Routing tablosu bütünlüğü
get router info routing-table all

# FortiGuard bağlantısı
execute ping guard.fortinet.net

# IPsec tünel durumu
get vpn ipsec tunnel summary

# SSL VPN durumu
get vpn ssl monitor</code></pre>

<h2>7.4.12'ye Geçmeli miyim, Yoksa 7.6.x'e mi?</h2>
<p>Bu sorunun cevabı kurumun ihtiyacına göre değişir:</p>

<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:0.92em;">
  <thead>
    <tr style="background:rgba(238,49,36,0.1);">
      <th style="padding:10px 14px;text-align:left;border:1px solid rgba(255,255,255,0.1);">Durum</th>
      <th style="padding:10px 14px;text-align:left;border:1px solid rgba(255,255,255,0.1);">Öneri</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:9px 14px;border:1px solid rgba(255,255,255,0.08);">7.4.x kullanıyorum, kararlılık önceliğim</td>
      <td style="padding:9px 14px;border:1px solid rgba(255,255,255,0.08);"><strong>7.4.12'ye geç</strong></td>
    </tr>
    <tr style="background:rgba(255,255,255,0.02);">
      <td style="padding:9px 14px;border:1px solid rgba(255,255,255,0.08);">7.4.x kullanıyorum, ZTNA/AI/yeni özellik istiyorum</td>
      <td style="padding:9px 14px;border:1px solid rgba(255,255,255,0.08);">Test sonrası <strong>7.6.x'e planla</strong></td>
    </tr>
    <tr>
      <td style="padding:9px 14px;border:1px solid rgba(255,255,255,0.08);">7.2.x veya daha eski kullanıyorum</td>
      <td style="padding:9px 14px;border:1px solid rgba(255,255,255,0.08);"><strong>7.4.12 ara geçiş</strong> sonra 7.6'yı değerlendir</td>
    </tr>
    <tr style="background:rgba(255,255,255,0.02);">
      <td style="padding:9px 14px;border:1px solid rgba(255,255,255,0.08);">7.6.x kullanıyorum</td>
      <td style="padding:9px 14px;border:1px solid rgba(255,255,255,0.08);">7.6 dalındaki son sürümü takip et</td>
    </tr>
  </tbody>
</table>

<h2>Sonuç</h2>
<p>FortiOS 7.4.12, özellikle <strong>SSL VPN güvenlik yamaları ve HA kararlılık iyileştirmeleri</strong> nedeniyle üretim ortamları için önemli bir güncelleme niteliği taşımaktadır. "Sonra yaparız" mantığıyla ertelenen firmware güncellemeleri, bugün yamalanan zafiyetlerin yarın exploit edilmesi anlamına gelir.</p>
<p>Yükseltme planlaması, yedek alma, HA sıralama ve doğrulama adımlarını eksiksiz uygulayarak bu güncellemeyi güvenli şekilde gerçekleştirebilirsiniz. Lider Network olarak FortiGate firmware yükseltme planlaması ve uygulamasında uzman mühendislerimizle destek sunuyoruz.</p>
    `,
  },

  {
    slug: "fortigate-ilk-kurulum-adim-adim-baslangic-rehberi",
    title: "FortiGate İlk Kurulum: Sıfırdan Adım Adım Başlangıç Rehberi",
    excerpt:
      "Yeni bir FortiGate cihazını kutudan çıkardıktan sonra ilk erişim, temel ağ yapılandırması, internet politikası, yönetim güvenliği ve yedekleme adımlarını sırasıyla ele alıyoruz.",
    category: "fortigate-ngfw",
    categoryColor: "#EE3124",
    tags: ["FortiGate", "Kurulum", "FortiOS", "İlk Yapılandırma", "NGFW"],
    publishedAt: "2026-06-02",
    readTime: 7,
    content: `
<h2>İlk Erişim ve Hazırlık</h2>
<p>Yeni bir FortiGate cihazı fabrika ayarlarında, varsayılan olarak <strong>192.168.1.99</strong> IP adresi ve <code>port1</code> (veya MGMT) arayüzü üzerinden yönetilir. Bilgisayarınıza aynı ağ bloğundan statik bir IP verip tarayıcıdan <strong>https://192.168.1.99</strong> adresine bağlanarak başlayabilirsiniz. İlk girişte kullanıcı adı <code>admin</code>, şifre boştur ve sistem sizi hemen güçlü bir parola belirlemeye zorlar.</p>

<h2>Temel Ağ Yapılandırması (WAN ve LAN)</h2>
<p>İlk yapılması gereken, internet (WAN) ve iç ağ (LAN) arayüzlerini doğru tanımlamaktır:</p>
<ul>
  <li><strong>WAN arayüzü:</strong> İnternet servis sağlayıcınızdan gelen bağlantıyı statik IP, DHCP veya PPPoE moduna göre yapılandırın.</li>
  <li><strong>LAN arayüzü:</strong> İç ağınız için bir IP bloğu (örn. 10.0.0.1/24) atayın ve gerekiyorsa DHCP sunucusunu etkinleştirin.</li>
  <li><strong>Rol tanımı:</strong> Her arayüze "WAN" veya "LAN" rolü atamak, sonraki yapılandırmaları sadeleştirir.</li>
</ul>

<h2>İnternet Erişimi için İlk Firewall Politikası</h2>
<p>FortiGate'te hiçbir trafik, açık bir politika olmadan geçmez. İç ağın internete çıkabilmesi için LAN'dan WAN'a yönlü bir <strong>firewall policy</strong> oluşturmanız ve bu politikada <strong>NAT</strong> seçeneğini etkinleştirmeniz gerekir. Bu aşamada güvenlik profillerini (antivirüs, web filter) da politikaya bağlayarak korumayı ilk günden devreye alabilirsiniz.</p>

<h2>DNS, Zaman ve Yönetim Güvenliği</h2>
<p>Doğru çalışan bir güvenlik duvarı için <strong>DNS sunucuları</strong> ve <strong>NTP zaman senkronizasyonu</strong> kritik öneme sahiptir; loglarda tutarlı zaman damgası ve FortiGuard hizmetlerinin sağlıklı çalışması buna bağlıdır. Yönetim güvenliği için ise:</p>
<ul>
  <li>HTTP ve Telnet gibi şifrelenmemiş protokolleri kapatın, yalnızca HTTPS ve SSH bırakın.</li>
  <li>Yönetim erişimini belirli IP adresleriyle sınırlayın (trusted hosts).</li>
  <li>Yönetici hesaplarına iki faktörlü doğrulama (FortiToken) ekleyin.</li>
</ul>

<h2>Firmware, Lisans ve Yedek</h2>
<p>Kuruluma başlamadan önce cihazı FortiCare hesabınıza kaydedin, lisanslarınızı (FortiGuard, destek) etkinleştirin ve <strong>kararlı bir FortiOS sürümüne</strong> güncelleyin. Yapılandırma tamamlandığında mutlaka <strong>konfigürasyon yedeği</strong> alın; bu yedek, olası bir donanım değişiminde veya hatalı değişiklikte sizi saatlerce iş kaybından kurtarır.</p>

<h2>Sonuç</h2>
<p>FortiGate ilk kurulumu, doğru sırayla yapıldığında hem hızlı hem güvenli ilerler: erişim, arayüzler, politika, DNS/zaman, yönetim güvenliği ve yedek. Bu temel doğru atıldığında SD-WAN, VPN ve gelişmiş güvenlik profilleri çok daha sağlam bir zemine oturur.</p>
<p>Lider Network olarak FortiGate kurulumu, yapılandırması ve devreye alma projelerinde uzman mühendislerimizle yanınızdayız.</p>
    `,
  },

  {
    slug: "fortigate-web-filtreleme-web-filter-yapilandirma",
    title: "FortiGate Web Filtreleme (Web Filter) Yapılandırma Rehberi",
    excerpt:
      "FortiGate Web Filter ile kategori bazlı içerik engelleme, FortiGuard kategorileri, profil oluşturma, URL filtreleri ve SSL denetimiyle ilişkisini adım adım açıklıyoruz.",
    category: "fortigate-ngfw",
    categoryColor: "#EE3124",
    tags: ["FortiGate", "Web Filter", "FortiGuard", "İçerik Filtreleme", "URL Filtering"],
    publishedAt: "2026-06-03",
    readTime: 6,
    content: `
<h2>Web Filter Nedir?</h2>
<p>FortiGate Web Filter, kullanıcıların eriştiği web sitelerini <strong>kategori, itibar ve URL</strong> bazında denetleyen bir güvenlik özelliğidir. Hem zararlı/oltalama sitelerini engelleyerek güvenlik sağlar hem de iş dışı içeriklere (kumar, sosyal medya, video akışı) erişimi kurum politikanıza göre sınırlandırır.</p>

<h2>FortiGuard Kategorileri</h2>
<p>FortiGate, milyonlarca web sitesini gerçek zamanlı güncellenen <strong>FortiGuard</strong> veri tabanı üzerinden onlarca kategoriye ayırır: kötü amaçlı yazılım, oltalama, yetişkin içerik, sosyal ağlar, oyun, akış medya ve daha fazlası. Her kategoriye ayrı bir aksiyon atayabilirsiniz:</p>
<ul>
  <li><strong>Allow (İzin Ver):</strong> Trafiğe izin verilir.</li>
  <li><strong>Block (Engelle):</strong> Sayfa engellenir, kullanıcıya uyarı gösterilir.</li>
  <li><strong>Warning (Uyar):</strong> Kullanıcı uyarılır ama devam edebilir.</li>
  <li><strong>Monitor (İzle):</strong> Erişime izin verilir ancak loglanır.</li>
</ul>

<h2>Web Filter Profili Oluşturma</h2>
<p>Yapılandırma, <strong>Security Profiles &gt; Web Filter</strong> menüsünden yeni bir profil oluşturmakla başlar. Profilde kategori aksiyonlarını belirledikten sonra bu profili ilgili <strong>firewall politikasına</strong> bağlarsınız. Profil politikaya bağlanmadan filtreleme çalışmaz; bu, en sık yapılan hatalardan biridir.</p>

<h2>URL Filtreleri ve İstisnalar</h2>
<p>Kategori bazlı kontrolün yanında, belirli adresler için <strong>statik URL filtreleri</strong> tanımlayabilirsiniz. Örneğin bir kategori engelliyken kuruma ait bir SaaS uygulamasını beyaz listeye (allow) alabilir veya tek tek zararlı adresleri kara listeye ekleyebilirsiniz. Wildcard ve regex desteği esnek kurallar yazmanızı sağlar.</p>

<h2>SSL Denetimi ile İlişkisi</h2>
<p>Günümüzde trafiğin büyük çoğunluğu HTTPS üzerinden şifrelidir. Web Filter'ın şifreli trafikte tam etkili olabilmesi için <strong>SSL/TLS inspection</strong> profilinin de politikaya uygulanması gerekir. Aksi halde FortiGate yalnızca sertifika üzerindeki alan adına bakabilir, sayfa içeriğini göremez.</p>

<h2>Sonuç</h2>
<p>Web Filter, kurumsal ağda hem güvenlik hem verimlilik için en hızlı kazanç sağlayan profillerden biridir. Doğru kategori politikası, akıllı istisnalar ve SSL denetimiyle birleştiğinde, hem tehditleri hem de iş dışı trafiği etkili biçimde yönetebilirsiniz.</p>
<p>Lider Network olarak FortiGate güvenlik profili tasarımı ve içerik filtreleme politikalarında uzman mühendislerimizle yanınızdayız.</p>
    `,
  },

  {
    slug: "fortigate-application-control-uygulama-kontrolu",
    title: "FortiGate Application Control: Uygulama Bazlı Trafik Kontrolü",
    excerpt:
      "Port ve protokol yetersiz kaldığında devreye giren Application Control ile uygulamaları tanıyıp yönetmeyi, shadow IT'yi kontrol altına almayı ve örnek senaryoları inceliyoruz.",
    category: "fortigate-ngfw",
    categoryColor: "#EE3124",
    tags: ["FortiGate", "Application Control", "Shadow IT", "NGFW", "Trafik Yönetimi"],
    publishedAt: "2026-06-04",
    readTime: 6,
    content: `
<h2>Application Control Neden Gerekli?</h2>
<p>Geleneksel güvenlik duvarları trafiği yalnızca <strong>port ve protokol</strong> üzerinden tanır. Ancak bugün birçok uygulama 443 (HTTPS) portunu kullanır; yani sadece porta bakarak YouTube ile bir bankacılık uygulamasını ayırt edemezsiniz. FortiGate <strong>Application Control</strong>, derin paket incelemesiyle trafiğin hangi uygulamaya ait olduğunu tanıyarak bu boşluğu kapatır.</p>

<h2>Shadow IT ile Mücadele</h2>
<p>Kullanıcıların IT onayı olmadan kullandığı bulut depolama, mesajlaşma veya uzak masaüstü araçları (shadow IT), ciddi bir veri sızıntısı riskidir. Application Control ile bu uygulamaları <strong>görünür kılar, sınırlandırır veya tamamen engellersiniz</strong> — üstelik kullanıcıların portları değiştirerek atlatmasına izin vermeden.</p>

<h2>Application Control Profili Oluşturma</h2>
<p>Yapılandırma <strong>Security Profiles &gt; Application Control</strong> menüsünden yapılır. Uygulamaları kategori (oyun, P2P, proxy, bulut depolama) veya tek tek uygulama bazında ele alabilirsiniz. Her biri için aksiyon tanımlarsınız:</p>
<ul>
  <li><strong>Allow / Block:</strong> İzin ver veya engelle.</li>
  <li><strong>Monitor:</strong> Engellemeden yalnızca logla — politikayı sıkılaştırmadan önce trafiği gözlemlemek için idealdir.</li>
  <li><strong>Quarantine:</strong> İhlal eden kaynağı geçici olarak karantinaya al.</li>
</ul>

<h2>Derin İnceleme ve Bant Genişliği Yönetimi</h2>
<p>Şifreli uygulamaların tam olarak tanınması için <strong>SSL inspection</strong> önerilir. Ayrıca Application Control'ü <strong>traffic shaping</strong> ile birleştirerek kritik olmayan uygulamalara (akış medya gibi) bant genişliği limiti koyabilir, iş kritik uygulamalara öncelik verebilirsiniz.</p>

<h2>Örnek Senaryo</h2>
<p>Tipik bir kurumsal politika şöyle olabilir: P2P ve anonim proxy uygulamaları <em>engellenir</em>, onaysız bulut depolama <em>izlenir</em>, video akışı <em>bant genişliği ile sınırlandırılır</em> ve iş uygulamaları <em>önceliklendirilir</em>. Bu yaklaşım hem güvenliği hem ağ performansını birlikte iyileştirir.</p>

<h2>Sonuç</h2>
<p>Application Control, "yeni nesil" güvenlik duvarını gerçekten yeni nesil yapan temel bileşenlerden biridir. Uygulama görünürlüğü olmadan ne tam güvenlik ne de verimli bant genişliği yönetimi mümkündür.</p>
<p>Lider Network olarak FortiGate uygulama kontrolü ve trafik önceliklendirme politikalarının tasarımında uzman mühendislerimizle yanınızdayız.</p>
    `,
  },

  {
    slug: "fortigate-ips-antivirus-profilleri-tehdit-korumasi",
    title: "FortiGate IPS ve Antivirüs Profilleri ile Tehdit Koruması",
    excerpt:
      "FortiGate'in iki temel tehdit koruma katmanı olan IPS ve Antivirüs profillerini, çalışma mantıklarını, inline/flow tarama modlarını ve doğru yapılandırma adımlarını ele alıyoruz.",
    category: "fortigate-ngfw",
    categoryColor: "#EE3124",
    tags: ["FortiGate", "IPS", "Antivirus", "FortiGuard", "Tehdit Koruması"],
    publishedAt: "2026-06-05",
    readTime: 7,
    content: `
<h2>İki Katmanlı Tehdit Koruması</h2>
<p>FortiGate'in güvenlik gücünün merkezinde, FortiGuard istihbaratıyla beslenen iki profil bulunur: <strong>Intrusion Prevention System (IPS)</strong> ve <strong>Antivirüs (AV)</strong>. IPS, ağ üzerindeki saldırı girişimlerini ve istismar (exploit) denemelerini durdururken; Antivirüs, dosya transferleri içindeki zararlı yazılımları tespit eder. İkisi birlikte çalıştığında çok katmanlı bir savunma oluşur.</p>

<h2>IPS Nasıl Çalışır?</h2>
<p>IPS, ağ trafiğini bilinen saldırı <strong>imzalarıyla</strong> karşılaştırır ve bir zafiyetin istismar edilmeye çalışıldığını anlık olarak tespit edip engeller. FortiGuard, yeni keşfedilen zafiyetler için imzaları sürekli günceller; bu yüzden geçerli bir IPS lisansı ve düzenli imza güncellemesi kritik öneme sahiptir.</p>
<ul>
  <li><strong>İmza tabanlı tespit:</strong> Bilinen exploit ve saldırı kalıplarını yakalar.</li>
  <li><strong>Protokol anomalisi:</strong> Standart dışı, şüpheli protokol davranışlarını işaretler.</li>
  <li><strong>Hız bazlı koruma:</strong> Tarama ve flood türü saldırıları eşik değerlerle sınırlar.</li>
</ul>

<h2>Antivirüs Tarama Modları</h2>
<p>FortiGate Antivirüs, dosyaları iki temel modda tarar:</p>
<ul>
  <li><strong>Flow-based (akış tabanlı):</strong> Düşük gecikme ve yüksek performans önceliklidir; trafik akarken tarar.</li>
  <li><strong>Proxy-based:</strong> Dosyayı tam alıp tarar; daha derin inceleme sunar, sandbox (FortiSandbox) entegrasyonuyla bilinmeyen tehditleri de yakalayabilir.</li>
</ul>

<h2>Profil Oluşturma ve Politikaya Bağlama</h2>
<p>IPS ve Antivirüs profilleri <strong>Security Profiles</strong> menüsünden oluşturulur ve tıpkı diğer profiller gibi bir <strong>firewall politikasına</strong> bağlanır. Profil politikaya uygulanmadığı sürece koruma devreye girmez. En yaygın hata, profilin oluşturulup politikaya eklenmeyi unutulmasıdır.</p>

<h2>Şifreli Trafikte Derin Tarama</h2>
<p>Zararlı yazılımların çoğu bugün HTTPS üzerinden taşınır. IPS ve Antivirüs'ün şifreli trafikte etkili olabilmesi için <strong>SSL/TLS deep inspection</strong> profilinin de aktif olması gerekir. Performans dengesi için, kritik segmentlerde derin tarama uygularken hassas trafikte (bankacılık, sağlık) istisna tanımlamak iyi bir pratiktir.</p>

<h2>Sonuç</h2>
<p>IPS ve Antivirüs profilleri, doğru yapılandırıldığında FortiGate'i pasif bir geçiş noktasından aktif bir tehdit önleme platformuna dönüştürür. Güncel imzalar, doğru tarama modu ve SSL denetimiyle birleştiğinde kurumsal ağınız hem bilinen hem bilinmeyen tehditlere karşı korunur.</p>
<p>Lider Network olarak FortiGate tehdit koruma profillerinin tasarımı, optimizasyonu ve güvenlik denetimlerinde uzman mühendislerimizle yanınızdayız.</p>
    `,
  },

  {
    slug: "fortigate-fsso-ldap-kullanici-bazli-guvenlik",
    title: "FortiGate'te FSSO ve LDAP ile Kullanıcı Bazlı Güvenlik",
    excerpt:
      "IP tabanlı politikaların ötesine geçip kullanıcı kimliğine göre güvenlik uygulamak için FortiGate'in LDAP entegrasyonunu ve Fortinet Single Sign-On (FSSO) yapısını ele alıyoruz.",
    category: "fortigate-ngfw",
    categoryColor: "#EE3124",
    tags: ["FortiGate", "FSSO", "LDAP", "Active Directory", "Kimlik Doğrulama"],
    publishedAt: "2026-05-27",
    readTime: 7,
    content: `
<h2>Neden Kullanıcı Bazlı Güvenlik?</h2>
<p>Klasik firewall politikaları kaynak ve hedefi <strong>IP adresi</strong> üzerinden tanır. Ancak modern ağlarda kullanıcılar farklı cihazlardan, değişken IP'lerle bağlanır. "Muhasebe ekibi şu uygulamalara erişsin, stajyerler erişmesin" gibi kurallar IP ile değil, <strong>kullanıcı kimliğiyle</strong> uygulanmalıdır. FortiGate bunu LDAP ve FSSO ile sağlar.</p>

<h2>LDAP Entegrasyonu</h2>
<p>FortiGate, <strong>LDAP</strong> protokolü üzerinden Active Directory veya başka bir dizin sunucusuna bağlanarak kullanıcıları ve grupları doğrular. Bu yöntem özellikle <strong>SSL VPN, captive portal ve yönetici girişi</strong> gibi kullanıcının aktif olarak kimlik girdiği senaryolarda kullanılır. Yapılandırmada dizin sunucusunun adresi, bağlanma (bind) hesabı ve arama tabanı (base DN) tanımlanır.</p>

<h2>FSSO Nedir?</h2>
<p><strong>Fortinet Single Sign-On (FSSO)</strong>, kullanıcıların ağa Windows oturumu açtığında otomatik olarak kimliklerinin FortiGate'e bildirilmesini sağlar. Böylece kullanıcı ayrıca bir giriş yapmadan, kimliğine uygun politikalar şeffaf biçimde uygulanır. İki temel mod vardır:</p>
<ul>
  <li><strong>Agent (Collector) modu:</strong> Domain controller üzerine kurulan bir ajan, oturum açma olaylarını toplar ve FortiGate'e iletir. Büyük ortamlar için en kararlı yöntemdir.</li>
  <li><strong>Polling modu:</strong> FortiGate, DC güvenlik loglarını periyodik sorgular; ek ajan gerektirmez ancak daha küçük ortamlar için uygundur.</li>
</ul>

<h2>Gruba Dayalı Politikalar</h2>
<p>Kimlik bilgisi FortiGate'e ulaştığında, firewall politikalarında kaynak olarak IP yerine <strong>kullanıcı grubu</strong> seçebilirsiniz. Örneğin "Domain Users" grubuna temel internet, "IT-Admins" grubuna yönetim araçlarına erişim, "Guest" grubuna yalnızca web tanımlayabilirsiniz. Bu, hem güvenliği hem denetlenebilirliği büyük ölçüde artırır.</p>

<h2>Sonuç</h2>
<p>LDAP ve FSSO, FortiGate'i IP merkezli bir cihazdan <strong>kimlik farkında (identity-aware)</strong> bir güvenlik platformuna dönüştürür. Kullanıcı bazlı politikalar, hem Zero Trust yaklaşımının temelini oluşturur hem de loglarda "kim, ne zaman, neye erişti" sorularına net cevap verir.</p>
<p>Lider Network olarak FortiGate kimlik doğrulama, Active Directory entegrasyonu ve FSSO kurulumu konularında uzman mühendislerimizle yanınızdayız.</p>
    `,
  },

  {
    slug: "fortigate-vdom-nedir-sanal-domain-yapilandirma",
    title: "FortiGate VDOM Nedir? Sanal Domain'lerle Çoklu Yönetim",
    excerpt:
      "Tek bir FortiGate cihazını birden fazla bağımsız güvenlik duvarına bölen VDOM yapısını, kullanım senaryolarını ve inter-VDOM bağlantılarını anlaşılır biçimde açıklıyoruz.",
    category: "fortigate-ngfw",
    categoryColor: "#EE3124",
    tags: ["FortiGate", "VDOM", "Virtual Domain", "Segmentasyon", "MSSP"],
    publishedAt: "2026-05-29",
    readTime: 6,
    content: `
<h2>VDOM Nedir?</h2>
<p><strong>Virtual Domain (VDOM)</strong>, tek bir fiziksel FortiGate cihazını birbirinden tamamen bağımsız birden fazla sanal güvenlik duvarına bölen özelliktir. Her VDOM'un kendi arayüzleri, politika tabloları, yönlendirme tablosu ve yönetici hesapları olabilir. Böylece tek donanımla birden çok izole ağı yönetebilirsiniz.</p>

<h2>Hangi Senaryolarda Kullanılır?</h2>
<ul>
  <li><strong>Çoklu kiracı (MSSP):</strong> Bir servis sağlayıcı, farklı müşterileri tek cihaz üzerinde tamamen izole biçimde barındırabilir.</li>
  <li><strong>Departman/birim ayrımı:</strong> Üretim, misafir ve yönetim ağlarını ayrı politika setleriyle izole etmek.</li>
  <li><strong>Farklı güvenlik gereksinimleri:</strong> Bir bölümde sıkı denetim, diğerinde esnek kurallar gerektiğinde yönetimi sadeleştirir.</li>
</ul>

<h2>Management ve Traffic VDOM</h2>
<p>VDOM modu etkinleştirildiğinde bir <strong>yönetim VDOM'u (management)</strong> ve bir veya daha fazla <strong>trafik VDOM'u</strong> bulunur. Yönetim VDOM'u cihazın genel hizmetlerini (FortiGuard güncellemeleri, log gönderimi) üstlenirken; trafik VDOM'ları gerçek kullanıcı trafiğini taşır. Her VDOM'a ayrı yönetici atayarak yetkileri de bölebilirsiniz.</p>

<h2>Inter-VDOM Bağlantıları</h2>
<p>VDOM'lar varsayılan olarak izoledir; aralarında trafik geçmesi gerekiyorsa <strong>inter-VDOM link</strong> adı verilen sanal bağlantılar oluşturulur. Bu bağlantı üzerinden, tıpkı iki ayrı cihaz arasında olduğu gibi yönlendirme ve firewall politikaları tanımlanır. Bu sayede kontrollü, denetlenebilir bir trafik akışı sağlanır.</p>

<h2>Ne Zaman Tercih Edilmeli?</h2>
<p>VDOM güçlü bir özelliktir ancak yönetimi karmaşıklaştırabilir. Küçük ve tek amaçlı kurulumlarda genellikle gerekmez; segmentasyon için VLAN ve farklı politikalar yeterli olabilir. Ancak gerçek bir izolasyon, ayrı yönetim yetkisi veya çoklu müşteri ihtiyacı varsa VDOM en doğru çözümdür.</p>

<h2>Sonuç</h2>
<p>VDOM, donanım maliyetini düşürürken güçlü bir izolasyon sağlar. Doğru senaryoda kullanıldığında tek bir FortiGate, birden fazla bağımsız güvenlik duvarının işini görür.</p>
<p>Lider Network olarak FortiGate VDOM tasarımı, çoklu kiracı yapılandırması ve ağ segmentasyonu projelerinde uzman mühendislerimizle yanınızdayız.</p>
    `,
  },

  {
    slug: "fortigate-traffic-shaping-qos-bant-genisligi-yonetimi",
    title: "FortiGate Traffic Shaping (QoS) ile Bant Genişliği Yönetimi",
    excerpt:
      "Kritik uygulamalara öncelik verip bant genişliğini adil dağıtmak için FortiGate'in traffic shaping ve QoS mekanizmalarını, shaper türlerini ve örnek senaryoları inceliyoruz.",
    category: "fortigate-ngfw",
    categoryColor: "#EE3124",
    tags: ["FortiGate", "Traffic Shaping", "QoS", "Bant Genişliği", "Ağ Performansı"],
    publishedAt: "2026-05-31",
    readTime: 6,
    content: `
<h2>Traffic Shaping Neden Gerekli?</h2>
<p>İnternet bant genişliği sınırlı bir kaynaktır. Tek bir büyük indirme veya video akışı, tüm hattı doldurarak VoIP görüşmelerinin kesilmesine veya iş uygulamalarının yavaşlamasına neden olabilir. <strong>Traffic shaping (QoS)</strong>, trafiği önceliklendirerek kritik uygulamalara garanti bant genişliği ayırır ve kalan kapasiteyi adil biçimde dağıtır.</p>

<h2>Shaper Türleri</h2>
<ul>
  <li><strong>Shared shaper:</strong> Bir politikadaki tüm trafiğe ortak bir limit/öncelik uygular.</li>
  <li><strong>Per-IP shaper:</strong> Limiti her kullanıcı (IP) için ayrı uygular; tek bir kullanıcının hattı tüketmesini engeller.</li>
  <li><strong>Application shaper:</strong> Application Control ile birleşerek belirli uygulamalara (ör. akış medya) limit koyar.</li>
</ul>

<h2>Garanti ve Maksimum Bant Genişliği</h2>
<p>Her shaper'da iki temel değer tanımlanır: <strong>guaranteed bandwidth</strong> (uygulamanın her koşulda alacağı minimum hız) ve <strong>maximum bandwidth</strong> (aşamayacağı üst sınır). Örneğin VoIP trafiğine yüksek öncelik ve garanti hız verirken, misafir ağına düşük öncelik ve üst sınır koyabilirsiniz.</p>

<h2>Öncelik ve DSCP İşaretleme</h2>
<p>FortiGate, trafiğe <strong>high / medium / low</strong> öncelik atayabilir ve <strong>DSCP</strong> değerleriyle işaretleyebilir. Bu işaretleme, paketlerin yalnızca FortiGate üzerinde değil, ağdaki diğer cihazlarda da öncelikli işlenmesini sağlar — uçtan uca tutarlı bir QoS politikası oluşur.</p>

<h2>Örnek Senaryo</h2>
<p>Tipik bir kurum politikası: <em>VoIP ve video konferans</em> en yüksek öncelik ve garanti hız; <em>iş uygulamaları (ERP, e-posta)</em> orta öncelik; <em>yedekleme ve büyük indirmeler</em> düşük öncelik ve mesai saatlerinde üst sınır; <em>misafir ağı</em> per-IP limit. Bu yapı, hat dolduğunda bile kritik işlerin aksamamasını sağlar.</p>

<h2>Sonuç</h2>
<p>Traffic shaping, "internet yavaş" şikayetlerinin çoğunu bant genişliği artırmadan çözebilen güçlü bir araçtır. Doğru önceliklendirme, hem kullanıcı deneyimini hem de iş sürekliliğini doğrudan iyileştirir.</p>
<p>Lider Network olarak FortiGate QoS tasarımı, VoIP önceliklendirme ve bant genişliği yönetimi projelerinde uzman mühendislerimizle yanınızdayız.</p>
    `,
  },

  {
    slug: "fortigate-fortitoken-iki-faktorlu-dogrulama-2fa",
    title: "FortiGate'te FortiToken ile İki Faktörlü Doğrulama (2FA)",
    excerpt:
      "Çalınan parolaların yetmediği bir savunma için FortiGate'te FortiToken tabanlı iki faktörlü doğrulamayı; yönetici girişi ve SSL VPN senaryolarıyla birlikte açıklıyoruz.",
    category: "fortigate-ngfw",
    categoryColor: "#EE3124",
    tags: ["FortiGate", "FortiToken", "2FA", "MFA", "VPN Güvenliği"],
    publishedAt: "2026-06-01",
    readTime: 6,
    content: `
<h2>Neden İki Faktörlü Doğrulama?</h2>
<p>Parolalar; oltalama, sızıntı veya kaba kuvvet saldırılarıyla ele geçirilebilir. <strong>İki faktörlü doğrulama (2FA)</strong>, "bildiğiniz bir şey" (parola) ile "sahip olduğunuz bir şey" (tek kullanımlık kod) kombinasyonunu zorunlu kılarak, parola çalınsa bile yetkisiz erişimi engeller. FortiGate bunu <strong>FortiToken</strong> ile yerel olarak sağlar.</p>

<h2>FortiToken Türleri</h2>
<ul>
  <li><strong>FortiToken Mobile:</strong> Akıllı telefon uygulaması üzerinden 30 saniyede bir yenilenen kod üretir; en yaygın ve pratik yöntemdir.</li>
  <li><strong>FortiToken Hardware:</strong> Fiziksel anahtarlık tipi cihaz; internet erişimi olmayan ortamlar için idealdir.</li>
  <li><strong>E-posta / SMS token:</strong> Tek kullanımlık kodun e-posta veya SMS ile gönderildiği daha esnek yöntemler.</li>
</ul>

<h2>Yönetici Girişinde 2FA</h2>
<p>En kritik 2FA uygulaması, FortiGate'in <strong>yönetici (admin) hesaplarıdır</strong>. Yönetim arayüzüne erişim, parolaya ek olarak FortiToken koduyla korunduğunda, cihazın tamamen ele geçirilme riski büyük ölçüde azalır. Her yönetici hesabına token ataması birkaç adımda yapılır.</p>

<h2>SSL VPN ve Uzaktan Erişimde 2FA</h2>
<p>Uzaktan çalışan kullanıcıların <strong>SSL VPN</strong> girişleri, dışarıya açık olmaları nedeniyle en çok hedef alınan noktalardandır. VPN kullanıcılarına 2FA zorunlu kılmak, kurumsal ağa açılan bu kapıyı ciddi biçimde güvenli hale getirir. LDAP/Active Directory entegrasyonuyla birlikte kullanıldığında hem kimlik hem ikinci faktör merkezi olarak yönetilir.</p>

<h2>Kayıt ve Aktivasyon</h2>
<p>FortiToken'lar önce FortiGate'e tanıtılır, ardından ilgili kullanıcı hesabına atanır. Kullanıcı ilk girişte token'ı uygulamasına aktive eder. Süreç tamamlandığında, her oturum açma denemesi parola + anlık kod ister. Token kaybı durumunda yönetici, hesabı geçici olarak token'sız moda alarak yeniden atama yapabilir.</p>

<h2>Sonuç</h2>
<p>2FA, en düşük maliyetle en yüksek güvenlik kazancı sağlayan önlemlerden biridir. Özellikle yönetici ve VPN erişimlerinde FortiToken kullanımı, kurumsal ağı parola tabanlı saldırıların büyük çoğunluğuna karşı korur.</p>
<p>Lider Network olarak FortiGate 2FA, FortiToken kurulumu ve güvenli uzaktan erişim yapılandırmalarında uzman mühendislerimizle yanınızdayız.</p>
    `,
  },

  {
    slug: "fortigate-ssl-vpn-kurulumu-uzaktan-erisim-rehberi",
    title: "FortiGate SSL VPN Kurulumu: Uçtan Uca Uzaktan Erişim Rehberi",
    excerpt:
      "Uzaktan çalışanlar için güvenli erişim sağlayan FortiGate SSL VPN'in web ve tünel modlarını, portal yapılandırmasını, kullanıcı doğrulamayı ve güvenlik önlemlerini adım adım ele alıyoruz.",
    category: "fortigate-ngfw",
    categoryColor: "#EE3124",
    tags: ["FortiGate", "SSL VPN", "Uzaktan Erişim", "FortiClient", "VPN"],
    publishedAt: "2026-06-05",
    readTime: 7,
    content: `
<h2>SSL VPN Nedir ve Modları</h2>
<p>FortiGate <strong>SSL VPN</strong>, uzaktaki kullanıcıların internet üzerinden kurumsal ağa şifreli ve güvenli biçimde bağlanmasını sağlar. İki temel modda çalışır:</p>
<ul>
  <li><strong>Tunnel mode:</strong> FortiClient uygulamasıyla tam ağ erişimi sağlar; kullanıcı sanki ofisteymiş gibi iç kaynaklara erişir.</li>
  <li><strong>Web mode:</strong> Yalnızca tarayıcı üzerinden, ek istemci gerektirmeden belirli web uygulamalarına erişim sunar.</li>
</ul>

<h2>Portal Yapılandırması</h2>
<p>SSL VPN <strong>portal'ı</strong>, kullanıcıların bağlandığında ne görebileceğini ve nelere erişebileceğini tanımlar. Burada IP havuzu (kullanıcılara verilecek adresler), erişilebilir kaynaklar (bookmarks) ve <strong>split tunnel</strong> ayarı belirlenir. Split tunnel etkinken yalnızca kurumsal trafik VPN'den geçer, internet trafiği kullanıcının kendi hattından akar — performansı artırır.</p>

<h2>Kullanıcı Doğrulama ve Gruplar</h2>
<p>Kullanıcılar yerel veritabanından veya <strong>LDAP/Active Directory</strong> üzerinden doğrulanabilir. Kullanıcılar gruplara atanır ve her grup belirli bir portala bağlanır. Bu sayede farklı ekiplere farklı erişim seviyeleri tanımlanır.</p>

<h2>Firewall Politikası</h2>
<p>SSL VPN trafiğinin iç ağa ulaşabilmesi için bir <strong>firewall politikası</strong> gerekir: kaynak olarak SSL VPN arayüzü/kullanıcı grubu, hedef olarak iç ağ tanımlanır. Bu politikada erişimi yalnızca gerekli kaynaklarla sınırlamak, en az ayrıcalık (least privilege) ilkesi açısından önemlidir.</p>

<h2>Güvenlik Önlemleri</h2>
<p>SSL VPN dışarıya açık bir kapı olduğu için ek önlemler şarttır:</p>
<ul>
  <li><strong>İki faktörlü doğrulama (FortiToken)</strong> mutlaka etkinleştirilmeli.</li>
  <li>Varsayılan portları değiştirmek ve erişimi gerekiyorsa coğrafi olarak kısıtlamak.</li>
  <li>FortiOS'u güncel tutmak — SSL VPN, geçmişte kritik zafiyetlerin hedefi olmuştur.</li>
  <li>Başarısız giriş denemelerini ve oturumları düzenli izlemek.</li>
</ul>

<h2>Sonuç</h2>
<p>Doğru yapılandırılmış bir SSL VPN, uzaktan çalışmayı hem esnek hem güvenli kılar. Portal tasarımı, kullanıcı doğrulama, sınırlı politika ve 2FA bir arada uygulandığında, kurumsal ağınıza güvenli bir uzaktan erişim kapısı açmış olursunuz.</p>
<p>Lider Network olarak FortiGate SSL VPN kurulumu, FortiClient dağıtımı ve güvenli uzaktan erişim projelerinde uzman mühendislerimizle yanınızdayız.</p>
    `,
  },

  {
    slug: "fortigate-ztna-ssl-vpn-sifir-guven-erisim",
    title: "FortiGate ZTNA: SSL-VPN'den Sıfır Güven Erişimine Geçiş Rehberi",
    excerpt:
      "Fortinet'in ZTNA (Zero Trust Network Access) mimarisi, geleneksel SSL-VPN'in yerini alıyor. SSL-VPN'in güvenlik açıkları, ZTNA'nın getirdiği avantajlar ve FortiGate üzerinde geçiş adımları.",
    category: "fortigate-ngfw",
    categoryColor: "#EE3124",
    tags: ["ZTNA", "SSL-VPN", "FortiGate", "Sıfır Güven", "FortiClient", "Zero Trust", "Uzaktan Erişim"],
    publishedAt: "2026-07-08",
    readTime: 10,
    featured: false,
    content: `
<h2>SSL-VPN Neden Artık Yeterli Değil?</h2>
<p>SSL-VPN teknolojisi 2000'lerin başında kurumsal uzaktan erişim için devrimsel bir çözümdü. Ancak 2020'lerden itibaren saldırı yüzeyi olarak ciddi bir hedef haline geldi. Fortinet dahil tüm büyük üreticilerin SSL-VPN ürünlerinde yıl boyunca kritik CVE'ler yayımlanıyor.</p>

<p>SSL-VPN'in temel problemi mimariseldir: kullanıcıya ağ erişimi verildiğinde, yetkilendirme kontrolü tek bir noktada (kimlik doğrulama) yapılır. Kullanıcı ağa girince içeride çok geniş bir hareket alanı bulur. Bu durum lateral movement saldırılarını kolaylaştırır.</p>

<h3>SSL-VPN'in Bilinen Güvenlik Riskleri</h3>
<ul>
  <li>FortiOS SSL-VPN buffer overflow CVE'leri (CVE-2023-27997, CVE-2024-21762 vb.)</li>
  <li>Kimlik bilgisi çalınmasına karşı tek nokta savunması</li>
  <li>Bağlandıktan sonra uç nokta güvenliği kontrolü yapılmaması</li>
  <li>Granüler uygulama bazlı erişim kontrolünün zorluğu</li>
  <li>Ağ seviyesi erişim — uygulama seviyesi değil</li>
</ul>

<h2>ZTNA Nedir?</h2>
<p><strong>Zero Trust Network Access (ZTNA)</strong>, "asla güvenme, her zaman doğrula" prensibine dayalı bir erişim modelidir. Kullanıcı veya cihazın ağın içinde mi dışında mı olduğundan bağımsız olarak, her uygulama erişimi ayrı ayrı doğrulanır ve yetkilendirilir.</p>

<p>FortiGate ZTNA, FortiOS 7.0 ile birlikte genel kullanıma sunuldu ve her sürümde olgunlaştırıldı. Temel fark şudur: SSL-VPN ağa erişim sağlarken, ZTNA uygulamaya erişim sağlar.</p>

<h3>ZTNA Mimarisinin Bileşenleri</h3>
<ul>
  <li><strong>ZTNA Access Proxy:</strong> FortiGate üzerinde çalışır, uygulama trafiğini proxy'ler</li>
  <li><strong>FortiClient EMS:</strong> Uç nokta güvenlik durumunu merkezi olarak yönetir ve ZTNA etiketleri (tags) üretir</li>
  <li><strong>FortiClient:</strong> İstemci tarafında çalışan ajan — cihaz durumunu EMS'e raporlar</li>
  <li><strong>ZTNA Tags:</strong> Cihazın güvenlik durumuna göre üretilen etiketler (antivirüs aktif mi, disk şifreleme var mı, OS güncel mi vb.)</li>
</ul>

<h2>SSL-VPN ile ZTNA Karşılaştırması</h2>
<table>
  <thead><tr><th>Özellik</th><th>SSL-VPN</th><th>ZTNA</th></tr></thead>
  <tbody>
    <tr><td>Erişim seviyesi</td><td>Ağ (network)</td><td>Uygulama (application)</td></tr>
    <tr><td>Kimlik doğrulama</td><td>Bağlantı başında bir kez</td><td>Her oturumda sürekli</td></tr>
    <tr><td>Cihaz güvenlik kontrolü</td><td>Opsiyonel / zayıf</td><td>Zorunlu, granüler</td></tr>
    <tr><td>Lateral movement riski</td><td>Yüksek</td><td>Çok düşük</td></tr>
    <tr><td>Uygulama bazlı politika</td><td>Zor</td><td>Yerel, kolay</td></tr>
    <tr><td>Saldırı yüzeyi</td><td>Büyük (ağ erişimi)</td><td>Küçük (sadece uygulama)</td></tr>
  </tbody>
</table>

<h2>FortiGate ZTNA Yapılandırması</h2>

<h3>1. FortiClient EMS Kurulumu</h3>
<p>ZTNA'nın çalışması için FortiClient EMS (Endpoint Management Server) zorunludur. EMS, cihazların güvenlik durumunu toplar ve FortiGate'e ZTNA etiketleri olarak iletir.</p>
<pre><code># EMS bağlantısı FortiGate üzerinde
config endpoint-control fctems
  edit "EMS-SERVER"
    set server "ems.sirket.local"
    set https-port 443
  next
end</code></pre>

<h3>2. ZTNA Server Tanımı</h3>
<p>Erişilecek uygulama için ZTNA server objesi oluşturun:</p>
<pre><code>config firewall access-proxy
  edit "RDP-PROXY"
    set vip "ZTNA-VIP"
    set client-cert enable
    config api-gateway
      edit 1
        set url-map "/"
        set service tcp-forwarding
        config realservers
          edit 1
            set addr "RDP-SERVER"
            set port 3389
          next
        end
      next
    end
  next
end</code></pre>

<h3>3. ZTNA Policy</h3>
<p>ZTNA erişim politikasında cihaz etiketlerini koşul olarak ekleyin:</p>
<pre><code>config firewall policy
  edit 0
    set name "ZTNA-RDP-Policy"
    set srcintf "wan1"
    set dstintf "lan"
    set action accept
    set srcaddr "all"
    set dstaddr "ZTNA-VIP"
    set ztna-status enable
    set ztna-tags "EMS-Compliant" "Antivirus-Active"
  next
end</code></pre>

<h3>4. ZTNA Etiket Kuralları (EMS'te)</h3>
<p>EMS üzerinde hangi koşullarda cihaza "uyumlu" etiketi verileceğini belirleyin:</p>
<ul>
  <li>FortiClient sürümü ≥ belirli versiyon</li>
  <li>Real-time protection aktif</li>
  <li>OS patch seviyesi güncel</li>
  <li>Disk şifreleme (BitLocker/FileVault) aktif</li>
  <li>Güvenli olmayan yazılım yüklü değil</li>
</ul>

<h2>Geçiş Stratejisi: SSL-VPN'den ZTNA'ya</h2>
<p>SSL-VPN'den ZTNA'ya tek seferde geçmek yerine aşamalı bir yaklaşım önerilir:</p>

<ol>
  <li><strong>Envanter:</strong> SSL-VPN üzerinden erişilen uygulamaları listeleyin (RDP, SSH, web uygulamaları, dosya paylaşımı)</li>
  <li><strong>EMS kurulumu:</strong> FortiClient EMS'i devreye alın, mevcut endpoint'lere FortiClient dağıtın</li>
  <li><strong>Pilot:</strong> Önce dahili BT ekibi için ZTNA erişimi kurun, SSL-VPN'i paralel çalıştırın</li>
  <li><strong>Uygulama geçişi:</strong> Her uygulamayı birer birer ZTNA'ya taşıyın</li>
  <li><strong>SSL-VPN kapatma:</strong> Tüm geçişler tamamlandıktan sonra SSL-VPN portalını devre dışı bırakın</li>
</ol>

<h2>Sonuç</h2>
<p>ZTNA, SSL-VPN'in güvenlik açıklarını mimarisel olarak çözen modern bir yaklaşımdır. FortiGate + FortiClient EMS kombinasyonu ile kurumsal ortamlarda ZTNA geçişi artık pratikte uygulanabilir hale gelmiştir. Lider Network olarak ZTNA tasarımı, EMS kurulumu ve geçiş projelerinde yanınızdayız.</p>
    `,
  },

  {
    slug: "fortigate-7-4-yeni-ozellikler-kurumsal-guncelleme-rehberi",
    title: "FortiOS 7.4: Kurumsal Ağlarda Yeni Özellikler ve Güncelleme Rehberi",
    excerpt:
      "FortiOS 7.4 ile gelen ZTNA iyileştirmeleri, SD-WAN güncellemeleri, gelişmiş AI tabanlı tehdit tespiti ve FortiGate yönetim kolaylıkları. 7.2'den 7.4'e geçiş öncesi bilinmesi gerekenler.",
    category: "fortigate-ngfw",
    categoryColor: "#EE3124",
    tags: ["FortiOS 7.4", "FortiGate", "Güncelleme", "SD-WAN", "ZTNA", "AI Security", "Fortinet"],
    publishedAt: "2026-07-06",
    readTime: 8,
    content: `
<h2>FortiOS 7.4'e Genel Bakış</h2>
<p>Fortinet'in uzun süreli destek (LTS) sürümü olarak konumlanan <strong>FortiOS 7.4</strong>, kurumsal ortamlar için önerilen stabil sürümdür. 7.2'den bu yana gelen en büyük mimarisel değişiklikler ve operasyonel iyileştirmeleri barındırır. Bu yazıda öne çıkan özellikleri ve güncelleme sürecinde dikkat edilmesi gereken noktaları ele alıyoruz.</p>

<h2>Öne Çıkan Yeni Özellikler</h2>

<h3>1. Inline CASB (Cloud Access Security Broker)</h3>
<p>7.4 ile birlikte FortiGate, bulut uygulama trafiğini inline olarak denetleyebiliyor. Microsoft 365, Google Workspace, Dropbox, Salesforce gibi SaaS uygulamalarına yönelik politikalar artık doğrudan firewall üzerinden uygulanabiliyor. Veri kaybı önleme (DLP) politikaları bulut uygulamalarını da kapsıyor.</p>

<h3>2. Geliştirilmiş SD-WAN Orchestration</h3>
<p>FortiManager ile entegre çalışan yeni SD-WAN şablonları, merkezi yapılandırmayı önemli ölçüde kolaylaştırdı. Çoklu WAN bağlantıları için uygulama bazlı SLA ölçümü daha granüler hale getirildi. Yeni <strong>SD-WAN Analyzer</strong> ile bağlantı kalitesi geçmişi ve uygulama performansı tek ekranda izlenebiliyor.</p>

<h3>3. ZTNA 2.0 İyileştirmeleri</h3>
<p>FortiOS 7.4'te ZTNA politikaları arayüzü tamamen yenilendi. Uygulama bazlı erişim kontrolü artık HTTP Header bazlı yönlendirmeyi destekliyor. Agentless ZTNA ile FortiClient yüklü olmayan cihazlar için tarayıcı tabanlı erişim mümkün hale geldi.</p>

<h3>4. FortiAI Entegrasyonu</h3>
<p>Makine öğrenmesi tabanlı tehdit tespiti 7.4 ile daha gelişmiş hale geldi. <strong>FortiAI</strong> motoru şu alanlarda yerel olarak çalışıyor:</p>
<ul>
  <li>Şifreli trafik analizi (TLS inspection gerektirmeden)</li>
  <li>Davranış bazlı botnet tespiti</li>
  <li>Anomali tabanlı ağ trafiği analizi</li>
  <li>Otomatik tehdit puanlama ve karantina önerisi</li>
</ul>

<h3>5. Yönetim Arayüzü Güncellemeleri</h3>
<p>GUI'de önemli iyileştirmeler yapıldı:</p>
<ul>
  <li><strong>Policy & Objects</strong> menüsü yeniden düzenlendi, arama ve filtreleme geliştirildi</li>
  <li>Dashboard widget'ları özelleştirilebilir hale getirildi</li>
  <li>Konfigürasyon değişiklik geçmişi (revision history) daha ayrıntılı tutulmaya başlandı</li>
  <li>CLI komut önerileri (autocomplete) genişletildi</li>
</ul>

<h3>6. HA (High Availability) İyileştirmeleri</h3>
<p>Active-Passive ve Active-Active HA kurulumlarında failover süresi kısaltıldı. Session sync mekanizması optimize edildi — özellikle yüksek trafikli ortamlarda çöküş sonrası bağlantı kopmaları minimize edildi.</p>

<h2>7.2'den 7.4'e Güncelleme: Dikkat Edilmesi Gerekenler</h2>

<h3>Güncelleme Öncesi Kontrol Listesi</h3>
<table>
  <thead><tr><th>Kontrol</th><th>Açıklama</th></tr></thead>
  <tbody>
    <tr><td>Konfigürasyon yedeği</td><td>execute backup config tftp/ftp ile tam config yedeği alın</td></tr>
    <tr><td>FortiGuard lisansları</td><td>Tüm abonelikler güncel ve geçerli mi kontrol edin</td></tr>
    <tr><td>Depolama alanı</td><td>execute disk list ile yeterli alan olduğunu doğrulayın</td></tr>
    <tr><td>HA sürüm uyumu</td><td>HA cluster'da her iki cihaz da aynı major versiyonda olmalı</td></tr>
    <tr><td>Upgrade path</td><td>7.0 → 7.2 → 7.4 sırasıyla geçin, direkt 7.0'dan 7.4'e atlamayın</td></tr>
  </tbody>
</table>

<h3>Güncelleme Adımları</h3>
<pre><code># 1. Mevcut sürümü kontrol et
get system status

# 2. Config yedeği al
execute backup config ftp 192.168.1.100 /backup/fortigate-backup.conf admin pass

# 3. Firmware indir ve yükle (GUI üzerinden önerilir)
# System > Firmware > Upload

# 4. Güncelleme sonrası doğrulama
get system status
diagnose sys flash list</code></pre>

<h3>7.4'te Kaldırılan / Değişen Özellikler</h3>
<ul>
  <li><strong>SSL-VPN web mode kısıtlaması:</strong> Bazı eski browser eklentileri artık desteklenmiyor</li>
  <li><strong>FortiToken Mobile 2.0 zorunluluğu:</strong> Eski FortiToken uygulaması güncellenmeli</li>
  <li><strong>Eski cipher suite'ler:</strong> TLS 1.0 ve 1.1 varsayılan olarak devre dışı</li>
</ul>

<h2>Hangi Versiyonu Kullanmalı?</h2>
<p>Fortinet'in versiyon önerileri şu şekildedir:</p>
<ul>
  <li><strong>7.4.x (LTS):</strong> Üretim ortamları için önerilen stabil sürüm</li>
  <li><strong>7.2.x:</strong> Uzun süreli destek, ancak yeni özellik gelmiyor</li>
  <li><strong>7.0.x:</strong> End of Engineering Life'a yaklaşıyor, geçiş planlanmalı</li>
</ul>

<p>Lider Network olarak FortiOS güncelleme planlaması, test ortamı kurulumu ve üretim geçiş süreçlerinde profesyonel destek sunuyoruz.</p>
    `,
  },

  {
    slug: "synology-dsm-7-2-kurumsal-ozellikler-yenilikler",
    title: "Synology DSM 7.2: Kurumsal NAS Yönetiminde Yeni Özellikler",
    excerpt:
      "Synology DSM 7.2 ile gelen immutable snapshot, SMB Multichannel iyileştirmeleri, Surveillance Station güncellemeleri ve gelişmiş güvenlik özellikleri. Kurumsal NAS altyapısında neler değişti?",
    category: "synology",
    categoryColor: "#B5121B",
    tags: ["Synology", "DSM 7.2", "NAS", "Immutable Snapshot", "SMB Multichannel", "Kurumsal Depolama", "WORM"],
    publishedAt: "2026-07-07",
    readTime: 9,
    content: `
<h2>DSM 7.2'ye Genel Bakış</h2>
<p><strong>Synology DiskStation Manager (DSM) 7.2</strong>, kurumsal kullanıcılar için kritik yenilikler getiren önemli bir sürümdür. Özellikle <strong>immutable snapshot</strong> desteği, SMB performans iyileştirmeleri ve güçlendirilmiş güvenlik altyapısı ile öne çıkıyor.</p>

<h2>Öne Çıkan Yeni Özellikler</h2>

<h3>1. Immutable Snapshot (WORM Desteği)</h3>
<p>DSM 7.2'nin en önemli kurumsal özelliği, <strong>Write Once Read Many (WORM)</strong> uyumlu immutable snapshot desteğidir. Bu özellik sayesinde alınan anlık görüntüler belirli bir süre boyunca silinemez veya değiştirilemez hale getirilebiliyor.</p>

<p>Fidye yazılımı (ransomware) saldırılarına karşı en etkili savunmalardan biri olan immutable snapshot şu senaryolarda kritiktir:</p>
<ul>
  <li>Saldırgan NAS'a erişim kazansa bile korunan snapshotları silemez</li>
  <li>KVKK ve ISO 27001 uyumluluğu için denetim kayıtlarının değiştirilemez tutulması</li>
  <li>Finansal ve hukuki kayıtların uzun süreli değiştirilemez arşivlenmesi</li>
</ul>

<pre><code># Snapshot Retention Lock — DSM arayüzünden:
# Depolama Yöneticisi > Anlık Görüntü > Bekletme Kilidi > Etkinleştir
# Minimum kilit süresi: 1 gün
# Maksimum: 10 yıl</code></pre>

<h3>2. SMB Multichannel Geliştirmeleri</h3>
<p>DSM 7.2, SMB Multichannel desteğini optimize ederek çok NIC'li istemcilerde veri aktarım hızını önemli ölçüde artırdı. 10GbE ve 25GbE bağlantılarda gerçek dünya performansı yüksek belirginlik kazandı.</p>
<ul>
  <li>2.5GbE, 10GbE ve 25GbE arayüzlerde SMB 3.x ile bant genişliği toplama</li>
  <li>Windows Server istemcilerinde otomatik channel negotiation</li>
  <li>Yük dengeleme algoritması iyileştirildi — büyük dosya transferlerinde %40'a kadar hız artışı</li>
</ul>

<h3>3. Synology Drive Server Güncellemesi</h3>
<p>Drive Server 3.x ile birlikte kurumsal dosya işbirliği yetenekleri genişledi:</p>
<ul>
  <li><strong>Sürüm geçmişi:</strong> 365 güne kadar dosya versiyonu saklama</li>
  <li><strong>Seçici senkronizasyon:</strong> İstemcilerde sadece ihtiyaç duyulan klasörleri senkronize etme</li>
  <li><strong>Admin Console:</strong> Merkezi kullanıcı depolama kotası yönetimi</li>
  <li><strong>Harici paylaşım güvenliği:</strong> Şifreli link paylaşımı, süre sınırlı erişim</li>
</ul>

<h3>4. Active Backup for Business Güncellemeleri</h3>
<p>DSM 7.2 ile Active Backup for Business'ın yeni özellikleri:</p>
<ul>
  <li>VMware vSphere 8.0 desteği</li>
  <li>Microsoft Hyper-V Gen 2 VM desteği</li>
  <li>Fiziksel Windows/Linux sunucu yedekleme için agent iyileştirmeleri</li>
  <li>Çapraz hiper-vizör geri yükleme (VMware'den Hyper-V'ye P2V/V2V)</li>
  <li>Tek dosya düzeyinde granüler geri yükleme (Granular Recovery)</li>
</ul>

<h3>5. Güvenlik Güncellemeleri</h3>
<p>DSM 7.2, güvenlik altyapısını önemli ölçüde güçlendirdi:</p>

<h4>Secure SignIn ve WebAuthn</h4>
<p>FIDO2/WebAuthn standardı ile donanım güvenlik anahtarları (YubiKey, FIDO2 USB key) kullanılarak DSM girişi mümkün hale geldi. Kimlik avı saldırılarına karşı en güçlü 2FA yöntemi artık Synology'de yerel olarak destekleniyor.</p>

<h4>Adaptive MFA</h4>
<p>Risk bazlı çok faktörlü doğrulama: bilinmeyen konumdan veya yeni cihazdan giriş denemesinde otomatik olarak ek doğrulama isteniyor.</p>

<h4>Network Firewall İyileştirmeleri</h4>
<p>DSM dahili güvenlik duvarı coğrafi IP bloklama özelliğiyle güçlendirildi. Türkiye dışından gelen yönetim erişimini tek tıkla kısıtlamak mümkün.</p>

<h2>DSM Sürüm Güncelleme Rehberi</h2>

<h3>Güncelleme Öncesi</h3>
<ol>
  <li><strong>Hyper Backup ile tam yedek alın</strong> — güncelleme sonrası sorun yaşanırsa geri dönüş için</li>
  <li>Yüklü paketlerin DSM 7.2 uyumluluğunu kontrol edin (Synology Paket Merkezi'nden)</li>
  <li>RAID/SHR dizisi sağlıklı mı kontrol edin: Depolama Yöneticisi > Depolama Havuzu</li>
  <li>UPS bağlantısı varsa güncelleme sırasında aktif olduğundan emin olun</li>
</ol>

<h3>Güncelleme Sonrası Doğrulama</h3>
<ul>
  <li>Hyper Backup görevleri çalışıyor mu?</li>
  <li>Active Backup yedekleme planları aktif mi?</li>
  <li>Surveillance Station kamera bağlantıları sorunsuz mu?</li>
  <li>SMB/NFS paylaşımlarına erişim sağlanıyor mu?</li>
  <li>Synology Drive senkronizasyonu çalışıyor mu?</li>
</ul>

<h2>Sonuç</h2>
<p>DSM 7.2, immutable snapshot ve gelişmiş SMB performansı ile kurumsal NAS altyapısı için belirgin bir adım oldu. Özellikle ransomware koruması ve uyumluluk gereksinimleri açısından WORM desteği kritik önem taşıyor. Lider Network olarak Synology NAS kurulumu, DSM yapılandırması ve yedekleme tasarımında uzman desteği sunuyoruz.</p>
    `,
  },

  {
    slug: "synology-beestation-kisisel-kurumsal-bulut-depolama",
    title: "Synology BeeStation: NAS'ı Olmayan Kullanıcılar İçin Kişisel Bulut",
    excerpt:
      "Synology BeeStation, kurulum gerektirmeyen, Synology C2 destekli kişisel bulut depolama çözümüdür. KOBİ ve bireysel kullanıcılar için Google Drive alternatifi, farka ve avantajları.",
    category: "synology",
    categoryColor: "#B5121B",
    tags: ["Synology BeeStation", "Kişisel Bulut", "C2 Storage", "NAS Alternatifi", "Google Drive Alternatifi", "Synology"],
    publishedAt: "2026-07-04",
    readTime: 7,
    content: `
<h2>BeeStation Nedir?</h2>
<p><strong>Synology BeeStation</strong>, geleneksel NAS cihazlarının karmaşık kurulum ve yönetim süreçleri olmadan kişisel bulut depolama sunan yeni nesil bir Synology ürünüdür. Teknik bilgisi olmayan kullanıcılar veya IT altyapısına yatırım yapmak istemeyen KOBİ'ler için ideal bir çözümdür.</p>

<h2>Geleneksel NAS ile Farkı</h2>
<table>
  <thead><tr><th>Özellik</th><th>Synology NAS</th><th>BeeStation</th></tr></thead>
  <tbody>
    <tr><td>Kurulum süreci</td><td>DSM kurulumu, disk yapılandırması</td><td>Tak-çalıştır (5 dakika)</td></tr>
    <tr><td>Teknik gereksinim</td><td>Orta-ileri</td><td>Minimum</td></tr>
    <tr><td>Genişletilebilirlik</td><td>Yüksek (disk, bellek, paketler)</td><td>Sınırlı (tek disk)</td></tr>
    <tr><td>Uygulama ekosistemi</td><td>Surveillance, Drive, Backup vb.</td><td>Dosya depolama odaklı</td></tr>
    <tr><td>Hedef kitle</td><td>KOBİ, kurumsal</td><td>Bireysel, küçük ekip</td></tr>
    <tr><td>Fiyat</td><td>Cihaz + disk ayrı</td><td>Dahili disk, all-in-one</td></tr>
  </tbody>
</table>

<h2>Teknik Özellikler</h2>
<p>BeeStation'ın donanım özellikleri:</p>
<ul>
  <li><strong>Depolama:</strong> Dahili 4TB HDD (BST150-4T modeli)</li>
  <li><strong>Bağlantı:</strong> 1GbE LAN + Wi-Fi (Wi-Fi 5)</li>
  <li><strong>Güç tüketimi:</strong> Standby'da çok düşük, otomatik uyku modu</li>
  <li><strong>Erişilebilirlik:</strong> iOS ve Android uygulamaları üzerinden her yerden</li>
  <li><strong>Bulut yedekleme:</strong> Synology C2 ile otomatik yedekleme seçeneği</li>
</ul>

<h2>BeeStation Nasıl Çalışır?</h2>

<h3>Kurulum Süreci</h3>
<ol>
  <li>BeeStation'ı prize takın ve modeme bağlayın</li>
  <li>Bee mobil uygulamasını indirin</li>
  <li>QR kodu tarayarak cihazı eşleştirin</li>
  <li>Synology hesabıyla oturum açın</li>
  <li>Kullanmaya başlayın — tamamdır</li>
</ol>

<p>Port yönlendirme, DDNS, SSL sertifikası gibi teknik adımlar gerektirmez. Synology'nin QuickConnect altyapısı uzaktan erişimi otomatik olarak yönetir.</p>

<h3>Temel Özellikler</h3>
<ul>
  <li><strong>Otomatik fotoğraf senkronizasyonu:</strong> Telefon kamerasından çekilen fotoğraflar anında BeeStation'a yüklenir</li>
  <li><strong>Dosya paylaşımı:</strong> Link oluşturarak dosya ve klasörleri paylaşın</li>
  <li><strong>Çoklu kullanıcı:</strong> Aile üyeleri veya küçük ekip için birden fazla hesap</li>
  <li><strong>Bilgisayar yedekleme:</strong> Windows ve macOS için otomatik yedekleme</li>
  <li><strong>C2 Cloud entegrasyonu:</strong> Synology C2 Storage ile 3-2-1 yedekleme kuralını uygulama</li>
</ul>

<h2>BeeStation'ın KOBİ İçin Kullanım Senaryoları</h2>

<h3>Senaryo 1: Küçük Ofis Dosya Paylaşımı</h3>
<p>5-10 kişilik bir ekip için NAS'a yatırım yapmadan merkezi dosya depolama ve paylaşım altyapısı. Her çalışan Bee uygulamasıyla dosyalara erişebilir, yönetici paylaşım izinlerini kontrol eder.</p>

<h3>Senaryo 2: Ofis Dışı Çalışanlar İçin Dosya Erişimi</h3>
<p>Sık seyahat eden veya uzaktan çalışan personelin ofis dosyalarına güvenli erişimi. VPN gerektirmez, Synology'nin kendi güvenli tünel altyapısı kullanılır.</p>

<h3>Senaryo 3: Muhasebe Kayıtları Arşivleme</h3>
<p>Fatura, sözleşme ve mali kayıtların düşük maliyetle uzun süreli depolanması. C2 yedekleme ile ikinci kopya otomatik olarak bulutta tutulur.</p>

<h2>BeeStation vs Google Drive / OneDrive</h2>
<table>
  <thead><tr><th>Özellik</th><th>BeeStation</th><th>Google Drive / OneDrive</th></tr></thead>
  <tbody>
    <tr><td>Aylık maliyet</td><td>Tek seferlik cihaz alımı</td><td>Kullanıcı başına aylık ücret</td></tr>
    <tr><td>Veri gizliliği</td><td>Veriler kendi cihazınızda</td><td>Üçüncü taraf sunucuları</td></tr>
    <tr><td>Depolama sınırı</td><td>4TB (cihaz kapasitesi)</td><td>Pakete göre değişken</td></tr>
    <tr><td>KVKK uyumu</td><td>Kolay (yerelde veri)</td><td>Ek düzenleme gerekebilir</td></tr>
    <tr><td>İnternet bağımlılığı</td><td>LAN'da internet olmadan da erişim</td><td>Her zaman internet gerekli</td></tr>
  </tbody>
</table>

<h2>Sonuç</h2>
<p>Synology BeeStation, geleneksel NAS'ın güvenilirliğini kurumsal olmayan kullanıcılara açan akıllı bir üründür. Bulut abonelik maliyetlerinden kaçınmak isteyen, veri gizliliğine önem veren ve kurumsal NAS yönetimine ihtiyaç duymayan küçük işletmeler için güçlü bir alternatif sunar. Lider Network olarak BeeStation danışmanlığı ve kurulumunda yanınızdayız.</p>
    `,
  },

  {
    slug: "fortideceptor-nedir-aldatma-tabanli-tehdit-tespiti",
    title: "FortiDeceptor Nedir? Saldırganları Tuzağa Düşüren Aldatma Teknolojisi",
    excerpt:
      "FortiDeceptor, ağınızda sahte varlıklar (decoy) oluşturarak saldırganları tuzağa çeken ve lateral movement'ı gerçek zamanlı tespit eden Fortinet'in aldatma tabanlı güvenlik platformudur. Honeypot'tan farkı, kurumsal entegrasyonu ve nasıl çalıştığı.",
    category: "fortigate-ngfw",
    categoryColor: "#EE3124",
    tags: ["FortiDeceptor", "Deception Technology", "Honeypot", "Lateral Movement", "Fortinet", "Siber Güvenlik", "Tehdit Tespiti", "Security Fabric"],
    publishedAt: "2026-07-09",
    readTime: 11,
    featured: false,
    content: `
<h2>FortiDeceptor Nedir?</h2>
<p><strong>FortiDeceptor</strong>, Fortinet'in <em>aldatma tabanlı tehdit tespiti (deception technology)</em> platformudur. Ağınızın içine gerçekmiş gibi görünen sahte sunucular, iş istasyonları, ağ cihazları ve kimlik bilgileri yerleştirerek saldırganları bu tuzaklara çeker. Bir saldırgan bu sahte varlıklarla etkileşime geçtiği anda — henüz gerçek bir zarar vermeden — anında tespit edilir ve otomatik yanıt tetiklenir.</p>

<p>Geleneksel güvenlik araçları (firewall, IPS, EDR) <strong>bilinen tehditleri engeller</strong>. FortiDeceptor ise farklı bir strateji izler: <strong>bilinmeyen saldırganları aktif olarak avlar</strong>. Çünkü meşru bir kullanıcının sahte varlıklara erişmesi için hiçbir nedeni yoktur — etkileşim başlı başına bir tehdit göstergesidir.</p>

<h2>Geleneksel Honeypot ile Farkı</h2>
<table>
  <thead><tr><th>Özellik</th><th>Eski Nesil Honeypot</th><th>FortiDeceptor</th></tr></thead>
  <tbody>
    <tr><td>Kurulum karmaşıklığı</td><td>Manuel, zaman alıcı</td><td>Merkezi yönetim, şablon tabanlı</td></tr>
    <tr><td>Ölçeklenebilirlik</td><td>Sınırlı</td><td>Binlerce decoy, çoklu VLAN</td></tr>
    <tr><td>Entegrasyon</td><td>İzole çalışır</td><td>Security Fabric, FortiGate, FortiSIEM</td></tr>
    <tr><td>Otomatik yanıt</td><td>Yok</td><td>Otomatik karantina, politika bloklama</td></tr>
    <tr><td>Decoy türleri</td><td>Genellikle tek tip (SSH/HTTP)</td><td>Windows, Linux, IoT, OT, ICS, SCADA</td></tr>
    <tr><td>Sahte kimlik bilgileri</td><td>Yok</td><td>Active Directory breadcrumb desteği</td></tr>
    <tr><td>Fidye yazılımı tespiti</td><td>Çok sınırlı</td><td>Özel ransomware decoy'ları</td></tr>
  </tbody>
</table>

<h2>FortiDeceptor Nasıl Çalışır?</h2>

<h3>1. Decoy (Sahte Varlık) Oluşturma</h3>
<p>FortiDeceptor, gerçek ağınızın bir kopyasını simüle eder. Sahte varlıklar (decoy) şunları içerebilir:</p>
<ul>
  <li><strong>Sahte sunucular:</strong> Windows Server, Linux, web server, veritabanı sunucusu</li>
  <li><strong>Sahte ağ cihazları:</strong> Router, switch, IP kamera, yazıcı simülasyonları</li>
  <li><strong>OT/ICS/SCADA decoy'ları:</strong> Endüstriyel kontrol sistemleri simülasyonu</li>
  <li><strong>Sahte kimlik bilgileri (breadcrumb):</strong> Gerçek iş istasyonlarına yerleştirilen sahte şifreler, kayıtlı RDP bağlantıları, tarayıcı geçmişi — saldırgan bunları kullanmaya çalışınca yakalanır</li>
  <li><strong>Ransomware decoy dosyaları:</strong> Fidye yazılımlarının şifrelemeye başladığı anda tetiklenen sahte dosyalar</li>
</ul>

<h3>2. Breadcrumb (Ekmek Kırıntısı) Teknolojisi</h3>
<p>FortiDeceptor'ın en güçlü özelliklerinden biri <strong>breadcrumb</strong> desteğidir. Gerçek iş istasyonlarına ve sunuculara sahte iz bilgileri yerleştirilir:</p>
<ul>
  <li>Tarayıcıda kayıtlı sahte şifreler (FortiDeceptor'a işaret eder)</li>
  <li>Windows Credential Manager'da sahte domain hesabı</li>
  <li>Ağ sürücüsü olarak eşlenmiş sahte paylaşım klasörü</li>
  <li>SSH known_hosts dosyasında sahte sunucu girişleri</li>
</ul>
<p>Saldırgan çalışan bir bilgisayarı ele geçirdiğinde bu breadcrumb'ları keşfeder ve FortiDeceptor tuzağına yönlendirilir.</p>

<h3>3. Tespit ve Otomatik Yanıt</h3>
<p>Bir saldırgan decoy ile etkileşime geçtiği anda:</p>
<ol>
  <li>FortiDeceptor gerçek zamanlı alarm üretir</li>
  <li>Saldırganın IP, MAC adresi, kullanıcı adı ve davranışı loglanır</li>
  <li>Security Fabric entegrasyonu ile FortiGate'e otomatik karantina komutu gönderilir</li>
  <li>FortiSIEM/FortiAnalyzer'a olay kaydı iletilir</li>
  <li>E-posta, SMS veya webhook ile güvenlik ekibi uyarılır</li>
</ol>

<h2>Hangi Tehditleri Tespit Eder?</h2>

<h3>Lateral Movement (Yanal Hareket)</h3>
<p>Saldırganların ağ içinde bir sistemden diğerine geçme sürecini tespit etmek, geleneksel araçlarla son derece zordur. FortiDeceptor, saldırganın decoy'a ilk dokunuşunda lateral movement'ı yakalar — gerçek bir zarar vermeden önce.</p>

<h3>Ransomware Erken Uyarısı</h3>
<p>Fidye yazılımları sistematik olarak dosyaları tarar ve şifreler. FortiDeceptor'ın yerleştirdiği sahte dosya dizinleri, ransomware aktivitesini ilk saniyelerinde tespit eder. Güvenlik ekibi diğer sistemler etkilenmeden önce müdahale edebilir.</p>

<h3>Kimlik Bilgisi Hırsızlığı</h3>
<p>Pass-the-Hash, Kerberoasting ve AD credential dumping saldırıları breadcrumb'lar sayesinde anında yakalanır.</p>

<h3>OT/ICS Saldırıları</h3>
<p>Endüstriyel ortamlarda SCADA ve PLC sistemlerini taklit eden decoy'lar, bu kritik altyapılara yönelik saldırıları güvenli şekilde tespit eder.</p>

<h2>Deployment Modelleri</h2>

<h3>Donanım Appliance</h3>
<ul>
  <li><strong>FDC-100G:</strong> Küçük ve orta ölçekli işletmeler için, 1GbE portlu kompakt form</li>
  <li><strong>FDC-1000G:</strong> Kurumsal ortamlar, yüksek yoğunluklu decoy kapasitesi</li>
</ul>

<h3>Sanal Makine (VM)</h3>
<p>VMware vSphere, Microsoft Hyper-V ve KVM üzerinde sanal appliance olarak kurulabilir. Mevcut sanallaştırma altyapısına entegre edilebilir.</p>

<h3>Çoklu Segment Desteği</h3>
<p>FortiDeceptor, tek bir yönetim noktasından onlarca VLAN segmentine decoy dağıtabilir. Her VLAN için ayrı decoy profili tanımlanabilir: örneğin IT ağında Windows Server, OT ağında PLC simülasyonu.</p>

<h2>Security Fabric Entegrasyonu</h2>
<p>FortiDeceptor, Fortinet Security Fabric'in kritik bir parçasıdır:</p>
<ul>
  <li><strong>FortiGate:</strong> Tespit edilen saldırgan IP'si otomatik olarak engellenir veya karantinaya alınır</li>
  <li><strong>FortiAnalyzer:</strong> Tüm decoy etkileşimleri merkezi log yönetimine iletilir</li>
  <li><strong>FortiSIEM:</strong> SIEM korelasyon kurallarına FortiDeceptor olayları dahil edilir</li>
  <li><strong>FortiSOAR:</strong> Playbook otomasyonu ile müdahale süreci otomatikleştirilir</li>
  <li><strong>FortiEDR:</strong> Uç nokta tespiti ile FortiDeceptor alarmları çapraz korelasyon</li>
</ul>

<h2>Kurumsal Kullanım Senaryoları</h2>

<h3>Senaryo 1: Fidye Yazılımı Erken Uyarı Sistemi</h3>
<p>Dosya sunucularına ve kritik iş istasyonlarına sahte dizinler ve dosyalar eklenir. Ransomware bu dosyaları şifrelemeye başladığı anda alarm tetiklenir, etkilenen sistem izole edilir.</p>

<h3>Senaryo 2: İçeriden Tehdit Tespiti</h3>
<p>Yetkili bir kullanıcının erişmesi için hiçbir meşru nedeni olmayan decoy'lar, insider threat senaryolarında kritik kanıt üretir.</p>

<h3>Senaryo 3: Penetrasyon Testi Sınır Belirleme</h3>
<p>Pentest ekipleri için de değerli — saldırganların ağda ne kadar ilerlediğini ve hangi sistemlere ulaştığını somut olarak gösterir.</p>

<h2>Kimler Kullanmalı?</h2>
<p>FortiDeceptor özellikle şu sektörler için kritiktir:</p>
<ul>
  <li><strong>Finans ve bankacılık:</strong> BDDK uyumu ve APT koruması</li>
  <li><strong>Sağlık:</strong> HIPAA uyumu, hasta verisi koruması</li>
  <li><strong>Üretim/OT:</strong> SCADA ve ICS sistemleri koruması</li>
  <li><strong>Kamu kurumları:</strong> Devlet ağlarında APT tespiti</li>
  <li><strong>Kritik altyapı:</strong> Enerji, telekomünikasyon, ulaşım</li>
</ul>

<h2>Sonuç</h2>
<p>FortiDeceptor, güvenlik mimarisindeki en kritik boşluğu kapatır: <strong>ağ içine sızmış saldırganın tespiti</strong>. Firewall saldırganı dışarıda tutar; ama içeri girdiğinde FortiDeceptor onu yakalar. Sıfır yanlış pozitif alarmı, gerçek zamanlı müdahale ve Security Fabric entegrasyonu ile kurumsal güvenlik olgunluk seviyesini bir üst basamağa taşır.</p>
<p>Lider Network olarak FortiDeceptor tasarımı, decoy stratejisi ve Security Fabric entegrasyonunda danışmanlık hizmeti sunuyoruz.</p>
    `,
  },

  {
    slug: "fortinet-automation-stitch-otomatik-guvenlik-yaniti",
    title: "Fortinet Automation Stitch: FortiGate'te Olaylara Otomatik Yanıt",
    excerpt:
      "FortiOS Automation Stitch, güvenlik olaylarına otomatik yanıt vermenizi sağlar. Yüksek CPU alarmından IP karantinasına, interface down bildiriminden webhook tetiklemesine kadar kurumsal otomasyon senaryoları ve yapılandırma rehberi.",
    category: "fortigate-ngfw",
    categoryColor: "#EE3124",
    tags: ["Automation Stitch", "FortiGate", "FortiOS", "Güvenlik Otomasyonu", "SOAR", "Webhook", "IP Karantina", "Fortinet"],
    publishedAt: "2026-07-09",
    readTime: 10,
    content: `
<h2>Automation Stitch Nedir?</h2>
<p><strong>Automation Stitch</strong>, FortiOS'un yerleşik otomasyon motorudur. "Eğer X olayı gerçekleşirse, Y aksiyonunu otomatik olarak gerçekleştir" mantığıyla çalışır. Güvenlik ekiplerinin manuel müdahale etmek zorunda kaldığı tekrarlayan görevleri otomatikleştirir ve olay müdahale süresini (MTTR) dramatik biçimde düşürür.</p>

<p>Dış bir SOAR platformu gerektirmez — FortiGate'in kendisinde yerleşik gelir. FortiOS 6.2 ve üzeri tüm modellerde kullanılabilir.</p>

<h2>Automation Stitch Mimarisi</h2>
<p>Her Automation Stitch iki temel bileşenden oluşur:</p>

<h3>Trigger (Tetikleyici)</h3>
<p>Hangi olay gerçekleştiğinde otomasyon devreye girecek?</p>
<ul>
  <li><strong>FortiOS Event Log:</strong> Belirli log kategorisi ve seviyesinde (örn: IPS kritik alarm)</li>
  <li><strong>IOC (Indicator of Compromise):</strong> FortiGuard tarafından tehdit olarak işaretlenen IP/domain ile iletişim</li>
  <li><strong>Security Rating:</strong> Güvenlik skoru belirli bir eşiğin altına düştüğünde</li>
  <li><strong>Interface Status:</strong> Bir WAN bağlantısı koptuğunda</li>
  <li><strong>CPU/Memory Threshold:</strong> Kaynak kullanımı kritik seviyeye ulaştığında</li>
  <li><strong>Compromised Host:</strong> FortiGuard'ın botnet veritabanındaki bir host iç ağda tespit edildiğinde</li>
  <li><strong>Schedule:</strong> Belirli zamanlarda düzenli olarak (cron benzeri)</li>
</ul>

<h3>Action (Aksiyon)</h3>
<p>Tetikleyici devreye girdiğinde ne yapılacak?</p>
<ul>
  <li><strong>Email:</strong> Güvenlik ekibine e-posta bildirimi</li>
  <li><strong>SMS:</strong> Telefon bildirimi (FortiGate SMS gateway ile)</li>
  <li><strong>Webhook:</strong> Harici sisteme HTTP POST — Slack, Teams, Jira, PagerDuty vb.</li>
  <li><strong>CLI Script:</strong> FortiGate CLI komutları çalıştırma</li>
  <li><strong>Quarantine IP:</strong> Kötü amaçlı IP'yi otomatik karantinaya alma</li>
  <li><strong>FortiQuarantine:</strong> Uç noktayı ağdan izole etme (NAC)</li>
  <li><strong>AWS Lambda / Azure Function:</strong> Bulut fonksiyon tetikleme</li>
  <li><strong>Slack / MS Teams:</strong> Anlık mesajlaşma bildirimi</li>
</ul>

<h2>Pratik Kullanım Senaryoları</h2>

<h3>Senaryo 1: Kötü Amaçlı IP Otomatik Karantina</h3>
<p>IPS veya FortiGuard tehdit akışı bir IP'yi kötü amaçlı olarak tespit ettiğinde, sistem beklemeden otomatik engelleme yapar.</p>

<p><strong>GUI Yapılandırması:</strong></p>
<p>Security Fabric → Automation → Create New</p>
<ul>
  <li><strong>Trigger:</strong> FortiOS Event Log → Log Filter: IPS, Severity: Critical</li>
  <li><strong>Action:</strong> Quarantine IP</li>
</ul>

<p><strong>CLI Yapılandırması:</strong></p>
<pre><code>config system automation-trigger
  edit "IPS-Critical-Trigger"
    set event-type event-log
    set logtype ips
    set log-search-filter "severity=critical"
  next
end

config system automation-action
  edit "Quarantine-Attacker-IP"
    set action-type quarantine-ip
    set duration 3600
  next
end

config system automation-stitch
  edit "IPS-Auto-Quarantine"
    set trigger "IPS-Critical-Trigger"
    config actions
      edit 1
        set action "Quarantine-Attacker-IP"
      next
    end
  next
end</code></pre>

<h3>Senaryo 2: WAN Kopunca Teams'e Bildirim</h3>
<p>WAN bağlantısı kesildiğinde Microsoft Teams kanalına otomatik mesaj gönderilir. NOC ekibi bağlantı sorununu anında öğrenir.</p>

<pre><code>config system automation-action
  edit "Teams-WAN-Alert"
    set action-type webhook
    set uri "https://outlook.office.com/webhook/YOUR-TEAMS-WEBHOOK-URL"
    set http-body '{"text": "⚠️ WAN BAĞLANTISI KESİLDİ — FortiGate: %%log.srcip%%  Zaman: %%log.date%% %%log.time%%"}'
    set headers "Content-Type: application/json"
  next
end

config system automation-trigger
  edit "WAN-Down-Trigger"
    set event-type event-log
    set logtype event
    set log-search-filter "subtype=system action=link-down"
  next
end

config system automation-stitch
  edit "WAN-Teams-Notification"
    set trigger "WAN-Down-Trigger"
    config actions
      edit 1
        set action "Teams-WAN-Alert"
      next
    end
  next
end</code></pre>

<h3>Senaryo 3: Yüksek CPU'da Otomatik Tanılama</h3>
<p>CPU kullanımı %90'ı aştığında CLI script çalışarak anlık oturum ve process bilgisini toplar, e-posta ile iletir.</p>

<pre><code>config system automation-action
  edit "CPU-Diagnose-Script"
    set action-type cli-script
    set script "
      diagnose sys top 3 30
      get system performance status
      diagnose sys session stat
    "
  next
end

config system automation-trigger
  edit "High-CPU-Trigger"
    set event-type event-log
    set logtype event
    set log-search-filter "msg=*cpu*high*"
  next
end</code></pre>

<h3>Senaryo 4: Botnet Tespitinde Uç Nokta İzolasyonu</h3>
<p>İç ağda bir cihazın botnet komuta-kontrol sunucusuyla iletişim kurduğu tespit edildiğinde, o cihaz FortiSwitch üzerinden ağdan otomatik izole edilir.</p>

<pre><code>config system automation-trigger
  edit "Compromised-Host-Trigger"
    set event-type compromised-host
  next
end

config system automation-action
  edit "FortiQuarantine-Host"
    set action-type quarantine-fortiswitch
    set duration 86400
  next
end

config system automation-stitch
  edit "Botnet-Auto-Isolate"
    set trigger "Compromised-Host-Trigger"
    config actions
      edit 1
        set action "FortiQuarantine-Host"
        set delay 0
      next
    end
  next
end</code></pre>

<h3>Senaryo 5: Günlük Güvenlik Raporu</h3>
<p>Her sabah saat 08:00'de FortiGate'in önceki gece istatistiklerini içeren özet raporu e-posta ile gönderir.</p>

<pre><code>config system automation-trigger
  edit "Daily-Report-Schedule"
    set event-type scheduled
    set schedule-type daily
    set start-time "08:00:00"
  next
end

config system automation-action
  edit "Send-Daily-Summary"
    set action-type email
    set email-to "soc@sirket.com.tr"
    set email-subject "FortiGate Günlük Güvenlik Özeti — %%log.date%%"
    set message "Önceki 24 saat özeti: Engellenen bağlantılar, IPS alarmları ve yüksek riskli olaylar için FortiAnalyzer'ı inceleyin."
  next
end</code></pre>

<h2>Değişken (Variable) Kullanımı</h2>
<p>Automation Stitch mesaj şablonlarında log alanlarına dinamik olarak erişebilirsiniz:</p>

<table>
  <thead><tr><th>Değişken</th><th>Açıklama</th></tr></thead>
  <tbody>
    <tr><td><code>%%log.srcip%%</code></td><td>Kaynak IP adresi</td></tr>
    <tr><td><code>%%log.dstip%%</code></td><td>Hedef IP adresi</td></tr>
    <tr><td><code>%%log.msg%%</code></td><td>Log mesajı</td></tr>
    <tr><td><code>%%log.severity%%</code></td><td>Alarm seviyesi</td></tr>
    <tr><td><code>%%log.date%%</code></td><td>Tarih</td></tr>
    <tr><td><code>%%log.time%%</code></td><td>Saat</td></tr>
    <tr><td><code>%%log.user%%</code></td><td>Kullanıcı adı</td></tr>
    <tr><td><code>%%log.devname%%</code></td><td>FortiGate cihaz adı</td></tr>
  </tbody>
</table>

<h2>En İyi Uygulamalar</h2>

<h3>1. Aksiyon Gecikmesi (Delay) Kullanın</h3>
<p>Özellikle karantina aksiyonlarında yanlış pozitif riskini azaltmak için kısa bir gecikme eklenebilir. 60 saniye bekleme, kritik bir iş sisteminin yanlışlıkla izole edilmesini önleyebilir.</p>

<h3>2. Test Modunda Başlayın</h3>
<p>Yeni stitch'leri önce e-posta veya webhook aksiyonuyla test edin. Karantina aksiyonuna geçmeden önce tetiklenme koşullarının doğru çalıştığını doğrulayın.</p>

<h3>3. Log Filtreleri Spesifik Tutun</h3>
<p>Çok geniş bir tetikleyici filtresi, yüksek hacimli alarm üretir. IPS için minimum severity "high" veya "critical" olarak ayarlanması önerilir.</p>

<h3>4. Stitchleri Belgeleyin</h3>
<p>Her stitch'in adında ne yaptığını belirtin: "IPS-Critical-Quarantine", "WAN-Down-Teams-Alert" gibi. Bakım ve sorun giderme sürecini kolaylaştırır.</p>

<h2>Automation Stitch ile SOAR Entegrasyonu</h2>
<p>FortiGate Automation Stitch, daha gelişmiş playbook senaryoları için FortiSOAR ile entegre çalışır. Webhook aksiyonu ile FortiSOAR'a olay gönderilir; FortiSOAR zengin playbook mantığıyla (çok adımlı karar ağaçları, harici sistem entegrasyonları) işlemi devralır.</p>

<h2>Sonuç</h2>
<p>Automation Stitch, FortiGate'i pasif bir güvenlik cihazından aktif bir yanıt motoruna dönüştürür. Güvenlik ekibinin her alarm için manuel müdahale etmek zorunda kalmadan, kritik olaylara saniyeler içinde otomatik yanıt verilmesini sağlar. Lider Network olarak Automation Stitch tasarımı, senaryo geliştirme ve SOAR entegrasyonunda danışmanlık hizmeti sunuyoruz.</p>
    `,
  },

];

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getPostsByCategory(category: string): BlogPost[] {
  if (category === "tumu") return posts;
  return posts.filter((p) => p.category === category);
}

export function getFeaturedPost(): BlogPost | undefined {
  return posts.find((p) => p.featured);
}

export function getRelatedPosts(slug: string, limit = 3): BlogPost[] {
  const current = getPost(slug);
  if (!current) return [];
  return posts
    .filter((p) => p.slug !== slug && p.category === current.category)
    .slice(0, limit);
}
