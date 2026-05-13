using System.Collections.Concurrent;
using GeoExplorer.Backend.Contracts;
using GeoExplorer.Backend.Data;

namespace GeoExplorer.Backend.Services;

public sealed class GameSessionService
{
    private readonly ConcurrentDictionary<string, SessionState> _sessions = new();
    private readonly IReadOnlyList<SeedLocation> _locations;
    private readonly IReadOnlyDictionary<string, SeedLocation> _locationsById;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GameSessionService> _logger;
    private readonly GamePersistenceStore? _persistenceStore;

    public GameSessionService(SeedLocationCatalog catalog)
        : this(
            catalog,
            new ConfigurationBuilder().Build(),
            Microsoft.Extensions.Logging.Abstractions.NullLogger<GameSessionService>.Instance,
            null)
    {
    }

    public GameSessionService(
        SeedLocationCatalog catalog,
        IConfiguration configuration,
        ILogger<GameSessionService> logger,
        GamePersistenceStore? persistenceStore = null)
    {
        _locations = catalog.GetAll();
        _locationsById = _locations.ToDictionary(location => location.Id, StringComparer.OrdinalIgnoreCase);
        _configuration = configuration;
        _logger = logger;
        _persistenceStore = persistenceStore;
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

        var sessionId = Guid.NewGuid().ToString();
        var selectedLocations = SelectRandomLocations(request.RoundCount);

        var rounds = selectedLocations.Select((location, index) => new RoundState
        {
            Id = Guid.NewGuid().ToString(),
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
        PersistSession(session);

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

        session = RestoreSession(sessionId);

        if (session is not null)
        {
            _sessions.TryAdd(sessionId, session);
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
            BuildMedia(GetPrimaryMedia(round.Location)),
            BuildVisualSources(round.Location),
            round.Location.Clues
                .Select(clue => new ChallengeClueDto(clue.Label, clue.Value, clue.Confidence))
                .ToList());

        round.Result = result;
        session.CurrentRoundIndex += 1;
        PersistRoundResolution(session, round, result);

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
                BuildMedia(GetPrimaryMedia(round.Location)),
                BuildVisualSources(round.Location),
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

    private static SeedMedia? GetPrimaryMedia(SeedLocation location)
    {
        return location.Media ?? location.GetVisualSources().FirstOrDefault();
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

    private bool ShouldPersist => _configuration.GetValue<bool>("GeoExplorer:UsePostgresPersistence");

    private void PersistSession(SessionState session)
    {
        if (!ShouldPersist || _persistenceStore is null)
        {
            return;
        }

        try
        {
            _persistenceStore.CreateSessionAsync(session).GetAwaiter().GetResult();
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Could not persist game session {SessionId}.", session.Id);
        }
    }

    private void PersistRoundResolution(SessionState session, RoundState round, RoundResultDto result)
    {
        if (!ShouldPersist || _persistenceStore is null)
        {
            return;
        }

        try
        {
            _persistenceStore.ResolveRoundAsync(session, round, result).GetAwaiter().GetResult();
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Could not persist round {RoundId} for session {SessionId}.",
                round.Id,
                session.Id);
        }
    }

    private SessionState? RestoreSession(string sessionId)
    {
        if (!ShouldPersist || _persistenceStore is null)
        {
            return null;
        }

        try
        {
            var snapshot = _persistenceStore.LoadSessionAsync(sessionId).GetAwaiter().GetResult();
            return snapshot is null ? null : BuildSessionState(snapshot);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Could not restore game session {SessionId}.", sessionId);
            return null;
        }
    }

    private SessionState BuildSessionState(PersistedSessionSnapshot snapshot)
    {
        var config = new SessionConfiguration
        {
            Region = snapshot.Region,
            RoundCount = snapshot.RoundCount,
            Timed = snapshot.Timed,
            RoundTimeSeconds = snapshot.RoundTimeSeconds,
        };

        var rounds = snapshot.Rounds.Select(round =>
        {
            if (!_locationsById.TryGetValue(round.LocationId, out var location))
            {
                throw new InvalidOperationException($"O local persistido '{round.LocationId}' não existe no catálogo carregado.");
            }

            var roundState = new RoundState
            {
                Id = round.Id,
                RoundNumber = round.RoundNumber,
                Location = location,
            };

            if (string.Equals(round.Status, "resolved", StringComparison.OrdinalIgnoreCase))
            {
                roundState.Result = BuildPersistedRoundResult(round, location, config);
            }

            return roundState;
        }).ToList();

        var currentRoundIndex = rounds.FindIndex(round => round.Result is null);

        return new SessionState
        {
            Id = snapshot.Id,
            Config = config,
            Rounds = rounds,
            CurrentRoundIndex = currentRoundIndex < 0 ? rounds.Count : currentRoundIndex,
        };
    }

    private static RoundResultDto BuildPersistedRoundResult(
        PersistedRoundSnapshot round,
        SeedLocation location,
        SessionConfiguration config)
    {
        var guess = round.GuessLatitude is not null && round.GuessLongitude is not null
            ? new GuessCoordinatesDto(
                round.GuessLatitude.Value,
                round.GuessLongitude.Value,
                round.GuessLabel ?? "Palpite")
            : null;

        return new RoundResultDto(
            round.Id,
            round.RoundNumber,
            location.Title,
            location.City,
            location.Country,
            location.Latitude,
            location.Longitude,
            guess,
            round.Score,
            round.DistanceKm,
            round.ResolutionReason ?? "manual",
            config.Timed,
            BuildMedia(GetPrimaryMedia(location)),
            BuildVisualSources(location),
            location.Clues
                .Select(clue => new ChallengeClueDto(clue.Label, clue.Value, clue.Confidence))
                .ToList());
    }

    private static IReadOnlyList<ChallengeMediaDto> BuildVisualSources(SeedLocation location)
    {
        return location.GetVisualSources()
            .Select(source => BuildMedia(source))
            .OfType<ChallengeMediaDto>()
            .ToList();
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
