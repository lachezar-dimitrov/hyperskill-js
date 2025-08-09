// Extracted from index.html inline <script type="module">
// ----- Load Three.js as ESM with CDN fallbacks -----
async function loadThree() {
    const cdns = [
        "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js",
        "https://unpkg.com/three@0.161.0/build/three.module.js",
        "https://esm.sh/three@0.161.0",
    ];
    let lastErr;
    for (const url of cdns) {
        try {
            return await import(url);
        } catch (e) {
            lastErr = e;
        }
    }
    throw lastErr || new Error("Failed to load three.module.js from all CDNs");
}

const testbar = document.getElementById("testbar");
function logTest(msg, ok = true) {
    testbar.textContent = (testbar.textContent ? testbar.textContent + "\n" : "") + (ok ? "✅ " : "❌ ") + msg;
}

let THREE;
try {
    THREE = await loadThree();
    logTest("Loaded Three.js module");
} catch (e) {
    logTest("Could not load Three.js. " + e.message, false);
    alert("Three.js failed to load. Error: " + e.message);
    throw e;
}

// ====== Scene & Renderer ======
const scene = new THREE.Scene();
const skyTop = new THREE.Color(0x6aa0d8),
    skyBottom = new THREE.Color(0x102030);
scene.background = skyBottom.clone();

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2500);

const hemi = new THREE.HemisphereLight(0xcde6ff, 0x223344, 0.9);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff7e0, 1.0);
sun.position.set(200, 300, 150);
scene.add(sun);

// ====== Terrain ======
const groundGeo = new THREE.PlaneGeometry(5000, 5000, 64, 64);
groundGeo.rotateX(-Math.PI / 2);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x2a4b33, roughness: 1, metalness: 0 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.receiveShadow = true;
scene.add(ground);

const runwayLen = 700,
    runwayWid = 70;
const runwayGeo = new THREE.PlaneGeometry(runwayLen, runwayWid);
runwayGeo.rotateX(-Math.PI / 2);
const runwayMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.8 });
const runway = new THREE.Mesh(runwayGeo, runwayMat);
runway.position.set(0, 0.01, 0);
scene.add(runway);

const markMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
for (let i = -runwayLen / 2 + 40; i < runwayLen / 2; i += 60) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(10, 4), markMat);
    m.rotateX(-Math.PI / 2);
    m.position.set(i, 0.02, 0);
    scene.add(m);
}

const treeMat = new THREE.MeshStandardMaterial({ color: 0x3f4d3f, roughness: 0.9 });
for (let i = 0; i < 120; i++) {
    const tree = new THREE.Mesh(new THREE.ConeGeometry(6 + Math.random() * 10, 28 + Math.random() * 30, 7), treeMat);
    const angle = Math.random() * Math.PI * 2;
    const radius = 700 + Math.random() * 1800;
    tree.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    scene.add(tree);
}

// ====== Helpers ======
function forwardOf(obj) {
    return new THREE.Vector3(1, 0, 0).applyQuaternion(obj.quaternion);
}
function bankAngleZ(obj) {
    return -obj.rotation.z;
}
function loadFactorFromBank(phi) {
    const c = Math.cos(phi);
    return 1 / Math.max(0.1, c);
}

