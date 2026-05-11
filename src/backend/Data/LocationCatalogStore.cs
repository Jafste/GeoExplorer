using System.Text.Json;
using GeoExplorer.Backend.Services;
using Microsoft.EntityFrameworkCore;

namespace GeoExplorer.Backend.Data;

public sealed class LocationCatalogStore
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly IDbContextFactory<GeoExplorerDbContext> _contextFactory;
    private readonly DatabaseUsageMetrics _metrics;

    public LocationCatalogStore(
        IDbContextFactory<GeoExplorerDbContext> contextFactory,
        DatabaseUsageMetrics metrics)
    {
        _contextFactory = contextFactory;
        _metrics = metrics;
    }

    public async Task<IReadOnlyList<SeedLocation>> ImportAndLoadAsync(
        IReadOnlyList<SeedLocation> seedLocations,
        CancellationToken cancellationToken = default)
    {
        await using var db = await _contextFactory.CreateDbContextAsync(cancellationToken);
        await db.Database.EnsureCreatedAsync(cancellationToken);

        var existingLocations = await db.Locations
            .ToDictionaryAsync(location => location.Id, cancellationToken);
        _metrics.RecordRead("catalog_import_load");

        var hasChanges = false;

        foreach (var seedLocation in seedLocations)
        {
            var entity = ToEntity(seedLocation);

            if (existingLocations.TryGetValue(seedLocation.Id, out var existing))
            {
                if (HasChanged(existing, entity))
                {
                    db.Entry(existing).CurrentValues.SetValues(entity);
                    hasChanges = true;
                }
            }
            else
            {
                db.Locations.Add(entity);
                hasChanges = true;
            }
        }

        if (hasChanges)
        {
            await db.SaveChangesAsync(cancellationToken);
            _metrics.RecordWrite("catalog_import_load");
        }

        var entities = await db.Locations
            .AsNoTracking()
            .OrderBy(location => location.Id)
            .ToListAsync(cancellationToken);
        _metrics.RecordRead("catalog_import_load");

        return entities.Select(ToSeedLocation).ToList();
    }

    private static bool HasChanged(LocationEntity existing, LocationEntity next)
    {
        return existing.Title != next.Title ||
               existing.City != next.City ||
               existing.Country != next.Country ||
               existing.Region != next.Region ||
               existing.Category != next.Category ||
               existing.Latitude != next.Latitude ||
               existing.Longitude != next.Longitude ||
               existing.SceneLabel != next.SceneLabel ||
               existing.SceneNote != next.SceneNote ||
               existing.SceneImage != next.SceneImage ||
               existing.MediaSourceProvider != next.MediaSourceProvider ||
               existing.ImageUrl != next.ImageUrl ||
               existing.ImageSourceUrl != next.ImageSourceUrl ||
               existing.ImageAttribution != next.ImageAttribution ||
               existing.ImageLicense != next.ImageLicense ||
               existing.ImageLicenseUrl != next.ImageLicenseUrl ||
               existing.StreetViewProvider != next.StreetViewProvider ||
               existing.StreetViewUrl != next.StreetViewUrl ||
               existing.MediaVerifiedAt != next.MediaVerifiedAt ||
               existing.Prompt != next.Prompt ||
               !HasSameVisualGradient(existing.VisualGradient, next.VisualGradient) ||
               !HasSameClues(existing.Clues, next.Clues);
    }

    private static bool HasSameVisualGradient(string existing, string next)
    {
        var existingGradient = DeserializeJson<string[]>(existing);
        var nextGradient = DeserializeJson<string[]>(next);

        return existingGradient is not null &&
               nextGradient is not null &&
               existingGradient.SequenceEqual(nextGradient);
    }

    private static bool HasSameClues(string existing, string next)
    {
        var existingClues = DeserializeJson<List<SeedClue>>(existing);
        var nextClues = DeserializeJson<List<SeedClue>>(next);

        if (existingClues is null || nextClues is null || existingClues.Count != nextClues.Count)
        {
            return false;
        }

        return existingClues
            .Zip(nextClues)
            .All(pair =>
                pair.First.Label == pair.Second.Label &&
                pair.First.Value == pair.Second.Value &&
                pair.First.Confidence == pair.Second.Confidence);
    }

    private static T? DeserializeJson<T>(string value)
    {
        try
        {
            return JsonSerializer.Deserialize<T>(value, SerializerOptions);
        }
        catch (JsonException)
        {
            return default;
        }
    }

    private static LocationEntity ToEntity(SeedLocation location)
    {
        var media = location.Media;

        return new LocationEntity
        {
            Id = location.Id,
            Title = location.Title,
            City = location.City,
            Country = location.Country,
            Region = location.Region,
            Category = location.Category,
            Latitude = location.Latitude,
            Longitude = location.Longitude,
            SceneLabel = location.SceneLabel,
            SceneNote = location.SceneNote,
            SceneImage = location.SceneImage,
            MediaSourceProvider = media?.SourceProvider,
            ImageUrl = media?.ImageUrl,
            ImageSourceUrl = media?.ImageSourceUrl,
            ImageAttribution = media?.ImageAttribution,
            ImageLicense = media?.ImageLicense,
            ImageLicenseUrl = media?.ImageLicenseUrl,
            StreetViewProvider = media?.StreetViewProvider,
            StreetViewUrl = media?.StreetViewUrl,
            MediaVerifiedAt = DateOnly.TryParse(media?.VerifiedAt, out var verifiedAt) ? verifiedAt : null,
            Prompt = location.Prompt,
            VisualGradient = JsonSerializer.Serialize(location.VisualGradient, SerializerOptions),
            Clues = JsonSerializer.Serialize(location.Clues, SerializerOptions),
        };
    }

    private static SeedLocation ToSeedLocation(LocationEntity location)
    {
        return new SeedLocation
        {
            Id = location.Id,
            Title = location.Title,
            City = location.City,
            Country = location.Country,
            Region = location.Region,
            Category = location.Category,
            Latitude = location.Latitude,
            Longitude = location.Longitude,
            SceneLabel = location.SceneLabel,
            SceneNote = location.SceneNote,
            SceneImage = location.SceneImage,
            Prompt = location.Prompt,
            VisualGradient = JsonSerializer.Deserialize<string[]>(location.VisualGradient, SerializerOptions) ??
                             throw new InvalidOperationException("A coluna visual_gradient não tinha JSON válido."),
            Media = string.IsNullOrWhiteSpace(location.MediaSourceProvider)
                ? null
                : new SeedMedia
                {
                    SourceProvider = location.MediaSourceProvider,
                    ImageUrl = location.ImageUrl,
                    ImageSourceUrl = location.ImageSourceUrl,
                    ImageAttribution = location.ImageAttribution,
                    ImageLicense = location.ImageLicense,
                    ImageLicenseUrl = location.ImageLicenseUrl,
                    StreetViewProvider = location.StreetViewProvider,
                    StreetViewUrl = location.StreetViewUrl,
                    VerifiedAt = location.MediaVerifiedAt?.ToString("yyyy-MM-dd"),
                },
            Clues = JsonSerializer.Deserialize<List<SeedClue>>(location.Clues, SerializerOptions) ??
                    throw new InvalidOperationException("A coluna clues não tinha JSON válido."),
        };
    }
}
