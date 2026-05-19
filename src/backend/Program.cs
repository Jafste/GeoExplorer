using GeoExplorer.Backend.Contracts;
using GeoExplorer.Backend.Data;
using GeoExplorer.Backend.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.Services.AddMemoryCache();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin();
    });
});
builder.Services.AddSingleton<SeedLocationCatalog>();
builder.Services.AddSingleton<GameSessionService>();
builder.Services.AddPooledDbContextFactory<GeoExplorerDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("GeoExplorerDb")));
builder.Services.AddSingleton<DatabaseUsageMetrics>();
builder.Services.AddSingleton<LocationCatalogStore>();
builder.Services.AddSingleton<GamePersistenceStore>();
builder.Services.AddHttpClient<MapillaryImageService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(8);
});

var app = builder.Build();

await DatabaseMigrationRunner.ApplyAsync(app.Services, app.Configuration);

app.UseExceptionHandler();
app.UseCors();

var api = app.MapGroup("/api");

api.MapGet("/health", () => Results.Ok(new { status = "ok" }));

api.MapGet("/diagnostics/database", (DatabaseUsageMetrics metrics) => Results.Ok(metrics.GetSnapshot()));

api.MapGet("/media/mapillary/{imageId}", async (
    string imageId,
    MapillaryImageService mapillaryImages,
    CancellationToken cancellationToken) =>
{
    var result = await mapillaryImages.GetThumbnailAsync(imageId, cancellationToken);

    if (result.ThumbnailUrl is not null)
    {
        return Results.Redirect(result.ThumbnailUrl, permanent: false);
    }

    return Results.Problem(result.Message, statusCode: (int)result.StatusCode);
});

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

public partial class Program
{
}
