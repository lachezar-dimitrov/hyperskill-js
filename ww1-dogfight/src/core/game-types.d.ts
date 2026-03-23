export interface ControlBindings {
    pitchDown: string;
    pitchUp: string;
    rollLeft: string;
    rollRight: string;
    yawLeft: string;
    yawRight: string;
    throttleUp: string;
    throttleDown: string;
    fire: string;
    rockets: string;
    bombs: string;
    lookBack: string;
    freeLook: string;
    zoom: string;
}

export interface AudioSettings {
    engineVolume: number;
    effectsVolume: number;
}

export interface GameplaySettings {
    funMode: boolean;
}

export interface GameSettings {
    controls: ControlBindings;
    audio: AudioSettings;
    gameplay: GameplaySettings;
}

export interface PartialGameSettings {
    controls?: Partial<ControlBindings>;
    audio?: Partial<AudioSettings>;
    gameplay?: Partial<GameplaySettings>;
}

export interface HudRefs {
    status: HTMLElement;
    score: HTMLElement;
    mission: HTMLElement;
    speed: HTMLElement;
    alt: HTMLElement;
    ralt: HTMLElement;
    throttle: HTMLElement;
    wep: HTMLElement;
    hp: HTMLElement;
    ammo: HTMLElement;
    rockets: HTMLElement;
    bombs: HTMLElement;
    enemies: HTMLElement;
    engineMode: HTMLElement;
    funMode: HTMLElement;
}

export interface ObjectiveSnapshot {
    enemyStructuresAlive: number;
    enemiesAlive: number;
    won: boolean;
    lost: boolean;
}

export interface LocalStorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

export interface SettingsRoot {
    classList: DOMTokenList;
    innerHTML: string;
    addEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions,
    ): void;
    contains(node: Node | null): boolean;
    setAttribute(name: string, value: string): void;
}

export interface ToggleButton {
    setAttribute(name: string, value: string): void;
    addEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions,
    ): void;
    contains(node: Node | null): boolean;
}

export interface PlayerTelemetry {
    position: { x: number; y: number; z: number };
    userData: {
        hp: number;
        landed: boolean;
        throttle: number;
        wep: number;
        wepActive: boolean;
        ammo: number;
        rockets?: number;
        bombs?: number;
        roll?: number;
        vel: { length(): number };
    };
}

export interface EnemyTelemetry {
    userData: { hp: number };
}

export interface WorldTelemetry {
    getGroundHeightAt(x: number, z: number): number;
    wrapDelta(dx: number, dz: number): { x: number; z: number };
    targets: Array<{
        position: { x: number; y: number; z: number };
        userData: {
            target?: {
                hp: number;
                team: string;
            };
        };
    }>;
}
