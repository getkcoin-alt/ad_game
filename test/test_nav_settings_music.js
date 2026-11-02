const assert = require('assert');

// Mock window and navigator for Node.js test environment
global.window = global;
navigator.vibrateCount = 0;
navigator.lastVibratePattern = null;
navigator.vibrate = function(pattern) {
    this.vibrateCount = (this.vibrateCount || 0) + 1;
    this.lastVibratePattern = pattern;
    return true;
};

// Mock AudioContext for Web Audio API verification
class MockAudioNode {
    constructor() {
        this.connectedTo = null;
        this.value = 0;
    }
    connect(target) {
        this.connectedTo = target;
        return target;
    }
    setValueAtTime(val, time) {
        this.value = val;
    }
    exponentialRampToValueAtTime(val, time) {
        this.value = val;
    }
    cancelScheduledValues(time) {}
}

class MockAudioParam extends MockAudioNode {}

class MockGainNode extends MockAudioNode {
    constructor() {
        super();
        this.gain = new MockAudioParam();
    }
}

class MockBiquadFilterNode extends MockAudioNode {
    constructor() {
        super();
        this.frequency = new MockAudioParam();
        this.Q = new MockAudioParam();
        this.type = 'lowpass';
    }
}

class MockOscillatorNode extends MockAudioNode {
    constructor() {
        super();
        this.frequency = new MockAudioParam();
        this.type = 'sine';
        this.started = false;
        this.stopped = false;
    }
    start(time) {
        this.started = true;
    }
    stop(time) {
        this.stopped = true;
    }
}

class MockAudioContext {
    constructor() {
        this.currentTime = 0.5;
        this.destination = new MockAudioNode();
        this.state = 'running';
        this.oscillators = [];
        this.gains = [];
        this.filters = [];
    }
    createGain() {
        const g = new MockGainNode();
        this.gains.push(g);
        return g;
    }
    createBiquadFilter() {
        const f = new MockBiquadFilterNode();
        this.filters.push(f);
        return f;
    }
    createOscillator() {
        const o = new MockOscillatorNode();
        this.oscillators.push(o);
        return o;
    }
    resume() {
        this.state = 'running';
    }
}

global.AudioContext = MockAudioContext;
global.webkitAudioContext = MockAudioContext;

// Mock localStorage
const storageStore = {};
global.localStorage = {
    getItem: (key) => storageStore[key] || null,
    setItem: (key, val) => { storageStore[key] = String(val); },
    removeItem: (key) => { delete storageStore[key]; },
    clear: () => { Object.keys(storageStore).forEach(k => delete storageStore[k]); }
};

// Mock document and canvas
global.document = {
    getElementById: (id) => {
        return {
            id,
            classList: {
                classes: new Set(),
                add(c) { this.classes.add(c); },
                remove(c) { this.classes.delete(c); },
                contains(c) { return this.classes.has(c); }
            },
            addEventListener: () => {},
            style: {},
            textContent: '',
            value: 0
        };
    },
    querySelectorAll: () => []
};

// Load dependencies
require('../js/data.js');
require('../js/audio.js');
require('../js/storage.js');
require('../js/grid.js');
global.Match3Grid = window.Match3Grid;
global.CourtyardManager = class { init() {} render() {} };
require('../js/game.js');

let totalTests = 0;
let passedTests = 0;

function it(desc, fn) {
    totalTests++;
    try {
        fn();
        console.log(`  ✓ ${desc}`);
        passedTests++;
    } catch (err) {
        console.error(`  ✗ ${desc}`);
        console.error(err);
    }
}

console.log('--- RUNNING NAVIGATION, SETTINGS & RAGA TARANG MUSIC TESTS ---');

// 1. Audio Engine Pipeline & Volume Controls
it('should initialize separate SFX and Music gain channels connecting to master filter', () => {
    const ae = window.AudioEngine;
    ae.init();

    assert.ok(ae.masterFilter, 'Master filter must exist');
    assert.ok(ae.masterGain, 'Master gain must exist');
    assert.ok(ae.sfxGainNode, 'SFX Gain Node must exist');
    assert.ok(ae.musicGainNode, 'Music Gain Node must exist');

    assert.strictEqual(ae.sfxGainNode.connectedTo, ae.masterFilter);
    assert.strictEqual(ae.musicGainNode.connectedTo, ae.masterFilter);
    assert.strictEqual(ae.masterFilter.connectedTo, ae.masterGain);
    assert.strictEqual(ae.masterGain.connectedTo, ae.ctx.destination);
});

// 2. Independent Volume Scaling
it('should smoothly adjust SFX and Music volumes independently', () => {
    const ae = window.AudioEngine;
    ae.setSoundVolume(0.45);
    assert.strictEqual(ae.soundVolume, 0.45);
    assert.strictEqual(ae.sfxGainNode.gain.value, 0.45);

    ae.setMusicVolume(0.35);
    assert.strictEqual(ae.musicVolume, 0.35);
    assert.strictEqual(ae.musicGainNode.gain.value, 0.35);

    // Muting sound should set sfxGain to 0 while preserving music
    ae.toggleSound();
    assert.strictEqual(ae.soundEnabled, false);
    assert.strictEqual(ae.sfxGainNode.gain.value, 0.0);
    assert.strictEqual(ae.musicGainNode.gain.value, 0.35);

    // Restore sound
    ae.toggleSound();
    assert.strictEqual(ae.soundEnabled, true);
    assert.strictEqual(ae.sfxGainNode.gain.value, 0.45);
});

