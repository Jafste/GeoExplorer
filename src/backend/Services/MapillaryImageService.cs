using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Memory;

namespace GeoExplorer.Backend.Services;

public sealed class MapillaryImageService(
    HttpClient httpClient,
    IConfiguration configuration,
    IMemoryCache cache,
    ILogger<MapillaryImageService> logger)
{
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(30);

    public async Task<MapillaryImageResult> GetThumbnailAsync(
        string imageId,
        CancellationToken cancellationToken = default)
    {
        if (!IsValidImageId(imageId))
        {
            return MapillaryImageResult.Failed(
                HttpStatusCode.BadRequest,
                "O identificador Mapillary não é válido.");
        }

        var cacheKey = $"mapillary-thumbnail:{imageId}";
        if (cache.TryGetValue<string>(cacheKey, out var cachedThumbnailUrl) &&
            !string.IsNullOrWhiteSpace(cachedThumbnailUrl))
        {
            return MapillaryImageResult.Found(cachedThumbnailUrl);
        }

        var accessToken = GetAccessToken(configuration);

        if (string.IsNullOrWhiteSpace(accessToken))
        {
            return MapillaryImageResult.Failed(
                HttpStatusCode.ServiceUnavailable,
                "Mapillary não está configurado neste ambiente.");
        }

        using var response = await httpClient.GetAsync(
            BuildGraphUrl(imageId, accessToken),
            cancellationToken);

        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            return MapillaryImageResult.Failed(
                HttpStatusCode.NotFound,
                "A imagem Mapillary não foi encontrada.");
        }

        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning(
                "Mapillary returned HTTP {StatusCode} for image {ImageId}.",
                (int)response.StatusCode,
                imageId);

            return MapillaryImageResult.Failed(
                HttpStatusCode.BadGateway,
                "Não foi possível obter a imagem Mapillary.");
        }

        var payload = await response.Content.ReadFromJsonAsync<MapillaryImageResponse>(
            cancellationToken);

        var thumbnailUrl = payload?.GetBestThumbnailUrl();
        if (string.IsNullOrWhiteSpace(thumbnailUrl))
        {
            return MapillaryImageResult.Failed(
                HttpStatusCode.NotFound,
                "A imagem Mapillary não tem thumbnail disponível.");
        }

        cache.Set(cacheKey, thumbnailUrl, CacheDuration);
        return MapillaryImageResult.Found(thumbnailUrl);
    }

    public static bool IsValidImageId(string imageId)
    {
        return !string.IsNullOrWhiteSpace(imageId) && imageId.All(char.IsDigit);
    }

    public static bool HasConfiguredAccessToken(IConfiguration configuration)
    {
        return !string.IsNullOrWhiteSpace(GetAccessToken(configuration));
    }

    public static bool IsMapillaryMedia(SeedMedia media)
    {
        return string.Equals(media.SourceProvider, "Mapillary", StringComparison.OrdinalIgnoreCase) ||
            (media.ImageUrl?.StartsWith("/api/media/mapillary/", StringComparison.OrdinalIgnoreCase) ?? false);
    }

    private static string? GetAccessToken(IConfiguration configuration)
    {
        return configuration["Mapillary:AccessToken"] ??
            Environment.GetEnvironmentVariable("MAPILLARY_ACCESS_TOKEN");
    }

    private static string BuildGraphUrl(string imageId, string accessToken)
    {
        return $"https://graph.mapillary.com/{Uri.EscapeDataString(imageId)}" +
            "?fields=thumb_2048_url,thumb_1024_url,thumb_original_url,thumb_256_url" +
            $"&access_token={Uri.EscapeDataString(accessToken)}";
    }

    private sealed record MapillaryImageResponse(
        [property: JsonPropertyName("thumb_2048_url")] string? Thumbnail2048Url,
        [property: JsonPropertyName("thumb_1024_url")] string? Thumbnail1024Url,
        [property: JsonPropertyName("thumb_original_url")] string? ThumbnailOriginalUrl,
        [property: JsonPropertyName("thumb_256_url")] string? Thumbnail256Url)
    {
        public string? GetBestThumbnailUrl()
        {
            return FirstNonEmpty(Thumbnail1024Url, Thumbnail2048Url, ThumbnailOriginalUrl, Thumbnail256Url);
        }

        private static string? FirstNonEmpty(params string?[] values)
        {
            return values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));
        }
    }
}

public sealed record MapillaryImageResult(
    HttpStatusCode StatusCode,
    string Message,
    string? ThumbnailUrl)
{
    public static MapillaryImageResult Found(string thumbnailUrl)
    {
        return new MapillaryImageResult(
            HttpStatusCode.Redirect,
            "Imagem Mapillary encontrada.",
            thumbnailUrl);
    }

    public static MapillaryImageResult Failed(HttpStatusCode statusCode, string message)
    {
        return new MapillaryImageResult(statusCode, message, null);
    }
}
