namespace GeoExplorer.Backend.Contracts;

public sealed record CreateSessionRequest(
    string Region,
    int RoundCount,
    bool Timed,
    int? RoundTimeSeconds);

public sealed record GuessCoordinatesDto(
    double Latitude,
    double Longitude,
    string Label);

public sealed record GuessRequest(GuessCoordinatesDto? Guess);

public sealed record ChallengeClueDto(
    string Label,
    string Value,
    string Confidence);

public sealed record ChallengeMediaDto(
    string SourceProvider,
    string? ImageUrl,
    string? ImageSourceUrl,
    string? ImageAttribution,
    string? ImageLicense,
    string? ImageLicenseUrl,
    string? StreetViewProvider,
    string? StreetViewUrl,
    string? VerifiedAt);

public sealed record ChallengeDto(
    string Id,
    string Title,
    string City,
    string Country,
    string Category,
    string SceneLabel,
    string SceneNote,
    string? SceneImage,
    string Prompt,
    string[] VisualGradient,
    ChallengeMediaDto? Media,
    IReadOnlyList<ChallengeClueDto> Clues);

public sealed record ChallengeRoundDto(
    string Id,
    int RoundNumber,
    int TotalRounds,
    bool Timed,
    int? TimeLimitSeconds,
    ChallengeDto Challenge);

public sealed record CreateSessionResponse(
    string SessionId,
    ChallengeRoundDto CurrentRound);

public sealed record RoundResultDto(
    string RoundId,
    int RoundNumber,
    string Title,
    string City,
    string Country,
    double CorrectLatitude,
    double CorrectLongitude,
    GuessCoordinatesDto? Guess,
    int Score,
    double? DistanceKm,
    string Resolution,
    bool Timed,
    ChallengeMediaDto? Media,
    IReadOnlyList<ChallengeClueDto> Clues);

public sealed record RoundProgressDto(
    bool Completed,
    int? NextRoundNumber);

public sealed record RoundResolutionResponse(
    RoundResultDto Result,
    RoundProgressDto Progress);

public sealed record SessionResultDto(
    string SessionId,
    int TotalScore,
    int TotalRounds,
    bool Timed,
    int? RoundTimeSeconds,
    IReadOnlyList<RoundResultDto> Rounds);
