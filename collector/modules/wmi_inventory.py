"""
WMI Envanter Modülü — Windows cihaz, yazılım ve servis bilgisi toplar.
Gereksinim: wmi (pip install wmi) — yalnızca Windows'ta çalışır.

Modül fonksiyonları (Discovery Engine formatı):
  collect_system_module()   → modules.system dict
  collect_network_module()  → modules.network dict
  collect_disks_module()    → modules.disks dict
  collect_software_module() → modules.software dict

Event fonksiyonları (disk yüksek uyarı vb.):
  collect_disk_usage()      → [{drive, total_gb, free_gb, used_percent}, ...]
  build_events_from_disk()  → [{type, level, message, context}, ...]
"""

import logging
import platform
import socket
from datetime import datetime, timezone
from typing import Any, Optional

logger = logging.getLogger("collector.wmi")


def _get_wmi():
    """WMI bağlantısını döndür; Windows dışında None."""
    try:
        import wmi
        return wmi.WMI()
    except Exception as e:
        logger.warning("WMI bağlanamadı: %s", e)
        return None


# ── Module-level collection functions (Discovery Engine format) ───────────────

def collect_system_module() -> dict:
    """
    modules.system formatında sistem bilgisi döndür.
    CollectorInventoryController → WindowsInventoryProcessor beklentisine uyar.
    """
    c = _get_wmi()
    sys_data: dict = {}

    hostname = socket.getfqdn()
    sys_data["fqdn"]     = hostname
    sys_data["hostname"] = hostname.split(".")[0]

    try:
        cs   = c.Win32_ComputerSystem()[0] if c else None
        os_i = c.Win32_OperatingSystem()[0] if c else None
        bios = c.Win32_BIOS()[0] if c else None
        csp  = c.Win32_ComputerSystemProduct()[0] if c else None

        # ── Hardware identifiers
        if csp:
            uuid = getattr(csp, "UUID", None)
            if uuid and uuid.upper() not in ("", "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
                                              "00000000-0000-0000-0000-000000000000"):
                sys_data["bios_uuid"] = uuid
            ident = getattr(csp, "IdentifyingNumber", None) or getattr(csp, "Name", None)
            if ident:
                sys_data["wmi_id"] = str(ident)

        if bios:
            serial = getattr(bios, "SerialNumber", None)
            if serial and serial.strip().upper() not in ("", "TO BE FILLED BY O.E.M.",
                                                          "NONE", "0", "DEFAULT STRING"):
                sys_data["serial_number"] = serial.strip()

        # ── Manufacturer / model
        if cs:
            sys_data["manufacturer"] = getattr(cs, "Manufacturer", None)
            sys_data["model"]        = getattr(cs, "Model", None)
            sys_data["domain"]       = getattr(cs, "Domain", None)

        # ── OS
        if os_i:
            sys_data["os_name"]    = getattr(os_i, "Caption", None)
            sys_data["os_version"] = getattr(os_i, "Version", None)     # "10.0.22621"
            sys_data["os_build"]   = getattr(os_i, "BuildNumber", None) # "22621"
            sys_data["os_arch"]    = getattr(os_i, "OSArchitecture", None)  # "64-bit"

            # Uptime / last boot
            last_boot_raw = getattr(os_i, "LastBootUpTime", None)
            if last_boot_raw:
                try:
                    # WMI DATETIME format: "YYYYMMDDHHMMSS.ffffff+TZO"
                    last_boot_dt = datetime.strptime(last_boot_raw[:14], "%Y%m%d%H%M%S")
                    last_boot_dt = last_boot_dt.replace(tzinfo=timezone.utc)
                    sys_data["last_boot_at"] = last_boot_dt.isoformat()
                    uptime = (datetime.now(timezone.utc) - last_boot_dt).total_seconds()
                    sys_data["uptime_seconds"] = int(max(0, uptime))
                except Exception:
                    pass
        else:
            sys_data["os_name"] = platform.system()

        # ── CPU
        if c:
            try:
                procs = c.Win32_Processor()
                if procs:
                    p = procs[0]
                    cpu_name  = getattr(p, "Name", None)
                    cpu_cores = getattr(p, "NumberOfCores", None)
                    if cpu_name:
                        sys_data["cpu"]       = cpu_name.strip()
                        sys_data["cpu_model"] = cpu_name.strip()
                    if cpu_cores:
                        sys_data["cpu_cores"] = int(cpu_cores)
            except Exception as e:
                logger.debug("CPU bilgisi alınamadı: %s", e)

        # ── RAM
        if cs and getattr(cs, "TotalPhysicalMemory", None):
            try:
                sys_data["ram_gb"] = round(int(cs.TotalPhysicalMemory) / (1024 ** 3), 1)
            except Exception:
                pass

    except Exception as e:
        logger.error("System modülü toplanamadı: %s", e)

    return sys_data


