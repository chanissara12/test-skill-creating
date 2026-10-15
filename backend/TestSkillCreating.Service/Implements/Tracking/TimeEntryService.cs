using Microsoft.EntityFrameworkCore;

using TestSkillCreating.Domain.Database;
using TestSkillCreating.Domain.Exceptions;
using TestSkillCreating.Domain.Interfaces.Tracking;
using TestSkillCreating.Domain.ViewModels.Tracking;

namespace TestSkillCreating.Service.Implements.Tracking;

public class TimeEntryService(TimeLogDbContext db) : ITimeEntryService
{
    public async Task<IReadOnlyList<TimeEntryViewModel>> ListAsync(DateTime fromUtc, DateTime toUtc)
    {
        if (toUtc <= fromUtc)
        {
            throw new ValidateException("The end of the range must be after its start.");
        }

        return await db.TimeEntries.AsNoTracking()
            .Where(e => e.StartedAtUtc < toUtc && (e.StoppedAtUtc == null || e.StoppedAtUtc > fromUtc))
            .OrderBy(e => e.StartedAtUtc)
            .Select(e => new TimeEntryViewModel(e.Id, e.Title, e.StartedAtUtc, e.StoppedAtUtc))
            .ToListAsync();
    }

    public async Task DeleteAsync(long id)
    {
        // Note: a single statement, so two deletes at once cannot both succeed and a running entry is never matched.
        var deleted = await db.TimeEntries.Where(e => e.Id == id && e.StoppedAtUtc != null).ExecuteDeleteAsync();
        if (deleted > 0)
        {
            return;
        }

        var exists = await db.TimeEntries.AnyAsync(e => e.Id == id);
        throw exists
            ? new ConflictException("The running timer cannot be deleted. Stop it first.")
            : new NotFoundException("This entry does not exist.");
    }
}
