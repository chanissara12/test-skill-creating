using Microsoft.AspNetCore.Mvc;

using TestSkillCreating.Domain.Interfaces.Tracking;
using TestSkillCreating.Domain.ViewModels.Tracking;

namespace TestSkillCreating.Server.Controllers.Tracking;

[ApiController]
[Route("api/timer")]
public class TimerController(ITimerService timerService) : ControllerBase
{
    public record StartRequest(string? Title);

    [HttpPost("start")]
    public async Task<ActionResult<TimeEntryViewModel>> Start(StartRequest request)
    {
        var entry = await timerService.StartAsync(request.Title ?? string.Empty);
        return Created("api/timer/running", entry);
    }

    [HttpPost("stop")]
    public async Task<ActionResult<TimeEntryViewModel>> Stop() => await timerService.StopAsync();

    [HttpGet("running")]
    public async Task<ActionResult<TimeEntryViewModel>> Running()
    {
        var entry = await timerService.GetRunningAsync();
        return entry is null ? NoContent() : entry;
    }
}
