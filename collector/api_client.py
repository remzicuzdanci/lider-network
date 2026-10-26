"""
Platform API istemcisi — tüm HTTP iletişimini yönetir.
"""

import logging
import platform
import socket
from typing import Any, Optional

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger("collector.api")

API_VERSION = "v1"


class ApiError(Exception):
    def __init__(self, message: str, status_code: int = 0):
        super().__init__(message)
        self.status_code = status_code


class PlatformApiClient:
    def __init__(self, base_url: str, api_key: str = "", verify_ssl: bool = True):
        self._base = f"{base_url.rstrip('/')}/api/{API_VERSION}/collector"
        self._api_key = api_key
        self._verify = verify_ssl
        self._session = self._build_session()

    def _build_session(self) -> requests.Session:
        s = requests.Session()
        retry = Retry(
            total=3,
            backoff_factor=2,
            status_forcelist=[500, 502, 503, 504],
        )
        s.mount("https://", HTTPAdapter(max_retries=retry))
        s.mount("http://", HTTPAdapter(max_retries=retry))
        s.headers.update({
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": f"LiderCollector/1.0 ({platform.system()} {platform.version()})",
        })
        return s

    def _auth_headers(self) -> dict:
        return {"Authorization": f"Bearer {self._api_key}"}

    def set_api_key(self, key: str) -> None:
        self._api_key = key

    # ── Enrollment ─────────────────────────────────────────────

    def enroll(self, enroll_token: str) -> str:
        """Exchange enroll token for a permanent API key. Returns the API key."""
        resp = self._session.post(
            f"{self._base}/enroll",
            json={
                "enroll_token": enroll_token,
                "hostname": socket.getfqdn(),
                "version": "1.0.0",
            },
            verify=self._verify,
            timeout=30,
        )
        if resp.status_code != 200:
            raise ApiError(
                f"Enroll başarısız: {resp.text[:200]}",
                resp.status_code
            )
        data = resp.json()
        api_key = data.get("api_key", "")
        if not api_key:
            raise ApiError("API key alınamadı.")
        logger.info("Enrollment başarılı. Collector ID: %s", data.get("collector_id"))
        return api_key

    # ── Checkin ────────────────────────────────────────────────

    def checkin(self) -> dict:
        """Heartbeat — sunucu yapılandırmasını döndürür."""
        resp = self._session.post(
            f"{self._base}/checkin",
            headers=self._auth_headers(),
            json={"version": "1.0.0", "hostname": socket.getfqdn()},
            verify=self._verify,
            timeout=15,
        )
        if resp.status_code == 401:
            raise ApiError("Geçersiz API key — yeniden enroll gerekebilir.", 401)
        if resp.status_code != 200:
            raise ApiError(f"Checkin hatası: HTTP {resp.status_code}", resp.status_code)
        return resp.json()

    # ── Inventory ──────────────────────────────────────────────

    def send_inventory(self, batch_id: str, collected_at: str, inventory: dict) -> dict:
        """Envanter değişikliklerini gönder."""
        resp = self._session.post(
            f"{self._base}/inventory",
            headers=self._auth_headers(),
            json={
                "batch_id": batch_id,
                "collected_at": collected_at,
                "inventory": inventory,
            },
            verify=self._verify,
            timeout=60,
        )
        if resp.status_code != 200:
            raise ApiError(f"Inventory gönderme hatası: HTTP {resp.status_code}", resp.status_code)
        return resp.json()

    # ── Events ─────────────────────────────────────────────────

    def send_events(self, events: list[dict]) -> dict:
        """Anlık olayları gönder (disk dolu, servis durdu, …)."""
        if not events:
            return {}
        resp = self._session.post(
            f"{self._base}/events",
            headers=self._auth_headers(),
            json={"events": events},
            verify=self._verify,
            timeout=15,
        )
        if resp.status_code != 200:
            raise ApiError(f"Event gönderme hatası: HTTP {resp.status_code}", resp.status_code)
        return resp.json()
