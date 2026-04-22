import type { GuessCoordinates } from "../types/game";

export interface MapHotspot {
  label: string;
  latitude: number;
  longitude: number;
  tone?: "primary" | "neutral" | "danger";
  value?: string;
}

interface EuropeGuessMapProps {
  actual?: GuessCoordinates | null;
  comparisonDistanceKm?: number | null;
  guess: GuessCoordinates | null;
  compact?: boolean;
  disabled?: boolean;
  hotspots?: MapHotspot[];
  onGuessChange?: (guess: GuessCoordinates) => void;
  showComparisonLine?: boolean;
  showFooter?: boolean;
  showMarkerLabels?: boolean;
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
  actual = null,
  comparisonDistanceKm = null,
  guess,
  compact = false,
  disabled = false,
  hotspots = [],
  onGuessChange,
  showComparisonLine = false,
  showFooter = true,
  showMarkerLabels = false,
}: EuropeGuessMapProps) {
  const marker = guess ? projectGuess(guess) : null;
  const actualMarker = actual ? projectGuess(actual) : null;
  const canInteract = !disabled && typeof onGuessChange === "function";

  return (
    <div className={`guess-map-card${compact ? " is-compact" : ""}`}>
      <div
        className={`guess-map-surface${disabled ? " is-disabled" : ""}${compact ? " is-compact" : ""}`}
        aria-label="Mapa interativo da Europa para escolha do palpite"
        onClick={(event) => {
          if (!canInteract) {
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

          onGuessChange?.({
            latitude: Number(latitude.toFixed(4)),
            longitude: Number(longitude.toFixed(4)),
            label: reference,
          });
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (canInteract && (event.key === "Enter" || event.key === " ")) {
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

        {showComparisonLine && marker && actualMarker ? (
          <svg
            aria-hidden="true"
            className="map-comparison-layer"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <line
              className="map-comparison-line"
              x1={marker.x}
              x2={actualMarker.x}
              y1={marker.y}
              y2={actualMarker.y}
            />
          </svg>
        ) : null}

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

        {hotspots.map((hotspot) => {
          const point = projectGuess({
            latitude: hotspot.latitude,
            longitude: hotspot.longitude,
            label: hotspot.label,
          });

          return (
            <div
              className={`map-hotspot map-hotspot--${hotspot.tone ?? "neutral"}`}
              key={`${hotspot.label}-${hotspot.latitude}-${hotspot.longitude}`}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
            >
              <span className="map-hotspot-core" />
              <small>
                {hotspot.label}
                {hotspot.value ? ` · ${hotspot.value}` : ""}
              </small>
            </div>
          );
        })}

        {marker ? (
          <div className="map-marker" style={{ left: `${marker.x}%`, top: `${marker.y}%` }}>
            <div className="map-marker-pulse"></div>
            <div className="map-marker-core"></div>
            {showMarkerLabels ? <small className="map-marker-label">Teu pino</small> : null}
          </div>
        ) : null}

        {actualMarker ? (
          <div className="map-actual-marker" style={{ left: `${actualMarker.x}%`, top: `${actualMarker.y}%` }}>
            <div className="map-actual-core"></div>
            {showMarkerLabels ? <small className="map-marker-label map-marker-label--actual">Local correto</small> : null}
          </div>
        ) : null}

        {showComparisonLine && comparisonDistanceKm !== null && marker && actualMarker ? (
          <div className="map-distance-callout">
            <strong>{comparisonDistanceKm.toFixed(1)} km</strong>
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
                <span>{canInteract ? "Clica no mapa para definir coordenadas aproximadas." : "Visualização estratégica da Europa."}</span>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
