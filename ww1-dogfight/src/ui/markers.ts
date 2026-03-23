// @ts-nocheck
function projectToScreen(THREE, camera, position, width, height) {
    const p = position.clone().project(camera);
    return {
        visible: p.z > -1 && p.z < 1,
        x: (p.x * 0.5 + 0.5) * width,
        y: (-p.y * 0.5 + 0.5) * height,
    };
}

export function createMarkerSystem({ root, entities, world, getFlakSites, THREE }) {
    const markers = new Map();

    function ensureMarker(key, cls) {
        if (markers.has(key)) return markers.get(key);
        const el = document.createElement("div");
        el.className = `marker ${cls}`;
        root.appendChild(el);
        markers.set(key, el);
        return el;
    }

    function hideUnused(activeKeys) {
        for (const [key, el] of markers) {
            if (!activeKeys.has(key)) el.style.display = "none";
        }
    }

    function update(camera) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const activeKeys = new Set();
        const items = [];

        entities.enemies.forEach((enemy, index) => {
            if (!enemy.visible || enemy.userData.hp <= 0) return;
            items.push({
                key: `enemy-${index}`,
                cls: "enemy",
                label: "ENEMY",
                position: enemy.position.clone().add(new THREE.Vector3(0, 5, 0)),
            });
        });

        entities.allies.forEach((ally, index) => {
            if (!ally.visible || ally.userData.hp <= 0) return;
            items.push({
                key: `ally-${index}`,
                cls: "ally",
                label: "ALLY",
                position: ally.position.clone().add(new THREE.Vector3(0, 5, 0)),
            });
        });

        world.targets.forEach((target, index) => {
            const data = target.userData.target;
            if (!data || !target.visible || data.hp <= 0 || data.team !== "enemy") return;
            items.push({
                key: `target-${index}`,
                cls: "target",
                label: data.kind.toUpperCase(),
                position: target.position.clone().add(new THREE.Vector3(0, 10, 0)),
            });
        });

        getFlakSites().forEach((site, index) => {
            items.push({
                key: `flak-${index}`,
                cls: "flak",
                label: "FLAK",
                position: site.position.clone().add(new THREE.Vector3(0, 10, 0)),
            });
        });

        for (const item of items) {
            const projected = projectToScreen(THREE, camera, item.position, width, height);
            const onScreen =
                projected.visible &&
                projected.x > 20 &&
                projected.x < width - 20 &&
                projected.y > 20 &&
                projected.y < height - 20;
            const el = ensureMarker(item.key, item.cls);
            activeKeys.add(item.key);
            if (!onScreen) {
                el.style.display = "none";
                continue;
            }
            el.style.display = "block";
            el.textContent = item.label;
            el.style.left = `${projected.x}px`;
            el.style.top = `${projected.y}px`;
        }

        hideUnused(activeKeys);
    }

    return { update };
}
