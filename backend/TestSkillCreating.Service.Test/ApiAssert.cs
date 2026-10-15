using System.Net.Http.Json;

namespace TestSkillCreating.Service.Test;

public static class ApiAssert
{
    private sealed record ErrorBody(string Message);

    // Every API failure answers with { "message": "..." }; the message must be there and not blank.
    public static async Task HasMessageAsync(HttpResponseMessage response)
    {
        var error = await response.Content.ReadFromJsonAsync<ErrorBody>();
        Assert.False(string.IsNullOrWhiteSpace(error?.Message));
    }
}
