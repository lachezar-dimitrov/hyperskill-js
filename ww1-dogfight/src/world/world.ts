// @ts-nocheck
function peak(x, z, cx, cz, radiusX, radiusZ, height) {
    const nx = (x - cx) / radiusX;
    const nz = (z - cz) / radiusZ;
    const dist = nx * nx + nz * nz;
    if (dist >= 1) return 0;
    const falloff = 1 - dist;
    return falloff * falloff * height;
}

function smoothstep(edge0, edge1, value) {
    const t = THREE_MATH.clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
}

function riverCenterX(cfg, z) {
    return Math.sin(z / 720) * 340 + Math.cos(z / 1500 + 0.8) * 180 - cfg.world.size * 0.14;
}

function riverWidth(cfg, z) {
    return 90 + Math.sin(z / 560 + 1.2) * 24 + Math.cos(z / 920) * 14;
}

function riverInfluence(cfg, x, z) {
    const center = riverCenterX(cfg, z);
    const width = riverWidth(cfg, z);
    const dist = Math.abs(x - center);
    if (dist >= width * 2.6) return 0;
    return 1 - smoothstep(width * 0.55, width * 2.6, dist);
}

function seaInfluence(cfg, x, z) {
    const coastX = cfg.world.size * 0.33 + Math.sin(z / 850) * 180 + Math.cos(z / 1600) * 110;
    if (x <= coastX - 220) return 0;
    return smoothstep(coastX - 220, coastX + 520, x);
}

function terrainHeight(cfg, x, z) {
    const rolling =
        Math.sin(x / cfg.world.groundScale) * Math.cos(z / (cfg.world.groundScale * 1.2)) * (cfg.world.hillAmp * 1.25);
    const secondary =
        Math.sin((x + z * 0.6) / 220) * 18 +
        Math.cos((z - x * 0.35) / 340) * 24 +
        Math.sin(z / 90) * 7;
    const ridge =
        peak(x, z, -980, 1220, 900, 650, 230) +
        peak(x, z, -1720, 760, 760, 520, 165) +
        peak(x, z, 1180, -1360, 980, 760, 245) +
        peak(x, z, 1740, -980, 640, 520, 145) +
        peak(x, z, 1440, 1420, 860, 680, 210);
    const valley = peak(x, z, 260, -220, 1400, 880, 30);
    const riverCut = riverInfluence(cfg, x, z) * (38 + Math.sin(z / 200) * 10 + Math.cos(x / 260) * 5);
    const coastalShelf = seaInfluence(cfg, x, z) * (160 + Math.sin(z / 180) * 8);
    const coastalDunes = seaInfluence(cfg, x, z) * peak(x, z, cfg.world.size * 0.28, 0, 2400, 3200, 18);
    const height = rolling + secondary + ridge - valley - riverCut - coastalShelf + coastalDunes - 72;
    return Math.max(cfg.world.seaLevel - 6, height);
}

function applyRunwaySurface(height, runway, x, z) {
    const dx = Math.abs(x - runway.center.x);
    const dz = Math.abs(z - runway.center.z);
    if (dx <= runway.flatHalfWidth && dz <= runway.flatHalfLength) {
        return runway.y;
    }
    if (dx <= runway.blendHalfWidth && dz <= runway.blendHalfLength) {
        const edgeX = THREE_MATH.clamp((dx - runway.flatHalfWidth) / (runway.blendHalfWidth - runway.flatHalfWidth), 0, 1);
        const edgeZ = THREE_MATH.clamp(
            (dz - runway.flatHalfLength) / (runway.blendHalfLength - runway.flatHalfLength),
            0,
            1,
        );
        const blend = 1 - Math.max(edgeX, edgeZ);
        return height * (1 - blend) + runway.y * blend;
    }
    return height;
}

const THREE_MATH = {
    clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    },
};

function noise2(x, z) {
    const n = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
    return n - Math.floor(n);
}

function insideRect(x, z, rect) {
    return Math.abs(x - rect.center.x) <= rect.halfWidth && Math.abs(z - rect.center.z) <= rect.halfLength;
}

