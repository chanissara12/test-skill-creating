namespace TestSkillCreating.Domain.Exceptions;

// Reports a business-rule failure to the caller (HTTP 400). Use the single-message constructor for one failure;
// use Add(...) then ThrowIfAny() when a step can report more than one problem.
public class ValidateException : Exception
{
    public List<string> Messages { get; } = [];

    public override string Message => string.Join(", ", Messages);

    public ValidateException() { }

    public ValidateException(string message) => Messages.Add(message);

    public void Add(string message) => Messages.Add(message);

    public void ThrowIfAny()
    {
        if (Messages.Count > 0)
        {
            throw this;
        }
    }
}
