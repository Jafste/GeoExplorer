using GeoExplorer.Backend.Contracts;
using GeoExplorer.Backend.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging.Abstractions;

namespace GeoExplorer.Backend.Tests;

[TestClass]
public sealed class GameSessionServiceTests
{
    [TestMethod]
    public void CreateSession_DoesNotExposeMockSceneImageForFrontendContract()
    {
        var service = CreateService();

        var response = service.CreateSession(new CreateSessionRequest(
            "europe",
            RoundCount: 1,
            Timed: true,
            RoundTimeSeconds: 60));

        Assert.IsNull(response.CurrentRound.Challenge.SceneImage);
        Assert.IsNotNull(response.CurrentRound.Challenge.Media);
        Assert.IsFalse(string.IsNullOrWhiteSpace(response.CurrentRound.Challenge.Media.ImageUrl));
    }

    [TestMethod]
    public void CreateSession_AcceptsCustomRoundTimeInSeconds()
    {
        var service = CreateService();

        var response = service.CreateSession(new CreateSessionRequest(
            "europe",
            RoundCount: 1,
            Timed: true,
            RoundTimeSeconds: 240));

        Assert.AreEqual(240, response.CurrentRound.TimeLimitSeconds);
    }

    [TestMethod]
    public void CreateSession_RejectsRoundTimeOutsideSupportedRange()
    {
        var service = CreateService();

        foreach (var roundTimeSeconds in new[] { 0, 3601 })
        {
            var exception = Assert.ThrowsExactly<GameFlowException>(() =>
                service.CreateSession(new CreateSessionRequest(
                    "europe",
                    RoundCount: 1,
                    Timed: true,
                    RoundTimeSeconds: roundTimeSeconds)));

            Assert.AreEqual("O tempo por ronda deve estar entre 1 e 3600 segundos.", exception.Message);
        }
    }

    [TestMethod]
    public void CreateSession_ReturnsSafeMediaMetadataForActiveRound()
    {
        var service = CreateService();

        var response = service.CreateSession(new CreateSessionRequest(
            "europe",
            RoundCount: 1,
            Timed: true,
            RoundTimeSeconds: 60));

        Assert.IsNotNull(response.CurrentRound.Challenge.Media);
        Assert.IsFalse(string.IsNullOrWhiteSpace(response.CurrentRound.Challenge.Media.SourceProvider));
        Assert.IsFalse(string.IsNullOrWhiteSpace(response.CurrentRound.Challenge.Media.ImageUrl));
        Assert.IsNull(response.CurrentRound.Challenge.Media.ImageAttribution);
        Assert.IsNull(response.CurrentRound.Challenge.Media.ImageSourceUrl);
        Assert.IsFalse(string.IsNullOrWhiteSpace(response.CurrentRound.Challenge.Media.ImageLicense));
        Assert.IsTrue(DateOnly.TryParse(response.CurrentRound.Challenge.Media.VerifiedAt, out _));
        Assert.IsNotNull(response.CurrentRound.Challenge.VisualSources);
        Assert.IsGreaterThanOrEqualTo(1, response.CurrentRound.Challenge.VisualSources.Count);
        Assert.IsTrue(
            response.CurrentRound.Challenge.VisualSources.Any(source =>
                source.SourceProvider == response.CurrentRound.Challenge.Media.SourceProvider &&
                source.ImageUrl == response.CurrentRound.Challenge.Media.ImageUrl &&
                source.ImageSourceUrl == response.CurrentRound.Challenge.Media.ImageSourceUrl),
            "A fonte visual escolhida deve estar listada em visualSources.");
    }

