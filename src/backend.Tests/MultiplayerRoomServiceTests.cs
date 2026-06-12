using GeoExplorer.Backend.Contracts;
using GeoExplorer.Backend.Data;
using GeoExplorer.Backend.Hubs;
using GeoExplorer.Backend.Services;
using System.Reflection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging;
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
    public async Task MarkDisconnected_WhenOwnerRefreshesInLobby_ReconnectsWithoutDuplicatingPlayerAndKeepsNewOwnerPolicy()
    {
        var service = CreateService(disconnectGracePeriod: TimeSpan.FromSeconds(1));
        var created = await service.CreateRoomAsync(
            new CreateMultiplayerRoomRequest("player-a", "Ana", DefaultConfig()),
            "connection-a");
        await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-b", "Bruno"),
            "connection-b");

        var disconnected = await service.MarkDisconnectedAsync("connection-a");
        var disconnectedState = disconnected.Single().State;

        Assert.AreEqual("lobby", disconnectedState.Status);
        Assert.AreEqual("player-b", disconnectedState.OwnerPlayerId);
        var disconnectedPlayer = disconnectedState.Players.Single(player => player.PlayerId == "player-a");
        Assert.IsFalse(disconnectedPlayer.Connected);
        Assert.IsNotNull(disconnectedPlayer.DisconnectGraceEndsAt);
        Assert.IsTrue(disconnectedPlayer.DisconnectGraceEndsAt > DateTimeOffset.UtcNow);

        var reconnected = await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-a", "Ana"),
            "connection-a-refresh");
        await Task.Delay(140);

        Assert.AreEqual("lobby", reconnected.State.Status);
        Assert.AreEqual("player-b", reconnected.State.OwnerPlayerId);
        Assert.HasCount(2, reconnected.State.Players);
        var reconnectedPlayer = reconnected.State.Players.Single(player => player.PlayerId == "player-a");
        Assert.IsTrue(reconnectedPlayer.Connected);
        Assert.IsNull(reconnectedPlayer.DisconnectGraceEndsAt);
        Assert.IsTrue(reconnected.State.Players.Single(player => player.PlayerId == "player-b").IsOwner);
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
    public async Task SubmitGuess_WaitsForPassivelyDisconnectedPlayerToReconnectBeforeRoundResult()
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

        await service.MarkDisconnectedAsync("connection-a");

        var firstSubmit = await service.SubmitGuessAsync(
            new SubmitMultiplayerGuessRequest(
                created.RoomCode,
                "player-b",
                round.Id,
                new GuessCoordinatesDto(48.8566, 2.3522, "Paris")));

        Assert.IsNull(firstSubmit.RoundResolved);
        Assert.AreEqual("playing", firstSubmit.State.Status);

        await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-a", "Marcos"),
            "connection-a-2");

        var ownerSubmit = await service.SubmitGuessAsync(
            new SubmitMultiplayerGuessRequest(
                created.RoomCode,
                "player-a",
                round.Id,
                new GuessCoordinatesDto(41.1496, -8.6109, "Porto")));

        Assert.IsNotNull(ownerSubmit.RoundResolved);
        Assert.AreEqual("round-result", ownerSubmit.State.Status);
    }

    [TestMethod]
    public async Task SubmitGuess_WhenRoomHasNoActiveRound_LogsDiagnosticRoomContext()
    {
        var logger = new TestLogger<MultiplayerRoomService>();
        var service = CreateService(logger: logger);
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
        await service.SubmitGuessAsync(
            new SubmitMultiplayerGuessRequest(
                created.RoomCode,
                "player-b",
                round.Id,
                new GuessCoordinatesDto(48.8566, 2.3522, "Paris")));

        var exception = await Assert.ThrowsExactlyAsync<GameFlowException>(() =>
            service.SubmitGuessAsync(
                new SubmitMultiplayerGuessRequest(
                    created.RoomCode,
                    "player-a",
                    round.Id,
                    new GuessCoordinatesDto(40.4168, -3.7038, "Madrid"))));

        Assert.AreEqual("A sala não tem uma ronda ativa.", exception.Message);

        var log = logger.Entries.LastOrDefault(entry =>
            entry.Level == LogLevel.Warning &&
            entry.Message.Contains("SubmitGuess rejected", StringComparison.Ordinal));

        Assert.IsNotNull(log);
        StringAssert.Contains(log.Message, created.RoomCode);
        StringAssert.Contains(log.Message, "round-result");
        StringAssert.Contains(log.Message, round.Id);
        StringAssert.Contains(log.Message, "player-a");
    }

    [TestMethod]
    public async Task TimedRound_WhenTimerResolvesRound_BroadcastsResultAfterCancellingTimer()
    {
        var clientProxy = new TestClientProxy();
        var service = CreateService(hubContext: new TestHubContext(clientProxy));
        var created = await service.CreateRoomAsync(
            new CreateMultiplayerRoomRequest(
                "player-a",
                "Marcos",
                new CreateSessionRequest("europe", RoundCount: 1, Timed: true, RoundTimeSeconds: 15)),
            "connection-a");
        await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-b", "Ana"),
            "connection-b");
        var started = await service.StartGameAsync(new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));
        var round = started.RoundStarted ?? throw new AssertFailedException("A sala devia iniciar a primeira ronda.");
        var timerToken = GetRoundTimerToken(service, created.RoomCode);

        await InvokeResolveRoundByTimeoutAsync(service, created.RoomCode, round.Id, timerToken);

        CollectionAssert.Contains(clientProxy.SentMethods, "roomUpdated");
        CollectionAssert.Contains(clientProxy.SentMethods, "roundResolved");
    }

    [TestMethod]
    public async Task MarkDisconnected_WhenEveryPlayerStaysDisconnectedForGrace_ClosesRoomAndBroadcastsOpenRooms()
    {
        var clientProxy = new TestClientProxy();
        var service = CreateService(
            hubContext: new TestHubContext(clientProxy),
            disconnectGracePeriod: TimeSpan.FromMilliseconds(10));
        var created = await service.CreateRoomAsync(
            new CreateMultiplayerRoomRequest(
                "player-a",
                "Marcos",
                DefaultConfig(roundCount: 1),
                IsPublic: true),
            "connection-a");
        await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-b", "Ana"),
            "connection-b");
        await service.StartGameAsync(new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));

        await service.MarkDisconnectedAsync("connection-a");
        await service.MarkDisconnectedAsync("connection-b");

        var roomUpdated = await WaitForCallAsync(clientProxy, "roomUpdated");
        await WaitForCallAsync(clientProxy, "gameCompleted");
        await WaitForCallAsync(clientProxy, "openRoomsUpdated");
        var state = roomUpdated.Args[0] as MultiplayerRoomStateDto ??
                    throw new AssertFailedException("roomUpdated não enviou o estado da sala.");

        Assert.AreEqual("completed", state.Status);
        Assert.IsTrue(state.Players.All(player => !player.Connected));
    }

    [TestMethod]
    public async Task MarkDisconnected_WhenOnlyOnePlayerRemainsAfterGrace_CompletesRoomAndMakesRemainingPlayerOwner()
    {
        var clientProxy = new TestClientProxy();
        var service = CreateService(
            hubContext: new TestHubContext(clientProxy),
            disconnectGracePeriod: TimeSpan.FromMilliseconds(10));
        var created = await service.CreateRoomAsync(
            new CreateMultiplayerRoomRequest(
                "player-a",
                "Ana",
                DefaultConfig(roundCount: 1)),
            "connection-a");
        await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-b", "Zed"),
            "connection-b");
        await service.StartGameAsync(new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));

        await service.MarkDisconnectedAsync("connection-a");

        var completed = await WaitForCallAsync(clientProxy, "gameCompleted");
        var finalResult = completed.Args[0] as MultiplayerSessionResultDto ??
                          throw new AssertFailedException("gameCompleted não enviou o resultado final.");
        var resolved = clientProxy.SentCalls
            .Last(call => call.Method == "roundResolved")
            .Args[0] as MultiplayerRoundResultDto ??
            throw new AssertFailedException("roundResolved não enviou o resultado da ronda.");
        var state = clientProxy.SentCalls
            .Last(call => call.Method == "roomUpdated")
            .Args[0] as MultiplayerRoomStateDto ??
            throw new AssertFailedException("roomUpdated não enviou o estado da sala.");

        Assert.AreEqual("completed", state.Status);
        Assert.AreEqual("player-b", state.OwnerPlayerId);
        Assert.IsTrue(state.Players.Single(player => player.PlayerId == "player-b").IsOwner);
        Assert.AreEqual("disconnect", resolved.PlayerResults.Single(player => player.PlayerId == "player-b").Resolution);
        Assert.AreEqual("player-b", finalResult.Players[0].PlayerId);
    }

    [TestMethod]
    public async Task MarkDisconnected_WhenPublicRoomCompletesAfterGrace_RemovesRoomFromOpenRoomsUpdate()
    {
        var clientProxy = new TestClientProxy();
        var service = CreateService(
            hubContext: new TestHubContext(clientProxy),
            disconnectGracePeriod: TimeSpan.FromMilliseconds(10));
        var created = await service.CreateRoomAsync(
            new CreateMultiplayerRoomRequest(
                "player-a",
                "Ana",
                DefaultConfig(roundCount: 1),
                IsPublic: true),
            "connection-a");
        await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-b", "Bruno"),
            "connection-b");
        await service.StartGameAsync(new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));

        await service.MarkDisconnectedAsync("connection-a");
        await service.MarkDisconnectedAsync("connection-b");

        var openRoomsUpdated = await WaitForCallAsync(clientProxy, "openRoomsUpdated");
        var openRooms = openRoomsUpdated.Args[0] as IReadOnlyList<MultiplayerOpenRoomDto> ??
                        throw new AssertFailedException("openRoomsUpdated não enviou lista de salas.");

        Assert.IsFalse(openRooms.Any(room => room.RoomCode == created.RoomCode));
        Assert.IsFalse(service.ListOpenRooms().Any(room => room.RoomCode == created.RoomCode));
    }

    [TestMethod]
    public async Task MarkDisconnected_WhenOwnerRefreshesDuringGameBeforeGrace_ReconnectsWithoutAffectingRound()
    {
        var clientProxy = new TestClientProxy();
        var service = CreateService(
            hubContext: new TestHubContext(clientProxy),
            disconnectGracePeriod: TimeSpan.FromMilliseconds(80));
        var created = await service.CreateRoomAsync(
            new CreateMultiplayerRoomRequest("player-a", "Ana", DefaultConfig()),
            "connection-a");
        await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-b", "Bruno"),
            "connection-b");
        var started = await service.StartGameAsync(new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));
        var round = started.RoundStarted ?? throw new AssertFailedException("A sala devia iniciar a primeira ronda.");

        var disconnected = await service.MarkDisconnectedAsync("connection-a");

        var disconnectedState = disconnected.Single().State;
        Assert.AreEqual("playing", disconnectedState.Status);
        Assert.AreEqual("player-a", disconnectedState.OwnerPlayerId);
        Assert.IsFalse(disconnectedState.Players.Single(player => player.PlayerId == "player-a").Connected);
        Assert.IsTrue(disconnectedState.Players.Single(player => player.PlayerId == "player-b").Connected);

        var reconnected = await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-a", "Ana"),
            "connection-a-refresh");
        await Task.Delay(140);

        Assert.AreEqual("playing", reconnected.State.Status);
        Assert.AreEqual("player-a", reconnected.State.OwnerPlayerId);
        Assert.IsTrue(reconnected.State.Players.Single(player => player.PlayerId == "player-a").Connected);
        Assert.IsFalse(clientProxy.SentMethods.Contains("gameCompleted", StringComparer.Ordinal));

        await service.SubmitGuessAsync(
            new SubmitMultiplayerGuessRequest(
                created.RoomCode,
                "player-a",
                round.Id,
                new GuessCoordinatesDto(41.1496, -8.6109, "Porto")));
        var resolved = await service.SubmitGuessAsync(
            new SubmitMultiplayerGuessRequest(
                created.RoomCode,
                "player-b",
                round.Id,
                new GuessCoordinatesDto(48.8566, 2.3522, "Paris")));

        Assert.IsNotNull(resolved.RoundResolved);
        Assert.AreEqual("round-result", resolved.State.Status);
        Assert.HasCount(2, resolved.RoundResolved.PlayerResults);
    }

    [TestMethod]
    public async Task LeaveRoom_WithThreePlayersDuringActiveRound_RemainingPlayersResolveAndContinue()
    {
        var service = CreateService();
        var created = await service.CreateRoomAsync(
            new CreateMultiplayerRoomRequest("player-a", "Ana", DefaultConfig(roundCount: 2)),
            "connection-a");
        await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-b", "Bruno"),
            "connection-b");
        await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-c", "Carla"),
            "connection-c");
        var started = await service.StartGameAsync(new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));
        var round = started.RoundStarted ?? throw new AssertFailedException("A sala devia iniciar a primeira ronda.");

        var afterLeave = await service.LeaveRoomAsync(
            new MultiplayerRoomPlayerRequest(created.RoomCode, "player-c"));

        Assert.AreEqual("playing", afterLeave.State.Status);
        Assert.IsNull(afterLeave.RoundResolved);
        Assert.IsFalse(afterLeave.State.Players.Single(player => player.PlayerId == "player-c").Connected);

        await service.SubmitGuessAsync(
            new SubmitMultiplayerGuessRequest(
                created.RoomCode,
                "player-a",
                round.Id,
                new GuessCoordinatesDto(41.1496, -8.6109, "Porto")));
        var resolved = await service.SubmitGuessAsync(
            new SubmitMultiplayerGuessRequest(
                created.RoomCode,
                "player-b",
                round.Id,
                new GuessCoordinatesDto(48.8566, 2.3522, "Paris")));

        Assert.IsNotNull(resolved.RoundResolved);
        Assert.AreEqual("missing", resolved.RoundResolved.PlayerResults.Single(player => player.PlayerId == "player-c").Resolution);

        var firstReady = await service.ReadyForNextRoundAsync(
            new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));
        var secondReady = await service.ReadyForNextRoundAsync(
            new MultiplayerRoomPlayerRequest(created.RoomCode, "player-b"));

        Assert.IsNull(firstReady.RoundStarted);
        Assert.AreEqual("playing", secondReady.State.Status);
        Assert.IsNotNull(secondReady.RoundStarted);
        Assert.IsFalse(secondReady.State.Players.Single(player => player.PlayerId == "player-c").Connected);
    }

    [TestMethod]
    public async Task MarkDisconnected_WhenOwnerExpiresInThreePlayerGame_TransfersOwnerAndRemainingPlayersContinue()
    {
        var clientProxy = new TestClientProxy();
        var service = CreateService(
            hubContext: new TestHubContext(clientProxy),
            disconnectGracePeriod: TimeSpan.FromMilliseconds(10));
        var created = await service.CreateRoomAsync(
            new CreateMultiplayerRoomRequest("player-a", "Ana", DefaultConfig(roundCount: 2)),
            "connection-a");
        await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-b", "Bruno"),
            "connection-b");
        await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-c", "Carla"),
            "connection-c");
        var started = await service.StartGameAsync(new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));
        var round = started.RoundStarted ?? throw new AssertFailedException("A sala devia iniciar a primeira ronda.");

        await service.MarkDisconnectedAsync("connection-a");

        var roomUpdated = await WaitForCallAsync(clientProxy, "roomUpdated");
        var state = roomUpdated.Args[0] as MultiplayerRoomStateDto ??
                    throw new AssertFailedException("roomUpdated não enviou o estado da sala.");

        Assert.AreEqual("playing", state.Status);
        Assert.AreEqual("player-b", state.OwnerPlayerId);
        Assert.IsTrue(state.Players.Single(player => player.PlayerId == "player-b").IsOwner);
        Assert.IsFalse(state.Players.Single(player => player.PlayerId == "player-a").Connected);
        Assert.IsFalse(clientProxy.SentMethods.Contains("gameCompleted", StringComparer.Ordinal));

        await service.SubmitGuessAsync(
            new SubmitMultiplayerGuessRequest(
                created.RoomCode,
                "player-b",
                round.Id,
                new GuessCoordinatesDto(48.8566, 2.3522, "Paris")));
        var resolved = await service.SubmitGuessAsync(
            new SubmitMultiplayerGuessRequest(
                created.RoomCode,
                "player-c",
                round.Id,
                new GuessCoordinatesDto(40.4168, -3.7038, "Madrid")));

        Assert.IsNotNull(resolved.RoundResolved);
        Assert.AreEqual("missing", resolved.RoundResolved.PlayerResults.Single(player => player.PlayerId == "player-a").Resolution);

        await service.ReadyForNextRoundAsync(
            new MultiplayerRoomPlayerRequest(created.RoomCode, "player-b"));
        var nextRound = await service.ReadyForNextRoundAsync(
            new MultiplayerRoomPlayerRequest(created.RoomCode, "player-c"));

        Assert.AreEqual("playing", nextRound.State.Status);
        Assert.AreEqual("player-b", nextRound.State.OwnerPlayerId);
        Assert.IsNotNull(nextRound.RoundStarted);
    }

    [TestMethod]
    public async Task MarkDisconnected_WhenTwoPlayersIncludingOwnerExpire_RemainingPlayerWinsAndCanReturnToLobby()
    {
        var clientProxy = new TestClientProxy();
        var service = CreateService(
            hubContext: new TestHubContext(clientProxy),
            disconnectGracePeriod: TimeSpan.FromMilliseconds(10));
        var created = await service.CreateRoomAsync(
            new CreateMultiplayerRoomRequest("player-a", "Ana", DefaultConfig(roundCount: 2)),
            "connection-a");
        await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-b", "Bruno"),
            "connection-b");
        await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-c", "Carla"),
            "connection-c");
        await service.StartGameAsync(new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));

        await service.MarkDisconnectedAsync("connection-a");
        await service.MarkDisconnectedAsync("connection-b");

        var completed = await WaitForCallAsync(clientProxy, "gameCompleted");
        var finalResult = completed.Args[0] as MultiplayerSessionResultDto ??
                          throw new AssertFailedException("gameCompleted não enviou o resultado final.");
        var resolved = clientProxy.SentCalls
            .Last(call => call.Method == "roundResolved")
            .Args[0] as MultiplayerRoundResultDto ??
            throw new AssertFailedException("roundResolved não enviou o resultado da ronda.");
        var state = clientProxy.SentCalls
            .Last(call => call.Method == "roomUpdated")
            .Args[0] as MultiplayerRoomStateDto ??
            throw new AssertFailedException("roomUpdated não enviou o estado da sala.");

        Assert.AreEqual("completed", state.Status);
        Assert.AreEqual("player-c", state.OwnerPlayerId);
        Assert.IsTrue(state.Players.Single(player => player.PlayerId == "player-c").IsOwner);
        Assert.AreEqual("player-c", finalResult.Players[0].PlayerId);
        Assert.AreEqual("disconnect", resolved.PlayerResults.Single(player => player.PlayerId == "player-c").Resolution);

        var returned = await service.ReturnToLobbyAsync(
            new MultiplayerRoomPlayerRequest(created.RoomCode, "player-c"));

        Assert.AreEqual(created.RoomCode, returned.RoomCode);
        Assert.AreEqual("lobby", returned.State.Status);
        Assert.AreEqual("player-c", returned.State.OwnerPlayerId);
        Assert.HasCount(1, returned.State.Players);
        Assert.AreEqual("player-c", returned.State.Players[0].PlayerId);
    }

    [TestMethod]
    public async Task MarkDisconnected_DuringRoundResult_WhenExpiredPlayerWasNotReady_AllowsRemainingPlayersToAdvance()
    {
        var clientProxy = new TestClientProxy();
        var service = CreateService(
            hubContext: new TestHubContext(clientProxy),
            disconnectGracePeriod: TimeSpan.FromMilliseconds(10));
        var created = await service.CreateRoomAsync(
            new CreateMultiplayerRoomRequest("player-a", "Ana", DefaultConfig(roundCount: 2)),
            "connection-a");
        await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-b", "Bruno"),
            "connection-b");
        await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-c", "Carla"),
            "connection-c");
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
        await service.SubmitGuessAsync(
            new SubmitMultiplayerGuessRequest(
                created.RoomCode,
                "player-c",
                round.Id,
                new GuessCoordinatesDto(40.4168, -3.7038, "Madrid")));

        await service.ReadyForNextRoundAsync(
            new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));
        await service.MarkDisconnectedAsync("connection-c");
        var expiredUpdate = await WaitForCallAsync(clientProxy, "roomUpdated");
        var expiredState = expiredUpdate.Args[0] as MultiplayerRoomStateDto ??
                           throw new AssertFailedException("roomUpdated não enviou o estado da sala.");

        Assert.IsFalse(expiredState.Players.Single(player => player.PlayerId == "player-c").Connected);

        var advanced = await service.ReadyForNextRoundAsync(
            new MultiplayerRoomPlayerRequest(created.RoomCode, "player-b"));

        Assert.AreEqual("playing", advanced.State.Status);
        Assert.IsNotNull(advanced.RoundStarted);
        Assert.IsFalse(advanced.State.Players.Single(player => player.PlayerId == "player-c").Connected);
        Assert.IsFalse(clientProxy.SentMethods.Contains("gameCompleted", StringComparer.Ordinal));
    }

    [TestMethod]
    public async Task MarkDisconnected_WithThreePlayersAfterGrace_ResolvesBlockedRoundAndLetsRemainingPlayersContinue()
    {
        var clientProxy = new TestClientProxy();
        var service = CreateService(
            hubContext: new TestHubContext(clientProxy),
            disconnectGracePeriod: TimeSpan.FromMilliseconds(10));
        var created = await service.CreateRoomAsync(
            new CreateMultiplayerRoomRequest("player-a", "Ana", DefaultConfig(roundCount: 2)),
            "connection-a");
        await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-b", "Bruno"),
            "connection-b");
        await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-c", "Carla"),
            "connection-c");
        var started = await service.StartGameAsync(new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));
        var round = started.RoundStarted ?? throw new AssertFailedException("A sala devia iniciar a primeira ronda.");

        await service.MarkDisconnectedAsync("connection-c");
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

        var resolved = await WaitForCallAsync(clientProxy, "roundResolved");
        var roundResult = resolved.Args[0] as MultiplayerRoundResultDto ??
                          throw new AssertFailedException("roundResolved não enviou o resultado da ronda.");
        var firstReady = await service.ReadyForNextRoundAsync(
            new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));
        var secondReady = await service.ReadyForNextRoundAsync(
            new MultiplayerRoomPlayerRequest(created.RoomCode, "player-b"));

        Assert.AreEqual("missing", roundResult.PlayerResults.Single(player => player.PlayerId == "player-c").Resolution);
        Assert.IsNull(firstReady.RoundStarted);
        Assert.AreEqual("playing", secondReady.State.Status);
        Assert.IsNotNull(secondReady.RoundStarted);
        Assert.IsFalse(clientProxy.SentMethods.Contains("gameCompleted", StringComparer.Ordinal));
    }

    [TestMethod]
    public async Task SubmitGuess_AfterDisconnectedPlayerExpired_DoesNotWaitForExpiredPlayerInNextRound()
    {
        var clientProxy = new TestClientProxy();
        var service = CreateService(
            hubContext: new TestHubContext(clientProxy),
            disconnectGracePeriod: TimeSpan.FromMilliseconds(10));
        var created = await service.CreateRoomAsync(
            new CreateMultiplayerRoomRequest("player-a", "Ana", DefaultConfig(roundCount: 2)),
            "connection-a");
        await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-b", "Bruno"),
            "connection-b");
        await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-c", "Carla"),
            "connection-c");
        var started = await service.StartGameAsync(new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));
        var firstRound = started.RoundStarted ?? throw new AssertFailedException("A sala devia iniciar a primeira ronda.");

        await service.MarkDisconnectedAsync("connection-c");
        await service.SubmitGuessAsync(
            new SubmitMultiplayerGuessRequest(
                created.RoomCode,
                "player-a",
                firstRound.Id,
                new GuessCoordinatesDto(41.1496, -8.6109, "Porto")));
        await service.SubmitGuessAsync(
            new SubmitMultiplayerGuessRequest(
                created.RoomCode,
                "player-b",
                firstRound.Id,
                new GuessCoordinatesDto(48.8566, 2.3522, "Paris")));
        await WaitForCallAsync(clientProxy, "roundResolved");
        await service.ReadyForNextRoundAsync(
            new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));
        var nextRoundUpdate = await service.ReadyForNextRoundAsync(
            new MultiplayerRoomPlayerRequest(created.RoomCode, "player-b"));
        var secondRound = nextRoundUpdate.RoundStarted ??
                          throw new AssertFailedException("A segunda ronda devia iniciar.");

        var firstSubmit = await service.SubmitGuessAsync(
            new SubmitMultiplayerGuessRequest(
                created.RoomCode,
                "player-a",
                secondRound.Id,
                new GuessCoordinatesDto(41.1496, -8.6109, "Porto")));
        var secondSubmit = await service.SubmitGuessAsync(
            new SubmitMultiplayerGuessRequest(
                created.RoomCode,
                "player-b",
                secondRound.Id,
                new GuessCoordinatesDto(48.8566, 2.3522, "Paris")));

        Assert.IsNull(firstSubmit.RoundResolved);
        Assert.IsNotNull(secondSubmit.RoundResolved);
        Assert.AreEqual("missing", secondSubmit.RoundResolved.PlayerResults.Single(player => player.PlayerId == "player-c").Resolution);
    }

    [TestMethod]
    public async Task LeaveRoom_DuringActiveRound_CompletesWhenOnlyOnePlayerRemains()
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
        Assert.IsNotNull(afterLeave.GameCompleted);
        Assert.AreEqual("completed", afterLeave.State.Status);
        Assert.AreEqual("player-a", afterLeave.GameCompleted.Players[0].PlayerId);
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
    public async Task LeaveRoom_WhenOwnerLeavesCompletedRoom_AssignsNextOwnerWhoCanReturnToLobby()
    {
        var service = CreateService();
        var created = await service.CreateRoomAsync(
            new CreateMultiplayerRoomRequest("player-a", "Ana", DefaultConfig(roundCount: 1)),
            "connection-a");
        await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-b", "Bruno"),
            "connection-b");
        await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-c", "Carla"),
            "connection-c");
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
        await service.SubmitGuessAsync(
            new SubmitMultiplayerGuessRequest(
                created.RoomCode,
                "player-c",
                round.Id,
                new GuessCoordinatesDto(40.4168, -3.7038, "Madrid")));
        await service.ReadyForNextRoundAsync(
            new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));
        await service.ReadyForNextRoundAsync(
            new MultiplayerRoomPlayerRequest(created.RoomCode, "player-b"));
        await service.ReadyForNextRoundAsync(
            new MultiplayerRoomPlayerRequest(created.RoomCode, "player-c"));

        var afterLeave = await service.LeaveRoomAsync(
            new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));

        Assert.AreEqual("completed", afterLeave.State.Status);
        Assert.AreEqual("player-b", afterLeave.State.OwnerPlayerId);
        Assert.IsTrue(afterLeave.State.Players.Single(player => player.PlayerId == "player-b").IsOwner);

        var returned = await service.ReturnToLobbyAsync(
            new MultiplayerRoomPlayerRequest(created.RoomCode, "player-b"));

        Assert.AreEqual("lobby", returned.State.Status);
        Assert.AreEqual("player-b", returned.State.OwnerPlayerId);
        Assert.HasCount(2, returned.State.Players);
        Assert.IsFalse(returned.State.Players.Any(player => player.PlayerId == "player-a"));
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
    public async Task ReturnToLobby_AfterCompletedRoom_KeepsSameRoomAndResetsSessionState()
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
        await service.ReadyForNextRoundAsync(
            new MultiplayerRoomPlayerRequest(created.RoomCode, "player-b"));

        var returned = await service.ReturnToLobbyAsync(
            new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));

        Assert.AreEqual(created.RoomCode, returned.RoomCode);
        Assert.AreEqual("lobby", returned.State.Status);
        Assert.IsNull(returned.State.CurrentRound);
        Assert.IsNull(returned.State.LastRoundResult);
        Assert.IsNull(returned.State.FinalResult);
        Assert.HasCount(2, returned.State.Players);
        Assert.IsTrue(returned.State.Players.All(player => player.TotalScore == 0));

        var restarted = await service.StartGameAsync(
            new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));

        Assert.AreEqual("playing", restarted.State.Status);
        Assert.IsNotNull(restarted.RoundStarted);
    }

    [TestMethod]
    public async Task ReturnToLobby_AfterCompletedRoomWithLeavers_RemovesLeftPlayersAndPersistsPlayerCleanup()
    {
        var databaseName = $"geoexplorer-multiplayer-leaver-reset-test-{Guid.NewGuid()}";
        var options = new DbContextOptionsBuilder<GeoExplorerDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;
        var factory = new TestDbContextFactory(options);
        var service = CreateService(factory);
        var created = await service.CreateRoomAsync(
            new CreateMultiplayerRoomRequest("player-a", "Ana", DefaultConfig(roundCount: 1)),
            "connection-a");
        await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-b", "Bruno"),
            "connection-b");
        await service.JoinRoomAsync(
            new JoinMultiplayerRoomRequest(created.RoomCode, "player-c", "Carla"),
            "connection-c");
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

        var afterLeave = await service.LeaveRoomAsync(new MultiplayerRoomPlayerRequest(created.RoomCode, "player-c"));
        Assert.AreEqual("round-result", afterLeave.State.Status);
        await service.ReadyForNextRoundAsync(
            new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));
        await service.ReadyForNextRoundAsync(
            new MultiplayerRoomPlayerRequest(created.RoomCode, "player-b"));

        var returned = await service.ReturnToLobbyAsync(
            new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));

        Assert.AreEqual("lobby", returned.State.Status);
        Assert.HasCount(2, returned.State.Players);
        Assert.IsFalse(returned.State.Players.Any(player => player.PlayerId == "player-c"));

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

        Assert.AreEqual("lobby", room.Status);
        Assert.HasCount(2, players);
        Assert.IsFalse(players.Any(player => player.PlayerId == "player-c"));
        Assert.HasCount(0, rounds);
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

    [TestMethod]
    public async Task ReturnToLobby_WhenRoomIsPersisted_RemovesCompletedRoundsFromSnapshot()
    {
        var databaseName = $"geoexplorer-multiplayer-reset-test-{Guid.NewGuid()}";
        var options = new DbContextOptionsBuilder<GeoExplorerDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;
        var factory = new TestDbContextFactory(options);
        var service = CreateService(factory);

        var created = await service.CreateRoomAsync(
            new CreateMultiplayerRoomRequest("player-a", "Marcos", DefaultConfig(roundCount: 1)),
            "connection-a");
        var started = await service.StartGameAsync(new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));
        var round = started.RoundStarted ?? throw new AssertFailedException("A sala devia iniciar a primeira ronda.");
        await service.SubmitGuessAsync(
            new SubmitMultiplayerGuessRequest(
                created.RoomCode,
                "player-a",
                round.Id,
                new GuessCoordinatesDto(41.1496, -8.6109, "Porto")));
        await service.ReadyForNextRoundAsync(
            new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));

        await service.ReturnToLobbyAsync(new MultiplayerRoomPlayerRequest(created.RoomCode, "player-a"));

        await using var db = await factory.CreateDbContextAsync();
        var room = await db.MultiplayerRooms
            .AsNoTracking()
            .SingleAsync(candidate => candidate.RoomCode == created.RoomCode);
        var rounds = await db.MultiplayerRounds
            .AsNoTracking()
            .Where(candidate => candidate.RoomId == room.Id)
            .ToListAsync();

        Assert.AreEqual("lobby", room.Status);
        Assert.HasCount(0, rounds);
    }

    private static CreateSessionRequest DefaultConfig(int roundCount = 2)
    {
        return new CreateSessionRequest("europe", roundCount, Timed: false, RoundTimeSeconds: null);
    }

    private static MultiplayerRoomService CreateService(
        IDbContextFactory<GeoExplorerDbContext>? factory = null,
        ILogger<MultiplayerRoomService>? logger = null,
        IHubContext<MultiplayerHub>? hubContext = null,
        TimeSpan? disconnectGracePeriod = null)
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
            hubContext ?? new TestHubContext(),
            logger ?? NullLogger<MultiplayerRoomService>.Instance,
            store,
            randomIndex: _ => 0,
            disconnectGracePeriod: disconnectGracePeriod);
    }

    private static async Task<TestClientCall> WaitForCallAsync(
        TestClientProxy clientProxy,
        string method)
    {
        var timeoutAt = DateTimeOffset.UtcNow.AddSeconds(2);

        while (DateTimeOffset.UtcNow < timeoutAt)
        {
            var call = clientProxy.SentCalls.LastOrDefault(candidate => candidate.Method == method);
            if (call is not null)
            {
                return call;
            }

            await Task.Delay(10);
        }

        throw new AssertFailedException($"Evento SignalR {method} não foi emitido a tempo.");
    }

    private static CancellationToken GetRoundTimerToken(
        MultiplayerRoomService service,
        string roomCode)
    {
        var roomsField = typeof(MultiplayerRoomService).GetField(
            "_rooms",
            BindingFlags.Instance | BindingFlags.NonPublic) ??
            throw new AssertFailedException("Campo _rooms não encontrado.");
        var rooms = roomsField.GetValue(service) ??
                    throw new AssertFailedException("Dicionário de salas não encontrado.");
        var tryGetValue = rooms.GetType().GetMethod("TryGetValue") ??
                          throw new AssertFailedException("Método TryGetValue não encontrado.");
        var arguments = new object?[] { roomCode, null };

        if (tryGetValue.Invoke(rooms, arguments) is not true || arguments[1] is null)
        {
            throw new AssertFailedException("Sala não encontrada no serviço.");
        }

        var room = arguments[1] ??
                   throw new AssertFailedException("Sala não encontrada no serviço.");
        var cancellationProperty = room.GetType().GetProperty("RoundTimerCancellation") ??
                                   throw new AssertFailedException("Timer da ronda não encontrado.");
        var cancellation = cancellationProperty.GetValue(room) as CancellationTokenSource ??
                           throw new AssertFailedException("Timer da ronda não foi agendado.");

        return cancellation.Token;
    }

    private static async Task InvokeResolveRoundByTimeoutAsync(
        MultiplayerRoomService service,
        string roomCode,
        string roundId,
        CancellationToken cancellationToken)
    {
        var method = typeof(MultiplayerRoomService).GetMethod(
            "ResolveRoundByTimeoutAsync",
            BindingFlags.Instance | BindingFlags.NonPublic) ??
            throw new AssertFailedException("Método ResolveRoundByTimeoutAsync não encontrado.");
        var result = method.Invoke(service, [roomCode, roundId, cancellationToken]) as Task ??
                     throw new AssertFailedException("ResolveRoundByTimeoutAsync não devolveu Task.");

        await result;
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
        public TestHubContext(TestClientProxy? clientProxy = null)
        {
            Clients = new TestHubClients(clientProxy ?? new TestClientProxy());
        }

        public IHubClients Clients { get; }
        public IGroupManager Groups { get; } = new TestGroupManager();
    }

    private sealed class TestHubClients : IHubClients
    {
        private readonly IClientProxy _proxy;

        public TestHubClients(IClientProxy proxy)
        {
            _proxy = proxy;
        }

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
        private readonly object _syncRoot = new();
        private readonly List<TestClientCall> _sentCalls = [];

        public List<string> SentMethods
        {
            get
            {
                lock (_syncRoot)
                {
                    return _sentCalls
                        .Select(call => call.Method)
                        .ToList();
                }
            }
        }

        public List<TestClientCall> SentCalls
        {
            get
            {
                lock (_syncRoot)
                {
                    return _sentCalls.ToList();
                }
            }
        }

        public Task SendCoreAsync(
            string method,
            object?[] args,
            CancellationToken cancellationToken = default)
        {
            if (cancellationToken.IsCancellationRequested)
            {
                return Task.FromCanceled(cancellationToken);
            }

            lock (_syncRoot)
            {
                _sentCalls.Add(new TestClientCall(method, args));
            }

            return Task.CompletedTask;
        }
    }

    private sealed record TestClientCall(
        string Method,
        object?[] Args);

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

    private sealed class TestLogger<T> : ILogger<T>
    {
        public List<TestLogEntry> Entries { get; } = [];

        public IDisposable? BeginScope<TState>(TState state)
            where TState : notnull
        {
            return null;
        }

        public bool IsEnabled(LogLevel logLevel)
        {
            return true;
        }

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            Entries.Add(new TestLogEntry(logLevel, formatter(state, exception), exception));
        }
    }

    private sealed record TestLogEntry(
        LogLevel Level,
        string Message,
        Exception? Exception);
}
