import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { GuessCoordinates } from "../types/game";
import { getComparisonFitPadding, getComparisonLabelSides, getComparisonMaxZoom } from "./europeGuessMapFit";

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
  const { actualLabelSide, guessLabelSide } = getComparisonLabelSides(guess, actual);

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) {
      return;
    }

    const map = L.map(mapElementRef.current, {
      attributionControl: true,
      center: EUROPE_CENTER,
      fadeAnimation: true,
      markerZoomAnimation: true,
      maxBounds: EUROPE_BOUNDS.pad(0.18),
      maxBoundsViscosity: 0.85,
      maxZoom: 18,
      minZoom: 3,
      zoom: 4,
      zoomAnimation: true,
      zoomControl: false,
      zoomDelta: 0.5,
      zoomSnap: 0.1,
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
      map.stop();
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
        icon: createPinIcon(
          `map-leaflet-actual map-leaflet-pin-label--${actualLabelSide}`,
          shouldShowMarkerLabels ? "Local correto" : undefined
        ),
        keyboard: false,
        title: actual.label,
      }).addTo(layer);
    }

    if (guess) {
      L.marker([guess.latitude, guess.longitude], {
        icon: createPinIcon(
          `map-leaflet-guess map-leaflet-pin-label--${guessLabelSide}`,
          shouldShowMarkerLabels ? "Teu pino" : undefined
        ),
        keyboard: false,
        title: guess.label,
      }).addTo(layer);
    }
    if (fitToMarkers) {
      const markerPoints = [guess, actual]
        .filter((point): point is GuessCoordinates => Boolean(point))
        .map((point) => L.latLng(point.latitude, point.longitude));

      let cancelled = false;
      const fitMarkers = (animate: boolean) => {
        if (cancelled || mapRef.current !== map || !map.getContainer().isConnected) {
          return;
        }

        map.invalidateSize({ pan: false });

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

      fitMarkers(false);
      const fitFrame = window.requestAnimationFrame(() => fitMarkers(false));
      const fitTimers = [80, 240, 640].map((delay) => window.setTimeout(() => fitMarkers(false), delay));
      const fitObserver =
        "ResizeObserver" in window ? new ResizeObserver(() => fitMarkers(false)) : null;

      fitObserver?.observe(map.getContainer());

      return () => {
        cancelled = true;
        window.cancelAnimationFrame(fitFrame);
        fitTimers.forEach((timer) => window.clearTimeout(timer));
        fitObserver?.disconnect();
      };
    }
  }, [
    actual,
    actualLabelSide,
    comparisonDistanceKm,
    fitToMarkers,
    guess,
    guessLabelSide,
    hotspots,
    showComparisonLine,
    showMarkerLabels,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    let cancelled = false;
    const resizeTimer = window.setTimeout(() => {
      if (cancelled || mapRef.current !== map || !map.getContainer().isConnected) {
        return;
      }

      map.invalidateSize();
    }, 160);

    return () => {
      cancelled = true;
      window.clearTimeout(resizeTimer);
    };
  }, [compact]);

  return (
    <div className={`guess-map-card${compact ? " is-compact" : ""}`}>
      <div
        className={`guess-map-surface guess-map-surface--leaflet${showDisabledState ? " is-disabled" : ""}${compact ? " is-compact" : ""}`}
        aria-label="Mapa real da Europa para marcar a posição"
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
                <strong>Sem posição ainda</strong>
                <span>{canInteract ? "Clica no mapa real para definir a tua posição." : "Mapa real da Europa."}</span>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
