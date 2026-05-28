using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace GeoExplorer.Backend.Data;

public static class DatabaseMigrationRunner
{
    public static async Task ApplyAsync(
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
            .CreateLogger(nameof(DatabaseMigrationRunner));
        var factory = services.GetRequiredService<IDbContextFactory<GeoExplorerDbContext>>();

        const int maxAttempts = 12;

        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                await using var db = await factory.CreateDbContextAsync(cancellationToken);

                if (db.Database.IsRelational())
                {
                    await db.Database.MigrateAsync(cancellationToken);
                }
                else
                {
                    await db.Database.EnsureCreatedAsync(cancellationToken);
                }

                return;
            }
            catch (PostgresException exception) when (IsLegacySchemaConflict(exception))
            {
                logger.LogError(
                    exception,
                    "The PostgreSQL database already has GeoExplorer tables but no EF migration history.");
                throw new InvalidOperationException(
                    "A base de dados PostgreSQL já tem tabelas do GeoExplorer, mas não tem histórico de migrations do Entity Framework. " +
                    "Isto costuma acontecer quando existe um volume Docker antigo criado antes das migrations. " +
                    "Em desenvolvimento, recria o volume com: docker compose --profile full down -v && docker compose --profile full up --build",
                    exception);
            }
            catch (Exception exception) when (attempt < maxAttempts)
            {
                logger.LogWarning(
                    exception,
                    "Database was not ready on attempt {Attempt}/{MaxAttempts}. Retrying.",
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

    private static bool IsLegacySchemaConflict(PostgresException exception)
    {
        return exception.SqlState == PostgresErrorCodes.DuplicateTable;
    }
}
