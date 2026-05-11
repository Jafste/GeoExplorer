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
        var environment = new TestWebHostEnvironment
        {
            ContentRootPath = Path.Combine(FindRepoRoot(), "src", "backend"),
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
            store);
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
}
