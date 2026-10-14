using TestSkillCreating.Domain.Exceptions;

namespace TestSkillCreating.Server.Middlewares;

// Turns business-rule failures into meaningful responses and hides everything else behind a generic 500,
// so no stack trace or internal detail ever reaches the caller.
public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (ConflictException ex)
        {
            await WriteAsync(context, StatusCodes.Status409Conflict, ex.Message);
        }
        catch (ValidateException ex)
        {
            await WriteAsync(context, StatusCodes.Status400BadRequest, ex.Message);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception");
            await WriteAsync(context, StatusCodes.Status500InternalServerError, "Something went wrong. Please try again.");
        }
    }

    private static Task WriteAsync(HttpContext context, int status, string message)
    {
        context.Response.StatusCode = status;
        return context.Response.WriteAsJsonAsync(new { message });
    }
}
