namespace TestSkillCreating.Domain.Database;

// Maps the existing time_entry table (see backend/sql). A Running Timer is a row with no StoppedAtUtc.
public class TimeEntry
{
    public long Id { get; set; }

    public string Title { get; set; } = string.Empty;

    // Npgsql requires DateTime.Kind == Utc when writing timestamptz.
    public DateTime StartedAtUtc { get; set; }

    public DateTime? StoppedAtUtc { get; set; }
}
