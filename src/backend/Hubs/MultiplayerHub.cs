using GeoExplorer.Backend.Contracts;
using GeoExplorer.Backend.Services;
using Microsoft.AspNetCore.SignalR;

namespace GeoExplorer.Backend.Hubs;

public sealed class MultiplayerHub : Hub
{
    private readonly MultiplayerRoomService _rooms;

    public MultiplayerHub(MultiplayerRoomService rooms)
    {
        _rooms = rooms;
    }

    public async Task<MultiplayerRoomStateDto> CreateRoom(CreateMultiplayerRoomRequest request)
    {
        var update = await HandleGameFlow(() => _rooms.CreateRoomAsync(request, Context.ConnectionId));
        await Groups.AddToGroupAsync(Context.ConnectionId, update.RoomCode);
        await BroadcastUpdate(update);
        return update.State;
    }

    public async Task<MultiplayerRoomStateDto> JoinRoom(JoinMultiplayerRoomRequest request)
    {
        var update = await HandleGameFlow(() => _rooms.JoinRoomAsync(request, Context.ConnectionId));
        await Groups.AddToGroupAsync(Context.ConnectionId, update.RoomCode);
        await BroadcastUpdate(update);
        return update.State;
    }

    public IReadOnlyList<MultiplayerOpenRoomDto> ListOpenRooms()
    {
        return _rooms.ListOpenRooms();
    }

    public async Task AnnounceJoining(MultiplayerRoomPlayerRequest request)
    {
        var roomCode = await HandleGameFlowValue(() => Task.FromResult(_rooms.GetJoinAnnouncementRoomCode(request)));
        await Clients.Group(roomCode).SendAsync("playerJoining");
    }

    public async Task<MultiplayerRoomStateDto> UpdateConfig(UpdateMultiplayerConfigRequest request)
    {
        var update = await HandleGameFlow(() => _rooms.UpdateConfigAsync(request));
        await BroadcastUpdate(update);
        return update.State;
    }

    public async Task<MultiplayerRoomStateDto> UpdateDisplayName(UpdateMultiplayerDisplayNameRequest request)
    {
        var update = await HandleGameFlow(() => _rooms.UpdateDisplayNameAsync(request));
        await BroadcastUpdate(update);
        return update.State;
    }

    public async Task<MultiplayerRoomStateDto> StartGame(MultiplayerRoomPlayerRequest request)
    {
        var update = await HandleGameFlow(() => _rooms.StartGameAsync(request));
        await BroadcastUpdate(update);
        return update.State;
    }

    public async Task<MultiplayerRoomStateDto> SubmitGuess(SubmitMultiplayerGuessRequest request)
    {
        var update = await HandleGameFlow(() => _rooms.SubmitGuessAsync(request));
        await BroadcastUpdate(update);
        return update.State;
    }

    public async Task<MultiplayerRoomStateDto> ReadyForNextRound(MultiplayerRoomPlayerRequest request)
    {
        var update = await HandleGameFlow(() => _rooms.ReadyForNextRoundAsync(request));
        await BroadcastUpdate(update);
        return update.State;
    }

    public async Task<MultiplayerRoomStateDto> LeaveRoom(MultiplayerRoomPlayerRequest request)
    {
        var update = await HandleGameFlow(() => _rooms.LeaveRoomAsync(request));
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, update.RoomCode);
        await BroadcastUpdate(update);
        return update.State;
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var updates = await _rooms.MarkDisconnectedAsync(Context.ConnectionId);

        foreach (var update in updates)
        {
            await BroadcastUpdate(update);
        }

        await base.OnDisconnectedAsync(exception);
    }

    private async Task<MultiplayerRoomUpdate> HandleGameFlow(Func<Task<MultiplayerRoomUpdate>> action)
    {
        try
        {
            return await action();
        }
        catch (GameFlowException exception)
        {
            await Clients.Caller.SendAsync("roomError", exception.Message);
            throw new HubException(exception.Message);
        }
    }

    private async Task<T> HandleGameFlowValue<T>(Func<Task<T>> action)
    {
        try
        {
            return await action();
        }
        catch (GameFlowException exception)
        {
            await Clients.Caller.SendAsync("roomError", exception.Message);
            throw new HubException(exception.Message);
        }
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
}
