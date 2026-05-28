namespace GeoExplorer.Backend.Data;

public sealed class MultiplayerRoomEntity
{
    public Guid Id { get; set; }
    public required string RoomCode { get; set; }
    public required string Region { get; set; }
    public int RoundCount { get; set; }
    public bool Timed { get; set; }
    public int? RoundTimeSeconds { get; set; }
    public required string OwnerPlayerId { get; set; }
    public bool IsPublic { get; set; }
    public string? PasswordHash { get; set; }
    public required string Status { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public List<MultiplayerPlayerEntity> Players { get; set; } = [];
    public List<MultiplayerRoundEntity> Rounds { get; set; } = [];
}