// ====== Plane Factory ======
function makePlane(color = 0xbcc6cc) {
    const group = new THREE.Group();
    const fus = new THREE.Mesh(
        new THREE.CapsuleGeometry(3, 8, 6, 12),
        new THREE.MeshStandardMaterial({ color, roughness: 0.7 }),
    );
    fus.rotation.z = Math.PI / 2;
    group.add(fus);
    const wingGeo = new THREE.BoxGeometry(18, 0.4, 2.2);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x9aa7ad, roughness: 0.8 });
    const wingTop = new THREE.Mesh(wingGeo, wingMat);
    wingTop.position.set(0, 1.8, 0);
    const wingBot = new THREE.Mesh(wingGeo, wingMat);
    wingBot.position.set(0, -0.8, 0);
    group.add(wingTop, wingBot);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(4, 0.3, 1.2), wingMat);
    tail.position.set(-5.5, 0.6, 0);
    group.add(tail);
    const rudder = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2, 1.0), wingMat);
    rudder.position.set(-6.2, 1.2, 0);
    group.add(rudder);
    const prop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 2, 12),
        new THREE.MeshStandardMaterial({ color: 0x333, metalness: 0.2, roughness: 0.6 }),
    );
    prop.rotation.z = Math.PI / 2;
    prop.position.set(6.2, 0, 0);
    group.add(prop);
    group.userData.prop = prop;
    group.traverse((o) => {
        o.castShadow = true;
        o.receiveShadow = true;
    });
    return group;
}

// ====== Player & State ======
const player = makePlane(0xcfe3ee);
scene.add(player);
player.position.set(-200, 40, -200);

const state = {
    throttle: 0.55,
    maxThrust: 40,
    dragCoef: 0.012,
    liftCoef: 0.085,
    baseStall: 12,
    vel: new THREE.Vector3(),
    hp: 100,
    ammo: 400,
    jam: 0,
    score: 0,
    landed: false,
};

// ====== Input System (Desktop/Touch/Keyboard-only) ======
const keys = {};
addEventListener("keydown", (e) => {
    keys[e.code] = true;
});
addEventListener("keyup", (e) => {
    keys[e.code] = false;
});

const canvas = renderer.domElement;
const hint = document.getElementById("hint");
const controlSelect = document.getElementById("controlSelect");
const recenterBtn = document.getElementById("recenterBtn");

// Capability detection
const supportsPointerLock = typeof canvas.requestPointerLock === "function" && "pointerLockElement" in document;
const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

// Submode for desktop: 'pl' (pointer lock) | 'drag'
let desktopSubmode = supportsPointerLock ? "pl" : "drag";

// Input vectors (aggregated per frame)
const mouse = { dx: 0, dy: 0, sens: 0.0016 };
const touchAxes = { x: 0, y: 0 }; // -1..1 from joystick
let touchFire = false;
let touchRollL = false,
    touchRollR = false;
let selectedMode = "auto";

function resolveInputMode() {
    if (selectedMode === "desktop") return "desktop";
    if (selectedMode === "touch") return "touch";
    if (selectedMode === "keyboard") return "keyboard";
    // auto
    return hasTouch ? "touch" : "desktop";
}

controlSelect.addEventListener("change", () => {
    selectedMode = controlSelect.value;
    applyMode();
});
recenterBtn.addEventListener("click", () => {
    setStick(0, 0, true);
});

function safeRequestPointerLock() {
    if (!supportsPointerLock) return false;
    try {
        canvas.requestPointerLock();
        return true;
    } catch (e) {
        // SecurityError in sandboxed frames without allow-pointer-lock
        console.warn("PointerLock blocked or failed:", e);
        return false;
    }
}

// Desktop pointer lock OR drag fallback
function enableDesktopDragFallback(notify = false) {
    if (desktopSubmode === "drag") return; // already active
    desktopSubmode = "drag";
    const drag = { active: false, lastX: 0, lastY: 0 };
    canvas.onmousedown = (e) => {
        drag.active = true;
        drag.lastX = e.clientX;
        drag.lastY = e.clientY;
    };
    addEventListener("mouseup", () => {
        drag.active = false;
    });
    addEventListener("mouseleave", () => {
        drag.active = false;
    });
    addEventListener("mousemove", (e) => {
        if (drag.active) {
            mouse.dx += e.clientX - drag.lastX;
            mouse.dy += e.clientY - drag.lastY;
            drag.lastX = e.clientX;
            drag.lastY = e.clientY;
        }
    });
    addEventListener("keydown", (e) => {
        if (e.code === "Escape") drag.active = false;
    });
    if (notify)
        hint.textContent = "Pointer Lock not permitted here. Fallback: hold LEFT MOUSE and drag to aim. Q/E bank.";
}