function wrapCoord(value, halfSize, margin = 0) {
    const limit = halfSize + margin;
    if (value > limit) return -limit;
    if (value < -limit) return limit;
    return value;
}

function wrapVector2(cfg, x, z) {
    const half = cfg.world.size / 2;
    const margin = cfg.world.wrapMargin || 0;
    return {
        x: wrapCoord(x, half, margin),
        z: wrapCoord(z, half, margin),
    };
}

function makeTree(THREE) {
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.65, 4.8, 5),
        new THREE.MeshStandardMaterial({ color: 0x6a4524, flatShading: true, roughness: 1 }),
    );
    trunk.position.y = 2.4;
    group.add(trunk);

    const crownA = new THREE.Mesh(
        new THREE.ConeGeometry(2.6, 5.5, 6),
        new THREE.MeshStandardMaterial({ color: 0x2b6b2f, flatShading: true, roughness: 1 }),
    );
    crownA.position.y = 6;
    group.add(crownA);

    const crownB = crownA.clone();
    crownB.scale.setScalar(0.78);
    crownB.position.y = 8.2;
    group.add(crownB);

    group.traverse((obj) => {
        obj.castShadow = true;
        obj.receiveShadow = true;
    });
    return group;
}

function makeBush(THREE) {
    const bush = new THREE.Mesh(
        new THREE.IcosahedronGeometry(2.2, 0),
        new THREE.MeshStandardMaterial({ color: 0x447f32, flatShading: true, roughness: 1 }),
    );
    bush.castShadow = true;
    bush.receiveShadow = true;
    return bush;
}

function makeRock(THREE) {
    const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(2.4, 0),
        new THREE.MeshStandardMaterial({ color: 0x71767d, flatShading: true, roughness: 1 }),
    );
    rock.castShadow = true;
    rock.receiveShadow = true;
    return rock;
}

function makeDock(THREE, length = 120, width = 18) {
    const group = new THREE.Group();
    const deck = new THREE.Mesh(
        new THREE.BoxGeometry(width, 3.4, length),
        new THREE.MeshStandardMaterial({ color: 0x82664a, flatShading: true, roughness: 1 }),
    );
    deck.position.y = 1.7;
    group.add(deck);

    const pileMat = new THREE.MeshStandardMaterial({ color: 0x5a4634, flatShading: true, roughness: 1 });
    for (let i = -length / 2 + 12; i <= length / 2 - 12; i += 18) {
        const left = new THREE.Mesh(new THREE.BoxGeometry(2.2, 10, 2.2), pileMat);
        left.position.set(-width * 0.33, -3.2, i);
        const right = left.clone();
        right.position.x = width * 0.33;
        group.add(left, right);
    }

    group.traverse((obj) => {
        obj.castShadow = true;
        obj.receiveShadow = true;
    });
    return group;
}

function makeCrateStack(THREE, color = 0x816246) {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 1 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 10), mat);
    base.position.y = 4;
    const top = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 8), mat);
    top.position.set(1, 11, -1);
    group.add(base, top);
    group.traverse((obj) => {
        obj.castShadow = true;
        obj.receiveShadow = true;
    });
    return group;
}

function makeShip(THREE) {
    const group = new THREE.Group();
    const hullMat = new THREE.MeshStandardMaterial({ color: 0x3b4e68, flatShading: true, roughness: 0.9 });
    const deckMat = new THREE.MeshStandardMaterial({ color: 0xa6b3bf, flatShading: true, roughness: 0.85 });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0xc97535, flatShading: true, roughness: 0.8 });

    const hull = new THREE.Mesh(new THREE.BoxGeometry(24, 8, 108), hullMat);
    hull.position.y = 6;
    group.add(hull);

    const bow = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 12, 20, 5), hullMat);
    bow.rotation.z = Math.PI / 2;
    bow.rotation.y = Math.PI / 2;
    bow.position.set(0, 7, -64);
    group.add(bow);

    const stern = new THREE.Mesh(new THREE.BoxGeometry(20, 6, 18), hullMat);
    stern.position.set(0, 7, 52);
    group.add(stern);

    const deck = new THREE.Mesh(new THREE.BoxGeometry(20, 2, 86), deckMat);
    deck.position.y = 11;
    group.add(deck);

    const bridge = new THREE.Mesh(new THREE.BoxGeometry(15, 10, 16), deckMat);
    bridge.position.set(0, 17, 8);
    group.add(bridge);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(11, 7, 12), deckMat);
    cabin.position.set(0, 23, 20);
    group.add(cabin);

    const stackA = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3, 12, 6), accentMat);
    stackA.position.set(-3.2, 27, 4);
    const stackB = stackA.clone();
    stackB.position.set(3.2, 26, -4);
    group.add(stackA, stackB);

    group.traverse((obj) => {
        obj.castShadow = true;
        obj.receiveShadow = true;
    });
    return group;
}

