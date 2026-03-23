// @ts-nocheck
export function createCameraController({ THREE, camera, cfg, entities, forwardOf }) {
    let ready = false;
    let freeLookYaw = 0;
    let freeLookPitch = 0;

    function getTarget(lookBack) {
        const forward = forwardOf(entities.player);
        const backOffset = lookBack ? cfg.camera.front : -cfg.camera.back;
        const upOffset = lookBack ? cfg.camera.rearUp : cfg.camera.up;
        return entities.player.position
            .clone()
            .add(forward.clone().multiplyScalar(backOffset))
            .add(new THREE.Vector3(0, upOffset, 0));
    }

    function snap(lookBack) {
        const forward = forwardOf(entities.player);
        camera.position.copy(getTarget(lookBack));
        if (lookBack) {
            camera.lookAt(entities.player.position.clone().add(forward.clone().multiplyScalar(-cfg.camera.lookAhead)));
        } else {
            camera.lookAt(entities.player.position.clone().add(forward.clone().multiplyScalar(cfg.camera.lookAhead)));
        }
        ready = true;
    }

    function reset() {
        ready = false;
        freeLookYaw = 0;
        freeLookPitch = 0;
    }

    function update({ dt, lookBack, freeLook, mouseDx = 0, mouseDy = 0, mouseSens = 0.0015, zoomed }) {
        const forward = forwardOf(entities.player);
        const camTarget = getTarget(lookBack);
        const targetDistance = camera.position.distanceTo(camTarget);
        const speed = entities.player?.userData?.vel?.length?.() || 0;
        const highSpeedFollow = speed > cfg.player.maxSpeed * 1.45;
        const followLerp = highSpeedFollow ? 0.28 : cfg.camera.lerp;
        const catchupDistance = highSpeedFollow ? 18 : 45;

        if (!ready || targetDistance > catchupDistance) {
            camera.position.copy(camTarget);
            ready = true;
        } else {
            camera.position.lerp(camTarget, followLerp);
        }

        if (freeLook) {
            freeLookYaw -= mouseDx * mouseSens * 1.3;
            freeLookPitch = THREE.MathUtils.clamp(
                freeLookPitch + mouseDy * mouseSens * 1.15,
                -1.15,
                0.85,
            );

            const orbitOffset = new THREE.Vector3(0, cfg.camera.up * 0.55, -cfg.camera.back * 1.08);
            orbitOffset.applyEuler(new THREE.Euler(freeLookPitch, freeLookYaw, 0, "YXZ"));
            orbitOffset.applyQuaternion(entities.player.quaternion);

            const orbitTarget = entities.player.position.clone().add(orbitOffset);
            if (!ready || camera.position.distanceTo(orbitTarget) > (highSpeedFollow ? 22 : 55)) {
                camera.position.copy(orbitTarget);
            } else {
                camera.position.lerp(orbitTarget, highSpeedFollow ? 0.32 : 0.18);
            }

            const lookTarget = entities.player.position.clone().add(new THREE.Vector3(0, 1.2, 0));
            camera.lookAt(lookTarget);
        } else {
            freeLookYaw *= 0.78;
            freeLookPitch *= 0.78;
            if (Math.abs(freeLookYaw) < 0.001) freeLookYaw = 0;
            if (Math.abs(freeLookPitch) < 0.001) freeLookPitch = 0;

            const lookTarget = entities.player.position
                .clone()
                .add(forward.clone().multiplyScalar(lookBack ? -cfg.camera.lookAhead : cfg.camera.lookAhead))
                .add(new THREE.Vector3(0, lookBack ? 1 : 0, 0));
            camera.lookAt(lookTarget);
        }

        const shake = (1 - entities.player.userData.hp / cfg.player.hp) * cfg.camera.shake;
        camera.position.x += (Math.random() - 0.5) * shake;
        camera.position.y += (Math.random() - 0.5) * shake;

        const targetFov = zoomed ? cfg.camera.zoomFov : cfg.camera.fov;
        camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.12);
        camera.updateProjectionMatrix();
    }

    return {
        reset,
        snap,
        update,
    };
}
