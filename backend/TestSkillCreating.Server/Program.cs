using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using TestSkillCreating.Domain.Database;
using TestSkillCreating.Domain.Interfaces.Tracking;
using TestSkillCreating.Server.Middlewares;
using TestSkillCreating.Service.Implements.Tracking;

var builder = WebApplication.CreateBuilder(args);

// A missing or malformed request body gets the same { message } shape as every other error.
builder.Services.AddControllers().ConfigureApiBehaviorOptions(options =>
    options.InvalidModelStateResponseFactory = _ =>
        new BadRequestObjectResult(new { message = "The request body is missing or invalid." }));

// The context is created lazily, so the API still starts before a database exists.
builder.Services.AddDbContext<TimeLogDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));
builder.Services.AddScoped<ITimerService, TimerService>();
builder.Services.AddScoped<ITimeEntryService, TimeEntryService>();

// Only the configured frontend origin may call the API from a browser.
var allowedOrigin = builder.Configuration["Cors:AllowedOrigin"]
    ?? throw new InvalidOperationException("Cors:AllowedOrigin is not configured.");
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy => policy.WithOrigins(allowedOrigin).AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors();
app.UseAuthorization();
app.MapControllers();

app.Run();

// Lets the API tests start the real app in memory.
public partial class Program;
