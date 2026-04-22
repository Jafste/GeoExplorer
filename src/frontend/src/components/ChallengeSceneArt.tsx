import type { CSSProperties } from "react";
import type { ChallengeRound } from "../types/game";

interface ChallengeSceneArtProps {
  challenge: ChallengeRound["challenge"];
}

export function ChallengeSceneArt({ challenge }: ChallengeSceneArtProps) {
  const style = {
    "--scene-color-a": challenge.visualGradient[0],
    "--scene-color-b": challenge.visualGradient[1],
    "--scene-color-c": challenge.visualGradient[2],
  } as CSSProperties;

  if (challenge.sceneImage) {
    return (
      <div className={`scene-art scene-art--photo scene-art--${challenge.category}`} style={style}>
        <img
          alt=""
          aria-hidden="true"
          className="scene-photo"
          draggable={false}
          loading="eager"
          src={challenge.sceneImage}
        />
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
