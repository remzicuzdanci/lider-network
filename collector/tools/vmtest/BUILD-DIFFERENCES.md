# Test-PKI derlemesi ile üretim derlemesi arasındaki farklar

**Test derlemesinin başarılı olması, üretim derlemesinin doğrulandığı anlamına gelmez.** Üretim 1.4.0 dondurulup üretim sertifikasıyla imzalandıktan sonra ayrıca doğrulanır (aşağıda "Üretim imzası için ayrı doğrulama").

## Kodda tam olarak ne değişiyor
Tek kaynak ağacı, tek derleme anahtarı: `-p:LiderTestPkiDir=<test PKI build klasörü>`. Anahtar verilmezse üretim derlemesi çıkar (`LIDER_TESTPKI` sembolü yok).

| # | Yer | Üretim derlemesi | Test-PKI derlemesi |
|---|---|---|---|
| 1 | `Update/UpdateRuntime.cs` – `UpdatePolicy.SignerSha1` | `83739ABF…BA71F` (LIDER Collector Code Signing) | test imzacının parmak izi (`TestBuildPins.g.cs`) |
| 2 | `Update/UpdateRuntime.cs` – `UpdatePolicy.RootSha256` | `21E94EC9…33E2` (LIDER Internal Root CA) | test kökün SHA-256'sı |
| 3 | Gömülü açık sertifikalar (`pki.lider-root-ca.pem`, `pki.update-signing-cert.pem`) | `Update\pki\*.pem` (üretim) | test kök + test imzacı (`test-root-ca.pem`, `test-update-signing-cert.pem`) |
| 4 | `Update/TestBuild.cs` – `TestBuild.Is` / `ServerAllowed` | `Is = false`, `ServerAllowed` her zaman `true` (eski davranış) | `Is = true`; yalnızca `AllowedHosts` listesindeki sunucuya izin (192.168.20.61 ve vmtest.uci.local) |
| 5 | `CollectorWorker.cs` (3 nokta: `TransportAllowed`, bootstrap kaydı, açılış günlüğü) | üretimde `ServerAllowed` hep `true` → davranış değişmez | listede olmayan sunucu → **kayıt olmaz, kimlik/envanter göndermez**, kritik günlük; açılışta "TEST-PKI BUILD" uyarısı |
| 6 | `InformationalVersion` | `1.4.0+<git>` | `1.4.0+testpki.<git>` |
| 7 | MSI (yalnızca `-FaultInstall` varyantı) | – | kurulum sonunda kasıtlı başarısız `LiderFaultCA`; `-TestPkiDir` olmadan **derlenmez** (betik reddeder) |

Aynı kalanlar: updater, watchdog, journal, MSI imzası + SHA-256 + Authenticode + iptal (CRL) denetimleri, HTTPS-only güncelleme, TLS özel-CA doğrulayıcısı (`CustomRootTrust`, çevrimiçi CRL, ad uyuşmazlığı reddi), kuyruk/kimlik kodu, MSI tablo yapısı, servis tanımı. Yani sınanan davranış, üretim koduyla **aynı yollar**dır; farklı olan yalnızca güven çapaları ve sunucu izin listesidir.

## Kanıtlar (bu çalışmada gözlenen)
* Üretim exe'si: üretim imzacı ve kök parmak izleri **var**; test parmak izi, test izin listesi ve "TEST-PKI BUILD" metni **yok**; MSI özel eylemleri `LiderBootstrapCA, LiderRollbackLogCA, LiderCommitLogCA` (hata eylemi yok). 234 birim testi geçti.
* Test exe'si: test imzacı/kök/izin listesi **var**; üretim imzacı ve kök parmak izleri **yok** (`Build-TestPkiMsi.ps1` bunu her derlemede otomatik doğrular, aksi halde durur).
* `TestBuildPolicyTests`: 13 test (yalnızca listedeki sunucular, benzer-ad sahteciliği, boş liste, üretim derlemesinde `Is=false`).

## Test derlemesinin KANITLAMADIĞI şeyler
1. Üretim sertifikasıyla imzalanmış gerçek 1.4.0 paketinin imzası, zinciri, iptal durumu ve parmak izi eşleşmesi.
2. Üretim CA'sının CRL'si ve CDP adresleri (test CRL'si başka adreste, başka kökten).
3. Üretim sunucusunun nginx/HTTPS yapılandırması, sertifikası ve alan adı (`liderone.uci.local`); test sunucusu IP + 18443 portunda Python TLS ağ geçididir.
4. Üretim veritabanı/veri hacmi; test veritabanı küçüktür.
5. Gerçek müşteri ağı: proxy, güvenlik yazılımı, GPO.
6. Test PKI'ında yok olanlar: zaman damgası (timestamp), üretim imzacısının geçerlilik tarihi.

## Üretim imzası için ayrı doğrulama (testler bittikten sonra, imzalamadan sonra)
`Verify-SignedMsi.ps1` + `Check-SigningTrust.ps1` ile: Authenticode durumu, imzacı = üretim parmak izi, zincir = üretim kök SHA-256, CRL erişimi ve iptal yok, MSI `ProductVersion/UpgradeCode`, `SHA-256` ve manifest imzası. Gerçek 1.4.0 üretim MSI'ı yalnızca bu doğrulama geçince pilota hazır sayılır.
