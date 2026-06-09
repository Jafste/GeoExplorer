import { describe, expect, it } from "vitest";
import {
  clearMultiplayerRoomResume,
  isRecoverableMultiplayerResumeError,
  readMultiplayerRoomResume,
  saveMultiplayerRoomResume,
} from "./multiplayerRoomResume";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  public removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe("multiplayerRoomResume", () => {
  it("stores the last joined room and player display name", () => {
    const storage = new MemoryStorage();

    saveMultiplayerRoomResume(storage, " ab12cd ", " Marcos ");

    expect(readMultiplayerRoomResume(storage, "AB12CD")).toEqual({
      roomCode: "AB12CD",
      displayName: "Marcos",
    });
  });

  it("only resumes when the stored room matches the requested room", () => {
    const storage = new MemoryStorage();

    saveMultiplayerRoomResume(storage, "AB12CD", "Marcos");

    expect(readMultiplayerRoomResume(storage, "ZZ9999")).toBeNull();
  });

  it("clears the resume entry when the player explicitly leaves", () => {
    const storage = new MemoryStorage();

    saveMultiplayerRoomResume(storage, "AB12CD", "Marcos");
    clearMultiplayerRoomResume(storage);

    expect(readMultiplayerRoomResume(storage, "AB12CD")).toBeNull();
  });

  it("ignores corrupted stored data", () => {
    const storage = new MemoryStorage();

    storage.setItem("geoexplorer.multiplayer.roomResume", "not-json");

    expect(readMultiplayerRoomResume(storage, "AB12CD")).toBeNull();
  });

  it("treats connection negotiation stops as recoverable resume errors", () => {
    expect(
      isRecoverableMultiplayerResumeError(new Error("The connection was stopped during negotiation."))
    ).toBe(true);
    expect(
      isRecoverableMultiplayerResumeError(
        new Error("Cannot send data if the connection is not in the 'Connected' State.")
      )
    ).toBe(true);
    expect(isRecoverableMultiplayerResumeError(new Error("Sala não encontrada."))).toBe(false);
    expect(isRecoverableMultiplayerResumeError("The connection was stopped during negotiation.")).toBe(false);
  });
});
