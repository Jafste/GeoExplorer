export interface MultiplayerRoomResume {
  roomCode: string;
  displayName: string;
}

export interface MultiplayerRoomResumeStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

const MULTIPLAYER_ROOM_RESUME_STORAGE_KEY = "geoexplorer.multiplayer.roomResume";

function normalizeRoomCode(roomCode: string): string {
  return roomCode.trim().toUpperCase();
}

export function saveMultiplayerRoomResume(
  storage: MultiplayerRoomResumeStorage,
  roomCode: string,
  displayName: string
): void {
  const normalizedRoomCode = normalizeRoomCode(roomCode);
  const normalizedDisplayName = displayName.trim();

  if (!normalizedRoomCode || !normalizedDisplayName) {
    return;
  }

  storage.setItem(
    MULTIPLAYER_ROOM_RESUME_STORAGE_KEY,
    JSON.stringify({
      roomCode: normalizedRoomCode,
      displayName: normalizedDisplayName,
    })
  );
}

export function readMultiplayerRoomResume(
  storage: MultiplayerRoomResumeStorage,
  roomCode: string
): MultiplayerRoomResume | null {
  const normalizedRoomCode = normalizeRoomCode(roomCode);

  if (!normalizedRoomCode) {
    return null;
  }

  const storedValue = storage.getItem(MULTIPLAYER_ROOM_RESUME_STORAGE_KEY);

  if (!storedValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(storedValue) as Partial<MultiplayerRoomResume>;
    const storedRoomCode = typeof parsed.roomCode === "string" ? normalizeRoomCode(parsed.roomCode) : "";
    const storedDisplayName = typeof parsed.displayName === "string" ? parsed.displayName.trim() : "";

    if (storedRoomCode !== normalizedRoomCode || !storedDisplayName) {
      return null;
    }

    return {
      roomCode: storedRoomCode,
      displayName: storedDisplayName,
    };
  } catch {
    return null;
  }
}

export function clearMultiplayerRoomResume(storage: MultiplayerRoomResumeStorage): void {
  storage.removeItem(MULTIPLAYER_ROOM_RESUME_STORAGE_KEY);
}

export function isRecoverableMultiplayerResumeError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("stopped during negotiation") ||
    message.includes("connection was stopped") ||
    message.includes("not in the 'connected' state")
  );
}
