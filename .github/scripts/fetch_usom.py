#!/usr/bin/env python3
"""
Lider Network — USOM Threat Feed Fetcher
USOM/SGB'den zararlı bağlantıları çeker, URLhaus ile zenginleştirir,
Supabase'e yazar.
"""

import os, sys, time, requests

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

buckets: dict[str, set] = {"domain": set(), "ipv4": set(), "ipv6": set(), "url": set()}


def classify(t: str, v: str) -> str | None:
    t = (t or "").lower().strip()
    v = (v or "").strip()
    if not v:
        return None
    if t == "domain":
        return "domain"
    if t == "url":
        return "url"
    if t == "ip":
        return "ipv6" if ":" in v else "ipv4"
    # Tip yoksa içeriğe bak
    if v.startswith("http"):
        return "url"
    if ":" in v:
        return "ipv6"
    import re
    if re.match(r"^\d{1,3}(\.\d{1,3}){3}", v):
        return "ipv4"
    if "." in v:
        return "domain"
    return None


# ── 1. USOM API (sayfalı) ────────────────────────────────────────────────────
print("=" * 60)
print("USOM API çekiliyor...")

usom_ok = False
try:
    r0 = requests.get(
        "https://www.usom.gov.tr/api/address/index.json?page=1&per-page=2000",
        headers=USOM_HEADERS,
        timeout=20,
    )
    if r0.ok:
        d0 = r0.json()
        meta = d0.get("meta", {}).get("pagination", {})
        total_pages = int(
            meta.get("page-count")
            or meta.get("total-pages")
            or meta.get("pageCount")
            or 1
        )
        print(f"Toplam sayfa: {total_pages}")

        for item in d0.get("data", []):
            cat = classify(item.get("type"), item.get("url"))
            if cat:
                buckets[cat].add(item["url"].strip())

        for page in range(2, total_pages + 1):
            try:
                rp = requests.get(
                    f"https://www.usom.gov.tr/api/address/index.json?page={page}&per-page=2000",
                    headers=USOM_HEADERS,
                    timeout=15,
                )
                if rp.ok:
                    for item in rp.json().get("data", []):
                        cat = classify(item.get("type"), item.get("url"))
                        if cat:
                            buckets[cat].add(item["url"].strip())
                    if page % 10 == 0:
                        print(f"  Sayfa {page}/{total_pages}...")
                time.sleep(0.2)
            except Exception as e:
                print(f"  Sayfa {page} atlandı: {e}")

        usom_ok = True
        print(f"USOM OK — domain:{len(buckets['domain'])} ip4:{len(buckets['ipv4'])} ip6:{len(buckets['ipv6'])} url:{len(buckets['url'])}")
    else:
        print(f"USOM API HTTP {r0.status_code} — fallback'e geçiliyor")
except Exception as e:
    print(f"USOM erişim hatası: {e} — fallback'e geçiliyor")

# ── 2. Fallback (USOM erişilemezse) ─────────────────────────────────────────
if not usom_ok:
    print("StevenBlack/hosts çekiliyor...")
    try:
        r = requests.get(
            "https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts",
            timeout=45,
        )
        for line in r.text.splitlines():
            if line.startswith("0.0.0.0 "):
                parts = line.split()
                if len(parts) >= 2 and parts[1] not in ("0.0.0.0", "localhost"):
                    buckets["domain"].add(parts[1])
        print(f"  Hosts: {len(buckets['domain'])} domain")
    except Exception as e:
        print(f"  StevenBlack hatası: {e}")

    print("stamparm/ipsum IPv4 çekiliyor...")
    try:
        r = requests.get(
            "https://raw.githubusercontent.com/stamparm/ipsum/master/levels/3.txt",
            timeout=30,
        )
        for line in r.text.splitlines():
            line = line.strip()
            if line and not line.startswith("#"):
                ip = line.split()[0]
                cat = "ipv6" if ":" in ip else "ipv4"
                buckets[cat].add(ip)
        print(f"  ipsum: {len(buckets['ipv4'])} IPv4, {len(buckets['ipv6'])} IPv6")
    except Exception as e:
        print(f"  ipsum hatası: {e}")

# ── 3. URLhaus (her zaman ek kaynak) ─────────────────────────────────────────
print("URLhaus malware URL'leri çekiliyor...")
try:
    r = requests.get(
        "https://urlhaus.abuse.ch/downloads/text/",
        timeout=30,
    )
    before = len(buckets["url"])
    for line in r.text.splitlines():
        line = line.strip()
        if line and not line.startswith("#") and line.startswith("http"):
            buckets["url"].add(line)
    print(f"  URLhaus: +{len(buckets['url']) - before} URL (toplam {len(buckets['url'])})")
except Exception as e:
    print(f"  URLhaus hatası: {e}")

# ── 4. Supabase'e yaz ────────────────────────────────────────────────────────
print("=" * 60)
print("Supabase'e yazılıyor...")

now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
errors = 0

for feed_type, entries in buckets.items():
    records = sorted(entries)
    content = "\n".join(records)

    payload = [{
        "feed_type":    feed_type,
        "content":      content,
        "record_count": len(records),
        "updated_at":   now,
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
        else:
            print(f"  ✗ {feed_type}: HTTP {r.status_code} — {r.text[:200]}")
            errors += 1
    except Exception as e:
        print(f"  ✗ {feed_type} yazma hatası: {e}")
        errors += 1

print("=" * 60)
total = sum(len(v) for v in buckets.values())
print(f"Tamamlandı — Toplam: {total:,} kayıt | Hata: {errors}")
print(f"Kaynak: {'USOM/SGB' if usom_ok else 'Fallback (StevenBlack+ipsum)'}")

if errors > 0:
    sys.exit(1)
