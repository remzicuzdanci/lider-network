// Müşteri / referans logoları — hem web sitesi (referanslar) hem admin paneli kullanır.
const WIX = "https://static.wixstatic.com/media";
const wix = (h: string) => `${WIX}/${h}~mv2.png`;

export interface CustomerLogo { name: string; logo: string | null; logoBg?: string }

export const clients: CustomerLogo[] = [
  { name: "RocheBobois",               logo: wix("27bac0_228f6d4e4fee4a2ab020647ee3e48676") },
  { name: "Ankara Valiliği",           logo: wix("27bac0_7b6c905d2d9d446fa9ce2c721a84a9c5") },
  { name: "Jandarma",                  logo: wix("27bac0_89e4399b82a8467b9da820a1c435a5fe") },
  { name: "Donanma",                   logo: wix("27bac0_089616e05c624e6b839de411e4d060a8") },
  { name: "Gazi Üniversitesi",         logo: wix("27bac0_23300a17901b41c6b286c1d036e1900a") },
  { name: "KIA",                       logo: wix("27bac0_278c0b70c373420baa1b2ded159e015e") },
  { name: "ETS",                       logo: wix("27bac0_cf85b38f81cd417280de2b112c87a753") },
  { name: "Ulusoy Enerji",             logo: wix("27bac0_27e2deb68d02474694e87e0979a0216e") },
  { name: "Ulusoy Raylı Sistemler",    logo: wix("27bac0_c394af73a7ec495ba6dd3f89d9c02745") },
  { name: "Gıpta Grup",                logo: wix("27bac0_4e97c96a80d04bcb8041919b99b4f57f") },
  { name: "Panda Alüminyum",           logo: wix("27bac0_4f25be30517144fa8c172c874e986d94") },
  { name: "KSE Maden",                 logo: wix("27bac0_292f256949c6410da34f4e3e137bd7f3") },
  { name: "Universal Mine",            logo: wix("27bac0_b5f5b038565a4a3094bbb912f5c9f90a") },
  { name: "Uğur Makina",               logo: wix("27bac0_922c8bf36670403fbe5a8a5f0763de67") },
  { name: "Dsgnon",                    logo: "/logos/dsgnon.PNG" },
  { name: "Dürümle",                   logo: wix("27bac0_70e67dee7738443abb077661162e9e81") },
  { name: "Sami Ulus",                 logo: wix("27bac0_f7b66211f7594ff3b75b52de076b7655") },
  { name: "Büyükhanlı",                logo: wix("27bac0_49e16aa7ed024f91aa2d7f97c791147b") },
  { name: "Koza İnşaat",               logo: wix("27bac0_fc915c35cf6246f79f289a358eaec09d") },
  { name: "Usta İnşaat",               logo: wix("27bac0_6ebe1eb52e834abd97da95c81add56db") },
  { name: "Polgün",                    logo: wix("27bac0_9a916a62bfa240948dcf898a005ca5f7") },
  { name: "Bauxite",                   logo: wix("27bac0_b75cd9e0d02e4ebf8b63c11c22ed930a") },
  { name: "Karamehmetler",             logo: wix("27bac0_21dbc41f64b64b0bb24e840d560dde38") },
  { name: "Metalinşaat",               logo: wix("27bac0_ee1177ef12dc46f4b06c87638cfd8b9c") },
  { name: "Fransız Kültür",            logo: wix("27bac0_56b0b784b5ce4c7fa8da19bb110b3ea6") },
  { name: "Midi Hotel",                logo: wix("27bac0_73a4e4f39c2b4fdda407c18450b77d09") },
  { name: "Vilayetler Birliği",        logo: wix("27bac0_3550ed0c63cf44aba5bc0bfd0244d0c6") },
  { name: "Alo Sigortam",              logo: wix("27bac0_4c15ac71d77949e791d29a50ac013ae0") },
  { name: "MySilo",                    logo: wix("27bac0_6ba7b2b6a6d74eb3be8675a307b425ee") },
  { name: "Sonmak",                    logo: wix("27bac0_fe5fb3647c33440391964846cae56813") },
  { name: "Elektromekanik",            logo: wix("27bac0_1aa5b516ad5c46f7b06ec09d792c20c3") },
  { name: "Magnet",                    logo: wix("27bac0_bad61cb51b234bc68352e2294db2d3d4") },
  { name: "OMAY",                      logo: wix("27bac0_7e3db1510d6d4995bebf04dd92b15e09") },
  { name: "MSM",                       logo: wix("27bac0_d350191cfe1e46eea4ea86439ca34e98") },
  { name: "UCI",                       logo: wix("27bac0_deef590367e04af8887b45973e1e006c") },
  { name: "AKNET",                     logo: wix("27bac0_7f25f7f393dc472c88ac741dd4b30b30") },
  { name: "CDM",                       logo: wix("27bac0_5b1c26913feb4cb5bb8f13f805d96916") },
  { name: "DesignOn",                  logo: "https://static.wixstatic.com/media/96eab6_928f408b2e894f2f8c3c9e307c6e039c~mv2.png" },
  { name: "ENNE",                      logo: wix("27bac0_817d729a43674edb94ce21cdc8037211") },
  { name: "ARGİS",                     logo: wix("27bac0_b05f2b6b2eec4fecabd413f008df6fc9") },
  { name: "TÜMDEF",                    logo: wix("27bac0_b74fb1f8ba3b487584cc720b3f4ef2dd") },
  { name: "KCM",                       logo: wix("27bac0_6358d33df7324b96a1c91a371632fdd5") },
  { name: "Ankamall",                  logo: wix("27bac0_cdd6bd1b04ff41da897d670c07c42599") },
  { name: "MİSTAV",                    logo: wix("27bac0_45df696b80564d5997f45d33cd34629b") },
  { name: "Ultra Turizm",              logo: wix("27bac0_a3859a66ccc641c8b1b1bfd128af2d37") },
  { name: "Gürgenler",                 logo: wix("27bac0_947497c21c8c410a8c0a3c243799cfea") },
  { name: "Kırıkkale Üniversitesi",    logo: wix("27bac0_51215cbfd52541468e8498f9e50b7189") },
  { name: "Mezzaluna",                 logo: wix("27bac0_69c54261a28b4bc0a5587b21a1906edd") },
  { name: "Siber Suçlarla Mücadele",   logo: wix("27bac0_fd93ebf27976414c8c80a517ddfa0aad") },
  /* ─── Yeni referanslar ──────────────────────────────────────────────────── */
  { name: "Gala Sahne",    logo: "/logos/galasahne.PNG" },
  // Pantech, Pancast, Panab: beyaz SVG logoları → koyu arkaplan gerekli
  { name: "Pantech",       logo: "https://pantechalu.com.tr/uploads/images/logos/large/1774521249_pantech-aluminyum-logo.svg",  logoBg: "#1a3254" },
  { name: "Pancast",       logo: "https://www.pancast.com.tr/uploads/images/home-logos/large/1774519597_pancast-aluminium.svg", logoBg: "#2c3320" },
  { name: "Panab",         logo: "https://www.panabenerji.com/uploads/images/logos/large/1774523391_panab-enerji-logo.svg",     logoBg: "#0e0e0e" },
  { name: "MND Gıda",      logo: "https://www.mndgida.com.tr/wp-content/themes/v1/img/mnd-gida-logo.svg" },
  { name: "ATC-Mateks",    logo: "https://www.atc-mateks.com/img/logo.png" },
  { name: "DGN Sigorta",   logo: "https://www.dgnsigorta.com/image/cache/catalog/001/logo.fw-3171x833.png" },
  { name: "Natuzzi",       logo: "https://upload.wikimedia.org/wikipedia/commons/9/91/Natuzzi_logo.svg" },
  { name: "Reynardglobal", logo: "https://www.reynardglobal.com/wp-content/uploads/2022/10/logo.png" },
  { name: "Ada Dış Ticaret", logo: "https://www.adadisticaret.com.tr/images/logo2.png" },
  { name: "Akış Enerji",   logo: "https://www.akisenerji.com/wp-content/uploads/2024/12/logo.svg" },
  { name: "Endüstri Teknik", logo: "https://www.endustriteknik.com/wp-content/uploads/2024/08/EndTek-Website-2024.png" },
  { name: "Pergo Uzay",    logo: "https://www.pergo.com.tr/assets/uploads/643670dd48426168128943747.png" },
  { name: "Teknik Orijin", logo: "https://www.teknikorijin.com/Uploads/Original/b13aa68f08887be65735cbfc2385b025.webp" },
];

