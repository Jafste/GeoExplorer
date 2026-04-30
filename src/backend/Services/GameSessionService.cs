using System.Collections.Concurrent;
using GeoExplorer.Backend.Contracts;

namespace GeoExplorer.Backend.Services;

public sealed class GameSessionService
{
    private readonly ConcurrentDictionary<string, SessionState> _sessions = new();
    private readonly IReadOnlyList<SeedLocation> _locations;
    private int _sessionSequence;

    public GameSessionService(SeedLocationCatalog catalog)
    {
        _locations = catalog.GetAll();
    }

    public CreateSessionResponse CreateSession(CreateSessionRequest request)
    {
        if (!string.Equals(request.Region, "europe", StringComparison.OrdinalIgnoreCase))
        {
            throw new GameFlowException("Apenas a região europeia está disponível neste MVP.", StatusCodes.Status400BadRequest);
        }

        if (request.RoundCount is < 1 or > 10)
        {
            throw new GameFlowException("O número de rondas deve estar entre 1 e 10.", StatusCodes.Status400BadRequest);
        }

        var timed = request.Timed;
        int? roundTimeSeconds = timed ? request.RoundTimeSeconds ?? 60 : null;

        if (timed && roundTimeSeconds is < 15 or > 180)
        {
            throw new GameFlowException("O tempo por ronda deve estar entre 15 e 180 segundos.", StatusCodes.Status400BadRequest);
        }

        var sessionIndex = Interlocked.Increment(ref _sessionSequence);
        var sessionId = $"api-session-{sessionIndex}";
        var selectedLocations = SelectRandomLocations(request.RoundCount);

        var rounds = selectedLocations.Select((location, index) => new RoundState
        {
            Id = $"{sessionId}-round-{index + 1}",
            RoundNumber = index + 1,
            Location = location,
        }).ToList();

        var session = new SessionState
        {
            Id = sessionId,
            Config = new SessionConfiguration
            {
                Region = "europe",
                RoundCount = request.RoundCount,
                Timed = timed,
                RoundTimeSeconds = roundTimeSeconds,
            },
            Rounds = rounds,
            CurrentRoundIndex = 0,
        };

        _sessions[sessionId] = session;
        return new CreateSessionResponse(sessionId, BuildRound(rounds[0], session));
    }

    private List<SeedLocation> SelectRandomLocations(int count)
    {
        var pool = _locations.ToList();
        var selectedCount = Math.Min(count, pool.Count);

        for (var index = 0; index < selectedCount; index++)
        {
            var swapIndex = Random.Shared.Next(index, pool.Count);
            (pool[index], pool[swapIndex]) = (pool[swapIndex], pool[index]);
        }

        return pool.Take(selectedCount).ToList();
    }

    public ChallengeRoundDto GetCurrentRound(string sessionId)
    {
        var session = GetSession(sessionId);

        lock (session.SyncRoot)
        {
            var round = session.Rounds.ElementAtOrDefault(session.CurrentRoundIndex);

            if (round is null)
            {
                throw new GameFlowException("A sessão já terminou.", StatusCodes.Status400BadRequest);
            }

            return BuildRound(round, session);
        }
    }

    public RoundResolutionResponse SubmitGuess(string sessionId, string roundId, GuessCoordinatesDto guess)
    {
        var session = GetSession(sessionId);

        lock (session.SyncRoot)
        {
            var round = GetPendingRound(session, roundId);
            return ResolveRound(session, round, guess, "manual");
        }
    }

    public RoundResolutionResponse TimeoutRound(string sessionId, string roundId, GuessCoordinatesDto? guess)
    {
        var session = GetSession(sessionId);

        lock (session.SyncRoot)
        {
            var round = GetPendingRound(session, roundId);
            return ResolveRound(session, round, guess, "timeout");
        }
    }

    public SessionResultDto GetResults(string sessionId)
    {
        var session = GetSession(sessionId);

        lock (session.SyncRoot)
        {
            var rounds = session.Rounds
                .Where(round => round.Result is not null)
                .Select(round => round.Result!)
                .ToList();

            return new SessionResultDto(
                session.Id,
                rounds.Sum(round => round.Score),
                session.Rounds.Count,
                session.Config.Timed,
                session.Config.RoundTimeSeconds,
                rounds);
        }
    }

    private SessionState GetSession(string sessionId)
    {
        if (_sessions.TryGetValue(sessionId, out var session))
        {
            return session;
        }

        throw new GameFlowException("Sessão não encontrada.", StatusCodes.Status404NotFound);
    }

    private static RoundState GetPendingRound(SessionState session, string roundId)
    {
        var round = session.Rounds.FirstOrDefault(candidate => candidate.Id == roundId);

        if (round is null)
        {
            throw new GameFlowException("Ronda não encontrada.", StatusCodes.Status404NotFound);
        }

        if (round.Result is not null)
        {
            throw new GameFlowException("A ronda já foi resolvida.", StatusCodes.Status409Conflict);
        }

        return round;
    }

