using GeoExplorer.Backend.Data;
using Microsoft.Extensions.Logging.Abstractions;

namespace GeoExplorer.Backend.Services;

public sealed class RoundLocationSelector
{
    private const int CandidateMultiplier = 25;
    private const int MinimumCandidatePool = 50;
    private const int MaximumCandidatePool = 300;

    private readonly SeedLocationCatalog _fallbackCatalog;
    private readonly IConfiguration _configuration;
    private readonly ILogger<RoundLocationSelector> _logger;
    private readonly LocationCatalogStore? _store;
    private IReadOnlyDictionary<string, SeedLocation>? _fallbackLocationsById;

    public RoundLocationSelector(SeedLocationCatalog fallbackCatalog)
        : this(
            fallbackCatalog,
            new ConfigurationBuilder().Build(),
            NullLogger<RoundLocationSelector>.Instance)
    {
    }

    public RoundLocationSelector(
        SeedLocationCatalog fallbackCatalog,
        IConfiguration configuration,
        ILogger<RoundLocationSelector> logger,
        LocationCatalogStore? store = null)
    {
        _fallbackCatalog = fallbackCatalog;
        _configuration = configuration;
        _logger = logger;
        _store = store;
    }

    public List<SeedLocation> SelectRandomLocations(
        string region,
        int count,
        Func<int, int> randomIndex)
    {
        if (ShouldUsePostgresCatalog)
        {
            var databaseSelection = TrySelectFromPostgres(region, count, randomIndex);

            if (databaseSelection is not null)
            {
                return databaseSelection;
            }
        }

        return SelectFromFallback(region, count, randomIndex);
    }

    public SeedLocation? FindById(string locationId)
    {
        if (ShouldUsePostgresCatalog && _store is not null)
        {
            try
            {
                var location = _store.LoadById(locationId);

                if (location is not null)
                {
                    return location;
                }
            }
            catch (Exception exception)
            {
                _logger.LogWarning(exception, "Could not load location {LocationId} from PostgreSQL.", locationId);
            }
        }

        return GetFallbackLocationsById().GetValueOrDefault(locationId);
    }

    private List<SeedLocation>? TrySelectFromPostgres(
        string region,
        int count,
        Func<int, int> randomIndex)
    {
        if (_store is null)
        {
            _logger.LogWarning("PostgreSQL catalog enabled, but no LocationCatalogStore was configured.");
            return null;
        }

        try
        {
            var candidates = _store.LoadRandomCandidates(region, GetCandidateLimit(count));

            if (candidates.Count == 0)
            {
                // Trigger the seed import path once, then retry the runtime query.
                _fallbackCatalog.GetAll();
                candidates = _store.LoadRandomCandidates(region, GetCandidateLimit(count));
            }

            var selected = GameRoundRules.SelectRandomLocations(candidates, count, randomIndex);
            return selected.Count == count ? selected : null;
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Could not select round locations from PostgreSQL.");
            return null;
        }
    }

    private List<SeedLocation> SelectFromFallback(
        string region,
        int count,
        Func<int, int> randomIndex)
    {
        var locations = _fallbackCatalog
            .GetAll()
            .Where(location => string.Equals(location.Region, region, StringComparison.OrdinalIgnoreCase))
            .ToList();

        return GameRoundRules.SelectRandomLocations(locations, count, randomIndex);
    }

    private IReadOnlyDictionary<string, SeedLocation> GetFallbackLocationsById()
    {
        return _fallbackLocationsById ??= _fallbackCatalog
            .GetAll()
            .ToDictionary(location => location.Id, StringComparer.OrdinalIgnoreCase);
    }

    private bool ShouldUsePostgresCatalog => _configuration.GetValue<bool>("GeoExplorer:UsePostgresCatalog");

    private static int GetCandidateLimit(int count)
    {
        return Math.Clamp(count * CandidateMultiplier, Math.Max(count, MinimumCandidatePool), MaximumCandidatePool);
    }
}
