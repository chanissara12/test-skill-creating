using TestSkillCreating.Domain.ViewModels.Tracking;

namespace TestSkillCreating.Domain.Interfaces.Tracking;

public interface ITimeEntryService
{
    // Entries that overlap [fromUtc, toUtc), ordered by start time.
    Task<IReadOnlyList<TimeEntryViewModel>> ListAsync(DateTime fromUtc, DateTime toUtc);

    // Deletes a finished entry. The Running Timer must be stopped first.
    Task DeleteAsync(long id);
}
