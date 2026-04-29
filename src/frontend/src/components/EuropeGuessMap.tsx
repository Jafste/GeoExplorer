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

const EUROPE_BOUNDS = L.latLngBounds([34, -25], [72, 45]);
const EUROPE_CENTER = L.latLng(51.2, 10.5);

function formatCoordinates(latitude: number, longitude: number) {
  return `${latitude.toFixed(2)} / ${longitude.toFixed(2)}`;
}

function buildGuessLabel(latitude: number, longitude: number) {
  return `Pino em ${formatCoordinates(latitude, longitude)}`;
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
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const canInteract = !disabled && typeof onGuessChange === "function";

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) {
      return;
    }

    const map = L.map(mapElementRef.current, {
      attributionControl: true,
      center: EUROPE_CENTER,
      maxBounds: EUROPE_BOUNDS.pad(0.18),
      maxBoundsViscosity: 0.85,
      maxZoom: 13,
      minZoom: 3,
      zoom: 4,
      zoomControl: false,
    });

    map.attributionControl.setPrefix("");

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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

    setMapInteractions(map, canInteract);
    map.getContainer().style.cursor = canInteract ? "crosshair" : "default";
  }, [canInteract]);

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
      L.polyline(
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
        icon: createPinIcon("map-leaflet-actual", showMarkerLabels ? "Local correto" : undefined),
        keyboard: false,
        title: actual.label,
      }).addTo(layer);
    }

    if (guess) {
      L.marker([guess.latitude, guess.longitude], {
        icon: createPinIcon("map-leaflet-guess", showMarkerLabels ? "Teu pino" : undefined),
        keyboard: false,
        title: guess.label,
      }).addTo(layer);
    }
  }, [actual, guess, hotspots, showComparisonLine, showMarkerLabels]);

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
        className={`guess-map-surface guess-map-surface--leaflet${disabled ? " is-disabled" : ""}${compact ? " is-compact" : ""}`}
        aria-label="Mapa real da Europa para escolha do palpite"
      >
        <div className="guess-map-leaflet" ref={mapElementRef} />

        {showComparisonLine && comparisonDistanceKm !== null && guess && actual ? (
          <div className="map-distance-callout">
            <strong>{comparisonDistanceKm.toFixed(1)} km</strong>
          </div>
        ) : null}
      </div>

      {showFooter ? (
        <div className="guess-map-footer">
          <div>
            <span className="muted-eyebrow">Mapa real</span>
            <strong>OpenStreetMap</strong>
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
