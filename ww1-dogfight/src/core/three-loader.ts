import type { ThreeModule } from "./game-types.js";

export async function loadThree(): Promise<ThreeModule> {
    const cdns = [
        "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js",
        "https://unpkg.com/three@0.161.0/build/three.module.js",
        "https://esm.sh/three@0.161.0",
    ];
    let lastErr: unknown;
    for (const url of cdns) {
        try {
            const threeModule: ThreeModule = await import(url);
            return threeModule;
        } catch (e) {
            lastErr = e;
        }
    }
    throw lastErr ?? new Error("Failed to load three.module.js from all CDNs");
}
