import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import type { ChallengeMedia, ChallengeRound } from "../types/game";
import { IconButton } from "./ui/Button";

interface ChallengeSceneArtProps {
  challenge: ChallengeRound["challenge"];
  onPanoramaModeChange?: (mode: InteractivePanoramaMode | null) => void;
}

interface ScenePhotoCandidate {
  imageUrl: string;
  media?: ChallengeMedia;
}

interface ImageDimensions {
  height: number;
  width: number;
}

export type InteractivePanoramaMode = "360" | "panorama";

const PANORAMIC_ASPECT_RATIO = 1.9;
const CONTAINED_PHOTO_ASPECT_RATIO = 1.2;
const PHOTO_RETRY_BASE_DELAY_MS = 900;
const PHOTO_RETRY_MAX_DELAY_MS = 4500;

export function getScenePhotoCandidates(challenge: ChallengeRound["challenge"]): ScenePhotoCandidate[] {
  const candidates: ScenePhotoCandidate[] = [];
  const seenImageUrls = new Set<string>();

  function addMediaCandidate(media: ChallengeMedia | undefined) {
    const imageUrl = media?.imageUrl?.trim();
    if (!imageUrl || seenImageUrls.has(imageUrl)) {
      return;
    }

    seenImageUrls.add(imageUrl);
    candidates.push({ imageUrl, media });
  }

  addMediaCandidate(challenge.media);
  for (const source of challenge.visualSources ?? []) {
    addMediaCandidate(source);
  }

  return candidates;
}

function appendImageRetryParam(imageUrl: string, retryCycle: number) {
  if (retryCycle < 1) {
    return imageUrl;
  }

  const separator = imageUrl.includes("?") ? "&" : "?";
  return `${imageUrl}${separator}geoImageRetry=${retryCycle}`;
}

export function isInteractivePanoramaMedia(media: ChallengeMedia | undefined) {
  return getInteractivePanoramaMode(media) !== null;
}

export function getInteractivePanoramaMode(
  media: ChallengeMedia | undefined,
  dimensions?: ImageDimensions,
): InteractivePanoramaMode | null {
  const provider = (media?.streetViewProvider ?? media?.sourceProvider ?? "").trim().toLowerCase();
  const hasImage = Boolean(media?.imageUrl?.trim());

  if (!hasImage) {
    return null;
  }

  if (provider === "panoramax") {
    return "360";
  }

  if (!dimensions || !isPanoramicImageDimensions(dimensions)) {
    return null;
  }

  if (provider === "mapillary") {
    return "360";
  }

  return "panorama";
}

export function isPanoramicImageDimensions(dimensions: ImageDimensions) {
  if (dimensions.height <= 0 || dimensions.width <= 0) {
    return false;
  }

  return dimensions.width / dimensions.height >= PANORAMIC_ASPECT_RATIO;
}

export function shouldContainScenePhoto(dimensions: ImageDimensions) {
  if (dimensions.height <= 0 || dimensions.width <= 0) {
    return false;
  }

  return dimensions.width / dimensions.height < CONTAINED_PHOTO_ASPECT_RATIO;
}