function makeRingGate(THREE, color) {
    const group = new THREE.Group();
    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(9, 1.2, 10, 24),
        new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.28,
            flatShading: true,
            roughness: 0.85,
        }),
    );
    group.add(ring);

    const postMat = new THREE.MeshStandardMaterial({ color: 0x5b6775, flatShading: true, roughness: 1 });
    const postLeft = new THREE.Mesh(new THREE.BoxGeometry(1.5, 18, 1.5), postMat);
    postLeft.position.set(-8.5, -9, 0);
    const postRight = postLeft.clone();
    postRight.position.x = 8.5;
    group.add(postLeft, postRight);

    group.traverse((obj) => {
        obj.castShadow = true;
        obj.receiveShadow = true;
    });
    return group;
}

function makePylon(THREE, height = 80) {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x646c75, flatShading: true, roughness: 1 });

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 4.2, height, 6), mat);
    trunk.position.y = height / 2;
    group.add(trunk);

    const cap = new THREE.Mesh(new THREE.ConeGeometry(6, 14, 6), mat);
    cap.position.y = height + 7;
    group.add(cap);

    group.traverse((obj) => {
        obj.castShadow = true;
        obj.receiveShadow = true;
    });
    return group;
}

function scatterAerobatics({ THREE, scene, getGroundHeightAt, corridors }) {
    const group = new THREE.Group();

    corridors.forEach((corridor, corridorIndex) => {
        for (let i = 0; i < 5; i++) {
            const t = (i + 1) / 6;
            const x = corridor.from.x + (corridor.to.x - corridor.from.x) * t;
            const z = corridor.from.z + (corridor.to.z - corridor.from.z) * t;
            const ring = makeRingGate(THREE, corridorIndex === 0 ? 0xffa62b : 0x6fd8ff);
            const groundY = getGroundHeightAt(x, z);
            ring.position.set(x, groundY + 58 + i * 12, z);
            ring.rotation.y = corridor.yaw;
            ring.rotation.x = corridor.pitch;
            group.add(ring);
        }

        for (let i = 0; i < 4; i++) {
            const t = (i + 0.5) / 4;
            const x = corridor.from.x + (corridor.to.x - corridor.from.x) * t + (i % 2 === 0 ? 36 : -36);
            const z = corridor.from.z + (corridor.to.z - corridor.from.z) * t + (i % 2 === 0 ? -24 : 24);
            const pylon = makePylon(THREE, 90 + i * 12);
            pylon.position.set(x, getGroundHeightAt(x, z), z);
            pylon.rotation.y = Math.random() * Math.PI;
            group.add(pylon);
        }
    });

    scene.add(group);
    return group;
}

