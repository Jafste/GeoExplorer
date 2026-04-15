import type { GuessCoordinates } from "../types/game";

interface EuropeGuessMapProps {
  guess: GuessCoordinates | null;
  compact?: boolean;
  disabled?: boolean;
  onGuessChange: (guess: GuessCoordinates) => void;
  showFooter?: boolean;
}

const EUROPE_BOUNDS = {
  minLat: 34,
  maxLat: 72,
  minLng: -25,
  maxLng: 45,
};

const REFERENCE_CITIES = [
  { label: "Porto", latitude: 41.1496, longitude: -8.611, featured: true },
  { label: "Sevilha", latitude: 37.3891, longitude: -5.9845, featured: true },
  { label: "Bruges", latitude: 51.2093, longitude: 3.2247, featured: false },
  { label: "Praga", latitude: 50.0755, longitude: 14.4378, featured: false },
  { label: "Budapeste", latitude: 47.4979, longitude: 19.0402, featured: false },
  { label: "Tallinn", latitude: 59.437, longitude: 24.7536, featured: true },
  { label: "Estocolmo", latitude: 59.3293, longitude: 18.0686, featured: true },
  { label: "Innsbruck", latitude: 47.2692, longitude: 11.4041, featured: false },
];

function projectGuess(guess: GuessCoordinates) {
  const x = ((guess.longitude - EUROPE_BOUNDS.minLng) / (EUROPE_BOUNDS.maxLng - EUROPE_BOUNDS.minLng)) * 100;
  const y = ((EUROPE_BOUNDS.maxLat - guess.latitude) / (EUROPE_BOUNDS.maxLat - EUROPE_BOUNDS.minLat)) * 100;
  return { x, y };
}

function findClosestReference(latitude: number, longitude: number) {
  let bestCity = REFERENCE_CITIES[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const city of REFERENCE_CITIES) {
    const distance = Math.hypot(city.latitude - latitude, city.longitude - longitude);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestCity = city;
    }
  }

  return bestCity.label;
}

export function EuropeGuessMap({
  guess,
  compact = false,
  disabled = false,
  onGuessChange,
  showFooter = true,
}: EuropeGuessMapProps) {
  const marker = guess ? projectGuess(guess) : null;

  return (
    <div className={`guess-map-card${compact ? " is-compact" : ""}`}>
      <div
        className={`guess-map-surface${disabled ? " is-disabled" : ""}${compact ? " is-compact" : ""}`}
        aria-label="Mapa interativo da Europa para escolha do palpite"
        onClick={(event) => {
          if (disabled) {
            return;
          }

          const bounds = event.currentTarget.getBoundingClientRect();
          const relativeX = (event.clientX - bounds.left) / bounds.width;
          const relativeY = (event.clientY - bounds.top) / bounds.height;
          const latitude =
            EUROPE_BOUNDS.maxLat - relativeY * (EUROPE_BOUNDS.maxLat - EUROPE_BOUNDS.minLat);
          const longitude =
            EUROPE_BOUNDS.minLng + relativeX * (EUROPE_BOUNDS.maxLng - EUROPE_BOUNDS.minLng);
          const reference = findClosestReference(latitude, longitude);

          onGuessChange({
            latitude: Number(latitude.toFixed(4)),
            longitude: Number(longitude.toFixed(4)),
            label: reference,
          });
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            (event.currentTarget as HTMLDivElement).click();
          }
        }}
      >
        <div className="map-grid"></div>
        <div className="map-sea-glow map-sea-glow-a"></div>
        <div className="map-sea-glow map-sea-glow-b"></div>

        <div className="map-region map-region-iberia"></div>
        <div className="map-region map-region-france"></div>
        <div className="map-region map-region-britain"></div>
        <div className="map-region map-region-italy"></div>
        <div className="map-region map-region-balkans"></div>
        <div className="map-region map-region-scandinavia"></div>
        <div className="map-region map-region-baltics"></div>
        <div className="map-region map-region-greece"></div>

        <div className="map-route map-route-a"></div>
        <div className="map-route map-route-b"></div>
        <div className="map-route map-route-c"></div>

        {REFERENCE_CITIES.map((city) => {
          const point = projectGuess({
            latitude: city.latitude,
            longitude: city.longitude,
            label: city.label,
          });

          return (
            <div
              className={`map-reference${city.featured ? " is-featured" : ""}`}
              key={city.label}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              title={city.label}
            >
              <span></span>
              <small>{city.label}</small>
            </div>
          );
        })}

        {marker ? (
          <div className="map-marker" style={{ left: `${marker.x}%`, top: `${marker.y}%` }}>
            <div className="map-marker-pulse"></div>
            <div className="map-marker-core"></div>
          </div>
        ) : null}
      </div>

      {showFooter ? (
        <div className="guess-map-footer">
          <div>
            <span className="muted-eyebrow">Mapa estilizado</span>
            <strong>Europa operacional</strong>
          </div>

          <div className="guess-map-status">
            {guess ? (
              <>
                <strong>{guess.label}</strong>
                <span>
                  {guess.latitude.toFixed(2)} / {guess.longitude.toFixed(2)}
                </span>
              </>
            ) : (
              <>
                <strong>Sem palpite ainda</strong>
                <span>Clica no mapa para definir coordenadas aproximadas.</span>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
