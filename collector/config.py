"""
Collector configuration — reads/writes collector.conf (INI format).
Stored next to the executable in the install directory.
"""

import configparser
import os
import sys

DEFAULT_CONFIG = {
    "platform": {
        "url": "https://your-platform.example.com",
        "verify_ssl": "true",
    },
    "collector": {
        "enroll_token": "",
        "api_key": "",
        "site_id": "",
        "name": "",
    },
    "schedule": {
        "checkin_interval": "60",       # seconds
        "inventory_interval": "900",    # 15 minutes
        "event_poll_interval": "30",    # event log polling
    },
    "modules": {
        "wmi_inventory": "true",
        "ad_discovery": "false",
        "snmp_scan": "false",
        "hyperv": "false",
        "event_monitor": "true",
    },
    "logging": {
        "level": "INFO",
        "file": "",   # empty = stdout only
    },
}


def _config_path() -> str:
    if getattr(sys, "frozen", False):
        base = os.path.dirname(sys.executable)
    else:
        base = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base, "collector.conf")


class CollectorConfig:
    def __init__(self):
        self._path = _config_path()
        self._cfg = configparser.ConfigParser()
        # Load defaults
        for section, values in DEFAULT_CONFIG.items():
            self._cfg[section] = values
        # Override from file
        if os.path.exists(self._path):
            self._cfg.read(self._path)

    # ── Getters ───────────────────────────────────────────────────

    @property
    def platform_url(self) -> str:
        return self._cfg["platform"]["url"].rstrip("/")

    @property
    def verify_ssl(self) -> bool:
        return self._cfg["platform"].getboolean("verify_ssl", True)

    @property
    def enroll_token(self) -> str:
        return self._cfg["collector"].get("enroll_token", "")

    @property
    def api_key(self) -> str:
        return self._cfg["collector"].get("api_key", "")

    @property
    def site_id(self) -> str:
        return self._cfg["collector"].get("site_id", "")

    @property
    def name(self) -> str:
        return self._cfg["collector"].get("name", "") or os.environ.get("COMPUTERNAME", "unknown")

    @property
    def checkin_interval(self) -> int:
        return self._cfg["schedule"].getint("checkin_interval", 60)

    @property
    def inventory_interval(self) -> int:
        return self._cfg["schedule"].getint("inventory_interval", 900)

    @property
    def event_poll_interval(self) -> int:
        return self._cfg["schedule"].getint("event_poll_interval", 30)

    @property
    def modules(self) -> dict:
        return {k: self._cfg["modules"].getboolean(k, False)
                for k in self._cfg["modules"]}

    @property
    def log_level(self) -> str:
        return self._cfg["logging"].get("level", "INFO").upper()

    @property
    def log_file(self) -> str:
        return self._cfg["logging"].get("file", "")

    def is_enrolled(self) -> bool:
        return bool(self.api_key)

    # ── Mutators ─────────────────────────────────────────────────

    def save_api_key(self, api_key: str) -> None:
        self._cfg["collector"]["api_key"] = api_key
        self._cfg["collector"]["enroll_token"] = ""
        self._save()

    def _save(self) -> None:
        with open(self._path, "w") as f:
            self._cfg.write(f)
