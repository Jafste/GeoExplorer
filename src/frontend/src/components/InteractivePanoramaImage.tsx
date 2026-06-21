import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type WheelEvent,
} from "react";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { IconButton } from "./ui/Button";

type InteractiveImageMode = "360" | "panorama" | "photo";

interface InteractivePanoramaImageProps {
  fit?: "contain" | "cover";
  imageUrl: string;
  loaded: boolean;
  mode: InteractiveImageMode;
}

interface PanoramaViewState {
  x: number;
  y: number;
  zoom: number;
}

interface PanoramaWheelZoomInput {
  deltaMode: number;
  deltaY: number;
}

interface PointerPosition {
  clientX: number;
  clientY: number;
}

interface PinchState {
  startCenterX: number;
  startCenterY: number;
  startDistance: number;
  startView: PanoramaViewState;
}

function getInitialPanoramaView(mode: InteractiveImageMode): PanoramaViewState {
  return {
    x: 50,
    y: 50,
    zoom: mode === "360" ? 1.28 : mode === "panorama" ? 1.16 : 1,
  };
}

export function InteractivePanoramaImage({
  fit = "cover",
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
  const pinchState = useRef<PinchState | null>(null);
  const pointerState = useRef(new Map<number, PointerPosition>());
  const viewRef = useRef(view);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    setView(getInitialPanoramaView(mode));
    dragState.current = null;
    pinchState.current = null;
    pointerState.current.clear();
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
    pointerState.current.set(event.pointerId, {
      clientX: event.clientX,
      clientY: event.clientY,
    });

    if (pointerState.current.size >= 2) {
      dragState.current = null;
      pinchState.current = createPinchState(pointerState.current, viewRef.current);
      return;
    }

    dragState.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startView: view,
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!pointerState.current.has(event.pointerId)) {
      return;
    }

    pointerState.current.set(event.pointerId, {
      clientX: event.clientX,
      clientY: event.clientY,
    });

    const pinch = pinchState.current;
    if (pinch && pointerState.current.size >= 2) {
      event.preventDefault();
      const bounds = event.currentTarget.getBoundingClientRect();
      const pointers = Array.from(pointerState.current.values()).slice(0, 2);
      const currentDistance = getPointerDistance(pointers[0], pointers[1]);
      const currentCenter = getPointerCenter(pointers[0], pointers[1]);
      const horizontalStep = bounds.width > 0
        ? ((currentCenter.clientX - pinch.startCenterX) / bounds.width) * 92
        : 0;
      const verticalStep = bounds.height > 0
        ? ((currentCenter.clientY - pinch.startCenterY) / bounds.height) * 46
        : 0;

      setView({
        x: clampInteractiveImageX(pinch.startView.x - horizontalStep / pinch.startView.zoom, mode),
        y: clampInteractiveImageY(pinch.startView.y - verticalStep / pinch.startView.zoom, mode),
        zoom: getPinchZoom(pinch.startView.zoom, pinch.startDistance, currentDistance),
      });
      return;
    }

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
      x: clampInteractiveImageX(drag.startView.x - horizontalStep / drag.startView.zoom, mode),
      y: clampInteractiveImageY(drag.startView.y - verticalStep / drag.startView.zoom, mode),
      zoom: drag.startView.zoom,
    });
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    pointerState.current.delete(event.pointerId);
    pinchState.current = null;

    const remainingPointer = Array.from(pointerState.current.entries())[0];
    if (remainingPointer) {
      dragState.current = {
        pointerId: remainingPointer[0],
        startClientX: remainingPointer[1].clientX,
        startClientY: remainingPointer[1].clientY,
        startView: viewRef.current,
      };
      return;
    }

    dragState.current = null;
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    updateZoom(getPanoramaWheelZoomDelta(event));
  }

  const backgroundStyle = {
    backgroundImage: `url("${imageUrl}")`,
    backgroundPosition: `${view.x}% ${view.y}%`,
    backgroundSize: mode === "photo" ? fit : "cover",
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
        onWheel={handleWheel}
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

export function getPanoramaWheelZoomDelta(event: PanoramaWheelZoomInput) {
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 120 : 1;

  return clamp(-event.deltaY * unit * 0.006, -0.28, 0.28);
}

export function getPinchZoom(startZoom: number, startDistance: number, currentDistance: number) {
  if (startDistance <= 0) {
    return startZoom;
  }

  return clamp(startZoom * (currentDistance / startDistance), 1, 2.35);
}

export function clampInteractiveImageX(value: number, mode: InteractiveImageMode) {
  if (mode === "360" || mode === "photo") {
    return clamp(value, 0, 100);
  }

  return clamp(value, 10, 90);
}

function clampInteractiveImageY(value: number, mode: InteractiveImageMode) {
  return clamp(value, mode === "photo" ? 0 : 18, mode === "photo" ? 100 : 82);
}

function createPinchState(
  pointers: Map<number, PointerPosition>,
  startView: PanoramaViewState
): PinchState | null {
  const [first, second] = Array.from(pointers.values()).slice(0, 2);

  if (!first || !second) {
    return null;
  }

  const center = getPointerCenter(first, second);

  return {
    startCenterX: center.clientX,
    startCenterY: center.clientY,
    startDistance: getPointerDistance(first, second),
    startView,
  };
}

function getPointerDistance(first: PointerPosition, second: PointerPosition) {
  return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
}

function getPointerCenter(first: PointerPosition, second: PointerPosition) {
  return {
    clientX: (first.clientX + second.clientX) / 2,
    clientY: (first.clientY + second.clientY) / 2,
  };
}
