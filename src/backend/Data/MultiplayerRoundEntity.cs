namespace GeoExplorer.Backend.Data;

public sealed class MultiplayerRoundEntity
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public required string LocationId { get; set; }
    public int RoundNumber { get; set; }
    public string? VisualSource { get; set; }
    public required string Status { get; set; }
    public DateTimeOffset? StartedAt { get; set; }
    public DateTimeOffset? EndsAt { get; set; }
    public DateTimeOffset? ResolvedAt { get; set; }
    public string? ResolutionReason { get; set; }
    public MultiplayerRoomEntity? Room { get; set; }
    public LocationEntity? Location { get; set; }
    public List<MultiplayerGuessEntity> Guesses { get; set; } = [];
}
