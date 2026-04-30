using Microsoft.EntityFrameworkCore;

namespace GeoExplorer.Backend.Data;

public sealed class GeoExplorerDbContext : DbContext
{
    public GeoExplorerDbContext(DbContextOptions<GeoExplorerDbContext> options)
        : base(options)
    {
    }

    public DbSet<LocationEntity> Locations => Set<LocationEntity>();
    public DbSet<GameSessionEntity> GameSessions => Set<GameSessionEntity>();
    public DbSet<SessionRoundEntity> SessionRounds => Set<SessionRoundEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<LocationEntity>(entity =>
        {
            entity.ToTable("locations");
            entity.HasKey(location => location.Id);

            entity.Property(location => location.Id).HasColumnName("id");
            entity.Property(location => location.Title).HasColumnName("title");
            entity.Property(location => location.City).HasColumnName("city");
            entity.Property(location => location.Country).HasColumnName("country");
            entity.Property(location => location.Region).HasColumnName("region");
            entity.Property(location => location.Category).HasColumnName("category");
            entity.Property(location => location.Latitude).HasColumnName("latitude");
            entity.Property(location => location.Longitude).HasColumnName("longitude");
            entity.Property(location => location.SceneLabel).HasColumnName("scene_label");
            entity.Property(location => location.SceneNote).HasColumnName("scene_note");
            entity.Property(location => location.SceneImage).HasColumnName("scene_image");
            entity.Property(location => location.MediaSourceProvider).HasColumnName("media_source_provider");
            entity.Property(location => location.ImageUrl).HasColumnName("image_url");
            entity.Property(location => location.ImageSourceUrl).HasColumnName("image_source_url");
            entity.Property(location => location.ImageAttribution).HasColumnName("image_attribution");
            entity.Property(location => location.ImageLicense).HasColumnName("image_license");
            entity.Property(location => location.ImageLicenseUrl).HasColumnName("image_license_url");
            entity.Property(location => location.StreetViewProvider).HasColumnName("street_view_provider");
            entity.Property(location => location.StreetViewUrl).HasColumnName("street_view_url");
            entity.Property(location => location.MediaVerifiedAt).HasColumnName("media_verified_at");
            entity.Property(location => location.Prompt).HasColumnName("prompt");
            entity.Property(location => location.VisualGradient).HasColumnName("visual_gradient").HasColumnType("jsonb");
            entity.Property(location => location.Clues).HasColumnName("clues").HasColumnType("jsonb");
        });

        modelBuilder.Entity<GameSessionEntity>(entity =>
        {
            entity.ToTable("game_sessions");
            entity.HasKey(session => session.Id);

            entity.Property(session => session.Id).HasColumnName("id");
            entity.Property(session => session.Region).HasColumnName("region");
            entity.Property(session => session.RoundCount).HasColumnName("round_count");
            entity.Property(session => session.Timed).HasColumnName("timed");
            entity.Property(session => session.RoundTimeSeconds).HasColumnName("round_time_seconds");
            entity.Property(session => session.TotalScore).HasColumnName("total_score");
            entity.Property(session => session.Status).HasColumnName("status");
            entity.Property(session => session.CreatedAt).HasColumnName("created_at");

            entity.HasMany(session => session.Rounds)
                .WithOne(round => round.Session)
                .HasForeignKey(round => round.SessionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SessionRoundEntity>(entity =>
        {
            entity.ToTable("session_rounds");
            entity.HasKey(round => round.Id);

            entity.Property(round => round.Id).HasColumnName("id");
            entity.Property(round => round.SessionId).HasColumnName("session_id");
            entity.Property(round => round.LocationId).HasColumnName("location_id");
            entity.Property(round => round.RoundNumber).HasColumnName("round_number");
            entity.Property(round => round.Status).HasColumnName("status");
            entity.Property(round => round.GuessLabel).HasColumnName("guess_label");
            entity.Property(round => round.GuessLatitude).HasColumnName("guess_latitude");
            entity.Property(round => round.GuessLongitude).HasColumnName("guess_longitude");
            entity.Property(round => round.DistanceKm).HasColumnName("distance_km");
            entity.Property(round => round.Score).HasColumnName("score");
            entity.Property(round => round.ResolutionReason).HasColumnName("resolution_reason");
            entity.Property(round => round.ResolvedAt).HasColumnName("resolved_at");

            entity.HasOne(round => round.Location)
                .WithMany()
                .HasForeignKey(round => round.LocationId);
        });
    }
}