function scatterLandscape({ THREE, scene, getGroundHeightAt, cfg, avoidRects }) {
    const decor = new THREE.Group();
    const limit = cfg.world.size * 0.45;

    function blocked(x, z) {
        if (avoidRects.some((rect) => insideRect(x, z, rect))) return true;
        if (seaInfluence(cfg, x, z) > 0.08 || riverInfluence(cfg, x, z) > 0.34) return true;
        const h = getGroundHeightAt(x, z);
        const sx = Math.abs(getGroundHeightAt(x + 18, z) - getGroundHeightAt(x - 18, z));
        const sz = Math.abs(getGroundHeightAt(x, z + 18) - getGroundHeightAt(x, z - 18));
        return h > 30 || sx > 14 || sz > 14;
    }

    function place(obj, x, z, yOffset = 0) {
        obj.position.set(x, getGroundHeightAt(x, z) - 1.2 + yOffset, z);
        decor.add(obj);
    }

    for (let i = 0; i < 760; i++) {
        const x = (Math.random() - 0.5) * limit * 2;
        const z = (Math.random() - 0.5) * limit * 2;
        if (blocked(x, z)) continue;
        const tree = makeTree(THREE);
        const scale = 0.8 + Math.random() * 1.4;
        tree.scale.set(scale, scale * (0.9 + Math.random() * 0.25), scale);
        tree.rotation.y = Math.random() * Math.PI * 2;
        place(tree, x, z, -1.4);
    }

    for (let i = 0; i < 520; i++) {
        const x = (Math.random() - 0.5) * limit * 2;
        const z = (Math.random() - 0.5) * limit * 2;
        if (blocked(x, z)) continue;
        const bush = makeBush(THREE);
        const scale = 0.7 + Math.random() * 1.6;
        bush.scale.setScalar(scale);
        bush.rotation.y = Math.random() * Math.PI * 2;
        place(bush, x, z, 0.2);
    }

    for (let i = 0; i < 170; i++) {
        const x = (Math.random() - 0.5) * limit * 2;
        const z = (Math.random() - 0.5) * limit * 2;
        if (blocked(x, z)) continue;
        const rock = makeRock(THREE);
        const scale = 0.8 + Math.random() * 2.2;
        rock.scale.set(scale * 1.2, scale * 0.8, scale);
        rock.rotation.set(Math.random() * 0.4, Math.random() * Math.PI * 2, Math.random() * 0.4);
        place(rock, x, z, 0.1);
    }

    scene.add(decor);
    return decor;
}

function makeBuilding(THREE, { width, height, depth, color, roofColor }) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.95 }),
    );
    body.position.y = height / 2;
    group.add(body);

    if (roofColor) {
        const roof = new THREE.Mesh(
            new THREE.ConeGeometry(Math.max(width, depth) * 0.7, height * 0.45, 4),
            new THREE.MeshStandardMaterial({ color: roofColor, flatShading: true, roughness: 0.9 }),
        );
        roof.position.y = height + height * 0.18;
        roof.rotation.y = Math.PI / 4;
        group.add(roof);
    }

    group.traverse((obj) => {
        obj.castShadow = true;
        obj.receiveShadow = true;
    });
    return group;
}

function makeTower(THREE, color = 0x7a7f86) {
    const group = new THREE.Group();
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(3.4, 4.6, 18, 6),
        new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.9 }),
    );
    base.position.y = 9;
    group.add(base);
    const top = new THREE.Mesh(
        new THREE.BoxGeometry(10, 4, 10),
        new THREE.MeshStandardMaterial({ color: 0x515760, flatShading: true, roughness: 0.8 }),
    );
    top.position.y = 19;
    group.add(top);
    group.traverse((obj) => {
        obj.castShadow = true;
        obj.receiveShadow = true;
    });
    return group;
}

function makeFuelTank(THREE, color = 0xa9b7bf) {
    const group = new THREE.Group();
    const tank = new THREE.Mesh(
        new THREE.CylinderGeometry(3.6, 3.6, 12, 10),
        new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.75 }),
    );
    tank.rotation.z = Math.PI / 2;
    tank.position.y = 4.5;
    group.add(tank);
    const cradleA = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 2.4, 7),
        new THREE.MeshStandardMaterial({ color: 0x5f4731, flatShading: true, roughness: 1 }),
    );
    cradleA.position.set(-3, 1.2, 0);
    const cradleB = cradleA.clone();
    cradleB.position.x = 3;
    group.add(cradleA, cradleB);
    group.traverse((obj) => {
        obj.castShadow = true;
        obj.receiveShadow = true;
    });
    return group;
}

function placeOnGround(obj, getGroundHeightAt, x, z, extraY = 0) {
    obj.position.set(x, getGroundHeightAt(x, z) + extraY, z);
}

