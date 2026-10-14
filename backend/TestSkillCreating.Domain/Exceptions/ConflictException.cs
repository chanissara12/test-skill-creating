namespace TestSkillCreating.Domain.Exceptions;

// The request is valid but clashes with the current state (HTTP 409), e.g. starting a second timer.
public class ConflictException(string message) : ValidateException(message);
