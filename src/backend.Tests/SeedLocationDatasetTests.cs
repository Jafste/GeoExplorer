using System.Text.Json;
using GeoExplorer.Backend.Services;

namespace GeoExplorer.Backend.Tests;

[TestClass]
public sealed class SeedLocationDatasetTests
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    [TestMethod]
    public void SeedLocations_HaveUniqueIdsAndValidEuropeanCoordinates()
    {
        var locations = LoadLocations();
        var duplicateIds = locations
            .GroupBy(location => location.Id)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .ToList();

        Assert.IsEmpty(duplicateIds, $"IDs duplicados no dataset: {string.Join(", ", duplicateIds)}");

        foreach (var location in locations)
        {
            Assert.IsTrue(location.Latitude is >= 34 and <= 72, $"{location.Id} tem latitude fora da Europa suportada.");
            Assert.IsTrue(location.Longitude is >= -25 and <= 45, $"{location.Id} tem longitude fora da Europa suportada.");
        }
    }

    [TestMethod]
    public void RealMediaLocations_HaveRequiredSourceAndLicenseMetadata()
    {
        var realMediaLocations = LoadLocations()
            .Where(location => location.Media is not null && location.Media.SourceProvider != "mock")
            .ToList();

        Assert.IsGreaterThanOrEqualTo(realMediaLocations.Count, 10, "O dataset deve manter pelo menos 10 locais com media real validada.");

        foreach (var location in realMediaLocations)
        {
            var media = location.Media!;

            AssertRequired(location.Id, media.SourceProvider, "sourceProvider");
            AssertRequired(location.Id, media.ImageUrl, "imageUrl");
            AssertRequired(location.Id, media.ImageSourceUrl, "imageSourceUrl");
            AssertRequired(location.Id, media.ImageAttribution, "imageAttribution");
            AssertRequired(location.Id, media.ImageLicense, "imageLicense");
            AssertRequired(location.Id, media.ImageLicenseUrl, "imageLicenseUrl");
            AssertRequired(location.Id, media.VerifiedAt, "verifiedAt");
            StringAssert.StartsWith(media.ImageUrl!, "https://");
            StringAssert.StartsWith(media.ImageSourceUrl!, "https://commons.wikimedia.org/wiki/File:");
            Assert.IsTrue(DateOnly.TryParse(media.VerifiedAt, out _), $"{location.Id} tem verifiedAt inválido.");
        }
    }

    private static void AssertRequired(string locationId, string? value, string fieldName)
    {
        Assert.IsFalse(string.IsNullOrWhiteSpace(value), $"{locationId} não tem media.{fieldName} preenchido.");
    }

    private static List<SeedLocation> LoadLocations()
    {
        var seedPath = Path.Combine(FindRepoRoot(), "src", "database", "seed", "locations.json");
        using var stream = File.OpenRead(seedPath);

        return JsonSerializer.Deserialize<List<SeedLocation>>(stream, SerializerOptions) ??
               throw new InvalidOperationException("Não foi possível carregar o dataset inicial.");
    }

    private static string FindRepoRoot()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);

        while (directory is not null)
        {
            if (File.Exists(Path.Combine(directory.FullName, "GeoExplorer.slnx")))
            {
                return directory.FullName;
            }

            directory = directory.Parent;
        }

        throw new DirectoryNotFoundException("Não foi possível encontrar a raiz do repositório.");
    }
}
