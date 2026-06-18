using GeoExplorer.Backend.Contracts;
using Microsoft.AspNetCore.Http;

namespace GeoExplorer.Backend.Services;

internal static class GameRoundRules
{
    public const int DefaultRoundTimeSeconds = 60;
    public const int MinRoundTimeSeconds = 1;
    public const int MaxRoundTimeSeconds = 3600;

    private const double MinimumRoundLocationDistanceKm = 1.0;
    private const double MinGuessLatitude = 27.5;
    private const double MaxGuessLatitude = 72;
    private const double MinGuessLongitude = -31.5;
    private const double MaxGuessLongitude = 45;
    private const int MaxGuessLabelLength = 80;

    public static List<SeedLocation> SelectRandomLocations(
        IReadOnlyList<SeedLocation> locations,
        int count,
        Func<int, int> randomIndex)
    {
        var pool = locations.ToList();
        var selectedCount = Math.Min(count, pool.Count);

        for (var index = 0; index < selectedCount; index++)
        {
            var swapIndex = index + NextRandomIndex(pool.Count - index, randomIndex);
            (pool[index], pool[swapIndex]) = (pool[swapIndex], pool[index]);
        }

        var selected = new List<SeedLocation>(selectedCount);
        var deferred = new List<SeedLocation>();

        foreach (var location in pool)
        {
            if (selected.Count == selectedCount)
            {
                break;
            }

            if (selected.All(existing => DistanceBetween(existing, location) >= MinimumRoundLocationDistanceKm))
            {
                selected.Add(location);
            }
            else
            {
                deferred.Add(location);
            }
        }

        if (selected.Count < selectedCount)
        {
            selected.AddRange(deferred.Take(selectedCount - selected.Count));
        }

        return selected;
    }

    public static SeedMedia? SelectVisualSource(
        SeedLocation location,
        Func<int, int> randomIndex,
        Func<SeedMedia, bool>? isAvailable = null)
    {
        var visualSources = location.GetVisualSources()
            .Where(source => isAvailable?.Invoke(source) ?? true)
            .ToList();

        return visualSources.Count == 0
            ? null
            : visualSources[NextRandomIndex(visualSources.Count, randomIndex)];
    }

    public static int? ValidateRoundTime(bool timed, int? requestedRoundTimeSeconds)
    {
        if (!timed)
        {
            return null;
        }

        var roundTimeSeconds = requestedRoundTimeSeconds ?? DefaultRoundTimeSeconds;

        if (roundTimeSeconds is < MinRoundTimeSeconds or > MaxRoundTimeSeconds)
        {
            throw new GameFlowException(
                $"O tempo por ronda deve estar entre {MinRoundTimeSeconds} e {MaxRoundTimeSeconds} segundos.",
                StatusCodes.Status400BadRequest);
        }

        return roundTimeSeconds;
    }

    public static ChallengeRoundDto BuildChallengeRound(
        string roundId,
        int roundNumber,
        int totalRounds,
        bool timed,
        int? roundTimeSeconds,
        SeedLocation location,
        SeedMedia? selectedMedia,
        DateTimeOffset? endsAt = null,
        Func<SeedMedia, bool>? isMediaAvailable = null)
    {
        return new ChallengeRoundDto(
            roundId,
            roundNumber,
            totalRounds,
            timed,
            timed ? roundTimeSeconds : null,
            timed ? endsAt : null,
            new ChallengeDto(
                roundId,
                location.SceneLabel,
                string.Empty,
                "Europa",
                location.Category,
                location.SceneLabel,
                location.SceneNote,
                null,
                location.Prompt,
                location.VisualGradient,
                BuildMedia(GetRoundMedia(location, selectedMedia, isMediaAvailable), includeSourceDetails: false),
                BuildVisualSources(location, includeSourceDetails: false),
                location.Clues
                    .Select(clue => new ChallengeClueDto(clue.Label, clue.Value, clue.Confidence))
                    .ToList()));
    }

    public static RoundResultDto BuildRoundResult(
        string roundId,
        int roundNumber,
        SeedLocation location,
        SeedMedia? selectedMedia,
        GuessCoordinatesDto? guess,
        string resolution,
        bool timed,
        Func<SeedMedia, bool>? isMediaAvailable = null)
    {
        var validatedGuess = guess is null ? null : ValidateGuess(guess);
        double? distanceKm = validatedGuess is null
            ? null
            : HaversineDistanceKm(
                validatedGuess.Latitude,
                validatedGuess.Longitude,
                location.Latitude,
                location.Longitude);

        return new RoundResultDto(
            roundId,
            roundNumber,
            location.Title,
            location.City,
            location.Country,
            location.Latitude,
            location.Longitude,
            validatedGuess,
            distanceKm is null ? 0 : ScoreFromDistance(distanceKm.Value),
            distanceKm,
            resolution,
            timed,
            BuildMedia(GetRoundMedia(location, selectedMedia, isMediaAvailable)),
            BuildVisualSources(location),
            location.Clues
                .Select(clue => new ChallengeClueDto(clue.Label, clue.Value, clue.Confidence))
                .ToList());
    }

