using System.Formats.Asn1;
using System.Net;
using System.Net.Sockets;
using System.Numerics;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text;

namespace LiderCollector.Tests;

/// <summary>
/// An in-memory TEST PKI for unit tests only: a throw-away root, a code-signing leaf with a CRL distribution point, and a tiny local HTTP server that serves the CRL.
/// Nothing is installed in any certificate store, nothing is written outside the temp folder, and it is unrelated to the LIDER CA.
/// </summary>
internal sealed class TestPki : IDisposable
{
    public enum Crl { Valid, Revoked, Expired, Unreachable, NoCdp }

    public X509Certificate2 Root { get; }
    public X509Certificate2 Leaf { get; }
    public RSA LeafKey { get; }
    public string RootPemPath { get; }
    public string RootSha256 { get; }
    private readonly TcpListener? _tcp;
    private readonly byte[]? _crl;
    private readonly CancellationTokenSource _cts = new();
    private readonly string _dir;

    public TestPki(string dir, Crl mode = Crl.Valid, DateTimeOffset? leafNotBefore = null, DateTimeOffset? leafNotAfter = null)
    {
        _dir = dir; Directory.CreateDirectory(dir);
        using var rootKey = RSA.Create(2048);
        var rootReq = new CertificateRequest("CN=TEST ROOT (unit tests)", rootKey, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
        rootReq.CertificateExtensions.Add(new X509BasicConstraintsExtension(true, false, 0, true));
        rootReq.CertificateExtensions.Add(new X509KeyUsageExtension(X509KeyUsageFlags.KeyCertSign | X509KeyUsageFlags.CrlSign, true));
        using var rootSelf = rootReq.CreateSelfSigned(DateTimeOffset.UtcNow.AddDays(-30), DateTimeOffset.UtcNow.AddYears(5));
        Root = new X509Certificate2(rootSelf.Export(X509ContentType.Pfx));

        string url = "http://127.0.0.1:1/never.crl";
        if (mode is Crl.Valid or Crl.Revoked or Crl.Expired)
        {
            _tcp = new TcpListener(IPAddress.Loopback, 0); _tcp.Start();
            url = $"http://127.0.0.1:{((IPEndPoint)_tcp.LocalEndpoint).Port}/test.crl";
        }
        else if (mode == Crl.Unreachable)
        {
            var probe = new TcpListener(IPAddress.Loopback, 0); probe.Start(); int port = ((IPEndPoint)probe.LocalEndpoint).Port; probe.Stop();   // a port nobody listens on
            url = $"http://127.0.0.1:{port}/test.crl";
        }

        LeafKey = RSA.Create(2048);
        var leafReq = new CertificateRequest("CN=TEST LIDER Code Signing", LeafKey, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
        leafReq.CertificateExtensions.Add(new X509KeyUsageExtension(X509KeyUsageFlags.DigitalSignature, true));
        leafReq.CertificateExtensions.Add(new X509EnhancedKeyUsageExtension(new OidCollection { new Oid("1.3.6.1.5.5.7.3.3") }, false));
        if (mode != Crl.NoCdp) leafReq.CertificateExtensions.Add(Cdp(url));
        byte[] serial = { 0x01, 0x23, 0x45, 0x67, 0x89, 0xAB, 0xCD, 0xEF };
        using var leafPub = leafReq.Create(Root, leafNotBefore ?? DateTimeOffset.UtcNow.AddDays(-2), leafNotAfter ?? DateTimeOffset.UtcNow.AddYears(2), serial);
        Leaf = new X509Certificate2(leafPub.Export(X509ContentType.Cert));

        RootPemPath = Path.Combine(dir, "test-root.pem");
        File.WriteAllText(RootPemPath, "-----BEGIN CERTIFICATE-----\n" + Convert.ToBase64String(Root.RawData, Base64FormattingOptions.InsertLineBreaks) + "\n-----END CERTIFICATE-----\n");
        RootSha256 = Convert.ToHexString(SHA256.HashData(Root.RawData));

        if (_tcp != null)
        {
            var b = new CertificateRevocationListBuilder();
            if (mode == Crl.Revoked) b.AddEntry(serial, DateTimeOffset.UtcNow.AddHours(-1), X509RevocationReason.KeyCompromise);
            DateTimeOffset next = mode == Crl.Expired ? DateTimeOffset.UtcNow.AddDays(-1) : DateTimeOffset.UtcNow.AddDays(7);
            DateTimeOffset thisUpdate = mode == Crl.Expired ? DateTimeOffset.UtcNow.AddDays(-15) : DateTimeOffset.UtcNow.AddHours(-1);
            _crl = b.Build(Root, new BigInteger(1), next, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1, thisUpdate);
            _ = Task.Run(Serve);
        }
    }

    private static X509Extension Cdp(string url)
    {
        var w = new AsnWriter(AsnEncodingRules.DER);
        using (w.PushSequence())
        using (w.PushSequence())
        using (w.PushSequence(new Asn1Tag(TagClass.ContextSpecific, 0, true)))
        using (w.PushSequence(new Asn1Tag(TagClass.ContextSpecific, 0, true)))
            w.WriteCharacterString(UniversalTagNumber.IA5String, url, new Asn1Tag(TagClass.ContextSpecific, 6));
        return new X509Extension(new Oid("2.5.29.31"), w.Encode(), false);
    }

    private async Task Serve()
    {
        while (!_cts.IsCancellationRequested)
        {
            try
            {
                using var c = await _tcp!.AcceptTcpClientAsync(_cts.Token);
                var s = c.GetStream(); var buf = new byte[4096]; int n = 0;
                while (n < buf.Length) { int r = await s.ReadAsync(buf.AsMemory(n), _cts.Token); if (r <= 0) break; n += r; if (Encoding.ASCII.GetString(buf, 0, n).Contains("\r\n\r\n")) break; }
                var head = Encoding.ASCII.GetBytes($"HTTP/1.1 200 OK\r\nContent-Type: application/pkix-crl\r\nContent-Length: {_crl!.Length}\r\nConnection: close\r\n\r\n");
                await s.WriteAsync(head, _cts.Token); await s.WriteAsync(_crl, _cts.Token); await s.FlushAsync(_cts.Token);
            }
            catch { if (_cts.IsCancellationRequested) return; }
        }
    }

    public void Dispose() { _cts.Cancel(); try { _tcp?.Stop(); } catch { } LeafKey.Dispose(); }
}
