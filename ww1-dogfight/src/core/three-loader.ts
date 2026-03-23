// @ts-nocheck
export async function loadThree() {
    const cdns = [
        "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js",
        "https://unpkg.com/three@0.161.0/build/three.module.js",
        "https://esm.sh/three@0.161.0",
    ];
    let lastErr;
    for (const url of cdns) {
        try {
            return await import(url);
        } catch (e) {
            lastErr = e;
        }
    }
    throw lastErr || new Error("Failed to load three.module.js from all CDNs");
}
