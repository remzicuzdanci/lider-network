using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using LiderCollector.Update;
using Xunit;

namespace LiderCollector.Tests;

/// <summary>
/// The self-update decision logic with a faked machine: every refusal, the happy path, a failing install, an unhealthy new version (rollback),
/// and a failing rollback. Nothing here touches a real service, msiexec or the network.
/// </summary>
public sealed class MsiUpdaterTests : IDisposable
{
    private const string UC = "{B6A3F291-9D4E-4C7B-8F12-3A5E6D1C0847}";
    private readonly string _dir = Path.Combine(Path.GetTempPath(), "msi-upd-" + Guid.NewGuid().ToString("N"));
    private readonly X509Certificate2 _signer;
    private readonly RSA _key;
    private readonly string _pki;
    private readonly TestPki _tp;

    public MsiUpdaterTests()
    {
        Directory.CreateDirectory(_dir);
        _pki = Path.Combine(_dir, "pki"); Directory.CreateDirectory(_pki);
        _tp = new TestPki(Path.Combine(_dir, "tp"), TestPki.Crl.Valid);          // test root + CDP leaf + local CRL server (in memory, unrelated to LIDER)
        _signer = _tp.Leaf; _key = _tp.LeafKey;
        File.WriteAllBytes(Path.Combine(_pki, "update-signing-cert.cer"), _signer.Export(X509ContentType.Cert));
    }
    public void Dispose() { _tp.Dispose(); try { Directory.Delete(_dir, true); } catch { } }

