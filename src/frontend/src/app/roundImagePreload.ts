import type { ChallengeRound } from "../types/game";

function getRoundImageUrls(round: ChallengeRound) {
  const urls = new Set<string>();

  const selectedImageUrl = round.challenge.media?.imageUrl?.trim();
  if (selectedImageUrl) {
    urls.add(selectedImageUrl);
  }

  for (const source of round.challenge.visualSources ?? []) {
    const imageUrl = source.imageUrl?.trim();
    if (imageUrl) {
      urls.add(imageUrl);
    }
  }

  return [...urls];
}

function preloadImage(imageUrl: string, timeoutMs: number) {
  return new Promise<boolean>((resolve) => {
    const image = new Image();
    const timeoutId = window.setTimeout(() => {
      cleanup();
      resolve(false);
    }, timeoutMs);

    function cleanup() {
      window.clearTimeout(timeoutId);
      image.onload = null;
      image.onerror = null;
    }

    image.onload = () => {
      cleanup();
      resolve(true);
    };
    image.onerror = () => {
      cleanup();
      resolve(false);
    };
    image.decoding = "async";
    image.src = imageUrl;
  });
}

export async function preloadFirstAvailableRoundImage(round: ChallengeRound) {
  const imageUrls = getRoundImageUrls(round);

  for (const imageUrl of imageUrls) {
    if (await preloadImage(imageUrl, 9000)) {
      return;
    }
  }
}
