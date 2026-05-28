using GeoExplorer.Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace GeoExplorer.Backend.Tests;

[TestClass]
public sealed class DatabaseMigrationTests
{
    [TestMethod]
    public void GeoExplorerDbContext_HasInitialCreateMigration()
    {
        var options = new DbContextOptionsBuilder<GeoExplorerDbContext>()
            .UseNpgsql("Host=localhost;Database=geoexplorer_test;Username=geoexplorer;Password=geoexplorer_dev")
            .Options;

        using var db = new GeoExplorerDbContext(options);
        var migrations = db.Database.GetMigrations().ToList();

        Assert.IsTrue(
            migrations.Any(migration => migration.EndsWith("_InitialCreate", StringComparison.Ordinal)),
            "O contexto deve ter uma migration inicial para criar o schema da base de dados.");
        Assert.IsTrue(
            migrations.Any(migration => migration.EndsWith("_AddMultiplayerRooms", StringComparison.Ordinal)),
            "O contexto deve ter uma migration para criar as tabelas de multiplayer.");
        Assert.IsTrue(
            migrations.Any(migration => migration.EndsWith("_AddMultiplayerRoomAccess", StringComparison.Ordinal)),
            "O contexto deve ter uma migration para guardar visibilidade e password das salas.");
    }
}
