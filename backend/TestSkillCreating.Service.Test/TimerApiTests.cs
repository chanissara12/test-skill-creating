using System.Net;
using System.Net.Http.Json;
using System.Text;

using TestSkillCreating.Domain.ViewModels.Tracking;

namespace TestSkillCreating.Service.Test;

[Collection(ApiCollection.Name)]
public class TimerApiTests(ApiFixture api) : IAsyncLifetime
{
    private readonly HttpClient _client = api.CreateClient();

    public Task InitializeAsync() => api.ResetDatabaseAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    private Task<HttpResponseMessage> StartAsync(string title) =>
        _client.PostAsJsonAsync("/api/timer/start", new { title });

    private Task<HttpResponseMessage> StopAsync() =>
        _client.PostAsync("/api/timer/stop", content: null);

    [DatabaseFact]
    public async Task Start_creates_a_running_timer_with_the_trimmed_title_and_server_time()
    {
        var before = DateTime.UtcNow;

        var response = await StartAsync("  Write report  ");

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var entry = await response.Content.ReadFromJsonAsync<TimeEntryViewModel>();
        Assert.NotNull(entry);
        Assert.Equal("Write report", entry.Title);
        Assert.Null(entry.StoppedAtUtc);
        Assert.InRange(entry.StartedAtUtc, before.AddSeconds(-1), DateTime.UtcNow.AddSeconds(1));
    }

    [DatabaseFact]
    public async Task Start_rejects_an_empty_or_blank_title()
    {
        foreach (var title in new[] { "", "   " })
        {
            var response = await StartAsync(title);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            await ApiAssert.HasMessageAsync(response);
        }
    }

    [DatabaseFact]
    public async Task Start_measures_the_title_length_after_trimming()
    {
        // 200 characters plus surrounding spaces is fine: only the trimmed text counts.
        var accepted = await StartAsync("  " + new string('a', 200) + "  ");
        Assert.Equal(HttpStatusCode.Created, accepted.StatusCode);
        var entry = await accepted.Content.ReadFromJsonAsync<TimeEntryViewModel>();
        Assert.Equal(200, entry!.Title.Length);
        await StopAsync();

        var rejected = await StartAsync("  " + new string('a', 201) + "  ");
        Assert.Equal(HttpStatusCode.BadRequest, rejected.StatusCode);
        await ApiAssert.HasMessageAsync(rejected);
    }

    [DatabaseFact]
    public async Task Start_rejects_a_malformed_body_with_the_same_message_shape()
    {
        var response = await _client.PostAsync(
            "/api/timer/start", new StringContent("{ not json", Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        await ApiAssert.HasMessageAsync(response);
    }

    [DatabaseFact]
    public async Task Start_is_refused_while_a_timer_is_already_running()
    {
        await StartAsync("First");

        var response = await StartAsync("Second");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        await ApiAssert.HasMessageAsync(response);
    }

    [DatabaseFact]
    public async Task Stop_saves_the_server_time_and_ends_the_running_timer()
    {
        var started = await (await StartAsync("Work")).Content.ReadFromJsonAsync<TimeEntryViewModel>();
        var before = DateTime.UtcNow;

        var response = await StopAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var stopped = await response.Content.ReadFromJsonAsync<TimeEntryViewModel>();
        Assert.NotNull(stopped);
        Assert.Equal(started!.Id, stopped.Id);
        Assert.NotNull(stopped.StoppedAtUtc);
        Assert.InRange(stopped.StoppedAtUtc.Value, before.AddSeconds(-1), DateTime.UtcNow.AddSeconds(1));
        Assert.True(stopped.StoppedAtUtc >= stopped.StartedAtUtc);
        Assert.Equal(HttpStatusCode.NoContent, (await _client.GetAsync("/api/timer/running")).StatusCode);
    }

    [DatabaseFact]
    public async Task Stop_is_refused_with_a_message_when_no_timer_is_running()
    {
        var response = await StopAsync();

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        await ApiAssert.HasMessageAsync(response);
    }

    [DatabaseFact]
    public async Task Running_returns_nothing_when_idle_and_the_running_timer_otherwise()
    {
        Assert.Equal(HttpStatusCode.NoContent, (await _client.GetAsync("/api/timer/running")).StatusCode);

        var started = await (await StartAsync("Work")).Content.ReadFromJsonAsync<TimeEntryViewModel>();
        var response = await _client.GetAsync("/api/timer/running");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var running = await response.Content.ReadFromJsonAsync<TimeEntryViewModel>();
        Assert.Equal(started!.Id, running!.Id);
        Assert.Null(running.StoppedAtUtc);
    }
}
