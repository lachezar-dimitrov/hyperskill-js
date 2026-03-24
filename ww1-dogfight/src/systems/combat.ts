// @ts-nocheck
export function createCombatSystem({
    THREE,
    scene,
    entities,
    world,
    cfg,
    soundEffects,
    camera,
    reticle,
    getReticleAimDirection,
    forwardOf,
    keys,
    settings,
    showBanner,
    onPlayerDown,
    onEnemyDown,
    onEnemyStructureDown,
}) {
    function spawnBurst(position, color) {
        for (let i = 0; i < 12; i++) {
            const p = new THREE.Mesh(
                new THREE.IcosahedronGeometry(0.6 + Math.random() * 0.4, 0),
                new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, flatShading: true }),
            );
            p.position.copy(position);
            p.userData = {
                vel: new THREE.Vector3(
                    (Math.random() - 0.5) * 10,
                    Math.random() * 8,
                    (Math.random() - 0.5) * 10,
                ),
                ttl: 1.2 + Math.random() * 0.6,
            };
            entities.particles.push(p);
            scene.add(p);
        }
    }

    function explodeRocket(position, team) {
        spawnBurst(position.clone(), 0xff9a3d);
        spawnBurst(position.clone().add(new THREE.Vector3(0, 1.8, 0)), 0xffd070);
        spawnBurst(position.clone().add(new THREE.Vector3(0, 0.6, 0)), 0x404040);
        soundEffects.playRocketExplode(1.15);

        for (const target of world.targets) {
            const targetData = target.userData.target;
            if (!targetData || targetData.hp <= 0) continue;
            const distance = position.distanceTo(target.position);
            if (distance > cfg.rockets.radius) continue;
            targetData.hp -= cfg.rockets.damage * (1 - distance / cfg.rockets.radius);
            if (targetData.hp <= 0) {
                target.visible = false;
                if (team === "player" && targetData.team === "enemy") {
                    onEnemyStructureDown?.(targetData);
                    showBanner(`${targetData.kind.toUpperCase()} DESTROYED`, 900);
                }
            }
        }

        const targets = team === "enemy" ? [entities.player, ...entities.allies] : entities.enemies;
        for (const target of targets) {
            if (!target || target.userData.hp <= 0) continue;
            const distance = position.distanceTo(target.position);
            if (distance > cfg.rockets.radius * 0.75) continue;
            target.userData.hp -= cfg.rockets.damage * (1 - distance / (cfg.rockets.radius * 0.75));
            if (team === "player" || target === entities.player) {
                soundEffects.playHit(target.userData.hp <= 0 ? 1.25 : 1.0);
            }
            if (target.userData.hp <= 0) {
                if (target === entities.player) {
                    showBanner("YOU'RE DOWN");
                    onPlayerDown?.("rocket");
                } else if (target.userData.team === "enemy") {
                    onEnemyDown?.(target);
                    showBanner("ENEMY DOWN");
                }
            }
        }
    }

    function explodeBomb(position, team) {
        spawnBurst(position.clone(), 0xff8c2f);
        spawnBurst(position.clone().add(new THREE.Vector3(0, 2.4, 0)), 0xffe08a);
        spawnBurst(position.clone().add(new THREE.Vector3(0, 1.0, 0)), 0x2d2d2d);
        soundEffects.playRocketExplode(1.45);

        for (const target of world.targets) {
            const targetData = target.userData.target;
            if (!targetData || targetData.hp <= 0) continue;
            const distance = position.distanceTo(target.position);
            if (distance > cfg.bombs.radius) continue;
            targetData.hp -= cfg.bombs.damage * (1 - distance / cfg.bombs.radius);
            if (targetData.hp <= 0) {
                target.visible = false;
                if (team === "player" && targetData.team === "enemy") {
                    onEnemyStructureDown?.(targetData);
                    showBanner(`${targetData.kind.toUpperCase()} DESTROYED`, 900);
                }
            }
        }

        const targets = team === "enemy" ? [entities.player, ...entities.allies] : entities.enemies;
        for (const target of targets) {
            if (!target || target.userData.hp <= 0) continue;
            const distance = position.distanceTo(target.position);
            if (distance > cfg.bombs.radius * 0.7) continue;
            target.userData.hp -= cfg.bombs.damage * 0.65 * (1 - distance / (cfg.bombs.radius * 0.7));
            if (team === "player" || target === entities.player) {
                soundEffects.playHit(target.userData.hp <= 0 ? 1.3 : 1.0);
            }
            if (target.userData.hp <= 0) {
                if (target === entities.player) {
                    showBanner("YOU'RE DOWN");
                    onPlayerDown?.("bomb");
                } else if (target.userData.team === "enemy") {
                    onEnemyDown?.(target);
                    showBanner("ENEMY DOWN");
                }
            }
        }
    }

    function spawnBullet(fromPlane) {
        const data = fromPlane.userData;
        if (data.fireCd > 0 || data.ammo <= 0 || (data.spec?.gunHardpoints?.length ?? 0) === 0) return;
        data.fireCd = cfg.guns.rof;
        data.ammo -= 1;
        if (fromPlane === entities.player) {
            soundEffects.playGun({ near: true, source: "player" });
        } else if (data.team === "enemy") {
            const distanceToPlayer = fromPlane.position.distanceTo(entities.player.position);
            if (distanceToPlayer < 220) {
                soundEffects.playGun({ near: distanceToPlayer < 110, source: "enemy" });
            }
        }

        const forward = forwardOf(fromPlane);
        const baseAimPoint =
            fromPlane === entities.player && !keys[settings.controls.lookBack]
                ? camera.position
                      .clone()
                      .add(getReticleAimDirection().multiplyScalar(cfg.guns.aimDistance))
                      .add(new THREE.Vector3(0, cfg.guns.aimLift, 0))
                : null;
        const hardpoints = data.spec?.gunHardpoints?.length ? data.spec.gunHardpoints : [0];

        for (const zOffset of hardpoints) {
            const muzzle = fromPlane.position
                .clone()
                .add(forward.clone().multiplyScalar(cfg.guns.muzzleOffset))
                .add(new THREE.Vector3(0, -0.1, zOffset));
            let shotDir = forward.clone();

            if (baseAimPoint) {
                shotDir = baseAimPoint.clone().sub(muzzle).normalize();
            }

            const spread = new THREE.Vector3(
                (Math.random() - 0.5) * cfg.guns.spread,
                (Math.random() - 0.5) * cfg.guns.spread,
                (Math.random() - 0.5) * cfg.guns.spread,
            );
            shotDir.add(spread).normalize();

            const bullet = new THREE.Mesh(
                new THREE.SphereGeometry(0.25, 6, 6),
                new THREE.MeshStandardMaterial({ color: 0xffe7a8, emissive: 0xffb02e, emissiveIntensity: 0.8 }),
            );
            bullet.position.copy(muzzle);
            bullet.userData = {
                vel: shotDir.multiplyScalar(cfg.guns.bulletSpeed).add(data.vel.clone()),
                ttl: cfg.guns.ttl,
                team: data.team,
            };
            entities.bullets.push(bullet);
            scene.add(bullet);
        }
    }

    function spawnRocket(fromPlane) {
        const data = fromPlane.userData;
        if (fromPlane !== entities.player) return;
        if (data.rocketCd > 0 || data.rockets <= 0) return;
        data.rocketCd = cfg.rockets.cooldown;
        data.rockets -= 1;
        soundEffects.playRocketLaunch(1);

        const rocketIndex = data.rockets;
        const rocketMesh = fromPlane.userData.controls?.rocketMeshes?.[rocketIndex];
        const rocketWorldPos = new THREE.Vector3();
        if (rocketMesh) {
            rocketMesh.getWorldPosition(rocketWorldPos);
        } else {
            rocketWorldPos.copy(fromPlane.position).add(forwardOf(fromPlane).multiplyScalar(cfg.rockets.muzzleOffset));
        }

        const forward = forwardOf(fromPlane);
        let shotDir = forward.clone();
        if (!keys[settings.controls.lookBack]) {
            const aimDir = getReticleAimDirection();
            const aimPoint = camera.position.clone().add(aimDir.multiplyScalar(Math.max(cfg.guns.aimDistance, 1800)));
            shotDir = aimPoint.sub(rocketWorldPos).normalize();
        }
        const rocket = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.12, 1.7, 6),
            new THREE.MeshStandardMaterial({ color: 0xd8dadd, emissive: 0xffb55a, emissiveIntensity: 0.25, flatShading: true }),
        );
        rocket.rotation.z = Math.PI / 2;
        rocket.position.copy(rocketWorldPos);
        rocket.userData = {
            vel: shotDir.multiplyScalar(cfg.rockets.speed).add(data.vel.clone().multiplyScalar(0.35)),
            ttl: cfg.rockets.ttl,
            team: data.team,
        };
        entities.rockets.push(rocket);
        scene.add(rocket);
    }

    function spawnBomb(fromPlane) {
        const data = fromPlane.userData;
        if (fromPlane !== entities.player) return;
        if (data.bombCd > 0 || data.bombs <= 0) return;
        data.bombCd = cfg.bombs.cooldown;
        data.bombs -= 1;
        soundEffects.playBombDrop(1);

        const forward = forwardOf(fromPlane);
        const bombIndex = data.bombs;
        const bombMesh = fromPlane.userData.controls?.bombMeshes?.[bombIndex];
        const bombWorldPos = new THREE.Vector3();
        if (bombMesh) {
            bombMesh.getWorldPosition(bombWorldPos);
        } else {
            bombWorldPos.copy(fromPlane.position).add(forward.clone().multiplyScalar(cfg.bombs.dropOffset)).add(new THREE.Vector3(0, -0.8, 0));
        }

        const bomb = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.33, 0),
            new THREE.MeshStandardMaterial({ color: 0x48525d, emissive: 0x24180d, emissiveIntensity: 0.15, flatShading: true }),
        );
        bomb.position.copy(bombWorldPos);
        bomb.userData = {
            vel: data.vel.clone(),
            ttl: cfg.bombs.ttl,
            team: data.team,
        };
        entities.bombs.push(bomb);
        scene.add(bomb);
    }

    function updateBullets(dt) {
        for (let i = entities.bullets.length - 1; i >= 0; i--) {
            const b = entities.bullets[i];
            const playerRelevantWorldHit =
                b.userData.team === "player" || b.position.distanceTo(entities.player.position) < 80;
            b.userData.ttl -= dt;
            if (b.userData.ttl <= 0) {
                scene.remove(b);
                entities.bullets.splice(i, 1);
                continue;
            }
            b.position.add(b.userData.vel.clone().multiplyScalar(dt));

            let hitWorld = false;
            for (const target of world.targets) {
                const targetData = target.userData.target;
                if (!targetData || targetData.hp <= 0) continue;
                if (b.position.distanceTo(target.position) < targetData.radius) {
                    targetData.hp -= cfg.guns.damage;
                    scene.remove(b);
                    entities.bullets.splice(i, 1);
                    spawnBurst(target.position.clone().add(new THREE.Vector3(0, 5, 0)), 0xffb347);
                    if (playerRelevantWorldHit) {
                        soundEffects.playWorldHit(targetData.hp <= 0 ? 1.1 : 0.8);
                    }
                    if (targetData.hp <= 0) {
                        target.visible = false;
                        if (b.userData.team === "player" && targetData.team === "enemy") {
                            onEnemyStructureDown?.(targetData);
                            showBanner(`${targetData.kind.toUpperCase()} DESTROYED`, 900);
                        }
                    }
                    hitWorld = true;
                    break;
                }
            }
            if (hitWorld) continue;

            if (b.position.y <= world.getGroundHeightAt(b.position.x, b.position.z) + 1.5) {
                scene.remove(b);
                entities.bullets.splice(i, 1);
                spawnBurst(b.position.clone(), 0x8f7d55);
                if (playerRelevantWorldHit) {
                    soundEffects.playWorldHit(0.6);
                }
                continue;
            }

            for (const cloud of world.clouds) {
                const radius = cloud.userData.radius ?? 20;
                if (b.position.distanceTo(cloud.position) < radius) {
                    scene.remove(b);
                    entities.bullets.splice(i, 1);
                    spawnBurst(b.position, 0xcfd9e6);
                    if (playerRelevantWorldHit) {
                        soundEffects.playWorldHit(0.75);
                    }
                    hitWorld = true;
                    break;
                }
            }
            if (hitWorld) continue;

            const targets = b.userData.team === "enemy" ? [entities.player, ...entities.allies] : entities.enemies;
            for (const t of targets) {
                if (!t || t.userData.hp <= 0) continue;
                if (b.position.distanceTo(t.position) < 2.2) {
                    t.userData.hp -= cfg.guns.damage;
                    scene.remove(b);
                    entities.bullets.splice(i, 1);
                    spawnBurst(t.position, b.userData.team === "enemy" ? 0xff4d6d : 0xffb02e);
                    if (b.userData.team === "player" || t === entities.player) {
                        soundEffects.playHit(t.userData.hp <= 0 ? 1.2 : 0.9);
                    }
                    if (t.userData.hp <= 0) {
                        if (t === entities.player) {
                            showBanner("YOU'RE DOWN");
                            onPlayerDown?.("gunfire");
                        } else if (t.userData.team === "enemy") {
                            onEnemyDown?.(t);
                            showBanner("ENEMY DOWN");
                        }
                    }
                    break;
                }
            }
        }
    }

    function updateRockets(dt) {
        for (let i = entities.rockets.length - 1; i >= 0; i--) {
            const rocket = entities.rockets[i];
            rocket.userData.ttl -= dt;
            if (rocket.userData.ttl <= 0) {
                explodeRocket(rocket.position.clone(), rocket.userData.team);
                scene.remove(rocket);
                entities.rockets.splice(i, 1);
                continue;
            }

            rocket.position.add(rocket.userData.vel.clone().multiplyScalar(dt));

            for (const target of world.targets) {
                const targetData = target.userData.target;
                if (!targetData || targetData.hp <= 0) continue;
                if (rocket.position.distanceTo(target.position) < targetData.radius + 1.1) {
                    explodeRocket(rocket.position.clone(), rocket.userData.team);
                    scene.remove(rocket);
                    entities.rockets.splice(i, 1);
                    break;
                }
            }
            if (!entities.rockets[i]) continue;

            if (rocket.position.y <= world.getGroundHeightAt(rocket.position.x, rocket.position.z) + 1.2) {
                explodeRocket(rocket.position.clone(), rocket.userData.team);
                scene.remove(rocket);
                entities.rockets.splice(i, 1);
                continue;
            }

            for (const cloud of world.clouds) {
                const radius = cloud.userData.radius ?? 20;
                if (rocket.position.distanceTo(cloud.position) < radius) {
                    explodeRocket(rocket.position.clone(), rocket.userData.team);
                    scene.remove(rocket);
                    entities.rockets.splice(i, 1);
                    break;
                }
            }
        }
    }

    function updateBombs(dt) {
        for (let i = entities.bombs.length - 1; i >= 0; i--) {
            const bomb = entities.bombs[i];
            bomb.userData.ttl -= dt;
            bomb.userData.vel.y -= cfg.bombs.gravity * dt;
            if (bomb.userData.ttl <= 0) {
                explodeBomb(bomb.position.clone(), bomb.userData.team);
                scene.remove(bomb);
                entities.bombs.splice(i, 1);
                continue;
            }

            bomb.position.add(bomb.userData.vel.clone().multiplyScalar(dt));
            bomb.rotation.x += dt * 8;
            bomb.rotation.z += dt * 4;

            for (const target of world.targets) {
                const targetData = target.userData.target;
                if (!targetData || targetData.hp <= 0) continue;
                if (bomb.position.distanceTo(target.position) < targetData.radius + 1.4) {
                    explodeBomb(bomb.position.clone(), bomb.userData.team);
                    scene.remove(bomb);
                    entities.bombs.splice(i, 1);
                    break;
                }
            }
            if (!entities.bombs[i]) continue;

            if (bomb.position.y <= world.getGroundHeightAt(bomb.position.x, bomb.position.z) + 1.1) {
                explodeBomb(bomb.position.clone(), bomb.userData.team);
                scene.remove(bomb);
                entities.bombs.splice(i, 1);
            }
        }
    }

    function updateParticles(dt) {
        for (let i = entities.particles.length - 1; i >= 0; i--) {
            const p = entities.particles[i];
            p.userData.ttl -= dt;
            if (p.userData.ttl <= 0) {
                scene.remove(p);
                entities.particles.splice(i, 1);
                continue;
            }
            p.position.add(p.userData.vel.clone().multiplyScalar(dt));
            p.scale.multiplyScalar(1 + 0.4 * dt);
        }
    }

    return {
        spawnBullet,
        spawnRocket,
        spawnBomb,
        spawnBurst,
        updateBullets,
        updateRockets,
        updateBombs,
        updateParticles,
    };
}