export function ChallengeSceneArt({ challenge, onPanoramaModeChange }: ChallengeSceneArtProps) {
  const style = {
    "--scene-color-a": challenge.visualGradient[0],
    "--scene-color-b": challenge.visualGradient[1],
    "--scene-color-c": challenge.visualGradient[2],
  } as CSSProperties;
  const photoCandidates = useMemo(() => getScenePhotoCandidates(challenge), [challenge]);
  const photoCandidateSignature = photoCandidates.map((candidate) => candidate.imageUrl).join("|");
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [retryCycle, setRetryCycle] = useState(0);
  const [waitingToRetry, setWaitingToRetry] = useState(false);
  const retryTimeoutRef = useRef<number | null>(null);
  const photoElementRef = useRef<HTMLImageElement | null>(null);
  const activePhotoCandidate =
    activePhotoIndex < photoCandidates.length ? photoCandidates[activePhotoIndex] : undefined;
  const activeMedia = activePhotoCandidate?.media;
  const activeImageUrl = activePhotoCandidate
    ? appendImageRetryParam(activePhotoCandidate.imageUrl, retryCycle)
    : undefined;
  const showSourceBadge = Boolean(activeMedia?.sourceProvider);
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [activePhotoDimensions, setActivePhotoDimensions] = useState<ImageDimensions | undefined>();
  const interactivePanoramaMode = activePhotoCandidate
    ? getInteractivePanoramaMode(activeMedia, activePhotoDimensions)
    : null;
  const isInteractivePanorama = interactivePanoramaMode !== null;
  const shouldContainPhoto = !isInteractivePanorama && activePhotoDimensions
    ? shouldContainScenePhoto(activePhotoDimensions)
    : false;

  useEffect(() => {
    setActivePhotoIndex(0);
    setRetryCycle(0);
    setWaitingToRetry(false);
  }, [photoCandidateSignature]);

  useEffect(() => {
    setPhotoLoaded(false);
    setActivePhotoDimensions(undefined);
  }, [activeImageUrl]);

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current !== null) {
        window.clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    onPanoramaModeChange?.(interactivePanoramaMode);
  }, [interactivePanoramaMode, onPanoramaModeChange]);

  function handlePhotoError() {
    setPhotoLoaded(false);
    setActivePhotoDimensions(undefined);
    setActivePhotoIndex((currentIndex) => {
      if (currentIndex + 1 < photoCandidates.length) {
        return currentIndex + 1;
      }

      if (retryTimeoutRef.current !== null) {
        window.clearTimeout(retryTimeoutRef.current);
      }

      setWaitingToRetry(true);
      const retryDelay = Math.min(
        PHOTO_RETRY_BASE_DELAY_MS + retryCycle * 500,
        PHOTO_RETRY_MAX_DELAY_MS
      );
      retryTimeoutRef.current = window.setTimeout(() => {
        retryTimeoutRef.current = null;
        setRetryCycle((currentCycle) => currentCycle + 1);
        setActivePhotoIndex(0);
        setWaitingToRetry(false);
      }, retryDelay);

      return currentIndex;
    });
  }

  function markPhotoLoaded(image: HTMLImageElement) {
    setActivePhotoDimensions({
      height: image.naturalHeight,
      width: image.naturalWidth,
    });
    setPhotoLoaded(true);
  }

  useEffect(() => {
    const image = photoElementRef.current;

    if (image?.complete && image.naturalWidth > 0) {
      markPhotoLoaded(image);
    }
  }, [activeImageUrl]);

  if (activePhotoCandidate && activeImageUrl) {
    return (
      <div
        className={`scene-art scene-art--photo${isInteractivePanorama ? " scene-art--panorama" : ""} scene-art--${challenge.category}`}
        style={style}
      >
        {!photoLoaded ? (
          <span className="scene-photo-loading" role="status">
            {waitingToRetry ? "A preparar imagem" : "A carregar imagem"}
          </span>
        ) : null}

        {waitingToRetry ? null : isInteractivePanorama ? (
          <InteractivePanoramaImage
            imageUrl={activeImageUrl}
            loaded={photoLoaded}
            mode={interactivePanoramaMode}
            onError={handlePhotoError}
            onLoad={markPhotoLoaded}
          />
        ) : (
          <>
            {shouldContainPhoto ? (
              <span
                aria-hidden="true"
                className="scene-photo-backdrop"
                style={{ backgroundImage: `url("${activeImageUrl}")` }}
              />
            ) : null}
            <img
              ref={photoElementRef}
              alt=""
              aria-hidden="true"
              className={`scene-photo${shouldContainPhoto ? " scene-photo--contain" : ""}${photoLoaded ? " is-loaded" : " is-loading"}`}
              decoding="async"
              draggable={false}
              loading="eager"
              onError={handlePhotoError}
              onLoad={(event) => markPhotoLoaded(event.currentTarget)}
              src={activeImageUrl}
            />
          </>
        )}
        {showSourceBadge ? (
          <span className="scene-source-pill">
            {activeMedia?.sourceProvider}
            {activeMedia?.imageLicense ? ` · ${activeMedia.imageLicense}` : ""}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`scene-art scene-art--photo scene-art--${challenge.category}`} style={style}>
      <span className="scene-photo-loading" role="status">
        A preparar imagem
      </span>
    </div>
  );
}

interface InteractivePanoramaImageProps {
  imageUrl: string;
  loaded: boolean;
  mode: InteractivePanoramaMode;
  onError: () => void;
  onLoad: (image: HTMLImageElement) => void;
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

function InteractivePanoramaImage({ imageUrl, loaded, mode, onError, onLoad }: InteractivePanoramaImageProps) {
  const [view, setView] = useState<PanoramaViewState>(() => getInitialPanoramaView(mode));
  const imageRef = useRef<HTMLImageElement | null>(null);
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

  useEffect(() => {
    const image = imageRef.current;

    if (image?.complete && image.naturalWidth > 0) {
      onLoad(image);
    }
  }, [imageUrl]);

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
      <img
        ref={imageRef}
        alt=""
        aria-hidden="true"
        className="scene-panorama-preload"
        decoding="async"
        draggable={false}
        loading="eager"
        onError={onError}
        onLoad={(event) => onLoad(event.currentTarget)}
        src={imageUrl}
      />
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
