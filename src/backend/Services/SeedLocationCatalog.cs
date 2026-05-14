using System.Text.Json;
using GeoExplorer.Backend.Data;
using Microsoft.Extensions.Logging.Abstractions;

namespace GeoExplorer.Backend.Services;

public sealed class SeedLocationCatalog
{
    private readonly List<SeedLocation> _locations;

    public SeedLocationCatalog(IWebHostEnvironment environment)
        : this(environment, new ConfigurationBuilder().Build(), NullLogger<SeedLocationCatalog>.Instance)
    {
    }

    public SeedLocationCatalog(
        IWebHostEnvironment environment,
        IConfiguration configuration,
        ILogger<SeedLocationCatalog> logger,
        LocationCatalogStore? store = null)
    {
        var fileLocations = LoadFromJson(environment);
        _locations = LoadFromPostgresIfEnabled(fileLocations, configuration, logger, store).ToList();
    }

    public IReadOnlyList<SeedLocation> GetAll() => _locations;

    private static IReadOnlyList<SeedLocation> LoadFromJson(IWebHostEnvironment environment)
    {
        var seedPath = Path.GetFullPath(Path.Combine(
            environment.ContentRootPath,
            "..",
            "database",
            "seed",
            "locations.json"));

        if (!File.Exists(seedPath))
        {
            throw new InvalidOperationException($"Não foi encontrado o dataset em {seedPath}.");
        }

        using var stream = File.OpenRead(seedPath);
        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
        };

        return JsonSerializer.Deserialize<List<SeedLocation>>(stream, options) ??
               throw new InvalidOperationException("Não foi possível carregar o dataset inicial.");
    }

    private static IReadOnlyList<SeedLocation> LoadFromPostgresIfEnabled(
        IReadOnlyList<SeedLocation> fileLocations,
        IConfiguration configuration,
        ILogger logger,
        LocationCatalogStore? store)
    {
        if (!configuration.GetValue<bool>("GeoExplorer:UsePostgresCatalog"))
        {
            return fileLocations;
        }

        if (store is null)
        {
            logger.LogWarning("PostgreSQL catalog enabled, but no LocationCatalogStore was configured.");
            return fileLocations;
        }

        try
        {
            var databaseLocations = store
                .ImportAndLoadAsync(fileLocations)
                .GetAwaiter()
                .GetResult();

            logger.LogInformation("Loaded {LocationCount} locations from PostgreSQL.", databaseLocations.Count);
            return databaseLocations;
        }
        catch (Exception exception) when (exception is not InvalidOperationException)
        {
            logger.LogWarning(
                exception,
                "Could not load locations from PostgreSQL. Falling back to locations.json.");
            return fileLocations;
        }
    }
}

public sealed class SeedLocation
{
    public required string Id { get; init; }
    public required string Title { get; init; }
    public required string City { get; init; }
    public required string Country { get; init; }
    public required string Region { get; init; }
    public required string Category { get; init; }
    public required double Latitude { get; init; }
    public required double Longitude { get; init; }
    public required string SceneLabel { get; init; }
    public required string SceneNote { get; init; }
    public string? SceneImage { get; init; }
    public required string Prompt { get; init; }
    public required string[] VisualGradient { get; init; }
    public SeedMedia? Media { get; init; }
    public List<SeedMedia>? VisualSources { get; init; }
    public required List<SeedClue> Clues { get; init; }

    public IReadOnlyList<SeedMedia> GetVisualSources()
    {
        var sources = new List<SeedMedia>();

        if (Media is not null)
        {
            sources.Add(Media);
        }

        if (VisualSources is not null)
        {
            foreach (var source in VisualSources)
            {
                if (!sources.Any(existing => HasSameSource(existing, source)))
                {
                    sources.Add(source);
                }
            }
        }

        return sources;
    }

    private static bool HasSameSource(SeedMedia existing, SeedMedia next)
    {
        return existing.SourceProvider == next.SourceProvider &&
               existing.ImageUrl == next.ImageUrl &&
               existing.ImageSourceUrl == next.ImageSourceUrl &&
               existing.StreetViewProvider == next.StreetViewProvider &&
               existing.StreetViewUrl == next.StreetViewUrl;
    }
}

public sealed class SeedMedia
{
    public required string SourceProvider { get; init; }
    public string? ImageUrl { get; init; }
    public string? ImageSourceUrl { get; init; }
    public string? ImageAttribution { get; init; }
    public string? ImageLicense { get; init; }
    public string? ImageLicenseUrl { get; init; }
    public string? StreetViewProvider { get; init; }
    public string? StreetViewUrl { get; init; }
    public string? VerifiedAt { get; init; }
}

public sealed class SeedClue
{
    public required string Label { get; init; }
    public required string Value { get; init; }
    public required string Confidence { get; init; }
}
