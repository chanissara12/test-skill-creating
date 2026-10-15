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
}
