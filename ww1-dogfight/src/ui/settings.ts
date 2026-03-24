import type { ControlBindings, GameSettings, SettingsRoot, ToggleButton } from "../core/game-types.js";
import { loadStoredSettings, mergeSettings, saveStoredSettings } from "./storage.js";

const DEFAULT_AIRCRAFT_TYPE: GameSettings["gameplay"]["aircraftType"] = "fighter";

export const DEFAULT_SETTINGS: Readonly<GameSettings> = Object.freeze({
    controls: {
        pitchDown: "KeyW",
        pitchUp: "KeyS",
        rollLeft: "KeyA",
        rollRight: "KeyD",
        yawLeft: "KeyQ",
        yawRight: "KeyE",
        throttleUp: "ArrowUp",
        throttleDown: "ArrowDown",
        fire: "Space",
        rockets: "KeyR",
        bombs: "KeyB",
        zoom: "KeyZ",
        freeLook: "KeyC",
        lookBack: "KeyV",
    },
    audio: {
        engineVolume: 0.28,
        effectsVolume: 0.1,
    },
    gameplay: {
        aircraftType: DEFAULT_AIRCRAFT_TYPE,
    },
});

const AIRCRAFT_LABELS: ReadonlyArray<readonly [GameSettings["gameplay"]["aircraftType"], string]> = [
    ["fighter", "Fighter"],
    ["bomber", "Bomber"],
    ["jet", "Jet"],
];

const CONTROL_LABELS: ReadonlyArray<readonly [keyof ControlBindings, string]> = [
    ["pitchDown", "Pitch Down"],
    ["pitchUp", "Pitch Up"],
    ["rollLeft", "Roll Left"],
    ["rollRight", "Roll Right"],
    ["yawLeft", "Rudder Left"],
    ["yawRight", "Rudder Right"],
    ["throttleUp", "Throttle Up"],
    ["throttleDown", "Throttle Down"],
    ["fire", "Fire Guns"],
    ["rockets", "Fire Rockets"],
    ["bombs", "Drop Bombs"],
    ["zoom", "Aim Zoom"],
    ["freeLook", "Free Look"],
    ["lookBack", "Look Back"],
];

const KEY_NAMES: Readonly<Record<string, string>> = {
    Space: "Space",
    ArrowUp: "Arrow Up",
    ArrowDown: "Arrow Down",
    ArrowLeft: "Arrow Left",
    ArrowRight: "Arrow Right",
    ShiftLeft: "Left Shift",
    ShiftRight: "Right Shift",
};

function formatKey(code: string): string {
    if (!code) return "Unbound";
    if (code in KEY_NAMES) return KEY_NAMES[code] ?? code;
    if (code.startsWith("Key")) return code.slice(3);
    if (code.startsWith("Digit")) return code.slice(5);
    return code;
}

function isHTMLElement(value: EventTarget | null): value is HTMLElement {
    return value instanceof HTMLElement;
}

function isInputElement(value: EventTarget | null): value is HTMLInputElement {
    return value instanceof HTMLInputElement;
}

function isSelectElement(value: EventTarget | null): value is HTMLSelectElement {
    return value instanceof HTMLSelectElement;
}

