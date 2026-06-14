using GeoExplorer.Backend.Data;
using GeoExplorer.Backend.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging.Abstractions;

namespace GeoExplorer.Backend.Tests;

[TestClass]
public sealed class RoundLocationSelectorTests
{
    [TestMethod]
    public async Task SelectRandomLocations_WithPostgresCatalog_UsesDatabaseWithoutSeedJson()
    {
        var factory = CreateFactory();
        var store = new LocationCatalogStore(factory, new DatabaseUsageMetrics());
        await store.ImportAndLoadAsync(new[]
        {
            CreateLocation("db-location-a"),
            CreateLocation("db-location-b", latitude: 38.7169, longitude: -9.1399),
        });
        var selector = CreatePostgresSelector(store);

        var selected = selector.SelectRandomLocations("europe", 1, _ => 0);

        Assert.HasCount(1, selected);
        Assert.IsTrue(selected[0].Id.StartsWith("db-location-", StringComparison.Ordinal));
    }

    [TestMethod]
    public async Task FindById_WithPostgresCatalog_UsesDatabaseWithoutSeedJson()
    {
        var factory = CreateFactory();
        var store = new LocationCatalogStore(factory, new DatabaseUsageMetrics());
        await store.ImportAndLoadAsync(new[] { CreateLocation("db-location-a") });
        var selector = CreatePostgresSelector(store);

        var location = selector.FindById("db-location-a");

        Assert.IsNotNull(location);
        Assert.AreEqual("db-location-a", location.Id);
    }

    [TestMethod]
    public async Task GetAll_WithPostgresCatalog_UsesDatabaseWithoutSeedJson()
    {
        var factory = CreateFactory();
        var store = new LocationCatalogStore(factory, new DatabaseUsageMetrics());
        await store.ImportAndLoadAsync(new[]
        {
            CreateLocation("db-location-a"),
            CreateLocation("db-location-b", latitude: 38.7169, longitude: -9.1399),
        });
        var catalog = CreatePostgresCatalog(store);

        var locations = catalog.GetAll();

        Assert.HasCount(2, locations);
        Assert.IsTrue(locations.All(location => location.Id.StartsWith("db-location-", StringComparison.Ordinal)));
    }

    private static RoundLocationSelector CreatePostgresSelector(LocationCatalogStore store)
    {
        var configuration = CreatePostgresConfiguration();
        var catalog = CreatePostgresCatalog(store, configuration);

        return new RoundLocationSelector(
            catalog,
            configuration,
            NullLogger<RoundLocationSelector>.Instance,
            store);
    }

    private static SeedLocationCatalog CreatePostgresCatalog(
        LocationCatalogStore store,
        IConfiguration? configuration = null)
    {
        var environment = new TestWebHostEnvironment
        {
            ContentRootPath = Path.Combine(Path.GetTempPath(), $"geoexplorer-no-seed-{Guid.NewGuid()}", "backend"),
        };

        return new SeedLocationCatalog(
            environment,
            configuration ?? CreatePostgresConfiguration(),
            NullLogger<SeedLocationCatalog>.Instance,
            store);
    }

    private static IConfiguration CreatePostgresConfiguration()
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["GeoExplorer:UsePostgresCatalog"] = "true",
            })
            .Build();
    }

    private static TestDbContextFactory CreateFactory()
    {
        var databaseName = $"geoexplorer-selector-test-{Guid.NewGuid()}";
        var options = new DbContextOptionsBuilder<GeoExplorerDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;

        return new TestDbContextFactory(options);
    }

    private static SeedLocation CreateLocation(
        string id,
        double latitude = 41.1406,
        double longitude = -8.611)
    {
        return new SeedLocation
        {
            Id = id,
            Title = "Ribeira do Porto",
            City = "Porto",
            Country = "Portugal",
            Region = "europe",
            Category = "urban",
            Latitude = latitude,
            Longitude = longitude,
            SceneLabel = "Frente ribeirinha",
            SceneNote = "Rio, ponte e centro histórico.",
            Prompt = "Observa a frente ribeirinha e marca o local aproximado.",
            VisualGradient = ["#0f172a", "#1e40af"],
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
            Clues =
            [
                new()
                {
                    Label = "rio",
                    Value = "Rio Douro e frente urbana histórica.",
                    Confidence = "alta",
                },
            ],
        };
    }

    private sealed class TestWebHostEnvironment : IWebHostEnvironment
    {
        public string ApplicationName { get; set; } = "GeoExplorer.Backend.Tests";
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
        public string ContentRootPath { get; set; } = string.Empty;
        public string EnvironmentName { get; set; } = "Development";
        public string WebRootPath { get; set; } = string.Empty;
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
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
