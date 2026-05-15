using Microsoft.EntityFrameworkCore;

namespace GeoExplorer.Backend.Data;

public static class DatabaseSchemaCompatibility
{
    public static async Task EnsureAsync(
        IServiceProvider services,
        IConfiguration configuration,
        CancellationToken cancellationToken = default)
    {
        if (!ShouldUseDatabase(configuration))
        {
            return;
        }

        var logger = services
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger(nameof(DatabaseSchemaCompatibility));
        var factory = services.GetRequiredService<IDbContextFactory<GeoExplorerDbContext>>();

        const int maxAttempts = 12;

        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                await using var db = await factory.CreateDbContextAsync(cancellationToken);
                await db.Database.EnsureCreatedAsync(cancellationToken);

                if (db.Database.IsRelational())
                {
                    await db.Database.ExecuteSqlRawAsync(
                        """
                        ALTER TABLE locations ADD COLUMN IF NOT EXISTS visual_sources JSONB NULL;
                        ALTER TABLE session_rounds ADD COLUMN IF NOT EXISTS visual_source JSONB NULL;
                        """,
                        cancellationToken);
                }

                return;
            }
            catch (Exception exception) when (attempt < maxAttempts)
            {
                logger.LogWarning(
                    exception,
                    "Database schema was not ready on attempt {Attempt}/{MaxAttempts}. Retrying.",
                    attempt,
                    maxAttempts);
                await Task.Delay(TimeSpan.FromSeconds(2), cancellationToken);
            }
        }
    }

    private static bool ShouldUseDatabase(IConfiguration configuration)
    {
        return configuration.GetValue<bool>("GeoExplorer:UsePostgresCatalog") ||
               configuration.GetValue<bool>("GeoExplorer:UsePostgresPersistence");
    }
}
