import assert from "assert/strict";
import fs from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";
import puppeteer from "puppeteer";

const workspaceRoot = "/Users/lachezardimitrov/WebstormProjects/hyperskill-js";
const pageUrl = pathToFileURL(
    path.resolve(`${workspaceRoot}/ww1-dogfight/index.html`),
).href;

async function withGamePage(run) {
    await fs.mkdir(path.join(workspaceRoot, ".tmp"), { recursive: true });
    const browserDataDir = await fs.mkdtemp(path.join(workspaceRoot, ".tmp", "puppeteer-profile-"));
    const browser = await puppeteer.launch({
        headless: "new",
        userDataDir: browserDataDir,
        args: ["--disable-crash-reporter", "--disable-breakpad", "--no-sandbox"],
    });
    try {
        const page = await browser.newPage();
        page.setDefaultTimeout(15000);
        await page.goto(pageUrl, { waitUntil: "domcontentloaded" });
        await page.waitForFunction(() => window.__dogfight?.ready === true, { timeout: 15000 });
        await run(page);
    } finally {
        await browser.close();
        await fs.rm(browserDataDir, { recursive: true, force: true });
    }
}

describe("WW1 Dogfight Integration", function () {
    this.timeout(30000);

    it("banks visually on A/D without changing the forward vector", async () => {
        await withGamePage(async (page) => {
            const before = await page.evaluate(() => {
                window.__dogfight.resetPlayer();
                return window.__dogfight.getState();
            });

            const after = await page.evaluate(() => {
                window.__dogfight.setKey("KeyD", true);
                const state = window.__dogfight.stepFrames(24);
                window.__dogfight.setKey("KeyD", false);
                return state;
            });

            assert.ok(after.player.roll > before.player.roll + 0.5, "roll should increase while banking right");

            const forwardDrift =
                Math.abs(after.player.forward[0] - before.player.forward[0]) +
                Math.abs(after.player.forward[1] - before.player.forward[1]) +
                Math.abs(after.player.forward[2] - before.player.forward[2]);

            assert.ok(forwardDrift < 0.05, "pure banking should not materially change the forward vector");
        });
    });

    it("increases throttle with ArrowUp", async () => {
        await withGamePage(async (page) => {
            const before = await page.evaluate(() => {
                window.__dogfight.resetPlayer();
                return window.__dogfight.getState();
            });

            const after = await page.evaluate(() => {
                window.__dogfight.setKey("ArrowUp", true);
                const state = window.__dogfight.stepFrames(20);
                window.__dogfight.setKey("ArrowUp", false);
                return state;
            });

            assert.ok(after.player.throttle > before.player.throttle, "throttle should increase");
            assert.ok(after.player.speed > before.player.speed, "speed should increase with throttle");
        });
    });

    it("switches to rear view and hides the reticle while V is held", async () => {
        await withGamePage(async (page) => {
            const normal = await page.evaluate(() => {
                window.__dogfight.resetPlayer();
                window.__dogfight.stepFrames(2);
                return window.__dogfight.getState();
            });

            const rear = await page.evaluate(() => {
                window.__dogfight.setKey("KeyV", true);
                const state = window.__dogfight.stepFrames(8);
                window.__dogfight.setKey("KeyV", false);
                return state;
            });

            const restored = await page.evaluate(() => window.__dogfight.stepFrames(8));

            const normalCameraOffsetZ = normal.camera.position[2] - normal.player.position[2];
            const rearCameraOffsetZ = rear.camera.position[2] - rear.player.position[2];
            const restoredCameraOffsetZ = restored.camera.position[2] - restored.player.position[2];

            assert.equal(normal.ui.reticleVisible, true, "reticle should be visible in normal chase view");
            assert.equal(rear.ui.reticleVisible, false, "reticle should be hidden in rear view");
            assert.ok(
                Math.sign(normalCameraOffsetZ) !== Math.sign(rearCameraOffsetZ),
                "rear view camera should move to the opposite side of the plane",
            );
            assert.equal(restored.ui.reticleVisible, true, "reticle should return after rear view");
            assert.ok(
                Math.sign(normalCameraOffsetZ) === Math.sign(restoredCameraOffsetZ),
                "camera should return to the chase side after releasing rear view",
            );
        });
    });
});
