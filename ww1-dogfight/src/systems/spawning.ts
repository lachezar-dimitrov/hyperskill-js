// @ts-nocheck
export function createSpawnSystem({
    THREE,
    cfg,
    world,
    entities,
    spawnPlane,
    forwardOf,
    syncPlaneOrientation,
    state,
    camera,
    cameraController,
    mouse,
    snapCamera,
    onResetState,
    getAircraftType,
}) {
    const runtime = {
        camera,
        cameraController,
        mouse,
        snapCamera,
        onResetState,
    };

    function configureRuntime(nextRuntime) {
        Object.assign(runtime, nextRuntime);
    }

    function resetPlayer() {
        const aircraftType = getAircraftType?.() ?? "fighter";
        if (!entities.player || entities.player.userData?.spec?.id !== aircraftType) {
            if (entities.player) {
                entities.player.parent?.remove(entities.player);
            }
            entities.player = spawnPlane(
                "player",
                world.friendlySpawn.clone(),
                aircraftType === "bomber"
                    ? { base: 0x8aa3b6, accent: 0xd8bb73 }
                    : aircraftType === "jet"
                      ? { base: 0xa9b8c8, accent: 0xff6c2f }
                      : { base: 0x93cfff, accent: 0xf7b13b },
                aircraftType,
            );
        }

        entities.player.position.copy(world.friendlySpawn);
        entities.player.rotation.set(0, 0, 0, "YXZ");
        entities.player.visible = true;
        entities.player.userData.yaw = 0;
        entities.player.userData.pitch = 0;
        entities.player.userData.roll = 0;
        entities.player.userData.landed = false;
        syncPlaneOrientation(entities.player);
        entities.player.userData.vel.copy(
            forwardOf(entities.player).multiplyScalar((entities.player.userData.spec?.maxThrust ?? 45) * 0.78),
        );
        entities.player.userData.hp = entities.player.userData.spec?.hp ?? cfg.player.hp;
        entities.player.userData.ammo = entities.player.userData.spec?.ammo ?? cfg.player.ammo;
        entities.player.userData.ammoReloadBuffer = 0;
        entities.player.userData.rockets = entities.player.userData.spec?.rockets ?? cfg.rockets.count;
        entities.player.userData.rocketCd = 0;
        entities.player.userData.rocketReloadTimer = 0;
        entities.player.userData.bombs = entities.player.userData.spec?.bombs ?? cfg.bombs.count;
        entities.player.userData.bombCd = 0;
        entities.player.userData.bombReloadTimer = 0;
        entities.player.userData.throttle = 0.5;
        entities.player.userData.wep = cfg.player.wepMax;
        entities.player.userData.wepActive = false;
        entities.player.userData.controlState.pitch = 0;
        entities.player.userData.controlState.roll = 0;
        entities.player.userData.controlState.yaw = 0;
        state.respawn = 0;
        state.zoomed = false;
        state.outcome = "active";
        runtime.onResetState?.();
        runtime.cameraController?.reset?.();
        if (runtime.mouse) {
            runtime.mouse.dx = 0;
            runtime.mouse.dy = 0;
        }
        if (runtime.camera) {
            runtime.camera.fov = cfg.camera.fov;
            runtime.camera.updateProjectionMatrix();
        }
        runtime.snapCamera?.();
    }

    function initializeForces() {
        const aircraftType = getAircraftType?.() ?? "fighter";
        entities.player = spawnPlane(
            "player",
            world.friendlySpawn.clone(),
            aircraftType === "bomber"
                ? { base: 0x8aa3b6, accent: 0xd8bb73 }
                : aircraftType === "jet"
                  ? { base: 0xa9b8c8, accent: 0xff6c2f }
                  : { base: 0x93cfff, accent: 0xf7b13b },
            aircraftType,
        );

        for (let i = 0; i < cfg.ai.wingmen; i++) {
            entities.allies.push(
                spawnPlane(
                    "ally",
                    world.friendlySpawn.clone().add(new THREE.Vector3(-20 - i * 18, 22 + i * 8, -24 - i * 20)),
                    {
                        base: 0x7ad1a1,
                        accent: 0x79f2ff,
                    },
                    "fighter",
                ),
            );
        }

        for (let i = 0; i < cfg.ai.enemies; i++) {
            entities.enemies.push(
                spawnPlane(
                    "enemy",
                    world.enemyBaseCenter.clone().add(new THREE.Vector3(-20 + i * 36, 85 + i * 10, -80 + i * 38)),
                    {
                        base: 0xff7373,
                        accent: 0xffd16d,
                    },
                    "enemy",
                ),
            );
        }
    }

    function spawnEnemyWave(count) {
        const baseCount = entities.enemies.length;
        for (let i = 0; i < count; i++) {
            entities.enemies.push(
                spawnPlane(
                    "enemy",
                    world.enemyBaseCenter.clone().add(new THREE.Vector3(-40 + i * 34, 110 + i * 10, -120 - i * 22)),
                    {
                        base: 0xff7373,
                        accent: 0xffd16d,
                    },
                    "enemy",
                ),
            );
            entities.enemies[baseCount + i].userData.throttle = 0.82;
        }
    }

    return {
        configureRuntime,
        initializeForces,
        resetPlayer,
        spawnEnemyWave,
    };
}
