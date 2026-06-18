using GeoExplorer.Backend.Data;
using Microsoft.Extensions.Logging.Abstractions;

namespace GeoExplorer.Backend.Services;

public sealed class RoundLocationSelector
{
    private const int CandidateMultiplier = 25;
    private const int MinimumCandidatePool = 50;
    private const int MaximumCandidatePool = 300;
    private const int MaxCountryFilters = 5;

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
        IReadOnlyList<string>? countries,
        int count,
        Func<int, int> randomIndex)
    {
        if (ShouldUsePostgresCatalog)
        {
            var databaseSelection = TrySelectFromPostgres(region, countries, count, randomIndex);

            if (databaseSelection is not null)
            {
                return databaseSelection;
            }
        }

        return SelectFromFallback(region, countries, count, randomIndex);
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

    public IReadOnlyList<string>? NormalizeCountries(
        string region,
        string? country,
        IReadOnlyList<string>? countries)
    {
        var requestedCountries = (countries ?? [])
            .Append(country)
            .Select(candidate => candidate?.Trim())
            .Where(candidate => !string.IsNullOrWhiteSpace(candidate))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (requestedCountries.Count == 0)
        {
            return null;
        }

        if (requestedCountries.Count > MaxCountryFilters)
        {
            throw new GameFlowException(
                $"Escolhe no máximo {MaxCountryFilters} países.",
                StatusCodes.Status400BadRequest);
        }

        var availableCountries = _fallbackCatalog
            .GetAll()
            .Where(location => string.Equals(location.Region, region, StringComparison.OrdinalIgnoreCase))
            .Select(location => location.Country)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToDictionary(candidate => candidate, StringComparer.OrdinalIgnoreCase);

        var normalizedCountries = new List<string>();

        foreach (var requestedCountry in requestedCountries)
        {
            if (!availableCountries.TryGetValue(requestedCountry!, out var match))
            {
                throw new GameFlowException(
                    "O país selecionado não está disponível neste catálogo.",
                    StatusCodes.Status400BadRequest);
            }

            normalizedCountries.Add(match);
        }

        return normalizedCountries;
    }

    private List<SeedLocation>? TrySelectFromPostgres(
        string region,
        IReadOnlyList<string>? countries,
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
            var candidates = _store.LoadRandomCandidates(region, GetCandidateLimit(count), countries);

            if (candidates.Count == 0)
            {
                // Trigger the seed import path once, then retry the runtime query.
                _fallbackCatalog.GetAll();
                candidates = _store.LoadRandomCandidates(region, GetCandidateLimit(count), countries);
            }

            return GameRoundRules.SelectRandomLocations(candidates, count, randomIndex);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Could not select round locations from PostgreSQL.");
            return null;
        }
    }

    private List<SeedLocation> SelectFromFallback(
        string region,
        IReadOnlyList<string>? countries,
        int count,
        Func<int, int> randomIndex)
    {
        var countryFilter = countries?.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var locations = _fallbackCatalog
            .GetAll()
            .Where(location => string.Equals(location.Region, region, StringComparison.OrdinalIgnoreCase))
            .Where(location => countryFilter is null || countryFilter.Contains(location.Country))
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