    [TestMethod]
    public void CreateSession_UsesSelectedVisualSourceAsRoundMedia()
    {
        using var seed = TestSeedDirectory.CreateWithVisualSources();
        var service = CreateService(seed.BackendContentRoot, randomIndex: maxExclusive => maxExclusive - 1);

        var response = service.CreateSession(new CreateSessionRequest(
            "europe",
            RoundCount: 1,
            Timed: false,
            RoundTimeSeconds: null));

        Assert.IsNotNull(response.CurrentRound.Challenge.Media);
        Assert.AreEqual("Panoramax", response.CurrentRound.Challenge.Media.SourceProvider);
        StringAssert.StartsWith(response.CurrentRound.Challenge.Media.ImageUrl!, "/api/media/source/");
        Assert.IsNull(response.CurrentRound.Challenge.Media.ImageSourceUrl);
        Assert.IsNull(response.CurrentRound.Challenge.Media.StreetViewUrl);
        Assert.AreEqual(response.CurrentRound.Id, response.CurrentRound.Challenge.Id);
        Assert.AreEqual("Rua de teste", response.CurrentRound.Challenge.Title);
        Assert.AreEqual(string.Empty, response.CurrentRound.Challenge.City);
        Assert.AreEqual("Europa", response.CurrentRound.Challenge.Country);
        Assert.HasCount(2, response.CurrentRound.Challenge.VisualSources);
    }

    [TestMethod]
    public void CreateSession_WithoutMapillaryToken_DoesNotUseMapillaryAsRoundMedia()
    {
        using var seed = TestSeedDirectory.CreateWithMapillaryVisualSource();
        var service = CreateService(seed.BackendContentRoot, randomIndex: maxExclusive => maxExclusive - 1);

        var response = service.CreateSession(new CreateSessionRequest(
            "europe",
            RoundCount: 1,
            Timed: false,
            RoundTimeSeconds: null));

        Assert.IsNotNull(response.CurrentRound.Challenge.Media);
        Assert.AreEqual("Wikimedia Commons", response.CurrentRound.Challenge.Media.SourceProvider);
        StringAssert.StartsWith(response.CurrentRound.Challenge.Media.ImageUrl!, "/api/media/source/");
        Assert.IsNull(response.CurrentRound.Challenge.Media.ImageSourceUrl);
        Assert.IsTrue(response.CurrentRound.Challenge.VisualSources.Any(source => source.SourceProvider == "Mapillary"));
    }

