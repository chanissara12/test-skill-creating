namespace TestSkillCreating.Domain.ViewModels.Tracking;

public record TimeEntryViewModel(long Id, string Title, DateTime StartedAtUtc, DateTime? StoppedAtUtc);
