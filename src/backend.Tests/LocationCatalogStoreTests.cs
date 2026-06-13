using GeoExplorer.Backend.Data;
using GeoExplorer.Backend.Services;
using Microsoft.EntityFrameworkCore;

namespace GeoExplorer.Backend.Tests;

[TestClass]
public sealed class LocationCatalogStoreTests
{
    [TestMethod]
    public async Task ImportAndLoadAsync_DoesNotWriteWhenSeedHasNotChanged()
    {
        var factory = CreateFactory();
        var metrics = new DatabaseUsageMetrics();
        var store = new LocationCatalogStore(factory, metrics);
        var seed = new[] { CreateLocation("porto-ribeira") };

        await store.ImportAndLoadAsync(seed);
        await store.ImportAndLoadAsync(seed);

        var operation = GetCatalogOperation(metrics);

        Assert.AreEqual(1, operation.Writes);
    }

    [TestMethod]
    public async Task ImportAndLoadAsync_DoesNotWriteWhenStoredJsonOnlyHasDifferentFormatting()
    {
        var factory = CreateFactory();
        var metrics = new DatabaseUsageMetrics();
        var store = new LocationCatalogStore(factory, metrics);
        var seed = new[] { CreateLocation("porto-ribeira") };

        await store.ImportAndLoadAsync(seed);
        await using (var db = await factory.CreateDbContextAsync())
        {
            var location = await db.Locations.SingleAsync();
            location.VisualGradient = "[ \"#0f172a\", \"#1e40af\" ]";
            location.Clues = """
                [
                  {
                    "label": "rio",
                    "value": "Rio Douro e frente urbana histórica.",
                    "confidence": "alta"
                  }
                ]
                """;
            await db.SaveChangesAsync();
        }

        await store.ImportAndLoadAsync(seed);

        var operation = GetCatalogOperation(metrics);

        Assert.AreEqual(1, operation.Writes);
    }

    [TestMethod]
    public async Task ImportAndLoadAsync_WritesWhenSimpleFieldChanges()
    {
        var factory = CreateFactory();
        var metrics = new DatabaseUsageMetrics();
        var store = new LocationCatalogStore(factory, metrics);

        await store.ImportAndLoadAsync(new[] { CreateLocation("porto-ribeira") });
        var loaded = await store.ImportAndLoadAsync(new[] { CreateLocation("porto-ribeira", city: "Gaia") });

        var operation = GetCatalogOperation(metrics);

        Assert.AreEqual(2, operation.Writes);
        Assert.AreEqual("Gaia", loaded.Single().City);
    }

    [TestMethod]
    public async Task ImportAndLoadAsync_OnlyReturnsLocationsPresentInCurrentSeed()
    {
        var factory = CreateFactory();
        var metrics = new DatabaseUsageMetrics();
        var store = new LocationCatalogStore(factory, metrics);

        await store.ImportAndLoadAsync(new[]
        {
            CreateLocation("porto-ribeira"),
            CreateLocation("old-location"),
        });

        var loaded = await store.ImportAndLoadAsync(new[] { CreateLocation("porto-ribeira") });

        Assert.HasCount(1, loaded);
        Assert.AreEqual("porto-ribeira", loaded.Single().Id);

        await using var db = await factory.CreateDbContextAsync();
        Assert.AreEqual(2, await db.Locations.CountAsync());
    }

    [TestMethod]
    public async Task ImportAndLoadAsync_WritesWhenClueChanges()
    {
        var factory = CreateFactory();
        var metrics = new DatabaseUsageMetrics();
        var store = new LocationCatalogStore(factory, metrics);

        await store.ImportAndLoadAsync(new[] { CreateLocation("porto-ribeira") });
        var loaded = await store.ImportAndLoadAsync(new[]
        {
            CreateLocation("porto-ribeira", clueValue: "Rio Douro, ponte e frente urbana histórica."),
        });

        var operation = GetCatalogOperation(metrics);

        Assert.AreEqual(2, operation.Writes);
        Assert.AreEqual("Rio Douro, ponte e frente urbana histórica.", loaded.Single().Clues.Single().Value);
    }

    [TestMethod]
    public async Task ImportAndLoadAsync_PreservesVisualSources()
    {
        var factory = CreateFactory();
        var metrics = new DatabaseUsageMetrics();
        var store = new LocationCatalogStore(factory, metrics);

        var loaded = await store.ImportAndLoadAsync(new[] { CreateLocation("porto-ribeira", includeStreetViewSource: true) });

        var visualSources = loaded.Single().VisualSources;

        Assert.IsNotNull(visualSources);
        Assert.HasCount(2, visualSources);
        Assert.AreEqual("Wikimedia Commons", visualSources[0].SourceProvider);
        Assert.AreEqual("Mapillary", visualSources[1].StreetViewProvider);
        Assert.AreEqual("https://www.mapillary.com/app/?pKey=porto-test", visualSources[1].StreetViewUrl);
    }

