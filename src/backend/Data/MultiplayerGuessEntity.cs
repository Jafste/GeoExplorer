namespace GeoExplorer.Backend.Data;

public sealed class MultiplayerGuessEntity
{
    public Guid Id { get; set; }
    public Guid RoundId { get; set; }
    public required string PlayerId { get; set; }
    public string? GuessLabel { get; set; }
    public double? GuessLatitude { get; set; }
    public double? GuessLongitude { get; set; }
    public double? DistanceKm { get; set; }
    public int Score { get; set; }
    public required string ResolutionReason { get; set; }
    public DateTimeOffset SubmittedAt { get; set; }
    public MultiplayerRoundEntity? Round { get; set; }
}
