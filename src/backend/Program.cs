using GeoExplorer.Backend.Contracts;
using GeoExplorer.Backend.Data;
using GeoExplorer.Backend.Hubs;
using GeoExplorer.Backend.Services;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, services, loggerConfiguration) => loggerConfiguration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext());

builder.Services.AddProblemDetails();
builder.Services.AddMemoryCache();
builder.Services.AddSignalR();
builder.Services.AddCors(options =>
{
    var allowedOrigins = GetAllowedOrigins(builder.Configuration);
    options.AddDefaultPolicy(policy =>
    {
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});
builder.Services.AddPooledDbContextFactory<GeoExplorerDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("GeoExplorerDb")));
builder.Services.AddSingleton<DatabaseUsageMetrics>();
builder.Services.AddSingleton<LocationCatalogStore>();
builder.Services.AddSingleton<SeedLocationCatalog>();
builder.Services.AddSingleton<RoundLocationSelector>();
builder.Services.AddSingleton<GamePersistenceStore>();
builder.Services.AddSingleton<MultiplayerPersistenceStore>();
builder.Services.AddSingleton(serviceProvider => new GameSessionService(
    serviceProvider.GetRequiredService<RoundLocationSelector>(),
    serviceProvider.GetRequiredService<IConfiguration>(),
    serviceProvider.GetRequiredService<ILogger<GameSessionService>>(),
    serviceProvider.GetRequiredService<GamePersistenceStore>()));
builder.Services.AddSingleton(serviceProvider => new MultiplayerRoomService(
    serviceProvider.GetRequiredService<RoundLocationSelector>(),
    serviceProvider.GetRequiredService<IConfiguration>(),
    serviceProvider.GetRequiredService<IHubContext<MultiplayerHub>>(),
    serviceProvider.GetRequiredService<ILogger<MultiplayerRoomService>>(),
    serviceProvider.GetRequiredService<MultiplayerPersistenceStore>()));
builder.Services.AddSingleton<ExternalMediaProxyService>();
builder.Services.AddHttpClient(nameof(ExternalMediaProxyService), client =>
{
    client.Timeout = TimeSpan.FromSeconds(10);
    client.DefaultRequestHeaders.UserAgent.ParseAdd("GeoExplorerMediaProxy/1.0 (https://geoexplorer.firmwork.pt)");
    client.DefaultRequestHeaders.Accept.ParseAdd("image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8");
});
builder.Services.AddHttpClient<MapillaryImageService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(8);
});

var app = builder.Build();

await DatabaseMigrationRunner.ApplyAsync(app.Services, app.Configuration);

app.UseExceptionHandler();
app.UseSerilogRequestLogging(options =>
{
    options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
});
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

api.MapGet("/media/source/{imageId}", async (
    string imageId,
    ExternalMediaProxyService mediaProxy,
    HttpContext httpContext,
    CancellationToken cancellationToken) =>
{
    var result = await mediaProxy.GetImageAsync(imageId, cancellationToken);

    if (result.Bytes is not null && result.ContentType is not null)
    {
        httpContext.Response.Headers.CacheControl = "public, max-age=86400";
        return Results.File(result.Bytes, result.ContentType);
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

app.MapHub<MultiplayerHub>("/hubs/multiplayer");

app.MapGet("/", () => Results.Redirect("/api/health"));

app.Run();

static string[] GetAllowedOrigins(IConfiguration configuration)
{
    var configuredOrigins = configuration["GeoExplorer:AllowedOrigins"];

    if (string.IsNullOrWhiteSpace(configuredOrigins))
    {
        return
        [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ];
    }

    return configuredOrigins
        .Split([';', ','], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .ToArray();
}

public partial class Program
{
}