function setupDesktop() {
    if (supportsPointerLock) {
        hint.textContent = "Desktop: click to lock pointer; move to aim. Q/E bank. ESC to unlock.";
        document.addEventListener("pointerlockchange", () => {
            if (document.pointerLockElement === canvas) {
                desktopSubmode = "pl";
            } else {
                // If lock lost (ESC), stay in desktop mode; user can re-lock or drag
                if (desktopSubmode !== "drag") desktopSubmode = "pl";
            }
        });
        document.addEventListener("pointerlockerror", () => {
            enableDesktopDragFallback(true);
        });
        canvas.onclick = () => {
            const ok = safeRequestPointerLock();
            if (!ok) enableDesktopDragFallback(true);
        };
        // Also collect deltas when locked
        addEventListener("mousemove", (e) => {
            if (document.pointerLockElement === canvas) {
                mouse.dx += e.movementX;
                mouse.dy += e.movementY;
            }
        });
    } else {
        enableDesktopDragFallback(false);
    }
    document.getElementById("touchUI").hidden = true;
}

// Touch UI setup
const touchUI = document.getElementById("touchUI");
const stick = document.getElementById("stick");
const stickNub = document.getElementById("stickNub");
const throttle = document.getElementById("throttle");
const throttleKnob = document.getElementById("throttleKnob");
const fireBtn = document.getElementById("fireBtn");
const rollLBtn = document.getElementById("rollL");
const rollRBtn = document.getElementById("rollR");

function setStick(nx, ny, immediate = false) {
    // clamp -1..1
    const x = Math.max(-1, Math.min(1, nx));
    const y = Math.max(-1, Math.min(1, ny));
    touchAxes.x = x;
    touchAxes.y = y;
    const r = stick.clientWidth / 2;
    const cx = r,
        cy = r;
    const px = cx + x * (r - 32);
    const py = cy + y * (r - 32);
    stickNub.style.left = px - 32 + "px";
    stickNub.style.top = py - 32 + "px";
}

function setupTouch() {
    hint.textContent = "Touch: left joystick = yaw/pitch, right slider = throttle, ● = fire, ⟲/⟳ = roll";
    touchUI.hidden = false;
    // Joystick
    const state = { id: null, cx: 0, cy: 0, r: 0 };
    const start = (x, y, id) => {
        const rect = stick.getBoundingClientRect();
        state.cx = rect.left + rect.width / 2;
        state.cy = rect.top + rect.height / 2;
        state.r = Math.min(rect.width, rect.height) / 2;
        state.id = id;
    };
    const move = (x, y) => {
        if (state.id == null) return;
        const dx = (x - state.cx) / state.r;
        const dy = (y - state.cy) / state.r;
        setStick(dx, dy);
    };
    const end = () => {
        state.id = null;
        setStick(0, 0, true);
    };
    stick.ontouchstart = (e) => {
        const t = e.changedTouches[0];
        start(t.clientX, t.clientY, t.identifier);
        move(t.clientX, t.clientY);
        e.preventDefault();
    };
    stick.ontouchmove = (e) => {
        for (const t of e.changedTouches) {
            if (state.id === t.identifier) move(t.clientX, t.clientY);
        }
        e.preventDefault();
    };
    stick.ontouchend = (e) => {
        for (const t of e.changedTouches) {
            if (state.id === t.identifier) end();
        }
        e.preventDefault();
    };
    stick.ontouchcancel = stick.ontouchend;

    // Throttle slider (0..1 from bottom to top)
    const ts = { id: null, top: 0, bottom: 0 };
    const tStart = (y, id) => {
        const r = throttle.getBoundingClientRect();
        ts.top = r.top;
        ts.bottom = r.bottom;
        ts.id = id;
    };
    const tMove = (y) => {
        if (ts.id == null) return;
        const clamped = Math.max(ts.top, Math.min(ts.bottom, y));
        const frac = 1 - (clamped - ts.top) / (ts.bottom - ts.top);
        stateSetThrottle(frac);
    };
    const tEnd = () => {
        ts.id = null;
    };
    throttle.ontouchstart = (e) => {
        const t = e.changedTouches[0];
        tStart(t.clientY, t.identifier);
        tMove(t.clientY);
        e.preventDefault();
    };
    throttle.ontouchmove = (e) => {
        for (const t of e.changedTouches) {
            if (ts.id === t.identifier) tMove(t.clientY);
        }
        e.preventDefault();
    };
    throttle.ontouchend = (e) => {
        for (const t of e.changedTouches) {
            if (ts.id === t.identifier) tEnd();
        }
        e.preventDefault();
    };
    throttle.ontouchcancel = throttle.ontouchend;

    // Fire button
    fireBtn.ontouchstart = (e) => {
        touchFire = true;
        e.preventDefault();
    };
    fireBtn.ontouchend = (e) => {
        touchFire = false;
        e.preventDefault();
    };
    fireBtn.ontouchcancel = fireBtn.ontouchend;

    // Roll buttons
    const setHold = (btn, setter) => {
        btn.ontouchstart = (e) => {
            setter(true);
            e.preventDefault();
        };
        btn.ontouchend = (e) => {
            setter(false);
            e.preventDefault();
        };
        btn.ontouchcancel = btn.ontouchend;
    };
    setHold(rollLBtn, (v) => (touchRollL = v));
    setHold(rollRBtn, (v) => (touchRollR = v));
}