    private static (X509Certificate2 cert, RSA key) NewCert(string subject, Oid eku, DateTimeOffset from, DateTimeOffset to)
    {
        var rsa = RSA.Create(2048);
        var req = new CertificateRequest(subject, rsa, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
        req.CertificateExtensions.Add(new X509EnhancedKeyUsageExtension(new OidCollection { eku }, false));
        return (req.CreateSelfSigned(from, to), rsa);
    }

    // ── fakes ──────────────────────────────────────────────────────────────────
    private sealed class FakeAuth : IAuthenticode
    {
        public uint Hr; public X509Certificate2? Signer;
        public AuthenticodeInfo Inspect(string path) => new(Hr, Signer);
    }
    /// <summary>"MSI files" in these tests are text: "version|upgradecode".</summary>
    private sealed class FakeMsi : IMsiReader
    {
        public string? ReadProperty(string p, string prop)
        {
            if (!File.Exists(p)) return null;
            var parts = File.ReadAllText(p).Split('|'); if (parts.Length < 2) return null;
            return prop == "ProductVersion" ? parts[0] : prop == "UpgradeCode" ? parts[1] : null;
        }
    }
    private sealed class FakeEnv : IUpdateEnvironment
    {
        public string DataPath { get; init; } = "";
        public DateTime UtcNow { get; private set; } = new(2026, 11, 15, 10, 0, 0, DateTimeKind.Utc);
        public InstalledProduct? Installed;
        public SvcState Svc = SvcState.Running;
        public string ExeVersion = "1.3.0.0";
        public DateTime? Checkin;
        public bool MsiBusy;
        public List<string> Calls = new();
        public Func<IReadOnlyList<string>, int>? OnMsi;
        public Action? OnStart;
        public InstalledProduct? FindInstalled(string uc) => Installed;
        public bool IsMsiBusy() => MsiBusy;
        public int RunMsi(IReadOnlyList<string> a, TimeSpan t) { Calls.Add(a[0] + " " + Path.GetFileName(a.Count > 1 ? a[1] : "")); return OnMsi?.Invoke(a) ?? 0; }
        public SvcState ServiceState() => Svc;
        public void StopService() { Calls.Add("stop"); Svc = SvcState.Stopped; }
        public void StartService() { Calls.Add("start"); Svc = SvcState.Running; OnStart?.Invoke(); }
        public string? InstalledExeVersion() => ExeVersion;
        public DateTime? LastCheckinOkUtc() => Checkin;
        public Task DelayAsync(TimeSpan t, CancellationToken ct) { UtcNow += t; return Task.CompletedTask; }
        public int Armed, Disarmed; public bool UpdaterAlive; public List<int> Killed = new();
        public int SelfPid => 4711;
        public bool UpdaterRunning(int pid) => UpdaterAlive;
        public void KillUpdater(int pid) { Killed.Add(pid); UpdaterAlive = false; }
        public void ArmWatchdog(TimeSpan a) => Armed++;
        public void DisarmWatchdog() => Disarmed++;
    }

    private sealed class Rig
    {
        public FakeEnv Env = null!; public FakeAuth Auth = null!; public UpdatePlan Plan = null!; public PackagePolicy Policy = null!; public MsiUpdater Updater = null!; public string Pkg = "", Local = "";
    }

    private Rig Make(string installed = "1.3.0", string target = "1.4.0", string? tamper = null)
    {
        string data = Path.Combine(_dir, Guid.NewGuid().ToString("N")[..6]); Directory.CreateDirectory(data);
        File.WriteAllText(Path.Combine(data, "collector.json"), "{\"collector_id\":4}"); File.WriteAllText(Path.Combine(data, "secure.dat"), "SECRET-BLOB");
        string local = Path.Combine(data, "cached-installed.msi"); File.WriteAllText(local, $"{installed}|{UC}|installed-copy");
        string pkg = Path.Combine(data, "package.msi"); File.WriteAllText(pkg, $"{target}|{UC}|new-package");
        byte[] bytes = File.ReadAllBytes(pkg); string sha = Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
        string sig = Convert.ToBase64String(_key.SignData(Encoding.UTF8.GetBytes($"{target}:stable:{sha}"), HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1));
        if (tamper == "bytes") File.WriteAllText(pkg, File.ReadAllText(pkg).Replace("new-package", "evil-packag"));   // same length: only the hash can catch it
        var plan = new UpdatePlan { CorrelationId = "corr1", Version = target, Channel = "stable", PackagePath = pkg, Sha256Hash = sha, Size = bytes.Length, SignatureBase64 = sig, SigningCertThumbprint = _signer.Thumbprint };
        var policy = new PackagePolicy(_signer.Thumbprint, UC, _tp.RootSha256, _tp.RootPemPath, _pki);
        var env = new FakeEnv { DataPath = data, Installed = new InstalledProduct("{OLD}", installed, local), ExeVersion = installed + ".0" };
        var auth = new FakeAuth { Hr = 0x800B010A, Signer = _signer };
        var upd = new MsiUpdater(env, policy, auth, new FakeMsi(), new UpdateAuditLogger(data, "corr1")) { HealthTimeout = TimeSpan.FromSeconds(30), PollInterval = TimeSpan.FromSeconds(5) };
        return new Rig { Env = env, Auth = auth, Plan = plan, Policy = policy, Updater = upd, Pkg = pkg, Local = local };
    }

    /// <summary>A normal successful install: msiexec swaps the version, the service comes back and the server accepts a heartbeat.</summary>
    private static void SuccessfulInstall(Rig r, string newVer)
    {
        r.Env.OnMsi = a => { if (a[0] == "/i") { r.Env.Installed = new InstalledProduct("{NEW}", newVer, "x"); r.Env.ExeVersion = newVer + ".0"; r.Env.Checkin = r.Env.UtcNow.AddSeconds(5); } return 0; };
    }

    // ── happy path ────────────────────────────────────────────────────────────
    [Fact]
    public async Task Verified_package_is_installed_and_reported_as_success()
    {
        var r = Make(); SuccessfulInstall(r, "1.4.0");
        var res = await r.Updater.ApplyAsync(r.Plan);
        Assert.Equal("success", res.Status); Assert.Equal("1.3.0", res.FromVersion); Assert.Equal("1.4.0", res.ToVersion);
        Assert.Single(r.Env.Calls, c => c.StartsWith("/i")); Assert.DoesNotContain(r.Env.Calls, c => c.StartsWith("/x"));
        Assert.False(File.Exists(Path.Combine(r.Env.DataPath, "updates", "corr1", "previous-1.3.0.msi")), "the rollback copy (it holds a spent enrolment token) is removed after success");
        Assert.Equal("{\"collector_id\":4}", File.ReadAllText(Path.Combine(r.Env.DataPath, "collector.json")));
    }

    // ── nothing may change when the package is not acceptable ──────────────────
    [Fact] public async Task A_tampered_package_is_refused_before_anything_is_touched()
    {
        var r = Make(tamper: "bytes"); var res = await r.Updater.ApplyAsync(r.Plan);
        Assert.Equal("failed", res.Status); Assert.Contains("SHA-256", res.Error); Assert.Empty(r.Env.Calls);
    }
    [Fact] public async Task A_manifest_naming_another_certificate_is_refused()
    {
        var r = Make(); r.Plan.SigningCertThumbprint = new string('A', 40); var res = await r.Updater.ApplyAsync(r.Plan);
        Assert.Equal("failed", res.Status); Assert.Contains("not the pinned", res.Error); Assert.Empty(r.Env.Calls);
    }
    [Fact] public async Task A_bad_manifest_signature_is_refused()
    {
        var r = Make(); r.Plan.Version = "1.4.0"; r.Plan.SignatureBase64 = Convert.ToBase64String(new byte[256]); var res = await r.Updater.ApplyAsync(r.Plan);
        Assert.Equal("failed", res.Status); Assert.Contains("manifest signature", res.Error); Assert.Empty(r.Env.Calls);
    }
    [Theory]
    [InlineData(0x800B0100u, "not Authenticode-signed")]
    [InlineData(0x80096010u, "bad digest")]
    [InlineData(0x800B0101u, "failed")]
    public async Task An_unsigned_modified_or_otherwise_failing_authenticode_result_is_refused(uint hr, string expect)
    {
        var r = Make(); r.Auth.Hr = hr; if (hr == 0x800B0100u) r.Auth.Signer = null;
        var res = await r.Updater.ApplyAsync(r.Plan);
        Assert.Equal("failed", res.Status); Assert.Contains(expect, res.Error); Assert.Empty(r.Env.Calls);
    }
    [Fact] public async Task A_package_signed_by_a_different_certificate_is_refused()
    {
        var r = Make(); var (other, _) = NewCert("CN=OTHER", new Oid("1.3.6.1.5.5.7.3.3"), DateTimeOffset.UtcNow.AddDays(-1), DateTimeOffset.UtcNow.AddYears(1)); r.Auth.Signer = other;
        var res = await r.Updater.ApplyAsync(r.Plan);
        Assert.Equal("failed", res.Status); Assert.Contains("not the pinned certificate", res.Error); Assert.Empty(r.Env.Calls);
    }
    [Fact] public async Task An_expired_or_non_code_signing_signer_is_refused()
    {
        var r = Make(); r.Updater = new MsiUpdater(r.Env, r.Policy, r.Auth, new FakeMsi(), new UpdateAuditLogger(r.Env.DataPath, "c"));
        var v = PackageVerifier.Verify(r.Pkg, r.Plan, r.Policy, r.Auth, new FakeMsi(), DateTime.UtcNow.AddYears(5));
        Assert.False(v.Ok); Assert.Contains("validity", v.Reason);
        var (tlsOnly, k2) = NewCert("CN=TLS", new Oid("1.3.6.1.5.5.7.3.1"), DateTimeOffset.UtcNow.AddDays(-1), DateTimeOffset.UtcNow.AddYears(1));
        File.WriteAllBytes(Path.Combine(_pki, "update-signing-cert.cer"), tlsOnly.Export(X509ContentType.Cert));
        string sha = r.Plan.Sha256Hash; r.Plan.SignatureBase64 = Convert.ToBase64String(k2.SignData(Encoding.UTF8.GetBytes($"1.4.0:stable:{sha}"), HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1)); r.Plan.SigningCertThumbprint = tlsOnly.Thumbprint;
        var v2 = PackageVerifier.Verify(r.Pkg, r.Plan, r.Policy with { PinnedSignerSha1 = tlsOnly.Thumbprint }, new FakeAuth { Hr = 0, Signer = tlsOnly }, new FakeMsi());
        Assert.False(v2.Ok); Assert.Contains("code-signing", v2.Reason);
    }
    [Fact] public async Task A_msi_of_another_version_or_product_is_refused()
    {
        var r = Make(); File.WriteAllText(r.Pkg, $"9.9.9|{UC}|x");
        var v = PackageVerifier.Verify(r.Pkg, Resign(r), r.Policy, r.Auth, new FakeMsi()); Assert.False(v.Ok); Assert.Contains("version", v.Reason);
        File.WriteAllText(r.Pkg, "1.4.0|{OTHER-PRODUCT}|x"); var v2 = PackageVerifier.Verify(r.Pkg, Resign(r), r.Policy, r.Auth, new FakeMsi()); Assert.False(v2.Ok); Assert.Contains("different product", v2.Reason);
        await Task.CompletedTask;
    }
    private UpdatePlan Resign(Rig r)
    {
        byte[] b = File.ReadAllBytes(r.Pkg); string sha = Convert.ToHexString(SHA256.HashData(b)).ToLowerInvariant();
        r.Plan.Sha256Hash = sha; r.Plan.Size = b.Length; r.Plan.SignatureBase64 = Convert.ToBase64String(_key.SignData(Encoding.UTF8.GetBytes($"{r.Plan.Version}:{r.Plan.Channel}:{sha}"), HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1)); return r.Plan;
    }

    // ── guards ─────────────────────────────────────────────────────────────────
    [Fact] public async Task Same_or_older_target_is_skipped()
    {
        var r = Make("1.4.0", "1.4.0"); var res = await r.Updater.ApplyAsync(r.Plan); Assert.Equal("skipped", res.Status); Assert.Empty(r.Env.Calls);
        var r2 = Make("1.5.0", "1.4.0"); Assert.Equal("skipped", (await r2.Updater.ApplyAsync(r2.Plan)).Status);
    }
    [Fact] public async Task A_busy_windows_installer_makes_it_wait_not_fail()
    {
        var r = Make(); r.Env.MsiBusy = true; var res = await r.Updater.ApplyAsync(r.Plan); Assert.Equal("skipped", res.Status); Assert.Empty(r.Env.Calls);
    }
    [Fact] public async Task Min_from_version_is_enforced()
    {
        var r = Make("1.1.0", "1.4.0"); r.Plan.MinFromVersion = "1.2.0"; var res = await r.Updater.ApplyAsync(r.Plan); Assert.Equal("failed", res.Status); Assert.Empty(r.Env.Calls);
    }
    [Fact] public async Task Without_a_saved_copy_of_the_installed_msi_the_update_is_refused()
    {
        var r = Make(); r.Env.Installed = new InstalledProduct("{OLD}", "1.3.0", null); var res = await r.Updater.ApplyAsync(r.Plan);
        Assert.Equal("failed", res.Status); Assert.Contains("rollback", res.Error); Assert.Empty(r.Env.Calls);
        var r2 = Make(); File.WriteAllText(r2.Local, $"0.0.1|{UC}|wrong"); var res2 = await r2.Updater.ApplyAsync(r2.Plan);
        Assert.Equal("failed", res2.Status); Assert.Empty(r2.Env.Calls);
    }

    // ── failures after the install started ─────────────────────────────────────
    [Fact] public async Task When_msiexec_fails_and_keeps_the_old_version_it_is_reported_and_the_service_is_running()
    {
        var r = Make(); r.Env.OnMsi = a => { r.Env.Svc = SvcState.Stopped; return 1603; };
        var res = await r.Updater.ApplyAsync(r.Plan);
        Assert.Equal("failed", res.Status); Assert.Contains("1603", res.Error);
        Assert.Equal(SvcState.Running, r.Env.Svc); Assert.DoesNotContain(r.Env.Calls, c => c.StartsWith("/x"));
    }

    [Fact] public async Task The_offline_queue_database_is_never_touched_by_a_successful_failed_or_rolled_back_update()
    {
        byte[] queue = Enumerable.Range(0, 5000).Select(i => (byte)(i * 31 % 251)).ToArray();     // stands in for queue.db (+ -wal): the updater must never read, move or rewrite it
        string Q(Rig r) => Path.Combine(r.Env.DataPath, "queue.db");

        var ok = Make(); File.WriteAllBytes(Q(ok), queue); SuccessfulInstall(ok, "1.4.0"); Assert.Equal("success", (await ok.Updater.ApplyAsync(ok.Plan)).Status);
        Assert.Equal(queue, File.ReadAllBytes(Q(ok)));

        var bad = Make(); File.WriteAllBytes(Q(bad), queue); bad.Env.OnMsi = a => { bad.Env.Svc = SvcState.Stopped; return 1603; };
        Assert.Equal("failed", (await bad.Updater.ApplyAsync(bad.Plan)).Status); Assert.Equal(queue, File.ReadAllBytes(Q(bad)));

        var rb = Make(); File.WriteAllBytes(Q(rb), queue); string idFile = Path.Combine(rb.Env.DataPath, "collector.json");
        rb.Env.OnMsi = a =>
        {
            if (a[0] == "/i" && Path.GetFileName(a[1]) == "package.msi") { rb.Env.Installed = new InstalledProduct("{NEW}", "1.4.0", "x"); rb.Env.ExeVersion = "1.4.0.0"; }
            if (a[0] == "/x") rb.Env.Installed = null;
            if (a[0] == "/i" && Path.GetFileName(a[1]).StartsWith("previous-")) { rb.Env.Installed = new InstalledProduct("{OLD}", "1.3.0", "x"); rb.Env.ExeVersion = "1.3.0.0"; }
            return 0;
        };
        rb.Env.OnStart = () => { };
        Assert.Equal("rolled_back", (await rb.Updater.ApplyAsync(rb.Plan)).Status); Assert.Equal(queue, File.ReadAllBytes(Q(rb)));
    }
    [Fact] public async Task A_new_version_that_never_checks_in_is_rolled_back_to_the_saved_msi_and_identity_is_kept()
    {
        var r = Make(); string idFile = Path.Combine(r.Env.DataPath, "collector.json");
        r.Env.OnMsi = a =>
        {
            if (a[0] == "/i" && Path.GetFileName(a[1]) == "package.msi") { r.Env.Installed = new InstalledProduct("{NEW}", "1.4.0", "x"); r.Env.ExeVersion = "1.4.0.0"; File.WriteAllText(idFile, "{\"collector_id\":0}"); /* the bad version damaged the identity */ }
            if (a[0] == "/x") r.Env.Installed = null;
            if (a[0] == "/i" && Path.GetFileName(a[1]).StartsWith("previous-")) { r.Env.Installed = new InstalledProduct("{OLD}", "1.3.0", "x"); r.Env.ExeVersion = "1.3.0.0"; }
            return 0;
        };
        r.Env.OnStart = () => { }; // no heartbeat is ever accepted for 1.4.0
        var res = await r.Updater.ApplyAsync(r.Plan);
        Assert.Equal("rolled_back", res.Status); Assert.Contains("did not become healthy", res.Error);
        Assert.Equal(5, r.Env.Calls.Count);                         // install new, stop, uninstall new, install previous, start
        Assert.Equal("/i package.msi", r.Env.Calls[0]); Assert.Equal("stop", r.Env.Calls[1]); Assert.Equal("start", r.Env.Calls[4]);
        Assert.StartsWith("/x", r.Env.Calls[2]); Assert.Equal("/i previous-1.3.0.msi", r.Env.Calls[3]);
        Assert.Equal("{\"collector_id\":4}", File.ReadAllText(idFile));
        Assert.Equal("1.3.0", r.Env.Installed!.Version);
    }

    [Fact] public async Task A_rollback_that_cannot_reinstall_the_old_version_asks_for_a_person_and_names_the_saved_msi()
    {
        var r = Make();
        r.Env.OnMsi = a =>
        {
            if (a[0] == "/i" && Path.GetFileName(a[1]) == "package.msi") { r.Env.Installed = new InstalledProduct("{NEW}", "1.4.0", "x"); r.Env.ExeVersion = "1.4.0.0"; return 0; }
            if (a[0] == "/x") { r.Env.Installed = null; return 0; }
            return 1603;   // reinstalling the previous MSI fails
        };
        var res = await r.Updater.ApplyAsync(r.Plan);
        Assert.Equal("rollback_failed", res.Status); Assert.Contains("previous-1.3.0.msi", res.Error);
        Assert.True(File.Exists(Path.Combine(r.Env.DataPath, "updates", "corr1", "previous-1.3.0.msi")), "the saved MSI must be kept for the manual recovery");
    }

    [Fact] public async Task A_rolled_back_version_that_is_still_unhealthy_is_reported_as_rollback_failed()
    {
        var r = Make();
        r.Env.OnMsi = a =>
        {
            if (a[0] == "/i" && Path.GetFileName(a[1]) == "package.msi") { r.Env.Installed = new InstalledProduct("{NEW}", "1.4.0", "x"); r.Env.ExeVersion = "1.4.0.0"; }
            if (a[0] == "/x") r.Env.Installed = null;
            if (a[0] == "/i" && Path.GetFileName(a[1]).StartsWith("previous-")) { r.Env.Installed = new InstalledProduct("{OLD}", "1.3.0", "x"); r.Env.ExeVersion = "1.3.0.0"; }
            return 0;
        };
        r.Env.OnStart = () => r.Env.Svc = SvcState.Stopped;      // the service will not come up
        var res = await r.Updater.ApplyAsync(r.Plan);
        Assert.Equal("rollback_failed", res.Status);
    }

    // ── watchdog: the updater itself dies ──────────────────────────────────────
    private static string Journal(Rig r) => UpdateJournal.PathIn(r.Env.DataPath);
    private static void SwapToNew(Rig r) { r.Env.Installed = new InstalledProduct("{NEW}", "1.4.0", "x"); r.Env.ExeVersion = "1.4.0.0"; }
    private static void PreviousBack(Rig r, IReadOnlyList<string> a)
    {
        if (a[0] == "/x") r.Env.Installed = null;
        if (a[0] == "/i" && Path.GetFileName(a[1]).StartsWith("previous-")) { r.Env.Installed = new InstalledProduct("{OLD}", "1.3.0", "x"); r.Env.ExeVersion = "1.3.0.0"; }
    }
    /// <summary>The updater "dies" inside the msiexec call. The handled exception stands in for the death; then the world is set to what a real death would leave behind.</summary>
    private static async Task Die(Rig r, Action worldAtDeath)
    {
        r.Env.OnMsi = a => { if (a[0] == "/i" && Path.GetFileName(a[1]) == "package.msi") throw new IOException("process killed"); PreviousBack(r, a); return 0; };
        await r.Updater.ApplyAsync(r.Plan);
        worldAtDeath(); r.Env.Calls.Clear(); r.Env.Disarmed = 0; r.Env.OnMsi = a => { PreviousBack(r, a); return 0; };
        Assert.True(File.Exists(Journal(r)), "the journal must survive the death");
    }

    [Fact] public async Task A_normal_update_arms_the_watchdog_and_leaves_no_journal_behind()
    {
        var r = Make(); SuccessfulInstall(r, "1.4.0");
        Assert.Equal("success", (await r.Updater.ApplyAsync(r.Plan)).Status);
        Assert.Equal(1, r.Env.Armed); Assert.True(r.Env.Disarmed >= 1); Assert.False(File.Exists(Journal(r)));
    }

    [Fact] public async Task A_journal_exists_while_the_install_runs()
    {
        var r = Make(); string? during = null;
        r.Env.OnMsi = a => { if (a[0] == "/i") { during = File.ReadAllText(Journal(r)); SwapToNew(r); r.Env.Checkin = r.Env.UtcNow.AddSeconds(5); } return 0; };
        await r.Updater.ApplyAsync(r.Plan);
        Assert.Contains("\"phase\":\"installing\"", during); Assert.Contains("\"from_version\":\"1.3.0\"", during); Assert.Contains("previous-1.3.0.msi", during);
        Assert.DoesNotContain("SECRET", during);
    }

    [Fact] public async Task Updater_dies_before_the_swap_the_watchdog_keeps_the_old_version_and_starts_the_stopped_service()
    {
        var r = Make(); await Die(r, () => r.Env.Svc = SvcState.Stopped);      // the MSI's service control had stopped it
        Assert.True(File.Exists(Journal(r)));
        var res = await r.Updater.RecoverAsync();
        Assert.Equal("failed", res!.Status); Assert.Contains("ended unexpectedly", res.Error);
        Assert.Equal("1.3.0", r.Env.Installed!.Version); Assert.Equal(SvcState.Running, r.Env.Svc);
        Assert.False(File.Exists(Journal(r))); Assert.True(r.Env.Disarmed >= 1); Assert.DoesNotContain(r.Env.Calls, c => c.StartsWith("/x"));
    }

    [Fact] public async Task Updater_dies_after_the_swap_and_the_new_version_is_healthy_it_is_kept()
    {
        var r = Make();
        await Die(r, () => { SwapToNew(r); r.Env.Checkin = r.Env.UtcNow.AddSeconds(5); });
        var res = await r.Updater.RecoverAsync();
        Assert.Equal("success", res!.Status); Assert.Equal("1.4.0", r.Env.Installed!.Version); Assert.DoesNotContain(r.Env.Calls, c => c.StartsWith("/x"));
    }

    [Fact] public async Task Updater_dies_after_the_swap_and_the_new_version_never_reports_the_watchdog_rolls_back_and_restores_the_identity()
    {
        var r = Make(); string idFile = Path.Combine(r.Env.DataPath, "collector.json");
        await Die(r, () => { SwapToNew(r); File.WriteAllText(idFile, "{\"collector_id\":0}"); });
        var res = await r.Updater.RecoverAsync();
        Assert.Equal("rolled_back", res!.Status);
        Assert.Equal("1.3.0", r.Env.Installed!.Version); Assert.Equal(SvcState.Running, r.Env.Svc);
        Assert.Equal("{\"collector_id\":4}", File.ReadAllText(idFile)); Assert.False(File.Exists(Journal(r)));
    }

    [Fact] public async Task Updater_dies_with_nothing_installed_the_watchdog_reinstalls_the_saved_msi()
    {
        var r = Make();
        await Die(r, () => { r.Env.Installed = null; r.Env.Svc = SvcState.Missing; });
        var res = await r.Updater.RecoverAsync();
        Assert.Equal("rolled_back", res!.Status); Assert.Equal("1.3.0", r.Env.Installed!.Version); Assert.Equal(SvcState.Running, r.Env.Svc);
        Assert.Contains(r.Env.Calls, c => c == "/i previous-1.3.0.msi");
    }

    [Fact] public async Task A_live_updater_within_its_limits_is_left_alone()
    {
        var r = Make(); await Die(r, () => { }); r.Env.UpdaterAlive = true;
        Assert.Null(await r.Updater.RecoverAsync()); Assert.True(File.Exists(Journal(r))); Assert.Empty(r.Env.Killed);
    }

    [Fact] public async Task A_hung_updater_is_ended_and_the_watchdog_recovers()
    {
        var r = Make(); await Die(r, () => r.Env.Svc = SvcState.Stopped); r.Env.UpdaterAlive = true;
        await r.Env.DelayAsync(TimeSpan.FromMinutes(50), default);                      // the journal has not moved for 50 minutes
        var res = await r.Updater.RecoverAsync();
        Assert.Equal(new[] { 4711 }, r.Env.Killed); Assert.NotNull(res); Assert.Equal(SvcState.Running, r.Env.Svc);
    }

    [Fact] public async Task A_busy_windows_installer_defers_the_recovery()
    {
        var r = Make(); await Die(r, () => { }); r.Env.MsiBusy = true;
        Assert.Null(await r.Updater.RecoverAsync()); Assert.True(File.Exists(Journal(r)));
    }

    [Fact] public async Task Without_a_journal_the_watchdog_does_nothing()
    {
        var r = Make(); Assert.Null(await r.Updater.RecoverAsync()); Assert.Empty(r.Env.Calls);
    }

    [Fact] public async Task An_unreadable_journal_only_makes_sure_the_service_runs()
    {
        var r = Make(); File.WriteAllText(Journal(r), "{ not json"); r.Env.Svc = SvcState.Stopped;
        var res = await r.Updater.RecoverAsync();
        Assert.Equal("failed", res!.Status); Assert.Equal(SvcState.Running, r.Env.Svc); Assert.DoesNotContain(r.Env.Calls, c => c.StartsWith("/"));
    }

    [Fact] public async Task A_missing_saved_msi_is_reported_as_needing_a_person()
    {
        var r = Make();
        await Die(r, () => SwapToNew(r));
        File.Delete(Path.Combine(r.Env.DataPath, "updates", "corr1", "previous-1.3.0.msi"));
        var res = await r.Updater.RecoverAsync();
        Assert.Equal("rollback_failed", res!.Status); Assert.Contains("needs a person", res.Error);
    }

    [Theory] [InlineData("https://liderone.example/", true)] [InlineData("http://192.168.20.61", false)] [InlineData("", false)] [InlineData("ftp://x", false)]
    public void Self_update_is_https_only(string url, bool ok) => Assert.Equal(ok, UpdateTransport.IsHttps(url));

    [Fact] public void File_version_comparison_ignores_the_fourth_part()
    {
        Assert.True(MsiUpdater.SameVersion("1.4.0.0", "1.4.0")); Assert.True(MsiUpdater.SameVersion("1.4.0", "1.4.0")); Assert.False(MsiUpdater.SameVersion("1.4.1.0", "1.4.0")); Assert.False(MsiUpdater.SameVersion(null, "1.4.0"));
    }
}
