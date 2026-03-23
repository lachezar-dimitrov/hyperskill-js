// @ts-nocheck
import { createAiSystem } from "./src/systems/ai.js";
import { createEngineAudio } from "./src/audio/engine-audio.js";
import { createEngineAudioStateReaders } from "./src/audio/engine-audio-state.js";
import { createCameraController } from "./src/systems/camera.js";
import { CFG } from "./src/core/cfg.js";
import { createCombatSystem } from "./src/systems/combat.js";
import { attachDebugApi } from "./src/core/debug-api.js";
import { createFlakSystem } from "./src/systems/flak.js";
import { createFlightSystem } from "./src/systems/flight.js";
import { updateHud } from "./src/ui/hud.js";
import { createInputController } from "./src/systems/input.js";
import { createMarkerSystem } from "./src/ui/markers.js";
import { createObjectiveSystem } from "./src/systems/objectives.js";
import { createLocalAxes, forwardOf as forwardVectorOf, rightOf as rightVectorOf, syncPlaneOrientation, upOf as upVectorOf } from "./src/core/orientation.js";
import { createPlaneFactory } from "./src/systems/planes.js";
import { createRadar } from "./src/ui/radar.js";
import { createSettingsController, DEFAULT_SETTINGS } from "./src/ui/settings.js";
import { createSoundEffects } from "./src/audio/sound-effects.js";
import { createSpawnSystem } from "./src/systems/spawning.js";
import { loadThree } from "./src/core/three-loader.js";
import { createWaveDirector } from "./src/systems/wave-director.js";
import { createWorld } from "./src/world/world.js";

const THREE = await loadThree();
window.THREE = THREE;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x85c6ff);
scene.fog = new THREE.Fog(0x85c6ff, 1400, 3600);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(CFG.camera.fov, window.innerWidth / window.innerHeight, 0.1, 5000);

const hemi = new THREE.HemisphereLight(0xe2f3ff, 0x6f7a4a, 1.25);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2c8, 1.55);
sun.position.set(220, 320, 140);
scene.add(sun);
const fill = new THREE.DirectionalLight(0xcfe4ff, 0.24);
fill.position.set(-120, 150, -160);
scene.add(fill);

const sunDisc = new THREE.Mesh(
    new THREE.SphereGeometry(70, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff4bf }),
);
sunDisc.position.copy(sun.position.clone().normalize().multiplyScalar(1850));
scene.add(sunDisc);

const hud = {
    status: document.getElementById("status"),
    score: document.getElementById("score"),
    mission: document.getElementById("mission"),
    speed: document.getElementById("speed"),
    alt: document.getElementById("alt"),
    ralt: document.getElementById("ralt"),
    throttle: document.getElementById("throttle"),
    wep: document.getElementById("wep"),
    hp: document.getElementById("hp"),
    ammo: document.getElementById("ammo"),
    rockets: document.getElementById("rockets"),
    bombs: document.getElementById("bombs"),
    enemies: document.getElementById("enemies"),
    engineMode: document.getElementById("engine-mode"),
    funMode: document.getElementById("fun-mode"),
};
const banner = document.getElementById("banner");
const reticle = document.getElementById("reticle");
const markerLayer = document.getElementById("marker-layer");
const radar = document.getElementById("radar");
const radarContacts = document.getElementById("radar-contacts");
const radarShip = document.getElementById("radar-ship");
const settingsPanel = document.getElementById("settings-panel");
const settingsToggle = document.getElementById("settings-toggle");
const { LOCAL_RIGHT, LOCAL_UP, LOCAL_FORWARD } = createLocalAxes(THREE);
let settings = structuredClone(DEFAULT_SETTINGS);

function showBanner(text, duration = 1200) {
    if (!banner) return;
    banner.textContent = text;
    banner.classList.add("show");
    clearTimeout(showBanner._t);
    showBanner._t = setTimeout(() => banner.classList.remove("show"), duration);
}

function handlePlayerDown(reason = "combat") {
    if (state.respawn <= 0) state.respawn = CFG.team.respawnDelay;
    if (reason === "flak") {
        showBanner("FLAK DOWN");
    }
}

function forwardOf(obj) {
    return forwardVectorOf(THREE, obj);
}
function upOf(obj) {
    return upVectorOf(THREE, obj);
}
function rightOf(obj) {
    return rightVectorOf(THREE, obj);
}

// =========================
// World
// =========================
const world = createWorld({ THREE, scene, cfg: CFG });

