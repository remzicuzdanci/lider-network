# Lider IT ONE Collector — Installation & GPO Deployment Guide

Sprint 9 / Phase C  
Version: 1.0.0

---

## Overview

The Lider IT ONE Collector is a Windows service that collects hardware, software, and
performance inventory from managed endpoints and reports it to the Lider IT ONE server.

The MSI is **generic** — no customer credentials are embedded.  Enrollment is performed
at first service start using a short-lived token placed as a file by IT.

---

## Prerequisites

| Requirement | Minimum version |
|-------------|----------------|
| Windows     | 10 / Server 2019 |
| .NET Runtime | Bundled (self-contained) — no separate install |
| Architecture | x64 only |
| Admin rights | Required for MSI install |

---

## 1. Build the MSI

```powershell
# From the collector\ directory
.\build-msi.ps1 -Version "1.0.0"
```

Output: `dist\LiderITONECollector-1.0.0.msi`

**Prerequisites for the build machine:**
- .NET 8 SDK
- WiX v4: `dotnet tool install --global wix`

---

## 2. Silent Installation

### Manual (single machine)

```cmd
msiexec /i LiderITONECollector-1.0.0.msi /qn /norestart
```

### GPO Software Installation (domain-wide)

1. Copy the MSI to a network share (e.g. `\\fileserver\software\LiderCollector\`).
2. In Group Policy Management:
   - Create or edit a GPO linked to the target OU.
   - **Computer Configuration** → **Policies** → **Software Settings** → **Software Installation**.
   - Right-click → **New** → **Package** → select the MSI → **Assigned**.
3. The MSI installs silently at next reboot.

### SCCM / Intune

Deploy as a standard `.msi` application.  No special parameters required.

---

## 3. Enrollment

### How it works

1. IT generates a short-lived enrollment token in the Lider IT ONE web console.
2. IT creates `enrollment.json` with the token and server URL.
3. The file is deployed to `%ProgramData%\LiderCollector\` on each target machine
   **before or after** the MSI is installed (the service reads it on the next start).
4. On first start the service reads the file, **immediately deletes it**, and
   contacts the server to exchange the token for a permanent API key.
5. The API key is stored encrypted via Windows DPAPI (machine scope).

### enrollment.json format

```json
{
  "server_url":        "https://lider.yourdomain.com",
  "enrollment_token":  "<token from Lider IT ONE console>"
}
```

> **SECURITY: Never put the token in the MSI, command-line arguments, registry,
> or Group Policy settings.  The file is the only safe channel.**

### Deploying enrollment.json via GPO (recommended)

1. Place a template `enrollment.json` on the SYSVOL share:
   `\\domain\SYSVOL\domain\scripts\LiderCollector\enrollment.json`

2. In Group Policy Management, create a GPO linked to the target OU:
   **Computer Configuration** → **Preferences** → **Windows Settings** → **Files**.

3. New File:
   - Action: **Replace**
   - Source: `\\domain\SYSVOL\domain\scripts\LiderCollector\enrollment.json`
   - Destination: `%ProgramData%\LiderCollector\enrollment.json`

4. Set Item-level Targeting if needed (e.g. OU or security group filter).

> After the agent reads and deletes the file, the GPO will re-deploy it on the
> next Group Policy refresh.  This is harmless — the server will reject replayed
> tokens, and a fresh token can be deployed by updating the SYSVOL copy.

### Re-enrollment (replace a machine, re-image, clone detection)

Re-enrollment is triggered by one of two signals:

| Trigger | Behaviour |
|---------|-----------|
| **Server returns HTTP 401** (API key revoked or collector record removed) | Agent wipes `api_key` from DPAPI and clears `CollectorId`. On the next start, it checks for a new `enrollment.json` and re-enrolls. This is the **primary** and **definitive** trigger. |
| **BIOS UUID mismatch** (enrolled UUID ≠ current UUID) | Agent logs a **warning only** and updates the stored UUID to avoid repeat warnings. It does NOT auto-wipe credentials. This may indicate a cloned image, re-imaged machine, or VM UUID change — the server 401 path handles the definitive action. |

To re-enroll a machine: revoke its collector record in the Lider IT ONE console
(which causes the next heartbeat to return 401), then deploy a fresh `enrollment.json`.

---

## 4. GPO Administrative Templates (ADMX)

The ADMX template allows centralised configuration of server URL, heartbeat/sync
intervals, and log level.  **Tokens are never configured via GPO.**

### Installation

1. Copy `GPO\LiderCollector.admx` to:
   - Local: `%SystemRoot%\PolicyDefinitions\`
   - Central Store: `\\domain\SYSVOL\domain\Policies\PolicyDefinitions\`

2. Copy `GPO\en-US\LiderCollector.adml` to the matching `en-US\` subfolder.

3. Open Group Policy Management Editor.  Under **Computer Configuration** →
   **Policies** → **Administrative Templates** → **Lider Network** →
   **Lider IT ONE Collector** you will find:

| Policy | Key | Description |
|--------|-----|-------------|
| Server URL | `ServerUrl` | HTTPS base URL of the server |
| Heartbeat Interval | `HeartbeatIntervalSeconds` | 30–3600 s (default 60) |
| Inventory Sync Interval | `InventorySyncIntervalSeconds` | 300–86400 s (default 900) |
| Log Level | `LogLevel` | Information / Warning / Debug / Verbose |

Registry location: `HKLM\SOFTWARE\Policies\LiderNetwork\LiderCollector\`

---

## 5. Upgrade

The MSI uses WiX `MajorUpgrade` (`Schedule="afterInstallInitialize"`).  Deploy the
new MSI via GPO Software Installation (Assigned), SCCM, or Intune — same as the
initial deployment.

```cmd
msiexec /i LiderITONECollector-1.1.0.msi /qn /norestart
```

### What happens during upgrade

| Path | On Upgrade |
|------|-----------|
| `%ProgramFiles%\LiderNetwork\LiderCollector\` | **Replaced** — old binaries removed, new binaries installed |
| `%ProgramData%\LiderCollector\collector.json` | **Preserved** — CollectorId, server URL, intervals retained |
| `%ProgramData%\LiderCollector\secure.dat` | **Preserved** — DPAPI-encrypted API key survives upgrade |
| `%ProgramData%\LiderCollector\queue.db` | **Preserved** — offline queue survives; pending events flushed on next start |
| `%ProgramData%\LiderCollector\logs\` | **Preserved** — historical logs kept |
| `%ProgramData%\LiderCollector\enrollment.json` | **Consumed on next start** — if placed before upgrade completes, the agent reads and deletes it on first start after upgrade |

The service is stopped automatically before binaries are replaced and started again
after installation completes — no manual intervention required.

> **Note:** The `%ProgramData%\LiderCollector\` directory is managed by the MSI only
> for its **creation** (first install) and ACL setup.  Upgrade and uninstall never
> remove it.  This is intentional — data persistence across upgrades is a design goal.

---

## 6. Uninstall

```cmd
msiexec /x LiderITONECollector-1.0.0.msi /qn
```

Or via **Add/Remove Programs** / **Apps & features**.

### What happens during uninstall

| Path | On Uninstall |
|------|-------------|
| `%ProgramFiles%\LiderNetwork\LiderCollector\` | **Removed** — service binary and all install-dir files deleted |
| Windows Service (`LiderITONECollector`) | **Removed** — stopped and unregistered |
| `%ProgramData%\LiderCollector\` | **NOT removed** — entire directory is preserved |
| `HKLM\SOFTWARE\Policies\LiderNetwork\` | **NOT removed** — GPO-managed registry is never touched by the MSI |

The ProgramData directory is intentionally left behind.  It contains:
- The encrypted API key (`secure.dat`) — allows re-install without re-enrollment
- The offline queue (`queue.db`) — avoids data loss if the service is briefly removed
- Historical logs

**To fully decommission a machine:**
1. Revoke the collector record in the Lider IT ONE console.
2. Uninstall the MSI.
3. Manually delete `%ProgramData%\LiderCollector\` (requires admin).

**To re-install without re-enrollment** (e.g. repair after corruption):
Simply re-install the MSI.  The existing `secure.dat` with the API key is reused
automatically — no `enrollment.json` needed.

---

## 7. File Locations

| Path | Contents |
|------|----------|
| `%ProgramFiles%\LiderNetwork\LiderCollector\LiderCollector.exe` | Service binary |
| `%ProgramData%\LiderCollector\collector.json` | Non-sensitive config (CollectorId, intervals) |
| `%ProgramData%\LiderCollector\secure.dat` | DPAPI-encrypted API key |
| `%ProgramData%\LiderCollector\queue.db` | SQLite offline queue |
| `%ProgramData%\LiderCollector\logs\` | Rolling log files (30-day retention) |
| `%ProgramData%\LiderCollector\enrollment.json` | One-time token (deleted after read) |

---

## 8. Event Log & Troubleshooting

The service logs to:
- Windows Event Log: **Application** source `LiderITONECollector`
- File: `%ProgramData%\LiderCollector\logs\collector-YYYYMMDD.log`

**Service not starting?**
- Check Event Viewer → Application for startup errors.
- Verify `%ProgramData%\LiderCollector\` exists and SYSTEM has Full Control.

**Agent not enrolling?**
- Confirm `enrollment.json` is in `%ProgramData%\LiderCollector\`.
- Check file JSON syntax (must be UTF-8 without BOM).
- Check the log for `"Bootstrap enrollment loaded"` or error messages.
- Tokens expire — generate a new one from the Lider IT ONE console if needed.

---

## 9. Open Items (Phase A carry-over)

| Item | Status |
|------|--------|
| Offline queue persistence end-to-end test | Not tested — pending lab environment |
| EventLog cursor advancement / server deduplication by RecordId | Code complete; not validated at scale |
| Windows Server 2025 compatibility test | Not available — test environment needed |

---

*Phase C implementation complete.  Phase D (AD integration) requires separate approval.*
