// @ts-nocheck
export function createWaveDirector({ objectives, spawnEnemyWave, showBanner }) {
    const triggers = [
        { key: "counter", threshold: 2, count: 2, text: "ENEMY REINFORCEMENTS" },
        { key: "scramble", threshold: 4, count: 3, text: "BASE SCRAMBLE" },
    ];
    const fired = new Set();

    function update(snapshot) {
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

    function reset() {
        fired.clear();
    }

    return {
        update,
        reset,
    };
}