// =========================
// Plane Factory
// =========================
const planeFactory = createPlaneFactory({
    THREE,
    scene,
    cfg: CFG,
    syncPlaneOrientation,
});
const { spawnPlane, updateControlSurfaces } = planeFactory;

// =========================
// Entities
// =========================
const entities = {
    player: null,
    allies: [],
    enemies: [],
    bullets: [],
    rockets: [],
    bombs: [],
    particles: [],
};

// =========================
// Game State
// =========================
const state = {
    score: 0,
    respawn: 0,
    zoomed: false,
    outcome: "active",
    funMode: false,
};

const spawnSystem = createSpawnSystem({
    THREE,
    cfg: CFG,
    world,
    entities,
    spawnPlane,
    forwardOf,
    syncPlaneOrientation,
    state,
    camera,
});
const { resetPlayer, spawnEnemyWave } = spawnSystem;
spawnSystem.initializeForces();

const objectives = createObjectiveSystem({
    world,
    entities,
    showBanner,
});
const waveDirector = createWaveDirector({
    objectives,
    spawnEnemyWave,
    showBanner,
});

const engineAudioState = createEngineAudioStateReaders({ entities, THREE });
const engineAudio = createEngineAudio({
    window,
    THREE,
    getPlayerState: engineAudioState.getPlayerState,
    getEnemyState: engineAudioState.getEnemyState,
});
const soundEffects = createSoundEffects({ window, THREE });
const settingsController = createSettingsController({
    root: settingsPanel,
    toggleButton: settingsToggle,
    onChange(nextSettings) {
        settings = nextSettings;
        state.funMode = !!nextSettings.gameplay.funMode;
        engineAudio.setVolume(settings.audio.engineVolume);
        soundEffects.setVolume(settings.audio.effectsVolume);
    },
});

function unlockAudio() {
    engineAudio.unlock();
    soundEffects.unlock();
}

function updateEngineAudio() {
    engineAudio.update();
}

// =========================
// Input
// =========================
const canvas = renderer.domElement;
const { keys, mouse } = createInputController({
    window,
    document,
    canvas,
    onInput: unlockAudio,
    shouldStartDrag: () => !!keys[settings.controls.freeLook],
});

const combatSystem = createCombatSystem({
    THREE,
    scene,
    entities,
    world,
    cfg: CFG,
    soundEffects,
    camera,
    reticle,
    getReticleAimDirection,
    forwardOf,
    keys,
    settings,
    showBanner,
    onPlayerDown: handlePlayerDown,
    onEnemyDown() {
        state.score += 100;
    },
    onEnemyStructureDown() {
        state.score += 75;
    },
});
const { spawnBullet, spawnRocket, spawnBomb, spawnBurst, updateBullets, updateRockets, updateBombs, updateParticles } = combatSystem;
const flightSystem = createFlightSystem({
    THREE,
    cfg: CFG,
    world,
    entities,
    state,
    showBanner,
    spawnBurst,
    soundEffects,
    forwardOf,
    syncPlaneOrientation,
    localAxes: {
        up: LOCAL_UP,
        right: LOCAL_RIGHT,
        forward: LOCAL_FORWARD,
    },
    updateControlSurfaces,
});
const { applyControls, integrateForces } = flightSystem;
const aiSystem = createAiSystem({
    THREE,
    cfg: CFG,
    entities,
    forwardOf,
});
const cameraController = createCameraController({
    THREE,
    camera,
    cfg: CFG,
    entities,
    forwardOf,
});
spawnSystem.configureRuntime({
    camera,
    cameraController,
    mouse,
    snapCamera,
    onResetState() {
        objectives.reset();
        waveDirector.reset();
        cameraReady = false;
    },
});

const flakSystem = createFlakSystem({
    THREE,
    scene,
    world,
    entities,
    spawnBurst,
    showBanner,
    onPlaneDown: (plane) => {
        if (plane === entities.player) handlePlayerDown("flak");
    },
});
const markerSystem = createMarkerSystem({
    root: markerLayer,
    entities,
    world,
    getFlakSites: () => flakSystem.getSites(),
    THREE,
});
const radarSystem = createRadar({
    root: radar,
    contactsRoot: radarContacts,
    ship: radarShip,
    entities,
    forwardOf,
    world,
    THREE,
});

function getReticleAimDirection() {
    const canvasRect = renderer.domElement.getBoundingClientRect();
    const targetRect = (reticle || renderer.domElement).getBoundingClientRect();
    const x = targetRect.left + targetRect.width / 2;
    const y = targetRect.top + targetRect.height / 2;
    const ndc = new THREE.Vector3(
        ((x - canvasRect.left) / canvasRect.width) * 2 - 1,
        -(((y - canvasRect.top) / canvasRect.height) * 2 - 1),
        0.5,
    );
    ndc.unproject(camera);
    return ndc.sub(camera.position).normalize();
}

