# vmtest

* **Güncel yöntem:** `Run-VmTestSuite.ps1` (tek komut) – bkz. `README-VM.md`, derleme farkları `BUILD-DIFFERENCES.md`.
* `New-TestPki.ps1`, `Build-TestPkiMsi.ps1`, `New-VmTestPackage.ps1`: build PC'de çalışır (test PKI, test imzalı MSI'lar, paket).
* `server\`: izole test sunucusu (ayrı uygulama kopyası, ayrı veritabanı, ağ geçidi).
* `Run-UpdateScenario.ps1`: eski, üretim imzası gerektiren gözlemci; **yerine geçildi**, yalnızca başvuru için duruyor.
