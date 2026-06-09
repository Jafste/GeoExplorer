using GeoExplorer.Backend.Contracts;
using GeoExplorer.Backend.Services;
using Microsoft.AspNetCore.SignalR;

namespace GeoExplorer.Backend.Hubs;

public sealed class MultiplayerHub : Hub
{
    internal const string OpenRoomsGroup = "multiplayer-open-rooms";

    private readonly MultiplayerRoomService _rooms;
    private readonly ILogger<MultiplayerHub> _logger;

    public MultiplayerHub(
        MultiplayerRoomService rooms,
        ILogger<MultiplayerHub> logger)
    {
        _rooms = rooms;
        _logger = logger;
    }

    public async Task<MultiplayerRoomStateDto> CreateRoom(CreateMultiplayerRoomRequest request)
    {
        var update = await HandleGameFlow("CreateRoom", request, () => _rooms.CreateRoomAsync(request, Context.ConnectionId));
        await Groups.AddToGroupAsync(Context.ConnectionId, update.RoomCode);
        await BroadcastUpdate(update);
        await BroadcastOpenRooms();
        return update.State;
    }

    public async Task<MultiplayerRoomStateDto> JoinRoom(JoinMultiplayerRoomRequest request)
    {
        var update = await HandleGameFlow("JoinRoom", request, () => _rooms.JoinRoomAsync(request, Context.ConnectionId));
        await Groups.AddToGroupAsync(Context.ConnectionId, update.RoomCode);
        await BroadcastUpdate(update);
        await BroadcastOpenRooms();
        return update.State;
    }

    public IReadOnlyList<MultiplayerOpenRoomDto> ListOpenRooms()
    {
        return _rooms.ListOpenRooms();
    }

