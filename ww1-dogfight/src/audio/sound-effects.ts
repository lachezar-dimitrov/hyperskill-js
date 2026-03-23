// @ts-nocheck
export function createSoundEffects({ window, THREE }) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
        return {
            unlock() {},
            playGun() {},
            playHit() {},
            playWorldHit() {},
            playRocketLaunch() {},
            playRocketExplode() {},
            playBombDrop() {},
        };
    }

    const ctx = new AudioCtx();
    const master = ctx.createGain();
    master.gain.value = 0.128;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -22;
    compressor.knee.value = 10;
    compressor.ratio.value = 2.2;
    compressor.attack.value = 0.002;
    compressor.release.value = 0.08;

    master.connect(compressor);
    compressor.connect(ctx.destination);

    let started = false;
    let volume = 0.16;
    let lastPlayerGunAt = 0;
    let lastEnemyGunAt = 0;
    let lastWorldHitAt = 0;

    function makeNoiseSource() {
        const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.35), ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        return source;
    }

    function playGun({ near = true, source = "player" } = {}) {
        if (!started) return;
        const t = ctx.currentTime;
        if (source === "player") {
            if (t - lastPlayerGunAt < 0.04) return;
            lastPlayerGunAt = t;
        } else {
            if (t - lastEnemyGunAt < 0.065) return;
            lastEnemyGunAt = t;
        }
        const enemy = source === "enemy";

        const popOsc = ctx.createOscillator();
        popOsc.type = enemy ? "square" : "triangle";
        popOsc.frequency.setValueAtTime((enemy ? 96 : 130) + Math.random() * (enemy ? 12 : 18), t);
        popOsc.frequency.exponentialRampToValueAtTime(enemy ? 62 : 82, t + (enemy ? 0.05 : 0.038));

        const popGain = ctx.createGain();
        popGain.gain.setValueAtTime(0.0001, t);
        popGain.gain.exponentialRampToValueAtTime(
            enemy ? (near ? 0.035 : 0.01) : near ? 0.055 : 0.014,
            t + 0.002,
        );
        popGain.gain.exponentialRampToValueAtTime(0.0001, t + (enemy ? 0.055 : 0.04));

        const popFilter = ctx.createBiquadFilter();
        popFilter.type = "lowpass";
        popFilter.frequency.setValueAtTime(enemy ? (near ? 920 : 700) : near ? 1350 : 900, t);

        const crackNoise = makeNoiseSource();
        const crackFilter = ctx.createBiquadFilter();
        crackFilter.type = "bandpass";
        crackFilter.frequency.setValueAtTime(enemy ? (near ? 980 : 720) : near ? 1450 : 950, t);
        crackFilter.Q.value = enemy ? 0.65 : 0.85;

        const crackGain = ctx.createGain();
        crackGain.gain.setValueAtTime(0.0001, t);
        crackGain.gain.exponentialRampToValueAtTime(
            enemy ? (near ? 0.016 : 0.006) : near ? 0.028 : 0.009,
            t + 0.002,
        );
        crackGain.gain.exponentialRampToValueAtTime(0.0001, t + (enemy ? 0.028 : 0.02));

        popOsc.connect(popFilter);
        popFilter.connect(popGain);
        popGain.connect(master);

        crackNoise.connect(crackFilter);
        crackFilter.connect(crackGain);
        crackGain.connect(master);

        popOsc.start(t);
        popOsc.stop(t + (enemy ? 0.06 : 0.05));
        crackNoise.start(t);
        crackNoise.stop(t + (enemy ? 0.03 : 0.022));
    }

    function playHit(intensity = 1) {
        if (!started) return;
        const t = ctx.currentTime;
        const clamped = THREE.MathUtils.clamp(intensity, 0.6, 1.6);

        const impactNoise = makeNoiseSource();
        const impactFilter = ctx.createBiquadFilter();
        impactFilter.type = "bandpass";
        impactFilter.frequency.setValueAtTime(780 * clamped, t);
        impactFilter.Q.value = 0.7;

        const impactGain = ctx.createGain();
        impactGain.gain.setValueAtTime(0.0001, t);
        impactGain.gain.exponentialRampToValueAtTime(0.22 * clamped, t + 0.01);
        impactGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

        const ringOsc = ctx.createOscillator();
        ringOsc.type = "triangle";
        ringOsc.frequency.setValueAtTime(420 * clamped, t);
        ringOsc.frequency.exponentialRampToValueAtTime(180, t + 0.28);

        const ringGain = ctx.createGain();
        ringGain.gain.setValueAtTime(0.0001, t);
        ringGain.gain.exponentialRampToValueAtTime(0.12 * clamped, t + 0.008);
        ringGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);

        impactNoise.connect(impactFilter);
        impactFilter.connect(impactGain);
        impactGain.connect(master);

        ringOsc.connect(ringGain);
        ringGain.connect(master);

        impactNoise.start(t);
        impactNoise.stop(t + 0.24);
        ringOsc.start(t);
        ringOsc.stop(t + 0.3);
    }

    function playWorldHit(intensity = 1) {
        if (!started) return;
        const t = ctx.currentTime;
        if (t - lastWorldHitAt < 0.08) return;
        lastWorldHitAt = t;
        const clamped = THREE.MathUtils.clamp(intensity, 0.4, 1.2);

        const puffNoise = makeNoiseSource();
        const puffFilter = ctx.createBiquadFilter();
        puffFilter.type = "bandpass";
        puffFilter.frequency.setValueAtTime(620, t);
        puffFilter.Q.value = 0.55;

        const puffGain = ctx.createGain();
        puffGain.gain.setValueAtTime(0.0001, t);
        puffGain.gain.exponentialRampToValueAtTime(0.08 * clamped, t + 0.008);
        puffGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

        const tickOsc = ctx.createOscillator();
        tickOsc.type = "triangle";
        tickOsc.frequency.setValueAtTime(260, t);
        tickOsc.frequency.exponentialRampToValueAtTime(140, t + 0.12);

        const tickGain = ctx.createGain();
        tickGain.gain.setValueAtTime(0.0001, t);
        tickGain.gain.exponentialRampToValueAtTime(0.04 * clamped, t + 0.004);
        tickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);

        puffNoise.connect(puffFilter);
        puffFilter.connect(puffGain);
        puffGain.connect(master);

        tickOsc.connect(tickGain);
        tickGain.connect(master);

        puffNoise.start(t);
        puffNoise.stop(t + 0.14);
        tickOsc.start(t);
        tickOsc.stop(t + 0.14);
    }

    function playRocketLaunch(intensity = 1) {
        if (!started) return;
        const t = ctx.currentTime;
        const clamped = THREE.MathUtils.clamp(intensity, 0.7, 1.4);

        const burstNoise = makeNoiseSource();
        const burstFilter = ctx.createBiquadFilter();
        burstFilter.type = "bandpass";
        burstFilter.frequency.setValueAtTime(420, t);
        burstFilter.Q.value = 0.6;

        const burstGain = ctx.createGain();
        burstGain.gain.setValueAtTime(0.0001, t);
        burstGain.gain.exponentialRampToValueAtTime(0.14 * clamped, t + 0.01);
        burstGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);

        const roarOsc = ctx.createOscillator();
        roarOsc.type = "sawtooth";
        roarOsc.frequency.setValueAtTime(160, t);
        roarOsc.frequency.exponentialRampToValueAtTime(78, t + 0.22);

        const roarGain = ctx.createGain();
        roarGain.gain.setValueAtTime(0.0001, t);
        roarGain.gain.exponentialRampToValueAtTime(0.08 * clamped, t + 0.008);
        roarGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

        burstNoise.connect(burstFilter);
        burstFilter.connect(burstGain);
        burstGain.connect(master);

        roarOsc.connect(roarGain);
        roarGain.connect(master);

        burstNoise.start(t);
        burstNoise.stop(t + 0.22);
        roarOsc.start(t);
        roarOsc.stop(t + 0.24);
    }

    function playRocketExplode(intensity = 1) {
        if (!started) return;
        const t = ctx.currentTime;
        const clamped = THREE.MathUtils.clamp(intensity, 0.8, 1.8);

        const boomNoise = makeNoiseSource();
        const boomFilter = ctx.createBiquadFilter();
        boomFilter.type = "lowpass";
        boomFilter.frequency.setValueAtTime(520, t);

        const boomGain = ctx.createGain();
        boomGain.gain.setValueAtTime(0.0001, t);
        boomGain.gain.exponentialRampToValueAtTime(0.26 * clamped, t + 0.012);
        boomGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.46);

        const shockOsc = ctx.createOscillator();
        shockOsc.type = "triangle";
        shockOsc.frequency.setValueAtTime(110, t);
        shockOsc.frequency.exponentialRampToValueAtTime(42, t + 0.45);

        const shockGain = ctx.createGain();
        shockGain.gain.setValueAtTime(0.0001, t);
        shockGain.gain.exponentialRampToValueAtTime(0.18 * clamped, t + 0.01);
        shockGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.44);

        boomNoise.connect(boomFilter);
        boomFilter.connect(boomGain);
        boomGain.connect(master);

        shockOsc.connect(shockGain);
        shockGain.connect(master);

        boomNoise.start(t);
        boomNoise.stop(t + 0.5);
        shockOsc.start(t);
        shockOsc.stop(t + 0.48);
    }

    function playBombDrop(intensity = 1) {
        if (!started) return;
        const t = ctx.currentTime;
        const clamped = THREE.MathUtils.clamp(intensity, 0.7, 1.3);
        const whistle = ctx.createOscillator();
        whistle.type = "triangle";
        whistle.frequency.setValueAtTime(520, t);
        whistle.frequency.exponentialRampToValueAtTime(180, t + 0.22);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.035 * clamped, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);

        whistle.connect(gain);
        gain.connect(master);
        whistle.start(t);
        whistle.stop(t + 0.25);
    }

    return {
        unlock() {
            if (started) return;
            started = true;
            ctx.resume().catch(() => {});
        },
        setVolume(nextVolume) {
            volume = THREE.MathUtils.clamp(nextVolume, 0, 1);
            master.gain.value = 0.55 * volume;
        },
        playGun,
        playHit,
        playWorldHit,
        playRocketLaunch,
        playRocketExplode,
        playBombDrop,
    };
}
