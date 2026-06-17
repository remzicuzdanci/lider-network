<?php
/**
 * Lider Network — USOM Threat Feed Fetcher
 * cPanel cron job olarak çalışır (Türkiye IP → USOM'a erişim sağlar)
 *
 * Cron: 0 */2 * * *  /usr/local/bin/php /home/KULLANICI/fetch_usom.php
 */

// ── Ayarlar ──────────────────────────────────────────────────────────────────
define('SUPABASE_URL', 'BURAYA_SUPABASE_URL');          // https://xxx.supabase.co
define('SUPABASE_KEY', 'BURAYA_SERVICE_ROLE_KEY');       // service_role key
define('MAX_EXEC_SECONDS', 600);                         // 10 dakika max

set_time_limit(MAX_EXEC_SECONDS);
ini_set('memory_limit', '256M');
error_reporting(E_ALL);

$started = microtime(true);

// ── Yardımcı fonksiyonlar ─────────────────────────────────────────────────────
function log_msg(string $msg): void {
    echo '[' . date('H:i:s') . '] ' . $msg . PHP_EOL;
}

function fetch_url(string $url, int $timeout = 20): ?string {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => $timeout,
        CURLOPT_USERAGENT      => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        CURLOPT_HTTPHEADER     => [
            'Accept: application/json, text/plain',
            'Referer: https://www.usom.gov.tr/',
        ],
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_FOLLOWLOCATION => true,
    ]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ($body !== false && $code === 200) ? $body : null;
}

function supabase_upsert(string $feed_type, array $records): bool {
    $content      = implode("\n", array_unique($records));
    $record_count = count(array_unique($records));
    $payload      = json_encode([[
        'feed_type'    => $feed_type,
        'content'      => $content,
        'record_count' => $record_count,
        'updated_at'   => gmdate('Y-m-d\TH:i:s\Z'),
    ]]);

    $ch = curl_init(SUPABASE_URL . '/rest/v1/threat_feeds');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_TIMEOUT        => 60,
        CURLOPT_HTTPHEADER     => [
            'apikey: '        . SUPABASE_KEY,
            'Authorization: Bearer ' . SUPABASE_KEY,
            'Content-Type: application/json',
            'Prefer: resolution=merge-duplicates,return=minimal',
        ],
    ]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $ok = $code >= 200 && $code < 300;
    log_msg(($ok ? '  ✓' : '  ✗') . " {$feed_type}: {$record_count} kayıt (HTTP {$code})");
    return $ok;
}

function classify(string $type, string $value): ?string {
    $type  = strtolower(trim($type));
    $value = trim($value);
    if (!$value) return null;
    if ($type === 'domain') return 'domain';
    if ($type === 'url')    return 'url';
    if ($type === 'ip')     return strpos($value, ':') !== false ? 'ipv6' : 'ipv4';
    if (str_starts_with($value, 'http')) return 'url';
    if (strpos($value, ':') !== false)   return 'ipv6';
    if (preg_match('/^\d{1,3}(\.\d{1,3}){3}/', $value)) return 'ipv4';
    if (strpos($value, '.') !== false)   return 'domain';
    return null;
}

// ── Veri kapları ──────────────────────────────────────────────────────────────
$buckets = ['domain' => [], 'ipv4' => [], 'ipv6' => [], 'url' => []];

// ── 1. USOM API ───────────────────────────────────────────────────────────────
log_msg('=== USOM API çekiliyor ===');
$usom_ok = false;

$first_raw = fetch_url('https://www.usom.gov.tr/api/address/index.json?page=1&per-page=2000', 20);
if ($first_raw) {
    $first = json_decode($first_raw, true);
    $pagination  = $first['meta']['pagination'] ?? [];
    $total_pages = (int) ($pagination['page-count'] ?? $pagination['total-pages'] ?? $pagination['pageCount'] ?? 1);
    log_msg("Toplam sayfa: {$total_pages}");

    $process = function(array $data) use (&$buckets): void {
        foreach ($data as $item) {
            $cat = classify($item['type'] ?? '', $item['url'] ?? '');
            if ($cat) $buckets[$cat][] = trim($item['url']);
        }
    };

    $process($first['data'] ?? []);

    for ($page = 2; $page <= $total_pages; $page++) {
        $raw = fetch_url("https://www.usom.gov.tr/api/address/index.json?page={$page}&per-page=2000", 15);
        if ($raw) {
            $d = json_decode($raw, true);
            $process($d['data'] ?? []);
        }
        if ($page % 20 === 0) {
            log_msg("  Sayfa {$page}/{$total_pages} — domain:" . count($buckets['domain']));
        }
        usleep(200000); // 0.2s gecikme
    }

    $usom_ok = true;
    log_msg('USOM OK — domain:' . count($buckets['domain']) .
            ' ipv4:' . count($buckets['ipv4']) .
            ' ipv6:' . count($buckets['ipv6']) .
            ' url:' . count($buckets['url']));
} else {
    log_msg('USOM API erişilemiyor — fallback kaynaklar kullanılıyor');
}

