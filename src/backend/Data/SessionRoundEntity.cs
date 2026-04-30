namespace GeoExplorer.Backend.Data;

public sealed class SessionRoundEntity
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public required string LocationId { get; set; }
    public int RoundNumber { get; set; }
    public required string Status { get; set; }
    public string? GuessLabel { get; set; }
    public double? GuessLatitude { get; set; }
    public double? GuessLongitude { get; set; }
    public double? DistanceKm { get; set; }
    public int Score { get; set; }
    public string? ResolutionReason { get; set; }
    public DateTimeOffset? ResolvedAt { get; set; }
    public GameSessionEntity? Session { get; set; }
    public LocationEntity? Location { get; set; }
}
