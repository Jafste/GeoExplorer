import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { IconButton } from "./ui/Button";

type InteractivePanoramaMode = "360" | "panorama";

interface InteractivePanoramaImageProps {
  imageUrl: string;
  loaded: boolean;
  mode: InteractivePanoramaMode;
}

interface PanoramaViewState {
  x: number;
  y: number;
  zoom: number;
}

function getInitialPanoramaView(mode: InteractivePanoramaMode): PanoramaViewState {
  return {
    x: 50,
    y: 50,
    zoom: mode === "360" ? 1.28 : 1.16,
  };
}

export function InteractivePanoramaImage({
  imageUrl,
  loaded,
  mode,
}: InteractivePanoramaImageProps) {
  const [view, setView] = useState<PanoramaViewState>(() => getInitialPanoramaView(mode));
  const dragState = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startView: PanoramaViewState;
  } | null>(null);

  useEffect(() => {
    setView(getInitialPanoramaView(mode));
    dragState.current = null;
  }, [imageUrl, mode]);

  function updateZoom(delta: number) {
    setView((current) => ({
      ...current,
      zoom: clamp(current.zoom + delta, 1, 2.35),
    }));
  }

  function resetView() {
    setView(getInitialPanoramaView(mode));
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startView: view,
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const deltaX = event.clientX - drag.startClientX;
    const deltaY = event.clientY - drag.startClientY;
    const horizontalStep = bounds.width > 0 ? (deltaX / bounds.width) * 92 : 0;
    const verticalStep = bounds.height > 0 ? (deltaY / bounds.height) * 46 : 0;

    setView({
      x: clampPanoramaX(drag.startView.x - horizontalStep / drag.startView.zoom, mode),
      y: clamp(drag.startView.y - verticalStep / drag.startView.zoom, 18, 82),
      zoom: drag.startView.zoom,
    });
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (dragState.current?.pointerId === event.pointerId) {
      dragState.current = null;
    }
  }

  const backgroundStyle = {
    backgroundImage: `url("${imageUrl}")`,
    backgroundPosition: `${view.x}% ${view.y}%`,
    backgroundSize: "cover",
    transform: `scale(${view.zoom})`,
    transformOrigin: `${view.x}% ${view.y}%`,
  } as CSSProperties;

  return (
    <>
      <div
        aria-hidden="true"
        className={`scene-panorama-viewport${loaded ? " is-loaded" : " is-loading"}`}
        onPointerCancel={handlePointerEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        style={backgroundStyle}
      />
      <div className="scene-panorama-controls">
        <IconButton
          label="Aproximar imagem"
          className="scene-panorama-control"
          onClick={() => updateZoom(0.18)}
        >
          <ZoomIn size={16} strokeWidth={2.4} />
        </IconButton>
        <IconButton
          label="Afastar imagem"
          className="scene-panorama-control"
          onClick={() => updateZoom(-0.18)}
        >
          <ZoomOut size={16} strokeWidth={2.4} />
        </IconButton>
        <IconButton
          label="Repor vista"
          className="scene-panorama-control"
          onClick={resetView}
        >
          <RotateCcw size={16} strokeWidth={2.4} />
        </IconButton>
      </div>
    </>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampPanoramaX(value: number, mode: InteractivePanoramaMode) {
  if (mode === "360") {
    return wrapPercent(value);
  }

  return clamp(value, 10, 90);
}

function wrapPercent(value: number) {
  return ((value % 100) + 100) % 100;
}
