using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using GeoExplorer.Backend.Contracts;
using Microsoft.AspNetCore.Mvc.Testing;

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

    private static async Task<T> Deserialize<T>(HttpResponseMessage response)
    {
        var value = await response.Content.ReadFromJsonAsync<T>(SerializerOptions);
        return value ?? throw new InvalidOperationException("A resposta HTTP não tinha JSON válido.");
    }
}
