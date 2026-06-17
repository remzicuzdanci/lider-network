<?php
/**
 * Lider Network — SGB/USOM Threat Feed Fetcher (cPanel)
 * SGB (siberguvenlik.gov.tr) + URLhaus + Feodo + CINS + ThreatFox + EmergingThreats + OpenPhish + Spamhaus
 *
 * Cron: 0 */2 * * *  /usr/local/bin/php /home/KULLANICI/fetch_usom.php
 */

define('SUPABASE_URL', 'BURAYA_SUPABASE_URL');          // https://xxx.supabase.co
define('SUPABASE_KEY', 'BURAYA_SERVICE_ROLE_KEY');       // service_role key
define('MAX_EXEC_SECONDS', 600);                         // 10 dakika max

set_time_limit(MAX_EXEC_SECONDS);
ini_set('memory_limit', '512M');
error_reporting(E_ALL);

$started = microtime(true);

function log_msg(string $msg): void {
    echo '[' . date('H:i:s') . '] ' . $msg . PHP_EOL;
}

function fetch_url(string $url, int $timeout = 20, array $extra_headers = []): ?string {
    $ch = curl_init($url);
    $headers = array_merge([
        'Accept: application/json, text/plain',
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    ], $extra_headers);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => $timeout,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_FOLLOWLOCATION => true,
    ]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ($body !== false && $code === 200) ? $body : null;
}

function fetch_post(string $url, string $json_body, int $timeout = 30): ?string {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $json_body,
        CURLOPT_TIMEOUT        => $timeout,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'User-Agent: Mozilla/5.0',
        ],
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ($body !== false && $code === 200) ? $body : null;
}

function supabase_upsert(string $feed_type, array $records): bool {
    $unique       = array_values(array_unique($records));
    $content      = implode("\n", $unique);
    $record_count = count($unique);
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
            'apikey: '              . SUPABASE_KEY,
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
    if (str_starts_with($value, 'http'))         return 'url';
    if (strpos($value, ':') !== false)           return 'ipv6';
    if (preg_match('/^\d{1,3}(\.\d{1,3}){3}/', $value)) return 'ipv4';
    if (strpos($value, '.') !== false)           return 'domain';
    return null;
}

// ── Veri kapları ──────────────────────────────────────────────────────────────
$seen    = [];
$buckets = ['domain' => [], 'ipv4' => [], 'ipv6' => [], 'url' => []];

function add(string $value, string $cat): void {
    global $seen, $buckets;
    $value = trim($value);
    if (!$value || isset($seen[$value])) return;
    $seen[$value] = true;
    $buckets[$cat][] = $value;
}

// ── 1. SGB API ────────────────────────────────────────────────────────────────
log_msg('=== SGB API çekiliyor ===');
$usom_ok  = false;
$per_page = 2000;

$first_raw = fetch_url("https://siberguvenlik.gov.tr/api/address/index?page=1&per-page={$per_page}", 20);
if ($first_raw) {
    $first_data  = json_decode($first_raw, true);
    $total_count = (int) ($first_data['totalCount'] ?? 0);
    $total_pages = (int) ceil($total_count / $per_page);

    log_msg("Toplam: {$total_count} kayıt, {$total_pages} sayfa");

    $process = function(array $items): void {
        foreach ($items as $item) {
            $v   = trim($item['url'] ?? '');
            $cat = classify($item['type'] ?? '', $v);
            if ($cat) add($v, $cat);
        }
    };

    $process($first_data['models'] ?? []);

    for ($page = 2; $page <= $total_pages; $page++) {
        $raw = fetch_url("https://siberguvenlik.gov.tr/api/address/index?page={$page}&per-page={$per_page}", 15);
        if ($raw) {
            $d = json_decode($raw, true);
            $process($d['models'] ?? []);
        }
        if ($page % 20 === 0) {
            log_msg("  Sayfa {$page}/{$total_pages} — domain:" . count($buckets['domain']) . " ip:" . count($buckets['ipv4']));
        }
        usleep(100000); // 0.1s
    }

    $usom_ok = true;
    log_msg('SGB OK — domain:' . count($buckets['domain']) .
            ' ipv4:' . count($buckets['ipv4']) .
            ' ipv6:' . count($buckets['ipv6']) .
            ' url:' . count($buckets['url']));
} else {
    log_msg('SGB API erişilemiyor — fallback kaynaklar kullanılıyor');
}