let cameraReady = false;
const METERS_PER_UNIT = 1.6;

function updateHUD() {
    updateHud({
        hud,
        entities,
        world,
        cfg: CFG,
        state,
        objectives,
        metersPerUnit: METERS_PER_UNIT,
    });
}

function snapCamera() {
    cameraController.snap(!!keys[settings.controls.lookBack]);
    cameraReady = true;
}

function updateCamera(dt) {
    const freeLook = !!keys[settings.controls.freeLook];
    cameraController.update({
        dt,
        lookBack: !!keys[settings.controls.lookBack],
        freeLook,
        mouseDx: freeLook ? mouse.dx : 0,
        mouseDy: freeLook ? mouse.dy : 0,
        mouseSens: mouse.sens,
        zoomed: state.zoomed,
    });
}

function wrapMovingObject(obj) {
    if (!obj) return null;
    const beforeX = obj.position.x;
    const beforeZ = obj.position.z;
    world.wrapObject(obj);
    if (beforeX === obj.position.x && beforeZ === obj.position.z) {
        return null;
    }
    return {
        dx: obj.position.x - beforeX,
        dz: obj.position.z - beforeZ,
    };
}

function wrapAllMovingEntities() {
    let playerWrapDelta = null;

    playerWrapDelta = wrapMovingObject(entities.player) || playerWrapDelta;
    entities.allies.forEach((ally) => wrapMovingObject(ally));
    entities.enemies.forEach((enemy) => wrapMovingObject(enemy));
    entities.bullets.forEach((bullet) => wrapMovingObject(bullet));
    entities.rockets.forEach((rocket) => wrapMovingObject(rocket));
    entities.bombs.forEach((bomb) => wrapMovingObject(bomb));
    entities.particles.forEach((particle) => wrapMovingObject(particle));

    if (playerWrapDelta) {
        camera.position.x += playerWrapDelta.dx;
        camera.position.z += playerWrapDelta.dz;
    }
}