    [TestMethod]
    public void CreateSession_WithMapillaryToken_CanUseMapillaryAsRoundMedia()
    {
        using var seed = TestSeedDirectory.CreateWithMapillaryVisualSource();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Mapillary:AccessToken"] = "test-token",
            })
            .Build();
        var service = CreateService(
            seed.BackendContentRoot,
            randomIndex: maxExclusive => maxExclusive - 1,
            configuration);

        var response = service.CreateSession(new CreateSessionRequest(
            "europe",
            RoundCount: 1,
            Timed: false,
            RoundTimeSeconds: null));

        Assert.IsNotNull(response.CurrentRound.Challenge.Media);
        Assert.AreEqual("Mapillary", response.CurrentRound.Challenge.Media.SourceProvider);
        Assert.AreEqual("/api/media/mapillary/1117445272087508", response.CurrentRound.Challenge.Media.ImageUrl);
    }

    [TestMethod]
    public void CreateSession_SelectsUniqueLocationsWithinSession()
    {
        var service = CreateService();
        var session = service.CreateSession(new CreateSessionRequest(
            "europe",
            RoundCount: 10,
            Timed: false,
            RoundTimeSeconds: null));
        var selectedCoordinates = new List<string>();
        var currentRound = session.CurrentRound;

        for (var index = 0; index < 10; index++)
        {
            var response = service.TimeoutRound(session.SessionId, currentRound.Id, null);
            selectedCoordinates.Add($"{response.Result.CorrectLatitude:F5},{response.Result.CorrectLongitude:F5}");

            if (!response.Progress.Completed)
            {
                currentRound = service.GetCurrentRound(session.SessionId);
            }
        }

        Assert.AreEqual(10, selectedCoordinates.Distinct().Count());
    }

    [TestMethod]
    public void CreateSession_WithCountries_SelectsOnlyMatchingLocations()
    {
        var service = CreateService();
        var session = service.CreateSession(new CreateSessionRequest(
            "europe",
            RoundCount: 3,
            Timed: false,
            RoundTimeSeconds: null,
            Countries: ["Espanha", "Portugal"]));
        var countries = new List<string>();
        var currentRound = session.CurrentRound;

        for (var index = 0; index < 3; index++)
        {
            var response = service.TimeoutRound(session.SessionId, currentRound.Id, null);
            countries.Add(response.Result.Country);

            if (!response.Progress.Completed)
            {
                currentRound = service.GetCurrentRound(session.SessionId);
            }
        }

        Assert.IsTrue(countries.All(country => country is "Espanha" or "Portugal"));
    }

    [TestMethod]
    public void CreateSession_AvoidsVeryCloseLocationsWhenAlternativesExist()
    {
        using var seed = TestSeedDirectory.CreateWithNearbyLocations();
        var service = CreateService(seed.BackendContentRoot, randomIndex: _ => 0);

        var session = service.CreateSession(new CreateSessionRequest(
            "europe",
            RoundCount: 2,
            Timed: false,
            RoundTimeSeconds: null));

        var firstRound = session.CurrentRound;
        var firstResponse = service.TimeoutRound(session.SessionId, firstRound.Id, null);
        Assert.IsFalse(firstResponse.Progress.Completed);

        var secondRound = service.GetCurrentRound(session.SessionId);
        service.TimeoutRound(session.SessionId, secondRound.Id, null);
        var selectedLocationTitles = service.GetResults(session.SessionId)
            .Rounds
            .Select(round => round.Title)
            .ToArray();

        CollectionAssert.AreEquivalent(new[] { "Local próximo A", "Local afastado" }, selectedLocationTitles);
    }

    [TestMethod]
    public void SubmitGuess_ReturnsMediaMetadataInRoundResult()
    {
        var service = CreateService();
        var session = service.CreateSession(new CreateSessionRequest(
            "europe",
            RoundCount: 1,
            Timed: false,
            RoundTimeSeconds: null));

        var response = service.SubmitGuess(
            session.SessionId,
            session.CurrentRound.Id,
            new GuessCoordinatesDto(47.2692, 11.4041, "Innsbruck"));

        Assert.IsNotNull(response.Result.Media);
        Assert.IsFalse(string.IsNullOrWhiteSpace(response.Result.Media.ImageSourceUrl));
        Assert.IsFalse(string.IsNullOrWhiteSpace(response.Result.Media.ImageLicenseUrl));
        Assert.IsGreaterThanOrEqualTo(1, response.Result.VisualSources.Count);
        Assert.IsTrue(
            response.Result.VisualSources.Any(source =>
                source.SourceProvider == response.Result.Media.SourceProvider &&
                source.ImageUrl == response.Result.Media.ImageUrl),
            "A fonte visual escolhida deve estar listada em visualSources.");
    }

    [TestMethod]
    public void SubmitGuess_AcceptsAtlanticIslandsAndCanaryIslandsInsideSupportedMap()
    {
        foreach (var (latitude, longitude, label) in new[]
        {
            (37.7412, -25.6756, "Açores"),
            (32.7607, -16.9595, "Madeira"),
            (28.2916, -16.6291, "Tenerife"),
        })
        {
            var service = CreateService();
            var session = service.CreateSession(new CreateSessionRequest(
                "europe",
                RoundCount: 1,
                Timed: false,
                RoundTimeSeconds: null));

            var response = service.SubmitGuess(
                session.SessionId,
                session.CurrentRound.Id,
                new GuessCoordinatesDto(latitude, longitude, label));

            Assert.IsNotNull(response.Result.Guess);
            Assert.AreEqual(label, response.Result.Guess.Label);
        }
    }

    [TestMethod]
    public void SubmitGuess_WithNonFiniteCoordinates_ThrowsBadRequest()
    {
        var service = CreateService();
        var session = service.CreateSession(new CreateSessionRequest(
            "europe",
            RoundCount: 1,
            Timed: false,
            RoundTimeSeconds: null));

        var exception = Assert.ThrowsExactly<GameFlowException>(() =>
            service.SubmitGuess(
                session.SessionId,
                session.CurrentRound.Id,
                new GuessCoordinatesDto(double.NaN, -8.6109, "Porto")));

        Assert.AreEqual(400, exception.StatusCode);
        Assert.AreEqual("O palpite tem coordenadas inválidas.", exception.Message);
    }

    [TestMethod]
    public void SubmitGuess_WithControlCharacterInLabel_ThrowsBadRequest()
    {
        var service = CreateService();
        var session = service.CreateSession(new CreateSessionRequest(
            "europe",
            RoundCount: 1,
            Timed: false,
            RoundTimeSeconds: null));

        var exception = Assert.ThrowsExactly<GameFlowException>(() =>
            service.SubmitGuess(
                session.SessionId,
                session.CurrentRound.Id,
                new GuessCoordinatesDto(41.1496, -8.6109, "Porto\nNorte")));

        Assert.AreEqual(400, exception.StatusCode);
        Assert.AreEqual("A descrição do palpite não é válida.", exception.Message);
    }

    private static GameSessionService CreateService()
    {
        return CreateService(Path.Combine(FindRepoRoot(), "src", "backend"));
    }

    private static GameSessionService CreateService(
        string contentRootPath,
        Func<int, int>? randomIndex = null,
        IConfiguration? configuration = null)
    {
        var environment = new TestWebHostEnvironment
        {
            ContentRootPath = contentRootPath,
        };

        return new GameSessionService(
            new SeedLocationCatalog(environment),
            configuration ?? new ConfigurationBuilder().Build(),
            NullLogger<GameSessionService>.Instance,
            persistenceStore: null,
            randomIndex);
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

    private sealed class TestWebHostEnvironment : IWebHostEnvironment
    {
        public string ApplicationName { get; set; } = "GeoExplorer.Backend.Tests";
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
        public string ContentRootPath { get; set; } = string.Empty;
        public string EnvironmentName { get; set; } = "Development";
        public string WebRootPath { get; set; } = string.Empty;
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
    }

    private sealed class TestSeedDirectory : IDisposable
    {
        private readonly string _root;

        private TestSeedDirectory(string root)
        {
            _root = root;
            BackendContentRoot = Path.Combine(root, "backend");
        }

        public string BackendContentRoot { get; }

        public static TestSeedDirectory CreateWithVisualSources()
        {
            var root = Path.Combine(Path.GetTempPath(), $"geoexplorer-seed-{Guid.NewGuid()}");
            var seedDirectory = Path.Combine(root, "database", "seed");
            Directory.CreateDirectory(seedDirectory);
            Directory.CreateDirectory(Path.Combine(root, "backend"));
            File.WriteAllText(Path.Combine(seedDirectory, "locations.json"), """
                [
                  {
                    "id": "test-location",
                    "title": "Local de teste",
                    "city": "Porto",
                    "country": "Portugal",
                    "region": "europe",
                    "category": "historic-core",
                    "latitude": 41.1402,
                    "longitude": -8.611,
                    "sceneLabel": "Rua de teste",
                    "sceneNote": "Nota visual de teste.",
                    "prompt": "Observa o local de teste.",
                    "visualGradient": ["#111111", "#222222", "#333333"],
                    "media": {
                      "sourceProvider": "Wikimedia Commons",
                      "imageUrl": "https://example.test/wikimedia.jpg",
                      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:Teste.jpg",
                      "imageAttribution": "Autor Wikimedia",
                      "imageLicense": "CC BY-SA 4.0",
                      "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
                      "verifiedAt": "2026-05-14"
                    },
                    "visualSources": [
                      {
                        "sourceProvider": "Panoramax",
                        "imageUrl": "https://example.test/panoramax.jpg",
                        "imageSourceUrl": "https://api.panoramax.xyz/api/collections/test/items/test",
                        "imageAttribution": "Autor Panoramax",
                        "imageLicense": "CC BY-SA 4.0",
                        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
                        "streetViewProvider": "Panoramax",
                        "streetViewUrl": "https://api.panoramax.xyz/#focus=pic&pic=test",
                        "verifiedAt": "2026-05-14"
                      }
                    ],
                    "clues": [
                      {
                        "label": "Fonte",
                        "value": "Local com duas fontes visuais",
                        "confidence": "Alta"
                      }
                    ]
                  }
                ]
                """);

            return new TestSeedDirectory(root);
        }

        public static TestSeedDirectory CreateWithMapillaryVisualSource()
        {
            var root = Path.Combine(Path.GetTempPath(), $"geoexplorer-seed-{Guid.NewGuid()}");
            var seedDirectory = Path.Combine(root, "database", "seed");
            Directory.CreateDirectory(seedDirectory);
            Directory.CreateDirectory(Path.Combine(root, "backend"));
            File.WriteAllText(Path.Combine(seedDirectory, "locations.json"), """
                [
                  {
                    "id": "test-location",
                    "title": "Local de teste",
                    "city": "Porto",
                    "country": "Portugal",
                    "region": "europe",
                    "category": "historic-core",
                    "latitude": 41.1402,
                    "longitude": -8.611,
                    "sceneLabel": "Rua de teste",
                    "sceneNote": "Nota visual de teste.",
                    "prompt": "Observa o local de teste.",
                    "visualGradient": ["#111111", "#222222", "#333333"],
                    "media": {
                      "sourceProvider": "Wikimedia Commons",
                      "imageUrl": "https://example.test/wikimedia.jpg",
                      "imageSourceUrl": "https://commons.wikimedia.org/wiki/File:Teste.jpg",
                      "imageAttribution": "Autor Wikimedia",
                      "imageLicense": "CC BY-SA 4.0",
                      "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
                      "verifiedAt": "2026-05-14"
                    },
                    "visualSources": [
                      {
                        "sourceProvider": "Mapillary",
                        "imageUrl": "/api/media/mapillary/1117445272087508",
                        "imageSourceUrl": "https://www.mapillary.com/app/?pKey=1117445272087508",
                        "imageAttribution": "Autor Mapillary",
                        "imageLicense": "CC BY-SA 4.0",
                        "imageLicenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
                        "streetViewProvider": "Mapillary",
                        "streetViewUrl": "https://www.mapillary.com/app/?pKey=1117445272087508",
                        "verifiedAt": "2026-05-20"
                      }
                    ],
                    "clues": [
                      {
                        "label": "Fonte",
                        "value": "Local com fonte Mapillary",
                        "confidence": "Alta"
                      }
                    ]
                  }
                ]
                """);

            return new TestSeedDirectory(root);
        }

        public static TestSeedDirectory CreateWithNearbyLocations()
        {
            var root = Path.Combine(Path.GetTempPath(), $"geoexplorer-seed-{Guid.NewGuid()}");
            var seedDirectory = Path.Combine(root, "database", "seed");
            Directory.CreateDirectory(seedDirectory);
            Directory.CreateDirectory(Path.Combine(root, "backend"));
            File.WriteAllText(Path.Combine(seedDirectory, "locations.json"), """
                [
                  {
                    "id": "nearby-a",
                    "title": "Local próximo A",
                    "city": "Porto",
                    "country": "Portugal",
                    "region": "europe",
                    "category": "historic-core",
                    "latitude": 41.1402,
                    "longitude": -8.611,
                    "sceneLabel": "Rua de teste",
                    "sceneNote": "Nota visual de teste.",
                    "prompt": "Observa o local de teste.",
                    "visualGradient": ["#111111", "#222222", "#333333"],
                    "clues": [
                      {
                        "label": "Fonte",
                        "value": "Local de teste",
                        "confidence": "Alta"
                      }
                    ]
                  },
                  {
                    "id": "nearby-b",
                    "title": "Local próximo B",
                    "city": "Porto",
                    "country": "Portugal",
                    "region": "europe",
                    "category": "historic-core",
                    "latitude": 41.14025,
                    "longitude": -8.61105,
                    "sceneLabel": "Rua de teste",
                    "sceneNote": "Nota visual de teste.",
                    "prompt": "Observa o local de teste.",
                    "visualGradient": ["#111111", "#222222", "#333333"],
                    "clues": [
                      {
                        "label": "Fonte",
                        "value": "Local de teste",
                        "confidence": "Alta"
                      }
                    ]
                  },
                  {
                    "id": "far-away",
                    "title": "Local afastado",
                    "city": "Lisboa",
                    "country": "Portugal",
                    "region": "europe",
                    "category": "historic-core",
                    "latitude": 38.7169,
                    "longitude": -9.1399,
                    "sceneLabel": "Rua de teste",
                    "sceneNote": "Nota visual de teste.",
                    "prompt": "Observa o local de teste.",
                    "visualGradient": ["#111111", "#222222", "#333333"],
                    "clues": [
                      {
                        "label": "Fonte",
                        "value": "Local de teste",
                        "confidence": "Alta"
                      }
                    ]
                  }
                ]
                """);

            return new TestSeedDirectory(root);
        }

        public void Dispose()
        {
            if (Directory.Exists(_root))
            {
                Directory.Delete(_root, recursive: true);
            }
        }
    }
}
