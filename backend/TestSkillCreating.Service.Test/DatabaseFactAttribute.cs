using Microsoft.Extensions.Configuration;

using Npgsql;

namespace TestSkillCreating.Service.Test;

// A [Fact] that needs the test database. Skipped (never silently passed) unless TEST_DB_CONNECTION is set,
// and refuses any database whose name does not contain "test", so a test can never write to the real one.
public sealed class DatabaseFactAttribute : FactAttribute
{
    public const string EnvironmentVariable = "TEST_DB_CONNECTION";

    // Note: the environment variable wins (CI); otherwise ConnectionStrings:Test from the server's appsettings.Development.json.
    public static string? ConnectionString { get; } =
        Environment.GetEnvironmentVariable(EnvironmentVariable) ?? ReadFromDevelopmentSettings();

    public DatabaseFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(ConnectionString))
        {
            Skip = $"Set {EnvironmentVariable}, or ConnectionStrings:Test in appsettings.Development.json, to the test database connection string.";
            return;
        }

        var database = new NpgsqlConnectionStringBuilder(ConnectionString).Database ?? string.Empty;
        if (!database.Contains("test", StringComparison.OrdinalIgnoreCase))
        {
            Skip = $"Refusing to run: database '{database}' does not look like a test database (its name must contain 'test').";
        }
    }

    // Looks upwards from the test output folder for the server project's settings file.
    private static string? ReadFromDevelopmentSettings()
    {
        for (var directory = new DirectoryInfo(AppContext.BaseDirectory); directory is not null; directory = directory.Parent)
        {
            var file = Path.Combine(directory.FullName, "TestSkillCreating.Server", "appsettings.Development.json");
            if (File.Exists(file))
            {
                return new ConfigurationBuilder().AddJsonFile(file).Build()["ConnectionStrings:Test"];
            }
        }

        return null;
    }
}
