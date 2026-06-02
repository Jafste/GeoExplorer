using GeoExplorer.Backend.Contracts;
using GeoExplorer.Backend.Data;
using GeoExplorer.Backend.Hubs;
using GeoExplorer.Backend.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging.Abstractions;

namespace GeoExplorer.Backend.Tests;

[TestClass]
public sealed class MultiplayerRoomServiceTests
{
    [TestMethod]
    public async Task CreateRoom_AssignsOwnerAndShareableRoomCode()
    {
        var service = CreateService();

        var created = await service.CreateRoomAsync(
            new CreateMultiplayerRoomRequest("player-a", "Marcos", DefaultConfig()),
            "connection-a");

        Assert.AreEqual("lobby", created.State.Status);
        Assert.AreEqual("player-a", created.State.OwnerPlayerId);
        Assert.AreEqual(6, created.State.RoomCode.Length);
        Assert.HasCount(1, created.State.Players);
        Assert.IsTrue(created.State.Players[0].IsOwner);
    }

    [TestMethod]
    public async Task CreateRoom_WithPassword_HidesPasswordAndRequiresItOnJoin()
    {
        var service = CreateService();
        var created = await service.CreateRoomAsync(
            new CreateMultiplayerRoomRequest(
                "player-a",
                "Marcos",
                DefaultConfig(),
                IsPublic: true,
                Password: "porto123"),
            "connection-a");

        Assert.IsTrue(created.State.IsPublic);
        Assert.IsTrue(created.State.HasPassword);

        var exception = await Assert.ThrowsExactlyAsync<GameFlowException>(() =>
            service.JoinRoomAsync(
                new JoinMultiplayerRoomRequest(created.RoomCode, "player-b", "Ana", Password: "errada"),
                "connection-b"));

        Assert.AreEqual(StatusCodes.Status403Forbidden, exception.StatusCode);

        var joined = await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-b", "Ana", Password: "porto123"),
            "connection-b");

