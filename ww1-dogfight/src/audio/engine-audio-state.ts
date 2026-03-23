// @ts-nocheck
export function createEngineAudioStateReaders({ entities, THREE }) {
    return {
        getPlayerState() {
            return {
                throttle: entities.player?.userData?.throttle ?? 0,
                speed: entities.player?.userData?.vel.length() ?? 0,
            };
        },
        getEnemyState() {
            let nearestDistance = Infinity;
            let nearbyCount = 0;
            let presence = 0;
            let weightedThrottle = 0;
            let weightedSpeed = 0;

            for (const enemy of entities.enemies) {
                if (!enemy.visible || enemy.userData.hp <= 0) continue;
                const distance = enemy.position.distanceTo(entities.player.position);
                if (distance < 420) nearbyCount += 1;

                const weight = THREE.MathUtils.clamp(1 - distance / 1400, 0, 1);
                presence += weight;
                weightedThrottle += (enemy.userData.throttle ?? 0) * weight;
                weightedSpeed += (enemy.userData.vel.length() ?? 0) * weight;
                if (distance < nearestDistance) nearestDistance = distance;
            }

            if (!Number.isFinite(nearestDistance)) {
                return { active: false, distance: Infinity, throttle: 0, speed: 0, nearbyCount: 0, presence: 0 };
            }

            const totalWeight = Math.max(presence, 0.0001);
            return {
                active: true,
                distance: nearestDistance,
                throttle: weightedThrottle / totalWeight,
                speed: weightedSpeed / totalWeight,
                nearbyCount,
                presence: THREE.MathUtils.clamp(presence, 0, 2.8),
            };
        },
    };
}