function makeCloud(THREE, cfg) {
    const group = new THREE.Group();
    const puffMat = new THREE.MeshStandardMaterial({
        color: 0xf3f8ff,
        flatShading: true,
        roughness: 1,
        emissive: 0xd9ebff,
        emissiveIntensity: 0.1,
    });
    const pieces = 4 + Math.floor(Math.random() * 3);
    let maxRadius = 0;
    for (let i = 0; i < pieces; i++) {
        const radius = 10 + Math.random() * 16;
        maxRadius = Math.max(maxRadius, radius);
        const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 0), puffMat);
        puff.position.set((i - pieces / 2) * (8 + Math.random() * 10), Math.random() * 6, (Math.random() - 0.5) * 10);
        group.add(puff);
    }
    group.position.set(
        (Math.random() - 0.5) * cfg.world.size,
        180 + Math.random() * 220,
        (Math.random() - 0.5) * cfg.world.size,
    );
    group.rotation.y = Math.random() * Math.PI * 2;
    group.userData.drift = new THREE.Vector3((Math.random() - 0.5) * 2.4, 0, (Math.random() - 0.5) * 2.4);
    group.userData.radius = maxRadius * 2.4;
    return group;
}

function makeRunway(THREE) {
    const group = new THREE.Group();
    const strip = new THREE.Mesh(
        new THREE.BoxGeometry(28, 0.6, 220),
        new THREE.MeshStandardMaterial({ color: 0x3b4149, roughness: 0.95, flatShading: true }),
    );
    strip.position.y = 0.3;
    group.add(strip);

    const centerMat = new THREE.MeshStandardMaterial({ color: 0xe8dec7, roughness: 1, flatShading: true });
    for (let i = -80; i <= 80; i += 22) {
        const mark = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.62, 10), centerMat);
        mark.position.set(0, 0.35, i);
        group.add(mark);
    }

    const shoulder = new THREE.Mesh(
        new THREE.BoxGeometry(54, 0.2, 260),
        new THREE.MeshStandardMaterial({ color: 0x907e61, roughness: 1, flatShading: true }),
    );
    shoulder.position.y = 0.05;
    group.add(shoulder);

    group.traverse((obj) => {
        obj.castShadow = true;
        obj.receiveShadow = true;
    });
    return group;
}

function createTargetRecord(obj, kind, team, hp, radius) {
    obj.userData.target = { kind, team, hp, maxHp: hp, radius };
    return obj;
}

function createPort(THREE, getGroundHeightAt, cfg) {
    const group = new THREE.Group();
    const coastX = cfg.world.size * 0.31;
    const origin = { x: coastX - 140, z: cfg.world.size * 0.18 };

    const warehouseA = makeBuilding(THREE, {
        width: 24,
        height: 12,
        depth: 26,
        color: 0x7b8176,
        roofColor: 0x4f5649,
    });
    placeOnGround(warehouseA, getGroundHeightAt, origin.x - 36, origin.z - 22, 0);
    group.add(warehouseA);

    const warehouseB = makeBuilding(THREE, {
        width: 18,
        height: 10,
        depth: 18,
        color: 0x8a7a67,
        roofColor: 0x5f4a39,
    });
    placeOnGround(warehouseB, getGroundHeightAt, origin.x - 64, origin.z + 30, 0);
    group.add(warehouseB);

    const crane = makeTower(THREE, 0x6d727a);
    placeOnGround(crane, getGroundHeightAt, origin.x + 26, origin.z - 4, 0);
    crane.scale.set(0.8, 1.15, 0.8);
    group.add(crane);

    const dock = makeDock(THREE, 150, 18);
    dock.position.set(origin.x + 82, cfg.world.seaLevel + 1.5, origin.z);
    group.add(dock);

    const dock2 = makeDock(THREE, 96, 14);
    dock2.rotation.y = Math.PI / 2;
    dock2.position.set(origin.x + 110, cfg.world.seaLevel + 1.5, origin.z + 54);
    group.add(dock2);

    const crateA = makeCrateStack(THREE);
    placeOnGround(crateA, getGroundHeightAt, origin.x - 14, origin.z + 44, 0);
    group.add(crateA);
    const crateB = makeCrateStack(THREE, 0x6c553d);
    placeOnGround(crateB, getGroundHeightAt, origin.x + 8, origin.z + 54, 0);
    crateB.scale.set(0.8, 0.8, 0.8);
    group.add(crateB);

    const ship = makeShip(THREE);
    ship.position.set(origin.x + 160, cfg.world.seaLevel + 4, origin.z + 40);
    ship.rotation.y = Math.PI;
    ship.userData.drift = new THREE.Vector3(0, 0, 7);
    ship.userData.seaMinZ = origin.z - 620;
    ship.userData.seaMaxZ = origin.z + 620;
    group.add(ship);

    return { group, ship, origin };
}

