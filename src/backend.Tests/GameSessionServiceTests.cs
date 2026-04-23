using GeoExplorer.Backend.Contracts;
using GeoExplorer.Backend.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.FileProviders;

namespace GeoExplorer.Backend.Tests;

[TestClass]
public sealed class GameSessionServiceTests
{
    [TestMethod]
    public void CreateSession_ReturnsSceneImageForFrontendContract()
    {
        var service = CreateService();

        var response = service.CreateSession(new CreateSessionRequest(
            "europe",
            RoundCount: 1,
            Timed: true,
            RoundTimeSeconds: 60));

        Assert.IsFalse(string.IsNullOrWhiteSpace(response.CurrentRound.Challenge.SceneImage));
        StringAssert.StartsWith(response.CurrentRound.Challenge.SceneImage!, "/mock-scenes/");
    }

    [TestMethod]
    public void DatabaseSchema_IncludesSceneImageColumn()
    {
        var sql = File.ReadAllText(Path.Combine(FindRepoRoot(), "src", "database", "sql", "001-init.sql"));

        StringAssert.Contains(sql, "scene_image TEXT NULL");
    }

    private static GameSessionService CreateService()
    {
        var environment = new TestWebHostEnvironment
        {
            ContentRootPath = Path.Combine(FindRepoRoot(), "src", "backend"),
        };

        return new GameSessionService(new SeedLocationCatalog(environment));
    }

    private static string FindRepoRoot()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);

        while (directory is not null)
        {
            if (File.Exists(Path.Combine(directory.FullName, "GeoExplorer.slnx")))
            {
                return directory.FullName;
            }

            directory = directory.Parent;
        }

        throw new DirectoryNotFoundException("Não foi possível encontrar a raiz do repositório.");
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
}
