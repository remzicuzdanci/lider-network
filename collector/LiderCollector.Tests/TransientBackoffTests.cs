using LiderCollector.Update;
using Xunit;

namespace LiderCollector.Tests;

public class TransientBackoffTests
{
    private static string Dir() { var d = Path.Combine(Path.GetTempPath(), "tb-" + Guid.NewGuid().ToString("N")[..8]); Directory.CreateDirectory(d); return d; }
    private static readonly DateTime T0 = new(2026, 11, 17, 8, 0, 0, DateTimeKind.Utc);

    [Fact] public void The_wait_grows_2_5_15_30_60_and_stays_at_60()
        => Assert.Equal(new[] { 2, 5, 15, 30, 60, 60, 60 }, Enumerable.Range(1, 7).Select(n => (int)TransientBackoff.DelayFor(n).TotalMinutes).ToArray());

    [Fact] public void Retry_after_wins_when_longer_but_never_beyond_six_hours()
    {
        Assert.Equal(TimeSpan.FromMinutes(10), TransientBackoff.DelayFor(1, TimeSpan.FromMinutes(10)));
        Assert.Equal(TimeSpan.FromMinutes(2), TransientBackoff.DelayFor(1, TimeSpan.FromSeconds(5)));
        Assert.Equal(TimeSpan.FromHours(6), TransientBackoff.DelayFor(1, TimeSpan.FromDays(3)));
    }

    [Fact] public void A_failure_blocks_until_the_delay_has_passed_and_repeats_escalate()
    {
        var d = Dir(); try
        {
            Assert.False(TransientBackoff.Active(d, T0));
            Assert.Equal(TimeSpan.FromMinutes(2), TransientBackoff.Fail(d, "429", nowUtc: T0));
            Assert.True(TransientBackoff.Active(d, T0.AddMinutes(1))); Assert.False(TransientBackoff.Active(d, T0.AddMinutes(3)));
            Assert.Equal(TimeSpan.FromMinutes(5), TransientBackoff.Fail(d, "429", nowUtc: T0.AddMinutes(3)));
            Assert.Equal(TimeSpan.FromMinutes(15), TransientBackoff.Fail(d, "timeout", nowUtc: T0.AddMinutes(9)));
        }
        finally { Directory.Delete(d, true); }
    }

    [Fact] public void A_good_download_clears_it_and_the_state_survives_a_restart_and_garbage()
    {
        var d = Dir(); try
        {
            TransientBackoff.Fail(d, "x", nowUtc: DateTime.UtcNow); Assert.True(TransientBackoff.Active(d));      // a "restart" is just reading the file again
            TransientBackoff.Clear(d); Assert.False(TransientBackoff.Active(d));
            Assert.Equal(TimeSpan.FromMinutes(2), TransientBackoff.Fail(d, "x"));                                // counting starts over after a success
            File.WriteAllText(Path.Combine(d, "update-transient.json"), "garbage"); Assert.False(TransientBackoff.Active(d));
            Assert.Empty(Directory.GetFiles(d, "*.tmp"));
        }
        finally { Directory.Delete(d, true); }
    }

    [Fact] public void A_long_reason_is_cut_and_a_retry_after_is_honoured_in_the_stored_wait()
    {
        var d = Dir(); try { var w = TransientBackoff.Fail(d, new string('x', 900), TimeSpan.FromMinutes(20), T0); Assert.Equal(TimeSpan.FromMinutes(20), w); Assert.True(TransientBackoff.Active(d, T0.AddMinutes(19))); Assert.False(TransientBackoff.Active(d, T0.AddMinutes(21))); }
        finally { Directory.Delete(d, true); }
    }
}