function createGroundBase(THREE, getGroundHeightAt, origin, team) {
    const group = new THREE.Group();
    const targets = [];
    const tint =
        team === "friendly"
            ? { hut: 0x8ca08c, roof: 0x5a684d, trim: 0x6d7a84 }
            : { hut: 0x9e8d77, roof: 0x67533f, trim: 0x7f858d };

    const runway = makeRunway(THREE);
    placeOnGround(runway, getGroundHeightAt, origin.x, origin.z, 0);
    group.add(runway);

    const controlTower = createTargetRecord(makeTower(THREE, tint.trim), "tower", team, 110, 9);
    placeOnGround(controlTower, getGroundHeightAt, origin.x + 42, origin.z - 32, 0);
    group.add(controlTower);
    targets.push(controlTower);

    const hangarA = createTargetRecord(
        makeBuilding(THREE, { width: 18, height: 10, depth: 24, color: tint.hut, roofColor: tint.roof }),
        "hangar",
        team,
        90,
        15,
    );
    placeOnGround(hangarA, getGroundHeightAt, origin.x - 46, origin.z - 46, 0);
    group.add(hangarA);
    targets.push(hangarA);

    const hangarB = createTargetRecord(
        makeBuilding(THREE, { width: 18, height: 10, depth: 24, color: tint.hut, roofColor: tint.roof }),
        "hangar",
        team,
        90,
        15,
    );
    placeOnGround(hangarB, getGroundHeightAt, origin.x - 46, origin.z + 46, 0);
    group.add(hangarB);
    targets.push(hangarB);

    const barracks = createTargetRecord(
        makeBuilding(THREE, { width: 14, height: 8, depth: 12, color: 0x85745b, roofColor: 0x594838 }),
        "barracks",
        team,
        70,
        11,
    );
    placeOnGround(barracks, getGroundHeightAt, origin.x + 56, origin.z + 38, 0);
    group.add(barracks);
    targets.push(barracks);

    const fuelTankA = createTargetRecord(makeFuelTank(THREE), "fuel", team, 65, 8);
    placeOnGround(fuelTankA, getGroundHeightAt, origin.x + 28, origin.z + 68, 0);
    group.add(fuelTankA);
    targets.push(fuelTankA);

    const fuelTankB = createTargetRecord(makeFuelTank(THREE), "fuel", team, 65, 8);
    placeOnGround(fuelTankB, getGroundHeightAt, origin.x + 40, origin.z + 82, 0);
    group.add(fuelTankB);
    targets.push(fuelTankB);

    return { group, runway, targets, origin };
}

