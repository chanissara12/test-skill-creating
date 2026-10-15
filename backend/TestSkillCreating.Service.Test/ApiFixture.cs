using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

using Npgsql;

using TestSkillCreating.Domain.Database;

namespace TestSkillCreating.Service.Test;

// Runs the real API in memory against the test database (see DatabaseFactAttribute for the safety guard).
public sealed class ApiFixture : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder) =>
        // Added after the app's own appsettings files (the factory runs as "Development"), so the real database
        // string in appsettings.Development.json can never win over the test one.
        builder.ConfigureAppConfiguration((_, configuration) => configuration.AddInMemoryCollection(
            new Dictionary<string, string?> { ["ConnectionStrings:Default"] = DatabaseFactAttribute.ConnectionString }));

    // Arrange helper: the API only creates entries at "now", so entries at chosen times are inserted directly.
    public async Task SeedAsync(string title, DateTime startedAtUtc, DateTime? stoppedAtUtc)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TimeLogDbContext>();
        db.TimeEntries.Add(new TimeEntry { Title = title, StartedAtUtc = startedAtUtc, StoppedAtUtc = stoppedAtUtc });
        await db.SaveChangesAsync();
    }

    public async Task ResetDatabaseAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TimeLogDbContext>();

        // Second line of defence: whatever the configuration says, never delete from a non-test database.
        var database = new NpgsqlConnectionStringBuilder(db.Database.GetConnectionString()).Database ?? string.Empty;
        if (!database.Contains("test", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException($"The API is pointing at '{database}', which is not a test database. Aborting.");
        }

        await db.TimeEntries.ExecuteDeleteAsync();
    }
}

[CollectionDefinition(Name)]
public sealed class ApiCollection : ICollectionFixture<ApiFixture>
{
    // One shared database, so test classes in this collection must not run in parallel.
    public const string Name = "Api";
}
