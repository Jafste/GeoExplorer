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
    private const string RoomCodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private const int RoomCodeLength = 6;

    private readonly ConcurrentDictionary<string, MultiplayerRoomState> _rooms = new(StringComparer.OrdinalIgnoreCase);
    private readonly IReadOnlyList<SeedLocation> _locations;
    private readonly MultiplayerPersistenceStore? _persistenceStore;
    private readonly IConfiguration _configuration;
    private readonly IHubContext<MultiplayerHub> _hubContext;
    private readonly ILogger<MultiplayerRoomService> _logger;
    private readonly Func<int, int> _randomIndex;

    public MultiplayerRoomService(
        SeedLocationCatalog catalog,
        IConfiguration configuration,
        IHubContext<MultiplayerHub> hubContext,
        ILogger<MultiplayerRoomService> logger,
        MultiplayerPersistenceStore? persistenceStore = null,
        Func<int, int>? randomIndex = null)
    {
        _locations = catalog.GetAll();
        _configuration = configuration;
        _hubContext = hubContext;
        _logger = logger;
        _persistenceStore = persistenceStore;
        _randomIndex = randomIndex ?? Random.Shared.Next;
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
            if (!string.Equals(room.Status, LobbyStatus, StringComparison.OrdinalIgnoreCase))
            {
                throw new GameFlowException("A partida já começou.", StatusCodes.Status409Conflict);
            }

            EnsurePasswordMatches(room, request.Password);

            var existingPlayer = room.Players.FirstOrDefault(player => player.PlayerId == playerId);
            if (existingPlayer is not null)
            {
                EnsureNameAvailable(room, displayName, playerId);
                existingPlayer.DisplayName = displayName;
                existingPlayer.Connected = true;
                existingPlayer.ConnectionId = connectionId;
                existingPlayer.LastSeenAt = DateTimeOffset.UtcNow;
                state = BuildRoomState(room);
            }
            else
            {
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
                    owner?.DisplayName ?? "Owner",
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

            var selectedLocations = GameRoundRules.SelectRandomLocations(
                _locations,
                room.Config.RoundCount,
                _randomIndex);
            room.Rounds = selectedLocations.Select((location, index) => new MultiplayerRoundState
            {
                Id = Guid.NewGuid(),
                RoundNumber = index + 1,
                Location = location,
                SelectedMedia = GameRoundRules.SelectVisualSource(location, _randomIndex),
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

    public async Task<MultiplayerRoomUpdate> SubmitGuessAsync(
        SubmitMultiplayerGuessRequest request,
        CancellationToken cancellationToken = default)
    {
        var room = GetRoom(request.RoomCode);
        var playerId = ValidatePlayerId(request.PlayerId);
        MultiplayerRoomUpdate update;

        lock (room.SyncRoot)
        {
            var player = GetConnectedPlayer(room, playerId);
            var round = GetActiveRound(room, request.RoundId);

            if (round.Guesses.ContainsKey(playerId))
            {
                throw new GameFlowException("Já submeteste um palpite nesta ronda.", StatusCodes.Status409Conflict);
            }

            round.Guesses[playerId] = BuildPlayerGuess(player, round, request.Guess, "manual");

            var resolved = ShouldResolveRound(room, round)
                ? ResolveRound(room, round, "manual")
                : null;

            update = BuildUpdate(
                room,
                submittedPlayerId: playerId,
                roundResolved: resolved);
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

            if (AllConnectedPlayersReady(room, currentRound))
            {
                if (room.CurrentRoundIndex >= room.Rounds.Count - 1)
                {
                    room.Status = CompletedStatus;
                    room.CompletedAt = DateTimeOffset.UtcNow;
                    room.FinalResult = BuildFinalResult(room);
                    update = BuildUpdate(room, gameCompleted: room.FinalResult);
                }
                else
                {
                    room.CurrentRoundIndex += 1;
                    room.Status = PlayingStatus;
                    room.LastRoundResult = null;
                    StartCurrentRound(room);
                    update = BuildUpdate(room, roundStarted: GetCurrentRound(room));
                }
            }
            else
            {
                update = BuildUpdate(room);
            }
        }

        await PersistRoomAsync(room, cancellationToken);

        if (update.RoundStarted is not null)
        {
            ScheduleRoundTimeout(room);
        }

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
                    room.OwnerPlayerId = room.Players.OrderBy(candidate => candidate.JoinedAt).First().PlayerId;
                }
            }
            else
            {
                player.Connected = false;
                player.ConnectionId = null;
                player.LastSeenAt = DateTimeOffset.UtcNow;
            }

            update = BuildUpdate(room);
        }

        await PersistRoomAsync(room, cancellationToken);
        return update;
    }

    public async Task<IReadOnlyList<MultiplayerRoomUpdate>> MarkDisconnectedAsync(
        string connectionId,
        CancellationToken cancellationToken = default)
    {
        var updates = new List<(MultiplayerRoomState Room, MultiplayerRoomUpdate Update)>();

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
            }
        }

        foreach (var (room, _) in updates)
        {
            await PersistRoomAsync(room, cancellationToken);
        }

        return updates.Select(update => update.Update).ToList();
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

        await PersistRoomAsync(room, cancellationToken);
        await BroadcastUpdateAsync(update, cancellationToken);
    }

    private MultiplayerRoundResultDto ResolveRound(
        MultiplayerRoomState room,
        MultiplayerRoundState round,
        string resolution)
    {
        foreach (var player in room.Players.Where(player => player.Connected))
        {
            if (!round.Guesses.ContainsKey(player.PlayerId))
            {
                round.Guesses[player.PlayerId] = BuildPlayerGuess(player, round, guess: null, "timeout");
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

    private static MultiplayerRoundResultDto BuildRoundResult(
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
            GameRoundRules.BuildMedia(GameRoundRules.GetRoundMedia(round.Location, round.SelectedMedia)),
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

    private static MultiplayerSessionResultDto BuildFinalResult(MultiplayerRoomState room)
    {
        return new MultiplayerSessionResultDto(
            room.RoomCode,
            room.Rounds.Count,
            room.Players
                .Select(player => new MultiplayerSessionPlayerResultDto(
                    player.PlayerId,
                    player.DisplayName,
                    player.TotalScore))
                .OrderByDescending(player => player.TotalScore)
                .ThenBy(player => player.DisplayName, StringComparer.CurrentCultureIgnoreCase)
                .ToList(),
            room.Rounds
                .Where(round => round.Result is not null)
                .Select(round => round.Result!)
                .ToList());
    }

    private static void RefreshResultNames(MultiplayerRoomState room)
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
        var connectedPlayers = room.Players
            .Where(player => player.Connected)
            .Select(player => player.PlayerId)
            .ToList();

        return connectedPlayers.Count > 0 &&
               connectedPlayers.All(round.Guesses.ContainsKey);
    }

    private static bool AllConnectedPlayersReady(MultiplayerRoomState room, MultiplayerRoundState round)
    {
        var connectedPlayers = room.Players
            .Where(player => player.Connected)
            .Select(player => player.PlayerId)
            .ToList();

        return connectedPlayers.Count > 0 &&
               connectedPlayers.All(round.ReadyPlayerIds.Contains);
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

    private static MultiplayerRoomStateDto BuildRoomState(MultiplayerRoomState room)
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
                .Select(player => new MultiplayerPlayerDto(
                    player.PlayerId,
                    player.DisplayName,
                    room.OwnerPlayerId == player.PlayerId,
                    player.Connected,
                    currentRoundState?.Guesses.ContainsKey(player.PlayerId) ?? false,
                    currentRoundState?.ReadyPlayerIds.Contains(player.PlayerId) ?? false,
                    player.TotalScore))
                .ToList(),
            currentRound,
            room.LastRoundResult,
            room.FinalResult);
    }

    private static ChallengeRoundDto? GetCurrentRound(MultiplayerRoomState room)
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
                round.SelectedMedia);
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

    private static CreateSessionRequest ValidateConfig(CreateSessionRequest config)
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
        int? roundTimeSeconds = timed ? config.RoundTimeSeconds ?? 60 : null;

        if (timed && roundTimeSeconds is < 15 or > 180)
        {
            throw new GameFlowException("O tempo por ronda deve estar entre 15 e 180 segundos.", StatusCodes.Status400BadRequest);
        }

        return new CreateSessionRequest("europe", config.RoundCount, timed, roundTimeSeconds);
    }

    private static string ValidatePlayerId(string playerId)
    {
        var normalized = playerId.Trim();

        if (string.IsNullOrWhiteSpace(normalized) || normalized.Length > 80)
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
            throw new GameFlowException("Só o owner da sala pode fazer esta ação.", StatusCodes.Status403Forbidden);
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

        if (normalized.Length != RoomCodeLength)
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
    public object SyncRoot { get; } = new();
}

internal sealed class MultiplayerPlayerState
{
    public required Guid Id { get; init; }
    public required string PlayerId { get; init; }
    public required string DisplayName { get; set; }
    public required bool Connected { get; set; }
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