// Türkçe karakterleri sadeleştir, boşluk/noktalama at
function norm(s: string): string {
  return (s || "")
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g")
    .replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]/g, "");
}

// Elle tanımlı eşlemeler — admin firma adı (içerik) → clients listesindeki isim.
// Otomatik eşleşmeyen veya farklı isimle kayıtlı firmalar için.
const ALIASES: { key: string; client: string }[] = [
  { key: "ulusoybakir", client: "UCI" },
  { key: "uci",         client: "UCI" },
  { key: "mkg",         client: "ETS" },
  { key: "ankamall",    client: "Ankamall" },
  { key: "sodesign",    client: "DesignOn" },
  { key: "sodizayn",    client: "DesignOn" },
  { key: "designon",    client: "DesignOn" },
];

// Firma adına göre logo bul (esnek eşleşme). Bulamazsa null.
export function findCustomerLogo(name: string): CustomerLogo | null {
  if (!name) return null;
  const n = norm(name);
  if (!n) return null;
  // 0) Elle tanımlı eşleme
  for (const a of ALIASES) {
    if (n.includes(a.key)) {
      const c = clients.find(x => norm(x.name) === norm(a.client));
      if (c) return c;
    }
  }
  // 1) Birebir
  let hit = clients.find(c => norm(c.name) === n);
  if (hit) return hit;
  // 2) Biri diğerini içeriyor (en az 4 karakter ortak kök)
  hit = clients.find(c => { const cn = norm(c.name); return cn.length >= 4 && (n.includes(cn) || cn.includes(n)); });
  if (hit) return hit;
  // 3) İlk kelime eşleşmesi (ör. "Panda Alüminyum" ↔ "PANDA")
  const firstWord = norm((name.trim().split(/\s+/)[0]) || "");
  if (firstWord.length >= 4) {
    hit = clients.find(c => { const cw = norm((c.name.trim().split(/\s+/)[0]) || ""); return cw.length >= 4 && (cw === firstWord || cw.includes(firstWord) || firstWord.includes(cw)); });
    if (hit) return hit;
  }
  return null;
}

/** Bir firmanın logosu: önce firma kaydındaki logo_url (override), yoksa isim eşlemesi. */
export function companyLogo(company?: { name?: string | null; logo_url?: string | null } | null): { logo: string; logoBg?: string } | null {
  if (company?.logo_url) return { logo: company.logo_url };
  const m = company?.name ? findCustomerLogo(company.name) : null;
  return m?.logo ? { logo: m.logo, logoBg: m.logoBg } : null;
}
