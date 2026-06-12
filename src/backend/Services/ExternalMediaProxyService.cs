using System.Net;
using System.Security.Cryptography;
using System.Text;

namespace GeoExplorer.Backend.Services;

public sealed class ExternalMediaProxyService
{
    private static readonly TimeSpan RequestTimeout = TimeSpan.FromSeconds(10);
    private readonly IReadOnlyDictionary<string, string> _imageUrlsById;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ExternalMediaProxyService> _logger;

    public ExternalMediaProxyService(
        SeedLocationCatalog catalog,
        IHttpClientFactory httpClientFactory,
        ILogger<ExternalMediaProxyService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _imageUrlsById = BuildImageUrlIndex(catalog.GetAll());
    }

    public static string? ToPublicImageUrl(string? imageUrl)
    {
        if (!IsExternalImageUrl(imageUrl))
        {
            return imageUrl;
        }

        return $"/api/media/source/{BuildImageId(imageUrl!)}";
    }

    public async Task<ExternalMediaProxyResult> GetImageAsync(
        string imageId,
        CancellationToken cancellationToken = default)
    {
        if (!IsValidImageId(imageId))
        {
            return ExternalMediaProxyResult.Failed(
                HttpStatusCode.BadRequest,
                "O identificador da imagem não é válido.");
        }

        if (!_imageUrlsById.TryGetValue(imageId, out var imageUrl))
        {
            return ExternalMediaProxyResult.Failed(
                HttpStatusCode.NotFound,
                "A imagem não foi encontrada.");
        }

        var client = _httpClientFactory.CreateClient(nameof(ExternalMediaProxyService));
        client.Timeout = RequestTimeout;

        HttpResponseMessage response;
        try
        {
            response = await client.GetAsync(imageUrl, cancellationToken);
        }
        catch (HttpRequestException exception)
        {
            _logger.LogWarning(
                exception,
                "External media proxy request failed for image {ImageId}.",
                imageId);

            return ExternalMediaProxyResult.Failed(
                HttpStatusCode.BadGateway,
                "Não foi possível obter a imagem.");
        }
        catch (TaskCanceledException exception) when (!cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning(
                exception,
                "External media proxy timed out for image {ImageId}.",
                imageId);

            return ExternalMediaProxyResult.Failed(
                HttpStatusCode.BadGateway,
                "Não foi possível obter a imagem.");
        }

        using (response)
        {
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "External media proxy returned HTTP {StatusCode} for image {ImageId}.",
                    (int)response.StatusCode,
                    imageId);

                return ExternalMediaProxyResult.Failed(
                    HttpStatusCode.BadGateway,
                    "Não foi possível obter a imagem.");
            }

            var contentType = response.Content.Headers.ContentType?.MediaType ?? "application/octet-stream";
            if (!IsSupportedContentType(contentType))
            {
                _logger.LogWarning(
                    "External media proxy rejected content type {ContentType} for image {ImageId}.",
                    contentType,
                    imageId);

                return ExternalMediaProxyResult.Failed(
                    HttpStatusCode.BadGateway,
                    "A resposta da imagem não é válida.");
            }

            var bytes = StripJpegMetadata(await response.Content.ReadAsByteArrayAsync(cancellationToken));
            return ExternalMediaProxyResult.Found(bytes, contentType);
        }
    }

    private static IReadOnlyDictionary<string, string> BuildImageUrlIndex(IReadOnlyList<SeedLocation> locations)
    {
        var urlsById = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        foreach (var media in locations.SelectMany(location => location.GetVisualSources()))
        {
            if (!IsExternalImageUrl(media.ImageUrl))
            {
                continue;
            }

            urlsById.TryAdd(BuildImageId(media.ImageUrl!), media.ImageUrl!);
        }

        return urlsById;
    }

    private static bool IsExternalImageUrl(string? imageUrl)
    {
        return Uri.TryCreate(imageUrl, UriKind.Absolute, out var uri) &&
            (uri.Scheme == Uri.UriSchemeHttps || uri.Scheme == Uri.UriSchemeHttp);
    }

    private static string BuildImageId(string imageUrl)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(imageUrl));
        return Convert.ToHexString(hash[..16]).ToLowerInvariant();
    }

    private static bool IsValidImageId(string imageId)
    {
        return imageId.Length == 32 &&
            imageId.All(character =>
                character is >= '0' and <= '9' ||
                character is >= 'a' and <= 'f' ||
                character is >= 'A' and <= 'F');
    }

    private static bool IsSupportedContentType(string contentType)
    {
        return contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(contentType, "application/octet-stream", StringComparison.OrdinalIgnoreCase);
    }

    private static byte[] StripJpegMetadata(byte[] bytes)
    {
        if (bytes.Length < 4 || bytes[0] != 0xff || bytes[1] != 0xd8)
        {
            return bytes;
        }

        using var output = new MemoryStream(bytes.Length);
        output.Write(bytes.AsSpan(0, 2));

        var index = 2;
        while (index < bytes.Length)
        {
            if (bytes[index] != 0xff)
            {
                output.Write(bytes.AsSpan(index));
                break;
            }

            var markerStart = index++;
            while (index < bytes.Length && bytes[index] == 0xff)
            {
                index++;
            }

            if (index >= bytes.Length)
            {
                break;
            }

            var marker = bytes[index++];
            if (marker == 0xda)
            {
                output.Write(bytes.AsSpan(markerStart));
                break;
            }

            if (marker == 0xd9)
            {
                output.Write(bytes.AsSpan(markerStart, index - markerStart));
                break;
            }

            if (marker is 0x01 or >= 0xd0 and <= 0xd7)
            {
                output.Write(bytes.AsSpan(markerStart, index - markerStart));
                continue;
            }

            if (index + 2 > bytes.Length)
            {
                return bytes;
            }

            var segmentLength = (bytes[index] << 8) + bytes[index + 1];
            var segmentEnd = index + segmentLength;
            if (segmentLength < 2 || segmentEnd > bytes.Length)
            {
                return bytes;
            }

            if (!ShouldStripJpegSegment(marker))
            {
                output.Write(bytes.AsSpan(markerStart, segmentEnd - markerStart));
            }

            index = segmentEnd;
        }

        return output.ToArray();
    }

    private static bool ShouldStripJpegSegment(byte marker)
    {
        return marker == 0xfe || marker is >= 0xe1 and <= 0xef;
    }
}

public sealed record ExternalMediaProxyResult(
    HttpStatusCode StatusCode,
    string Message,
    byte[]? Bytes,
    string? ContentType)
{
    public static ExternalMediaProxyResult Found(byte[] bytes, string contentType)
    {
        return new ExternalMediaProxyResult(
            HttpStatusCode.OK,
            "Imagem encontrada.",
            bytes,
            contentType);
    }

    public static ExternalMediaProxyResult Failed(HttpStatusCode statusCode, string message)
    {
        return new ExternalMediaProxyResult(statusCode, message, null, null);
    }
}