def collect_network_module() -> dict:
    """
    modules.network formatında ağ bilgisi döndür.
    {adapters: [{name, mac, ip_addresses: [...]}]}
    """
    c = _get_wmi()
    adapters = []

    if c:
        try:
            for nic in c.Win32_NetworkAdapterConfiguration():
                if not getattr(nic, "IPEnabled", False):
                    continue
                mac = getattr(nic, "MACAddress", None)
                ips = list(getattr(nic, "IPAddress", None) or [])
                # skip loopback-only adapters
                real_ips = [ip for ip in ips if not ip.startswith("127.") and ip != "::1"]
                if not real_ips and not mac:
                    continue
                name = getattr(nic, "Description", None) or getattr(nic, "Caption", "")
                adapters.append({
                    "name":        name,
                    "mac":         mac,
                    "ip_addresses": real_ips or ips,
                })
        except Exception as e:
            logger.error("Network modülü toplanamadı: %s", e)

    # Fallback: at least the primary IP via socket
    if not adapters:
        try:
            ip = socket.gethostbyname(socket.getfqdn())
            adapters.append({"name": "Primary", "mac": None, "ip_addresses": [ip]})
        except Exception:
            pass

    return {"adapters": adapters}


def collect_disks_module() -> dict:
    """
    modules.disks formatında disk bilgisi döndür.
    {volumes: [{drive, total_gb, free_gb, filesystem}]}
    """
    c = _get_wmi()
    volumes = []

    if c:
        try:
            for d in c.Win32_LogicalDisk():
                if getattr(d, "DriveType", 0) != 3 or not getattr(d, "Size", None):
                    continue
                total = int(d.Size)
                free  = int(d.FreeSpace)
                volumes.append({
                    "drive":      d.DeviceID,
                    "total_gb":   round(total / (1024 ** 3), 1),
                    "free_gb":    round(free  / (1024 ** 3), 1),
                    "filesystem": getattr(d, "FileSystem", None),
                })
        except Exception as e:
            logger.error("Disks modülü toplanamadı: %s", e)

    return {"volumes": volumes}


def collect_software_module() -> dict:
    """
    modules.software formatında yazılım listesi döndür.
    {items: [{name, vendor, version, install_date, architecture, source_type, is_system}]}
    """
    items = _software_from_registry_detailed()
    if not items:
        # WMI fallback (slow but complete)
        c = _get_wmi()
        if c:
            try:
                for p in c.Win32_Product():
                    name = getattr(p, "Name", None)
                    if not name:
                        continue
                    items.append({
                        "name":         name.strip(),
                        "vendor":       getattr(p, "Vendor", None) or None,
                        "version":      getattr(p, "Version", None) or None,
                        "install_date": None,
                        "architecture": "unknown",
                        "source_type":  "msi",
                        "is_system":    False,
                    })
            except Exception as e:
                logger.warning("WMI yazılım listesi alınamadı: %s", e)

    return {"items": items}


# ── Event helpers (unchanged) ─────────────────────────────────────────────────

def collect_disk_usage() -> list[dict]:
    """Disk kullanımını topla — event üretimi için."""
    disks = []
    c = _get_wmi()
    if not c:
        return disks

    try:
        for d in c.Win32_LogicalDisk():
            if getattr(d, "DriveType", 0) != 3 or not getattr(d, "Size", None):
                continue
            total  = int(d.Size)
            free   = int(d.FreeSpace)
            used_p = round((total - free) / total * 100, 1)
            disks.append({
                "drive":        d.DeviceID,
                "total_gb":     round(total / (1024 ** 3), 1),
                "free_gb":      round(free  / (1024 ** 3), 1),
                "used_percent": used_p,
            })
    except Exception as e:
        logger.error("Disk kullanımı alınamadı: %s", e)

    return disks


def build_events_from_disk(disks: list[dict], threshold: int = 85) -> list[dict]:
    """Doluluk eşiği aşılan diskler için event üret."""
    events = []
    for d in disks:
        if d["used_percent"] >= threshold:
            events.append({
                "type":    "disk_usage_high",
                "level":   "critical" if d["used_percent"] >= 95 else "warn",
                "message": f"Disk {d['drive']} %{d['used_percent']} dolu ({d['free_gb']} GB boş)",
                "context": d,
            })
    return events


# ── Legacy collect_devices / collect_software (kept for compatibility) ────────

