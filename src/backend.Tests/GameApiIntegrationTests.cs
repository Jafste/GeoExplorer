using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using GeoExplorer.Backend.Contracts;
using GeoExplorer.Backend.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace GeoExplorer.Backend.Tests;

[TestClass]
public sealed class GameApiIntegrationTests
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    [TestMethod]
    public async Task Health_ReturnsOkStatus()
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();

        using var response = await client.GetAsync("/api/health");

        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
    }

    [TestMethod]
    public async Task DatabaseDiagnostics_ReturnsUsageSnapshot()
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();

        var snapshot = await GetJson<DatabaseUsageSnapshotDto>(client, "/api/diagnostics/database");

        Assert.AreEqual(0, snapshot.TotalReads);
        Assert.AreEqual(0, snapshot.TotalWrites);
        Assert.AreEqual(0, snapshot.TotalOperations);
        Assert.HasCount(0, snapshot.Operations);
    }

    [TestMethod]
    public async Task SessionFlow_CompletesThroughHttpApi()
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();

        var created = await PostJson<CreateSessionResponse>(
            client,
            "/api/sessions",
            new CreateSessionRequest("europe", RoundCount: 2, Timed: false, RoundTimeSeconds: null));

        Assert.AreEqual(1, created.CurrentRound.RoundNumber);
        Assert.AreEqual(2, created.CurrentRound.TotalRounds);
        Assert.IsNotNull(created.CurrentRound.Challenge.Media);

        var firstResolution = await PostJson<RoundResolutionResponse>(
            client,
            $"/api/sessions/{created.SessionId}/rounds/{created.CurrentRound.Id}/guess",
            new GuessRequest(new GuessCoordinatesDto(41.1496, -8.6109, "Porto")));

        Assert.IsFalse(firstResolution.Progress.Completed);
        Assert.AreEqual(2, firstResolution.Progress.NextRoundNumber);
        Assert.IsNotNull(firstResolution.Result.Media);

        var nextRound = await GetJson<ChallengeRoundDto>(
            client,
            $"/api/sessions/{created.SessionId}/current-round");

        Assert.AreEqual(2, nextRound.RoundNumber);
        Assert.AreNotEqual(created.CurrentRound.Challenge.Id, nextRound.Challenge.Id);

        var secondResolution = await PostJson<RoundResolutionResponse>(
            client,
            $"/api/sessions/{created.SessionId}/rounds/{nextRound.Id}/timeout",
            new GuessRequest(null));

        Assert.IsTrue(secondResolution.Progress.Completed);
        Assert.IsNull(secondResolution.Progress.NextRoundNumber);

        var results = await GetJson<SessionResultDto>(
            client,
            $"/api/sessions/{created.SessionId}/results");

        Assert.AreEqual(2, results.TotalRounds);
        Assert.HasCount(2, results.Rounds);
    }

    [TestMethod]
    public async Task SessionFlow_WithDatabaseFlags_RestoresSessionAfterApiRestart()
    {
        var databaseName = $"geoexplorer-api-test-{Guid.NewGuid()}";
        var databaseRoot = new InMemoryDatabaseRoot();

        CreateSessionResponse created;
        RoundResolutionResponse firstResolution;

        using (var firstFactory = CreatePostgresModeFactory(databaseName, databaseRoot))
        using (var firstClient = firstFactory.CreateClient())
        {
            created = await PostJson<CreateSessionResponse>(
                firstClient,
                "/api/sessions",
                new CreateSessionRequest("europe", RoundCount: 2, Timed: false, RoundTimeSeconds: null));

            firstResolution = await PostJson<RoundResolutionResponse>(
                firstClient,
                $"/api/sessions/{created.SessionId}/rounds/{created.CurrentRound.Id}/guess",
                new GuessRequest(new GuessCoordinatesDto(41.1496, -8.6109, "Porto")));

            Assert.IsFalse(firstResolution.Progress.Completed);
            Assert.AreEqual(2, firstResolution.Progress.NextRoundNumber);
        }

        using var secondFactory = CreatePostgresModeFactory(databaseName, databaseRoot);
        using var secondClient = secondFactory.CreateClient();

        var restoredRound = await GetJson<ChallengeRoundDto>(
            secondClient,
            $"/api/sessions/{created.SessionId}/current-round");

        Assert.AreEqual(2, restoredRound.RoundNumber);
        Assert.AreNotEqual(created.CurrentRound.Id, restoredRound.Id);

        var restoredResults = await GetJson<SessionResultDto>(
            secondClient,
            $"/api/sessions/{created.SessionId}/results");

        Assert.AreEqual(created.SessionId, restoredResults.SessionId);
        Assert.AreEqual(2, restoredResults.TotalRounds);
        Assert.HasCount(1, restoredResults.Rounds);
        Assert.AreEqual(firstResolution.Result.RoundId, restoredResults.Rounds[0].RoundId);
        Assert.AreEqual("manual", restoredResults.Rounds[0].Resolution);

        var diagnostics = await GetJson<DatabaseUsageSnapshotDto>(secondClient, "/api/diagnostics/database");

        Assert.IsTrue(diagnostics.Operations.Any(operation =>
            operation.Name == "catalog_import_load" && operation.Writes == 0));
        Assert.IsTrue(diagnostics.Operations.Any(operation =>
            operation.Name == "session_restore" && operation.Reads == 1));
    }

    [TestMethod]
    public async Task DatabaseCompatibility_WithDatabaseFlags_AllowsInMemoryFactory()
    {
        var databaseName = $"geoexplorer-api-test-{Guid.NewGuid()}";
        var databaseRoot = new InMemoryDatabaseRoot();

        using var factory = CreatePostgresModeFactory(databaseName, databaseRoot);
        using var client = factory.CreateClient();

        using var response = await client.GetAsync("/api/health");

        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
    }

    [TestMethod]
    public async Task MapillaryMedia_WithInvalidImageId_ReturnsProblemDetails()
    {
        using var factory = CreateMapillaryFactory(accessToken: "");
        using var client = factory.CreateClient();

        using var response = await client.GetAsync("/api/media/mapillary/not-a-number");

        Assert.AreEqual(HttpStatusCode.BadRequest, response.StatusCode);

        using var document = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
        Assert.AreEqual("O identificador Mapillary não é válido.", document.RootElement.GetProperty("detail").GetString());
    }

    [TestMethod]
    public async Task MapillaryMedia_WithoutToken_ReturnsProblemDetails()
    {
        using var factory = CreateMapillaryFactory(accessToken: "");
        using var client = factory.CreateClient();

        using var response = await client.GetAsync("/api/media/mapillary/123456789");

        Assert.AreEqual(HttpStatusCode.ServiceUnavailable, response.StatusCode);

        using var document = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
        Assert.AreEqual("Mapillary não está configurado neste ambiente.", document.RootElement.GetProperty("detail").GetString());
    }

    [TestMethod]
    public async Task CreateSession_WithUnsupportedRegion_ReturnsProblemDetails()
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();

        using var response = await client.PostAsJsonAsync(
            "/api/sessions",
            new CreateSessionRequest("world", RoundCount: 1, Timed: false, RoundTimeSeconds: null));

        Assert.AreEqual(HttpStatusCode.BadRequest, response.StatusCode);

        using var document = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
        Assert.AreEqual("Apenas a região europeia está disponível neste MVP.", document.RootElement.GetProperty("detail").GetString());
    }

    [TestMethod]
    public async Task SubmitGuess_WhenRoundAlreadyResolved_ReturnsConflictProblemDetails()
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();
        var created = await PostJson<CreateSessionResponse>(
            client,
            "/api/sessions",
            new CreateSessionRequest("europe", RoundCount: 1, Timed: false, RoundTimeSeconds: null));

        await PostJson<RoundResolutionResponse>(
            client,
            $"/api/sessions/{created.SessionId}/rounds/{created.CurrentRound.Id}/guess",
            new GuessRequest(new GuessCoordinatesDto(41.1496, -8.6109, "Porto")));

        using var response = await client.PostAsJsonAsync(
            $"/api/sessions/{created.SessionId}/rounds/{created.CurrentRound.Id}/guess",
            new GuessRequest(new GuessCoordinatesDto(48.8566, 2.3522, "Paris")));

        Assert.AreEqual(HttpStatusCode.Conflict, response.StatusCode);

        using var document = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
        Assert.AreEqual("A ronda já foi resolvida.", document.RootElement.GetProperty("detail").GetString());
    }

    private static async Task<T> GetJson<T>(HttpClient client, string url)
    {
        using var response = await client.GetAsync(url);
        response.EnsureSuccessStatusCode();

        return await Deserialize<T>(response);
    }

    private static async Task<T> PostJson<T>(HttpClient client, string url, object body)
    {
        using var response = await client.PostAsJsonAsync(url, body);
        response.EnsureSuccessStatusCode();

        return await Deserialize<T>(response);
    }

    private static WebApplicationFactory<Program> CreatePostgresModeFactory(
        string databaseName,
        InMemoryDatabaseRoot databaseRoot)
    {
        return new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((_, configuration) =>
            {
                configuration.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["GeoExplorer:UsePostgresCatalog"] = "true",
                    ["GeoExplorer:UsePostgresPersistence"] = "true",
                });
            });

            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<IDbContextFactory<GeoExplorerDbContext>>();
                services.RemoveAll<DbContextOptions<GeoExplorerDbContext>>();
                services.AddDbContextFactory<GeoExplorerDbContext>(options =>
                    options.UseInMemoryDatabase(databaseName, databaseRoot));
            });
        });
    }

    private static WebApplicationFactory<Program> CreateMapillaryFactory(string accessToken)
    {
        return new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((_, configuration) =>
            {
                configuration.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Mapillary:AccessToken"] = accessToken,
                });
            });
        });
    }

    private static async Task<T> Deserialize<T>(HttpResponseMessage response)
    {
        var value = await response.Content.ReadFromJsonAsync<T>(SerializerOptions);
        return value ?? throw new InvalidOperationException("A resposta HTTP não tinha JSON válido.");
    }

    private sealed record DatabaseUsageSnapshotDto(
        int TotalReads,
        int TotalWrites,
        int TotalOperations,
        IReadOnlyList<DatabaseUsageOperationSnapshotDto> Operations);

    private sealed record DatabaseUsageOperationSnapshotDto(
        string Name,
        int Reads,
        int Writes,
        int Total);
}