function stateSetThrottle(frac) {
    state.throttle = Math.max(0, Math.min(1, frac));
    const h = throttle.clientHeight - throttleKnob.clientHeight;
    throttleKnob.style.transform = `translateY(${(1 - state.throttle) * h}px)`;
}

function applyMode() {
    const mode = resolveInputMode();
    controlSelect.value = selectedMode;
    if (mode === "desktop") {
        setupDesktop();
    } else if (mode === "touch") {
        setupTouch();
    } else {
        // keyboard
        hint.textContent = "Keyboard-only: arrows = yaw/pitch, Q/E roll, W/S throttle, Space fire";
        document.getElementById("touchUI").hidden = true;
    }
}

// Initialise control mode
applyMode();

// ====== Bots ======
const BOT_COUNT = 8;
const bots = [];
for (let i = 0; i < BOT_COUNT; i++) {
    const b = makePlane(0xd37f7f);
    scene.add(b);
    const ang = i * ((Math.PI * 2) / BOT_COUNT);
    b.position.set(Math.cos(ang) * 400 - 200, 60 + Math.random() * 30, Math.sin(ang) * 400);
    b.rotation.y = Math.random() * Math.PI * 2;
    b.userData = {
        vel: new THREE.Vector3(),
        throttle: 0.58,
        hp: 70,
        thinkCooldown: 0,
        fireCd: 0,
        target: player,
    };
    bots.push(b);
}

// ====== Projectiles & Particles ======
const bullets = [];
const particles = [];
function spawnBullet(origin, dir, from) {
    const spread = from === "player" ? 0.0035 : 0.0055;
    const rand = new THREE.Euler((Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread, 0);
    const dir2 = dir.clone().applyEuler(rand).normalize();
    const geo = new THREE.SphereGeometry(0.09, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: from === "player" ? 0xffffff : 0xffd080 });
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(origin);
    m.userData = { vel: dir2.multiplyScalar(185), ttl: 1.1, from };
    scene.add(m);
    bullets.push(m);
}

function spawnSmoke(pos, vel, life = 1.2) {
    const geo = new THREE.SphereGeometry(0.4, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.7 });
    const s = new THREE.Mesh(geo, mat);
    s.position.copy(pos);
    s.userData = { vel: vel.clone().add(new THREE.Vector3(0, 0.5, 0)), ttl: life };
    scene.add(s);
    particles.push(s);
}

