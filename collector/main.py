"""
Lider IT ONE — Windows Collector Service
Ana döngü: enrollment, checkin, WMI envanter, event gönderimi.

Windows servisi olarak çalıştırmak için:
  python main.py install   → servisi kur
  python main.py start     → başlat
  python main.py stop      → durdur
  python main.py remove    → kaldır
  python main.py run       → ön planda çalıştır (test için)
"""

import hashlib
import json
import logging
import sys
import threading
import time
import uuid
from datetime import datetime, timezone

from config import CollectorConfig
from api_client import ApiError, PlatformApiClient

# Windows service support (optional — degrades gracefully if not on Windows)
try:
    import win32serviceutil
    import win32service
    import win32event
    import servicemanager
    HAS_WIN32 = True
except ImportError:
    HAS_WIN32 = False

logger = logging.getLogger("collector")


def setup_logging(cfg: CollectorConfig) -> None:
    handlers = [logging.StreamHandler(sys.stdout)]
    if cfg.log_file:
        handlers.append(logging.FileHandler(cfg.log_file, encoding="utf-8"))
    logging.basicConfig(
        level=getattr(logging, cfg.log_level, logging.INFO),
        format="%(asctime)s %(name)-20s %(levelname)-8s %(message)s",
        handlers=handlers,
    )


# ── Diff state ───────────────────────────────────────────────────

_last_inventory_hash: dict[str, str] = {}


def _hash(data: list) -> str:
    return hashlib.md5(
        json.dumps(data, sort_keys=True, default=str).encode()
    ).hexdigest()


def _diff_upsert(key: str, current: list) -> tuple[list, bool]:
    """Return (items_to_send, changed). Only sends if data changed."""
    h = _hash(current)
    changed = _last_inventory_hash.get(key) != h
    if changed:
        _last_inventory_hash[key] = h
    return current, changed


# ── Core collector loop ──────────────────────────────────────────

class CollectorLoop:
    def __init__(self):
        self.cfg = CollectorConfig()
        setup_logging(self.cfg)
        self.api = PlatformApiClient(
            self.cfg.platform_url,
            self.cfg.api_key,
            self.cfg.verify_ssl,
        )
        self._stop_event = threading.Event()

    def ensure_enrolled(self) -> bool:
        if self.cfg.is_enrolled():
            return True
        token = self.cfg.enroll_token
        if not token:
            logger.error(
                "Collector henüz kaydedilmedi. "
                "collector.conf içinde enroll_token'ı girin."
            )
            return False
        logger.info("Enrollment başlatılıyor…")
        try:
            api_key = self.api.enroll(token)
            self.cfg.save_api_key(api_key)
            self.api.set_api_key(api_key)
            logger.info("Enrollment başarılı.")
            return True
        except ApiError as e:
            logger.error("Enrollment hatası: %s", e)
            return False

    def run_once_inventory(self) -> None:
        """Tek bir envanter döngüsü çalıştır."""
        from modules import wmi_inventory

        inventory: dict = {}

        # Devices
        devices, d_changed = _diff_upsert("devices", wmi_inventory.collect_devices())
        if d_changed:
            inventory["devices"] = {"upserted": devices}
            logger.info("Cihaz verisi değişti, %d kayıt gönderiliyor.", len(devices))

        # Software (daha nadir değiştiği için sadece 1/4 envanter çevriminde gönder)
        sw_cycle = getattr(self, "_sw_cycle", 0) + 1
        self._sw_cycle = sw_cycle
        if sw_cycle % 4 == 1:
            sw, sw_changed = _diff_upsert("software", wmi_inventory.collect_software())
            if sw_changed:
                inventory["software"] = {"upserted": sw}
                logger.info("Yazılım listesi değişti, %d kayıt gönderiliyor.", len(sw))

        if not inventory:
            logger.debug("Envanter değişikliği yok, gönderim atlandı.")
            return

        batch_id = str(uuid.uuid4())
        collected_at = datetime.now(timezone.utc).isoformat()
        try:
            result = self.api.send_inventory(batch_id, collected_at, inventory)
            logger.info(
                "Envanter gönderildi. İşlenen: %d kayıt.",
                result.get("processed", 0)
            )
        except ApiError as e:
            logger.error("Envanter gönderilemedi: %s", e)

    def run_once_events(self) -> None:
        """Disk kullanımı gibi anlık olayları kontrol et ve gönder."""
        from modules import wmi_inventory
        disks = wmi_inventory.collect_disk_usage()
        events = wmi_inventory.build_events_from_disk(disks, threshold=85)
        if events:
            try:
                self.api.send_events(events)
                logger.warning("Event gönderildi: %s", [e["message"] for e in events])
            except ApiError as e:
                logger.error("Event gönderilemedi: %s", e)

    def run(self) -> None:
        logger.info("Lider IT ONE Collector başlıyor…")

        if not self.ensure_enrolled():
            logger.error("Enrollment başarısız, servis durduruluyor.")
            return

        last_checkin   = 0.0
        last_inventory = 0.0
        last_events    = 0.0

        while not self._stop_event.is_set():
            now = time.time()

            if now - last_checkin >= self.cfg.checkin_interval:
                try:
                    self.api.checkin()
                    logger.debug("Checkin OK.")
                except ApiError as e:
                    logger.warning("Checkin hatası: %s", e)
                last_checkin = now

            if now - last_inventory >= self.cfg.inventory_interval:
                self.run_once_inventory()
                last_inventory = now

            if now - last_events >= self.cfg.event_poll_interval:
                self.run_once_events()
                last_events = now

            self._stop_event.wait(timeout=10)

        logger.info("Collector durdu.")

    def stop(self) -> None:
        self._stop_event.set()


# ── Windows Service wrapper ──────────────────────────────────────

if HAS_WIN32:
    class LiderCollectorService(win32serviceutil.ServiceFramework):
        _svc_name_        = "LiderCollector"
        _svc_display_name_ = "Lider IT ONE Collector"
        _svc_description_  = "Lider IT ONE platform için WMI envanter ve olay servisi."

        def __init__(self, args):
            win32serviceutil.ServiceFramework.__init__(self, args)
            self._stop_event = win32event.CreateEvent(None, 0, 0, None)
            self._loop = CollectorLoop()

        def SvcStop(self):
            self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
            self._loop.stop()
            win32event.SetEvent(self._stop_event)

        def SvcDoRun(self):
            servicemanager.LogMsg(
                servicemanager.EVENTLOG_INFORMATION_TYPE,
                servicemanager.PYS_SERVICE_STARTED,
                (self._svc_name_, ""),
            )
            self._loop.run()


# ── Entry point ──────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "run":
        # Ön planda test çalıştırma
        CollectorLoop().run()
    elif HAS_WIN32:
        win32serviceutil.HandleCommandLine(LiderCollectorService)
    else:
        print("Windows dışı platform: 'run' argümanıyla ön planda çalıştırın.")
        CollectorLoop().run()
