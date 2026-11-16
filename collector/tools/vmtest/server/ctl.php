<?php
/**
 * Control script of the ISOLATED VM-test server (never part of the application, never run against production).
 * Called by gateway.py with a fixed list of actions - there is no generic "run a command".  Usage (from anywhere):
 *     VMTEST_APP=/home/<user>/vmtest/app VMTEST_HOME=/home/<user>/vmtest php ctl.php <action> [arg]
 * Actions: status | seed | reset | baseline <outfile> | collectors | publish <x.y.z> | withdraw <x.y.z>
 * Safety: refuses unless APP_ENV is not production AND the database name contains "vmtest" or ends in "_test".
 */
$app = getenv('VMTEST_APP') ?: dirname(__DIR__) . '/app';
$home = getenv('VMTEST_HOME') ?: dirname($app);
chdir($app);
require $app . '/vendor/autoload.php';
$laravel = require $app . '/bootstrap/app.php';
$kernel = $laravel->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\TenantDeployToken;
use App\Services\Agent\MsiStamper;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

function out($data, int $code = 0): never { echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n"; exit($code); }
function bad(string $m): never { fwrite(STDERR, "REFUSED: $m\n"); out(['ok' => false, 'error' => $m], 2); }

$dbName = (string) DB::connection()->getDatabaseName();
if (app()->isProduction()) { bad('APP_ENV is production'); }
if (! (str_contains($dbName, 'vmtest') || str_ends_with($dbName, '_test'))) { bad("database '$dbName' is not a test database"); }

$action = $argv[1] ?? 'status';
$arg = $argv[2] ?? '';
$httpUrl = getenv('VMTEST_HTTP_URL') ?: 'http://127.0.0.1:18080';

function seed(): array
{
    $now = ['created_at' => now(), 'updated_at' => now()];
    $t = DB::table('tenants')->where('slug', 'vmtest')->first();
    $tid = $t ? $t->id : DB::table('tenants')->insertGetId(['name' => 'VMTEST', 'slug' => 'vmtest', 'is_active' => true] + $now);
    $c = DB::table('companies')->where('tenant_id', $tid)->where('name', 'VM Test Musteri')->first();
    $cid = $c ? $c->id : DB::table('companies')->insertGetId(['tenant_id' => $tid, 'name' => 'VM Test Musteri'] + $now);
    return [$tid, $cid];
}

function collectors(): array
{
    return DB::table('collectors')->orderBy('id')->get(['id', 'hostname', 'status', 'agent_version', 'update_ring', 'update_fail_count', 'update_failed_version', 'last_heartbeat_at', 'enrolled_at'])->map(fn ($r) => (array) $r)->all();
}

switch ($action) {
    case 'status':
        out(['ok' => true, 'database' => $dbName, 'env' => app()->environment(), 'collectors' => collectors(),
            'manifests' => DB::table('collector_update_manifests')->orderBy('id')->get(['id', 'version', 'channel', 'status', 'halt_reason'])->map(fn ($r) => (array) $r)->all(),
            'update_logs' => DB::table('collector_update_logs')->orderByDesc('id')->limit(15)->get(['id', 'collector_id', 'from_version', 'to_version', 'status', 'attempt_no', 'error_message'])->map(fn ($r) => (array) $r)->all()]);

    case 'seed':
        [$t, $c] = seed();
        out(['ok' => true, 'tenant_id' => $t, 'company_id' => $c]);

    case 'reset':
        if (! (str_contains($dbName, 'vmtest') || str_ends_with($dbName, '_test'))) { bad('not a test database'); }
        Artisan::call('migrate:fresh', ['--force' => true]);
        [$t, $c] = seed();
        out(['ok' => true, 'tenant_id' => $t, 'company_id' => $c, 'note' => 'test database recreated']);

    case 'baseline':      // a freshly stamped (single-use token) 1.3.0 installer for the test customer
        if ($arg === '' || ! preg_match('#^[A-Za-z0-9_./\-]+$#', $arg)) { bad('bad output path'); }
        [$t, $c] = seed();
        $stamper = new MsiStamper();
        $manifest = $stamper->latest();
        if (! $manifest) { bad('no baseline MSI template in storage/app/msi'); }
        [$row, $plain] = TenantDeployToken::issueForCompany($t, $c, null, '127.0.0.1', 'VMTEST');
        $f = fopen($arg, 'wb');
        $stamper->stampTo($manifest, $plain, rtrim($httpUrl, '/'), $f);
        fclose($f);
        out(['ok' => true, 'file' => $arg, 'version' => $manifest['version'], 'sha256' => hash_file('sha256', $arg), 'server_url' => $httpUrl]);

    case 'collectors':
        out(['ok' => true, 'collectors' => collectors()]);

    case 'publish':       // a prepared, TEST-signed package -> manifest on the pilot channel, offered to every collector of the TEST database only
        if (! preg_match('/^\d+\.\d+\.\d+$/', $arg)) { bad('bad version'); }
        $msi = "$home/packages/$arg/LiderITONECollector-$arg-testpki-signed.msi";
        $sig = "$home/packages/$arg/LiderITONECollector-$arg-testpki.pilot.sig";
        if (! is_file($msi) || ! is_file($sig)) { bad("package for $arg is not prepared in $home/packages/$arg"); }
        $ids = DB::table('collectors')->pluck('id')->implode(',');
        if ($ids === '') { bad('no collector is enrolled yet'); }
        $rc = Artisan::call('collector:publish-update', ['msi' => $msi, '--release-version' => $arg, '--channel' => 'pilot', '--signature-file' => $sig, '--targets' => $ids,
            '--min-from' => '1.3.0', '--activate' => true, '--notes' => 'VM test package (TEST PKI)']);
        out(['ok' => $rc === 0, 'artisan' => trim(Artisan::output())], $rc === 0 ? 0 : 2);

    case 'withdraw':
        if (! preg_match('/^\d+\.\d+\.\d+$/', $arg)) { bad('bad version'); }
        $n = DB::table('collector_update_manifests')->where('version', $arg)->update(['status' => 'draft', 'updated_at' => now()]);
        out(['ok' => true, 'withdrawn' => $n]);

    default:
        bad("unknown action '$action'");
}