def collect_devices() -> list[dict]:
    """Legacy — yeni kod collect_system_module() kullanmalı."""
    sys_data = collect_system_module()
    net_data = collect_network_module()

    ip_addr  = None
    mac_addr = None
    for adapter in net_data.get("adapters", []):
        ips = adapter.get("ip_addresses", [])
        if ips:
            ip_addr  = ips[0]
            mac_addr = adapter.get("mac")
            break

    return [{
        "hostname":     sys_data.get("fqdn") or socket.getfqdn(),
        "name":         sys_data.get("hostname") or socket.gethostname(),
        "ip":           ip_addr,
        "mac":          mac_addr,
        "manufacturer": sys_data.get("manufacturer"),
        "model":        sys_data.get("model"),
        "serial":       sys_data.get("serial_number"),
        "os":           sys_data.get("os_name"),
        "os_version":   sys_data.get("os_build"),
        "cpu":          sys_data.get("cpu"),
        "ram_gb":       sys_data.get("ram_gb"),
        "disk_gb":      None,
        "category":     _guess_category_from_model(sys_data.get("model", "")),
    }]


def collect_software() -> list[dict]:
    """Legacy — yeni kod collect_software_module() kullanmalı."""
    sw = collect_software_module()
    return [{"name": i["name"], "version": i["version"], "vendor": i["vendor"]}
            for i in sw.get("items", [])]


def collect_services(critical_only: bool = True) -> list[dict]:
    """Windows servislerini topla (varsayılan: yalnızca auto-start)."""
    services = []
    c = _get_wmi()
    if not c:
        return services

    try:
        query = (
            "SELECT Name, DisplayName, State, StartMode FROM Win32_Service "
            "WHERE StartMode='Auto'" if critical_only else
            "SELECT Name, DisplayName, State, StartMode FROM Win32_Service"
        )
        for svc in c.query(query):
            services.append({
                "name":         svc.Name,
                "display_name": svc.DisplayName,
                "state":        svc.State,
                "start_mode":   svc.StartMode,
            })
    except Exception as e:
        logger.error("Servis listesi alınamadı: %s", e)

    return services


# ── Private helpers ───────────────────────────────────────────────────────────

def _guess_category_from_model(model: str) -> str:
    m = (model or "").lower()
    if any(w in m for w in ["server", "proliant", "poweredge", "thinkserver"]):
        return "server"
    if any(w in m for w in ["virtual", "vmware", "hyper-v", "kvm"]):
        return "virtual-machine"
    if any(w in m for w in ["notebook", "laptop", "thinkpad", "latitude", "probook"]):
        return "laptop"
    return "workstation"


# kept for legacy reference
def _guess_category(pc_type: int, model: str) -> str:
    return _guess_category_from_model(model)


def _software_from_registry_detailed() -> list[dict]:
    """
    Windows registry'den ayrıntılı yazılım listesi.
    modules.software.items formatında döndür.
    """
    items: list[dict] = []
    try:
        import winreg

        registry_sources = [
            (winreg.HKEY_LOCAL_MACHINE,
             r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
             "registry_x64"),
            (winreg.HKEY_LOCAL_MACHINE,
             r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall",
             "registry_x86"),
            (winreg.HKEY_CURRENT_USER,
             r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
             "registry_user"),
        ]

        seen = set()
        for hive, key_path, source_type in registry_sources:
            try:
                key = winreg.OpenKey(hive, key_path)
            except FileNotFoundError:
                continue

            for i in range(winreg.QueryInfoKey(key)[0]):
                try:
                    sub_name = winreg.EnumKey(key, i)
                    sub      = winreg.OpenKey(key, sub_name)

                    def qv(name: str, default=None):
                        try:
                            return winreg.QueryValueEx(sub, name)[0]
                        except Exception:
                            return default

                    name = qv("DisplayName")
                    if not name or not name.strip():
                        continue

                    version  = qv("DisplayVersion")
                    vendor   = qv("Publisher")
                    inst_date = qv("InstallDate")
                    arch_raw  = qv("Architecture", "")

                    # normalize architecture
                    arch_map = {"32": "x86", "64": "x64"}
                    arch = arch_map.get(str(arch_raw), "unknown")
                    if not arch or arch == "unknown":
                        arch = "x64" if source_type == "registry_x64" else "x86"

                    dedup = (name.strip().lower(), (version or "").lower(), source_type)
                    if dedup in seen:
                        continue
                    seen.add(dedup)

                    items.append({
                        "name":         name.strip(),
                        "vendor":       vendor.strip() if vendor else None,
                        "version":      version.strip() if version else None,
                        "install_date": inst_date if inst_date else None,
                        "architecture": arch,
                        "source_type":  source_type,
                        "is_system":    False,
                    })
                except Exception:
                    continue
    except ImportError:
        logger.debug("winreg kullanılamıyor (Windows dışı?)")

    return items
