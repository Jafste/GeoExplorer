using System.Text.Json;

namespace GeoExplorer.Backend.Services;

public sealed class SeedLocationCatalog
{
    private readonly List<SeedLocation> _locations;

    public SeedLocationCatalog(IWebHostEnvironment environment)
    {
        var seedPath = Path.GetFullPath(
            Path.Combine(environment.ContentRootPath, "..", "database", "seed", "locations.json"));

        if (!File.Exists(seedPath))
        {
            throw new InvalidOperationException($"Não foi encontrado o dataset em {seedPath}.");
        }

        using var stream = File.OpenRead(seedPath);
        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
        };

        _locations =
            JsonSerializer.Deserialize<List<SeedLocation>>(stream, options) ??
            throw new InvalidOperationException("Não foi possível carregar o dataset inicial.");
    }

    public IReadOnlyList<SeedLocation> GetAll() => _locations;
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
    public required List<SeedClue> Clues { get; init; }
}

public sealed class SeedClue
{
    public required string Label { get; init; }
    public required string Value { get; init; }
    public required string Confidence { get; init; }
}