export function createWorld({ THREE, scene, cfg }) {
    const friendlyRunway = {
        center: { x: -140, z: -40 },
        y: terrainHeight(cfg, -140, -40),
        halfWidth: 34,
        halfLength: 145,
        flatHalfWidth: 38,
        flatHalfLength: 150,
        blendHalfWidth: 56,
        blendHalfLength: 176,
    };
    const enemyRunway = {
        center: { x: 420, z: 220 },
        y: terrainHeight(cfg, 420, 220),
        halfWidth: 34,
        halfLength: 145,
        flatHalfWidth: 38,
        flatHalfLength: 150,
        blendHalfWidth: 56,
        blendHalfLength: 176,
    };
    const getGroundHeightAt = (x, z) => {
        let height = terrainHeight(cfg, x, z);
        height = applyRunwaySurface(height, friendlyRunway, x, z);
        height = applyRunwaySurface(height, enemyRunway, x, z);
        return height;
    };
    const getSeaLevelAt = (x, z) => {
        const river = riverInfluence(cfg, x, z);
        const sea = seaInfluence(cfg, x, z);
        if (sea <= 0.02 && river <= 0.2) return null;
        const riverLevel = cfg.world.seaLevel + 4 + Math.sin(z / 380) * 1.5;
        return Math.max(
            sea > 0.02 ? cfg.world.seaLevel : -Infinity,
            river > 0.2 ? riverLevel : -Infinity,
        );
    };

    const groundGeo = new THREE.PlaneGeometry(cfg.world.size, cfg.world.size, 260, 260);
    const pos = groundGeo.attributes.position;
    const colors = [];
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getY(i);
        const y = getGroundHeightAt(x, z);
        pos.setZ(i, y);
        const n = noise2(x * 0.025, z * 0.025);
        const m = noise2(x * 0.007, z * 0.007);
        const river = riverInfluence(cfg, x, z);
        const sea = seaInfluence(cfg, x, z);
        let r = 0.16;
        let g = 0.42;
        let b = 0.15;

        if (sea > 0.15) {
            r = 0.78;
            g = 0.74;
            b = 0.58;
        } else if (river > 0.34) {
            r = 0.26;
            g = 0.44;
            b = 0.2;
        } else if (y > 120) {
            r = 0.71;
            g = 0.68;
            b = 0.63;
        } else if (y > 55) {
            r = 0.57;
            g = 0.54;
            b = 0.43;
        } else if (y > 18) {
            r = 0.48;
            g = 0.55;
            b = 0.28;
        } else if (m > 0.72) {
            r = 0.63;
            g = 0.55;
            b = 0.3;
        } else if (n < 0.22) {
            r = 0.18;
            g = 0.39;
            b = 0.18;
        } else if (n > 0.78) {
            r = 0.34;
            g = 0.56;
            b = 0.24;
        } else {
            r = 0.25;
            g = 0.49;
            b = 0.23;
        }

        const shade = THREE_MATH.clamp(0.94 + (y + 60) * 0.0034, 0.8, 1.18);
        colors.push(r * shade, g * shade, b * shade);
    }
    groundGeo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    groundGeo.computeVertexNormals();

    const ground = new THREE.Mesh(
        groundGeo,
        new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.95,
            metalness: 0,
            flatShading: true,
            emissive: 0x13220f,
            emissiveIntensity: 0.12,
        }),
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const seaPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(cfg.world.size * 1.24, cfg.world.size * 1.24, 1, 1),
        new THREE.MeshStandardMaterial({
            color: 0x4e8fb7,
            roughness: 0.28,
            metalness: 0.05,
            transparent: true,
            opacity: 0.92,
        }),
    );
    seaPlane.rotation.x = -Math.PI / 2;
    seaPlane.position.y = cfg.world.seaLevel;
    scene.add(seaPlane);

    const riverPath = new THREE.Group();
    const riverMat = new THREE.MeshStandardMaterial({
        color: 0x5e9dbb,
        roughness: 0.22,
        metalness: 0.04,
        transparent: true,
        opacity: 0.94,
    });
    for (let z = -cfg.world.size / 2; z <= cfg.world.size / 2; z += 180) {
        const x = riverCenterX(cfg, z);
        const width = riverWidth(cfg, z) * 2.1;
        const seg = new THREE.Mesh(new THREE.PlaneGeometry(width, 220, 1, 1), riverMat);
        seg.rotation.x = -Math.PI / 2;
        seg.position.set(x, cfg.world.seaLevel + 3.4 + Math.sin(z / 380) * 1.2, z);
        riverPath.add(seg);
    }
    scene.add(riverPath);

    const sky = new THREE.Mesh(
        new THREE.SphereGeometry(5200, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0x9fd2ff, side: THREE.BackSide }),
    );
    scene.add(sky);
    scene.fog = new THREE.Fog(0x9fd2ff, 3600, 7600);

    scatterLandscape({
        THREE,
        scene,
        getGroundHeightAt,
        cfg,
        avoidRects: [
            { center: friendlyRunway.center, halfWidth: 170, halfLength: 290 },
            { center: enemyRunway.center, halfWidth: 170, halfLength: 290 },
        ],
    });
    scatterAerobatics({
        THREE,
        scene,
        getGroundHeightAt,
        corridors: [
            {
                from: { x: -760, z: -420 },
                to: { x: -80, z: -760 },
                yaw: Math.PI * 0.18,
                pitch: Math.PI * 0.08,
            },
            {
                from: { x: 640, z: 260 },
                to: { x: 1360, z: -240 },
                yaw: -Math.PI * 0.22,
                pitch: -Math.PI * 0.05,
            },
        ],
    });

    const clouds = [];
    for (let i = 0; i < cfg.world.cloudCount; i++) {
        const c = makeCloud(THREE, cfg);
        clouds.push(c);
        scene.add(c);
    }

    const friendlyBase = createGroundBase(THREE, getGroundHeightAt, { x: -140, z: -40 }, "friendly");
    scene.add(friendlyBase.group);

    const enemyBase = createGroundBase(THREE, getGroundHeightAt, { x: 420, z: 220 }, "enemy");
    enemyBase.group.rotation.y = Math.PI;
    scene.add(enemyBase.group);

    const port = createPort(THREE, getGroundHeightAt, cfg);
    scene.add(port.group);

    const targets = [...friendlyBase.targets, ...enemyBase.targets];

    function update(dt) {
        clouds.forEach((c) => {
            c.position.add(c.userData.drift.clone().multiplyScalar(dt));
            if (c.position.x > cfg.world.size / 2) c.position.x = -cfg.world.size / 2;
            if (c.position.x < -cfg.world.size / 2) c.position.x = cfg.world.size / 2;
            if (c.position.z > cfg.world.size / 2) c.position.z = -cfg.world.size / 2;
            if (c.position.z < -cfg.world.size / 2) c.position.z = cfg.world.size / 2;
        });

        port.ship.position.addScaledVector(port.ship.userData.drift, dt);
        if (port.ship.position.z > port.ship.userData.seaMaxZ) {
            port.ship.position.z = port.ship.userData.seaMinZ;
        }
        if (port.ship.position.z < port.ship.userData.seaMinZ) {
            port.ship.position.z = port.ship.userData.seaMaxZ;
        }
    }

    const friendlySpawnX = friendlyRunway.center.x;
    const friendlySpawnZ = friendlyRunway.center.z - friendlyRunway.halfLength - 110;

    return {
        clouds,
        ship: port.ship,
        targets,
        getGroundHeightAt,
        getSeaLevelAt,
        wrapPoint(x, z) {
            return wrapVector2(cfg, x, z);
        },
        wrapDelta(dx, dz) {
            const half = cfg.world.size / 2;
            let nextDx = dx;
            let nextDz = dz;
            if (nextDx > half) nextDx -= cfg.world.size;
            if (nextDx < -half) nextDx += cfg.world.size;
            if (nextDz > half) nextDz -= cfg.world.size;
            if (nextDz < -half) nextDz += cfg.world.size;
            return { x: nextDx, z: nextDz };
        },
        wrapObject(obj) {
            if (!obj) return;
            const wrapped = wrapVector2(cfg, obj.position.x, obj.position.z);
            obj.position.x = wrapped.x;
            obj.position.z = wrapped.z;
        },
        friendlyRunway: {
            center: friendlyBase.runway.position.clone(),
            y: friendlyRunway.y,
            halfWidth: 48,
            halfLength: 170,
        },
        friendlyAirfield: {
            center: friendlyBase.runway.position.clone(),
            halfWidth: 120,
            halfLength: 250,
            y: friendlyRunway.y,
        },
        friendlySpawn: new THREE.Vector3(
            friendlySpawnX,
            getGroundHeightAt(friendlySpawnX, friendlySpawnZ) + 34,
            friendlySpawnZ,
        ),
        enemyBaseCenter: new THREE.Vector3(420, getGroundHeightAt(420, 220), 220),
        portCenter: new THREE.Vector3(port.origin.x, getGroundHeightAt(port.origin.x, port.origin.z), port.origin.z),
        update,
    };
}
