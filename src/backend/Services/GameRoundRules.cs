using GeoExplorer.Backend.Contracts;

namespace GeoExplorer.Backend.Services;

internal static class GameRoundRules
{
    private const double MinimumRoundLocationDistanceKm = 1.0;

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

    public static SeedMedia? SelectVisualSource(SeedLocation location, Func<int, int> randomIndex)
    {
        var visualSources = location.GetVisualSources();

        return visualSources.Count == 0
            ? null
            : visualSources[NextRandomIndex(visualSources.Count, randomIndex)];
    }

    public static ChallengeRoundDto BuildChallengeRound(
        string roundId,
        int roundNumber,
        int totalRounds,
        bool timed,
        int? roundTimeSeconds,
        SeedLocation location,
        SeedMedia? selectedMedia)
    {
        return new ChallengeRoundDto(
            roundId,
            roundNumber,
            totalRounds,
            timed,
            timed ? roundTimeSeconds : null,
            new ChallengeDto(
                location.Id,
                location.Title,
                location.City,
                location.Country,
                location.Category,
                location.SceneLabel,
                location.SceneNote,
                location.SceneImage,
                location.Prompt,
                location.VisualGradient,
                BuildMedia(GetRoundMedia(location, selectedMedia)),
                BuildVisualSources(location),
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
        bool timed)
    {
        var boundedGuess = guess is null ? null : ClampGuess(guess);
        double? distanceKm = boundedGuess is null
            ? null
            : HaversineDistanceKm(
                boundedGuess.Latitude,
                boundedGuess.Longitude,
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
            boundedGuess,
            distanceKm is null ? 0 : ScoreFromDistance(distanceKm.Value),
            distanceKm,
            resolution,
            timed,
            BuildMedia(GetRoundMedia(location, selectedMedia)),
            BuildVisualSources(location),
            location.Clues
                .Select(clue => new ChallengeClueDto(clue.Label, clue.Value, clue.Confidence))
                .ToList());
    }

    public static ChallengeMediaDto? BuildMedia(SeedMedia? media)
    {
        return media is null
            ? null
            : new ChallengeMediaDto(
                media.SourceProvider,
                media.ImageUrl,
                media.ImageSourceUrl,
                media.ImageAttribution,
                media.ImageLicense,
                media.ImageLicenseUrl,
                media.StreetViewProvider,
                media.StreetViewUrl,
                media.VerifiedAt);
    }

    public static IReadOnlyList<ChallengeMediaDto> BuildVisualSources(SeedLocation location)
    {
        return location.GetVisualSources()
            .Select(BuildMedia)
            .OfType<ChallengeMediaDto>()
            .ToList();
    }

    public static SeedMedia? GetPrimaryMedia(SeedLocation location)
    {
        return location.Media ?? location.GetVisualSources().FirstOrDefault();
    }

    public static SeedMedia? GetRoundMedia(SeedLocation location, SeedMedia? selectedMedia)
    {
        return selectedMedia ?? GetPrimaryMedia(location);
    }

    public static GuessCoordinatesDto ClampGuess(GuessCoordinatesDto guess)
    {
        const double minLat = 34;
        const double maxLat = 72;
        const double minLng = -25;
        const double maxLng = 45;

        return new GuessCoordinatesDto(
            Math.Clamp(guess.Latitude, minLat, maxLat),
            Math.Clamp(guess.Longitude, minLng, maxLng),
            guess.Label);
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