// =========================
// Main Loop
// =========================
function tick(dt, { updateAI = true, renderFrame = true } = {}) {
    // Player input
    const data = entities.player.userData;
    if (data.hp > 0) {
        const speedMultiplier = settings.gameplay.funMode ? 3 : 1;
        const lookBack = !!keys[settings.controls.lookBack];
        const freeLook = !!keys[settings.controls.freeLook];
        const yawKey = (keys[settings.controls.yawLeft] ? 0.6 : 0) + (keys[settings.controls.yawRight] ? -0.6 : 0);
        const pitchKey = (keys[settings.controls.pitchDown] ? 0.5 : 0) + (keys[settings.controls.pitchUp] ? -0.5 : 0);
        const rollKey = (keys[settings.controls.rollLeft] ? -1 : 0) + (keys[settings.controls.rollRight] ? 1 : 0);

        const yawInput = (lookBack || freeLook ? 0 : mouse.dx * mouse.sens) + yawKey;
        const pitchInput = (lookBack || freeLook ? 0 : mouse.dy * mouse.sens) + pitchKey;
        const rollInput = rollKey;

        const throttleUpHeld = !!keys[settings.controls.throttleUp];
        const throttleDownHeld = !!keys[settings.controls.throttleDown];

        if (throttleUpHeld) {
            if (data.throttle < 1) {
                data.throttle = THREE.MathUtils.clamp(data.throttle + dt * 0.35, 0.2, 1);
            }
        }
        if (throttleDownHeld) {
            data.throttle = THREE.MathUtils.clamp(data.throttle - dt * 0.35, 0.2, 1);
        }

        const wantsWep = throttleUpHeld && data.throttle >= 1;
        if (wantsWep && data.wep > 0) {
            data.wep = Math.max(0, data.wep - CFG.player.wepDrain * dt);
            data.wepActive = data.wep > 0;
        } else {
            data.wep = Math.min(CFG.player.wepMax, data.wep + CFG.player.wepRecharge * dt);
            data.wepActive = false;
        }

        applyControls(entities.player, { yawInput, pitchInput, rollInput }, dt, data.wepActive, speedMultiplier);
        integrateForces(entities.player, dt);

        // No auto-leveling in arcade mode.

        if (state.outcome === "active" && keys[settings.controls.fire]) spawnBullet(entities.player);
        if (state.outcome === "active" && keys[settings.controls.rockets]) spawnRocket(entities.player);
        if (state.outcome === "active" && keys[settings.controls.bombs]) spawnBomb(entities.player);

        data.hp = Math.min(CFG.player.hp, data.hp + CFG.player.hpRegen * dt);

        data.ammoReloadBuffer += CFG.player.ammoReloadPerSecond * dt;
        if (data.ammo < CFG.player.ammo) {
            const ammoToAdd = Math.min(CFG.player.ammo - data.ammo, Math.floor(data.ammoReloadBuffer));
            if (ammoToAdd > 0) {
                data.ammo += ammoToAdd;
                data.ammoReloadBuffer -= ammoToAdd;
            }
        } else {
            data.ammoReloadBuffer = 0;
        }

        if (data.rockets < CFG.rockets.count) {
            data.rocketReloadTimer += dt;
            if (data.rocketReloadTimer >= CFG.rockets.reloadInterval) {
                data.rockets += 1;
                data.rocketReloadTimer = 0;
            }
        } else {
            data.rocketReloadTimer = 0;
        }

        if (data.bombs < CFG.bombs.count) {
            data.bombReloadTimer += dt;
            if (data.bombReloadTimer >= CFG.bombs.reloadInterval) {
                data.bombs += 1;
                data.bombReloadTimer = 0;
            }
        } else {
            data.bombReloadTimer = 0;
        }
    } else {
        data.wepActive = false;
        state.respawn -= dt;
        if (state.respawn <= 0) {
            resetPlayer();
            showBanner("RESPAWNED");
        }
    }

    if (updateAI) {
        entities.allies.forEach((ally, i) => {
            if (ally.userData.hp <= 0) return;
            const offset = new THREE.Vector3(-20 - i * 8, 6 + i * 2, 16 + i * 8);
            const input = aiSystem.getControlInput(ally, dt, [entities.player, ...entities.allies], entities.enemies, offset);
            applyControls(ally, input, dt, false);
            integrateForces(ally, dt);
            if (state.outcome === "active" && input.fire) spawnBullet(ally);
        });

        entities.enemies.forEach((enemy) => {
            if (enemy.userData.hp <= 0) return;
            const input = aiSystem.getControlInput(enemy, dt, entities.enemies, [entities.player, ...entities.allies]);
            applyControls(enemy, input, dt, false);
            integrateForces(enemy, dt);
            if (state.outcome === "active" && input.fire) spawnBullet(enemy);
        });
    }

    const missionSnapshot = objectives.update();
    const missionState = objectives.getState();
    if (missionState.won) state.outcome = "won";
    if (missionState.lost) state.outcome = "lost";
    if (state.outcome === "active") {
        waveDirector.update(missionSnapshot);
        flakSystem.update(dt);
    }

    // Cloud drift
    world.update(dt);

    // Fire cooldown
    [entities.player, ...entities.allies, ...entities.enemies].forEach((p) => {
        if (!p) return;
        p.userData.fireCd = Math.max(0, p.userData.fireCd - dt);
        p.userData.rocketCd = Math.max(0, (p.userData.rocketCd || 0) - dt);
        p.userData.bombCd = Math.max(0, (p.userData.bombCd || 0) - dt);
        if (p.userData.prop) p.userData.prop.rotation.x += dt * 30;
        updateControlSurfaces(p);
    });

    updateBullets(dt);
    updateRockets(dt);
    updateBombs(dt);
    updateParticles(dt);
    wrapAllMovingEntities();

    if (reticle) {
        reticle.style.display = keys[settings.controls.lookBack] || keys[settings.controls.freeLook] ? "none" : "block";
    }

    updateEngineAudio();
    updateCamera(dt);
    mouse.dx *= 0.12;
    mouse.dy *= 0.12;
    markerSystem.update(camera);
    radarSystem.update();
    updateHUD();

    if (renderFrame) {
        renderer.render(scene, camera);
    }
}

attachDebugApi({
    window,
    keys,
    mouse,
    reticle,
    entities,
    camera,
    forwardOf,
    upOf,
    rightOf,
    resetPlayer,
    tick,
});

let last = performance.now();
function loop() {
    const now = performance.now();
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    tick(dt, { updateAI: true, renderFrame: true });
    requestAnimationFrame(loop);
}

resetPlayer();
showBanner("LOCK & FLY");
loop();

addEventListener("resize", () => {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
});

addEventListener("keydown", (e) => {
    if (!e.repeat && e.code === settings.controls.zoom) {
        state.zoomed = !state.zoomed;
    }
});
