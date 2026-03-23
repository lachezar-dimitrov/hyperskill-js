// @ts-nocheck
export function createObjectiveSystem({ world, entities, showBanner }) {
    const state = {
        won: false,
        lost: false,
        phase: "strike",
    };

    function enemyStructures() {
        return world.targets.filter((target) => target.userData.target?.team === "enemy");
    }

    function friendlyStructures() {
        return world.targets.filter((target) => target.userData.target?.team === "friendly");
    }

    function getSnapshot() {
        const enemyGroundAlive = enemyStructures().filter((target) => target.visible && target.userData.target.hp > 0).length;
        const enemyGroundTotal = enemyStructures().length;
        const enemyPlanesAlive = entities.enemies.filter((enemy) => enemy.visible && enemy.userData.hp > 0).length;
        const friendlyGroundAlive = friendlyStructures().filter((target) => target.visible && target.userData.target.hp > 0).length;
        return {
            enemyGroundAlive,
            enemyGroundTotal,
            enemyPlanesAlive,
            friendlyGroundAlive,
        };
    }

    function update() {
        const snapshot = getSnapshot();

        if (!state.lost && snapshot.friendlyGroundAlive === 0) {
            state.lost = true;
            showBanner("AIRFIELD LOST", 2200);
        }

        if (!state.won && snapshot.enemyGroundAlive === 0) {
            state.phase = "clear";
        }

        if (!state.won && snapshot.enemyGroundAlive === 0 && snapshot.enemyPlanesAlive === 0) {
            state.won = true;
            state.phase = "rtb";
            showBanner("MISSION COMPLETE", 2600);
        }

        return snapshot;
    }

    function getMissionText(snapshot = getSnapshot()) {
        if (state.lost) return "MISSION FAIL";
        if (state.won) return "MISSION COMPLETE";
        if (state.phase === "strike") {
            const destroyed = snapshot.enemyGroundTotal - snapshot.enemyGroundAlive;
            return `STRIKE BASE ${destroyed}/${snapshot.enemyGroundTotal}`;
        }
        return `CLEAR SKY ${snapshot.enemyPlanesAlive} LEFT`;
    }

    return {
        update,
        getMissionText,
        reset() {
            state.won = false;
            state.lost = false;
            state.phase = "strike";
        },
        getState() {
            return { ...state, ...getSnapshot() };
        },
    };
}
