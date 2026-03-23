// @ts-nocheck
export function createPlaneFactory({ THREE, scene, cfg, syncPlaneOrientation }) {
    function makeMaterial(color, roughness = 0.58) {
        return new THREE.MeshStandardMaterial({ color, flatShading: true, roughness });
    }

    function markShadows(group) {
        group.traverse((object) => {
            object.castShadow = true;
            object.receiveShadow = true;
        });
    }

    function addPair(group, createMesh, z) {
        const left = createMesh();
        const right = createMesh();
        left.position.z = -z;
        right.position.z = z;
        group.add(left, right);
        return [left, right];
    }

    function makeSurfacePivot(THREE, geometry, material, position, z, yaw = 0) {
        const pivot = new THREE.Group();
        pivot.position.set(position.x, position.y, z);
        pivot.rotation.y = yaw;
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = geometry.parameters.width ? geometry.parameters.width * 0.5 : 0;
        pivot.add(mesh);
        return { pivot, mesh };
    }

    function addPropeller(art, accentMat, x, radius = 4.1) {
        const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.74, 1.7, 8), accentMat);
        spinner.rotation.z = Math.PI / 2;
        spinner.position.set(x + 0.52, 0, 0);
        art.add(spinner);

        const bladeGeometry = new THREE.BoxGeometry(0.16, radius, 0.22);
        const bladeA = new THREE.Mesh(bladeGeometry, accentMat);
        const bladeB = new THREE.Mesh(bladeGeometry, accentMat);
        bladeA.position.set(x, 0, 0);
        bladeB.position.set(x, 0, 0);
        bladeB.rotation.x = Math.PI / 2;
        art.add(bladeA, bladeB);
        return bladeA;
    }

    function addRockets(art, accentMat, detailMat, x, zPositions, y = -0.78) {
        const rockets = [];
        for (const z of zPositions) {
            const rocket = new THREE.Group();
            rocket.position.set(x, y, z);
            const body = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.55, 6), detailMat);
            body.rotation.z = Math.PI / 2;
            const nose = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.42, 6), accentMat);
            nose.rotation.z = Math.PI / 2;
            nose.position.x = 0.95;
            const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.03), accentMat);
            fin.position.x = -0.65;
            rocket.add(body, nose, fin, fin.clone());
            rocket.children[3].rotation.x = Math.PI / 2;
            art.add(rocket);
            rockets.push(rocket);
        }
        return rockets;
    }

    function createRudderSurface(THREE, material, points, depth = 0.08) {
        const shape = new THREE.Shape();
        shape.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
            shape.lineTo(points[i][0], points[i][1]);
        }
        shape.closePath();

        const geometry = new THREE.ExtrudeGeometry(shape, {
            depth,
            bevelEnabled: false,
        });
        geometry.translate(0, 0, -depth * 0.5);
        return new THREE.Mesh(geometry, material);
    }

    function buildSpitfireLike(THREE, art, bodyMat, accentMat, detailMat) {
        const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.36, 12.6, 8), bodyMat);
        fuselage.rotation.z = Math.PI / 2;
        fuselage.position.set(-0.3, 0.06, 0);
        fuselage.scale.set(1, 1.08, 0.9);
        art.add(fuselage);

        const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 1.08, 3.2, 8), accentMat);
        nose.rotation.z = Math.PI / 2;
        nose.position.set(7.0, 0.02, 0);
        nose.scale.set(1, 1.02, 0.96);
        art.add(nose);

        const spinnerCap = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.45, 8), accentMat);
        spinnerCap.rotation.z = Math.PI / 2;
        spinnerCap.position.set(9.35, 0, 0);
        art.add(spinnerCap);

        const spine = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.82, 1.06), bodyMat);
        spine.position.set(-1.35, 0.7, 0);
        spine.rotation.z = -0.05;
        art.add(spine);

        const canopy = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.75, 1.3), accentMat);
        canopy.position.set(-1.2, 1.08, 0);
        canopy.rotation.z = -0.08;
        art.add(canopy);

        const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.65, 1.12), detailMat);
        windshield.position.set(0.25, 1.0, 0);
        windshield.rotation.z = -0.25;
        art.add(windshield);

        const belly = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.72, 1.32), bodyMat);
        belly.position.set(1.35, -0.58, 0);
        belly.rotation.z = 0.06;
        art.add(belly);

        const wingRoot = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.18, 5.4), bodyMat);
        wingRoot.position.set(1.0, -0.02, 0);
        art.add(wingRoot);

        const wingMid = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.14, 5.0), bodyMat);
        wingMid.position.set(1.7, -0.02, 0);
        wingMid.rotation.y = -0.12;
        const [wingMidL, wingMidR] = addPair(art, () => wingMid.clone(), 5.2);
        wingMidL.rotation.z = -0.08;
        wingMidR.rotation.z = 0.08;

        const wingOuter = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.1, 3.8), bodyMat);
        wingOuter.position.set(2.05, 0.0, 0);
        wingOuter.rotation.y = -0.26;
        const [wingOuterL, wingOuterR] = addPair(art, () => wingOuter.clone(), 9.4);
        wingOuterL.rotation.z = -0.2;
        wingOuterR.rotation.z = 0.2;

        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.68, 6, 6), bodyMat);
        tip.scale.set(1.12, 0.24, 1.25);
        tip.position.set(2.95, 0.0, 11.45);
        art.add(tip, tip.clone());
        art.children[art.children.length - 1].position.z = -11.45;

        const tailBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.82, 4.8, 6), bodyMat);
        tailBoom.rotation.z = Math.PI / 2;
        tailBoom.position.set(-6.95, 0.34, 0);
        art.add(tailBoom);

        const tailCone = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.55, 6), bodyMat);
        tailCone.rotation.z = -Math.PI / 2;
        tailCone.position.set(-10.05, 0.4, 0);
        art.add(tailCone);

        const stabilizer = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 3.9), bodyMat);
        stabilizer.position.set(-8.55, 0.82, 0);
        art.add(stabilizer);

        const elevatorGeo = new THREE.BoxGeometry(1.25, 0.1, 1.85);
        const elevatorLeft = makeSurfacePivot(THREE, elevatorGeo, accentMat, new THREE.Vector3(-9.0, 0.72, 0), -2.85);
        const elevatorRight = makeSurfacePivot(THREE, elevatorGeo, accentMat, new THREE.Vector3(-9.0, 0.72, 0), 2.85);
        art.add(elevatorLeft.pivot, elevatorRight.pivot);

        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.2, 0.24), bodyMat);
        fin.position.set(-9.05, 2.0, 0);
        art.add(fin);

        const finCap = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.3, 4), bodyMat);
        finCap.rotation.z = Math.PI;
        finCap.scale.set(0.2, 0.8, 0.3);
        finCap.position.set(-9.15, 3.15, 0);
        art.add(finCap);

        const rudder = new THREE.Group();
        rudder.position.set(-9.42, 2.1, 0);
        const rudderMesh = createRudderSurface(THREE, accentMat, [
            [0.0, -0.95],
            [0.0, 0.88],
            [0.58, 0.32],
            [0.38, -0.8],
        ]);
        rudderMesh.position.y = 0.12;
        rudder.add(rudderMesh);
        art.add(rudder);

        const aileronGeo = new THREE.BoxGeometry(1.55, 0.08, 1.18);
        const aileronLeft = makeSurfacePivot(THREE, aileronGeo, accentMat, new THREE.Vector3(2.85, -0.01, 0), -8.65, -0.1);
        const aileronRight = makeSurfacePivot(THREE, aileronGeo, accentMat, new THREE.Vector3(2.85, -0.01, 0), 8.65, -0.1);
        art.add(aileronLeft.pivot, aileronRight.pivot);

        const radiator = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.34, 0.96), detailMat);
        radiator.position.set(1.2, -0.55, 3.45);
        art.add(radiator, radiator.clone());
        art.children[art.children.length - 1].position.z = -3.45;

        const rocketMeshes = addRockets(art, accentMat, detailMat, 2.2, [-6.4, -8.7, -10.8, 6.4, 8.7, 10.8]);
        const prop = addPropeller(art, accentMat, 8.35, 3.9);
        return {
            prop,
            rudder,
            elevators: [elevatorLeft.pivot, elevatorRight.pivot],
            ailerons: [aileronLeft.pivot, aileronRight.pivot],
            rocketMeshes,
        };
    }

    function buildBf109Like(THREE, art, bodyMat, accentMat, detailMat) {
        const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.96, 1.2, 12.2, 8), bodyMat);
        fuselage.rotation.z = Math.PI / 2;
        fuselage.position.set(-0.2, 0.08, 0);
        fuselage.scale.set(1, 1.04, 0.84);
        art.add(fuselage);

        const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.98, 4.2, 8), accentMat);
        nose.rotation.z = Math.PI / 2;
        nose.position.set(6.8, 0.04, 0);
        art.add(nose);

        const spinnerCap = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.55, 8), accentMat);
        spinnerCap.rotation.z = Math.PI / 2;
        spinnerCap.position.set(9.15, 0, 0);
        art.add(spinnerCap);

        const cowling = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.86, 1.0), accentMat);
        cowling.position.set(5.05, 0.45, 0);
        art.add(cowling);

        const canopy = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.76, 1.2), accentMat);
        canopy.position.set(-1.95, 1.02, 0);
        canopy.rotation.z = -0.05;
        art.add(canopy);

        const rearDeck = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.52, 0.9), bodyMat);
        rearDeck.position.set(-3.55, 0.86, 0);
        rearDeck.rotation.z = 0.04;
        art.add(rearDeck);

        const belly = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.72, 1.18), bodyMat);
        belly.position.set(2.4, -0.52, 0);
        art.add(belly);

        const wingRoot = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.16, 4.4), bodyMat);
        wingRoot.position.set(0.55, -0.01, 0);
        art.add(wingRoot);

        const wingMid = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.14, 3.6), bodyMat);
        wingMid.position.set(1.05, 0.0, 0);
        wingMid.rotation.y = -0.16;
        const [wingMidL, wingMidR] = addPair(art, () => wingMid.clone(), 4.25);
        wingMidL.rotation.z = -0.05;
        wingMidR.rotation.z = 0.05;

        const wingOuter = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.1, 2.55), bodyMat);
        wingOuter.position.set(1.3, 0.02, 0);
        wingOuter.rotation.y = -0.3;
        addPair(art, () => wingOuter.clone(), 7.1);

        const tip = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.92), detailMat);
        tip.position.set(1.42, 0.02, 9.18);
        art.add(tip, tip.clone());
        art.children[art.children.length - 1].position.z = -9.18;

        const tailBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.76, 4.8, 6), bodyMat);
        tailBoom.rotation.z = Math.PI / 2;
        tailBoom.position.set(-6.95, 0.4, 0);
        art.add(tailBoom);

        const tailCone = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.45, 6), bodyMat);
        tailCone.rotation.z = -Math.PI / 2;
        tailCone.position.set(-10.0, 0.45, 0);
        art.add(tailCone);

        const stabilizer = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.1, 3.5), bodyMat);
        stabilizer.position.set(-8.45, 0.88, 0);
        art.add(stabilizer);

        const elevatorGeo = new THREE.BoxGeometry(1.18, 0.1, 1.55);
        const elevatorLeft = makeSurfacePivot(THREE, elevatorGeo, accentMat, new THREE.Vector3(-8.9, 0.78, 0), -2.42);
        const elevatorRight = makeSurfacePivot(THREE, elevatorGeo, accentMat, new THREE.Vector3(-8.9, 0.78, 0), 2.42);
        art.add(elevatorLeft.pivot, elevatorRight.pivot);

        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.55, 0.22), bodyMat);
        fin.position.set(-8.95, 2.22, 0);
        art.add(fin);

        const rudderTop = new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.05, 4), bodyMat);
        rudderTop.rotation.z = Math.PI;
        rudderTop.scale.set(0.18, 0.7, 0.28);
        rudderTop.position.set(-9.02, 3.36, 0);
        art.add(rudderTop);

        const rudder = new THREE.Group();
        rudder.position.set(-9.25, 2.15, 0);
        const rudderMesh = createRudderSurface(THREE, accentMat, [
            [0.0, -1.0],
            [0.0, 0.95],
            [0.46, 0.22],
            [0.3, -0.92],
        ]);
        rudderMesh.position.y = 0.05;
        rudder.add(rudderMesh);
        art.add(rudder);

        const aileronGeo = new THREE.BoxGeometry(1.4, 0.08, 0.9);
        const aileronLeft = makeSurfacePivot(THREE, aileronGeo, accentMat, new THREE.Vector3(2.0, 0.0, 0), -6.95, -0.12);
        const aileronRight = makeSurfacePivot(THREE, aileronGeo, accentMat, new THREE.Vector3(2.0, 0.0, 0), 6.95, -0.12);
        art.add(aileronLeft.pivot, aileronRight.pivot);

        const radiator = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.38, 0.96), detailMat);
        radiator.position.set(3.35, -0.72, 0);
        art.add(radiator);

        const noseGun = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.12, 0.12), detailMat);
        noseGun.position.set(5.5, 0.52, 0.3);
        art.add(noseGun, noseGun.clone());
        art.children[art.children.length - 1].position.z = -0.3;

        const rocketMeshes = addRockets(art, accentMat, detailMat, 1.8, [-5.6, -7.5, -9.2, 5.6, 7.5, 9.2]);
        const prop = addPropeller(art, accentMat, 8.1, 3.8);
        return {
            prop,
            rudder,
            elevators: [elevatorLeft.pivot, elevatorRight.pivot],
            ailerons: [aileronLeft.pivot, aileronRight.pivot],
            rocketMeshes,
        };
    }

    function updateControlSurfaces(plane) {
        const controls = plane.userData.controls;
        if (!controls) return;
        const controlState = plane.userData.controlState || { pitch: 0, roll: 0, yaw: 0 };
        const pitch = THREE.MathUtils.clamp(controlState.pitch, -1, 1);
        const roll = THREE.MathUtils.clamp(controlState.roll, -1, 1);
        const yaw = THREE.MathUtils.clamp(controlState.yaw, -1, 1);

        controls.rudder.rotation.y = yaw * 0.35;
        controls.elevators[0].rotation.z = -pitch * 0.28;
        controls.elevators[1].rotation.z = -pitch * 0.28;
        controls.ailerons[0].rotation.x = roll * 0.34;
        controls.ailerons[1].rotation.x = -roll * 0.34;

        if (controls.rocketMeshes) {
            const active = plane.userData.rockets ?? 0;
            controls.rocketMeshes.forEach((rocket, index) => {
                rocket.visible = index < active;
            });
        }
    }

    function makePlane(team, color = 0x9fd4ff, accent = 0xffb02e) {
        const root = new THREE.Group();
        const bank = new THREE.Group();
        const art = new THREE.Group();
        const bodyMat = makeMaterial(color, 0.62);
        const accentMat = makeMaterial(accent, 0.52);
        const detailMat = makeMaterial(0x3b4652, 0.68);

        const controls =
            team === "enemy"
                ? buildBf109Like(THREE, art, bodyMat, accentMat, detailMat)
                : buildSpitfireLike(THREE, art, bodyMat, accentMat, detailMat);

        art.rotation.y = -Math.PI / 2;
        bank.add(art);
        root.add(bank);

        root.userData.prop = controls.prop;
        root.userData.mesh = bank;
        root.userData.art = art;
        root.userData.controls = controls;
        markShadows(root);
        return root;
    }

    function spawnPlane(team, position, tint) {
        const plane = makePlane(team, tint.base, tint.accent);
        plane.position.copy(position);
        plane.rotation.set(0, Math.random() * Math.PI * 2, 0);
        plane.userData = {
            ...plane.userData,
            team,
            vel: new THREE.Vector3(),
            hp: team === "player" ? cfg.player.hp : team === "ally" ? cfg.team.wingmanHp : cfg.team.enemyHp,
            throttle: 0.6,
            ammo: team === "player" ? cfg.player.ammo : 9999,
            ammoReloadBuffer: 0,
            fireCd: 0,
            rocketCd: 0,
            rockets: team === "player" ? cfg.rockets.count : 0,
            rocketReloadTimer: 0,
            bombCd: 0,
            bombs: team === "player" ? cfg.bombs.count : 0,
            bombReloadTimer: 0,
            respawn: 0,
            wep: team === "player" ? cfg.player.wepMax : cfg.player.wepMax,
            wepActive: false,
            yaw: plane.rotation.y,
            pitch: 0,
            roll: 0,
            controlState: {
                pitch: 0,
                roll: 0,
                yaw: 0,
            },
            ai: {
                target: null,
                think: 0,
            },
        };
        updateControlSurfaces(plane);
        syncPlaneOrientation(plane);
        scene.add(plane);
        return plane;
    }

    return {
        spawnPlane,
        updateControlSurfaces,
    };
}