// ── 2. Fallback ───────────────────────────────────────────────────────────────
if (!$usom_ok) {
    log_msg('StevenBlack/hosts çekiliyor...');
    $raw = fetch_url('https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts', 45);
    if ($raw) {
        foreach (explode("\n", $raw) as $line) {
            if (str_starts_with($line, '0.0.0.0 ')) {
                $parts = preg_split('/\s+/', $line);
                if (!empty($parts[1]) && !in_array($parts[1], ['0.0.0.0', 'localhost'])) {
                    add($parts[1], 'domain');
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
                add($ip, strpos($ip, ':') !== false ? 'ipv6' : 'ipv4');
            }
        }
        log_msg('  ipsum: ' . count($buckets['ipv4']) . ' IPv4');
    }
}

// ── 3. Feodo Tracker ──────────────────────────────────────────────────────────
log_msg('Feodo Tracker çekiliyor...');
$raw = fetch_url('https://feodotracker.abuse.ch/downloads/ipblocklist.txt', 20);
if ($raw) {
    $before = count($buckets['ipv4']);
    foreach (explode("\n", $raw) as $line) {
        $line = trim($line);
        if ($line && $line[0] !== '#' && preg_match('/^\d{1,3}(\.\d{1,3}){3}/', $line)) {
            add(explode(' ', $line)[0], 'ipv4');
        }
    }
    log_msg('  Feodo: +' . (count($buckets['ipv4']) - $before) . ' IP');
}

// ── 4. CINS Score ─────────────────────────────────────────────────────────────
log_msg('CINS Score çekiliyor...');
$raw = fetch_url('https://cinsscore.com/list/ci-badguys.txt', 20);
if ($raw) {
    $before = count($buckets['ipv4']);
    foreach (explode("\n", $raw) as $line) {
        $line = trim($line);
        if ($line && $line[0] !== '#' && preg_match('/^\d{1,3}(\.\d{1,3}){3}/', $line)) {
            add($line, 'ipv4');
        }
    }
    log_msg('  CINS: +' . (count($buckets['ipv4']) - $before) . ' IP');
}

// ── 5. URLhaus ────────────────────────────────────────────────────────────────
log_msg('URLhaus çekiliyor...');
$raw = fetch_url('https://urlhaus.abuse.ch/downloads/text/', 30);
if ($raw) {
    $before = count($buckets['url']);
    foreach (explode("\n", $raw) as $line) {
        $line = trim($line);
        if ($line && $line[0] !== '#' && str_starts_with($line, 'http')) {
            add($line, 'url');
        }
    }
    log_msg('  URLhaus: +' . (count($buckets['url']) - $before) . ' URL');
}

// ── 6. ThreatFox ──────────────────────────────────────────────────────────────
log_msg('ThreatFox çekiliyor...');
$tf_raw = fetch_post(
    'https://threatfox-api.abuse.ch/api/v1/',
    json_encode(['query' => 'get_iocs', 'days' => 90]),
    30
);
if ($tf_raw) {
    $tf = json_decode($tf_raw, true);
    if (($tf['query_status'] ?? '') === 'ok') {
        $before = ['d' => count($buckets['domain']), 'i' => count($buckets['ipv4']), 'u' => count($buckets['url'])];
        foreach ($tf['data'] ?? [] as $ioc) {
            $val      = trim($ioc['ioc'] ?? '');
            $ioc_type = $ioc['ioc_type'] ?? '';
            if (!$val) continue;
            if ($ioc_type === 'domain') add($val, 'domain');
            elseif ($ioc_type === 'url') add($val, 'url');
            elseif ($ioc_type === 'ip:port') {
                $ip = explode(':', $val)[0];
                if (preg_match('/^\d{1,3}(\.\d{1,3}){3}/', $ip)) add($ip, 'ipv4');
                elseif (strpos($ip, ':') !== false) add($ip, 'ipv6');
            }
        }
        log_msg('  ThreatFox: +' . (count($buckets['domain'])-$before['d']) . ' domain, ' .
                '+' . (count($buckets['ipv4'])-$before['i']) . ' IP, ' .
                '+' . (count($buckets['url'])-$before['u']) . ' URL');
    }
} else {
    log_msg('  ThreatFox: erişilemiyor');
}

// ── 7. EmergingThreats ────────────────────────────────────────────────────────
log_msg('EmergingThreats çekiliyor...');
$raw = fetch_url('https://rules.emergingthreats.net/blockrules/compromised-ips.txt', 20);
if ($raw) {
    $before = count($buckets['ipv4']);
    foreach (explode("\n", $raw) as $line) {
        $line = trim($line);
        if ($line && $line[0] !== '#' && preg_match('/^\d{1,3}(\.\d{1,3}){3}/', $line)) {
            add($line, 'ipv4');
        }
    }
    log_msg('  EmergingThreats: +' . (count($buckets['ipv4']) - $before) . ' IP');
}

// ── 8. OpenPhish ──────────────────────────────────────────────────────────────
log_msg('OpenPhish çekiliyor...');
$raw = fetch_url('https://openphish.com/feed.txt', 20);
if ($raw) {
    $before = count($buckets['url']);
    foreach (explode("\n", $raw) as $line) {
        $line = trim($line);
        if ($line && str_starts_with($line, 'http')) add($line, 'url');
    }
    log_msg('  OpenPhish: +' . (count($buckets['url']) - $before) . ' URL');
}

// ── 9. Spamhaus DROP + EDROP ─────────────────────────────────────────────────
log_msg('Spamhaus DROP çekiliyor...');
foreach (['https://www.spamhaus.org/drop/drop.txt', 'https://www.spamhaus.org/drop/edrop.txt'] as $drop_url) {
    $raw = fetch_url($drop_url, 20);
    if ($raw) {
        $before = count($buckets['ipv4']);
        foreach (explode("\n", $raw) as $line) {
            $line = trim(explode(';', $line)[0]);
            if (!$line || $line[0] === ';' || $line[0] === '#') continue;
            $ip = explode('/', $line)[0];
            if (preg_match('/^\d{1,3}(\.\d{1,3}){3}/', $ip)) add($ip, 'ipv4');
        }
        log_msg('  Spamhaus (' . basename($drop_url) . '): +' . (count($buckets['ipv4']) - $before) . ' IP');
    }
}

// ── Supabase'e yaz ────────────────────────────────────────────────────────────
log_msg('=== Supabase\'e yazılıyor ===');
$errors = 0;
foreach ($buckets as $type => $records) {
    sort($records);
    if (!supabase_upsert($type, $records)) $errors++;
}

// Lite feed'ler
log_msg('Lite feed\'ler yazılıyor...');
$lite_windows = ['90d' => 0.25, '180d' => 0.50, '365d' => 1.0];
foreach (['domain', 'ipv4'] as $type) {
    $all = $buckets[$type];
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
log_msg('Kaynak: ' . ($usom_ok ? 'SGB' : 'Fallback') . ' + Feodo + CINS + URLhaus + ThreatFox + EmergingThreats + OpenPhish + Spamhaus');
