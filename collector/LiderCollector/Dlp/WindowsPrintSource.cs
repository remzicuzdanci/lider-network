using System.Diagnostics.Eventing.Reader;

namespace LiderCollector.Dlp;

/// <summary>
/// Print jobs from the Windows print-service operational log (event 307). Nothing is installed or hooked: the Collector only READS the log. The log is off by default in Windows; with
/// <see cref="DlpConfig.PrintConfig.AutoEnableLog"/> the Collector switches that single channel on once (it runs as LocalSystem), so the printers are discovered with no manual set-up.
/// Position = EventRecordID. First run: the last <c>BackfillHours</c> only.
/// </summary>
public sealed class WindowsPrintSource : IDlpSource
{
    public string Name => "print";
    public bool IsEnabled(DlpConfig cfg) => cfg.Print.Enabled;

    public bool Prepare(DlpConfig cfg, out string? problem)
    {
        problem = null;
        try
        {
            using var c = new EventLogConfiguration(PrintJobParser.Channel);
            if (c.IsEnabled) return true;
            if (!cfg.Print.AutoEnableLog) { problem = "the Windows print-service log is switched off and auto_enable_log is false"; return false; }
            c.IsEnabled = true; c.SaveChanges();
            return true;
        }
        catch (Exception ex) { problem = "print-service log unavailable: " + ex.Message; return false; }
    }

    public IReadOnlyList<(long Position, DlpEvent Event)> ReadNew(long afterPosition, int max, DlpConfig cfg)
    {
        string xpath = afterPosition > 0
            ? $"*[System[(EventID={PrintJobParser.DocumentPrintedEventId}) and (EventRecordID > {afterPosition})]]"
            : $"*[System[(EventID={PrintJobParser.DocumentPrintedEventId}) and TimeCreated[timediff(@SystemTime) <= {(long)Math.Max(1, cfg.Print.BackfillHours) * 3600 * 1000}]]]";
        var result = new List<(long, DlpEvent)>();
        using var reader = new EventLogReader(new EventLogQuery(PrintJobParser.Channel, PathType.LogName, xpath));
        for (EventRecord? rec = reader.ReadEvent(); rec is not null && result.Count < max; rec = reader.ReadEvent())
        {
            using (rec)
            {
                string xml = rec.ToXml();
                var e = PrintJobParser.Parse(xml, cfg.Print.DocumentName);
                long id = rec.RecordId ?? PrintJobParser.RecordId(xml);
                if (e is not null) result.Add((id, e));
                else if (id > 0) result.Add((id, new DlpEvent(DlpEvent.MakeUid("skip", id), "skipped", DateTime.UtcNow, null, new Dictionary<string, object?>())));   // unparsable: advance past it, never sent (filtered below)
            }
        }
        return result;   // unparsable records come back as type 'skipped': the collector moves past them but never sends them
    }


}