        Assert.HasCount(2, joined.State.Players);
    }

    [TestMethod]
    public async Task ListOpenRooms_ReturnsOnlyPublicLobbyRooms()
    {
        var service = CreateService();
        var publicRoom = await service.CreateRoomAsync(
            new CreateMultiplayerRoomRequest("player-a", "Marcos", DefaultConfig(), IsPublic: true),
            "connection-a");
        await service.CreateRoomAsync(
            new CreateMultiplayerRoomRequest("player-b", "Ana", DefaultConfig(), IsPublic: false),
            "connection-b");

        var rooms = service.ListOpenRooms();

        Assert.HasCount(1, rooms);
        Assert.AreEqual(publicRoom.RoomCode, rooms[0].RoomCode);
        Assert.AreEqual("Marcos", rooms[0].OwnerDisplayName);
        Assert.IsFalse(rooms[0].HasPassword);
    }

    [TestMethod]
    public async Task UpdateDisplayName_ChangesPlayerNameInRoomState()
    {
        var service = CreateService();
        var created = await service.CreateRoomAsync(
            new CreateMultiplayerRoomRequest("player-a", "Marcos", DefaultConfig()),
            "connection-a");

        var updated = await service.UpdateDisplayNameAsync(
            new UpdateMultiplayerDisplayNameRequest(created.RoomCode, "player-a", "Explorador Norte"));

        Assert.AreEqual("Explorador Norte", updated.State.Players[0].DisplayName);
    }

    [TestMethod]
    public async Task JoinRoom_WithDuplicateName_ReturnsConflict()
    {
        var service = CreateService();
        var created = await service.CreateRoomAsync(
            new CreateMultiplayerRoomRequest("player-a", "Marcos", DefaultConfig()),
            "connection-a");

        var exception = await Assert.ThrowsExactlyAsync<GameFlowException>(() =>
            service.JoinRoomAsync(
                new JoinMultiplayerRoomRequest(created.RoomCode, "player-b", "marcos"),
                "connection-b"));

        Assert.AreEqual(StatusCodes.Status409Conflict, exception.StatusCode);
    }

    [TestMethod]
    public async Task JoinRoom_WithInvalidRoomCodeCharacters_ReturnsBadRequest()
    {
        var service = CreateService();
        await service.CreateRoomAsync(
            new CreateMultiplayerRoomRequest("player-a", "Marcos", DefaultConfig()),
            "connection-a");

        var exception = await Assert.ThrowsExactlyAsync<GameFlowException>(() =>
            service.JoinRoomAsync(
                new JoinMultiplayerRoomRequest("!!!!!!", "player-b", "Ana"),
                "connection-b"));

        Assert.AreEqual(StatusCodes.Status400BadRequest, exception.StatusCode);
        Assert.AreEqual("Código de sala inválido.", exception.Message);
    }

    [TestMethod]
    public async Task LeaveRoom_WhenOwnerLeavesLobby_AssignsNextPlayerAsOwner()
    {
        var service = CreateService();
        var created = await service.CreateRoomAsync(
            new CreateMultiplayerRoomRequest("player-a", "Marcos", DefaultConfig()),
            "connection-a");
        await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-b", "Ana"),
            "connection-b");

        var afterLeave = await service.LeaveRoomAsync(
            new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));

        Assert.AreEqual("lobby", afterLeave.State.Status);
        Assert.AreEqual("player-b", afterLeave.State.OwnerPlayerId);
        Assert.HasCount(1, afterLeave.State.Players);
        Assert.IsTrue(afterLeave.State.Players[0].IsOwner);
    }

    [TestMethod]
    public async Task JoinRoom_WithExistingPlayerDuringGame_ReconnectsWithoutDuplicatingPlayer()
    {
        var service = CreateService();
        var created = await service.CreateRoomAsync(
            new CreateMultiplayerRoomRequest(
                "player-a",
                "Marcos",
                DefaultConfig(),
                IsPublic: false,
                Password: "porto123"),
            "connection-a");
        await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-b", "Ana", Password: "porto123"),
            "connection-b");
        await service.StartGameAsync(new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));
        await service.MarkDisconnectedAsync("connection-a");

        var reconnected = await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-a", "Marcos"),
            "connection-a-2");

        Assert.AreEqual("playing", reconnected.State.Status);
        Assert.HasCount(2, reconnected.State.Players);
        var player = reconnected.State.Players.Single(candidate => candidate.PlayerId == "player-a");
        Assert.IsTrue(player.Connected);
        Assert.IsTrue(player.IsOwner);
    }

    [TestMethod]
    public async Task LeaveRoom_WhenOwnerLeavesDuringGame_AssignsNextConnectedPlayerAsOwner()
    {
        var service = CreateService();
        var created = await service.CreateRoomAsync(
            new CreateMultiplayerRoomRequest("player-a", "Marcos", DefaultConfig()),
            "connection-a");
        await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-b", "Ana"),
            "connection-b");
        await service.StartGameAsync(new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));

        var afterLeave = await service.LeaveRoomAsync(
            new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));
        var state = afterLeave.State;

        Assert.AreEqual("player-b", state.OwnerPlayerId);
        Assert.IsFalse(state.Players.Single(player => player.PlayerId == "player-a").Connected);
        Assert.IsTrue(state.Players.Single(player => player.PlayerId == "player-b").IsOwner);
    }

    [TestMethod]
    public async Task SubmitGuess_WaitsForEveryConnectedPlayerBeforeRoundResult()
    {
        var service = CreateService();
        var created = await service.CreateRoomAsync(
            new CreateMultiplayerRoomRequest("player-a", "Marcos", DefaultConfig()),
            "connection-a");
        await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-b", "Ana"),
            "connection-b");
        var started = await service.StartGameAsync(new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));
        var round = started.RoundStarted ?? throw new AssertFailedException("A sala devia iniciar a primeira ronda.");

        var firstSubmit = await service.SubmitGuessAsync(
            new SubmitMultiplayerGuessRequest(
                created.RoomCode,
                "player-a",
                round.Id,
                new GuessCoordinatesDto(41.1496, -8.6109, "Porto")));

        Assert.IsNull(firstSubmit.RoundResolved);
        Assert.IsTrue(firstSubmit.State.Players.Single(player => player.PlayerId == "player-a").Submitted);
        Assert.IsFalse(firstSubmit.State.Players.Single(player => player.PlayerId == "player-b").Submitted);

        var secondSubmit = await service.SubmitGuessAsync(
            new SubmitMultiplayerGuessRequest(
                created.RoomCode,
                "player-b",
                round.Id,
                new GuessCoordinatesDto(48.8566, 2.3522, "Paris")));

        Assert.IsNotNull(secondSubmit.RoundResolved);
        Assert.AreEqual("round-result", secondSubmit.State.Status);
        Assert.HasCount(2, secondSubmit.RoundResolved.PlayerResults);
    }

    [TestMethod]
    public async Task LeaveRoom_DuringActiveRound_ResolvesWhenRemainingConnectedPlayersAlreadySubmitted()
    {
        var service = CreateService();
        var created = await service.CreateRoomAsync(
            new CreateMultiplayerRoomRequest("player-a", "Marcos", DefaultConfig()),
            "connection-a");
        await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-b", "Ana"),
            "connection-b");
        var started = await service.StartGameAsync(new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));
        var round = started.RoundStarted ?? throw new AssertFailedException("A sala devia iniciar a primeira ronda.");

        await service.SubmitGuessAsync(
            new SubmitMultiplayerGuessRequest(
                created.RoomCode,
                "player-a",
                round.Id,
                new GuessCoordinatesDto(41.1496, -8.6109, "Porto")));

        var afterLeave = await service.LeaveRoomAsync(
            new MultiplayerRoomPlayerRequest(created.RoomCode, "player-b"));

        Assert.IsNotNull(afterLeave.RoundResolved);
        Assert.AreEqual("round-result", afterLeave.State.Status);
        Assert.IsFalse(afterLeave.State.Players.Single(player => player.PlayerId == "player-b").Connected);
    }

    [TestMethod]
    public async Task LeaveRoom_DuringRoundResult_CompletesWhenRemainingConnectedPlayersAlreadyReady()
    {
        var service = CreateService();
        var created = await service.CreateRoomAsync(
            new CreateMultiplayerRoomRequest("player-a", "Marcos", DefaultConfig(roundCount: 1)),
            "connection-a");
        await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-b", "Ana"),
            "connection-b");
        var started = await service.StartGameAsync(new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));
        var round = started.RoundStarted ?? throw new AssertFailedException("A sala devia iniciar a primeira ronda.");

        await service.SubmitGuessAsync(
            new SubmitMultiplayerGuessRequest(
                created.RoomCode,
                "player-a",
                round.Id,
                new GuessCoordinatesDto(41.1496, -8.6109, "Porto")));
        await service.SubmitGuessAsync(
            new SubmitMultiplayerGuessRequest(
                created.RoomCode,
                "player-b",
                round.Id,
                new GuessCoordinatesDto(48.8566, 2.3522, "Paris")));
        await service.ReadyForNextRoundAsync(
            new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));

        var afterLeave = await service.LeaveRoomAsync(
            new MultiplayerRoomPlayerRequest(created.RoomCode, "player-b"));

        Assert.AreEqual("completed", afterLeave.State.Status);
        Assert.IsNotNull(afterLeave.GameCompleted);
        Assert.HasCount(2, afterLeave.GameCompleted.Players);
    }

    [TestMethod]
    public async Task ReadyForNextRound_CompletesRoomAfterFinalRound()
    {
        var service = CreateService();
        var created = await service.CreateRoomAsync(
            new CreateMultiplayerRoomRequest("player-a", "Marcos", DefaultConfig(roundCount: 1)),
            "connection-a");
        await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-b", "Ana"),
            "connection-b");
        var started = await service.StartGameAsync(new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));
        var round = started.RoundStarted ?? throw new AssertFailedException("A sala devia iniciar a primeira ronda.");

        await service.SubmitGuessAsync(
            new SubmitMultiplayerGuessRequest(
                created.RoomCode,
                "player-a",
                round.Id,
                new GuessCoordinatesDto(41.1496, -8.6109, "Porto")));
        await service.SubmitGuessAsync(
            new SubmitMultiplayerGuessRequest(
                created.RoomCode,
                "player-b",
                round.Id,
                new GuessCoordinatesDto(48.8566, 2.3522, "Paris")));

        var firstReady = await service.ReadyForNextRoundAsync(
            new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));
        Assert.IsNull(firstReady.GameCompleted);

        var secondReady = await service.ReadyForNextRoundAsync(
            new MultiplayerRoomPlayerRequest(created.RoomCode, "player-b"));

        Assert.AreEqual("completed", secondReady.State.Status);
        Assert.IsNotNull(secondReady.GameCompleted);
        Assert.HasCount(2, secondReady.GameCompleted.Players);
        Assert.HasCount(1, secondReady.GameCompleted.Rounds);
    }

    [TestMethod]
    public async Task MultiplayerRoomService_PersistsRoomPlayersRoundsAndGuesses()
    {
        var databaseName = $"geoexplorer-multiplayer-test-{Guid.NewGuid()}";
        var options = new DbContextOptionsBuilder<GeoExplorerDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;
        var factory = new TestDbContextFactory(options);
        var service = CreateService(factory);

        var created = await service.CreateRoomAsync(
            new CreateMultiplayerRoomRequest("player-a", "Marcos", DefaultConfig(roundCount: 1)),
            "connection-a");
        await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-b", "Ana"),
            "connection-b");
        var started = await service.StartGameAsync(new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));
        var round = started.RoundStarted ?? throw new AssertFailedException("A sala devia iniciar a primeira ronda.");
        await service.SubmitGuessAsync(
            new SubmitMultiplayerGuessRequest(
                created.RoomCode,
                "player-a",
                round.Id,
                new GuessCoordinatesDto(41.1496, -8.6109, "Porto")));
        await service.SubmitGuessAsync(
            new SubmitMultiplayerGuessRequest(
                created.RoomCode,
                "player-b",
                round.Id,
                new GuessCoordinatesDto(48.8566, 2.3522, "Paris")));

        await using var db = await factory.CreateDbContextAsync();
        var room = await db.MultiplayerRooms
            .AsNoTracking()
            .SingleAsync(candidate => candidate.RoomCode == created.RoomCode);
        var players = await db.MultiplayerPlayers
            .AsNoTracking()
            .Where(player => player.RoomId == room.Id)
            .ToListAsync();
        var rounds = await db.MultiplayerRounds
            .AsNoTracking()
            .Where(candidate => candidate.RoomId == room.Id)
            .ToListAsync();
        var guesses = await db.MultiplayerGuesses
            .AsNoTracking()
            .Where(guess => guess.RoundId == rounds[0].Id)
            .ToListAsync();

        Assert.AreEqual("round-result", room.Status);
        Assert.HasCount(2, players);
        Assert.HasCount(1, rounds);
        Assert.AreEqual("resolved", rounds[0].Status);
        Assert.HasCount(2, guesses);
    }

    private static CreateSessionRequest DefaultConfig(int roundCount = 2)
    {
        return new CreateSessionRequest("europe", roundCount, Timed: false, RoundTimeSeconds: null);
    }

    private static MultiplayerRoomService CreateService(IDbContextFactory<GeoExplorerDbContext>? factory = null)
    {
        var configurationValues = new Dictionary<string, string?>
        {
            ["GeoExplorer:UsePostgresPersistence"] = factory is null ? "false" : "true",
        };
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configurationValues)
            .Build();
        var environment = new TestWebHostEnvironment
        {
            ContentRootPath = Path.Combine(FindRepoRoot(), "src", "backend"),
        };
        var catalog = new SeedLocationCatalog(environment);
        var metrics = new DatabaseUsageMetrics();
        var store = factory is null ? null : new MultiplayerPersistenceStore(factory, metrics);

        return new MultiplayerRoomService(
            catalog,
            configuration,
            new TestHubContext(),
            NullLogger<MultiplayerRoomService>.Instance,
            store,
            randomIndex: _ => 0);
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

        throw new InvalidOperationException("Não foi possível encontrar a raiz do repositório.");
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
        public required string ContentRootPath { get; set; }
        public string ApplicationName { get; set; } = "GeoExplorer.Backend.Tests";
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
        public string EnvironmentName { get; set; } = "Development";
        public string WebRootPath { get; set; } = string.Empty;
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
    }

    private sealed class TestHubContext : IHubContext<MultiplayerHub>
    {
        public IHubClients Clients { get; } = new TestHubClients();
        public IGroupManager Groups { get; } = new TestGroupManager();
    }

    private sealed class TestHubClients : IHubClients
    {
        private readonly IClientProxy _proxy = new TestClientProxy();

        public IClientProxy All => _proxy;
        public IClientProxy AllExcept(IReadOnlyList<string> excludedConnectionIds) => _proxy;
        public IClientProxy Client(string connectionId) => _proxy;
        public IClientProxy Clients(IReadOnlyList<string> connectionIds) => _proxy;
        public IClientProxy Group(string groupName) => _proxy;
        public IClientProxy GroupExcept(string groupName, IReadOnlyList<string> excludedConnectionIds) => _proxy;
        public IClientProxy Groups(IReadOnlyList<string> groupNames) => _proxy;
        public IClientProxy User(string userId) => _proxy;
        public IClientProxy Users(IReadOnlyList<string> userIds) => _proxy;
    }

    private sealed class TestClientProxy : IClientProxy
    {
        public Task SendCoreAsync(
            string method,
            object?[] args,
            CancellationToken cancellationToken = default)
        {
            return Task.CompletedTask;
        }
    }

    private sealed class TestGroupManager : IGroupManager
    {
        public Task AddToGroupAsync(
            string connectionId,
            string groupName,
            CancellationToken cancellationToken = default)
        {
            return Task.CompletedTask;
        }

        public Task RemoveFromGroupAsync(
            string connectionId,
            string groupName,
            CancellationToken cancellationToken = default)
        {
            return Task.CompletedTask;
        }
    }
}
