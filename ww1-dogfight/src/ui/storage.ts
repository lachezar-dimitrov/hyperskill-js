import type { GameSettings, LocalStorageLike, PartialGameSettings } from "../core/game-types.js";

const STORAGE_KEY = "ww1-dogfight-settings";

function getStorage(): LocalStorageLike | null {
    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isPartialSettings(value: unknown): value is PartialGameSettings {
    if (!isRecord(value)) return false;
    const controls = value["controls"];
    const audio = value["audio"];
    const gameplay = value["gameplay"];

    const controlsOk = controls === undefined || isRecord(controls);
    const audioOk = audio === undefined || isRecord(audio);
    const gameplayOk = gameplay === undefined || isRecord(gameplay);

    return controlsOk && audioOk && gameplayOk;
}

export function mergeSettings(defaults: GameSettings, partial: PartialGameSettings = {}): GameSettings {
    return {
        controls: {
            ...defaults.controls,
            ...(partial.controls ?? {}),
        },
        audio: {
            ...defaults.audio,
            ...(partial.audio ?? {}),
        },
        gameplay: {
            ...defaults.gameplay,
            ...(partial.gameplay ?? {}),
        },
    };
}

export function loadStoredSettings(defaults: GameSettings): GameSettings {
    const storage = getStorage();
    if (!storage) {
        return structuredClone(defaults);
    }

    try {
        const raw = storage.getItem(STORAGE_KEY);
        if (!raw) {
            return structuredClone(defaults);
        }
        const parsed: unknown = JSON.parse(raw);
        if (!isPartialSettings(parsed)) {
            return structuredClone(defaults);
        }
        return mergeSettings(defaults, parsed);
    } catch {
        return structuredClone(defaults);
    }
}

export function saveStoredSettings(settings: GameSettings): void {
    const storage = getStorage();
    if (!storage) return;

    try {
        storage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
        // Ignore storage failures.
    }
}
