import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { GuessCoordinates } from "../types/game";

export interface MapHotspot {
  label: string;
  latitude: number;
  longitude: number;
  tone?: "primary" | "neutral" | "danger";
  value?: string;
}

interface EuropeGuessMapProps {
  allowExploration?: boolean;
  actual?: GuessCoordinates | null;
  comparisonDistanceKm?: number | null;
  guess: GuessCoordinates | null;
  compact?: boolean;
  disabled?: boolean;
  fitToMarkers?: boolean;
  hotspots?: MapHotspot[];
  onGuessChange?: (guess: GuessCoordinates) => void;
  showComparisonLine?: boolean;
  showFooter?: boolean;
  showMarkerLabels?: boolean;
}

const EUROPE_BOUNDS = L.latLngBounds([34, -25], [72, 45]);
const EUROPE_CENTER = L.latLng(51.2, 10.5);
const MAP_TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const MAP_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

function formatCoordinates(latitude: number, longitude: number) {
  return `${latitude.toFixed(2)} / ${longitude.toFixed(2)}`;
}

function buildGuessLabel(latitude: number, longitude: number) {
  return "Pino marcado";
}

function createPinIcon(className: string, label?: string) {
  return L.divIcon({
    className: "map-leaflet-pin-wrapper",
    html: `
      <span class="${className}">
        <span class="map-leaflet-pin-core"></span>
        ${label ? `<small>${label}</small>` : ""}
      </span>
    `,
    iconAnchor: [12, 12],
    iconSize: [24, 24],
  });
}

function getComparisonMaxZoom(distanceKm: number | null) {
  if (distanceKm === null) {
    return 11;
  }

  const clampedDistance = Math.max(1, Math.min(distanceKm, 420));
  const zoom = 20 - Math.log2(clampedDistance + 1) * 1.55;

  return Math.max(7, Math.min(18, Math.round(zoom)));
}

function getComparisonFitPadding(distanceKm: number | null): L.PointExpression {
  if (distanceKm === null) {
    return [72, 72];
  }

  const clampedDistance = Math.max(1, Math.min(distanceKm, 420));
  const padding = 42 + Math.log2(clampedDistance + 1) * 7;
  const clampedPadding = Math.max(48, Math.min(96, Math.round(padding)));

  return [clampedPadding, clampedPadding];
}

function setMapInteractions(map: L.Map, enabled: boolean) {
  if (enabled) {
    map.dragging.enable();
    map.scrollWheelZoom.enable();
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();
    return;
  }

  map.dragging.disable();
  map.scrollWheelZoom.disable();
  map.touchZoom.disable();
  map.doubleClickZoom.disable();
  map.boxZoom.disable();
  map.keyboard.disable();
}

