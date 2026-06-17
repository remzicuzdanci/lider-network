#!/usr/bin/env python3
"""
Lider Network — SGB/USOM Threat Feed Fetcher
SGB (siberguvenlik.gov.tr) + URLhaus + Feodo + CINS + ThreatFox + EmergingThreats + OpenPhish + Spamhaus
"""

import os, sys, time, re, requests
from datetime import datetime, timezone, timedelta

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("HATA: SUPABASE_URL veya SUPABASE_KEY eksik")
    sys.exit(1)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
}

dated: dict[str, list] = {"domain": [], "ipv4": [], "ipv6": [], "url": []}
seen: set[str] = set()


def classify(t: str, v: str) -> str | None:
    t = (t or "").lower().strip()
    v = (v or "").strip()
    if not v: return None
    if t == "domain": return "domain"
    if t == "url":    return "url"
    if t == "ip":     return "ipv6" if ":" in v else "ipv4"
    if v.startswith("http"): return "url"
    if ":" in v:             return "ipv6"
    if re.match(r"^\d{1,3}(\.\d{1,3}){3}", v): return "ipv4"
    if "." in v: return "domain"
    return None


def parse_date(s) -> datetime | None:
    if not s: return None
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(str(s)[:19], fmt).replace(tzinfo=timezone.utc)
        except Exception:
            continue
    return None


def add(v: str, cat: str, dt=None):
    if v and v not in seen:
        seen.add(v)
        dated[cat].append((v, dt))


# ── 1. SGB API ────────────────────────────────────────────────────────────────
print("=" * 60)
print("SGB API çekiliyor...")
usom_ok = False

try:
    r0 = requests.get(
        "https://siberguvenlik.gov.tr/api/address/index?page=1&per-page=2000",
        headers=HEADERS, timeout=20,
    )
    if r0.ok:
        d0 = r0.json()
        total_count = d0.get("totalCount", 0)
        per_page = 2000
        total_pages = (total_count + per_page - 1) // per_page
        print(f"Toplam: {total_count} kayıt, {total_pages} sayfa")

        def process_items(items):
            for item in items:
                v = (item.get("url") or "").strip()
                if not v: continue
                cat = classify(item.get("type"), v)
                if cat:
                    dt = parse_date(item.get("date") or item.get("added_at"))
                    add(v, cat, dt)

        process_items(d0.get("models", []))

        for page in range(2, total_pages + 1):
            try:
                rp = requests.get(
                    f"https://siberguvenlik.gov.tr/api/address/index?page={page}&per-page=2000",
                    headers=HEADERS, timeout=15,
                )
                if rp.ok:
                    process_items(rp.json().get("models", []))
                if page % 20 == 0:
                    print(f"  Sayfa {page}/{total_pages} — domain:{len(dated['domain'])} ip:{len(dated['ipv4'])}")
                time.sleep(0.1)
            except Exception as e:
                print(f"  Sayfa {page} atlandı: {e}")

        usom_ok = True
        print(f"SGB OK — domain:{len(dated['domain'])} ipv4:{len(dated['ipv4'])} ipv6:{len(dated['ipv6'])} url:{len(dated['url'])}")
    else:
        print(f"SGB API HTTP {r0.status_code} — fallback'e geçiliyor")
except Exception as e:
    print(f"SGB erişim hatası: {e} — fallback'e geçiliyor")

# ── 2. Fallback ───────────────────────────────────────────────────────────────
if not usom_ok:
    print("StevenBlack/hosts çekiliyor...")
    try:
        r = requests.get("https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts", timeout=45)
        for line in r.text.splitlines():
            if line.startswith("0.0.0.0 "):
                parts = line.split()
                if len(parts) >= 2 and parts[1] not in ("0.0.0.0", "localhost"):
                    add(parts[1], "domain")
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
                add(ip, "ipv6" if ":" in ip else "ipv4")
        print(f"  ipsum: {len(dated['ipv4'])} IPv4")
    except Exception as e:
        print(f"  ipsum hatası: {e}")

# ── 3. Feodo Tracker ──────────────────────────────────────────────────────────
print("Feodo Tracker çekiliyor...")
try:
    r = requests.get("https://feodotracker.abuse.ch/downloads/ipblocklist.txt", timeout=20)
    before = len(dated["ipv4"])
    for line in r.text.splitlines():
        line = line.strip()
        if line and not line.startswith("#") and re.match(r"^\d{1,3}(\.\d{1,3}){3}", line):
            add(line.split()[0], "ipv4")
    print(f"  Feodo: +{len(dated['ipv4']) - before} IP")
except Exception as e:
    print(f"  Feodo hatası: {e}")

# ── 4. CINS Score ─────────────────────────────────────────────────────────────
print("CINS Score çekiliyor...")
try:
    r = requests.get("https://cinsscore.com/list/ci-badguys.txt", timeout=20)
    before = len(dated["ipv4"])
    for line in r.text.splitlines():
        line = line.strip()
        if line and not line.startswith("#") and re.match(r"^\d{1,3}(\.\d{1,3}){3}", line):
            add(line, "ipv4")
    print(f"  CINS: +{len(dated['ipv4']) - before} IP")
except Exception as e:
    print(f"  CINS hatası: {e}")

# ── 5. URLhaus ────────────────────────────────────────────────────────────────
print("URLhaus çekiliyor...")
try:
    r = requests.get("https://urlhaus.abuse.ch/downloads/text/", timeout=30)
    before = len(dated["url"])
    for line in r.text.splitlines():
        line = line.strip()
        if line and not line.startswith("#") and line.startswith("http"):
            add(line, "url")
    print(f"  URLhaus: +{len(dated['url']) - before} URL")