    public async Task<IReadOnlyList<MultiplayerOpenRoomDto>> WatchOpenRooms()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, OpenRoomsGroup);
        return _rooms.ListOpenRooms();
    }

    public async Task AnnounceJoining(MultiplayerRoomPlayerRequest request)
    {
        var roomCode = await HandleGameFlowValue(
            "AnnounceJoining",
            request,
            () => Task.FromResult(_rooms.GetJoinAnnouncementRoomCode(request)));
        await Clients.Group(roomCode).SendAsync("playerJoining");
    }

    public async Task<MultiplayerRoomStateDto> UpdateConfig(UpdateMultiplayerConfigRequest request)
    {
        var update = await HandleGameFlow("UpdateConfig", request, () => _rooms.UpdateConfigAsync(request));
        await BroadcastUpdate(update);
        await BroadcastOpenRooms();
        return update.State;
    }

    public async Task<MultiplayerRoomStateDto> UpdateDisplayName(UpdateMultiplayerDisplayNameRequest request)
    {
        var update = await HandleGameFlow("UpdateDisplayName", request, () => _rooms.UpdateDisplayNameAsync(request));
        await BroadcastUpdate(update);
        await BroadcastOpenRooms();
        return update.State;
    }

    public async Task<MultiplayerRoomStateDto> StartGame(MultiplayerRoomPlayerRequest request)
    {
        var update = await HandleGameFlow("StartGame", request, () => _rooms.StartGameAsync(request));
        await BroadcastUpdate(update);
        await BroadcastOpenRooms();
        return update.State;
    }

    public async Task<MultiplayerRoomStateDto> SubmitGuess(SubmitMultiplayerGuessRequest request)
    {
        var update = await HandleGameFlow("SubmitGuess", request, () => _rooms.SubmitGuessAsync(request));
        await BroadcastUpdate(update);
        return update.State;
    }

    public async Task<MultiplayerRoomStateDto> ReadyForNextRound(MultiplayerRoomPlayerRequest request)
    {
        var update = await HandleGameFlow("ReadyForNextRound", request, () => _rooms.ReadyForNextRoundAsync(request));
        await BroadcastUpdate(update);
        await BroadcastOpenRooms();
        return update.State;
    }

    public async Task<MultiplayerRoomStateDto> LeaveRoom(MultiplayerRoomPlayerRequest request)
    {
        var update = await HandleGameFlow("LeaveRoom", request, () => _rooms.LeaveRoomAsync(request));
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, update.RoomCode);
        await BroadcastUpdate(update);
        await BroadcastOpenRooms();
        return update.State;
    }

    public async Task<MultiplayerRoomStateDto> ReturnToLobby(MultiplayerRoomPlayerRequest request)
    {
        var update = await HandleGameFlow("ReturnToLobby", request, () => _rooms.ReturnToLobbyAsync(request));
        await BroadcastUpdate(update);
        await BroadcastOpenRooms();
        return update.State;
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var updates = await _rooms.MarkDisconnectedAsync(Context.ConnectionId);

        foreach (var update in updates)
        {
            await BroadcastUpdate(update);
        }

        if (updates.Count > 0)
        {
            await BroadcastOpenRooms();
        }

        await base.OnDisconnectedAsync(exception);
    }

    private async Task<MultiplayerRoomUpdate> HandleGameFlow(
        string hubMethod,
        object request,
        Func<Task<MultiplayerRoomUpdate>> action)
    {
        try
        {
            return await action();
        }
        catch (GameFlowException exception)
        {
            LogGameFlowException(hubMethod, request, exception);
            await Clients.Caller.SendAsync("roomError", exception.Message);
            throw new HubException(exception.Message);
        }
    }

    private async Task<T> HandleGameFlowValue<T>(
        string hubMethod,
        object request,
        Func<Task<T>> action)
    {
        try
        {
            return await action();
        }
        catch (GameFlowException exception)
        {
            LogGameFlowException(hubMethod, request, exception);
            await Clients.Caller.SendAsync("roomError", exception.Message);
            throw new HubException(exception.Message);
        }
    }

    private void LogGameFlowException(
        string hubMethod,
        object request,
        GameFlowException exception)
    {
        _logger.LogWarning(
            exception,
            "Multiplayer hub method {HubMethod} rejected request from connection {ConnectionId}. StatusCode {StatusCode}; Request {@RequestContext}",
            hubMethod,
            Context.ConnectionId,
            exception.StatusCode,
            BuildSafeRequestContext(request));
    }

    private static object BuildSafeRequestContext(object request)
    {
        return request switch
        {
            CreateMultiplayerRoomRequest value => new
            {
                value.PlayerId,
                value.IsPublic,
                value.Config.Region,
                value.Config.RoundCount,
                value.Config.Timed,
                value.Config.RoundTimeSeconds,
                HasPassword = !string.IsNullOrWhiteSpace(value.Password),
            },
            JoinMultiplayerRoomRequest value => new
            {
                value.RoomCode,
                value.PlayerId,
                HasPassword = !string.IsNullOrWhiteSpace(value.Password),
            },
            UpdateMultiplayerConfigRequest value => new
            {
                value.RoomCode,
                value.PlayerId,
                value.Config.Region,
                value.Config.RoundCount,
                value.Config.Timed,
                value.Config.RoundTimeSeconds,
            },
            UpdateMultiplayerDisplayNameRequest value => new
            {
                value.RoomCode,
                value.PlayerId,
            },
            MultiplayerRoomPlayerRequest value => new
            {
                value.RoomCode,
                value.PlayerId,
            },
            SubmitMultiplayerGuessRequest value => new
            {
                value.RoomCode,
                value.PlayerId,
                value.RoundId,
                GuessProvided = value.Guess is not null,
            },
            _ => new
            {
                RequestType = request.GetType().Name,
            },
        };
    }

    private async Task BroadcastUpdate(MultiplayerRoomUpdate update)
    {
        await Clients.Group(update.RoomCode).SendAsync("roomUpdated", update.State);

        if (update.SubmittedPlayerId is not null)
        {
            await Clients.Group(update.RoomCode).SendAsync("playerSubmitted", update.SubmittedPlayerId);
        }

        if (update.RoundStarted is not null)
        {
            await Clients.Group(update.RoomCode).SendAsync("roundStarted", update.RoundStarted);
        }

        if (update.RoundResolved is not null)
        {
            await Clients.Group(update.RoomCode).SendAsync("roundResolved", update.RoundResolved);
        }

        if (update.GameCompleted is not null)
        {
            await Clients.Group(update.RoomCode).SendAsync("gameCompleted", update.GameCompleted);
        }
    }

    private async Task BroadcastOpenRooms()
    {
        await Clients.Group(OpenRoomsGroup).SendAsync("openRoomsUpdated", _rooms.ListOpenRooms());
    }
}
