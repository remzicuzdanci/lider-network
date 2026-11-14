# Self-update on a real Windows service - test scenarios (NOT executed yet)

Purpose: prove, on a **test VM**, the things unit tests cannot: Windows Installer swaps the service while the update worker keeps running, a bad update is rolled back with the real
`msiexec`, the Collector identity survives every path, and the update stops when revocation cannot be checked. Nothing here runs against MIKRO-PC, ITMANAGAMENT or any production computer
until the VM results are in.

## Preconditions
* A Windows 10/11 VM (snapshot it first), network path to the LIDER server **test copy or the real server with a pilot allow-list that contains ONLY this VM's collector id**.
* Baseline: a **signed** Collector build that already contains the self-update (the "baseline"), installed and enrolled. Target: a **signed** higher version. Both must be signed with the existing LIDER
  certificate (the pins are compiled in - there is no test bypass, by design). So the signing step comes first.
* Publish only to the VM: `php artisan collector:publish-update <signed.msi> --release-version=<ver> --channel=pilot --signature-file=<sig> --targets=<VM collector id> --min-from=<baseline> --activate`
  (the VM's update channel must be `pilot`; the allow-list is the real boundary).
* Run the observer elevated on the VM: `.\Run-UpdateScenario.ps1 -Scenario <name> -BaselineVersion x.y.z -TargetVersion x.y.z -ServerIp <server>`; restore the VM snapshot between scenarios.

## Scenarios and what must be true
| # | Scenario | How the fault is created | Must result in |
|---|---|---|---|
| 1 | Happy | none | status `success`; version = target; service running; `collector.json`/`secure.dat` byte-identical; server shows ONE device and ONE collector (`collector-pilot-check.sh`) |
| 2 | WorkerSurvivesServiceStop | none (observed) | the service is seen `Stopped` by Windows Installer while `LiderCollectorUpdate.exe` is alive; the audit log has `install ok` AFTER the stop; final `success` |
| 3 | UnhealthyNewVersion | firewall rule blocks the server once `install ok` is logged (no heartbeat can ever be accepted) | after the 3 min health window: status `rolled_back`; baseline version back; service running; identity identical; `update/complete` = rolled_back on the server |
| 4 | RollbackCannotReinstall | as 3, plus the saved `previous-*.msi` is deleted | status `rollback_failed`, message names the saved MSI path; the run folder is kept; service state reported honestly (a person is needed) |
| 5 | CrlUnreachable | firewall blocks the server (the CRL is on the same host) before the heartbeat that announces the update | the update is **postponed before the download**, baseline untouched, no install, `update-last-attempt.json` says postponed |
| 6 | InstallerBusy | the harness holds `Global\_MSIExecute` | no install attempted (`skipped`), baseline untouched |
| 7 | (manual) install fails | a signed MSI built with a failing launch condition (optional `FaultInstall` build) | `failed`, Windows Installer keeps the old version, service running |
| 8 | (manual) reboot during the health window | restart the VM after `install ok` | after boot the service is running; the next heartbeat reports the result; no second update loop |
| 9 | (manual) worker killed after `install ok` | `Stop-Process LiderCollectorUpdate` | the new version keeps running; the service reports no result file -> stays `installing` on the server (known gap, see below) |

## What the observer proves automatically
service/version/worker timeline once a second (`timeline.csv`), the new lines of `update-audit.log`, identity file hashes before/after, final service state, and the scenario's expected status.

## Known gaps to decide (found while preparing)
* Scenario 9: a killed worker leaves no result file; the server keeps the last `installing` progress row. A watchdog in the service (no result within N minutes -> report `failed`) is not built yet.
* The CRL is on the same host:80 as the Collector API. While Collectors talk plain http to that host, "CRL unreachable" and "server unreachable" cannot be separated in a firewall test.
* Disk need during an update: worker copy (70 MB) + package (70 MB) + rollback copy (70 MB) + the installed one.
