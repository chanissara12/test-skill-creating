using Microsoft.EntityFrameworkCore;

using TestSkillCreating.Domain.Database;
using TestSkillCreating.Domain.Exceptions;
using TestSkillCreating.Domain.Interfaces.Tracking;
using TestSkillCreating.Domain.ViewModels.Tracking;

namespace TestSkillCreating.Service.Implements.Tracking;

public class TimerService(TimeLogDbContext db) : ITimerService
{
    private const int MaxTitleLength = 200;

    public async Task<TimeEntryViewModel> StartAsync(string title)
    {
        title = title.Trim();
        if (title.Length == 0)
        {
            throw new ValidateException("Title is required.");
        }

        if (title.Length > MaxTitleLength)
        {
            throw new ValidateException($"Title must be at most {MaxTitleLength} characters.");
        }

        // Note: check-then-insert is not atomic, so two simultaneous starts (e.g. two tabs) could both pass.
        // Accepted for a single-user local app; there is deliberately no database constraint (see the spec).
        if (await db.TimeEntries.AnyAsync(e => e.StoppedAtUtc == null))
        {
            throw new ConflictException("A timer is already running. Stop it before starting another.");
        }

        var entry = new TimeEntry { Title = title, StartedAtUtc = DateTime.UtcNow };
        db.TimeEntries.Add(entry);
        await db.SaveChangesAsync();
        return ToViewModel(entry);
    }

    public async Task<TimeEntryViewModel> StopAsync()
    {
        var entry = await FindRunningAsync()
            ?? throw new ConflictException("No timer is running.");

        entry.StoppedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return ToViewModel(entry);
    }

    public async Task<TimeEntryViewModel?> GetRunningAsync()
    {
        var entry = await FindRunningAsync();
        return entry is null ? null : ToViewModel(entry);
    }

    private Task<TimeEntry?> FindRunningAsync() =>
        db.TimeEntries.Where(e => e.StoppedAtUtc == null).OrderBy(e => e.StartedAtUtc).FirstOrDefaultAsync();

    private static TimeEntryViewModel ToViewModel(TimeEntry e) =>
        new(e.Id, e.Title, e.StartedAtUtc, e.StoppedAtUtc);
}
