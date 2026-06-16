#!/usr/bin/env python3
"""
Lider Network — USOM Threat Feed Fetcher
USOM/SGB'den zararlı bağlantıları çeker, URLhaus ile zenginleştirir,
Supabase'e tam + lite (90/180/365 gün) versiyonları yazar.
"""

import os, sys, time, re, requests
from datetime import datetime, timezone, timedelta

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("HATA: SUPABASE_URL veya SUPABASE_KEY eksik")
    sys.exit(1)

USOM_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
    "Referer": "https://www.usom.gov.tr/",
}

# Kayıtlar: {cat: [(value, date_or_None), ...]}
dated: dict[str, list] = {"domain": [], "ipv4": [], "ipv6": [], "url": []}


def classify(t: str, v: str) -> str | None:
    t = (t or "").lower().strip()
    v = (v or "").strip()
    if not v:
        return None
    if t == "domain": return "domain"
    if t == "url":    return "url"
    if t == "ip":     return "ipv6" if ":" in v else "ipv4"
    if v.startswith("http"): return "url"
    if ":" in v:             return "ipv6"
    if re.match(r"^\d{1,3}(\.\d{1,3}){3}", v): return "ipv4"
    if "." in v: return "domain"
    return None


def parse_date(s: str | None) -> datetime | None:
    if not s:
        return None
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(s[:19], fmt).replace(tzinfo=timezone.utc)
        except Exception:
            continue
    return None


# ── 1. USOM API ──────────────────────────────────────────────────────────────
print("=" * 60)
print("USOM API çekiliyor...")

usom_ok = False
seen: set[str] = set()

try:
    r0 = requests.get(
        "https://www.usom.gov.tr/api/address/index.json?page=1&per-page=2000",
        headers=USOM_HEADERS, timeout=20,
    )
    if r0.ok:
        d0 = r0.json()
        meta = d0.get("meta", {}).get("pagination", {})
        total_pages = int(
            meta.get("page-count") or meta.get("total-pages") or meta.get("pageCount") or 1
        )
        print(f"Toplam sayfa: {total_pages}")

        def process_items(items):
            for item in items:
                v = (item.get("url") or "").strip()
                if not v or v in seen:
                    continue
                seen.add(v)
                cat = classify(item.get("type"), v)
                if cat:
                    dt = parse_date(item.get("date") or item.get("added_at") or item.get("created_at"))
                    dated[cat].append((v, dt))

        process_items(d0.get("data", []))

        for page in range(2, total_pages + 1):
            try:
                rp = requests.get(
                    f"https://www.usom.gov.tr/api/address/index.json?page={page}&per-page=2000",
                    headers=USOM_HEADERS, timeout=15,
                )
                if rp.ok:
                    process_items(rp.json().get("data", []))
                if page % 20 == 0:
                    print(f"  Sayfa {page}/{total_pages} — domain:{len(dated['domain'])} ip:{len(dated['ipv4'])}")
                time.sleep(0.2)
            except Exception as e:
                print(f"  Sayfa {page} atlandı: {e}")

        usom_ok = True
        print(f"USOM OK — domain:{len(dated['domain'])} ipv4:{len(dated['ipv4'])} ipv6:{len(dated['ipv6'])} url:{len(dated['url'])}")
    else:
        print(f"USOM API HTTP {r0.status_code} — fallback'e geçiliyor")
except Exception as e:
    print(f"USOM erişim hatası: {e} — fallback'e geçiliyor")

