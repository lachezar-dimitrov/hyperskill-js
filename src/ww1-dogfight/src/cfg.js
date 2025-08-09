// =========================
// Config & Constants
// =========================
export const CFG = Object.freeze({
    world: { size: 5000, runwayLen: 700, runwayWid: 70, treeCount: 120 },
    physics: { gravity: -9.8, dragCoef: 0.012, liftCoef: 0.085, baseStall: 12, playerMaxThrust: 40, botThrust: 36 },
    damage: { playerHit: 15, botHit: 20, smokeHP: 40, botSmokeHP: 35 },
    guns: {
        rof: 0.05,
        bulletSpeed: 185,
        spreadPlayer: 0.0035,
        spreadBot: 0.0055,
        jamChance: 0.002,
        jamCd: 2.0,
        botFireCd: 0.06,
    },
    ai: { count: 8, thinkDt: 0.02, fireDist: 380, aimCos: 0.985 },
    land: { minSpeed: 6, align: 0.2, groundY: 0.5, captureRate: { clear: 18, contested: 6 }, decay: 4 },
    camera: { back: 13, up: 4, lookAhead: 10, lerpT: 0.001 },
});
