namespace TestSkillCreating.Domain.Exceptions;

// The thing the request points at does not exist (HTTP 404), e.g. deleting an entry that is already gone.
public class NotFoundException(string message) : ValidateException(message);
