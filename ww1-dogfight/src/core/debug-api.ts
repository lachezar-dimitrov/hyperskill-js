// @ts-nocheck
export function attachDebugApi({
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
}) {
    function snapshotState() {
        const playerForward = forwardOf(entities.player);
        const playerUp = upOf(entities.player);
        const playerRight = rightOf(entities.player);
        const cameraForward = playerForward.clone();
        camera.getWorldDirection(cameraForward);
        return {
            player: {
                position: entities.player.position.toArray(),
                rotation: [entities.player.rotation.x, entities.player.rotation.y, entities.player.rotation.z],
                forward: playerForward.toArray(),
                up: playerUp.toArray(),
                right: playerRight.toArray(),
                speed: entities.player.userData.vel.length(),
                throttle: entities.player.userData.throttle,
                hp: entities.player.userData.hp,
                ammo: entities.player.userData.ammo,
                roll: entities.player.userData.roll,
            },
            camera: {
                position: camera.position.toArray(),
                forward: cameraForward.toArray(),
            },
            ui: {
                reticleVisible: reticle ? reticle.style.display !== "none" : false,
                lookBack: !!keys["KeyV"],
            },
        };
    }

    function clearInputs() {
        for (const key of Object.keys(keys)) {
            delete keys[key];
        }
        mouse.dx = 0;
        mouse.dy = 0;
        mouse.dragging = false;
    }

    window.__dogfight = {
        ready: true,
        getState: snapshotState,
        resetPlayer: () => {
            clearInputs();
            resetPlayer();
        },
        setKey: (code, pressed) => {
            keys[code] = !!pressed;
        },
        clearInputs,
        stepFrames: (count = 1, dt = 1 / 60, options = {}) => {
            const steps = Math.max(1, count);
            for (let i = 0; i < steps; i++) {
                tick(dt, {
                    updateAI: options.updateAI ?? false,
                    renderFrame: options.renderFrame ?? false,
                });
            }
            return snapshotState();
        },
    };
}
