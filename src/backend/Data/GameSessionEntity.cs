namespace GeoExplorer.Backend.Data;

public sealed class GameSessionEntity
{
    public Guid Id { get; set; }
    public required string Region { get; set; }
    public required int RoundCount { get; set; }
    public required bool Timed { get; set; }
    public int? RoundTimeSeconds { get; set; }
    public int TotalScore { get; set; }
    public required string Status { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public List<SessionRoundEntity> Rounds { get; set; } = [];
}
