using System.Collections.Concurrent;
using System.Security.Cryptography;
using GeoExplorer.Backend.Contracts;
using GeoExplorer.Backend.Data;
using GeoExplorer.Backend.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace GeoExplorer.Backend.Services;

public sealed class MultiplayerRoomService
{
    private const string LobbyStatus = "lobby";
    private const string PlayingStatus = "playing";
    private const string RoundResultStatus = "round-result";
    private const string CompletedStatus = "completed";
    private const string ActiveRoundStatus = "active";
    private const string PendingRoundStatus = "pending";
    private const string ResolvedRoundStatus = "resolved";
    private const string DisconnectResolution = "disconnect";
    private const string RoomCodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private const int RoomCodeLength = 6;
    private const int DisconnectGraceSeconds = 60;

    private readonly ConcurrentDictionary<string, MultiplayerRoomState> _rooms = new(StringComparer.OrdinalIgnoreCase);
    private readonly RoundLocationSelector _locationSelector;
    private readonly MultiplayerPersistenceStore? _persistenceStore;
    private readonly IConfiguration _configuration;
    private readonly IHubContext<MultiplayerHub> _hubContext;
    private readonly ILogger<MultiplayerRoomService> _logger;
    private readonly Func<int, int> _randomIndex;
    private readonly TimeSpan _disconnectGracePeriod;

    public MultiplayerRoomService(
        SeedLocationCatalog catalog,
        IConfiguration configuration,
        IHubContext<MultiplayerHub> hubContext,
        ILogger<MultiplayerRoomService> logger,
        MultiplayerPersistenceStore? persistenceStore = null,
        Func<int, int>? randomIndex = null,
        TimeSpan? disconnectGracePeriod = null)
        : this(
            new RoundLocationSelector(
                catalog,
                configuration,
                Microsoft.Extensions.Logging.Abstractions.NullLogger<RoundLocationSelector>.Instance),
            configuration,
            hubContext,
            logger,
            persistenceStore,
            randomIndex,
            disconnectGracePeriod)
    {
    }

    public MultiplayerRoomService(
        RoundLocationSelector locationSelector,
        IConfiguration configuration,
        IHubContext<MultiplayerHub> hubContext,
        ILogger<MultiplayerRoomService> logger,
        MultiplayerPersistenceStore? persistenceStore = null,
        Func<int, int>? randomIndex = null,
        TimeSpan? disconnectGracePeriod = null)
    {
        _locationSelector = locationSelector;
        _configuration = configuration;
        _hubContext = hubContext;
        _logger = logger;
        _persistenceStore = persistenceStore;
        _randomIndex = randomIndex ?? Random.Shared.Next;
        _disconnectGracePeriod = disconnectGracePeriod ?? TimeSpan.FromSeconds(DisconnectGraceSeconds);
    }

    public async Task<MultiplayerRoomUpdate> CreateRoomAsync(
        CreateMultiplayerRoomRequest request,
        string connectionId,
        CancellationToken cancellationToken = default)
    {
        var config = ValidateConfig(request.Config);
        var playerId = ValidatePlayerId(request.PlayerId);
        var displayName = ValidateDisplayName(request.DisplayName);
        var passwordHash = CreatePasswordHash(request.Password);
        var roomCode = CreateRoomCode();
        var player = new MultiplayerPlayerState
        {
            Id = Guid.NewGuid(),
            PlayerId = playerId,
            DisplayName = displayName,
            Connected = true,
            ConnectionId = connectionId,
            JoinedAt = DateTimeOffset.UtcNow,
        };
        var room = new MultiplayerRoomState
        {
            Id = Guid.NewGuid(),
            RoomCode = roomCode,
            Config = config,
            OwnerPlayerId = playerId,
            IsPublic = request.IsPublic,
            PasswordHash = passwordHash,
            Status = LobbyStatus,
            CreatedAt = DateTimeOffset.UtcNow,
            Players = [player],
        };

        _rooms[roomCode] = room;
        await PersistRoomAsync(room, cancellationToken);

        return new MultiplayerRoomUpdate(roomCode, BuildRoomState(room));
    }

    public async Task<MultiplayerRoomUpdate> JoinRoomAsync(
        JoinMultiplayerRoomRequest request,
        string connectionId,
        CancellationToken cancellationToken = default)
    {
        var room = GetRoom(request.RoomCode);
        var playerId = ValidatePlayerId(request.PlayerId);
        var displayName = ValidateDisplayName(request.DisplayName);
        MultiplayerRoomStateDto state;

        lock (room.SyncRoot)
        {
            var existingPlayer = room.Players.FirstOrDefault(player => player.PlayerId == playerId);
            if (existingPlayer is not null)
            {
                EnsureNameAvailable(room, displayName, playerId);
                existingPlayer.DisplayName = displayName;
                existingPlayer.Connected = true;
                existingPlayer.HasLeft = false;
                existingPlayer.ConnectionId = connectionId;
                existingPlayer.LastSeenAt = DateTimeOffset.UtcNow;
                RefreshResultNames(room);
                CancelDisconnectGraceIfNoDisconnectedPlayers(room);
                state = BuildRoomState(room);
            }
            else
            {
                if (!string.Equals(room.Status, LobbyStatus, StringComparison.OrdinalIgnoreCase))
                {
                    throw new GameFlowException("A partida já começou.", StatusCodes.Status409Conflict);
                }

                EnsurePasswordMatches(room, request.Password);
                EnsureNameAvailable(room, displayName, playerId);
                room.Players.Add(new MultiplayerPlayerState
                {
                    Id = Guid.NewGuid(),
                    PlayerId = playerId,
                    DisplayName = displayName,
                    Connected = true,
                    ConnectionId = connectionId,
                    JoinedAt = DateTimeOffset.UtcNow,
                });
                state = BuildRoomState(room);
            }
        }

        await PersistRoomAsync(room, cancellationToken);
        return new MultiplayerRoomUpdate(room.RoomCode, state);
    }

