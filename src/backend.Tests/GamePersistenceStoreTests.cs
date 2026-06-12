using GeoExplorer.Backend.Contracts;
using GeoExplorer.Backend.Data;
using GeoExplorer.Backend.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging.Abstractions;

namespace GeoExplorer.Backend.Tests;

[TestClass]
public sealed class GamePersistenceStoreTests
{
    [TestMethod]
    public async Task GameSessionService_PersistsSessionRoundsAndResolvedGuess()
    {
        var databaseName = $"geoexplorer-test-{Guid.NewGuid()}";
        var options = new DbContextOptionsBuilder<GeoExplorerDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;
        var factory = new TestDbContextFactory(options);
        var service = CreateService(factory);

        var session = service.CreateSession(new CreateSessionRequest(
            "europe",
            RoundCount: 2,
            Timed: false,
            RoundTimeSeconds: null));

        var resolution = service.SubmitGuess(
            session.SessionId,
            session.CurrentRound.Id,
            new GuessCoordinatesDto(41.1496, -8.6109, "Porto"));

        await using var db = await factory.CreateDbContextAsync();
        var persistedSession = await db.GameSessions
            .AsNoTracking()
            .SingleAsync(gameSession => gameSession.Id == Guid.Parse(session.SessionId));
        var persistedRounds = await db.SessionRounds
            .AsNoTracking()
            .Where(round => round.SessionId == persistedSession.Id)
            .OrderBy(round => round.RoundNumber)
            .ToListAsync();

        Assert.AreEqual("europe", persistedSession.Region);
        Assert.AreEqual(2, persistedSession.RoundCount);
        Assert.AreEqual("active", persistedSession.Status);
        Assert.AreEqual(resolution.Result.Score, persistedSession.TotalScore);
        Assert.HasCount(2, persistedRounds);
        Assert.AreEqual("resolved", persistedRounds[0].Status);
        Assert.AreEqual("Porto", persistedRounds[0].GuessLabel);
        Assert.AreEqual(41.1496, persistedRounds[0].GuessLatitude);
        Assert.AreEqual(-8.6109, persistedRounds[0].GuessLongitude);
        Assert.AreEqual("manual", persistedRounds[0].ResolutionReason);
        Assert.AreEqual(resolution.Result.Score, persistedRounds[0].Score);
        Assert.IsFalse(string.IsNullOrWhiteSpace(persistedRounds[0].VisualSource));
        Assert.IsNotNull(persistedRounds[0].ResolvedAt);
        Assert.AreEqual("pending", persistedRounds[1].Status);
    }

    [TestMethod]
    public async Task GameSessionService_MarksPersistedSessionCompletedAfterLastRound()
    {
        var databaseName = $"geoexplorer-test-{Guid.NewGuid()}";
        var options = new DbContextOptionsBuilder<GeoExplorerDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;
        var factory = new TestDbContextFactory(options);
        var service = CreateService(factory);

        var session = service.CreateSession(new CreateSessionRequest(
            "europe",
            RoundCount: 1,
            Timed: false,
            RoundTimeSeconds: null));

        service.TimeoutRound(session.SessionId, session.CurrentRound.Id, null);

        await using var db = await factory.CreateDbContextAsync();
        var persistedSession = await db.GameSessions
            .AsNoTracking()
            .SingleAsync(gameSession => gameSession.Id == Guid.Parse(session.SessionId));
        var persistedRound = await db.SessionRounds
            .AsNoTracking()
            .SingleAsync(round => round.SessionId == persistedSession.Id);

        Assert.AreEqual("completed", persistedSession.Status);
        Assert.AreEqual(0, persistedSession.TotalScore);
        Assert.AreEqual("resolved", persistedRound.Status);
        Assert.AreEqual("timeout", persistedRound.ResolutionReason);
        Assert.IsNull(persistedRound.GuessLatitude);
        Assert.IsNull(persistedRound.GuessLongitude);
    }

    [TestMethod]
    public void GameSessionService_RestoresActiveSessionFromPersistence()
    {
        var databaseName = $"geoexplorer-test-{Guid.NewGuid()}";
        var options = new DbContextOptionsBuilder<GeoExplorerDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;
        var factory = new TestDbContextFactory(options);
        var originalService = CreateService(factory);

        var session = originalService.CreateSession(new CreateSessionRequest(
            "europe",
            RoundCount: 2,
            Timed: false,
            RoundTimeSeconds: null));

        originalService.SubmitGuess(
            session.SessionId,
            session.CurrentRound.Id,
            new GuessCoordinatesDto(41.1496, -8.6109, "Porto"));

        var restoredService = CreateService(factory);
        var restoredRound = restoredService.GetCurrentRound(session.SessionId);

        Assert.AreEqual(2, restoredRound.RoundNumber);

        var restoredResults = restoredService.GetResults(session.SessionId);
        Assert.AreEqual(session.SessionId, restoredResults.SessionId);
        Assert.HasCount(1, restoredResults.Rounds);
        Assert.AreEqual(1, restoredResults.Rounds[0].RoundNumber);
        Assert.AreEqual("manual", restoredResults.Rounds[0].Resolution);
    }