// ── 2. Fallback (USOM yoksa) ──────────────────────────────────────────────────
if (!$usom_ok) {
    log_msg('StevenBlack/hosts çekiliyor...');
    $raw = fetch_url('https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts', 45);
    if ($raw) {
        foreach (explode("\n", $raw) as $line) {
            if (str_starts_with($line, '0.0.0.0 ')) {
                $parts = preg_split('/\s+/', $line);
                if (!empty($parts[1]) && !in_array($parts[1], ['0.0.0.0', 'localhost'])) {
                    $buckets['domain'][] = $parts[1];
                }
            }
        }
        log_msg('  Hosts: ' . count($buckets['domain']) . ' domain');
    }

    log_msg('stamparm/ipsum IPv4 çekiliyor...');
    $raw = fetch_url('https://raw.githubusercontent.com/stamparm/ipsum/master/levels/3.txt', 30);
    if ($raw) {
        foreach (explode("\n", $raw) as $line) {
            $line = trim($line);
            if ($line && $line[0] !== '#') {
                $ip  = explode(' ', $line)[0];
                $cat = strpos($ip, ':') !== false ? 'ipv6' : 'ipv4';
                $buckets[$cat][] = $ip;
            }
        }
        log_msg('  ipsum: ' . count($buckets['ipv4']) . ' IPv4');
    }
}

// ── 3. Feodo Tracker botnet C2 ────────────────────────────────────────────────
log_msg('Feodo Tracker C2 IP çekiliyor...');
$raw = fetch_url('https://feodotracker.abuse.ch/downloads/ipblocklist.txt', 20);
if ($raw) {
    $before = count($buckets['ipv4']);
    $seen   = array_flip($buckets['ipv4']);
    foreach (explode("\n", $raw) as $line) {
        $line = trim($line);
        if ($line && $line[0] !== '#' && preg_match('/^\d{1,3}(\.\d{1,3}){3}/', $line)) {
            $ip = explode(' ', $line)[0];
            if (!isset($seen[$ip])) { $seen[$ip] = 1; $buckets['ipv4'][] = $ip; }
        }
    }
    log_msg('  Feodo: +' . (count($buckets['ipv4']) - $before) . ' IP');
}

// ── 4. CINS Score ─────────────────────────────────────────────────────────────
log_msg('CINS Score çekiliyor...');
$raw = fetch_url('https://cinsscore.com/list/ci-badguys.txt', 20);
if ($raw) {
    $before = count($buckets['ipv4']);
    $seen   = array_flip($buckets['ipv4']);
    foreach (explode("\n", $raw) as $line) {
        $line = trim($line);
        if ($line && $line[0] !== '#' && preg_match('/^\d{1,3}(\.\d{1,3}){3}/', $line)) {
            if (!isset($seen[$line])) { $seen[$line] = 1; $buckets['ipv4'][] = $line; }
        }
    }
    log_msg('  CINS: +' . (count($buckets['ipv4']) - $before) . ' IP');
}

// ── 5. URLhaus ────────────────────────────────────────────────────────────────
log_msg('URLhaus URL çekiliyor...');
$raw = fetch_url('https://urlhaus.abuse.ch/downloads/text/', 30);
if ($raw) {
    $before  = count($buckets['url']);
    $url_set = array_flip($buckets['url']);
    foreach (explode("\n", $raw) as $line) {
        $line = trim($line);
        if ($line && $line[0] !== '#' && str_starts_with($line, 'http') && !isset($url_set[$line])) {
            $url_set[$line] = 1;
            $buckets['url'][] = $line;
        }
    }
    log_msg('  URLhaus: +' . (count($buckets['url']) - $before) . ' URL');
}

// ── 6. Supabase'e yaz ─────────────────────────────────────────────────────────
log_msg('=== Supabase\'e yazılıyor ===');
$errors = 0;
foreach ($buckets as $type => $records) {
    $unique = array_values(array_unique($records));
    sort($unique);
    if (!supabase_upsert($type, $unique)) $errors++;
}

// Lite feed'ler (domain + ipv4, son N kayıt — tarihsiz fallback)
log_msg('Lite feed\'ler yazılıyor...');
$lite_windows = ['90d' => 0.25, '180d' => 0.50, '365d' => 1.0];
foreach (['domain', 'ipv4'] as $type) {
    $all = array_values(array_unique($buckets[$type]));
    sort($all);
    foreach ($lite_windows as $window => $ratio) {
        $slice = array_slice($all, 0, (int) ceil(count($all) * $ratio));
        if (!supabase_upsert("{$type}_{$window}", $slice)) $errors++;
    }
}

// ── Özet ─────────────────────────────────────────────────────────────────────
$elapsed = round(microtime(true) - $started, 1);
$total   = array_sum(array_map('count', $buckets));
log_msg('=== Tamamlandı ===');
log_msg("Toplam: {$total} kayıt | Hata: {$errors} | Süre: {$elapsed}s");
log_msg('Kaynak: ' . ($usom_ok ? 'USOM/SGB' : 'Fallback') . ' + Feodo + CINS + URLhaus');
