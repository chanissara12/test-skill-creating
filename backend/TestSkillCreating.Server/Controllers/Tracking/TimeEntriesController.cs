using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

using TestSkillCreating.Domain.Interfaces.Tracking;
using TestSkillCreating.Domain.ViewModels.Tracking;

namespace TestSkillCreating.Server.Controllers.Tracking;

[ApiController]
[Route("api/time-entries")]
public class TimeEntriesController(ITimeEntryService timeEntryService) : ControllerBase
{
    // DateTimeOffset, not DateTime: a "Z" timestamp always becomes an exact UTC instant.
    // BindRequired: without it a missing value silently becomes 0001-01-01 instead of a 400.
    [HttpGet]
    public async Task<IReadOnlyList<TimeEntryViewModel>> List(
        [BindRequired] DateTimeOffset fromUtc, [BindRequired] DateTimeOffset toUtc) =>
        await timeEntryService.ListAsync(fromUtc.UtcDateTime, toUtc.UtcDateTime);

    [HttpDelete("{id:long}")]
    public async Task<NoContentResult> Delete(long id)
    {
        await timeEntryService.DeleteAsync(id);
        return NoContent();
    }
}