except Exception as e:
    print(f"  URLhaus hatası: {e}")

# ── 6. ThreatFox ──────────────────────────────────────────────────────────────
print("ThreatFox çekiliyor...")
try:
    r = requests.post(
        "https://threatfox-api.abuse.ch/api/v1/",
        json={"query": "get_iocs", "days": 90},
        headers={"User-Agent": "Mozilla/5.0"},
        timeout=30,
    )
    tf = r.json()
    if tf.get("query_status") == "ok":
        before = {"d": len(dated["domain"]), "i": len(dated["ipv4"]), "u": len(dated["url"])}
        for ioc in tf.get("data", []):
            val = (ioc.get("ioc") or "").strip()
            ioc_type = ioc.get("ioc_type", "")
            if not val: continue
            if ioc_type == "domain":
                add(val, "domain")
            elif ioc_type == "url":
                add(val, "url")
            elif ioc_type == "ip:port":
                ip = val.split(":")[0]
                if re.match(r"^\d{1,3}(\.\d{1,3}){3}", ip):
                    add(ip, "ipv4")
                elif ":" in ip:
                    add(ip, "ipv6")
        print(f"  ThreatFox: +{len(dated['domain'])-before['d']} domain, +{len(dated['ipv4'])-before['i']} IP, +{len(dated['url'])-before['u']} URL")
except Exception as e:
    print(f"  ThreatFox hatası: {e}")

# ── 7. EmergingThreats ────────────────────────────────────────────────────────
print("EmergingThreats çekiliyor...")
try:
    r = requests.get("https://rules.emergingthreats.net/blockrules/compromised-ips.txt", timeout=20)
    before = len(dated["ipv4"])
    for line in r.text.splitlines():
        line = line.strip()
        if line and not line.startswith("#") and re.match(r"^\d{1,3}(\.\d{1,3}){3}", line):
            add(line, "ipv4")
    print(f"  EmergingThreats: +{len(dated['ipv4']) - before} IP")
except Exception as e:
    print(f"  EmergingThreats hatası: {e}")

# ── 8. OpenPhish ──────────────────────────────────────────────────────────────
print("OpenPhish çekiliyor...")
try:
    r = requests.get("https://openphish.com/feed.txt", timeout=20)
    before = len(dated["url"])
    for line in r.text.splitlines():
        line = line.strip()
        if line and line.startswith("http"):
            add(line, "url")
    print(f"  OpenPhish: +{len(dated['url']) - before} URL")
except Exception as e:
    print(f"  OpenPhish hatası: {e}")

# ── 9. Spamhaus DROP ──────────────────────────────────────────────────────────
print("Spamhaus DROP çekiliyor...")
for drop_url in ["https://www.spamhaus.org/drop/drop.txt", "https://www.spamhaus.org/drop/edrop.txt"]:
    try:
        r = requests.get(drop_url, timeout=20)
        before = len(dated["ipv4"])
        for line in r.text.splitlines():
            line = line.strip().split(";")[0].strip()
            if not line or line.startswith(";") or line.startswith("#"): continue
            ip = line.split("/")[0]
            if re.match(r"^\d{1,3}(\.\d{1,3}){3}", ip):
                add(ip, "ipv4")
        print(f"  Spamhaus ({drop_url.split('/')[-1]}): +{len(dated['ipv4']) - before} IP")
    except Exception as e:
        print(f"  Spamhaus hatası: {e}")

# ── Lite pencere hesaplama ────────────────────────────────────────────────────
now_dt = datetime.now(timezone.utc)
WINDOWS = {"90d": 90, "180d": 180, "365d": 365}


def lite_records(entries: list, days: int) -> list[str]:
    cutoff = now_dt - timedelta(days=days)
    within = sorted([v for v, dt in entries if dt and dt >= cutoff])
    no_date = sorted([v for v, dt in entries if not dt])
    ratio = min(1.0, days / 365)
    no_date_slice = no_date[:max(1, int(len(no_date) * ratio))]
    return sorted(set(within) | set(no_date_slice))


# ── Supabase'e yaz ────────────────────────────────────────────────────────────
print("=" * 60)
print("Supabase'e yazılıyor...")

now_str = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
errors = 0


def write_feed(feed_type: str, records: list[str]) -> bool:
    payload = [{"feed_type": feed_type, "content": "\n".join(records), "record_count": len(records), "updated_at": now_str}]
    try:
        r = requests.post(
            f"{SUPABASE_URL}/rest/v1/threat_feeds",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates,return=minimal",
            },
            json=payload, timeout=60,
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


for cat, entries in dated.items():
    records = sorted({v for v, _ in entries})
    if not write_feed(cat, records):
        errors += 1

print("Lite feed'ler yazılıyor...")
for window_key, days in WINDOWS.items():
    for cat in ("domain", "ipv4"):
        records = lite_records(dated[cat], days)
        if not write_feed(f"{cat}_{window_key}", records):
            errors += 1

print("=" * 60)
total = sum(len({v for v, _ in e}) for e in dated.values())
print(f"Tamamlandı — Toplam: {total:,} kayıt | Hata: {errors}")
print(f"Kaynak: {'SGB' if usom_ok else 'Fallback'} + Feodo + CINS + URLhaus + ThreatFox + EmergingThreats + OpenPhish + Spamhaus")

if errors > 0:
    sys.exit(1)
