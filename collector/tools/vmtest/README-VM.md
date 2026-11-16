# LIDER IT ONE – izole VM test paketi

Bu paket **yalnızca test VM'inde** çalışır. Üretim CA'sından bağımsız, bu test için üretilmiş bir PKI'a ve ayrı bir test sunucusuna güvenir. Üretim sunucusuna kayıt olamaz, üretim güncellemelerini kabul etmez.

## VM gereksinimleri
| | |
|---|---|
| Windows | 10/11 Pro 64-bit (MIKRO-PC ile aynı sürüm tercih edilir), güncel, temiz kurulum |
| Kaynak | 2 vCPU, 4 GB RAM, 60 GB disk (thin) |
| Üyelik | **Workgroup. Domain'e katılmaz** (betik domain üyesi makinede durur) |
| Hesap | Yerel yönetici. PowerShell 5.1 (Windows'ta hazır) |
| Ağ | Üretimden ayrı VLAN / izole port grubu. Çıkış yalnızca test sunucusuna: **TCP 18080 (HTTP + CRL)** ve **TCP 18443 (HTTPS)**. İnternet gerekmez |
| Saat | Sunucuyla en fazla 2 dk fark (sertifika ve CRL geçerliliği saate bağlı) |
| Defender | Açık kalabilir |

Bu paket MIKRO-PC'de, müşteri makinelerinde veya domain'e bağlı bir makinede **çalıştırılmaz**: betik bunu denetler ve durur.

## Anlık görüntüler (snapshot) – bunları siz alırsınız
1. **S0** – temiz Windows, Collector kurulu değil. *İlk çalıştırmadan önce alın.*
2. **S1** – `Baseline` senaryosundan sonra (Collector 1.3.0 kurulu ve test sunucusuna kayıtlı). Betik "şimdi alın" der.
3. **S2** – `ManualUpgrade` ve `Https` senaryolarından sonra (Collector 1.4.0, HTTPS, özel test CA). Betik "şimdi alın" der.

Her senaryodan sonra betik hangi snapshot'a dönmeniz gerektiğini yazar. Sonuç defteri **test sunucusunda** tutulur; snapshot'a dönmek sonuçları silmez.

## Çalıştırma (hep aynı komut)
Yönetici PowerShell'de, paketi açtığınız klasörde:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Run-VmTestSuite.ps1
```
Betik VM'in hangi durumda olduğunu bulur, sıradaki senaryoyu çalıştırır, sonucu `C:\LiderVmTest\results` klasörüne ve test sunucusuna yazar.

Diğer kullanım: `-List` (senaryolar ve defter), `-Check` (yalnızca ön kontrol, hiçbir şey değiştirmez), `-Scenario <ad>` (tek senaryo), `-Yes` (onay sormaz).

## Senaryolar
| Ad | Durum | Ne kanıtlar |
|---|---|---|
| Baseline | S0 | 1.3.0 test sunucusundan kurulur, kayıt olur; kuyruğa işaretçi yazılır |
| ManualUpgrade | S1 | Gerçek MSI ile servis yükseltmesi 1.3.0→1.4.0; kimlik ve SQLite kuyruğu korunur |
| ManualInstallFails | S1 | Kurulumu başarısız MSI: geri alma, kimlik + kuyruk korunur |
| ManualUnhealthy | S1 | Yeni sürüm sunucuya ulaşamaz: otomatik geri alma |
| Https | S1b | Özel test CA ile HTTPS'e geçiş (Windows deposuna sertifika eklenmez) |
| TlsRevoked / TlsExpiredCrl / TlsCrlUnreachable | S2 | İptal / süresi dolmuş / ulaşılamayan CRL: Collector sunucuyla konuşmaz (fail closed), CRL düzelince kendiliğinden döner |
| UpdateHappy | S2 | Gerçek serviste otomatik güncelleme 1.4.0→1.4.1; Windows Installer servisi durdururken updater yaşar |
| UpdateKillUpdater | S2 | Updater süreci güncelleme ortasında öldürülür: watchdog toparlar |
| UpdateRebootInstalling / UpdateRebootHealth | S2 | Windows güncelleme sırasında yeniden başlatılır (betik açılışta kendini sürdürür) |
| UpdateUnhealthy | S2 | Yeni sürüm check-in yapamaz: otomatik rollback, sunucuya raporlanır |
| UpdateFaultInstall | S2 | MSI kurulum sırasında başarısız: 1.4.0 kalır, tekrar döngüsü yok |
| UpdateRollbackFails | S2 | Geri alma mümkün değil: dürüst `rollback_failed`, kimlik dokunulmaz |
| UpdateCrlRevokedSigner | S2 | İmza sertifikası iptal edildi: güncelleme reddedilir |
| UpdateCrlUnavailable | S2 | CRL süresi dolmuş/ulaşılamaz iken güncelleme teklifi: hiçbir şey kurulmaz |
| UpdateInstallerBusy | S2 | Windows Installer meşgul: kurulum denenmez |

## Her senaryoda otomatik denetlenenler
Servis çalışıyor mu · `collector_id`, BIOS UUID, sunucu adresi ve DPAPI anahtar deposu (`secure.dat`) aynı mı · `queue.db` bütün mü (`PRAGMA integrity_check`) ve içine yazılan özel işaretçi satırları duruyor mu (kuyruk sıfırlanmış/yeniden oluşturulmuşsa kaybolur) · updater/journal artığı var mı · test sunucusundaki güncelleme kaydı · sunucuda tek Collector kaydı var mı.

## Sorun giderme
* `[STOP] ... test server does not answer` → VM'den `192.168.20.61:18080` / `:18443` erişimini ve VM saatini kontrol edin.
* Betik yarıda kesilirse güvenlidir: yeniden çalıştırın; güvenlik duvarı kuralı `LIDER-VMTEST-block-server` her çıkışta kaldırılır (kalırsa: `Get-NetFirewallRule -DisplayName LIDER-VMTEST-block-server | Remove-NetFirewallRule`).
* Bu paket Collector'ı **yalnızca** kendi test sunucusuna bağlar. `server_url` başka bir adrese ayarlanırsa test derlemesi çalışmayı reddeder.
