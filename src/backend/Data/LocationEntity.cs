namespace GeoExplorer.Backend.Data;

public sealed class LocationEntity
{
    public required string Id { get; set; }
    public required string Title { get; set; }
    public required string City { get; set; }
    public required string Country { get; set; }
    public required string Region { get; set; }
    public required string Category { get; set; }
    public required double Latitude { get; set; }
    public required double Longitude { get; set; }
    public required string SceneLabel { get; set; }
    public required string SceneNote { get; set; }
    public string? SceneImage { get; set; }
    public string? MediaSourceProvider { get; set; }
    public string? ImageUrl { get; set; }
    public string? ImageSourceUrl { get; set; }
    public string? ImageAttribution { get; set; }
    public string? ImageLicense { get; set; }
    public string? ImageLicenseUrl { get; set; }
    public string? StreetViewProvider { get; set; }
    public string? StreetViewUrl { get; set; }
    public DateOnly? MediaVerifiedAt { get; set; }
    public string? VisualSources { get; set; }
    public required string Prompt { get; set; }
    public required string VisualGradient { get; set; }
    public required string Clues { get; set; }
}
