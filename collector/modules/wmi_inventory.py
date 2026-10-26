"""
WMI Envanter Modülü — Windows cihaz, yazılım ve servis bilgisi toplar.
Gereksinim: wmi (pip install wmi) — yalnızca Windows'ta çalışır.
"""

import logging
import platform
import socket
from typing import Any

logger = logging.getLogger("collector.wmi")


def _get_wmi():
    """WMI bağlantısını döndür; Windows dışında None."""
    try:
        import wmi
        return wmi.WMI()
    except Exception as e:
        logger.warning("WMI bağlanamadı: %s", e)
        return None


def collect_devices() -> list[dict]:
    """Bu makinenin donanım bilgisini topla."""
    c = _get_wmi()
    devices = []

    try:
        cs = c.Win32_ComputerSystem()[0] if c else None
        os_info = c.Win32_OperatingSystem()[0] if c else None
        bios = c.Win32_BIOS()[0] if c else None

        # RAM
        ram_gb = None
        if cs:
            try:
                ram_gb = round(int(cs.TotalPhysicalMemory) / (1024 ** 3))
            except Exception:
                pass

        # CPU
        cpu_name = None
        if c:
            try:
                cpu_name = c.Win32_Processor()[0].Name.strip()
            except Exception:
                pass

        # Disk
        disk_gb = None
        if c:
            try:
                total = sum(
                    int(d.Size)
                    for d in c.Win32_DiskDrive()
                    if d.Size
                )
                disk_gb = round(total / (1024 ** 3))
            except Exception:
                pass

        # Network — primary IP
        ip_addr = None
        mac_addr = None
        if c:
            try:
                for nic in c.Win32_NetworkAdapterConfiguration():
                    if nic.IPEnabled and nic.IPAddress:
                        ip_addr = nic.IPAddress[0]
                        mac_addr = nic.MACAddress
                        break
            except Exception:
                pass

        # Fallback IP
        if not ip_addr:
            ip_addr = socket.gethostbyname(socket.gethostname())

        hostname = socket.getfqdn()
        model = f"{cs.Manufacturer} {cs.Model}".strip() if cs else platform.node()

        # Determine category slug from model
        category = _guess_category(cs.PCSystemType if cs else 0, model)

        devices.append({
            "hostname":        hostname,
            "name":            hostname.split(".")[0],
            "ip":              ip_addr,
            "mac":             mac_addr,
            "manufacturer":    cs.Manufacturer if cs else None,
            "model":           cs.Model if cs else None,
            "serial":          bios.SerialNumber if bios else None,
            "os":              os_info.Caption if os_info else platform.system(),
            "os_version":      os_info.BuildNumber if os_info else platform.version(),
            "cpu":             cpu_name,
            "ram_gb":          ram_gb,
            "disk_gb":         disk_gb,
            "category":        category,
        })

    except Exception as e:
        logger.error("Cihaz bilgisi toplanamadı: %s", e)
        # Minimal fallback
        devices.append({
            "hostname": socket.getfqdn(),
            "name":     socket.gethostname(),
            "ip":       socket.gethostbyname(socket.gethostname()),
            "os":       platform.system(),
            "category": "server",
        })

    return devices


def collect_software() -> list[dict]:
    """Yüklü yazılımları topla (registry veya WMI)."""
    software = []
    c = _get_wmi()
    if not c:
        return software

    try:
        for p in c.Win32_Product():
            if not p.Name:
                continue
            software.append({
                "name":    p.Name.strip(),
                "version": p.Version or None,
                "vendor":  p.Vendor or None,
            })
    except Exception as e:
        logger.warning("WMI yazılım listesi alınamadı: %s. Registry deneniyor…", e)
        software = _software_from_registry()

    return software


def collect_services(critical_only: bool = True) -> list[dict]:
    """Windows servislerini topla (varsayılan: yalnızca kritik/auto-start)."""
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
                "name":        svc.Name,
                "display_name": svc.DisplayName,
                "state":       svc.State,        # Running / Stopped
                "start_mode":  svc.StartMode,
            })
    except Exception as e:
        logger.error("Servis listesi alınamadı: %s", e)

    return services


def collect_disk_usage() -> list[dict]:
    """Disk kullanımını topla — doluluk % 80 üzerindeyse event üretilir."""
    disks = []
    c = _get_wmi()
    if not c:
        return disks

    try:
        for d in c.Win32_LogicalDisk():
            if d.DriveType != 3 or not d.Size:  # 3 = local disk
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


# ── Private helpers ──────────────────────────────────────────────

def _guess_category(pc_type: int, model: str) -> str:
    """Win32_ComputerSystem.PCSystemType → category slug."""
    model_low = model.lower()
    if any(w in model_low for w in ["server", "proliant", "poweredge", "thinkserver"]):
        return "server"
    if any(w in model_low for w in ["virtual", "vmware", "hyper-v", "kvm"]):
        return "virtual-machine"
    if any(w in model_low for w in ["notebook", "laptop", "thinkpad", "latitude", "probook"]):
        return "laptop"
    # PCSystemType: 1=desktop, 2=mobile, 4=desktop, 5=laptop
    if pc_type in (2, 5):
        return "laptop"
    return "workstation"


def _software_from_registry() -> list[dict]:
    """Fallback: software from Windows registry uninstall keys."""
    software = []
    try:
        import winreg
        keys = [
            r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
            r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall",
        ]
        for key_path in keys:
            try:
                key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, key_path)
                for i in range(winreg.QueryInfoKey(key)[0]):
                    try:
                        sub = winreg.OpenKey(key, winreg.EnumKey(key, i))
                        name = winreg.QueryValueEx(sub, "DisplayName")[0]
                        version = None
                        publisher = None
                        try:
                            version = winreg.QueryValueEx(sub, "DisplayVersion")[0]
                        except Exception:
                            pass
                        try:
                            publisher = winreg.QueryValueEx(sub, "Publisher")[0]
                        except Exception:
                            pass
                        if name:
                            software.append({"name": name, "version": version, "vendor": publisher})
                    except Exception:
                        continue
            except Exception:
                continue
    except ImportError:
        pass
    return software
