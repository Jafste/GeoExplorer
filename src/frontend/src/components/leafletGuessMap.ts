import L from "leaflet";
import type { GuessCoordinates } from "../types/game";
import {
  getComparisonFitPadding,
  getComparisonMaxZoom,
} from "./europeGuessMapFit";
import { EUROPE_PLAYABLE_BOUNDS, EUROPE_VIEW_BOUNDS } from "../app/guessMapBounds";
import { escapeLeafletHtml } from "./leafletHtml";

export interface MapHotspot {
  label: string;
  latitude: number;
  longitude: number;
  tone?: "primary" | "neutral" | "danger";
  value?: string;
}

export const EUROPE_BOUNDS = L.latLngBounds(
  [EUROPE_PLAYABLE_BOUNDS.minLatitude, EUROPE_PLAYABLE_BOUNDS.minLongitude],
  [EUROPE_PLAYABLE_BOUNDS.maxLatitude, EUROPE_PLAYABLE_BOUNDS.maxLongitude]
);

const EUROPE_INITIAL_VIEW_BOUNDS = L.latLngBounds(
  [EUROPE_VIEW_BOUNDS.minLatitude, EUROPE_VIEW_BOUNDS.minLongitude],
  [EUROPE_VIEW_BOUNDS.maxLatitude, EUROPE_VIEW_BOUNDS.maxLongitude]
);

const EUROPE_CENTER = L.latLng(51.2, 10.5);
const MAP_TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const MAP_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

function createPinIcon(className: string, label?: string) {
  return L.divIcon({
    className: "map-leaflet-pin-wrapper",
    html: `
      <span class="${className}">
        <span class="map-leaflet-pin-core"></span>
        ${label ? `<small>${escapeLeafletHtml(label)}</small>` : ""}
      </span>
    `,
    iconAnchor: [12, 12],
    iconSize: [24, 24],
  });
}

export function createEuropeLeafletMap(element: HTMLElement) {
  const map = L.map(element, {
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
    wheelPxPerZoomLevel: 7 / 3,
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

  const markerLayer = L.layerGroup().addTo(map);
  map.fitBounds(EUROPE_INITIAL_VIEW_BOUNDS, { padding: [12, 12] });

  return { map, markerLayer };
}

export function setMapInteractions(map: L.Map, enabled: boolean) {
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

interface SyncGuessMapMarkersOptions {
  actual: GuessCoordinates | null;
  actualLabelSide: "left" | "right";
  comparisonDistanceKm: number | null;
  guess: GuessCoordinates | null;
  guessLabelSide: "left" | "right";
  hotspots: MapHotspot[];
  isCloseComparison: boolean;
  layer: L.LayerGroup;
  showComparisonLine: boolean;
  shouldShowMarkerLabels: boolean;
}

export function syncGuessMapMarkers({
  actual,
  actualLabelSide,
  comparisonDistanceKm,
  guess,
  guessLabelSide,
  hotspots,
  isCloseComparison,
  layer,
  showComparisonLine,
  shouldShowMarkerLabels,
}: SyncGuessMapMarkersOptions) {
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
}

interface ScheduleFitToMarkersOptions {
  comparisonDistanceKm: number | null;
  isCurrentMap: () => boolean;
  map: L.Map;
  markerPoints: GuessCoordinates[];
}

export function scheduleFitToMarkers({
  comparisonDistanceKm,
  isCurrentMap,
  map,
  markerPoints,
}: ScheduleFitToMarkersOptions) {
  const points = markerPoints.map((point) => L.latLng(point.latitude, point.longitude));
  let cancelled = false;
  const fitMarkers = () => {
    if (cancelled || !isCurrentMap() || !map.getContainer().isConnected) {
      return;
    }

    map.invalidateSize({ pan: false });

    if (points.length >= 2) {
      map.fitBounds(L.latLngBounds(points), {
        animate: false,
        maxZoom: getComparisonMaxZoom(comparisonDistanceKm),
        padding: getComparisonFitPadding(comparisonDistanceKm),
      });
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 10, { animate: false });
    }
  };

  fitMarkers();
  const fitFrame = window.requestAnimationFrame(fitMarkers);
  const fitTimers = [80, 240, 640].map((delay) => window.setTimeout(fitMarkers, delay));
  const fitObserver =
    "ResizeObserver" in window ? new ResizeObserver(fitMarkers) : null;

  fitObserver?.observe(map.getContainer());

  return () => {
    cancelled = true;
    window.cancelAnimationFrame(fitFrame);
    fitTimers.forEach((timer) => window.clearTimeout(timer));
    fitObserver?.disconnect();
  };
}
