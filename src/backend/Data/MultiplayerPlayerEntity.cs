namespace GeoExplorer.Backend.Data;

public sealed class MultiplayerPlayerEntity
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public required string PlayerId { get; set; }
    public required string DisplayName { get; set; }
    public bool IsOwner { get; set; }
    public bool Connected { get; set; }
    public int TotalScore { get; set; }
    public DateTimeOffset JoinedAt { get; set; }
    public DateTimeOffset? LastSeenAt { get; set; }
    public MultiplayerRoomEntity? Room { get; set; }
}
