import type { EnemyTelemetry, PlayerTelemetry, WorldTelemetry } from "../core/game-types.js";

interface RadarEntities {
    player: PlayerTelemetry | null;
    enemies: Array<EnemyTelemetry & { position: { x: number; y: number; z: number } }>;
}

interface RadarRoot extends HTMLElement {
    style: CSSStyleDeclaration;
}

interface RadarContact {
    type: "enemy" | "ground";
    relX: number;
    relZ: number;
}

interface ThreeLike {
    MathUtils: {
        clamp(value: number, min: number, max: number): number;
    };
    Vector3: new (x?: number, y?: number, z?: number) => {
        x: number;
        y: number;
        z: number;
    };
}

export function createRadar({
    root,
    contactsRoot,
    ship,
    entities,
    forwardOf,
    world,
    THREE,
}: {
    root: RadarRoot;
    contactsRoot: HTMLElement;
    ship: HTMLElement;
    entities: RadarEntities;
    forwardOf: (player: PlayerTelemetry) => { x: number; z: number };
    world: WorldTelemetry;
    THREE: ThreeLike;
}): { update(): void } {
    const range = 1600;

    function ensureDots(count: number, className: string): HTMLDivElement[] {
        while (contactsRoot.querySelectorAll(`.${className}`).length < count) {
            const dot = document.createElement("div");
            dot.className = `radar-dot ${className}`;
            contactsRoot.appendChild(dot);
        }
        return [...contactsRoot.querySelectorAll(`.${className}`)].filter(
            (element): element is HTMLDivElement => element instanceof HTMLDivElement,
        );
    }

    function positionDot(dot: HTMLDivElement, relX: number, relZ: number): void {
        const clampedX = THREE.MathUtils.clamp(relX / range, -1, 1);
        const clampedZ = THREE.MathUtils.clamp(relZ / range, -1, 1);
        const px = clampedX * 44;
        const py = clampedZ * 44;
        dot.style.transform = `translate(${px}px, ${py}px)`;
        dot.style.display = Math.abs(clampedX) > 1 || Math.abs(clampedZ) > 1 ? "none" : "block";
    }

    function update(): void {
        const player = entities.player;
        if (!player) return;

        const forward = forwardOf(player);
        const heading = Math.atan2(forward.x, forward.z);
        root.style.setProperty("--radar-rotation", `${-heading}rad`);
        ship.style.transform = `translate(-50%, -50%) rotate(${player.userData.roll ?? 0}rad)`;

        const contacts: RadarContact[] = [];
        entities.enemies.forEach((enemy) => {
            if (enemy.userData.hp <= 0) return;
            const deltaWorld = world.wrapDelta(enemy.position.x - player.position.x, enemy.position.z - player.position.z);
            const delta = new THREE.Vector3(deltaWorld.x, enemy.position.y - player.position.y, deltaWorld.z);
            const relX = delta.x * Math.cos(-heading) - delta.z * Math.sin(-heading);
            const relZ = delta.x * Math.sin(-heading) + delta.z * Math.cos(-heading);
            contacts.push({ type: "enemy", relX, relZ });
        });

        world.targets.forEach((target) => {
            const targetData = target.userData.target;
            if (!targetData || targetData.hp <= 0 || targetData.team !== "enemy") return;
            const deltaWorld = world.wrapDelta(target.position.x - player.position.x, target.position.z - player.position.z);
            const delta = new THREE.Vector3(deltaWorld.x, target.position.y - player.position.y, deltaWorld.z);
            const relX = delta.x * Math.cos(-heading) - delta.z * Math.sin(-heading);
            const relZ = delta.x * Math.sin(-heading) + delta.z * Math.cos(-heading);
            contacts.push({ type: "ground", relX, relZ });
        });

        const enemyDots = ensureDots(
            contacts.filter((contact) => contact.type === "enemy").length,
            "enemy",
        );
        const groundDots = ensureDots(
            contacts.filter((contact) => contact.type === "ground").length,
            "ground",
        );

        let enemyIndex = 0;
        let groundIndex = 0;
        contacts.forEach((contact) => {
            if (contact.type === "enemy") {
                const dot = enemyDots[enemyIndex];
                if (dot) positionDot(dot, contact.relX, contact.relZ);
                enemyIndex += 1;
            } else {
                const dot = groundDots[groundIndex];
                if (dot) positionDot(dot, contact.relX, contact.relZ);
                groundIndex += 1;
            }
        });

        enemyDots.slice(enemyIndex).forEach((dot) => {
            dot.style.display = "none";
        });
        groundDots.slice(groundIndex).forEach((dot) => {
            dot.style.display = "none";
        });
    }

    return { update };
}
