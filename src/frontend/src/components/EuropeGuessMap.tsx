import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import type { GuessCoordinates } from "../types/game";
import { getComparisonLabelSides } from "./europeGuessMapFit";
import { isWithinEuropePlayableBounds } from "../app/guessMapBounds";
import {
  createEuropeLeafletMap,
  scheduleFitToMarkers,
  setMapInteractions,
  syncGuessMapMarkers,
  type MapHotspot,
} from "./leafletGuessMap";

export type { MapHotspot } from "./leafletGuessMap";

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

function formatCoordinates(latitude: number, longitude: number) {
  return `${latitude.toFixed(2)} / ${longitude.toFixed(2)}`;
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
  const mapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<LayerGroup | null>(null);
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

    const { map, markerLayer } = createEuropeLeafletMap(mapElementRef.current);
    markerLayerRef.current = markerLayer;
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
      if (
        !canInteract ||
        !isWithinEuropePlayableBounds({
          latitude: event.latlng.lat,
          longitude: event.latlng.lng,
        })
      ) {
        return;
      }

      const latitude = Number(event.latlng.lat.toFixed(4));
      const longitude = Number(event.latlng.lng.toFixed(4));

      onGuessChange?.({
        latitude,
        longitude,
        label: "Pino marcado",
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

    const syncMarkers = () => {
      syncGuessMapMarkers({
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
      });
    };

    syncMarkers();

    if (fitToMarkers) {
      const markerPoints = [
        guess,
        actual,
        ...hotspots.map((hotspot) => ({
          latitude: hotspot.latitude,
          longitude: hotspot.longitude,
          label: hotspot.label,
        })),
      ]
        .filter((point): point is GuessCoordinates => Boolean(point));

      return scheduleFitToMarkers({
        comparisonDistanceKm,
        isCurrentMap: () => mapRef.current === map,
        map,
        markerPoints,
        onAfterFit: syncMarkers,
      });
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
