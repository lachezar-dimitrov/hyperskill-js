// @ts-nocheck
export function createFlakSystem({ THREE, scene, world, entities, spawnBurst, showBanner, onPlaneDown }) {
    const sites = [];
    const base = world.enemyBaseCenter;
    const offsets = [
        new THREE.Vector3(-70, 0, -90),
        new THREE.Vector3(90, 0, -60),
        new THREE.Vector3(-95, 0, 80),
        new THREE.Vector3(105, 0, 95),
    ];

    for (const offset of offsets) {
        const position = base.clone().add(offset);
        position.y = world.getGroundHeightAt(position.x, position.z);

        const gun = new THREE.Group();
        const baseMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(3.2, 4.2, 2.2, 6),
            new THREE.MeshStandardMaterial({ color: 0x6d736f, flatShading: true, roughness: 1 }),
        );
        baseMesh.position.y = 1.1;
        const barrel = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 1.2, 8.5),
            new THREE.MeshStandardMaterial({ color: 0x50565e, flatShading: true, roughness: 0.9 }),
        );
        barrel.position.set(0, 4.4, 0);
        barrel.rotation.x = -0.35;
        gun.add(baseMesh, barrel);
        gun.position.copy(position);
        gun.traverse((obj) => {
            obj.castShadow = true;
            obj.receiveShadow = true;
        });
        scene.add(gun);

        sites.push({
            mesh: gun,
            cooldown: 1.5 + Math.random(),
            range: 320,
            burstRadius: 14,
            damage: 22,
        });
    }

    function candidatePlanes() {
        return [entities.player, ...entities.allies].filter((plane) => plane.visible && plane.userData.hp > 0);
    }

    function update(dt) {
        for (const site of sites) {
            site.cooldown -= dt;
            if (site.cooldown > 0) continue;

            let bestTarget = null;
            let bestDistance = Infinity;
            for (const plane of candidatePlanes()) {
                const distance = plane.position.distanceTo(site.mesh.position);
                if (distance < site.range && distance < bestDistance) {
                    bestTarget = plane;
                    bestDistance = distance;
                }
            }

            if (!bestTarget) continue;

            const lead = bestTarget.userData.vel.clone().multiplyScalar(0.45);
            const burstPos = bestTarget.position
                .clone()
                .add(lead)
                .add(
                    new THREE.Vector3(
                        (Math.random() - 0.5) * 14,
                        (Math.random() - 0.5) * 8,
                        (Math.random() - 0.5) * 14,
                    ),
                );
            spawnBurst(burstPos, 0xffd17a);

            if (bestTarget.position.distanceTo(burstPos) < site.burstRadius) {
                bestTarget.userData.hp -= site.damage;
                if (bestTarget === entities.player) {
                    showBanner("FLAK", 700);
                }
                if (bestTarget.userData.hp <= 0) {
                    bestTarget.visible = false;
                    onPlaneDown?.(bestTarget, "flak");
                }
            }

            site.cooldown = 1.2 + Math.random() * 1.1;
        }
    }

    return {
        update,
        getSites() {
            return sites.map((site) => site.mesh);
        },
    };
}
