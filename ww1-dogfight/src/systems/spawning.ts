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
        entities.player.position.copy(world.friendlySpawn);
        entities.player.rotation.set(0, 0, 0, "YXZ");
        entities.player.visible = true;
        entities.player.userData.yaw = 0;
        entities.player.userData.pitch = 0;
        entities.player.userData.roll = 0;
        entities.player.userData.landed = false;
        syncPlaneOrientation(entities.player);
        entities.player.userData.vel.copy(forwardOf(entities.player).multiplyScalar(45));
        entities.player.userData.hp = cfg.player.hp;
        entities.player.userData.ammo = cfg.player.ammo;
        entities.player.userData.ammoReloadBuffer = 0;
        entities.player.userData.rockets = cfg.rockets.count;
        entities.player.userData.rocketCd = 0;
        entities.player.userData.rocketReloadTimer = 0;
        entities.player.userData.bombs = cfg.bombs.count;
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
        entities.player = spawnPlane("player", world.friendlySpawn.clone(), {
            base: 0x9fd4ff,
            accent: 0xffb02e,
        });

        for (let i = 0; i < cfg.ai.wingmen; i++) {
            entities.allies.push(
                spawnPlane("ally", world.friendlySpawn.clone().add(new THREE.Vector3(-20 - i * 18, 22 + i * 8, -24 - i * 20)), {
                    base: 0x7ad1a1,
                    accent: 0x79f2ff,
                }),
            );
        }

        for (let i = 0; i < cfg.ai.enemies; i++) {
            entities.enemies.push(
                spawnPlane("enemy", world.enemyBaseCenter.clone().add(new THREE.Vector3(-20 + i * 36, 85 + i * 10, -80 + i * 38)), {
                    base: 0xff7373,
                    accent: 0xffd16d,
                }),
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
