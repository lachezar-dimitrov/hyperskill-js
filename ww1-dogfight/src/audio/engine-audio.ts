// @ts-nocheck
function createSilentEngineAudio() {
    return {
        unlock() {},
        setVolume() {},
        update() {},
    };
}

function createNoiseBuffer(ctx) {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
}

function createPlayerLayer(ctx, noiseBuffer) {
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const bodyOsc = ctx.createOscillator();
    bodyOsc.type = "sawtooth";
    const bodyFilter = ctx.createBiquadFilter();
    bodyFilter.type = "lowpass";
    const bodyGain = ctx.createGain();

    const rumbleOsc = ctx.createOscillator();
    rumbleOsc.type = "triangle";
    const rumbleFilter = ctx.createBiquadFilter();
    rumbleFilter.type = "lowpass";
    const rumbleGain = ctx.createGain();

    const propOsc = ctx.createOscillator();
    propOsc.type = "triangle";
    const propFilter = ctx.createBiquadFilter();
    propFilter.type = "bandpass";
    const propGain = ctx.createGain();

    const pulseLfo = ctx.createOscillator();
    pulseLfo.type = "square";
    const pulseDepth = ctx.createGain();
    const pulseBase = ctx.createConstantSource();

    const exhaustNoise = ctx.createBufferSource();
    exhaustNoise.buffer = noiseBuffer;
    exhaustNoise.loop = true;
    const exhaustFilter = ctx.createBiquadFilter();
    exhaustFilter.type = "bandpass";
    const exhaustGain = ctx.createGain();

    bodyOsc.connect(bodyFilter);
    bodyFilter.connect(bodyGain);
    bodyGain.connect(master);

    rumbleOsc.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(master);

    propOsc.connect(propFilter);
    propFilter.connect(propGain);
    propGain.connect(master);

    exhaustNoise.connect(exhaustFilter);
    exhaustFilter.connect(exhaustGain);
    exhaustGain.connect(master);

    pulseLfo.connect(pulseDepth);
    pulseDepth.connect(bodyGain.gain);
    pulseBase.connect(bodyGain.gain);

    bodyOsc.start();
    rumbleOsc.start();
    propOsc.start();
    pulseLfo.start();
    pulseBase.start();
    exhaustNoise.start();

    return {
        master,
        bodyOsc,
        bodyFilter,
        bodyGain,
        rumbleOsc,
        rumbleFilter,
        rumbleGain,
        propOsc,
        propFilter,
        propGain,
        pulseLfo,
        pulseDepth,
        pulseBase,
        exhaustFilter,
        exhaustGain,
    };
}

function createEnemyLayer(ctx) {
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const bodyOsc = ctx.createOscillator();
    bodyOsc.type = "triangle";
    const bodyFilter = ctx.createBiquadFilter();
    bodyFilter.type = "lowpass";
    const bodyGain = ctx.createGain();

    const buzzOsc = ctx.createOscillator();
    buzzOsc.type = "sawtooth";
    const buzzFilter = ctx.createBiquadFilter();
    buzzFilter.type = "bandpass";
    const buzzGain = ctx.createGain();

    bodyOsc.connect(bodyFilter);
    bodyFilter.connect(bodyGain);
    bodyGain.connect(master);

    buzzOsc.connect(buzzFilter);
    buzzFilter.connect(buzzGain);
    buzzGain.connect(master);

    bodyOsc.start();
    buzzOsc.start();

    return {
        master,
        bodyOsc,
        bodyFilter,
        bodyGain,
        buzzOsc,
        buzzFilter,
        buzzGain,
    };
}