    public IReadOnlyList<MultiplayerOpenRoomDto> ListOpenRooms()
    {
        var rooms = new List<MultiplayerOpenRoomDto>();

        foreach (var room in _rooms.Values)
        {
            lock (room.SyncRoot)
            {
                if (!room.IsPublic ||
                    !string.Equals(room.Status, LobbyStatus, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                var owner = room.Players.FirstOrDefault(player => player.PlayerId == room.OwnerPlayerId);
                rooms.Add(new MultiplayerOpenRoomDto(
                    room.RoomCode,
                    owner?.DisplayName ?? "Dono da sala",
                    room.Players.Count,
                    room.Config.RoundCount,
                    room.Config.Timed,
                    room.Config.RoundTimeSeconds,
                    !string.IsNullOrWhiteSpace(room.PasswordHash)));
            }
        }

        return rooms
            .OrderByDescending(room => room.PlayerCount)
            .ThenBy(room => room.RoomCode, StringComparer.Ordinal)
            .ToList();
    }

    public string GetJoinAnnouncementRoomCode(MultiplayerRoomPlayerRequest request)
    {
        var room = GetRoom(request.RoomCode);
        ValidatePlayerId(request.PlayerId);

        lock (room.SyncRoot)
        {
            EnsureLobby(room);
            return room.RoomCode;
        }
    }

    public async Task<MultiplayerRoomUpdate> UpdateDisplayNameAsync(
        UpdateMultiplayerDisplayNameRequest request,
        CancellationToken cancellationToken = default)
    {
        var room = GetRoom(request.RoomCode);
        var playerId = ValidatePlayerId(request.PlayerId);
        var displayName = ValidateDisplayName(request.DisplayName);
        MultiplayerRoomStateDto state;

        lock (room.SyncRoot)
        {
            var player = room.Players.FirstOrDefault(candidate => candidate.PlayerId == playerId);
            if (player is null)
            {
                throw new GameFlowException("Jogador não encontrado nesta sala.", StatusCodes.Status404NotFound);
            }

            EnsureNameAvailable(room, displayName, playerId);
            player.DisplayName = displayName;
            player.LastSeenAt = DateTimeOffset.UtcNow;
            RefreshResultNames(room);
            state = BuildRoomState(room);
        }

        await PersistRoomAsync(room, cancellationToken);
        return new MultiplayerRoomUpdate(room.RoomCode, state);
    }

    public async Task<MultiplayerRoomUpdate> UpdateConfigAsync(
        UpdateMultiplayerConfigRequest request,
        CancellationToken cancellationToken = default)
    {
        var room = GetRoom(request.RoomCode);
        var playerId = ValidatePlayerId(request.PlayerId);
        var config = ValidateConfig(request.Config);
        MultiplayerRoomStateDto state;

        lock (room.SyncRoot)
        {
            EnsureOwner(room, playerId);
            EnsureLobby(room);
            room.Config = config;
            state = BuildRoomState(room);
        }

        await PersistRoomAsync(room, cancellationToken);
        return new MultiplayerRoomUpdate(room.RoomCode, state);
    }

    public async Task<MultiplayerRoomUpdate> StartGameAsync(
        MultiplayerRoomPlayerRequest request,
        CancellationToken cancellationToken = default)
    {
        var room = GetRoom(request.RoomCode);
        var playerId = ValidatePlayerId(request.PlayerId);
        MultiplayerRoomUpdate update;

        lock (room.SyncRoot)
        {
            EnsureOwner(room, playerId);
            EnsureLobby(room);

            var selectedLocations = _locationSelector.SelectRandomLocations(
                room.Config.Region,
                room.Config.Countries ?? (room.Config.Country is null ? null : [room.Config.Country]),
                room.Config.RoundCount,
                _randomIndex);

            if (selectedLocations.Count < room.Config.RoundCount)
            {
                throw new GameFlowException("Não há locais suficientes para as rondas pedidas neste âmbito.", StatusCodes.Status400BadRequest);
            }

            room.Rounds = selectedLocations.Select((location, index) => new MultiplayerRoundState
            {
                Id = Guid.NewGuid(),
                RoundNumber = index + 1,
                Location = location,
                SelectedMedia = GameRoundRules.SelectVisualSource(location, _randomIndex, IsVisualSourceAvailable),
                Status = index == 0 ? ActiveRoundStatus : PendingRoundStatus,
            }).ToList();
            room.CurrentRoundIndex = 0;
            room.Status = PlayingStatus;
            room.StartedAt = DateTimeOffset.UtcNow;
            room.LastRoundResult = null;
            room.FinalResult = null;

            StartCurrentRound(room);
            update = BuildUpdate(room, roundStarted: GetCurrentRound(room));
        }

        await PersistRoomAsync(room, cancellationToken);
        ScheduleRoundTimeout(room);
        return update;
    }

    private bool IsVisualSourceAvailable(SeedMedia media)
    {
        return !MapillaryImageService.IsMapillaryMedia(media) ||
            MapillaryImageService.HasConfiguredAccessToken(_configuration);
    }

    public async Task<MultiplayerRoomUpdate> SubmitGuessAsync(
        SubmitMultiplayerGuessRequest request,
        CancellationToken cancellationToken = default)
    {
        var room = GetRoom(request.RoomCode);
        var playerId = ValidatePlayerId(request.PlayerId);
        MultiplayerRoomUpdate update;

        try
        {
            lock (room.SyncRoot)
            {
                var player = GetConnectedPlayer(room, playerId);
                var round = GetActiveRound(room, request.RoundId);
                var guess = GameRoundRules.ValidateGuess(request.Guess);

                if (round.Guesses.ContainsKey(playerId))
                {
                    throw new GameFlowException("Já submeteste um palpite nesta ronda.", StatusCodes.Status409Conflict);
                }

                round.Guesses[playerId] = BuildPlayerGuess(player, round, guess, "manual");

                var resolved = ShouldResolveRound(room, round)
                    ? ResolveRound(room, round, "manual")
                    : null;

                update = BuildUpdate(
                    room,
                    submittedPlayerId: playerId,
                    roundResolved: resolved);
            }
        }
        catch (GameFlowException exception)
        {
            LogSubmitGuessRejected(room, playerId, request.RoundId, exception);
            throw;
        }

        await PersistRoomAsync(room, cancellationToken);
        return update;
    }

    public async Task<MultiplayerRoomUpdate> ReadyForNextRoundAsync(
        MultiplayerRoomPlayerRequest request,
        CancellationToken cancellationToken = default)
    {
        var room = GetRoom(request.RoomCode);
        var playerId = ValidatePlayerId(request.PlayerId);
        MultiplayerRoomUpdate update;

        lock (room.SyncRoot)
        {
            GetConnectedPlayer(room, playerId);

            if (!string.Equals(room.Status, RoundResultStatus, StringComparison.OrdinalIgnoreCase))
            {
                throw new GameFlowException("A sala ainda não está pronta para avançar.", StatusCodes.Status409Conflict);
            }

            var currentRound = room.Rounds.ElementAtOrDefault(room.CurrentRoundIndex) ??
                               throw new GameFlowException("Ronda não encontrada.", StatusCodes.Status404NotFound);

            currentRound.ReadyPlayerIds.Add(playerId);

            update = AllRoundParticipantsReady(room, currentRound)
                ? AdvanceAfterRoundResult(room)
                : BuildUpdate(room);
        }

        await PersistRoomAsync(room, cancellationToken);

        if (update.RoundStarted is not null)
        {
            ScheduleRoundTimeout(room);
        }

        return update;
    }

    public async Task<MultiplayerRoomUpdate> ReturnToLobbyAsync(
        MultiplayerRoomPlayerRequest request,
        CancellationToken cancellationToken = default)
    {
        var room = GetRoom(request.RoomCode);
        var playerId = ValidatePlayerId(request.PlayerId);
        MultiplayerRoomUpdate update;

        lock (room.SyncRoot)
        {
            EnsureOwner(room, playerId);

            if (!string.Equals(room.Status, CompletedStatus, StringComparison.OrdinalIgnoreCase))
            {
                throw new GameFlowException("A sala só pode voltar à lobby depois da partida terminar.", StatusCodes.Status409Conflict);
            }

            room.RoundTimerCancellation?.Cancel();
            room.RoundTimerCancellation?.Dispose();
            room.RoundTimerCancellation = null;
            room.DisconnectGraceCancellation?.Cancel();
            room.DisconnectGraceCancellation?.Dispose();
            room.DisconnectGraceCancellation = null;
            room.Status = LobbyStatus;
            room.StartedAt = null;
            room.CompletedAt = null;
            room.CurrentRoundIndex = 0;
            room.Rounds = [];
            room.LastRoundResult = null;
            room.FinalResult = null;
            room.Players.RemoveAll(player => player.HasLeft);

            foreach (var player in room.Players)
            {
                player.TotalScore = 0;
            }

            if (room.Players.Count == 0)
            {
                room.Status = CompletedStatus;
                room.CompletedAt = DateTimeOffset.UtcNow;
            }
            else if (room.Players.All(player => player.PlayerId != room.OwnerPlayerId))
            {
                AssignNextOwner(room);
            }

            update = BuildUpdate(room);
        }

        await PersistRoomAsync(room, cancellationToken);
        return update;
    }

    public async Task<MultiplayerRoomUpdate> LeaveRoomAsync(
        MultiplayerRoomPlayerRequest request,
        CancellationToken cancellationToken = default)
    {
        var room = GetRoom(request.RoomCode);
        var playerId = ValidatePlayerId(request.PlayerId);
        MultiplayerRoomUpdate update;

        lock (room.SyncRoot)
        {
            var player = room.Players.FirstOrDefault(candidate => candidate.PlayerId == playerId);
            if (player is null)
            {
                throw new GameFlowException("Jogador não encontrado nesta sala.", StatusCodes.Status404NotFound);
            }

            if (string.Equals(room.Status, LobbyStatus, StringComparison.OrdinalIgnoreCase))
            {
                room.Players.Remove(player);

                if (room.Players.Count == 0)
                {
                    room.Status = CompletedStatus;
                    room.CompletedAt = DateTimeOffset.UtcNow;
                }
                else if (room.OwnerPlayerId == playerId)
                {
                    AssignNextOwner(room);
                }

                update = BuildUpdate(room);
            }
            else
            {
                player.Connected = false;
                player.HasLeft = true;
                player.ConnectionId = null;
                player.LastSeenAt = DateTimeOffset.UtcNow;

                if (room.OwnerPlayerId == playerId)
                {
                    AssignNextOwner(room);
                }

                update = BuildUpdateAfterConnectedPlayersChanged(room);
            }
        }

        await PersistRoomAsync(room, cancellationToken);

        if (update.RoundStarted is not null)
        {
            ScheduleRoundTimeout(room);
        }

        return update;
    }

    public async Task<IReadOnlyList<MultiplayerRoomUpdate>> MarkDisconnectedAsync(
        string connectionId,
        CancellationToken cancellationToken = default)
    {
        var updates = new List<(MultiplayerRoomState Room, MultiplayerRoomUpdate Update)>();
        var roomsNeedingGrace = new List<MultiplayerRoomState>();

        foreach (var room in _rooms.Values)
        {
            lock (room.SyncRoot)
            {
                var player = room.Players.FirstOrDefault(candidate => candidate.ConnectionId == connectionId);
                if (player is null)
                {
                    continue;
                }

                player.Connected = false;
                player.ConnectionId = null;
                player.LastSeenAt = DateTimeOffset.UtcNow;

                if (string.Equals(room.Status, LobbyStatus, StringComparison.OrdinalIgnoreCase) &&
                    room.OwnerPlayerId == player.PlayerId)
                {
                    var nextOwner = room.Players
                        .Where(candidate => candidate.Connected)
                        .OrderBy(candidate => candidate.JoinedAt)
                        .FirstOrDefault();

                    if (nextOwner is not null)
                    {
                        room.OwnerPlayerId = nextOwner.PlayerId;
                    }
                }

                MultiplayerRoundResultDto? resolved = null;
                if (string.Equals(room.Status, PlayingStatus, StringComparison.OrdinalIgnoreCase))
                {
                    var round = room.Rounds.ElementAtOrDefault(room.CurrentRoundIndex);
                    if (round is not null && ShouldResolveRound(room, round))
                    {
                        resolved = ResolveRound(room, round, "manual");
                    }
                }

                updates.Add((room, BuildUpdate(room, roundResolved: resolved)));

                if (ShouldScheduleDisconnectGrace(room))
                {
                    roomsNeedingGrace.Add(room);
                }
            }
        }

        foreach (var (room, _) in updates)
        {
            await PersistRoomAsync(room, cancellationToken);
        }

        foreach (var room in roomsNeedingGrace.Distinct())
        {
            ScheduleDisconnectGrace(room);
        }

        return updates.Select(update => update.Update).ToList();
    }

    private MultiplayerRoomUpdate BuildUpdateAfterConnectedPlayersChanged(MultiplayerRoomState room)
    {
        if (IsInGameStatus(room) || string.Equals(room.Status, RoundResultStatus, StringComparison.OrdinalIgnoreCase))
        {
            var activePlayers = room.Players
                .Where(IsRoundParticipant)
                .ToList();

            if (activePlayers.Count == 0)
            {
                return CompleteRoom(room);
            }

            if (activePlayers.Count == 1 && activePlayers[0].Connected)
            {
                return CompleteRoom(room, activePlayers[0].PlayerId, resolveActiveRound: true);
            }
        }

        if (string.Equals(room.Status, PlayingStatus, StringComparison.OrdinalIgnoreCase))
        {
            var round = room.Rounds.ElementAtOrDefault(room.CurrentRoundIndex);
            if (round is not null && ShouldResolveRound(room, round))
            {
                return BuildUpdate(room, roundResolved: ResolveRound(room, round, "manual"));
            }
        }

        if (string.Equals(room.Status, RoundResultStatus, StringComparison.OrdinalIgnoreCase))
        {
            var round = room.Rounds.ElementAtOrDefault(room.CurrentRoundIndex);
            if (round is not null && AllRoundParticipantsReady(room, round))
            {
                return AdvanceAfterRoundResult(room);
            }
        }

        return BuildUpdate(room);
    }

    private MultiplayerRoomUpdate BuildLobbyUpdateAfterExpiredDisconnects(MultiplayerRoomState room)
    {
        room.Players.RemoveAll(player => player.HasLeft);

        if (room.Players.Count == 0)
        {
            room.Status = CompletedStatus;
            room.CompletedAt = DateTimeOffset.UtcNow;
            return BuildUpdate(room);
        }

        if (room.Players.All(player => player.PlayerId != room.OwnerPlayerId))
        {
            AssignNextOwner(room);
        }

        return BuildUpdate(room);
    }

    private MultiplayerRoomUpdate AdvanceAfterRoundResult(MultiplayerRoomState room)
    {
        if (room.CurrentRoundIndex >= room.Rounds.Count - 1)
        {
            room.Status = CompletedStatus;
            room.CompletedAt = DateTimeOffset.UtcNow;
            room.FinalResult = BuildFinalResult(room);
            CancelDisconnectGrace(room);
            return BuildUpdate(room, gameCompleted: room.FinalResult);
        }

        room.CurrentRoundIndex += 1;
        room.Status = PlayingStatus;
        room.LastRoundResult = null;
        StartCurrentRound(room);
        return BuildUpdate(room, roundStarted: GetCurrentRound(room));
    }

    private static void AssignNextOwner(MultiplayerRoomState room)
    {
        var nextOwner = room.Players
            .Where(candidate => !candidate.HasLeft && candidate.Connected)
            .OrderBy(candidate => candidate.JoinedAt)
            .FirstOrDefault() ??
            room.Players
                .Where(candidate => !candidate.HasLeft)
                .OrderBy(candidate => candidate.JoinedAt)
                .FirstOrDefault() ??
            room.Players
                .Where(candidate => candidate.Connected)
                .OrderBy(candidate => candidate.JoinedAt)
                .FirstOrDefault() ??
            room.Players
                .OrderBy(candidate => candidate.JoinedAt)
                .FirstOrDefault();

        if (nextOwner is not null)
        {
            room.OwnerPlayerId = nextOwner.PlayerId;
        }
    }

    private void StartCurrentRound(MultiplayerRoomState room)
    {
        var currentRound = room.Rounds[room.CurrentRoundIndex];
        currentRound.Status = ActiveRoundStatus;
        currentRound.StartedAt = DateTimeOffset.UtcNow;
        currentRound.EndsAt = room.Config.Timed && room.Config.RoundTimeSeconds is not null
            ? currentRound.StartedAt.Value.AddSeconds(room.Config.RoundTimeSeconds.Value)
            : null;
        currentRound.Guesses.Clear();
        currentRound.ReadyPlayerIds.Clear();
        currentRound.Result = null;
        currentRound.ResolutionReason = null;
        currentRound.ResolvedAt = null;
    }

    private void ScheduleRoundTimeout(MultiplayerRoomState room)
    {
        if (!room.Config.Timed || room.Config.RoundTimeSeconds is null)
        {
            return;
        }

        CancellationTokenSource cancellation;
        string roomCode;
        string roundId;
        int delaySeconds;

        lock (room.SyncRoot)
        {
            var currentRound = room.Rounds.ElementAtOrDefault(room.CurrentRoundIndex);
            if (currentRound is null || !string.Equals(currentRound.Status, ActiveRoundStatus, StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            room.RoundTimerCancellation?.Cancel();
            room.RoundTimerCancellation?.Dispose();
            room.RoundTimerCancellation = new CancellationTokenSource();
            cancellation = room.RoundTimerCancellation;
            roomCode = room.RoomCode;
            roundId = currentRound.Id.ToString();
            delaySeconds = room.Config.RoundTimeSeconds.Value;
        }

        _ = Task.Run(async () =>
        {
            try
            {
                await Task.Delay(TimeSpan.FromSeconds(delaySeconds), cancellation.Token);
                await ResolveRoundByTimeoutAsync(roomCode, roundId, cancellation.Token);
            }
            catch (OperationCanceledException)
            {
            }
            catch (Exception exception)
            {
                _logger.LogWarning(exception, "Could not resolve multiplayer room {RoomCode} by timeout.", roomCode);
            }
        });
    }

    private void ScheduleDisconnectGrace(MultiplayerRoomState room)
    {
        CancellationTokenSource cancellation;
        string roomCode;

        lock (room.SyncRoot)
        {
            if (!ShouldScheduleDisconnectGrace(room))
            {
                CancelDisconnectGrace(room);
                return;
            }

            CancelDisconnectGrace(room);
            room.DisconnectGraceCancellation = new CancellationTokenSource();
            cancellation = room.DisconnectGraceCancellation;
            roomCode = room.RoomCode;
        }

        _ = Task.Run(async () =>
        {
            try
            {
                await Task.Delay(_disconnectGracePeriod, cancellation.Token);
                await ResolveExpiredDisconnectsAsync(roomCode, cancellation.Token);
            }
            catch (OperationCanceledException)
            {
            }
            catch (Exception exception)
            {
                _logger.LogWarning(exception, "Could not resolve multiplayer disconnects for room {RoomCode}.", roomCode);
            }
        });
    }

    private async Task<MultiplayerRoomUpdate?> ResolveExpiredDisconnectsAsync(
        string roomCode,
        CancellationToken cancellationToken)
    {
        return await ResolveExpiredDisconnectsAsync(roomCode, DateTimeOffset.UtcNow, cancellationToken);
    }

    private async Task<MultiplayerRoomUpdate?> ResolveExpiredDisconnectsAsync(
        string roomCode,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        if (!_rooms.TryGetValue(roomCode, out var room))
        {
            return null;
        }

        MultiplayerRoomUpdate? update = null;
        var shouldScheduleAgain = false;

        lock (room.SyncRoot)
        {
            if (cancellationToken.IsCancellationRequested ||
                string.Equals(room.Status, CompletedStatus, StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            var expiredPlayers = room.Players
                .Where(player => !player.HasLeft &&
                                 !player.Connected &&
                                 IsDisconnectExpired(player, now))
                .ToList();

            if (expiredPlayers.Count == 0)
            {
                shouldScheduleAgain = ShouldScheduleDisconnectGrace(room);
            }
            else
            {
                foreach (var player in expiredPlayers)
                {
                    player.HasLeft = true;
                    player.ConnectionId = null;
                    player.LastSeenAt = now;
                }

                if (room.Players.All(player => player.PlayerId != room.OwnerPlayerId || player.HasLeft))
                {
                    AssignNextOwner(room);
                }

                update = string.Equals(room.Status, LobbyStatus, StringComparison.OrdinalIgnoreCase)
                    ? BuildLobbyUpdateAfterExpiredDisconnects(room)
                    : BuildUpdateAfterConnectedPlayersChanged(room);
                shouldScheduleAgain = ShouldScheduleDisconnectGrace(room);
            }
        }

        if (update is null)
        {
            if (shouldScheduleAgain)
            {
                ScheduleDisconnectGrace(room);
            }

            return null;
        }

        await PersistRoomAsync(room, CancellationToken.None);
        await BroadcastUpdateAsync(update, CancellationToken.None);
        await BroadcastOpenRoomsAsync(CancellationToken.None);

        if (update.RoundStarted is not null)
        {
            ScheduleRoundTimeout(room);
        }

        if (shouldScheduleAgain)
        {
            ScheduleDisconnectGrace(room);
        }
        else
        {
            lock (room.SyncRoot)
            {
                CancelDisconnectGrace(room);
            }
        }

        return update;
    }

    private async Task ResolveRoundByTimeoutAsync(
        string roomCode,
        string roundId,
        CancellationToken cancellationToken)
    {
        if (!_rooms.TryGetValue(roomCode, out var room))
        {
            return;
        }

        MultiplayerRoomUpdate? update = null;

        lock (room.SyncRoot)
        {
            if (!string.Equals(room.Status, PlayingStatus, StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            var currentRound = room.Rounds.ElementAtOrDefault(room.CurrentRoundIndex);
            if (currentRound is null || currentRound.Id.ToString() != roundId)
            {
                return;
            }

            var resolved = ResolveRound(room, currentRound, "timeout");
            update = BuildUpdate(room, roundResolved: resolved);
        }

        await PersistRoomAsync(room, CancellationToken.None);
        await BroadcastUpdateAsync(update, CancellationToken.None);
    }

    private MultiplayerRoomUpdate CompleteRoom(
        MultiplayerRoomState room,
        string? winningPlayerId = null,
        bool resolveActiveRound = false)
    {
        MultiplayerRoundResultDto? resolved = null;

        if (resolveActiveRound && string.Equals(room.Status, PlayingStatus, StringComparison.OrdinalIgnoreCase))
        {
            var currentRound = room.Rounds.ElementAtOrDefault(room.CurrentRoundIndex);
            if (currentRound is not null &&
                string.Equals(currentRound.Status, ActiveRoundStatus, StringComparison.OrdinalIgnoreCase))
            {
                resolved = ResolveRound(room, currentRound, DisconnectResolution);
            }
        }

        room.RoundTimerCancellation?.Cancel();
        room.RoundTimerCancellation?.Dispose();
        room.RoundTimerCancellation = null;
        CancelDisconnectGrace(room);
        room.Status = CompletedStatus;
        room.CompletedAt = DateTimeOffset.UtcNow;
        room.FinalResult = BuildFinalResult(room, winningPlayerId);

        return BuildUpdate(room, roundResolved: resolved, gameCompleted: room.FinalResult);
    }

    private MultiplayerRoundResultDto ResolveRound(
        MultiplayerRoomState room,
        MultiplayerRoundState round,
        string resolution)
    {
        foreach (var player in room.Players.Where(IsRoundParticipant))
        {
            if (!round.Guesses.ContainsKey(player.PlayerId))
            {
                round.Guesses[player.PlayerId] = BuildPlayerGuess(player, round, guess: null, resolution);
            }
        }

        foreach (var guess in round.Guesses.Values)
        {
            var player = room.Players.FirstOrDefault(candidate => candidate.PlayerId == guess.PlayerId);
            if (player is not null && !guess.CountedForTotal)
            {
                player.TotalScore += guess.Score;
                guess.CountedForTotal = true;
            }
        }

        room.RoundTimerCancellation?.Cancel();
        room.RoundTimerCancellation?.Dispose();
        room.RoundTimerCancellation = null;
        round.Status = ResolvedRoundStatus;
        round.ResolutionReason = resolution;
        round.ResolvedAt = DateTimeOffset.UtcNow;
        room.Status = RoundResultStatus;

        var result = BuildRoundResult(room, round);
        round.Result = result;
        room.LastRoundResult = result;

        return result;
    }

    private static MultiplayerPlayerGuessState BuildPlayerGuess(
        MultiplayerPlayerState player,
        MultiplayerRoundState round,
        GuessCoordinatesDto? guess,
        string resolution)
    {
        var result = GameRoundRules.BuildRoundResult(
            round.Id.ToString(),
            round.RoundNumber,
            round.Location,
            round.SelectedMedia,
            guess,
            resolution,
            timed: true);

        return new MultiplayerPlayerGuessState
        {
            Id = Guid.NewGuid(),
            PlayerId = player.PlayerId,
            DisplayName = player.DisplayName,
            Guess = result.Guess,
            DistanceKm = result.DistanceKm,
            Score = result.Score,
            Resolution = resolution,
            SubmittedAt = DateTimeOffset.UtcNow,
        };
    }

    private MultiplayerRoundResultDto BuildRoundResult(
        MultiplayerRoomState room,
        MultiplayerRoundState round)
    {
        return new MultiplayerRoundResultDto(
            room.RoomCode,
            round.Id.ToString(),
            round.RoundNumber,
            room.Rounds.Count,
            round.Location.Title,
            round.Location.City,
            round.Location.Country,
            round.Location.Latitude,
            round.Location.Longitude,
            GameRoundRules.BuildMedia(GameRoundRules.GetRoundMedia(
                round.Location,
                round.SelectedMedia,
                IsVisualSourceAvailable)),
            GameRoundRules.BuildVisualSources(round.Location),
            round.Location.Clues
                .Select(clue => new ChallengeClueDto(clue.Label, clue.Value, clue.Confidence))
                .ToList(),
            room.Players
                .Select(player => round.Guesses.TryGetValue(player.PlayerId, out var guess)
                    ? new MultiplayerPlayerRoundResultDto(
                        player.PlayerId,
                        player.DisplayName,
                        guess.Guess,
                        guess.Score,
                        guess.DistanceKm,
                        guess.Resolution)
                    : new MultiplayerPlayerRoundResultDto(
                        player.PlayerId,
                        player.DisplayName,
                        null,
                        0,
                        null,
                        "missing"))
                .OrderByDescending(result => result.Score)
                .ThenBy(result => result.DisplayName, StringComparer.CurrentCultureIgnoreCase)
                .ToList(),
            room.CurrentRoundIndex >= room.Rounds.Count - 1,
            room.CurrentRoundIndex >= room.Rounds.Count - 1
                ? null
                : room.Rounds[room.CurrentRoundIndex + 1].RoundNumber);
    }

    private static MultiplayerSessionResultDto BuildFinalResult(
        MultiplayerRoomState room,
        string? winningPlayerId = null)
    {
        return new MultiplayerSessionResultDto(
            room.RoomCode,
            room.Rounds.Count,
            room.Players
                .Select(player => new MultiplayerSessionPlayerResultDto(
                    player.PlayerId,
                    player.DisplayName,
                    player.TotalScore))
                .OrderByDescending(player => winningPlayerId is not null &&
                                             string.Equals(player.PlayerId, winningPlayerId, StringComparison.Ordinal))
                .ThenByDescending(player => player.TotalScore)
                .ThenBy(player => player.DisplayName, StringComparer.CurrentCultureIgnoreCase)
                .ToList(),
            room.Rounds
                .Where(round => round.Result is not null)
                .Select(round => round.Result!)
                .ToList());
    }

    private void RefreshResultNames(MultiplayerRoomState room)
    {
        foreach (var round in room.Rounds.Where(round => round.Result is not null))
        {
            round.Result = BuildRoundResult(room, round);
        }

        room.LastRoundResult = room.Rounds
            .ElementAtOrDefault(room.CurrentRoundIndex)?
            .Result;

        if (room.FinalResult is not null)
        {
            room.FinalResult = BuildFinalResult(room);
        }
    }

    private static bool ShouldResolveRound(MultiplayerRoomState room, MultiplayerRoundState round)
    {
        var roundPlayers = room.Players
            .Where(IsRoundParticipant)
            .Select(player => player.PlayerId)
            .ToList();

        return roundPlayers.Count > 0 &&
               roundPlayers.All(round.Guesses.ContainsKey);
    }

    private static bool IsRoundParticipant(MultiplayerPlayerState player)
    {
        return !player.HasLeft;
    }

    private void LogSubmitGuessRejected(
        MultiplayerRoomState room,
        string playerId,
        string requestedRoundId,
        GameFlowException exception)
    {
        lock (room.SyncRoot)
        {
            var currentRound = room.Rounds.ElementAtOrDefault(room.CurrentRoundIndex);
            var players = room.Players
                .OrderBy(player => player.JoinedAt)
                .Select(player => new
                {
                    player.PlayerId,
                    player.Connected,
                    player.HasLeft,
                    Submitted = currentRound?.Guesses.ContainsKey(player.PlayerId) ?? false,
                    Ready = currentRound?.ReadyPlayerIds.Contains(player.PlayerId) ?? false,
                })
                .ToList();

            _logger.LogWarning(
                exception,
                "SubmitGuess rejected for room {RoomCode}. PlayerId {PlayerId}; RequestedRoundId {RequestedRoundId}; RoomStatus {RoomStatus}; CurrentRoundIndex {CurrentRoundIndex}; CurrentRoundId {CurrentRoundId}; CurrentRoundStatus {CurrentRoundStatus}; StatusCode {StatusCode}; Players {@Players}",
                room.RoomCode,
                playerId,
                requestedRoundId,
                room.Status,
                room.CurrentRoundIndex,
                currentRound?.Id.ToString(),
                currentRound?.Status,
                exception.StatusCode,
                players);
        }
    }

    private static bool AllRoundParticipantsReady(MultiplayerRoomState room, MultiplayerRoundState round)
    {
        var roundPlayers = room.Players
            .Where(IsRoundParticipant)
            .Select(player => player.PlayerId)
            .ToList();

        return roundPlayers.Count > 0 &&
               roundPlayers.All(round.ReadyPlayerIds.Contains);
    }

    private MultiplayerRoomUpdate BuildUpdate(
        MultiplayerRoomState room,
        string? submittedPlayerId = null,
        ChallengeRoundDto? roundStarted = null,
        MultiplayerRoundResultDto? roundResolved = null,
        MultiplayerSessionResultDto? gameCompleted = null)
    {
        return new MultiplayerRoomUpdate(
            room.RoomCode,
            BuildRoomState(room),
            roundStarted,
            roundResolved,
            gameCompleted,
            submittedPlayerId);
    }

    private MultiplayerRoomStateDto BuildRoomState(MultiplayerRoomState room)
    {
        var currentRound = string.Equals(room.Status, PlayingStatus, StringComparison.OrdinalIgnoreCase)
            ? GetCurrentRound(room)
            : null;
        var currentRoundState = room.Rounds.ElementAtOrDefault(room.CurrentRoundIndex);

        return new MultiplayerRoomStateDto(
            room.RoomCode,
            room.Status,
            room.OwnerPlayerId,
            room.IsPublic,
            !string.IsNullOrWhiteSpace(room.PasswordHash),
            room.Config,
            room.Players
                .OrderBy(player => player.JoinedAt)
                .Select(player =>
                {
                    var disconnectGraceEndsAt = player is { Connected: false, HasLeft: false }
                        ? (player.LastSeenAt ?? player.JoinedAt).Add(_disconnectGracePeriod)
                        : (DateTimeOffset?)null;

                    return new MultiplayerPlayerDto(
                        player.PlayerId,
                        player.DisplayName,
                        room.OwnerPlayerId == player.PlayerId,
                        player.Connected,
                        disconnectGraceEndsAt,
                        currentRoundState?.Guesses.ContainsKey(player.PlayerId) ?? false,
                        currentRoundState?.ReadyPlayerIds.Contains(player.PlayerId) ?? false,
                        player.TotalScore);
                })
                .ToList(),
            currentRound,
            room.LastRoundResult,
            room.FinalResult);
    }

    private ChallengeRoundDto? GetCurrentRound(MultiplayerRoomState room)
    {
        var round = room.Rounds.ElementAtOrDefault(room.CurrentRoundIndex);

        return round is null
            ? null
            : GameRoundRules.BuildChallengeRound(
                round.Id.ToString(),
                round.RoundNumber,
                room.Rounds.Count,
                room.Config.Timed,
                room.Config.RoundTimeSeconds,
                round.Location,
                round.SelectedMedia,
                round.EndsAt,
                IsVisualSourceAvailable);
    }

    private MultiplayerRoomState GetRoom(string roomCode)
    {
        var normalizedRoomCode = NormalizeRoomCode(roomCode);

        return _rooms.TryGetValue(normalizedRoomCode, out var room)
            ? room
            : throw new GameFlowException("Sala não encontrada.", StatusCodes.Status404NotFound);
    }

    private static MultiplayerPlayerState GetConnectedPlayer(MultiplayerRoomState room, string playerId)
    {
        var player = room.Players.FirstOrDefault(candidate => candidate.PlayerId == playerId);

        if (player is null)
        {
            throw new GameFlowException("Jogador não encontrado nesta sala.", StatusCodes.Status404NotFound);
        }

        if (!player.Connected)
        {
            throw new GameFlowException("Jogador sem ligação ativa à sala.", StatusCodes.Status409Conflict);
        }

        return player;
    }

    private static MultiplayerRoundState GetActiveRound(MultiplayerRoomState room, string roundId)
    {
        if (!string.Equals(room.Status, PlayingStatus, StringComparison.OrdinalIgnoreCase))
        {
            throw new GameFlowException("A sala não tem uma ronda ativa.", StatusCodes.Status409Conflict);
        }

        var round = room.Rounds.ElementAtOrDefault(room.CurrentRoundIndex);

        if (round is null || round.Id.ToString() != roundId)
        {
            throw new GameFlowException("Ronda não encontrada.", StatusCodes.Status404NotFound);
        }

        if (!string.Equals(round.Status, ActiveRoundStatus, StringComparison.OrdinalIgnoreCase))
        {
            throw new GameFlowException("A ronda já foi resolvida.", StatusCodes.Status409Conflict);
        }

        return round;
    }

    private CreateSessionRequest ValidateConfig(CreateSessionRequest config)
    {
        if (!string.Equals(config.Region, "europe", StringComparison.OrdinalIgnoreCase))
        {
            throw new GameFlowException("Apenas a região europeia está disponível neste MVP.", StatusCodes.Status400BadRequest);
        }

        if (config.RoundCount is < 1 or > 10)
        {
            throw new GameFlowException("O número de rondas deve estar entre 1 e 10.", StatusCodes.Status400BadRequest);
        }

        var timed = config.Timed;
        var roundTimeSeconds = GameRoundRules.ValidateRoundTime(timed, config.RoundTimeSeconds);
        var countries = _locationSelector.NormalizeCountries(config.Region, config.Country, config.Countries);

        return new CreateSessionRequest(
            "europe",
            config.RoundCount,
            timed,
            roundTimeSeconds,
            countries is { Count: 1 } ? countries[0] : null,
            countries);
    }

    private static string ValidatePlayerId(string playerId)
    {
        var normalized = playerId.Trim();

        if (string.IsNullOrWhiteSpace(normalized) || normalized.Length > 80 || normalized.Any(char.IsControl))
        {
            throw new GameFlowException("Identificador de jogador inválido.", StatusCodes.Status400BadRequest);
        }

        return normalized;
    }

    private static string ValidateDisplayName(string displayName)
    {
        var normalized = displayName.Trim();

        if (normalized.Length is < 2 or > 24)
        {
            throw new GameFlowException("O nome deve ter entre 2 e 24 caracteres.", StatusCodes.Status400BadRequest);
        }

        if (normalized.Any(char.IsControl))
        {
            throw new GameFlowException("O nome tem caracteres inválidos.", StatusCodes.Status400BadRequest);
        }

        return normalized;
    }

    private static string? CreatePasswordHash(string? password)
    {
        var normalized = ValidatePassword(password);
        return normalized is null ? null : MultiplayerPasswordHasher.Hash(normalized);
    }

    private static string? ValidatePassword(string? password)
    {
        var normalized = password?.Trim();

        if (string.IsNullOrWhiteSpace(normalized))
        {
            return null;
        }

        if (normalized.Length is < 4 or > 48)
        {
            throw new GameFlowException("A password da sala deve ter entre 4 e 48 caracteres.", StatusCodes.Status400BadRequest);
        }

        return normalized;
    }

    private static void EnsurePasswordMatches(MultiplayerRoomState room, string? password)
    {
        if (string.IsNullOrWhiteSpace(room.PasswordHash))
        {
            return;
        }

        var normalized = ValidatePassword(password);

        if (normalized is null || !MultiplayerPasswordHasher.Verify(normalized, room.PasswordHash))
        {
            throw new GameFlowException("Password da sala inválida.", StatusCodes.Status403Forbidden);
        }
    }

    private static void EnsureNameAvailable(MultiplayerRoomState room, string displayName, string playerId)
    {
        var duplicate = room.Players.Any(player =>
            player.PlayerId != playerId &&
            string.Equals(player.DisplayName, displayName, StringComparison.CurrentCultureIgnoreCase));

        if (duplicate)
        {
            throw new GameFlowException("Esse nome já está a ser usado nesta sala.", StatusCodes.Status409Conflict);
        }
    }

    private static void EnsureOwner(MultiplayerRoomState room, string playerId)
    {
        if (!string.Equals(room.OwnerPlayerId, playerId, StringComparison.Ordinal))
        {
            throw new GameFlowException("Só o dono da sala pode fazer esta ação.", StatusCodes.Status403Forbidden);
        }
    }

    private static void EnsureLobby(MultiplayerRoomState room)
    {
        if (!string.Equals(room.Status, LobbyStatus, StringComparison.OrdinalIgnoreCase))
        {
            throw new GameFlowException("A configuração só pode ser alterada antes da partida começar.", StatusCodes.Status409Conflict);
        }
    }

    private string CreateRoomCode()
    {
        for (var attempt = 0; attempt < 20; attempt++)
        {
            var code = new string(Enumerable
                .Range(0, RoomCodeLength)
                .Select(_ => RoomCodeAlphabet[Math.Clamp(_randomIndex(RoomCodeAlphabet.Length), 0, RoomCodeAlphabet.Length - 1)])
                .ToArray());

            if (!_rooms.ContainsKey(code))
            {
                return code;
            }
        }

        return Guid.NewGuid().ToString("N")[..RoomCodeLength].ToUpperInvariant();
    }

    private static string NormalizeRoomCode(string roomCode)
    {
        var normalized = roomCode.Trim().ToUpperInvariant();

        if (normalized.Length != RoomCodeLength ||
            normalized.Any(character => !RoomCodeAlphabet.Contains(character)))
        {
            throw new GameFlowException("Código de sala inválido.", StatusCodes.Status400BadRequest);
        }

        return normalized;
    }

    private async Task PersistRoomAsync(
        MultiplayerRoomState room,
        CancellationToken cancellationToken)
    {
        if (!_configuration.GetValue<bool>("GeoExplorer:UsePostgresPersistence") || _persistenceStore is null)
        {
            return;
        }

        try
        {
            await _persistenceStore.SaveRoomSnapshotAsync(room, cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Could not persist multiplayer room {RoomCode}.", room.RoomCode);
        }
    }

    private async Task BroadcastUpdateAsync(
        MultiplayerRoomUpdate update,
        CancellationToken cancellationToken)
    {
        await _hubContext.Clients.Group(update.RoomCode).SendAsync("roomUpdated", update.State, cancellationToken);

        if (update.SubmittedPlayerId is not null)
        {
            await _hubContext.Clients.Group(update.RoomCode).SendAsync(
                "playerSubmitted",
                update.SubmittedPlayerId,
                cancellationToken);
        }

        if (update.RoundStarted is not null)
        {
            await _hubContext.Clients.Group(update.RoomCode).SendAsync(
                "roundStarted",
                update.RoundStarted,
                cancellationToken);
        }

        if (update.RoundResolved is not null)
        {
            await _hubContext.Clients.Group(update.RoomCode).SendAsync(
                "roundResolved",
                update.RoundResolved,
                cancellationToken);
        }

        if (update.GameCompleted is not null)
        {
            await _hubContext.Clients.Group(update.RoomCode).SendAsync(
                "gameCompleted",
                update.GameCompleted,
                cancellationToken);
        }
    }

    private async Task BroadcastOpenRoomsAsync(CancellationToken cancellationToken)
    {
        await _hubContext.Clients.Group(MultiplayerHub.OpenRoomsGroup).SendAsync(
            "openRoomsUpdated",
            ListOpenRooms(),
            cancellationToken);
    }

    private static bool IsInGameStatus(MultiplayerRoomState room)
    {
        return string.Equals(room.Status, PlayingStatus, StringComparison.OrdinalIgnoreCase);
    }

    private static bool ShouldScheduleDisconnectGrace(MultiplayerRoomState room)
    {
        return !string.Equals(room.Status, CompletedStatus, StringComparison.OrdinalIgnoreCase) &&
               room.Players.Any(player => !player.HasLeft && !player.Connected);
    }

    private bool IsDisconnectExpired(
        MultiplayerPlayerState player,
        DateTimeOffset now)
    {
        var disconnectedAt = player.LastSeenAt ?? player.JoinedAt;
        return now - disconnectedAt >= _disconnectGracePeriod;
    }

    private static void CancelDisconnectGraceIfNoDisconnectedPlayers(MultiplayerRoomState room)
    {
        if (!ShouldScheduleDisconnectGrace(room))
        {
            CancelDisconnectGrace(room);
        }
    }

    private static void CancelDisconnectGrace(MultiplayerRoomState room)
    {
        room.DisconnectGraceCancellation?.Cancel();
        room.DisconnectGraceCancellation?.Dispose();
        room.DisconnectGraceCancellation = null;
    }
}

public sealed record MultiplayerRoomUpdate(
    string RoomCode,
    MultiplayerRoomStateDto State,
    ChallengeRoundDto? RoundStarted = null,
    MultiplayerRoundResultDto? RoundResolved = null,
    MultiplayerSessionResultDto? GameCompleted = null,
    string? SubmittedPlayerId = null);

internal sealed class MultiplayerRoomState
{
    public required Guid Id { get; init; }
    public required string RoomCode { get; init; }
    public required CreateSessionRequest Config { get; set; }
    public required string OwnerPlayerId { get; set; }
    public required bool IsPublic { get; init; }
    public string? PasswordHash { get; init; }
    public required string Status { get; set; }
    public required DateTimeOffset CreatedAt { get; init; }
    public DateTimeOffset? StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public required List<MultiplayerPlayerState> Players { get; init; }
    public List<MultiplayerRoundState> Rounds { get; set; } = [];
    public int CurrentRoundIndex { get; set; }
    public MultiplayerRoundResultDto? LastRoundResult { get; set; }
    public MultiplayerSessionResultDto? FinalResult { get; set; }
    public CancellationTokenSource? RoundTimerCancellation { get; set; }
    public CancellationTokenSource? DisconnectGraceCancellation { get; set; }
    public object SyncRoot { get; } = new();
}

internal sealed class MultiplayerPlayerState
{
    public required Guid Id { get; init; }
    public required string PlayerId { get; init; }
    public required string DisplayName { get; set; }
    public required bool Connected { get; set; }
    public bool HasLeft { get; set; }
    public string? ConnectionId { get; set; }
    public required DateTimeOffset JoinedAt { get; init; }
    public DateTimeOffset? LastSeenAt { get; set; }
    public int TotalScore { get; set; }
}

internal sealed class MultiplayerRoundState
{
    public required Guid Id { get; init; }
    public required int RoundNumber { get; init; }
    public required SeedLocation Location { get; init; }
    public SeedMedia? SelectedMedia { get; init; }
    public required string Status { get; set; }
    public DateTimeOffset? StartedAt { get; set; }
    public DateTimeOffset? EndsAt { get; set; }
    public DateTimeOffset? ResolvedAt { get; set; }
    public string? ResolutionReason { get; set; }
    public Dictionary<string, MultiplayerPlayerGuessState> Guesses { get; } = new(StringComparer.Ordinal);
    public HashSet<string> ReadyPlayerIds { get; } = new(StringComparer.Ordinal);
    public MultiplayerRoundResultDto? Result { get; set; }
}

internal sealed class MultiplayerPlayerGuessState
{
    public required Guid Id { get; init; }
    public required string PlayerId { get; init; }
    public required string DisplayName { get; init; }
    public GuessCoordinatesDto? Guess { get; init; }
    public double? DistanceKm { get; init; }
    public required int Score { get; init; }
    public required string Resolution { get; init; }
    public required DateTimeOffset SubmittedAt { get; init; }
    public bool CountedForTotal { get; set; }
}

internal static class MultiplayerPasswordHasher
{
    private const int SaltSize = 16;
    private const int HashSize = 32;
    private const int Iterations = 100_000;
    private const char Separator = ':';

    public static string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            Iterations,
            HashAlgorithmName.SHA256,
            HashSize);

        return string.Join(
            Separator,
            "pbkdf2-sha256",
            Iterations.ToString(System.Globalization.CultureInfo.InvariantCulture),
            Convert.ToBase64String(salt),
            Convert.ToBase64String(hash));
    }

    public static bool Verify(string password, string encodedHash)
    {
        var parts = encodedHash.Split(Separator);
        if (parts.Length != 4 ||
            parts[0] != "pbkdf2-sha256" ||
            !int.TryParse(parts[1], out var iterations))
        {
            return false;
        }

        try
        {
            var salt = Convert.FromBase64String(parts[2]);
            var expectedHash = Convert.FromBase64String(parts[3]);
            var actualHash = Rfc2898DeriveBytes.Pbkdf2(
                password,
                salt,
                iterations,
                HashAlgorithmName.SHA256,
                expectedHash.Length);

            return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
