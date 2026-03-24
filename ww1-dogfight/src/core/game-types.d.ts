import type {
    Camera,
    Euler,
    Group,
    Object3D,
    PerspectiveCamera,
    Quaternion,
    Scene,
    Vector3,
    WebGLRenderer,
} from "three";

export type ThreeModule = typeof import("three");
export type AircraftType = "fighter" | "bomber" | "jet";
export type EngineType = "prop" | "jet";
export type TeamType = "player" | "ally" | "enemy" | "friendly";

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
    aircraftType: AircraftType;
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

export interface ObjectiveUpdateSnapshot {
    enemyGroundAlive: number;
    enemyGroundTotal: number;
    enemyPlanesAlive: number;
    friendlyGroundAlive: number;
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
        spec?: {
            label?: string;
        };
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

export interface MouseState {
    dx: number;
    dy: number;
    locked: boolean;
    dragging: boolean;
    lastX: number;
    lastY: number;
    sens: number;
}

export interface InputController {
    keys: Record<string, boolean>;
    mouse: MouseState;
}

export interface AircraftSpec {
    id: AircraftType | "enemy";
    label: string;
    roleLabel: string;
    engineType: EngineType;
    engineCount: number;
    maxThrust: number;
    boostThrust: number;
    turnRateMul: number;
    pitchRateMul: number;
    rollRateMul: number;
    speedMultiplier: number;
    hp: number;
    ammo: number;
    rockets: number;
    bombs: number;
    gunHardpoints: readonly number[];
    rocketHardpoints: readonly number[];
    bombHardpoints: readonly number[];
}

export interface AircraftCatalog {
    fighter: AircraftSpec;
    bomber: AircraftSpec;
    jet: AircraftSpec;
}

export interface GameConfig {
    world: {
        size: number;
        groundScale: number;
        hillAmp: number;
        cloudCount: number;
        seaLevel: number;
        wrapMargin: number;
    };
    camera: {
        back: number;
        front: number;
        up: number;
        rearUp: number;
        fov: number;
        zoomFov: number;
        lookAhead: number;
        lerp: number;
        shake: number;
    };
    player: {
        maxThrust: number;
        boostThrust: number;
        wepMax: number;
        wepDrain: number;
        wepRecharge: number;
        hpRegen: number;
        ammoReloadPerSecond: number;
        turnRate: number;
        rollRate: number;
        pitchRate: number;
        maxG: number;
        maxSpeed: number;
        minSpeed: number;
        ammo: number;
        hp: number;
    };
    aircraft: AircraftCatalog;
    physics: {
        gravity: number;
        drag: number;
        lift: number;
        stallSpeed: number;
        wingArea: number;
    };
    guns: {
        rof: number;
        bulletSpeed: number;
        spread: number;
        damage: number;
        muzzleOffset: number;
        aimDistance: number;
        aimLift: number;
        ttl: number;
    };
    rockets: {
        count: number;
        cooldown: number;
        reloadInterval: number;
        speed: number;
        damage: number;
        radius: number;
        ttl: number;
        muzzleOffset: number;
    };
    bombs: {
        count: number;
        cooldown: number;
        reloadInterval: number;
        gravity: number;
        damage: number;
        radius: number;
        ttl: number;
        dropOffset: number;
    };
    ai: {
        wingmen: number;
        enemies: number;
        thinkRate: number;
        fireDist: number;
        seekDist: number;
        breakDist: number;
        aimCos: number;
    };
    team: {
        wingmanHp: number;
        enemyHp: number;
        respawnDelay: number;
    };
}

export interface PlaneControlState {
    pitch: number;
    roll: number;
    yaw: number;
}

export interface PlaneAiState {
    target: PlaneEntity | null;
    think: number;
}

export interface PlaneVisualControls {
    rudder?: Group;
    elevators?: Group[];
    ailerons?: Group[];
    rocketMeshes?: Object3D[];
    bombMeshes?: Object3D[];
    gunMeshes?: Object3D[];
    afterburner?: Object3D | null;
}

export interface PlaneUserData {
    team: TeamType | "enemy";
    vel: Vector3;
    hp: number;
    throttle: number;
    ammo: number;
    ammoReloadBuffer: number;
    fireCd: number;
    rocketCd: number;
    rockets: number;
    rocketReloadTimer: number;
    bombCd: number;
    bombs: number;
    bombReloadTimer: number;
    respawn: number;
    wep: number;
    wepActive: boolean;
    yaw: number;
    pitch: number;
    roll: number;
    landed?: boolean;
    spec: AircraftSpec;
    controlState: PlaneControlState;
    ai: PlaneAiState;
    mesh?: Group;
    art?: Group;
    controls?: PlaneVisualControls;
    prop?: Object3D | null;
    propellers?: Object3D[];
    target?: {
        hp: number;
        team: TeamType;
        kind: string;
        radius: number;
    };
    radius?: number;
}

export type PlaneEntity = Group & { userData: PlaneUserData };

export interface GameEntities {
    player: PlaneEntity | null;
    allies: PlaneEntity[];
    enemies: PlaneEntity[];
    bullets: Object3D[];
    rockets: Object3D[];
    bombs: Object3D[];
    particles: Object3D[];
}

export interface GameState {
    score: number;
    respawn: number;
    zoomed: boolean;
    outcome: "active" | "won" | "lost";
}

export interface DebugSnapshot {
    player: {
        position: number[];
        rotation: [number, number, number];
        forward: number[];
        up: number[];
        right: number[];
        speed: number;
        throttle: number;
        hp: number;
        ammo: number;
        roll: number;
    };
    camera: {
        position: number[];
        forward: number[];
    };
    ui: {
        reticleVisible: boolean;
        lookBack: boolean;
    };
}

export interface DebugApi {
    ready: true;
    getState(): DebugSnapshot;
    resetPlayer(): void;
    setKey(code: string, pressed: boolean): void;
    clearInputs(): void;
    stepFrames(
        count?: number,
        dt?: number,
        options?: {
            updateAI?: boolean;
            renderFrame?: boolean;
        },
    ): DebugSnapshot;
}

declare global {
    interface Window {
        __dogfight?: DebugApi;
        THREE?: ThreeModule;
    }
}

export interface SpawnSystemRuntime {
    camera: PerspectiveCamera;
    cameraController: {
        reset(): void;
        snap(lookBack: boolean): void;
    };
    mouse: MouseState;
    snapCamera(): void;
    onResetState?(): void;
}

export interface WorldTarget extends Object3D {
    userData: PlaneUserData;
}

export interface WorldRuntime {
    targets: WorldTarget[];
    clouds: Object3D[];
    ship: Object3D;
    friendlySpawn: Vector3;
    enemyBaseCenter: Vector3;
    friendlyRunway: {
        center: Vector3;
        y: number;
        halfWidth: number;
        halfLength: number;
    };
    friendlyAirfield: {
        center: Vector3;
        halfWidth: number;
        halfLength: number;
        y: number;
    };
    getGroundHeightAt(x: number, z: number): number;
    getSeaLevelAt(x: number, z: number): number;
    wrapPoint(x: number, z: number): { x: number; z: number };
    wrapDelta(dx: number, dz: number): { x: number; z: number };
    wrapObject(obj: Object3D | null | undefined): void;
    update(dt: number): void;
}

export interface CameraUpdateOptions {
    dt: number;
    lookBack: boolean;
    freeLook: boolean;
    mouseDx?: number;
    mouseDy?: number;
    mouseSens?: number;
    zoomed: boolean;
}

export interface CameraController {
    reset(): void;
    snap(lookBack: boolean): void;
    update(options: CameraUpdateOptions): void;
}

export interface FlightInput {
    yawInput: number;
    pitchInput: number;
    rollInput: number;
}

export interface SoundController {
    unlock(): void;
    setVolume(volume: number): void;
    update(): void;
}

export interface SoundEffectsController {
    unlock(): void;
    setVolume(volume: number): void;
    playGun(options: { near: boolean; source: "player" | "enemy" }): void;
    playHit(level?: number): void;
    playWorldHit(level?: number): void;
    playRocketLaunch(level?: number): void;
    playRocketExplode(level?: number): void;
    playBombDrop(level?: number): void;
}