function updatePlayerLayer(layer, THREE, state, volume, t) {
    const throttle = state?.throttle ?? 0;
    const speed = state?.speed ?? 0;
    const engineType = state?.engineType ?? "prop";
    const engineCount = state?.engineCount ?? 1;
    const wepActive = !!state?.wepActive;
    const rpm = THREE.MathUtils.clamp(throttle, 0, 1);
    const speedMix = THREE.MathUtils.clamp(speed / 60, 0, 1);

    if (engineType === "jet") {
        const burnerBoost = wepActive ? 1.35 : 1;
        layer.master.gain.setTargetAtTime((0.2 + rpm * 0.18) * volume * burnerBoost, t, 0.06);
        layer.bodyOsc.frequency.setTargetAtTime(58 + rpm * 58 + speedMix * 28, t, 0.05);
        layer.rumbleOsc.frequency.setTargetAtTime(28 + rpm * 18, t, 0.06);
        layer.propOsc.frequency.setTargetAtTime(170 + rpm * 250 + speedMix * 90, t, 0.04);
        layer.pulseLfo.frequency.setTargetAtTime(5 + rpm * 8, t, 0.07);
        layer.bodyFilter.frequency.setTargetAtTime(720 + rpm * 850, t, 0.05);
        layer.rumbleFilter.frequency.setTargetAtTime(140 + rpm * 140, t, 0.06);
        layer.propFilter.frequency.setTargetAtTime(1150 + rpm * 1450, t, 0.04);
        layer.exhaustFilter.frequency.setTargetAtTime(900 + rpm * 1200, t, 0.05);
        layer.pulseDepth.gain.setTargetAtTime(0.004 + rpm * 0.008, t, 0.06);
        layer.pulseBase.offset.setTargetAtTime(0.014 + rpm * 0.014, t, 0.06);
        layer.bodyGain.gain.setTargetAtTime(0.024 + rpm * 0.018, t, 0.06);
        layer.rumbleGain.gain.setTargetAtTime(0.018 + rpm * 0.016, t, 0.06);
        layer.propGain.gain.setTargetAtTime(0.022 + rpm * 0.028, t, 0.05);
        layer.exhaustGain.gain.setTargetAtTime(0.013 + rpm * 0.028 + (wepActive ? 0.02 : 0), t, 0.05);
        return;
    }

    const engineMass = THREE.MathUtils.clamp(engineCount, 1, 4);
    const bomberBoost = engineMass > 1 ? 1.2 : 1;
    layer.master.gain.setTargetAtTime((0.22 + rpm * 0.14) * volume * bomberBoost, t, 0.08);

    layer.bodyOsc.frequency.setTargetAtTime(38 + rpm * 28 + speedMix * 8 - (engineMass - 1) * 4, t, 0.06);
    layer.rumbleOsc.frequency.setTargetAtTime(18 + rpm * 8 + (engineMass - 1) * 3, t, 0.08);
    layer.propOsc.frequency.setTargetAtTime(82 + rpm * 138 + speedMix * 26 - (engineMass - 1) * 10, t, 0.05);
    layer.pulseLfo.frequency.setTargetAtTime(18 + rpm * 26 + (engineMass - 1) * 2, t, 0.05);

    layer.bodyFilter.frequency.setTargetAtTime(290 + rpm * 320, t, 0.07);
    layer.rumbleFilter.frequency.setTargetAtTime(75 + rpm * 60 + (engineMass - 1) * 15, t, 0.08);
    layer.propFilter.frequency.setTargetAtTime(620 + rpm * 720, t, 0.05);
    layer.exhaustFilter.frequency.setTargetAtTime(360 + rpm * 420, t, 0.06);

    layer.pulseDepth.gain.setTargetAtTime(0.014 + rpm * 0.024, t, 0.06);
    layer.pulseBase.offset.setTargetAtTime(0.024 + rpm * 0.02, t, 0.08);
    layer.bodyGain.gain.setTargetAtTime(0.03 + rpm * 0.02 + (engineMass - 1) * 0.006, t, 0.08);
    layer.rumbleGain.gain.setTargetAtTime(0.015 + rpm * 0.012 + (engineMass - 1) * 0.012, t, 0.08);
    layer.propGain.gain.setTargetAtTime(0.008 + rpm * 0.018, t, 0.06);
    layer.exhaustGain.gain.setTargetAtTime(0.004 + rpm * 0.014 + (engineMass - 1) * 0.008, t, 0.07);
}

function updateEnemyLayer(layer, THREE, state, volume, t) {
    const enemyThrottle = state?.throttle ?? 0;
    const enemySpeed = state?.speed ?? 0;
    const enemyDistance = state?.distance ?? Infinity;
    const enemyNearbyCount = state?.nearbyCount ?? 0;
    const enemyPresence = state?.presence ?? 0;
    const enemyAlive = state?.active ?? false;
    const enemyRpm = THREE.MathUtils.clamp(enemyThrottle, 0, 1);
    const enemySpeedMix = THREE.MathUtils.clamp(enemySpeed / 70, 0, 1);
    const distanceFade =
        enemyAlive && Number.isFinite(enemyDistance)
            ? THREE.MathUtils.clamp(1 - enemyDistance / 1400, 0, 1)
            : 0;
    const formationBoost = THREE.MathUtils.clamp(0.8 + enemyNearbyCount * 0.25, 0.8, 1.9);
    const presenceBoost = THREE.MathUtils.clamp(enemyPresence, 0, 2.2);
    const audibleMix = distanceFade * formationBoost * presenceBoost;

    layer.master.gain.setTargetAtTime((0.34 + enemyRpm * 0.38) * audibleMix * volume, t, 0.09);
    layer.bodyOsc.frequency.setTargetAtTime(14 + enemyRpm * 12 + enemySpeedMix * 3, t, 0.1);
    layer.buzzOsc.frequency.setTargetAtTime(28 + enemyRpm * 34 + enemySpeedMix * 8, t, 0.08);
    layer.bodyFilter.frequency.setTargetAtTime(82 + enemyRpm * 66, t, 0.12);
    layer.buzzFilter.frequency.setTargetAtTime(120 + enemyRpm * 120, t, 0.1);
    layer.bodyGain.gain.setTargetAtTime(0.11 + enemyRpm * 0.1, t, 0.1);
    layer.buzzGain.gain.setTargetAtTime(0.045 + enemyRpm * 0.04, t, 0.08);
}

export function createEngineAudio({ window, THREE, getPlayerState, getEnemyState = null }) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return createSilentEngineAudio();

    const ctx = new AudioCtx();
    const noiseBuffer = createNoiseBuffer(ctx);
    const playerLayer = createPlayerLayer(ctx, noiseBuffer);
    const enemyLayer = createEnemyLayer(ctx);

    let started = false;
    let volume = 0.28;

    return {
        unlock() {
            if (started) return;
            started = true;
            ctx.resume().catch(() => {});
        },
        setVolume(nextVolume) {
            volume = THREE.MathUtils.clamp(nextVolume, 0, 1);
        },
        update() {
            if (!started) return;
            const t = ctx.currentTime;
            updatePlayerLayer(playerLayer, THREE, getPlayerState?.(), volume, t);
            updateEnemyLayer(enemyLayer, THREE, getEnemyState?.(), volume, t);
        },
    };
}
