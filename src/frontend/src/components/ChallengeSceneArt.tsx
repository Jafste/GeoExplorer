import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { ChallengeMedia, ChallengeRound } from "../types/game";
import { InteractivePanoramaImage } from "./InteractivePanoramaImage";

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
const PHOTO_RETRY_MAX_CYCLES = 4;
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
  const [retryExhausted, setRetryExhausted] = useState(false);
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
    setRetryExhausted(false);
    setWaitingToRetry(false);
  }, [photoCandidateSignature]);

  useEffect(() => {
    setPhotoLoaded(false);
    setActivePhotoDimensions(undefined);
    setRetryExhausted(false);
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

  function clearRetryTimer() {
    if (retryTimeoutRef.current !== null) {
      window.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }

  function retryPhotoLoad() {
    clearRetryTimer();
    setActivePhotoIndex(0);
    setRetryCycle((currentCycle) => currentCycle + 1);
    setRetryExhausted(false);
    setWaitingToRetry(false);
    setPhotoLoaded(false);
    setActivePhotoDimensions(undefined);
  }

  function handlePhotoError() {
    setPhotoLoaded(false);
    setActivePhotoDimensions(undefined);
    setActivePhotoIndex((currentIndex) => {
      if (currentIndex + 1 < photoCandidates.length) {
        return currentIndex + 1;
      }

      clearRetryTimer();

      if (retryCycle >= PHOTO_RETRY_MAX_CYCLES) {
        setRetryExhausted(true);
        setWaitingToRetry(false);
        return currentIndex;
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
        className={`scene-art scene-art--photo scene-art--panorama scene-art--${challenge.category}`}
        style={style}
      >
        {!photoLoaded ? (
          <div className="scene-photo-loading">
            <span role="status">
              {retryExhausted ? "Imagem indisponível" : waitingToRetry ? "A preparar imagem" : "A carregar imagem"}
            </span>
            {retryExhausted ? (
              <button className="scene-photo-retry-button" type="button" onClick={retryPhotoLoad}>
                Tentar novamente
              </button>
            ) : null}
          </div>
        ) : null}

        {waitingToRetry || retryExhausted ? null : (
          <>
            <img
              ref={photoElementRef}
              alt=""
              aria-hidden="true"
              className="scene-panorama-preload"
              decoding="async"
              draggable={false}
              height={1}
              loading="eager"
              onError={handlePhotoError}
              onLoad={(event) => markPhotoLoaded(event.currentTarget)}
              src={activeImageUrl}
              width={1}
            />
            {!isInteractivePanorama && shouldContainPhoto ? (
              <span
                aria-hidden="true"
                className="scene-photo-backdrop"
                style={{ backgroundImage: `url("${activeImageUrl}")` }}
              />
            ) : null}
            <InteractivePanoramaImage
              fit={shouldContainPhoto ? "contain" : "cover"}
              imageUrl={activeImageUrl}
              loaded={photoLoaded}
              mode={interactivePanoramaMode ?? "photo"}
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