// 3. Procedural Loop Music ("Raga Tarang") Engine
it('should start and schedule the 4-voice procedural loop music engine', () => {
    const ae = window.AudioEngine;
    ae.musicEnabled = true;
    ae.startMusicLoop();

    assert.strictEqual(ae.isMusicPlaying, true);
    assert.ok(ae.tanpuraOscillators.length >= 3, 'Tanpura drone must spawn multi-voice oscillators');
    assert.ok(ae.musicTimer !== null, 'Music lookahead scheduler timer must be active');

    // Test specific step playback across the 64-step Raga Bhupali cycle
    const oscCountBefore = ae.ctx.oscillators.length;

    // Step 0: Bayan bass + Sitar Sa (C4 261.63Hz)
    ae.playMusicStep(0, ae.ctx.currentTime);
    assert.ok(ae.ctx.oscillators.length > oscCountBefore, 'Step 0 should trigger instruments');

    // Step 4: Dayan snap + Sitar Re (D4 293.66Hz)
    ae.playMusicStep(4, ae.ctx.currentTime);

    // Step 14: Santur chime shimmer (C6 1046.50Hz)
    ae.playMusicStep(14, ae.ctx.currentTime);

    // Step 28: High peak Sitar Taar Sa (C5 523.25Hz)
    ae.playMusicStep(28, ae.ctx.currentTime);

    // Stop music loop
    ae.stopMusicLoop();
    assert.strictEqual(ae.isMusicPlaying, false);
    assert.strictEqual(ae.musicTimer, null);
    assert.strictEqual(ae.tanpuraOscillators.length, 0);
});

// 4. Master Low-Pass Filter on Pause
it('should muffle both Music and SFX through 420Hz filter on pause and restore to 22kHz on resume', () => {
    const ae = window.AudioEngine;
    ae.setPausedFilter(true);
    assert.strictEqual(ae.isFilterPaused, true);
    assert.strictEqual(ae.targetFilterFreq, 420);
    assert.strictEqual(ae.masterFilter.frequency.value, 420);

    ae.setPausedFilter(false);
    assert.strictEqual(ae.isFilterPaused, false);
    assert.strictEqual(ae.targetFilterFreq, 22000);
    assert.strictEqual(ae.masterFilter.frequency.value, 22000);
});

// 5. StorageManager Preferences & Progress Reset
it('should persist audio volume levels and haptics flag in StorageManager', () => {
    const sm = window.StorageManager;
    sm.setVolumes(0.75, 0.55);
    assert.strictEqual(sm.data.soundVolume, 0.75);
    assert.strictEqual(sm.data.musicVolume, 0.55);

    sm.setHapticsEnabled(false);
    assert.strictEqual(sm.data.hapticsEnabled, false);
    assert.strictEqual(window.HapticEngine.isSupported(), false, 'Haptics must be disabled when flag is false');

    sm.setHapticsEnabled(true);
    assert.strictEqual(sm.data.hapticsEnabled, true);
    assert.strictEqual(window.HapticEngine.isSupported(), true);
});

// 6. Reset Progress Safety Guard
it('should cleanly reset game levels and economy while preserving artisan ID and preferences', () => {
    const sm = window.StorageManager;
    sm.data.unlockedLevel = 5;
    sm.data.coins = 900;
    sm.data.stars = 12;
    sm.data.winStreak = 3;
    sm.data.soundVolume = 0.9;
    sm.data.musicVolume = 0.7;
    const oldArtisanId = sm.data.artisanId;

    sm.resetProgress();

    assert.strictEqual(sm.data.unlockedLevel, 1);
    assert.strictEqual(sm.data.coins, 150);
    assert.strictEqual(sm.data.stars, 0);
    assert.strictEqual(sm.data.winStreak, 0);
    assert.strictEqual(sm.data.artisanId, oldArtisanId, 'Artisan ID must be preserved');
    assert.strictEqual(sm.data.soundVolume, 0.9, 'Sound preference must be preserved');
    assert.strictEqual(sm.data.musicVolume, 0.7, 'Music preference must be preserved');
});

// 7. Tactile Haptic Vibration Patterns
it('should dispatch vibration patterns only when enabled', () => {
    const haptics = window.HapticEngine;
    navigator.vibrateCount = 0;

    haptics.lightTap();
    assert.strictEqual(navigator.vibrateCount, 1);
    assert.strictEqual(navigator.lastVibratePattern, 12);

    haptics.matchPulse();
    assert.strictEqual(navigator.vibrateCount, 2);
    assert.deepStrictEqual(navigator.lastVibratePattern, [18, 25, 18]);

    // Disable haptics and verify silence
    haptics.setEnabled(false);
    haptics.explosion();
    assert.strictEqual(navigator.vibrateCount, 2, 'No vibration when haptics disabled');

    haptics.setEnabled(true);
    haptics.explosion();
    assert.strictEqual(navigator.vibrateCount, 3);
});

console.log(`\nAll Navigation, Settings & Music Tests Completed: ${passedTests}/${totalTests} Passed!`);
if (passedTests !== totalTests) {
    process.exit(1);
}