export function createSettingsController({
    root,
    toggleButton,
    onChange,
}: {
    root: SettingsRoot;
    toggleButton: ToggleButton;
    onChange: (settings: GameSettings) => void;
}): {
    getSettings(): GameSettings;
    isOpen(): boolean;
} {
    let settings = loadStoredSettings(DEFAULT_SETTINGS);
    let rebindingAction: keyof ControlBindings | null = null;

    function emitChange(): void {
        saveStoredSettings(settings);
        onChange(settings);
        render();
    }

    function updateControlBinding(action: keyof ControlBindings, value: string): void {
        settings = mergeSettings(settings, {
            controls: {
                [action]: value,
            },
        });
        emitChange();
    }

    function updateAudioSetting(key: "engineVolume" | "effectsVolume", value: number): void {
        settings = mergeSettings(settings, {
            audio: {
                [key]: value,
            },
        });
        emitChange();
    }

    function updateAircraftType(aircraftType: GameSettings["gameplay"]["aircraftType"]): void {
        settings = mergeSettings(settings, {
            gameplay: {
                aircraftType,
            },
        });
        emitChange();
    }

    function resetDefaults(): void {
        settings = structuredClone(DEFAULT_SETTINGS);
        emitChange();
    }

    function toggleOpen(force?: boolean): void {
        const shouldOpen = force ?? !root.classList.contains("open");
        root.classList.toggle("open", shouldOpen);
        toggleButton.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
    }

    function render(): void {
        const controlsMarkup = CONTROL_LABELS.map(([id, label]) => {
            const waiting = rebindingAction === id;
            return `
                <div class="settings-row">
                    <span>${label}</span>
                    <button class="bind-btn${waiting ? " waiting" : ""}" data-action="${id}" type="button">
                        ${waiting ? "Press key..." : formatKey(settings.controls[id])}
                    </button>
                </div>
            `;
        }).join("");

        root.innerHTML = `
            <div class="settings-head">
                <h2>Settings</h2>
                <button id="settings-close" type="button" aria-label="Close settings">Close</button>
            </div>
            <div class="settings-section">
                <div class="settings-title">Controls</div>
                ${controlsMarkup}
            </div>
            <div class="settings-section">
                <div class="settings-title">Audio</div>
                <label class="slider-row">
                    <span>Engine</span>
                    <input type="range" min="0" max="100" value="${Math.round(settings.audio.engineVolume * 100)}" data-audio="engineVolume" />
                </label>
                <label class="slider-row">
                    <span>Effects</span>
                    <input type="range" min="0" max="100" value="${Math.round(settings.audio.effectsVolume * 100)}" data-audio="effectsVolume" />
                </label>
            </div>
            <div class="settings-section">
                <div class="settings-title">Gameplay</div>
                <label class="slider-row">
                    <span>Aircraft</span>
                    <select data-gameplay="aircraftType">
                        ${AIRCRAFT_LABELS.map(
                            ([id, label]) =>
                                `<option value="${id}" ${settings.gameplay.aircraftType === id ? "selected" : ""}>${label}</option>`,
                        ).join("")}
                    </select>
                </label>
            </div>
            <div class="settings-actions">
                <button id="settings-reset" type="button">Reset Defaults</button>
            </div>
        `;
    }

    root.addEventListener("click", (event) => {
        if (!isHTMLElement(event.target)) return;
        const target = event.target;

        if (target.id === "settings-close") {
            toggleOpen(false);
            return;
        }

        if (target.id === "settings-reset") {
            rebindingAction = null;
            resetDefaults();
            return;
        }

        const action = target.dataset["action"];
        if (!action) return;

        const binding = CONTROL_LABELS.find(([id]) => id === action)?.[0] ?? null;
        rebindingAction = binding;
        render();
    });

    root.addEventListener("input", (event) => {
        const target = event.target;
        if (isInputElement(target)) {
            const audioKey = target.dataset["audio"];
            if (audioKey === "engineVolume" || audioKey === "effectsVolume") {
                updateAudioSetting(audioKey, Number(target.value) / 100);
                return;
            }
        }

        if (isSelectElement(target)) {
            const gameplayKey = target.dataset["gameplay"];
            if (gameplayKey === "aircraftType") {
                if (target.value === "fighter" || target.value === "bomber" || target.value === "jet") {
                    updateAircraftType(target.value);
                }
            }
        }
    });

    document.addEventListener(
        "keydown",
        (event) => {
            if (!rebindingAction) return;
            event.preventDefault();
            event.stopPropagation();
            updateControlBinding(rebindingAction, event.code);
            rebindingAction = null;
        },
        true,
    );

    toggleButton.addEventListener("click", () => toggleOpen());

    document.addEventListener("mousedown", (event) => {
        if (!root.classList.contains("open")) return;
        const target = event.target;
        if (!(target instanceof Node)) return;
        if (root.contains(target) || toggleButton.contains(target)) return;
        toggleOpen(false);
    });

    render();
    onChange(settings);

    return {
        getSettings: () => settings,
        isOpen: () => root.classList.contains("open"),
    };
}
