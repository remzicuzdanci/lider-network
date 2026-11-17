# Collector 1.4.4 — pilot preparation (nothing installed, nothing published)

## What is in 1.4.4
| Change | Origin |
|---|---|
| Windows Update **last scan date** read from the supported API (WUA `Microsoft.Update.AutoUpdate` → `Results.LastSearchSuccessDate`), legacy registry value as fallback; payload now also carries `last_scan_source` (`wua_autoupdate` / `registry_detect` / `none`) and `last_scan_status` (`ok` / `never_scanned` / `unavailable` / `error`). Never estimated; an installed-update date is never used as a stand-in. | new in 1.4.4 |
| Module report of `windows_update` (status, warnings, per-source detail) so the panel can say WHY a date is missing | new in 1.4.4 |
| Offline queue health in the heartbeat (`queue_status`) | 1.4.3, kept |
| DLP print / USB events (default OFF, metadata only, hash document names), delta sync, services inventory, self-update machinery (idle until a manifest is published) | unchanged |

## Build facts
Fill from the release record (commit, SHA-256 values) — see the report. Both MSIs keep the product `UpgradeCode {B6A3F291-9D4E-4C7B-8F12-3A5E6D1C0847}`; `MajorUpgrade` replaces binaries only. Downgrades are refused by the MSI (`WIX_DOWNGRADE_DETECTED`).

## What was proven without Windows hardware (automated)
* 315 unit/integration tests (net8, Release) — 20 new: last-scan resolution (WUA first, registry fallback, never / unavailable / error, implausible and garbled values dropped, culture independent), payload keeps every legacy key, module report says partial + reason when no date.
* **Upgrade compatibility** (`UpgradeCompatibilityTests`): a `collector.json` written by 1.3.0 loads with identity (collector id, server URL, BIOS UUID, intervals) intact; DLP stays **off**; services inventory stays on; loading never rewrites the file; a queue database left by an older version is read, drained and reported (depth, age, state); delta-sync state is memory-only so the first cycle after the upgrade is a full inventory.
* Server contract (`InventoryFidelityTest`, isolated MySQL): the new fields are accepted, stored, never erase or invent a date; old Collectors without them keep working (module diagnostics fall back to run history when no module status is reported).
* Self-update is idle: it only acts on a published, allow-listed, signed manifest. Live check on 2026-11-17: `collector_update_manifests` = 0, no allow-list, DLP policy rows = 0.

## MUST be verified on real Windows (not possible in this environment)
1. **Last scan date** on: Windows 10 22H2, Windows 11 24H2 (ITMANAGAMENT is a Turkish Windows 11), Windows Server 2019 / 2022 / 2025 (the 2025 box in AD is an evaluation edition). Expect `last_scan_status=ok` + `source=wua_autoupdate`; on a never-updated VM expect `never_scanned`. Compare the date with *Settings → Windows Update → last checked*.
2. In-place upgrade **1.3.0 → 1.4.4** and **1.4.0 → 1.4.4** by MSI on a VM snapshot: service restarts, same collector id and API key (no re-enrolment), queue.db preserved, first heartbeat within one interval, first inventory is a full one, no duplicate device on the server.
3. Offline queue: disconnect for 10 min → depth grows → reconnect → drains (≤30/min), `queue_status` states ok → backlog → ok; after 30 min offline `stalled`.
4. DLP print / USB (only on the **isolated** VM, policy enabled there only): events arrive, document names hashed, USB file events are `usb_file_event` (created/renamed/deleted, never "copy").
5. CPU / RAM of the service during an inventory cycle and during DLP polling (limits: see `Run-VmTestSuite.ps1`).
6. Self-update scenarios from `Run-VmTestSuite.ps1` (UpdateHappy, rollback, fault install) with the TEST-PKI MSIs only.
7. Localised Windows (Turkish) — architecture text `64 bit`, service display names, UI language of WUA results.

## Data protection and rollback plan for the pilot machines
Before touching a pilot machine (one at a time, ITMANAGAMENT first, MIKRO-PC only after the first is confirmed healthy for 24 h):
1. Record: installed version, `collector.json` hash, service state, last heartbeat age on the panel.
2. Copy `%ProgramData%\LiderCollector\` (collector.json, secure.dat, queue.db, logs) to an admin-only folder **outside** that directory. `secure.dat` is DPAPI/machine-bound: it must come back to the SAME machine, never be copied to another.
3. Keep the currently installed MSI (the Collector keeps a saved copy for its own rollback) — or the 1.3.0 / 1.4.0 signed MSI from the release store.
4. Install: `msiexec /i LiderITONECollector-1.4.4.msi /qn /l*v upgrade.log` (no property overrides: the existing enrolment is reused).
5. Check on the panel within 2 heartbeat intervals: version 1.4.4, online, `windows_update` module status, same device (no duplicate), asset number unchanged.
**Rollback** (any failure): `msiexec /x {ProductCode} /qn` of 1.4.4, reinstall the previous signed MSI; `%ProgramData%\LiderCollector\` is untouched by both steps, so identity and queue come back. If the folder was damaged, restore the copy from step 2 while the service is stopped. Server side nothing needs reverting: the new payload keys are ignored by older servers and optional for the current one. If the panel shows stale fingerprints, `php artisan inventory:resync <collector id> --apply` makes the Collector resend its modules.

## Not done / not approved
* No production signing: the production code-signing key was NOT used. `dist\LiderITONECollector-1.4.4.msi` is production-pinned but **unsigned**; a pilot on real machines needs it signed by the owner (key on the application server, see `docs/code-signing-key-custody.md`).
* Nothing published to the server (no release catalogue entry, no update manifest, no allow-list). ITMANAGAMENT and MIKRO-PC keep running 1.4.0 / 1.3.0.

## Kurulum ve yükseltme prosedürleri
Panel "Kurulum Paketleri" bölümü ve doğrulanacak prosedürler: `envanter/docs/collector-installation-procedures.md` (yeni kurulum, yükseltme, GPO, doğrulama, geri alma). Betik: `envanter/scripts/gpo/Upgrade-LiderCollector.ps1`.
