using Microsoft.EntityFrameworkCore;

using TestSkillCreating.Domain.Database;

var builder = WebApplication.CreateBuilder(args);

// Real connection strings live in an uncommitted local file (matched by .gitignore);
// appsettings.Example.json shows the shape.
builder.Configuration.AddJsonFile("appsettings.local.json", optional: true, reloadOnChange: true);

builder.Services.AddControllers();

// The context is created lazily, so the API still starts (and /api/health works) before a database exists.
builder.Services.AddDbContext<TimeLogDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

// Only the configured frontend origin may call the API from a browser.
var allowedOrigin = builder.Configuration["Cors:AllowedOrigin"]
    ?? throw new InvalidOperationException("Cors:AllowedOrigin is not configured.");
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy => policy.WithOrigins(allowedOrigin).AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

app.UseCors();
app.UseAuthorization();
app.MapControllers();

app.Run();