# ── 2. Fallback ───────────────────────────────────────────────────────────────
if not usom_ok:
    print("StevenBlack/hosts çekiliyor...")
    try:
        r = requests.get("https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts", timeout=45)
        for line in r.text.splitlines():
            if line.startswith("0.0.0.0 "):
                parts = line.split()
                if len(parts) >= 2 and parts[1] not in ("0.0.0.0", "localhost"):
                    dated["domain"].append((parts[1], None))
        print(f"  Hosts: {len(dated['domain'])} domain")
    except Exception as e:
        print(f"  StevenBlack hatası: {e}")

    print("stamparm/ipsum IPv4 çekiliyor...")
    try:
        r = requests.get("https://raw.githubusercontent.com/stamparm/ipsum/master/levels/3.txt", timeout=30)
        for line in r.text.splitlines():
            line = line.strip()
            if line and not line.startswith("#"):
                ip = line.split()[0]
                cat = "ipv6" if ":" in ip else "ipv4"
                dated[cat].append((ip, None))
        print(f"  ipsum: {len(dated['ipv4'])} IPv4, {len(dated['ipv6'])} IPv6")
    except Exception as e:
        print(f"  ipsum hatası: {e}")

# ── 3. URLhaus ────────────────────────────────────────────────────────────────
print("URLhaus malware URL'leri çekiliyor...")
try:
    r = requests.get("https://urlhaus.abuse.ch/downloads/text/", timeout=30)
    before = len(dated["url"])
    url_seen: set[str] = {v for v, _ in dated["url"]}
    for line in r.text.splitlines():
        line = line.strip()
        if line and not line.startswith("#") and line.startswith("http") and line not in url_seen:
            url_seen.add(line)
            dated["url"].append((line, None))
    print(f"  URLhaus: +{len(dated['url']) - before} URL (toplam {len(dated['url'])})")
except Exception as e:
    print(f"  URLhaus hatası: {e}")

# ── 4. Lite pencere hesaplama ─────────────────────────────────────────────────
now_dt = datetime.now(timezone.utc)
WINDOWS = {"90d": 90, "180d": 180, "365d": 365}


def lite_records(entries: list, days: int) -> list[str]:
    """Tarihi olan kayıtları pencereye göre filtrele, olmayanları sonuna ekle."""
    cutoff = now_dt - timedelta(days=days)
    within = sorted([v for v, dt in entries if dt and dt >= cutoff])
    no_date = sorted([v for v, dt in entries if not dt])
    # Tarihi olmayanlar için basit yüzde kes (360 gün → tüm liste)
    ratio = min(1.0, days / 365)
    no_date_slice = no_date[:max(1, int(len(no_date) * ratio))]
    combined = sorted(set(within) | set(no_date_slice))
    return combined


# ── 5. Supabase'e yaz ─────────────────────────────────────────────────────────
print("=" * 60)
print("Supabase'e yazılıyor...")

now_str = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
errors = 0


def write_feed(feed_type: str, records: list[str]) -> bool:
    content = "\n".join(records)
    payload = [{
        "feed_type":    feed_type,
        "content":      content,
        "record_count": len(records),
        "updated_at":   now_str,
    }]
    try:
        r = requests.post(
            f"{SUPABASE_URL}/rest/v1/threat_feeds",
            headers={
                "apikey":        SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type":  "application/json",
                "Prefer":        "resolution=merge-duplicates,return=minimal",
            },
            json=payload,
            timeout=30,
        )
        if r.ok:
            print(f"  ✓ {feed_type}: {len(records):,} kayıt")
            return True
        else:
            print(f"  ✗ {feed_type}: HTTP {r.status_code} — {r.text[:200]}")
            return False
    except Exception as e:
        print(f"  ✗ {feed_type}: {e}")
        return False


# Tam feed'ler
for cat, entries in dated.items():
    records = sorted({v for v, _ in entries})
    if not write_feed(cat, records):
        errors += 1

# Lite feed'ler (sadece domain ve ipv4)
print("Lite feed'ler yazılıyor...")
for window_key, days in WINDOWS.items():
    for cat in ("domain", "ipv4"):
        records = lite_records(dated[cat], days)
        ft = f"{cat}_{window_key}"
        if not write_feed(ft, records):
            errors += 1

print("=" * 60)
total = sum(len({v for v, _ in e}) for e in dated.values())
print(f"Tamamlandı — Toplam: {total:,} kayıt | Hata: {errors}")
print(f"Kaynak: {'USOM/SGB' if usom_ok else 'Fallback (StevenBlack+ipsum)'} + URLhaus")

if errors > 0:
    sys.exit(1)