    [TestMethod]
    public void GameSessionService_RestoresCompletedSessionResultsFromPersistence()
    {
        var databaseName = $"geoexplorer-test-{Guid.NewGuid()}";
        var options = new DbContextOptionsBuilder<GeoExplorerDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;
        var factory = new TestDbContextFactory(options);
        var originalService = CreateService(factory);

        var session = originalService.CreateSession(new CreateSessionRequest(
            "europe",
            RoundCount: 1,
            Timed: false,
            RoundTimeSeconds: null));

        originalService.TimeoutRound(session.SessionId, session.CurrentRound.Id, null);

        var restoredService = CreateService(factory);
        var restoredResults = restoredService.GetResults(session.SessionId);

        Assert.AreEqual(session.SessionId, restoredResults.SessionId);
        Assert.AreEqual(1, restoredResults.TotalRounds);
        Assert.AreEqual(0, restoredResults.TotalScore);
        Assert.HasCount(1, restoredResults.Rounds);
        Assert.AreEqual("timeout", restoredResults.Rounds[0].Resolution);

        var exception = Assert.ThrowsExactly<GameFlowException>(() => restoredService.GetCurrentRound(session.SessionId));
        Assert.AreEqual(StatusCodes.Status400BadRequest, exception.StatusCode);
    }

    [TestMethod]
    public void GameSessionService_RestoresSelectedVisualSourceFromPersistence()
    {
        var databaseName = $"geoexplorer-test-{Guid.NewGuid()}";
        var options = new DbContextOptionsBuilder<GeoExplorerDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;
        var factory = new TestDbContextFactory(options);
        using var seed = TestSeedDirectory.CreateWithVisualSources();
        var originalService = CreateService(
            factory,
            new DatabaseUsageMetrics(),
            seed.BackendContentRoot,
            randomIndex: maxExclusive => maxExclusive - 1);

        var session = originalService.CreateSession(new CreateSessionRequest(
            "europe",
            RoundCount: 1,
            Timed: false,
            RoundTimeSeconds: null));

        Assert.AreEqual("Panoramax", session.CurrentRound.Challenge.Media?.SourceProvider);

        originalService.TimeoutRound(session.SessionId, session.CurrentRound.Id, null);

        var restoredService = CreateService(
            factory,
            new DatabaseUsageMetrics(),
            seed.BackendContentRoot,
            randomIndex: _ => 0);
        var restoredResults = restoredService.GetResults(session.SessionId);

        Assert.HasCount(1, restoredResults.Rounds);
        Assert.AreEqual("Panoramax", restoredResults.Rounds[0].Media?.SourceProvider);
        StringAssert.StartsWith(restoredResults.Rounds[0].Media?.ImageUrl!, "/api/media/source/");
    }


    [TestMethod]
    public void GameSessionService_TracksDatabaseUsageForPersistenceFlow()
    {
        var databaseName = $"geoexplorer-test-{Guid.NewGuid()}";
        var options = new DbContextOptionsBuilder<GeoExplorerDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;
        var factory = new TestDbContextFactory(options);
        var metrics = new DatabaseUsageMetrics();
        var originalService = CreateService(factory, metrics);

        var session = originalService.CreateSession(new CreateSessionRequest(
            "europe",
            RoundCount: 2,
            Timed: false,
            RoundTimeSeconds: null));

        originalService.SubmitGuess(
            session.SessionId,
            session.CurrentRound.Id,
            new GuessCoordinatesDto(41.1496, -8.6109, "Porto"));

        var restoredService = CreateService(factory, metrics);
        restoredService.GetCurrentRound(session.SessionId);

        var snapshot = metrics.GetSnapshot();

        Assert.AreEqual(3, snapshot.TotalReads);
        Assert.AreEqual(2, snapshot.TotalWrites);
        Assert.AreEqual(5, snapshot.TotalOperations);
        Assert.IsTrue(snapshot.Operations.Any(operation => operation.Name == "session_create" && operation.Writes == 1));
        Assert.IsTrue(snapshot.Operations.Any(operation => operation.Name == "round_resolve" && operation.Reads == 2 && operation.Writes == 1));
        Assert.IsTrue(snapshot.Operations.Any(operation => operation.Name == "session_restore" && operation.Reads == 1));
    }

    private static GameSessionService CreateService(IDbContextFactory<GeoExplorerDbContext> factory)
    {
        return CreateService(factory, new DatabaseUsageMetrics());
    }

    private static GameSessionService CreateService(
        IDbContextFactory<GeoExplorerDbContext> factory,
        DatabaseUsageMetrics metrics)
    {
        return CreateService(
            factory,
            metrics,
            Path.Combine(FindRepoRoot(), "src", "backend"),
            randomIndex: null);
    }

    private static GameSessionService CreateService(
        IDbContextFactory<GeoExplorerDbContext> factory,
        DatabaseUsageMetrics metrics,
        string contentRootPath,
        Func<int, int>? randomIndex)
    {
        var environment = new TestWebHostEnvironment
        {
            ContentRootPath = contentRootPath,
        };
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["GeoExplorer:UsePostgresPersistence"] = "true",
            })
            .Build();
        var catalog = new SeedLocationCatalog(environment);
        var store = new GamePersistenceStore(factory, metrics);

        return new GameSessionService(
            catalog,
            configuration,
            NullLogger<GameSessionService>.Instance,
            store,
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

    private sealed class TestDbContextFactory : IDbContextFactory<GeoExplorerDbContext>
    {
        private readonly DbContextOptions<GeoExplorerDbContext> _options;

        public TestDbContextFactory(DbContextOptions<GeoExplorerDbContext> options)
        {
            _options = options;
        }

        public GeoExplorerDbContext CreateDbContext()
        {
            return new GeoExplorerDbContext(_options);
        }

        public Task<GeoExplorerDbContext> CreateDbContextAsync(CancellationToken cancellationToken = default)
        {
            return Task.FromResult(CreateDbContext());
        }
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
                    "sceneImage": "/mock-scenes/test.svg",
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

        public void Dispose()
        {
            if (Directory.Exists(_root))
            {
                Directory.Delete(_root, recursive: true);
            }
        }
    }
}