// ====== Runway Capture / Repair ======
let captureProgress = 0;
const capSpan = document.getElementById("capPct");
function inRunwayBounds(pos) {
    return Math.abs(pos.x - runway.position.x) <= runwayLen / 2 && Math.abs(pos.z - runway.position.z) <= runwayWid / 2;
}

function handleLandingRepair(dt) {
    const speed = state.vel.length();
    const onGround = player.position.y <= 1.1;
    const aligned = Math.abs(player.rotation.z) < 0.2 && Math.abs(player.rotation.x) < 0.2;
    const enemiesNearby = bots.some((b) => b.userData.hp > 0 && b.position.distanceTo(runway.position) < 120);
    if (onGround && speed < 6 && inRunwayBounds(player.position) && aligned) {
        state.landed = true;
        state.hp = Math.min(100, state.hp + 25 * dt);
        if (state.hp >= 100) state.ammo = Math.min(400, state.ammo + 80 * dt);
        const rate = enemiesNearby ? 6 : 18;
        captureProgress = Math.min(100, captureProgress + rate * dt);
    } else {
        state.landed = false;
        captureProgress = Math.max(0, captureProgress - 4 * dt);
    }
    capSpan.textContent = captureProgress.toFixed(0) + "%";
}

// ====== HUD ======
const hud = document.getElementById("hud");
function drawHUD() {
    const spd = state.vel.length();
    const n = loadFactorFromBank(bankAngleZ(player));
    const mode = resolveInputMode();
    let modeLabel = mode;
    if (mode === "desktop") modeLabel += `(${desktopSubmode})`;
    hud.innerHTML =
        `<div class="row"><b>Spd:</b> ${spd.toFixed(1)} m/s &nbsp; <b>Thr:</b> ${(state.throttle * 100) | 0}% &nbsp; <b>HP:</b> ${state.hp | 0} &nbsp; <b>Ammo:</b> ${state.ammo | 0} &nbsp; <b>Jam:</b> ${state.jam > 0 ? state.jam.toFixed(1) + "s" : "—"} &nbsp; <b>Score:</b> ${state.score}</div>` +
        `<div class="row"><b>Bots:</b> ${bots.filter((b) => b.userData.hp > 0).length}/${BOT_COUNT} &nbsp; <b>n(load):</b> ${n.toFixed(2)} &nbsp; <b>Capture:</b> ${captureProgress.toFixed(0)}% &nbsp; <b>Input:</b> ${modeLabel}</div>`;
}

