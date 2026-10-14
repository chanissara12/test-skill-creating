using Npgsql;

namespace TestSkillCreating.Service.Test;

// A [Fact] that needs the test database. Skipped (never silently passed) unless TEST_DB_CONNECTION is set,
// and refuses any database whose name does not contain "test", so a test can never write to the real one.
public sealed class DatabaseFactAttribute : FactAttribute
{
    public const string EnvironmentVariable = "TEST_DB_CONNECTION";

    public static string? ConnectionString => Environment.GetEnvironmentVariable(EnvironmentVariable);

    public DatabaseFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(ConnectionString))
        {
            Skip = $"Set {EnvironmentVariable} to the test database connection string.";
            return;
        }

        var database = new NpgsqlConnectionStringBuilder(ConnectionString).Database ?? string.Empty;
        if (!database.Contains("test", StringComparison.OrdinalIgnoreCase))
        {
            Skip = $"Refusing to run: database '{database}' does not look like a test database (its name must contain 'test').";
        }
    }
}
