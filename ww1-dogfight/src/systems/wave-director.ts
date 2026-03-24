import type { ObjectiveUpdateSnapshot } from "../core/game-types.js";

interface WaveTrigger {
    key: string;
    threshold: number;
    count: number;
    text: string;
}

export function createWaveDirector({
    objectives: _objectives,
    spawnEnemyWave,
    showBanner,
}: {
    objectives: unknown;
    spawnEnemyWave: (count: number) => void;
    showBanner: (text: string, duration?: number) => void;
}): {
    update(snapshot: ObjectiveUpdateSnapshot): void;
    reset(): void;
} {
    const triggers = [
        { key: "counter", threshold: 2, count: 2, text: "ENEMY REINFORCEMENTS" },
        { key: "scramble", threshold: 4, count: 3, text: "BASE SCRAMBLE" },
    ] satisfies WaveTrigger[];
    const fired = new Set<string>();

    function update(snapshot: ObjectiveUpdateSnapshot): void {
        const destroyed = snapshot.enemyGroundTotal - snapshot.enemyGroundAlive;
        for (const trigger of triggers) {
            if (fired.has(trigger.key)) continue;
            if (destroyed >= trigger.threshold) {
                fired.add(trigger.key);
                spawnEnemyWave(trigger.count);
                showBanner(trigger.text, 1400);
            }
        }
    }

    function reset(): void {
        fired.clear();
    }

    return {
        update,
        reset,
    };
}
