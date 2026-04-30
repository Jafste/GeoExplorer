using GeoExplorer.Backend.Contracts;
using GeoExplorer.Backend.Services;
using Microsoft.EntityFrameworkCore;

namespace GeoExplorer.Backend.Data;

public sealed class GamePersistenceStore
{
    private readonly IDbContextFactory<GeoExplorerDbContext> _contextFactory;

    public GamePersistenceStore(IDbContextFactory<GeoExplorerDbContext> contextFactory)
    {
        _contextFactory = contextFactory;
    }

    internal async Task CreateSessionAsync(SessionState session, CancellationToken cancellationToken = default)
    {
        await using var db = await _contextFactory.CreateDbContextAsync(cancellationToken);
        await db.Database.EnsureCreatedAsync(cancellationToken);

        var sessionId = Guid.Parse(session.Id);
        db.GameSessions.Add(new GameSessionEntity
        {
            Id = sessionId,
            Region = session.Config.Region,
            RoundCount = session.Config.RoundCount,
            Timed = session.Config.Timed,
            RoundTimeSeconds = session.Config.RoundTimeSeconds,
            TotalScore = 0,
            Status = "active",
            CreatedAt = DateTimeOffset.UtcNow,
            Rounds = session.Rounds.Select(round => new SessionRoundEntity
            {
                Id = Guid.Parse(round.Id),
                SessionId = sessionId,
                LocationId = round.Location.Id,
                RoundNumber = round.RoundNumber,
                Status = "pending",
                Score = 0,
            }).ToList(),
        });

        await db.SaveChangesAsync(cancellationToken);
    }

    internal async Task ResolveRoundAsync(
        SessionState session,
        RoundState round,
        RoundResultDto result,
        CancellationToken cancellationToken = default)
    {
        await using var db = await _contextFactory.CreateDbContextAsync(cancellationToken);

        var sessionId = Guid.Parse(session.Id);
        var roundId = Guid.Parse(round.Id);
        var sessionEntity = await db.GameSessions
            .FirstOrDefaultAsync(candidate => candidate.Id == sessionId, cancellationToken);
        var roundEntity = await db.SessionRounds
            .FirstOrDefaultAsync(candidate => candidate.Id == roundId, cancellationToken);

        if (sessionEntity is null || roundEntity is null)
        {
            return;
        }

        roundEntity.Status = "resolved";
        roundEntity.GuessLabel = result.Guess?.Label;
        roundEntity.GuessLatitude = result.Guess?.Latitude;
        roundEntity.GuessLongitude = result.Guess?.Longitude;
        roundEntity.DistanceKm = result.DistanceKm;
        roundEntity.Score = result.Score;
        roundEntity.ResolutionReason = result.Resolution;
        roundEntity.ResolvedAt = DateTimeOffset.UtcNow;

        sessionEntity.TotalScore = session.Rounds.Sum(candidate => candidate.Result?.Score ?? 0);
        sessionEntity.Status = session.CurrentRoundIndex >= session.Rounds.Count ? "completed" : "active";

        await db.SaveChangesAsync(cancellationToken);
    }
}
