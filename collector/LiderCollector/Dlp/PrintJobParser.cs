using System.Globalization;
using System.Xml.Linq;

namespace LiderCollector.Dlp;

/// <summary>
/// Turns one event of the Windows print-service log (Microsoft-Windows-PrintService/Operational, event 307 "Document N, name owned by user on machine was printed on printer through port, Size in bytes, Pages printed")
/// into a DLP event. Pure: XML in, event out (unit tested with real-shaped XML). Malformed or other events return null, never an exception.
/// </summary>
public static class PrintJobParser
{
    public const string Channel = "Microsoft-Windows-PrintService/Operational";
    public const int DocumentPrintedEventId = 307;

    public static DlpEvent? Parse(string xml, string documentNameMode = "hash")
    {
        try
        {
            var doc = XDocument.Parse(xml, LoadOptions.None);
            var root = doc.Root; if (root is null) return null;
            XElement? Sys(string n) => root.Descendants().FirstOrDefault(e => e.Name.LocalName == n && e.Ancestors().Any(a => a.Name.LocalName == "System"));
            if (!int.TryParse(Sys("EventID")?.Value, out int id) || id != DocumentPrintedEventId) return null;
            string? at = Sys("TimeCreated")?.Attribute("SystemTime")?.Value;
            if (!DateTime.TryParse(at, CultureInfo.InvariantCulture, DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal, out var when)) return null;
            long.TryParse(Sys("EventRecordID")?.Value, out long rec);
            string? computer = Sys("Computer")?.Value;

            string? P(int n) => root.Descendants().FirstOrDefault(e => e.Name.LocalName == "Param" + n && e.Ancestors().Any(a => a.Name.LocalName == "UserData"))?.Value;
            string? job = P(1), docName = P(2), user = P(3), machine = P(4), printer = P(5), port = P(6), bytes = P(7), pages = P(8);
            if (string.IsNullOrWhiteSpace(printer) && string.IsNullOrWhiteSpace(docName)) return null;

            var data = new Dictionary<string, object?>
            {
                ["printer"] = Trim(printer, 190), ["port"] = Trim(port, 120), ["user"] = Trim(user, 190),
                ["document"] = DlpPrivacy.Name(docName, documentNameMode),
            };
            data["event_id"] = (long)DocumentPrintedEventId; if (rec > 0) data["record_id"] = rec; data["computer"] = Trim(computer, 190);   // the Windows event itself (id 307, record number) and the machine as the log names it
            if (long.TryParse(job, out long j)) data["job_id"] = j;
            if (long.TryParse(bytes, out long b)) data["bytes"] = Math.Max(0, b);
            if (long.TryParse(pages, out long pg)) data["pages"] = Math.Max(0, pg);
            string host = Trim(!string.IsNullOrWhiteSpace(machine) ? machine : computer, 190) ?? "";
            string uid = DlpEvent.MakeUid("prt", computer ?? machine, rec, when.Ticks, job);
            return new DlpEvent(uid, "print_job", when, host.Length > 0 ? host : null, data);
        }
        catch { return null; }
    }

    /// <summary>EventRecordID of an event XML (0 when absent): used as the read position.</summary>
    public static long RecordId(string xml)
    {
        try { return long.TryParse(XDocument.Parse(xml).Root?.Descendants().FirstOrDefault(e => e.Name.LocalName == "EventRecordID")?.Value, out long r) ? r : 0; } catch { return 0; }
    }

    private static string? Trim(string? s, int max) { if (string.IsNullOrWhiteSpace(s)) return null; s = new string(s.Where(c => !char.IsControl(c)).ToArray()).Trim(); return s.Length > max ? s[..max] : s; }
}
