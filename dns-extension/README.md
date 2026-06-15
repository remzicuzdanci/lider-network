# Lider Network — DNS & Domain Checker (Chrome Eklentisi)

Adres çubuğundan tek tıkla domain sorgulama: DNS kayıtları, mail ayarları (SPF/DKIM/DMARC, Google Workspace & Microsoft 365), WHOIS, SSL ve propagasyon.

## Kurulum (geliştirici / yerel)
1. Chrome'da `chrome://extensions` adresine git
2. Sağ üstten **Geliştirici modu**'nu aç
3. **Paketlenmemiş öğe yükle** (Load unpacked) → bu `dns-extension` klasörünü seç
4. Araç çubuğunda Lider Network ikonu çıkar. Tıkla → açık olan sitenin alan adı otomatik gelir → Sorgula

## Yayınlama (Chrome Web Store)
1. Bu klasörü zip'le (manifest.json kökte olacak şekilde)
2. https://chrome.google.com/webstore/devconsole → yeni öğe → zip yükle (tek seferlik $5 geliştirici ücreti)
3. Açıklama/ekran görüntüsü ekle → yayınla

## Notlar
- API: `https://www.lidernetwork.com.tr/api/dns` (CORS açık, salt-okunur)
- Tam araç: https://dns.lidernetwork.com.tr
- Hiçbir veri toplanmaz; sorgular doğrudan Lider Network API'sine gider.
