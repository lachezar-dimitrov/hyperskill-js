// @ts-nocheck
export function createAiSystem({ THREE, cfg, entities, forwardOf }) {
    function pickTarget(aiPlane, candidates) {
        let best = null;
        let bestDistance = Infinity;
        for (const candidate of candidates) {
            if (candidate.userData.hp <= 0) continue;
            const distance = aiPlane.position.distanceTo(candidate.position);
            if (distance < bestDistance) {
                best = candidate;
                bestDistance = distance;
            }
        }
        return best;
    }

    function getControlInput(plane, dt, allies, enemies, formationOffset = null) {
        const data = plane.userData;
        data.ai.think -= dt;
        if (data.ai.think <= 0) {
            if (plane.userData.team === "ally") {
                const enemy = pickTarget(plane, enemies);
                data.ai.target = enemy && plane.position.distanceTo(enemy.position) < cfg.ai.seekDist ? enemy : null;
            } else {
                data.ai.target = pickTarget(plane, allies);
            }
            data.ai.think = cfg.ai.thinkRate;
        }

        let desiredPos = null;
        const target = data.ai.target;
        if (!target && formationOffset) {
            desiredPos = entities.player.position.clone().add(formationOffset);
        }

        const forward = forwardOf(plane);
        let aimDir;
        if (target) {
            const lead = target.userData.vel.clone().multiplyScalar(0.6);
            aimDir = target.position.clone().add(lead).sub(plane.position).normalize();
        } else if (desiredPos) {
            aimDir = desiredPos.sub(plane.position).normalize();
        } else {
            aimDir = forward;
        }

        const desiredYaw = Math.atan2(aimDir.x, aimDir.z);
        const desiredPitch = Math.asin(THREE.MathUtils.clamp(aimDir.y, -0.8, 0.8));
        const yawError = THREE.MathUtils.euclideanModulo(desiredYaw - data.yaw + Math.PI, Math.PI * 2) - Math.PI;
        const pitchError = THREE.MathUtils.clamp(desiredPitch - data.pitch, -0.8, 0.8);

        const yawInput = THREE.MathUtils.clamp(yawError * 2.2, -1, 1);
        const pitchInput = THREE.MathUtils.clamp(pitchError * 2.2, -1, 1);
        const rollInput = THREE.MathUtils.clamp(-yawError * 1.4, -1, 1);

        const distance = target ? plane.position.distanceTo(target.position) : 0;
        data.throttle = THREE.MathUtils.clamp(0.55 + (distance > 300 ? 0.25 : 0), 0.35, 0.95);

        let fire = false;
        if (target && distance < cfg.ai.fireDist) {
            const cos = forward.dot(aimDir);
            if (cos > cfg.ai.aimCos) fire = true;
        }

        return { yawInput, pitchInput, rollInput, fire };
    }

    return {
        getControlInput,
    };
}