    private RoundResolutionResponse ResolveRound(
        SessionState session,
        RoundState round,
        GuessCoordinatesDto? guess,
        string resolution)
    {
        var boundedGuess = guess is null ? null : ClampGuess(guess);
        double? distanceKm = boundedGuess is null
            ? null
            : HaversineDistanceKm(
                boundedGuess.Latitude,
                boundedGuess.Longitude,
                round.Location.Latitude,
                round.Location.Longitude);

        var result = new RoundResultDto(
            round.Id,
            round.RoundNumber,
            round.Location.Title,
            round.Location.City,
            round.Location.Country,
            round.Location.Latitude,
            round.Location.Longitude,
            boundedGuess,
            distanceKm is null ? 0 : ScoreFromDistance(distanceKm.Value),
            distanceKm,
            resolution,
            session.Config.Timed,
            BuildMedia(round.Location.Media),
            round.Location.Clues
                .Select(clue => new ChallengeClueDto(clue.Label, clue.Value, clue.Confidence))
                .ToList());

        round.Result = result;
        session.CurrentRoundIndex += 1;

        return new RoundResolutionResponse(
            result,
            new RoundProgressDto(
                session.CurrentRoundIndex >= session.Rounds.Count,
                session.CurrentRoundIndex >= session.Rounds.Count
                    ? null
                    : session.Rounds[session.CurrentRoundIndex].RoundNumber));
    }

    private static ChallengeRoundDto BuildRound(RoundState round, SessionState session)
    {
        return new ChallengeRoundDto(
            round.Id,
            round.RoundNumber,
            session.Rounds.Count,
            session.Config.Timed,
            session.Config.Timed ? session.Config.RoundTimeSeconds : null,
            new ChallengeDto(
                round.Location.Id,
                round.Location.Title,
                round.Location.City,
                round.Location.Country,
                round.Location.Category,
                round.Location.SceneLabel,
                round.Location.SceneNote,
                round.Location.SceneImage,
                round.Location.Prompt,
                round.Location.VisualGradient,
                BuildMedia(round.Location.Media),
                round.Location.Clues
                    .Select(clue => new ChallengeClueDto(clue.Label, clue.Value, clue.Confidence))
                    .ToList()));
    }

    private static ChallengeMediaDto? BuildMedia(SeedMedia? media)
    {
        return media is null
            ? null
            : new ChallengeMediaDto(
                media.SourceProvider,
                media.ImageUrl,
                media.ImageSourceUrl,
                media.ImageAttribution,
                media.ImageLicense,
                media.ImageLicenseUrl,
                media.StreetViewProvider,
                media.StreetViewUrl,
                media.VerifiedAt);
    }

    private static GuessCoordinatesDto ClampGuess(GuessCoordinatesDto guess)
    {
        const double minLat = 34;
        const double maxLat = 72;
        const double minLng = -25;
        const double maxLng = 45;

        return new GuessCoordinatesDto(
            Math.Clamp(guess.Latitude, minLat, maxLat),
            Math.Clamp(guess.Longitude, minLng, maxLng),
            guess.Label);
    }

    private static double HaversineDistanceKm(double latitudeA, double longitudeA, double latitudeB, double longitudeB)
    {
        const double earthRadiusKm = 6371;
        static double ToRadians(double value) => value * Math.PI / 180;

        var deltaLat = ToRadians(latitudeB - latitudeA);
        var deltaLng = ToRadians(longitudeB - longitudeA);
        var latA = ToRadians(latitudeA);
        var latB = ToRadians(latitudeB);
        var a = Math.Pow(Math.Sin(deltaLat / 2), 2) +
                Math.Cos(latA) * Math.Cos(latB) * Math.Pow(Math.Sin(deltaLng / 2), 2);

        return 2 * earthRadiusKm * Math.Asin(Math.Sqrt(a));
    }

    private static int ScoreFromDistance(double distanceKm)
    {
        return Math.Max(0, (int)Math.Round(5000 * Math.Exp(-distanceKm / 650)));
    }
}

public sealed class GameFlowException : Exception
{
    public GameFlowException(string message, int statusCode) : base(message)
    {
        StatusCode = statusCode;
    }

    public int StatusCode { get; }
}

internal sealed class SessionState
{
    public required string Id { get; init; }
    public required SessionConfiguration Config { get; init; }
    public required List<RoundState> Rounds { get; init; }
    public object SyncRoot { get; } = new();
    public required int CurrentRoundIndex { get; set; }
}

internal sealed class SessionConfiguration
{
    public required string Region { get; init; }
    public required int RoundCount { get; init; }
    public required bool Timed { get; init; }
    public required int? RoundTimeSeconds { get; init; }
}

internal sealed class RoundState
{
    public required string Id { get; init; }
    public required int RoundNumber { get; init; }
    public required SeedLocation Location { get; init; }
    public RoundResultDto? Result { get; set; }
}
