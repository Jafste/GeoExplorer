using System.Net;
using System.Net.Http.Json;
using GeoExplorer.Backend.Services;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace GeoExplorer.Backend.Tests;

[TestClass]
public sealed class MapillaryImageServiceTests
{
    [TestMethod]
    public async Task GetThumbnailAsync_WithConfiguredToken_ReturnsThumbnailUrl()
    {
        var handler = new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = JsonContent.Create(new
            {
                thumb_1024_url = "https://images.mapillary.com/example/thumb.jpg",
            }),
        });
        var service = CreateService("local-token", handler);

        var result = await service.GetThumbnailAsync("123456789");

        Assert.AreEqual(HttpStatusCode.Redirect, result.StatusCode);
        Assert.AreEqual("https://images.mapillary.com/example/thumb.jpg", result.ThumbnailUrl);
        Assert.AreEqual(1, handler.CallCount);
        Assert.IsNotNull(handler.LastRequestUri);
        Assert.AreEqual("graph.mapillary.com", handler.LastRequestUri.Host);
    }

    [TestMethod]
    public async Task GetThumbnailAsync_WithInvalidImageId_DoesNotCallMapillary()
    {
        var handler = new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK));
        var service = CreateService("local-token", handler);

        var result = await service.GetThumbnailAsync("../token");

        Assert.AreEqual(HttpStatusCode.BadRequest, result.StatusCode);
        Assert.IsNull(result.ThumbnailUrl);
        Assert.AreEqual(0, handler.CallCount);
    }

    [TestMethod]
    public async Task GetThumbnailAsync_WithoutToken_DoesNotCallMapillary()
    {
        var handler = new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK));
        var service = CreateService(null, handler);

        var result = await service.GetThumbnailAsync("123456789");

        Assert.AreEqual(HttpStatusCode.ServiceUnavailable, result.StatusCode);
        Assert.IsNull(result.ThumbnailUrl);
        Assert.AreEqual(0, handler.CallCount);
    }

    [TestMethod]
    public async Task GetThumbnailAsync_ReusesCachedThumbnail()
    {
        var handler = new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = JsonContent.Create(new
            {
                thumb_1024_url = "https://images.mapillary.com/example/cached.jpg",
            }),
        });
        var service = CreateService("local-token", handler);

        var firstResult = await service.GetThumbnailAsync("987654321");
        var secondResult = await service.GetThumbnailAsync("987654321");

        Assert.AreEqual(HttpStatusCode.Redirect, firstResult.StatusCode);
        Assert.AreEqual(HttpStatusCode.Redirect, secondResult.StatusCode);
        Assert.AreEqual(firstResult.ThumbnailUrl, secondResult.ThumbnailUrl);
        Assert.AreEqual(1, handler.CallCount);
    }

    private static MapillaryImageService CreateService(string? accessToken, HttpMessageHandler handler)
    {
        var configurationValues = new Dictionary<string, string?>();
        if (accessToken is not null)
        {
            configurationValues["Mapillary:AccessToken"] = accessToken;
        }

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configurationValues)
            .Build();
        var httpClient = new HttpClient(handler);
        var cache = new MemoryCache(new MemoryCacheOptions());

        return new MapillaryImageService(
            httpClient,
            configuration,
            cache,
            NullLogger<MapillaryImageService>.Instance);
    }

    private sealed class StubHttpMessageHandler(
        Func<HttpRequestMessage, HttpResponseMessage> responseFactory) : HttpMessageHandler
    {
        public int CallCount { get; private set; }

        public Uri? LastRequestUri { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            CallCount++;
            LastRequestUri = request.RequestUri;
            return Task.FromResult(responseFactory(request));
        }
    }
}
