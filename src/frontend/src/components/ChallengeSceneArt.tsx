import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { ChallengeMedia, ChallengeRound } from "../types/game";

interface ChallengeSceneArtProps {
  challenge: ChallengeRound["challenge"];
}

interface ScenePhotoCandidate {
  imageUrl: string;
  media?: ChallengeMedia;
}

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

  const sceneImage = challenge.sceneImage?.trim();
  if (sceneImage && !seenImageUrls.has(sceneImage)) {
    candidates.push({ imageUrl: sceneImage });
  }

  return candidates;
}

export function ChallengeSceneArt({ challenge }: ChallengeSceneArtProps) {
  const style = {
    "--scene-color-a": challenge.visualGradient[0],
    "--scene-color-b": challenge.visualGradient[1],
    "--scene-color-c": challenge.visualGradient[2],
  } as CSSProperties;
  const photoCandidates = useMemo(() => getScenePhotoCandidates(challenge), [challenge]);
  const photoCandidateSignature = photoCandidates.map((candidate) => candidate.imageUrl).join("|");
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const activePhotoCandidate =
    activePhotoIndex < photoCandidates.length ? photoCandidates[activePhotoIndex] : undefined;
  const activeMedia = activePhotoCandidate?.media;
  const showSourceBadge = Boolean(activeMedia?.sourceProvider);
  const [photoLoaded, setPhotoLoaded] = useState(false);

  useEffect(() => {
    setActivePhotoIndex(0);
  }, [photoCandidateSignature]);

  useEffect(() => {
    setPhotoLoaded(false);
  }, [activePhotoCandidate?.imageUrl]);

  function handlePhotoError() {
    setPhotoLoaded(false);
    setActivePhotoIndex((currentIndex) =>
      currentIndex < photoCandidates.length ? currentIndex + 1 : currentIndex
    );
  }

  if (activePhotoCandidate) {
    return (
      <div className={`scene-art scene-art--photo scene-art--${challenge.category}`} style={style}>
        {!photoLoaded ? (
          <span className="scene-photo-loading" role="status">
            A carregar imagem
          </span>
        ) : null}

        <img
          alt=""
          aria-hidden="true"
          className={`scene-photo${photoLoaded ? " is-loaded" : " is-loading"}`}
          decoding="async"
          draggable={false}
          loading="eager"
          onError={handlePhotoError}
          onLoad={() => setPhotoLoaded(true)}
          src={activePhotoCandidate.imageUrl}
        />
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
    <div className={`scene-art scene-art--${challenge.category}`} style={style}>
      <div className="scene-art-sky" />
      <div className="scene-art-sun" />
      <div className="scene-art-haze" />
      <div className="scene-art-cloud scene-art-cloud-a" />
      <div className="scene-art-cloud scene-art-cloud-b" />
      <div className="scene-art-cloud scene-art-cloud-c" />

      <div className="scene-art-mountain scene-art-mountain-a" />
      <div className="scene-art-mountain scene-art-mountain-b" />
      <div className="scene-art-mountain scene-art-mountain-c" />

      <div className="scene-art-water" />
      <div className="scene-art-canal" />
      <div className="scene-art-road" />
      <div className="scene-art-lane scene-art-lane-a" />
      <div className="scene-art-lane scene-art-lane-b" />
      <div className="scene-art-bridge" />
      <div className="scene-art-plaza" />

      <div className="scene-art-roofline scene-art-roofline-left">
        <span className="scene-art-building scene-art-building-a" />
        <span className="scene-art-building scene-art-building-b" />
        <span className="scene-art-building scene-art-building-c" />
      </div>

      <div className="scene-art-roofline scene-art-roofline-right">
        <span className="scene-art-building scene-art-building-d" />
        <span className="scene-art-building scene-art-building-e" />
        <span className="scene-art-building scene-art-building-f" />
      </div>

      <div className="scene-art-tower scene-art-tower-a" />
      <div className="scene-art-tower scene-art-tower-b" />
      <div className="scene-art-tree scene-art-tree-a" />
      <div className="scene-art-tree scene-art-tree-b" />
      <div className="scene-art-tree scene-art-tree-c" />
      <div className="scene-art-boat" />
    </div>
  );
}
