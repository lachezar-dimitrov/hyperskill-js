// @ts-nocheck
export function createFlightSystem({
    THREE,
    cfg,
    world,
    entities,
    state,
    showBanner,
    spawnBurst,
    soundEffects,
    forwardOf,
    syncPlaneOrientation,
    localAxes,
    updateControlSurfaces,
}) {
    const { up: LOCAL_UP, right: LOCAL_RIGHT, forward: LOCAL_FORWARD } = localAxes;

    function applyControls(plane, input, dt, boost = false, speedMultiplier = 1) {
        const data = plane.userData;
        const yawDelta = input.yawInput * cfg.player.turnRate * dt;
        const pitchDelta = input.pitchInput * cfg.player.pitchRate * dt;
        const rollDelta = input.rollInput * cfg.player.rollRate * dt;
        data.controlState = {
            yaw: input.yawInput,
            pitch: input.pitchInput,
            roll: input.rollInput,
        };

        plane.rotateOnAxis(LOCAL_UP, yawDelta);
        plane.rotateOnAxis(LOCAL_RIGHT, pitchDelta);
        plane.rotateOnAxis(LOCAL_FORWARD, rollDelta);

        const forward = forwardOf(plane);
        data.yaw = Math.atan2(forward.x, forward.z);
        data.pitch = Math.asin(THREE.MathUtils.clamp(forward.y, -1, 1));
        data.roll += rollDelta;
        syncPlaneOrientation(plane);

        const thrust = (boost ? cfg.player.boostThrust : cfg.player.maxThrust) * speedMultiplier;
        data.vel.copy(forward.multiplyScalar(thrust * data.throttle));
        updateControlSurfaces?.(plane);
    }

    function integrateForces(plane, dt) {
        const data = plane.userData;
        plane.position.add(data.vel.clone().multiplyScalar(dt));

        const groundY = world.getGroundHeightAt(plane.position.x, plane.position.z) + 3;
        if (plane.position.y <= groundY) {
            plane.position.y = groundY;
            if (plane === entities.player && data.hp > 0) {
                const runway = world.friendlyRunway;
                const airfield = world.friendlyAirfield;
                const dx = plane.position.x - runway.center.x;
                const dz = plane.position.z - runway.center.z;
                const onRunway = Math.abs(dx) <= runway.halfWidth && Math.abs(dz) <= runway.halfLength;
                const airfieldDx = plane.position.x - airfield.center.x;
                const airfieldDz = plane.position.z - airfield.center.z;
                const overAirfield =
                    Math.abs(airfieldDx) <= airfield.halfWidth && Math.abs(airfieldDz) <= airfield.halfLength;
                const speed = data.vel.length();
                const safeTouchdown = (onRunway && speed <= 92) || (overAirfield && speed <= 58);

                if (safeTouchdown) {
                    if (!data.landed) {
                        showBanner("LANDED AND REARMED");
                    }
                    data.landed = true;
                    data.wepActive = false;
                    data.throttle = Math.min(data.throttle, 0.35);
                    data.wep = cfg.player.wepMax;
                    data.ammo = cfg.player.ammo;
                    data.hp = cfg.player.hp;
                    data.vel.set(0, 0, 0);
                    data.pitch = 0;
                    data.roll = 0;
                    data.controlState.pitch = 0;
                    data.controlState.roll = 0;
                    data.controlState.yaw = 0;
                    plane.rotation.x = 0;
                    plane.rotation.z = 0;
                    updateControlSurfaces?.(plane);
                    syncPlaneOrientation(plane);
                } else {
                    data.hp = 0;
                    data.wepActive = false;
                    data.landed = false;
                    data.vel.set(0, 0, 0);
                    plane.visible = false;
                    state.respawn = cfg.team.respawnDelay;
                    spawnBurst(plane.position.clone(), 0xff7b47);
                    spawnBurst(plane.position.clone().add(new THREE.Vector3(0, 3, 0)), 0xffc04d);
                    spawnBurst(plane.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 0x2d2d2d);
                    soundEffects.playHit(1.3);
                    showBanner("CRASHED");
                }
            } else if (plane !== entities.player) {
                data.hp = 0;
                plane.visible = false;
            }
        } else if (plane === entities.player) {
            data.landed = false;
        }
    }

    return {
        applyControls,
        integrateForces,
    };
}
