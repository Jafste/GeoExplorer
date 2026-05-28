namespace GeoExplorer.Backend.Contracts;

public sealed record CreateMultiplayerRoomRequest(
    string PlayerId,
    string DisplayName,
    CreateSessionRequest Config,
    bool IsPublic = false,
    string? Password = null);

public sealed record JoinMultiplayerRoomRequest(
    string RoomCode,
    string PlayerId,
    string DisplayName,
    string? Password = null);

public sealed record UpdateMultiplayerConfigRequest(
    string RoomCode,
    string PlayerId,
    CreateSessionRequest Config);

public sealed record UpdateMultiplayerDisplayNameRequest(
    string RoomCode,
    string PlayerId,
    string DisplayName);

public sealed record MultiplayerRoomPlayerRequest(
    string RoomCode,
    string PlayerId);

public sealed record SubmitMultiplayerGuessRequest(
    string RoomCode,
    string PlayerId,
    string RoundId,
    GuessCoordinatesDto Guess);

public sealed record MultiplayerPlayerDto(
    string PlayerId,
    string DisplayName,
    bool IsOwner,
    bool Connected,
    bool Submitted,
    bool Ready,
    int TotalScore);

public sealed record MultiplayerRoomStateDto(
    string RoomCode,
    string Status,
    string OwnerPlayerId,
    bool IsPublic,
    bool HasPassword,
    CreateSessionRequest Config,
    IReadOnlyList<MultiplayerPlayerDto> Players,
    ChallengeRoundDto? CurrentRound,
    MultiplayerRoundResultDto? LastRoundResult,
    MultiplayerSessionResultDto? FinalResult);

public sealed record MultiplayerOpenRoomDto(
    string RoomCode,
    string OwnerDisplayName,
    int PlayerCount,
    int RoundCount,
    bool Timed,
    int? RoundTimeSeconds,
    bool HasPassword);

public sealed record MultiplayerPlayerRoundResultDto(
    string PlayerId,
    string DisplayName,
    GuessCoordinatesDto? Guess,
    int Score,
    double? DistanceKm,
    string Resolution);

public sealed record MultiplayerRoundResultDto(
    string RoomCode,
    string RoundId,
    int RoundNumber,
    int TotalRounds,
    string Title,
    string City,
    string Country,
    double CorrectLatitude,
    double CorrectLongitude,
    ChallengeMediaDto? Media,
    IReadOnlyList<ChallengeMediaDto> VisualSources,
    IReadOnlyList<ChallengeClueDto> Clues,
    IReadOnlyList<MultiplayerPlayerRoundResultDto> PlayerResults,
    bool Completed,
    int? NextRoundNumber);

public sealed record MultiplayerSessionPlayerResultDto(
    string PlayerId,
    string DisplayName,
    int TotalScore);

public sealed record MultiplayerSessionResultDto(
    string RoomCode,
    int TotalRounds,
    IReadOnlyList<MultiplayerSessionPlayerResultDto> Players,
    IReadOnlyList<MultiplayerRoundResultDto> Rounds);
