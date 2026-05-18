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

        Assert.IsGreaterThanOrEqualTo(250, realMediaLocations.Count, "O dataset deve manter pelo menos 250 locais com media real validada.");

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
            Assert.IsTrue(
                media.ImageLicenseUrl!.StartsWith("http://", StringComparison.Ordinal) ||
                media.ImageLicenseUrl.StartsWith("https://", StringComparison.Ordinal),
                $"{location.Id} deve manter imageLicenseUrl como URL absoluta.");
            Assert.IsTrue(DateOnly.TryParse(media.VerifiedAt, out _), $"{location.Id} tem verifiedAt inválido.");

            var visualSources = location.GetVisualSources();
            Assert.IsGreaterThanOrEqualTo(1, visualSources.Count, $"{location.Id} deve expor pelo menos uma fonte visual.");
            Assert.IsTrue(
                visualSources.Any(source => source.SourceProvider == media.SourceProvider && source.ImageUrl == media.ImageUrl),
                $"{location.Id} deve manter media como uma das fontes visuais.");
        }
    }

    [TestMethod]
    public void SeedLocations_IncludeSelectedPanoramaxVisualSources()
    {
        var panoramaxLocations = LoadLocations()
            .Where(location => location.GetVisualSources().Any(source => source.SourceProvider == "Panoramax"))
            .ToList();

        Assert.IsGreaterThanOrEqualTo(90, panoramaxLocations.Count, "O dataset deve manter pelo menos 90 locais com Panoramax validado.");

        foreach (var location in panoramaxLocations)
        {
            var source = location.GetVisualSources().Single(candidate => candidate.SourceProvider == "Panoramax");

            AssertRequired(location.Id, source.ImageUrl, "visualSources.imageUrl");
            AssertRequired(location.Id, source.ImageSourceUrl, "visualSources.imageSourceUrl");
            AssertRequired(location.Id, source.ImageAttribution, "visualSources.imageAttribution");
            Assert.AreEqual("CC BY-SA 4.0", source.ImageLicense, $"{location.Id} deve manter licença Panoramax normalizada.");
            Assert.AreEqual("https://creativecommons.org/licenses/by-sa/4.0/", source.ImageLicenseUrl);
            Assert.AreEqual("Panoramax", source.StreetViewProvider);
            AssertRequired(location.Id, source.StreetViewUrl, "visualSources.streetViewUrl");
            Assert.IsTrue(DateOnly.TryParse(source.VerifiedAt, out _), $"{location.Id} tem visualSources.verifiedAt inválido.");
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
