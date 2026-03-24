import type { EnemyTelemetry, HudRefs, ObjectiveSnapshot, PlayerTelemetry, WorldTelemetry } from "../core/game-types.js";

interface HudEntities {
    player: PlayerTelemetry;
    enemies: EnemyTelemetry[];
}

interface HudState {
    score: number;
}

interface HudObjectives {
    getState(): ObjectiveSnapshot;
    getMissionText(state: ObjectiveSnapshot): string;
}

export function updateHud({
    hud,
    entities,
    world,
    cfg,
    state,
    objectives,
    metersPerUnit,
}: {
    hud: HudRefs;
    entities: HudEntities;
    world: WorldTelemetry;
    cfg: { player: { wepMax: number } };
    state: HudState;
    objectives: HudObjectives;
    metersPerUnit: number;
}): void {
    const missionState = objectives.getState();
    const vel = entities.player.userData.vel.length();
    const agl = Math.max(
        0,
        entities.player.position.y - (world.getGroundHeightAt(entities.player.position.x, entities.player.position.z) + 3),
    );
    const speedKmh = vel * metersPerUnit * 3.6;
    const altMeters = agl * metersPerUnit;

    hud.status.textContent = entities.player.userData.hp > 0 ? "ENGAGED" : "DOWN";
    if (entities.player.userData.hp > 0 && altMeters < 75) {
        hud.status.textContent = "PULL UP";
    }
    if (entities.player.userData.landed) {
        hud.status.textContent = "ON RUNWAY";
    }

    hud.score.textContent = `${state.score}`;
    hud.mission.textContent = objectives.getMissionText(missionState);
    hud.speed.textContent = `${speedKmh.toFixed(0)} KM/H`;
    hud.alt.textContent = `${altMeters.toFixed(0)} M`;
    hud.ralt.textContent = `${altMeters.toFixed(0)} M`;
    hud.throttle.textContent = `${(entities.player.userData.throttle * 100).toFixed(0)}%`;
    hud.wep.textContent = `${Math.round((entities.player.userData.wep / cfg.player.wepMax) * 100)} % WEP`;
    hud.hp.textContent = `${Math.max(0, Math.round(entities.player.userData.hp))}`;
    hud.ammo.textContent = `${entities.player.userData.ammo}`;
    hud.rockets.textContent = `${entities.player.userData.rockets ?? 0}`;
    hud.bombs.textContent = `${entities.player.userData.bombs ?? 0}`;
    hud.enemies.textContent = `${entities.enemies.filter((enemy) => enemy.userData.hp > 0).length}`;
    hud.engineMode.textContent = entities.player.userData.wepActive ? "WEP" : "MIL";
    hud.funMode.textContent = entities.player.userData.spec?.label ?? "FIGHTER";
    hud.hp.classList.toggle("danger", entities.player.userData.hp < 35);
}
