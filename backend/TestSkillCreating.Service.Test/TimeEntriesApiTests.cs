using System.Net;
using System.Net.Http.Json;

using TestSkillCreating.Domain.ViewModels.Tracking;

namespace TestSkillCreating.Service.Test;

[Collection(ApiCollection.Name)]
public class TimeEntriesApiTests(ApiFixture api) : IAsyncLifetime
{
    private readonly HttpClient _client = api.CreateClient();

    public Task InitializeAsync() => api.ResetDatabaseAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    // Hours counted from midnight UTC on Sunday 2026-10-11.
    private static DateTime At(double hours) => new DateTime(2026, 10, 11, 0, 0, 0, DateTimeKind.Utc).AddHours(hours);

    private Task<HttpResponseMessage> ListRawAsync(DateTime from, DateTime to) =>
        _client.GetAsync($"/api/time-entries?fromUtc={Uri.EscapeDataString(from.ToString("O"))}&toUtc={Uri.EscapeDataString(to.ToString("O"))}");

    private async Task<string[]> ListTitlesAsync(DateTime from, DateTime to)
    {
        var response = await ListRawAsync(from, to);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var entries = await response.Content.ReadFromJsonAsync<TimeEntryViewModel[]>();
        return entries!.Select(e => e.Title).ToArray();
    }

    [DatabaseFact]
    public async Task List_returns_the_entries_in_the_range_ordered_by_start_time()
    {
        await api.SeedAsync("Later", At(10), At(11));
        await api.SeedAsync("Earlier", At(8), At(9));

        var titles = await ListTitlesAsync(At(0), At(24));

        Assert.Equal(["Earlier", "Later"], titles);
    }

    [DatabaseFact]
    public async Task List_returns_only_entries_that_overlap_the_range_including_ones_crossing_its_edges()
    {
        await api.SeedAsync("Before", At(2), At(4));
        await api.SeedAsync("Ends exactly at the start", At(8), At(10));
        await api.SeedAsync("Crosses the start", At(9), At(11));
        await api.SeedAsync("Inside", At(12), At(13));
        await api.SeedAsync("Crosses the end", At(19), At(21));
        await api.SeedAsync("Starts exactly at the end", At(20), At(22));
        await api.SeedAsync("After", At(23), At(24));

        var titles = await ListTitlesAsync(At(10), At(20));

        Assert.Equal(["Crosses the start", "Inside", "Crosses the end"], titles);
    }

    [DatabaseFact]
    public async Task List_includes_a_running_timer_that_started_before_the_range_but_not_one_that_starts_after_it()
    {
        await api.SeedAsync("Started before and still running", At(2), null);
        await api.SeedAsync("Not started yet", At(25), null);

        var titles = await ListTitlesAsync(At(10), At(20));

        Assert.Equal(["Started before and still running"], titles);
    }

    [DatabaseFact]
    public async Task List_rejects_a_range_that_ends_before_it_starts_with_a_message()
    {
        var response = await ListRawAsync(At(20), At(10));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        await ApiAssert.HasMessageAsync(response);
    }

    [DatabaseFact]
    public async Task Delete_removes_a_finished_entry()
    {
        var id = await api.SeedAsync("Finished", At(8), At(9));
        await api.SeedAsync("Other", At(10), At(11));

        var response = await _client.DeleteAsync($"/api/time-entries/{id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal(["Other"], await ListTitlesAsync(At(0), At(24)));
    }

    [DatabaseFact]
    public async Task Delete_refuses_the_running_timer_with_a_message_and_keeps_it()
    {
        var id = await api.SeedAsync("Running", At(8), null);

        var response = await _client.DeleteAsync($"/api/time-entries/{id}");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        await ApiAssert.HasMessageAsync(response);
        Assert.Equal(["Running"], await ListTitlesAsync(At(0), At(24)));
    }

    [DatabaseFact]
    public async Task Delete_answers_not_found_with_a_message_for_an_entry_that_does_not_exist()
    {
        var response = await _client.DeleteAsync("/api/time-entries/987654321");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        await ApiAssert.HasMessageAsync(response);
    }

    [DatabaseFact]
    public async Task Delete_of_the_same_entry_twice_at_once_removes_it_once_and_answers_not_found_to_the_other()
    {
        var id = await api.SeedAsync("Finished", At(8), At(9));

        var responses = await Task.WhenAll(
            _client.DeleteAsync($"/api/time-entries/{id}"),
            _client.DeleteAsync($"/api/time-entries/{id}"));

        Assert.Equal(
            [HttpStatusCode.NoContent, HttpStatusCode.NotFound],
            responses.Select(r => r.StatusCode).OrderBy(code => (int)code));
    }

    [DatabaseFact]
    public async Task List_rejects_a_request_without_a_range_with_a_message()
    {
        var response = await _client.GetAsync("/api/time-entries");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        await ApiAssert.HasMessageAsync(response);
    }
}