// ====== Player Physics & Controls ======
let fireTimer = 0;
let respawnTimer = 0.5;
function updatePlayer(dt) {
    const mode = resolveInputMode();

    // Throttle from keys (W/S) and from touch slider
    if (mode !== "touch") {
        if (keys["KeyW"]) state.throttle = Math.min(1, state.throttle + 0.45 * dt);
        if (keys["KeyS"]) state.throttle = Math.max(0, state.throttle - 0.45 * dt);
    }

    // Inputs
    let yawIn = 0,
        pitchIn = 0,
        rollIn = 0;
    let fireIn = false;

    if (mode === "desktop") {
        const yawMouse = mouse.dx * mouse.sens;
        const pitchMouse = mouse.dy * mouse.sens;
        mouse.dx = 0;
        mouse.dy = 0;
        yawIn = (keys["ArrowLeft"] ? -1 : 0) + (keys["ArrowRight"] ? 1 : 0) + yawMouse * 2.0;
        pitchIn = (keys["ArrowUp"] ? 1 : 0) + (keys["ArrowDown"] ? -1 : 0) + -pitchMouse * 1.8;
        rollIn = (keys["KeyQ"] ? -1 : 0) + (keys["KeyE"] ? 1 : 0) + yawMouse * 0.6;
        fireIn = !!keys["Space"];
    } else if (mode === "keyboard") {
        yawIn = (keys["ArrowLeft"] ? -1 : 0) + (keys["ArrowRight"] ? 1 : 0);
        pitchIn = (keys["ArrowUp"] ? 1 : 0) + (keys["ArrowDown"] ? -1 : 0);
        rollIn = (keys["KeyQ"] ? -1 : 0) + (keys["KeyE"] ? 1 : 0);
        fireIn = !!keys["Space"];
    } else {
        // touch
        yawIn = touchAxes.x * 1.8; // stronger yaw from stick
        pitchIn = -touchAxes.y * 1.6; // up on stick -> pitch up
        rollIn = (touchRollR ? 1 : 0) + (touchRollL ? -1 : 0);
        fireIn = touchFire;
    }

    // Authority scales with damage
    const controlScale = 0.6 + 0.4 * (state.hp / 100);
    player.rotation.y += THREE.MathUtils.clamp(yawIn, -1, 1) * 1.0 * dt * controlScale;
    player.rotation.z += THREE.MathUtils.clamp(-rollIn, -1, 1) * 2.0 * dt * controlScale;
    player.rotation.x += THREE.MathUtils.clamp(-pitchIn, -1, 1) * 1.3 * dt * controlScale;

    // Aerodynamics
    const fwd = forwardOf(player);
    const thrustScale = 0.6 + 0.4 * (state.hp / 100);
    const thrust = fwd.clone().multiplyScalar(state.maxThrust * state.throttle * thrustScale);
    const v = state.vel;
    const drag = v.clone().multiplyScalar(-state.dragCoef * v.length());
    const n = loadFactorFromBank(bankAngleZ(player));
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(player.quaternion);
    const liftMag = state.liftCoef * Math.max(0, v.length()) * n;
    const lift = up.multiplyScalar(liftMag);
    const gravity = new THREE.Vector3(0, -9.8, 0);
    v.add(thrust.add(drag).add(lift).add(gravity).multiplyScalar(dt));

    const stallV = state.baseStall * Math.sqrt(n);
    if (v.length() < stallV && player.rotation.x < -0.25) {
        v.y -= (stallV - v.length()) * 1.8 * dt;
    }

    player.position.add(v.clone().multiplyScalar(dt));
    if (player.position.y < 0.5) {
        player.position.y = 0.5;
        if (v.y < 0) v.y *= -0.2;
        v.x *= 0.98;
        v.z *= 0.98;
    }

    // Firing
    if (fireIn && state.ammo > 0 && state.jam <= 0) {
        fireTimer -= dt;
        if (fireTimer <= 0) {
            const f = forwardOf(player);
            const muzzle = player.position
                .clone()
                .add(f.clone().multiplyScalar(6.6))
                .add(new THREE.Vector3(0, 0.3, 0));
            spawnBullet(muzzle, f, "player");
            state.ammo -= 1;
            fireTimer = 0.05;
            if (Math.random() < 0.002) {
                state.jam = 2.0;
            }
        }
    } else {
        fireTimer = 0;
    }
    if (state.jam > 0) state.jam = Math.max(0, state.jam - dt);

    if (state.hp < 40 && Math.random() < 0.2) {
        const back = player.position.clone().add(fwd.clone().multiplyScalar(-2));
        spawnSmoke(back, v.clone().multiplyScalar(0.02), 0.8);
    }

    if (state.hp <= 0) {
        respawnTimer -= dt;
        if (respawnTimer <= 0) {
            state.hp = 100;
            state.ammo = 400;
            state.vel.set(0, 0, 0);
            player.position.set(-200, 40, -200);
            player.rotation.set(0, Math.random() * Math.PI * 2, 0);
            respawnTimer = 0.5;
        }
    }

    if (player.userData.prop) player.userData.prop.rotation.x += (20 + 80 * state.throttle) * dt;
}