    public static ChallengeMediaDto? BuildMedia(SeedMedia? media, bool includeSourceDetails = true)
    {
        return media is null
            ? null
            : new ChallengeMediaDto(
                media.SourceProvider,
                ExternalMediaProxyService.ToPublicImageUrl(media.ImageUrl),
                includeSourceDetails ? media.ImageSourceUrl : null,
                includeSourceDetails ? media.ImageAttribution : null,
                media.ImageLicense,
                media.ImageLicenseUrl,
                media.StreetViewProvider,
                includeSourceDetails ? media.StreetViewUrl : null,
                media.VerifiedAt);
    }

    public static IReadOnlyList<ChallengeMediaDto> BuildVisualSources(
        SeedLocation location,
        bool includeSourceDetails = true)
    {
        return location.GetVisualSources()
            .Select(media => BuildMedia(media, includeSourceDetails))
            .OfType<ChallengeMediaDto>()
            .ToList();
    }

    public static SeedMedia? GetPrimaryMedia(
        SeedLocation location,
        Func<SeedMedia, bool>? isMediaAvailable = null)
    {
        return location.GetVisualSources()
            .FirstOrDefault(source => isMediaAvailable?.Invoke(source) ?? true);
    }

    public static SeedMedia? GetRoundMedia(
        SeedLocation location,
        SeedMedia? selectedMedia,
        Func<SeedMedia, bool>? isMediaAvailable = null)
    {
        if (selectedMedia is not null && (isMediaAvailable?.Invoke(selectedMedia) ?? true))
        {
            return selectedMedia;
        }

        return GetPrimaryMedia(location, isMediaAvailable);
    }

    public static GuessCoordinatesDto ValidateGuess(GuessCoordinatesDto guess)
    {
        if (!double.IsFinite(guess.Latitude) || !double.IsFinite(guess.Longitude))
        {
            throw new GameFlowException("O palpite tem coordenadas inválidas.", StatusCodes.Status400BadRequest);
        }

        if (guess.Latitude is < MinGuessLatitude or > MaxGuessLatitude ||
            guess.Longitude is < MinGuessLongitude or > MaxGuessLongitude)
        {
            throw new GameFlowException("O palpite tem coordenadas fora do mapa europeu.", StatusCodes.Status400BadRequest);
        }

        var label = string.IsNullOrWhiteSpace(guess.Label)
            ? "Palpite"
            : guess.Label.Trim();

        if (label.Length > MaxGuessLabelLength || label.Any(char.IsControl))
        {
            throw new GameFlowException("A descrição do palpite não é válida.", StatusCodes.Status400BadRequest);
        }

        return new GuessCoordinatesDto(
            guess.Latitude,
            guess.Longitude,
            label);
    }

    public static double DistanceBetween(SeedLocation first, SeedLocation second)
    {
        return HaversineDistanceKm(first.Latitude, first.Longitude, second.Latitude, second.Longitude);
    }

    public static double HaversineDistanceKm(double latitudeA, double longitudeA, double latitudeB, double longitudeB)
    {
        const double earthRadiusKm = 6371;
        static double ToRadians(double value) => value * Math.PI / 180;

        var deltaLat = ToRadians(latitudeB - latitudeA);
        var deltaLng = ToRadians(longitudeB - longitudeA);
        var latA = ToRadians(latitudeA);
        var latB = ToRadians(latitudeB);
        var a = Math.Pow(Math.Sin(deltaLat / 2), 2) +
                Math.Cos(latA) * Math.Cos(latB) * Math.Pow(Math.Sin(deltaLng / 2), 2);

        return 2 * earthRadiusKm * Math.Asin(Math.Sqrt(a));
    }

    private static int ScoreFromDistance(double distanceKm)
    {
        return Math.Max(0, (int)Math.Round(5000 * Math.Exp(-distanceKm / 650)));
    }

    private static int NextRandomIndex(int maxExclusive, Func<int, int> randomIndex)
    {
        if (maxExclusive <= 1)
        {
            return 0;
        }

        return Math.Clamp(randomIndex(maxExclusive), 0, maxExclusive - 1);
    }
}
