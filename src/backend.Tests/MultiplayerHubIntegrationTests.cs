using GeoExplorer.Backend.Contracts;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.AspNetCore.TestHost;

namespace GeoExplorer.Backend.Tests;

[TestClass]
public sealed class MultiplayerHubIntegrationTests
{
    private const string OwnerId = "owner-player";
    private const string SecondPlayerId = "second-player";
    private const string ThirdPlayerId = "third-player";

    [TestMethod]
    public async Task ThreePlayerFlow_WithOwnerRefreshAndOneLeaver_CompletesAndReturnsToLobby()
    {
        using var factory = new WebApplicationFactory<Program>();
        await using var owner = await CreateStartedConnection(factory);
        await using var secondPlayer = await CreateStartedConnection(factory);
        await using var thirdPlayer = await CreateStartedConnection(factory);

        var config = new CreateSessionRequest("europe", RoundCount: 2, Timed: false, RoundTimeSeconds: null);
        var created = await owner.InvokeAsync<MultiplayerRoomStateDto>(
            "CreateRoom",
            new CreateMultiplayerRoomRequest(OwnerId, "Owner", config, IsPublic: true, Password: null));
        var roomCode = created.RoomCode;

        await secondPlayer.InvokeAsync<MultiplayerRoomStateDto>(
            "JoinRoom",
            new JoinMultiplayerRoomRequest(roomCode, SecondPlayerId, "Second", Password: null));
        var joined = await thirdPlayer.InvokeAsync<MultiplayerRoomStateDto>(
            "JoinRoom",
            new JoinMultiplayerRoomRequest(roomCode, ThirdPlayerId, "Third", Password: null));
        Assert.HasCount(3, joined.Players);

        await owner.StopAsync();

        await using var ownerRefresh = await CreateStartedConnection(factory);
        var refreshed = await ownerRefresh.InvokeAsync<MultiplayerRoomStateDto>(
            "JoinRoom",
            new JoinMultiplayerRoomRequest(roomCode, OwnerId, "Owner", Password: null));

        Assert.HasCount(3, refreshed.Players);
        Assert.HasCount(3, refreshed.Players.Select(player => player.PlayerId).Distinct());
        Assert.IsTrue(refreshed.Players.Single(player => player.PlayerId == OwnerId).Connected);
        Assert.IsFalse(refreshed.Players.Any(player => player.DisconnectGraceEndsAt is not null));

        var currentOwner = GetConnectionForPlayer(
            refreshed.OwnerPlayerId,
            ownerRefresh,
            secondPlayer,
            thirdPlayer);
        var started = await currentOwner.InvokeAsync<MultiplayerRoomStateDto>(
            "StartGame",
            new MultiplayerRoomPlayerRequest(roomCode, refreshed.OwnerPlayerId));

        Assert.AreEqual("playing", started.Status);
        Assert.IsNotNull(started.CurrentRound);
        var firstRoundId = started.CurrentRound.Id;

        await ownerRefresh.InvokeAsync<MultiplayerRoomStateDto>(
            "SubmitGuess",
            BuildGuess(roomCode, OwnerId, firstRoundId, 41.1496, -8.6109, "Porto"));
        await secondPlayer.InvokeAsync<MultiplayerRoomStateDto>(
            "SubmitGuess",
            BuildGuess(roomCode, SecondPlayerId, firstRoundId, 48.8566, 2.3522, "Paris"));
        var firstRoundResolved = await thirdPlayer.InvokeAsync<MultiplayerRoomStateDto>(
            "SubmitGuess",
            BuildGuess(roomCode, ThirdPlayerId, firstRoundId, 52.52, 13.405, "Berlin"));

        Assert.AreEqual("round-result", firstRoundResolved.Status);
        Assert.IsNotNull(firstRoundResolved.LastRoundResult);
        Assert.HasCount(3, firstRoundResolved.LastRoundResult.PlayerResults);

        await ownerRefresh.InvokeAsync<MultiplayerRoomStateDto>(
            "ReadyForNextRound",
            new MultiplayerRoomPlayerRequest(roomCode, OwnerId));
        await secondPlayer.InvokeAsync<MultiplayerRoomStateDto>(
            "ReadyForNextRound",
            new MultiplayerRoomPlayerRequest(roomCode, SecondPlayerId));
        var secondRoundStarted = await thirdPlayer.InvokeAsync<MultiplayerRoomStateDto>(
            "ReadyForNextRound",
            new MultiplayerRoomPlayerRequest(roomCode, ThirdPlayerId));

        Assert.AreEqual("playing", secondRoundStarted.Status);
        Assert.IsNotNull(secondRoundStarted.CurrentRound);
        var secondRoundId = secondRoundStarted.CurrentRound.Id;

        var afterLeave = await thirdPlayer.InvokeAsync<MultiplayerRoomStateDto>(
            "LeaveRoom",
            new MultiplayerRoomPlayerRequest(roomCode, ThirdPlayerId));
        Assert.IsFalse(afterLeave.Players.Single(player => player.PlayerId == ThirdPlayerId).Connected);

        await ownerRefresh.InvokeAsync<MultiplayerRoomStateDto>(
            "SubmitGuess",
            BuildGuess(roomCode, OwnerId, secondRoundId, 45.4642, 9.19, "Milan"));
        var finalRoundResolved = await secondPlayer.InvokeAsync<MultiplayerRoomStateDto>(
            "SubmitGuess",
            BuildGuess(roomCode, SecondPlayerId, secondRoundId, 50.1109, 8.6821, "Frankfurt"));

        Assert.AreEqual("round-result", finalRoundResolved.Status);
        Assert.IsNotNull(finalRoundResolved.LastRoundResult);
        Assert.IsTrue(finalRoundResolved.LastRoundResult.Completed);
        Assert.IsTrue(finalRoundResolved.LastRoundResult.PlayerResults.Any(result =>
            result.PlayerId == ThirdPlayerId && result.Resolution == "missing"));

        await ownerRefresh.InvokeAsync<MultiplayerRoomStateDto>(
            "ReadyForNextRound",
            new MultiplayerRoomPlayerRequest(roomCode, OwnerId));
        var completed = await secondPlayer.InvokeAsync<MultiplayerRoomStateDto>(
            "ReadyForNextRound",
            new MultiplayerRoomPlayerRequest(roomCode, SecondPlayerId));

        Assert.AreEqual("completed", completed.Status);
        Assert.IsNotNull(completed.FinalResult);
        Assert.AreEqual(2, completed.FinalResult.TotalRounds);

        var finalOwnerConnection = GetConnectionForPlayer(
            completed.OwnerPlayerId,
            ownerRefresh,
            secondPlayer,
            thirdPlayer);
        var lobby = await finalOwnerConnection.InvokeAsync<MultiplayerRoomStateDto>(
            "ReturnToLobby",
            new MultiplayerRoomPlayerRequest(roomCode, completed.OwnerPlayerId));

        Assert.AreEqual("lobby", lobby.Status);
        Assert.AreEqual(roomCode, lobby.RoomCode);
        Assert.HasCount(2, lobby.Players);
        Assert.IsFalse(lobby.Players.Any(player => player.PlayerId == ThirdPlayerId));
    }

    private static async Task<HubConnection> CreateStartedConnection(WebApplicationFactory<Program> factory)
    {
        var connection = new HubConnectionBuilder()
            .WithUrl("http://localhost/hubs/multiplayer", options =>
            {
                options.Transports = HttpTransportType.LongPolling;
                options.HttpMessageHandlerFactory = _ => factory.Server.CreateHandler();
            })
            .Build();

        await connection.StartAsync();
        return connection;
    }

    private static SubmitMultiplayerGuessRequest BuildGuess(
        string roomCode,
        string playerId,
        string roundId,
        double latitude,
        double longitude,
        string label)
    {
        return new SubmitMultiplayerGuessRequest(
            roomCode,
            playerId,
            roundId,
            new GuessCoordinatesDto(latitude, longitude, label));
    }

    private static HubConnection GetConnectionForPlayer(
        string playerId,
        HubConnection owner,
        HubConnection secondPlayer,
        HubConnection thirdPlayer)
    {
        return playerId switch
        {
            OwnerId => owner,
            SecondPlayerId => secondPlayer,
            ThirdPlayerId => thirdPlayer,
            _ => throw new InvalidOperationException($"O dono da sala {playerId} não existe no teste."),
        };
    }
}