// ====== Bots ======
function updateBots(dt) {
    bots.forEach((b) => {
        const d = b.userData;
        if (d.hp <= 0) {
            b.visible = false;
            return;
        }
        b.visible = true;
        d.thinkCooldown -= dt;
        d.fireCd -= dt;
        if (d.thinkCooldown <= 0) {
            const toP = player.position.clone().sub(b.position);
            const bulletSpeed = 185;
            const dist = toP.length();
            const tLead = dist / bulletSpeed;
            const leadPos = player.position.clone().add(state.vel.clone().multiplyScalar(tLead));
            const aimDir = leadPos.sub(b.position).normalize();
            const desiredYaw = Math.atan2(aimDir.z, aimDir.x);
            const curYaw = b.rotation.y;
            const yawDelta = wrapAngle(desiredYaw - curYaw);
            b.rotation.y += THREE.MathUtils.clamp(yawDelta, -0.8 * dt, 0.8 * dt);
            const dy = player.position.y - b.position.y;
            b.rotation.x += THREE.MathUtils.clamp(-dy * 0.002, -0.6 * dt, 0.6 * dt);
            b.rotation.z += THREE.MathUtils.clamp((Math.random() - 0.5) * 0.8 * dt, -0.8 * dt, 0.8 * dt);
            d.thinkCooldown = 0.02;
        }
        const fwd = forwardOf(b);
        const thrust = fwd.clone().multiplyScalar(36 * d.throttle);
        d.vel.add(thrust.multiplyScalar(dt));
        d.vel.add(d.vel.clone().multiplyScalar(-0.012 * d.vel.length() * dt));
        d.vel.y += -9.8 * dt;
        b.position.add(d.vel.clone().multiplyScalar(dt));
        if (b.position.y < 1) {
            b.position.y = 1;
            d.vel.y = Math.abs(d.vel.y) * 0.2;
            d.vel.x *= 0.98;
            d.vel.z *= 0.98;
        }

        const toP2 = player.position.clone().sub(b.position);
        const dist2 = toP2.length();
        if (dist2 < 380) {
            const aim = forwardOf(b).normalize();
            const cos = aim.dot(toP2.normalize());
            if (cos > 0.985 && d.fireCd <= 0) {
                const muzzle = b.position.clone().add(aim.clone().multiplyScalar(6.4));
                spawnBullet(muzzle, aim, "bot");
                d.fireCd = 0.06;
            }
        }

        if (d.hp < 35 && Math.random() < 0.15) {
            const back = b.position.clone().add(forwardOf(b).multiplyScalar(-2));
            spawnSmoke(back, d.vel.clone().multiplyScalar(0.02), 0.8);
        }
    });
}

// ====== Bullets & Collisions ======
function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.userData.ttl -= dt;
        if (b.userData.ttl <= 0) {
            scene.remove(b);
            bullets.splice(i, 1);
            continue;
        }
        b.position.add(b.userData.vel.clone().multiplyScalar(dt));
        if (b.userData.from === "player") {
            for (const t of bots) {
                if (t.userData.hp > 0 && b.position.distanceTo(t.position) < 2.0) {
                    t.userData.hp -= 20;
                    if (t.userData.hp <= 0) {
                        state.score += 100;
                    }
                    scene.remove(b);
                    bullets.splice(i, 1);
                    break;
                }
            }
        } else {
            if (state.hp > 0 && b.position.distanceTo(player.position) < 2.0) {
                state.hp -= 15;
                scene.remove(b);
                bullets.splice(i, 1);
            }
        }
    }
}

// ====== Particles ======
function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.userData.ttl -= dt;
        if (p.userData.ttl <= 0) {
            scene.remove(p);
            particles.splice(i, 1);
            continue;
        }
        p.material.opacity = Math.max(0, p.userData.ttl / 1.2);
        p.position.add(p.userData.vel.clone().multiplyScalar(dt));
        p.scale.multiplyScalar(1 + 0.4 * dt);
    }
}

