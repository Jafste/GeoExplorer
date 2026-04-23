using GeoExplorer.Backend.Contracts;
using GeoExplorer.Backend.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin();
    });
});
builder.Services.AddSingleton<SeedLocationCatalog>();
builder.Services.AddSingleton<GameSessionService>();

var app = builder.Build();

app.UseExceptionHandler();
app.UseCors();

var api = app.MapGroup("/api");

api.MapGet("/health", () => Results.Ok(new { status = "ok" }));

api.MapPost("/sessions", (CreateSessionRequest request, GameSessionService gameSessions) =>
{
    try
    {
        return Results.Ok(gameSessions.CreateSession(request));
    }
    catch (GameFlowException exception)
    {
        return Results.Problem(exception.Message, statusCode: exception.StatusCode);
    }
});

api.MapGet("/sessions/{sessionId}/current-round", (string sessionId, GameSessionService gameSessions) =>
{
    try
    {
        return Results.Ok(gameSessions.GetCurrentRound(sessionId));
    }
    catch (GameFlowException exception)
    {
        return Results.Problem(exception.Message, statusCode: exception.StatusCode);
    }
});

api.MapPost("/sessions/{sessionId}/rounds/{roundId}/guess", (
    string sessionId,
    string roundId,
    GuessRequest request,
    GameSessionService gameSessions) =>
{
    if (request.Guess is null)
    {
        return Results.Problem("É necessário fornecer um palpite válido.", statusCode: StatusCodes.Status400BadRequest);
    }

    try
    {
        return Results.Ok(gameSessions.SubmitGuess(sessionId, roundId, request.Guess));
    }
    catch (GameFlowException exception)
    {
        return Results.Problem(exception.Message, statusCode: exception.StatusCode);
    }
});

api.MapPost("/sessions/{sessionId}/rounds/{roundId}/timeout", (
    string sessionId,
    string roundId,
    GuessRequest request,
    GameSessionService gameSessions) =>
{
    try
    {
        return Results.Ok(gameSessions.TimeoutRound(sessionId, roundId, request.Guess));
    }
    catch (GameFlowException exception)
    {
        return Results.Problem(exception.Message, statusCode: exception.StatusCode);
    }
});

api.MapGet("/sessions/{sessionId}/results", (string sessionId, GameSessionService gameSessions) =>
{
    try
    {
        return Results.Ok(gameSessions.GetResults(sessionId));
    }
    catch (GameFlowException exception)
    {
        return Results.Problem(exception.Message, statusCode: exception.StatusCode);
    }
});

app.MapGet("/", () => Results.Redirect("/api/health"));

app.Run();