    [TestMethod]
    public async Task ImportAndLoadAsync_WritesWhenVisualSourceChanges()
    {
        var factory = CreateFactory();
        var metrics = new DatabaseUsageMetrics();
        var store = new LocationCatalogStore(factory, metrics);

        await store.ImportAndLoadAsync(new[] { CreateLocation("porto-ribeira", includeStreetViewSource: true) });
        await store.ImportAndLoadAsync(new[] { CreateLocation("porto-ribeira", includeStreetViewSource: true, streetViewUrl: "https://www.mapillary.com/app/?pKey=porto-updated") });

        var operation = GetCatalogOperation(metrics);

        Assert.AreEqual(2, operation.Writes);
    }

    private static DatabaseUsageOperationSnapshot GetCatalogOperation(DatabaseUsageMetrics metrics)
    {
        return metrics.GetSnapshot().Operations.Single(operation => operation.Name == "catalog_import_load");
    }

    private static TestDbContextFactory CreateFactory()
    {
        var databaseName = $"geoexplorer-catalog-test-{Guid.NewGuid()}";
        var options = new DbContextOptionsBuilder<GeoExplorerDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;

        return new TestDbContextFactory(options);
    }

    private static SeedLocation CreateLocation(
        string id,
        string city = "Porto",
        string clueValue = "Rio Douro e frente urbana histórica.",
        bool includeStreetViewSource = false,
        string streetViewUrl = "https://www.mapillary.com/app/?pKey=porto-test")
    {
        return new SeedLocation
        {
            Id = id,
            Title = "Ribeira do Porto",
            City = city,
            Country = "Portugal",
            Region = "europe",
            Category = "urban",
            Latitude = 41.1406,
            Longitude = -8.611,
            SceneLabel = "Frente ribeirinha",
            SceneNote = "Rio, ponte e centro histórico.",
            Prompt = "Observa a frente ribeirinha e marca o local aproximado.",
            VisualGradient = new[] { "#0f172a", "#1e40af" },
            Media = new SeedMedia
            {
                SourceProvider = "Wikimedia Commons",
                ImageUrl = "https://example.com/porto.jpg",
                ImageSourceUrl = "https://commons.wikimedia.org/wiki/File:Porto.jpg",
                ImageAttribution = "Example author",
                ImageLicense = "CC BY-SA 4.0",
                ImageLicenseUrl = "https://creativecommons.org/licenses/by-sa/4.0/",
                VerifiedAt = "2026-05-01",
            },
            VisualSources = includeStreetViewSource
                ? new List<SeedMedia>
                {
                    new()
                    {
                        SourceProvider = "Wikimedia Commons",
                        ImageUrl = "https://example.com/porto.jpg",
                        ImageSourceUrl = "https://commons.wikimedia.org/wiki/File:Porto.jpg",
                        ImageAttribution = "Example author",
                        ImageLicense = "CC BY-SA 4.0",
                        ImageLicenseUrl = "https://creativecommons.org/licenses/by-sa/4.0/",
                        VerifiedAt = "2026-05-01",
                    },
                    new()
                    {
                        SourceProvider = "Mapillary",
                        StreetViewProvider = "Mapillary",
                        StreetViewUrl = streetViewUrl,
                        ImageAttribution = "Mapillary contributor",
                        ImageLicense = "CC BY-SA 4.0",
                        ImageLicenseUrl = "https://www.mapillary.com/terms",
                        VerifiedAt = "2026-05-12",
                    },
                }
                : null,
            Clues = new List<SeedClue>
            {
                new()
                {
                    Label = "rio",
                    Value = clueValue,
                    Confidence = "alta",
                },
            },
        };
    }

    private sealed class TestDbContextFactory : IDbContextFactory<GeoExplorerDbContext>
    {
        private readonly DbContextOptions<GeoExplorerDbContext> _options;

        public TestDbContextFactory(DbContextOptions<GeoExplorerDbContext> options)
        {
            _options = options;
        }

        public GeoExplorerDbContext CreateDbContext()
        {
            return new GeoExplorerDbContext(_options);
        }

        public Task<GeoExplorerDbContext> CreateDbContextAsync(CancellationToken cancellationToken = default)
        {
            return Task.FromResult(CreateDbContext());
        }
    }
}
