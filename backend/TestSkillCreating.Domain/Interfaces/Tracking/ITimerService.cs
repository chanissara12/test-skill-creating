using TestSkillCreating.Domain.ViewModels.Tracking;

namespace TestSkillCreating.Domain.Interfaces.Tracking;

public interface ITimerService
{
    Task<TimeEntryViewModel> StartAsync(string title);

    Task<TimeEntryViewModel> StopAsync();

    Task<TimeEntryViewModel?> GetRunningAsync();
}
