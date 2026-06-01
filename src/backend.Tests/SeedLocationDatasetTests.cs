using System.Text.Json;
using System.Text.RegularExpressions;
using GeoExplorer.Backend.Services;

namespace GeoExplorer.Backend.Tests;

[TestClass]
public sealed partial class SeedLocationDatasetTests
{
    private static readonly IReadOnlyDictionary<string, string> ReviewedAerialImageSources =
        new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["venice-grand-canal"] = "https://commons.wikimedia.org/wiki/File:Panorama_of_Canal_Grande_and_Ponte_di_Rialto,_Venice_-_September_2017.jpg",
            ["mostar-bridge"] = "https://commons.wikimedia.org/wiki/File:Mostar_Old_Town_Panorama_2007.jpg",
            ["cesky-krumlov-old-town"] = "https://commons.wikimedia.org/wiki/File:%C4%8Cesk%C3%BD_Krumlov_(Krummau)_-_panorama_-_old_city.JPG",
            ["piran-tartini-square"] = "https://commons.wikimedia.org/wiki/File:Tartini_Square_from_above%2C_Piran%2C_May_2009.jpg",
            ["gullfoss-waterfall"] = "https://commons.wikimedia.org/wiki/File:Gullfoss_from_the_Air_(cropped).jpg",
            ["bath-royal-crescent"] = "https://commons.wikimedia.org/wiki/File:Royal.crescent.aerial.bath.arp.jpg",
            ["cordoba-mosque-cathedral"] = "https://commons.wikimedia.org/wiki/File:Mezquita_de_Córdoba_desde_el_aire_(Córdoba,_España).jpg",
            ["stirling-castle"] = "https://commons.wikimedia.org/wiki/File:Stirling_Castle_Aerial_Photo.jpg",
            ["mont-saint-michel"] = "https://commons.wikimedia.org/wiki/File:Mont-Saint-Michel_vu_du_ciel.jpg",
            ["carcassonne-carcassonne"] = "https://commons.wikimedia.org/wiki/File:1_carcassonne_aerial_2016.jpg",
            ["chambord-chateau-de-chambord"] = "https://commons.wikimedia.org/wiki/File:Aerial_image_of_Ch%C3%A2teau_de_Chambord_(view_from_the_southeast).jpg",
            ["schwerin-schwerin-castle"] = "https://commons.wikimedia.org/wiki/File:Aerial_image_of_Schwerin_Castle_(view_from_the_east).jpg",
        };

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
    public void SeedLocations_UseConsistentPortugueseCountryNames()
    {
        var blockedCountryNames = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["República Checa"] = "Chéquia",
            ["Czech Republic"] = "Chéquia",
            ["Czechia"] = "Chéquia",
        };

        var inconsistentLocations = LoadLocations()
            .Where(location => blockedCountryNames.ContainsKey(location.Country))
            .Select(location => $"{location.Id}: {location.Country} -> {blockedCountryNames[location.Country]}")
            .ToList();

        Assert.IsEmpty(
            inconsistentLocations,
            $"Há nomes de país inconsistentes no dataset: {string.Join(", ", inconsistentLocations)}");
    }

    [TestMethod]
    public void SeedLocations_DoNotKeepVeryCloseChallengePoints()
    {
        const double minimumDistanceMeters = 75;
        var locations = LoadLocations();
        var veryClosePairs = new List<string>();

        for (var outerIndex = 0; outerIndex < locations.Count; outerIndex++)
        {
            for (var innerIndex = outerIndex + 1; innerIndex < locations.Count; innerIndex++)
            {
                var first = locations[outerIndex];
                var second = locations[innerIndex];
                var distanceMeters = CalculateDistanceMeters(
                    first.Latitude,
                    first.Longitude,
                    second.Latitude,
                    second.Longitude);

                if (distanceMeters < minimumDistanceMeters)
                {
                    veryClosePairs.Add($"{first.Id} / {second.Id}: {distanceMeters:0} m");
                }
            }
        }

        Assert.IsEmpty(
            veryClosePairs,
            $"Há locais demasiado próximos para serem desafios separados: {string.Join(", ", veryClosePairs)}");
    }

    [TestMethod]
    public void SeedLocations_DoNotRevealCityOrCountryInPlayableText()
    {
        var locations = LoadLocations();
        var exposedLocations = locations
            .Select(location => new
            {
                location.Id,
                ExposedTerms = new[] { location.City, location.Country }
                    .Where(term => term.Length >= 4)
                    .Where(term => GetPlayableText(location).Contains(term, StringComparison.OrdinalIgnoreCase))
                    .ToList(),
            })
            .Where(location => location.ExposedTerms.Count > 0)
            .Select(location => $"{location.Id}: {string.Join(", ", location.ExposedTerms)}")
            .ToList();

        Assert.IsEmpty(
            exposedLocations,
            $"Há pistas que revelam diretamente cidade ou país: {string.Join(" | ", exposedLocations)}");
    }

    [TestMethod]
    public void SeedLocations_DoNotExposeMachineIdsInVisibleText()
    {
        var locationsWithMachineIds = LoadLocations()
            .Where(location => MachineIdRegex().IsMatch(string.Join(
                " ",
                location.City,
                location.Title,
                location.SceneLabel,
                location.SceneNote,
                location.Prompt,
                GetPlayableText(location))))
            .Select(location => location.Id)
            .ToList();

        Assert.IsEmpty(
            locationsWithMachineIds,
            $"Há identificadores técnicos visíveis no dataset: {string.Join(", ", locationsWithMachineIds)}");
    }

    [TestMethod]
    public void RealMediaLocations_HaveRequiredSourceAndLicenseMetadata()
    {
        var realMediaLocations = LoadLocations()
            .Where(location => location.Media is not null && location.Media.SourceProvider != "mock")
            .ToList();

        Assert.IsGreaterThanOrEqualTo(1000, realMediaLocations.Count, "O dataset deve manter pelo menos 1000 locais com media real validada.");

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
    public void RealMediaLocations_HaveUniquePrimaryImageSources()
    {
        var duplicateImageSources = LoadLocations()
            .Where(location => location.Media is not null && location.Media.SourceProvider != "mock")
            .GroupBy(location => location.Media!.ImageSourceUrl)
            .Where(group => !string.IsNullOrWhiteSpace(group.Key) && group.Count() > 1)
            .Select(group => $"{group.Key}: {string.Join(", ", group.Select(location => location.Id))}")
            .ToList();

        Assert.IsEmpty(
            duplicateImageSources,
            $"Há imagens principais repetidas no dataset: {string.Join(" | ", duplicateImageSources)}");
    }

    [TestMethod]
    public void SeedLocations_DoNotKeepUnreviewedAerialPrimaryImages()
    {
        var unreviewedAerialImages = LoadLocations()
            .Where(HasAerialPrimaryImage)
            .Where(location =>
                !ReviewedAerialImageSources.TryGetValue(location.Id, out var reviewedSource) ||
                !string.Equals(reviewedSource, location.Media!.ImageSourceUrl, StringComparison.Ordinal))
            .Select(location => $"{location.Id}: {location.Media!.ImageSourceUrl}")
            .ToList();

        Assert.IsEmpty(
            unreviewedAerialImages,
            $"Há imagens aéreas ou panorâmicas sem revisão manual registada: {string.Join(" | ", unreviewedAerialImages)}");
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

    [TestMethod]
    public void SeedLocations_IncludeSelectedMapillaryVisualSources()
    {
        var mapillaryLocations = LoadLocations()
            .Where(location => location.GetVisualSources().Any(source => source.SourceProvider == "Mapillary"))
            .ToList();

        Assert.IsGreaterThanOrEqualTo(150, mapillaryLocations.Count, "O dataset deve manter pelo menos 150 locais com Mapillary selecionado.");

        foreach (var location in mapillaryLocations)
        {
            var source = location.GetVisualSources().Single(candidate => candidate.SourceProvider == "Mapillary");

            AssertRequired(location.Id, source.ImageUrl, "visualSources.imageUrl");
            AssertRequired(location.Id, source.ImageSourceUrl, "visualSources.imageSourceUrl");
            AssertRequired(location.Id, source.ImageAttribution, "visualSources.imageAttribution");
            Assert.AreEqual("CC BY-SA 4.0", source.ImageLicense, $"{location.Id} deve manter licença Mapillary normalizada.");
            Assert.AreEqual("https://creativecommons.org/licenses/by-sa/4.0/", source.ImageLicenseUrl);
            Assert.AreEqual("Mapillary", source.StreetViewProvider);
            AssertRequired(location.Id, source.StreetViewUrl, "visualSources.streetViewUrl");
            StringAssert.StartsWith(source.ImageUrl!, "/api/media/mapillary/");
            StringAssert.StartsWith(source.ImageSourceUrl!, "https://www.mapillary.com/app/?pKey=");
            Assert.IsFalse(source.ImageUrl.Contains("scontent.", StringComparison.OrdinalIgnoreCase), $"{location.Id} não deve guardar URLs temporários Mapillary.");
            Assert.IsTrue(DateOnly.TryParse(source.VerifiedAt, out _), $"{location.Id} tem visualSources.verifiedAt inválido.");
        }
    }

    private static void AssertRequired(string locationId, string? value, string fieldName)
    {
        Assert.IsFalse(string.IsNullOrWhiteSpace(value), $"{locationId} não tem media.{fieldName} preenchido.");
    }

    private static double CalculateDistanceMeters(double firstLatitude, double firstLongitude, double secondLatitude, double secondLongitude)
    {
        const double earthRadiusMeters = 6_371_000;
        var firstLatitudeRadians = DegreesToRadians(firstLatitude);
        var secondLatitudeRadians = DegreesToRadians(secondLatitude);
        var latitudeDelta = DegreesToRadians(secondLatitude - firstLatitude);
        var longitudeDelta = DegreesToRadians(secondLongitude - firstLongitude);
        var haversine =
            Math.Sin(latitudeDelta / 2) * Math.Sin(latitudeDelta / 2) +
            Math.Cos(firstLatitudeRadians) *
            Math.Cos(secondLatitudeRadians) *
            Math.Sin(longitudeDelta / 2) *
            Math.Sin(longitudeDelta / 2);

        return 2 * earthRadiusMeters * Math.Atan2(Math.Sqrt(haversine), Math.Sqrt(1 - haversine));
    }

    private static double DegreesToRadians(double degrees)
    {
        return degrees * Math.PI / 180;
    }

    private static string GetPlayableText(SeedLocation location)
    {
        var clueText = location.Clues.SelectMany(clue => new[] { clue.Label, clue.Value });

        return string.Join(
            " ",
            new[] { location.Title, location.SceneLabel, location.SceneNote, location.Prompt }.Concat(clueText));
    }

    private static bool HasAerialPrimaryImage(SeedLocation location)
    {
        if (location.Media is null)
        {
            return false;
        }

        var sourceText = string.Join(" ", location.Media.ImageUrl, location.Media.ImageSourceUrl);
        string[] aerialPatterns =
        [
            "aerial",
            "aire",
            "leteck",
            "drone",
            "satellite",
            "from_the_air",
            "from_above",
            "vu_du_ciel",
            "des(de)?_el_aire",
            "panorama",
        ];

        return aerialPatterns.Any(pattern => Regex.IsMatch(sourceText, pattern, RegexOptions.IgnoreCase));
    }

    [GeneratedRegex(@"\bQ\d+\b", RegexOptions.IgnoreCase)]
    private static partial Regex MachineIdRegex();

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