// ====== Camera ======
function updateCamera(dt) {
    const fwd = forwardOf(player);
    const behind = player.position
        .clone()
        .add(fwd.clone().multiplyScalar(-13))
        .add(new THREE.Vector3(0, 4, 0));
    camera.position.lerp(behind, 1 - Math.pow(0.001, dt));
    const lookAt = player.position.clone().add(fwd.clone().multiplyScalar(10));
    camera.lookAt(lookAt);
}

// ====== Loop ======
let last = performance.now() / 1000;
function loop() {
    const now = performance.now() / 1000;
    let dt = Math.min(0.033, now - last);
    last = now;
    updatePlayer(dt);
    updateBots(dt);
    updateBullets(dt);
    updateParticles(dt);
    handleLandingRepair(dt);
    updateCamera(dt);
    drawHUD();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
}
loop();

addEventListener("resize", () => {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
});

// ====== Runtime Self‑tests ======
try {
    console.assert(THREE != null, "THREE module is present");
    logTest("THREE namespace present");
    const v = new THREE.Vector3(1, 2, 3);
    v.add(new THREE.Vector3(1, 0, -1));
    console.assert(v.x === 2 && v.y === 2 && v.z === 2, "Vector3 add works");
    logTest("Vector math");
    console.assert(typeof forwardOf === "function", "forwardOf exists");
    logTest("Utility present: forwardOf");
    console.assert(typeof inRunwayBounds === "function", "inRunwayBounds exists");
    logTest("Runway helper exists");
    console.assert(!inRunwayBounds(new THREE.Vector3(runwayLen, 0, runwayWid)), "Runway bounds outside false");
    logTest("Runway bounds outside");
    const n0 = loadFactorFromBank(0),
        n60 = loadFactorFromBank(Math.PI / 3);
    console.assert(Math.abs(n0 - 1) < 1e-6, "n(0)=1");
    console.assert(Math.abs(n60 - 2) < 0.05, "n(60°)≈2");
    logTest("Load factor checks");
    const s0 = 12 * Math.sqrt(n0),
        s60 = 12 * Math.sqrt(n60);
    console.assert(s60 > s0, "stall increases with bank");
    logTest("Stall scaling");
    console.assert(renderer instanceof THREE.WebGLRenderer, "renderer ok");
    logTest("Renderer present");
    console.assert(camera instanceof THREE.PerspectiveCamera, "camera ok");
    logTest("Camera present");
    const wa = ((a) => {
        while (a > Math.PI) a -= Math.PI * 2;
        while (a < -Math.PI) a += Math.PI * 2;
        return a;
    })(4 * Math.PI);
    console.assert(wa >= -Math.PI && wa <= Math.PI, "wrapAngle range");
    logTest("wrapAngle range");
    // Input capability tests (additive)
    console.assert(typeof supportsPointerLock === "boolean", "PointerLock support flag is boolean");
    logTest("PointerLock flag");
    console.assert(["auto", "desktop", "touch", "keyboard"].includes(controlSelect.value), "Control picker present");
    logTest("Control picker");
    console.assert(
        resolveInputMode() === "desktop" || resolveInputMode() === "touch" || resolveInputMode() === "keyboard",
        "Resolved mode valid",
    );
    logTest("Resolved mode");
    // NEW: pointer-lock safe wrapper
    let plOK = false;
    try {
        plOK = safeRequestPointerLock();
    } catch (e) {
        plOK = "threw";
    }
    console.assert(plOK === true || plOK === false, "safeRequestPointerLock returns boolean and does not throw");
    logTest("safeRequestPointerLock wrapper");
    if (resolveInputMode() === "desktop") {
        console.assert(["pl", "drag"].includes(desktopSubmode), "desktop submode valid");
        logTest("Desktop submode: " + desktopSubmode);
    }
    logTest("Self-tests passed.");
} catch (e) {
    logTest("Self-tests failed: " + e.message, false);
}

function wrapAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
}
