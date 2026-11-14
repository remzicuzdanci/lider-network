using System.Runtime.InteropServices;
using System.Security.Cryptography.X509Certificates;
using System.Text;

namespace LiderCollector.Update;

/// <summary>Result of an Authenticode check: the WinVerifyTrust HRESULT and the signer certificate (null when unsigned).</summary>
internal sealed record AuthenticodeInfo(uint Hr, X509Certificate2? Signer);

internal interface IAuthenticode { AuthenticodeInfo Inspect(string path); }

/// <summary>Reads Windows Installer database values without installing anything.</summary>
internal interface IMsiReader { string? ReadProperty(string msiPath, string property); }

internal sealed record InstalledProduct(string ProductCode, string Version, string? LocalPackage);

/// <summary>WinVerifyTrust (wintrust.dll) with revocation checks off: the chain and revocation policy is applied separately and explicitly by <see cref="PackageVerifier"/>.</summary>
internal sealed class WinTrustAuthenticode : IAuthenticode
{
    public const uint TRUST_E_NOSIGNATURE = 0x800B0100, TRUST_E_BAD_DIGEST = 0x80096010, CERT_E_UNTRUSTEDROOT = 0x800B0109, CERT_E_CHAINING = 0x800B010A;

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct WINTRUST_FILE_INFO { public uint cbStruct; [MarshalAs(UnmanagedType.LPWStr)] public string pcwszFilePath; public IntPtr hFile; public IntPtr pgKnownSubject; }

    [StructLayout(LayoutKind.Sequential)]
    private struct WINTRUST_DATA
    {
        public uint cbStruct; public IntPtr pPolicyCallbackData; public IntPtr pSIPClientData; public uint dwUIChoice; public uint fdwRevocationChecks;
        public uint dwUnionChoice; public IntPtr pFile; public uint dwStateAction; public IntPtr hWVTStateData; public IntPtr pwszURLReference;
        public uint dwProvFlags; public uint dwUIContext; public IntPtr pSignatureSettings;
    }

    [DllImport("wintrust.dll", ExactSpelling = true, CharSet = CharSet.Unicode)]
    private static extern uint WinVerifyTrust(IntPtr hwnd, [MarshalAs(UnmanagedType.LPStruct)] Guid action, ref WINTRUST_DATA data);

    private static readonly Guid GenericVerifyV2 = new("00AAC56B-CD44-11d0-8CC2-00C04FC295EE");

    public AuthenticodeInfo Inspect(string path)
    {
        var fi = new WINTRUST_FILE_INFO { cbStruct = (uint)Marshal.SizeOf<WINTRUST_FILE_INFO>(), pcwszFilePath = path };
        IntPtr pFi = Marshal.AllocHGlobal(Marshal.SizeOf<WINTRUST_FILE_INFO>());
        try
        {
            Marshal.StructureToPtr(fi, pFi, false);
            var data = new WINTRUST_DATA
            {
                cbStruct = (uint)Marshal.SizeOf<WINTRUST_DATA>(), dwUIChoice = 2 /* WTD_UI_NONE */, fdwRevocationChecks = 0 /* WTD_REVOKE_NONE */,
                dwUnionChoice = 1 /* WTD_CHOICE_FILE */, pFile = pFi, dwStateAction = 1 /* WTD_STATEACTION_VERIFY */, dwProvFlags = 0x1000 /* cache-only URL retrieval: no network here */,
            };
            uint hr = WinVerifyTrust(IntPtr.Zero, GenericVerifyV2, ref data);
            data.dwStateAction = 2; /* WTD_STATEACTION_CLOSE */
            WinVerifyTrust(IntPtr.Zero, GenericVerifyV2, ref data);
            X509Certificate2? signer = null;
            if (hr != TRUST_E_NOSIGNATURE)
            {
                try { signer = new X509Certificate2(X509Certificate.CreateFromSignedFile(path)); } catch { signer = null; }
            }
            return new AuthenticodeInfo(hr, signer);
        }
        finally { Marshal.FreeHGlobal(pFi); }
    }
}

/// <summary>msi.dll: property reads (no install) and the installed-product lookup by UpgradeCode.</summary>
internal sealed class MsiNative : IMsiReader
{
    [DllImport("msi.dll", CharSet = CharSet.Unicode)] private static extern uint MsiOpenDatabaseW(string path, IntPtr persist, out IntPtr db);
    [DllImport("msi.dll", CharSet = CharSet.Unicode)] private static extern uint MsiDatabaseOpenViewW(IntPtr db, string query, out IntPtr view);
    [DllImport("msi.dll")] private static extern uint MsiViewExecute(IntPtr view, IntPtr record);
    [DllImport("msi.dll")] private static extern uint MsiViewFetch(IntPtr view, out IntPtr record);
    [DllImport("msi.dll", CharSet = CharSet.Unicode)] private static extern uint MsiRecordGetStringW(IntPtr record, uint field, StringBuilder buf, ref uint size);
    [DllImport("msi.dll")] private static extern uint MsiCloseHandle(IntPtr handle);
    [DllImport("msi.dll", CharSet = CharSet.Unicode)] private static extern uint MsiEnumRelatedProductsW(string upgradeCode, uint reserved, uint index, StringBuilder productCode);
    [DllImport("msi.dll", CharSet = CharSet.Unicode)] private static extern uint MsiGetProductInfoW(string product, string property, StringBuilder value, ref uint size);

    public string? ReadProperty(string msiPath, string property)
    {
        if (property.Any(c => !(char.IsLetterOrDigit(c) || c == '_'))) throw new ArgumentException("property name");
        if (MsiOpenDatabaseW(msiPath, IntPtr.Zero, out var db) != 0) return null;       // 0 = MSIDBOPEN_READONLY
        try
        {
            if (MsiDatabaseOpenViewW(db, $"SELECT `Value` FROM `Property` WHERE `Property`='{property}'", out var view) != 0) return null;
            try
            {
                if (MsiViewExecute(view, IntPtr.Zero) != 0 || MsiViewFetch(view, out var rec) != 0) return null;
                try { return GetString(rec, 1); } finally { MsiCloseHandle(rec); }
            }
            finally { MsiCloseHandle(view); }
        }
        finally { MsiCloseHandle(db); }
    }

    private static string GetString(IntPtr rec, uint field)
    {
        uint size = 0; MsiRecordGetStringW(rec, field, new StringBuilder(), ref size);        // ERROR_MORE_DATA fills size
        var sb = new StringBuilder((int)size + 1); size++; MsiRecordGetStringW(rec, field, sb, ref size);
        return sb.ToString();
    }

    public static InstalledProduct? FindInstalled(string upgradeCode)
    {
        var code = new StringBuilder(39);
        if (MsiEnumRelatedProductsW(upgradeCode, 0, 0, code) != 0) return null;
        string pc = code.ToString();
        return new InstalledProduct(pc, Info(pc, "VersionString") ?? "0.0.0", Info(pc, "LocalPackage"));
    }

    private static string? Info(string product, string prop)
    {
        uint size = 0; MsiGetProductInfoW(product, prop, new StringBuilder(), ref size);
        var sb = new StringBuilder((int)size + 1); size++;
        return MsiGetProductInfoW(product, prop, sb, ref size) == 0 ? sb.ToString() : null;
    }
}
