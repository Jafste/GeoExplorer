using System.Text.Json;
using GeoExplorer.Backend.Services;
using Microsoft.EntityFrameworkCore;

namespace GeoExplorer.Backend.Data;

public sealed class MultiplayerPersistenceStore
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly IDbContextFactory<GeoExplorerDbContext> _contextFactory;
    private readonly DatabaseUsageMetrics _metrics;

    public MultiplayerPersistenceStore(
        IDbContextFactory<GeoExplorerDbContext> contextFactory,
        DatabaseUsageMetrics metrics)
    {
        _contextFactory = contextFactory;
        _metrics = metrics;
    }

    internal async Task SaveRoomSnapshotAsync(
        MultiplayerRoomState room,
        CancellationToken cancellationToken = default)
    {
        await using var db = await _contextFactory.CreateDbContextAsync(cancellationToken);

        var roomEntity = await db.MultiplayerRooms
            .Include(candidate => candidate.Players)
            .Include(candidate => candidate.Rounds)
            .ThenInclude(round => round.Guesses)
            .FirstOrDefaultAsync(candidate => candidate.Id == room.Id, cancellationToken);
        _metrics.RecordRead("multiplayer_snapshot");

        if (roomEntity is null)
        {
            roomEntity = new MultiplayerRoomEntity
            {
                Id = room.Id,
                RoomCode = room.RoomCode,
                Region = room.Config.Region,
                RoundCount = room.Config.RoundCount,
                Timed = room.Config.Timed,
                RoundTimeSeconds = room.Config.RoundTimeSeconds,
                OwnerPlayerId = room.OwnerPlayerId,
                IsPublic = room.IsPublic,
                PasswordHash = room.PasswordHash,
                Status = room.Status,
                CreatedAt = room.CreatedAt,
            };
            db.MultiplayerRooms.Add(roomEntity);
        }

        roomEntity.Region = room.Config.Region;
        roomEntity.RoundCount = room.Config.RoundCount;
        roomEntity.Timed = room.Config.Timed;
        roomEntity.RoundTimeSeconds = room.Config.RoundTimeSeconds;
        roomEntity.OwnerPlayerId = room.OwnerPlayerId;
        roomEntity.IsPublic = room.IsPublic;
        roomEntity.PasswordHash = room.PasswordHash;
        roomEntity.Status = room.Status;
        roomEntity.StartedAt = room.StartedAt;
        roomEntity.CompletedAt = room.CompletedAt;

        SyncPlayers(db, room, roomEntity);
        SyncRounds(db, room, roomEntity);

        await db.SaveChangesAsync(cancellationToken);
        _metrics.RecordWrite("multiplayer_snapshot");
    }

    private static void SyncPlayers(
        GeoExplorerDbContext db,
        MultiplayerRoomState room,
        MultiplayerRoomEntity roomEntity)
    {
        var currentPlayerIds = room.Players.Select(player => player.Id).ToHashSet();
        foreach (var stalePlayer in roomEntity.Players.Where(player => !currentPlayerIds.Contains(player.Id)).ToList())
        {
            db.MultiplayerPlayers.Remove(stalePlayer);
        }

        foreach (var player in room.Players)
        {
            var entity = roomEntity.Players.FirstOrDefault(candidate => candidate.Id == player.Id);

            if (entity is null)
            {
                entity = new MultiplayerPlayerEntity
                {
                    Id = player.Id,
                    RoomId = room.Id,
                    PlayerId = player.PlayerId,
                    DisplayName = player.DisplayName,
                    JoinedAt = player.JoinedAt,
                };
                db.MultiplayerPlayers.Add(entity);
            }

            entity.PlayerId = player.PlayerId;
            entity.DisplayName = player.DisplayName;
            entity.IsOwner = room.OwnerPlayerId == player.PlayerId;
            entity.Connected = player.Connected;
            entity.TotalScore = player.TotalScore;
            entity.LastSeenAt = player.LastSeenAt;
        }
    }

    private static void SyncRounds(
        GeoExplorerDbContext db,
        MultiplayerRoomState room,
        MultiplayerRoomEntity roomEntity)
    {
        var currentRoundIds = room.Rounds.Select(round => round.Id).ToHashSet();
        foreach (var staleRound in roomEntity.Rounds.Where(round => !currentRoundIds.Contains(round.Id)).ToList())
        {
            db.MultiplayerRounds.Remove(staleRound);
        }

        foreach (var round in room.Rounds)
        {
            var entity = roomEntity.Rounds.FirstOrDefault(candidate => candidate.Id == round.Id);

            if (entity is null)
            {
                entity = new MultiplayerRoundEntity
                {
                    Id = round.Id,
                    RoomId = room.Id,
                    LocationId = round.Location.Id,
                    RoundNumber = round.RoundNumber,
                    Status = round.Status,
                };
                db.MultiplayerRounds.Add(entity);
            }

            entity.LocationId = round.Location.Id;
            entity.RoundNumber = round.RoundNumber;
            entity.VisualSource = SerializeVisualSource(round.SelectedMedia);
            entity.Status = round.Status;
            entity.StartedAt = round.StartedAt;
            entity.EndsAt = round.EndsAt;
            entity.ResolvedAt = round.ResolvedAt;
            entity.ResolutionReason = round.ResolutionReason;

            SyncGuesses(db, round, entity);
        }
    }

    private static void SyncGuesses(
        GeoExplorerDbContext db,
        MultiplayerRoundState round,
        MultiplayerRoundEntity roundEntity)
    {
        foreach (var guess in round.Guesses.Values)
        {
            var entity = roundEntity.Guesses.FirstOrDefault(candidate => candidate.Id == guess.Id);

            if (entity is null)
            {
                entity = new MultiplayerGuessEntity
                {
                    Id = guess.Id,
                    RoundId = round.Id,
                    PlayerId = guess.PlayerId,
                    ResolutionReason = guess.Resolution,
                    SubmittedAt = guess.SubmittedAt,
                };
                db.MultiplayerGuesses.Add(entity);
            }

            entity.PlayerId = guess.PlayerId;
            entity.GuessLabel = guess.Guess?.Label;
            entity.GuessLatitude = guess.Guess?.Latitude;
            entity.GuessLongitude = guess.Guess?.Longitude;
            entity.DistanceKm = guess.DistanceKm;
            entity.Score = guess.Score;
            entity.ResolutionReason = guess.Resolution;
            entity.SubmittedAt = guess.SubmittedAt;
        }
    }

    private static string? SerializeVisualSource(SeedMedia? visualSource)
    {
        return visualSource is null ? null : JsonSerializer.Serialize(visualSource, SerializerOptions);
    }
}
