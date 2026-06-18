using System.Text.Json;
using System.Threading;
using GeoExplorer.Backend.Data;
using Microsoft.Extensions.Logging.Abstractions;

namespace GeoExplorer.Backend.Services;

public sealed class SeedLocationCatalog
{
    private readonly Lazy<IReadOnlyList<SeedLocation>> _locations;
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SeedLocationCatalog> _logger;
    private readonly LocationCatalogStore? _store;

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
        _environment = environment;
        _configuration = configuration;
        _logger = logger;
        _store = store;
        _locations = new Lazy<IReadOnlyList<SeedLocation>>(LoadLocations, LazyThreadSafetyMode.ExecutionAndPublication);
    }

    public IReadOnlyList<SeedLocation> GetAll() => _locations.Value;

    private IReadOnlyList<SeedLocation> LoadLocations()
    {
        if (_configuration.GetValue<bool>("GeoExplorer:UsePostgresCatalog"))
        {
            return LoadFromPostgresOrSeed(_environment, _logger, _store).ToList();
        }

        return LoadFromJson(_environment).ToList();
    }

    private static IReadOnlyList<SeedLocation> LoadFromJson(IWebHostEnvironment environment)
    {
        var seedPath = GetSeedPath(environment);

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

    private static IReadOnlyList<SeedLocation> LoadFromPostgresOrSeed(
        IWebHostEnvironment environment,
        ILogger logger,
        LocationCatalogStore? store)
    {
        if (store is null)
        {
            logger.LogWarning("PostgreSQL catalog enabled, but no LocationCatalogStore was configured.");
            return LoadFromJson(environment);
        }

        if (File.Exists(GetSeedPath(environment)))
        {
            var fileLocations = LoadFromJson(environment);

            try
            {
                var importedLocations = store
                    .ImportAndLoadAsync(fileLocations)
                    .GetAwaiter()
                    .GetResult();

                logger.LogInformation("Upserted and loaded {LocationCount} seed locations from PostgreSQL.", importedLocations.Count);
                return importedLocations;
            }
            catch (Exception exception) when (exception is not InvalidOperationException)
            {
                logger.LogWarning(
                    exception,
                    "Could not upsert locations into PostgreSQL. Falling back to existing PostgreSQL rows or locations.json.");
                var databaseLocations = TryLoadAllFromPostgres(logger, store);
                return databaseLocations.Count > 0 ? databaseLocations : fileLocations;
            }
        }

        var existingLocations = TryLoadAllFromPostgres(logger, store);
        if (existingLocations.Count > 0)
        {
            logger.LogInformation("Loaded {LocationCount} locations from PostgreSQL.", existingLocations.Count);
            return existingLocations;
        }

        return LoadFromJson(environment);
    }

    private static string GetSeedPath(IWebHostEnvironment environment)
    {
        return Path.GetFullPath(Path.Combine(
            environment.ContentRootPath,
            "..",
            "database",
            "seed",
            "locations.json"));
    }

    private static IReadOnlyList<SeedLocation> TryLoadAllFromPostgres(
        ILogger logger,
        LocationCatalogStore store)
    {
        try
        {
            return store
                .LoadAllAsync()
                .GetAwaiter()
                .GetResult();
        }
        catch (Exception exception) when (exception is not InvalidOperationException)
        {
            logger.LogWarning(
                exception,
                "Could not load locations from PostgreSQL before reading locations.json.");
            return [];
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