export function EuropeGuessMap({
  allowExploration = false,
  actual = null,
  comparisonDistanceKm = null,
  guess,
  compact = false,
  disabled = false,
  fitToMarkers = false,
  hotspots = [],
  onGuessChange,
  showComparisonLine = false,
  showFooter = true,
  showMarkerLabels = false,
}: EuropeGuessMapProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const canInteract = !disabled && typeof onGuessChange === "function";
  const canExplore = canInteract || allowExploration;
  const showDisabledState = disabled && !allowExploration;
  const isCloseComparison = comparisonDistanceKm !== null && comparisonDistanceKm <= 140;
  const shouldShowMarkerLabels = showMarkerLabels && !isCloseComparison;

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) {
      return;
    }

    const map = L.map(mapElementRef.current, {
      attributionControl: true,
      center: EUROPE_CENTER,
      maxBounds: EUROPE_BOUNDS.pad(0.18),
      maxBoundsViscosity: 0.85,
      maxZoom: 18,
      minZoom: 3,
      zoom: 4,
      zoomControl: false,
    });

    map.attributionControl.setPrefix("");

    L.tileLayer(MAP_TILE_URL, {
      attribution: MAP_TILE_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    L.control
      .zoom({
        position: "bottomright",
      })
      .addTo(map);

    markerLayerRef.current = L.layerGroup().addTo(map);
    map.fitBounds(EUROPE_BOUNDS, { padding: [12, 12] });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    setMapInteractions(map, canExplore);
    map.getContainer().style.cursor = canInteract ? "crosshair" : canExplore ? "grab" : "default";
  }, [canExplore, canInteract]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const handleClick = (event: L.LeafletMouseEvent) => {
      if (!canInteract || !EUROPE_BOUNDS.contains(event.latlng)) {
        return;
      }

      const latitude = Number(event.latlng.lat.toFixed(4));
      const longitude = Number(event.latlng.lng.toFixed(4));

      onGuessChange?.({
        latitude,
        longitude,
        label: buildGuessLabel(latitude, longitude),
      });
    };

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [canInteract, onGuessChange]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = markerLayerRef.current;
    if (!map || !layer) {
      return;
    }

    layer.clearLayers();

    if (showComparisonLine && guess && actual) {
      const comparisonLine = L.polyline(
        [
          [guess.latitude, guess.longitude],
          [actual.latitude, actual.longitude],
        ],
        {
          className: "map-leaflet-comparison-line",
          color: "#d1ff26",
          dashArray: "7 8",
          opacity: 0.9,
          weight: 2,
        }
      ).addTo(layer);

      if (comparisonDistanceKm !== null) {
        const midpoint = L.latLng(
          (guess.latitude + actual.latitude) / 2,
          (guess.longitude + actual.longitude) / 2
        );

        comparisonLine
          .bindTooltip(`${comparisonDistanceKm.toFixed(1)} km`, {
            className: `map-distance-tooltip${isCloseComparison ? " map-distance-tooltip--close" : ""}`,
            direction: isCloseComparison ? "top" : "center",
            offset: isCloseComparison ? [0, -18] : [0, 0],
            opacity: 1,
            permanent: true,
          })
          .openTooltip(midpoint);
      }
    }

    for (const hotspot of hotspots) {
      L.marker([hotspot.latitude, hotspot.longitude], {
        icon: createPinIcon(`map-leaflet-hotspot map-leaflet-hotspot--${hotspot.tone ?? "neutral"}`),
        keyboard: false,
        title: hotspot.label,
      })
        .bindTooltip(`${hotspot.label}${hotspot.value ? ` · ${hotspot.value}` : ""}`, {
          direction: "top",
          opacity: 0.92,
        })
        .addTo(layer);
    }

    if (actual) {
      L.marker([actual.latitude, actual.longitude], {
        icon: createPinIcon("map-leaflet-actual", shouldShowMarkerLabels ? "Local correto" : undefined),
        keyboard: false,
        title: actual.label,
      }).addTo(layer);
    }

    if (guess) {
      L.marker([guess.latitude, guess.longitude], {
        icon: createPinIcon("map-leaflet-guess", shouldShowMarkerLabels ? "Teu pino" : undefined),
        keyboard: false,
        title: guess.label,
      }).addTo(layer);
    }
    if (fitToMarkers) {
      const markerPoints = [guess, actual]
        .filter((point): point is GuessCoordinates => Boolean(point))
        .map((point) => L.latLng(point.latitude, point.longitude));

      const fitMarkers = (animate: boolean) => {
        map.invalidateSize();

        if (markerPoints.length >= 2) {
          map.fitBounds(L.latLngBounds(markerPoints), {
            animate,
            maxZoom: getComparisonMaxZoom(comparisonDistanceKm),
            padding: getComparisonFitPadding(comparisonDistanceKm),
          });
          return;
        }

        if (markerPoints.length === 1) {
          map.setView(markerPoints[0], 10, { animate });
        }
      };

      fitMarkers(true);
      window.setTimeout(() => fitMarkers(false), 180);
    }
  }, [actual, comparisonDistanceKm, fitToMarkers, guess, hotspots, showComparisonLine, showMarkerLabels]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    window.setTimeout(() => {
      map.invalidateSize();
    }, 160);
  }, [compact]);

  return (
    <div className={`guess-map-card${compact ? " is-compact" : ""}`}>
      <div
        className={`guess-map-surface guess-map-surface--leaflet${showDisabledState ? " is-disabled" : ""}${compact ? " is-compact" : ""}`}
        aria-label="Mapa real da Europa para escolha do palpite"
      >
        <div className="guess-map-leaflet" ref={mapElementRef} />

      </div>

      {showFooter ? (
        <div className="guess-map-footer">
          <div>
            <span className="muted-eyebrow">Mapa real</span>
            <strong>CARTO / OpenStreetMap</strong>
          </div>

          <div className="guess-map-status">
            {guess ? (
              <>
                <strong>{guess.label}</strong>
                <span>{formatCoordinates(guess.latitude, guess.longitude)}</span>
              </>
            ) : (
              <>
                <strong>Sem palpite ainda</strong>
                <span>{canInteract ? "Clica no mapa real para definir o teu pino." : "Mapa real da Europa."}</span>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
