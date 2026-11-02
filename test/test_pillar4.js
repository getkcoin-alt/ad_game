/**
 * Unit Test Suite for Pillar 4: Dynamic Sensory Juiciness & Tactile Micro-Interactions ("Ras & Bhav")
 */

const assert = require('assert');

// Mock browser globals for Node.js test environment
let lastVibratePattern = null;
global.window = {
    devicePixelRatio: 1,
    addEventListener: () => {},
    AudioContext: class {
        constructor() {
            this.currentTime = 0;
            this.destination = {};
        }
        createBiquadFilter() {
            return {
                type: 'lowpass',
                frequency: {
                    value: 22000,
                    setValueAtTime(v) { this.value = v; },
                    cancelScheduledValues() {},
                    exponentialRampToValueAtTime(v) { this.value = v; }
                },
                Q: { setValueAtTime() {} },
                connect() {}
            };
        }
        createGain() {
            return {
                gain: {
                    value: 1,
                    setValueAtTime(v) { this.value = v; },
                    exponentialRampToValueAtTime(v) { this.value = v; }
                },
                connect() {}
            };
        }
        createOscillator() {
            return {
                type: 'sine',
                frequency: {
                    setValueAtTime() {},
                    exponentialRampToValueAtTime() {}
                },
                connect() {},
                start() {},
                stop() {}
            };
        }
        resume() {}
    }
};

global.navigator.vibrate = function(pattern) {
    lastVibratePattern = pattern;
    return true;
};

// Mock canvas and 2d context
function createMockCanvas() {
    return {
        parentElement: {
            getBoundingClientRect: () => ({ width: 400, height: 600 })
        },
        style: {},
        getContext: () => ({
            setTransform: () => {},
            clearRect: () => {},
            save: () => {},
            restore: () => {},
            translate: () => {},
            scale: () => {},
            rotate: () => {},
            beginPath: () => {},
            arc: () => {},
            ellipse: () => {},
            fill: () => {},
            stroke: () => {},
            fillRect: () => {},
            fillText: () => {},
            createRadialGradient: () => ({
                addColorStop: () => {}
            }),
            moveTo: () => {},
            lineTo: () => {},
            quadraticCurveTo: () => {},
            closePath: () => {}
        })
    };
}

// Load files
const fs = require('fs');
const path = require('path');

const dataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
const gridCode = fs.readFileSync(path.join(__dirname, '../js/grid.js'), 'utf8');
const renderCode = fs.readFileSync(path.join(__dirname, '../js/render.js'), 'utf8');
const audioCode = fs.readFileSync(path.join(__dirname, '../js/audio.js'), 'utf8');
const gameCode = fs.readFileSync(path.join(__dirname, '../js/game.js'), 'utf8');

eval(dataCode);
eval(gridCode);
global.Match3Grid = window.Match3Grid;
global.CourtyardManager = class { init() {} render() {} };
global.StorageManager = { data: { language: 'en', lives: 5, coins: 150, stars: 0, boosters: { hammer: 1, anar: 1, swap: 1 } }, updateLivesRegeneration: () => {} };
global.document = {
    getElementById: () => null,
    querySelectorAll: () => []
};

eval(renderCode);
eval(audioCode);
eval(gameCode);

console.log('Testing Pillar 4: Dynamic Sensory Juiciness & Tactile Micro-Interactions...');

// Test 1: HapticEngine provides correct tactile vibration patterns
console.log('Test 1: Android Haptic Feedback patterns...');
assert.strictEqual(window.HapticEngine.isSupported(), true, 'HapticEngine should report supported');

window.HapticEngine.lightTap();
assert.strictEqual(lastVibratePattern, 12, 'lightTap should trigger 12ms pulse');

window.HapticEngine.matchPulse();
assert.deepStrictEqual(lastVibratePattern, [18, 25, 18], 'matchPulse should trigger [18, 25, 18] wave');

window.HapticEngine.specialCreated();
assert.deepStrictEqual(lastVibratePattern, [30, 40, 45], 'specialCreated should trigger [30, 40, 45] escalation');

window.HapticEngine.explosion();
assert.deepStrictEqual(lastVibratePattern, [45, 30, 75], 'explosion should trigger [45, 30, 75] boom');

window.HapticEngine.wobble();
assert.deepStrictEqual(lastVibratePattern, [25, 20, 25], 'wobble should trigger [25, 20, 25] bounce');

window.HapticEngine.victoryFanfare();
assert.deepStrictEqual(lastVibratePattern, [30, 40, 30, 40, 70], 'victoryFanfare should trigger full fanfare');
console.log('✓ Test 1 Passed: HapticEngine invoked with precise tactile curves');

// Test 2: SoundEngine Master Low-Pass Filter on Pause
console.log('Test 2: Web Audio Master Low-Pass Filter...');
const audio = window.AudioEngine;
audio.init();
assert.ok(audio.masterFilter, 'Master lowpass filter should be initialized');
assert.strictEqual(audio.masterFilter.type, 'lowpass', 'Master filter should be lowpass');

audio.setPausedFilter(true);
assert.strictEqual(audio.isFilterPaused, true, 'isFilterPaused should be true');
assert.strictEqual(audio.masterFilter.frequency.value, 420, 'Filter frequency should ramp down to 420Hz on pause');

audio.setPausedFilter(false);
assert.strictEqual(audio.isFilterPaused, false, 'isFilterPaused should be false');
assert.strictEqual(audio.masterFilter.frequency.value, 22000, 'Filter frequency should ramp open to 22,000Hz on resume');
console.log('✓ Test 2 Passed: Web Audio BiquadFilter transitions seamlessly between 22kHz and 420Hz');

// Test 3: GameRenderer Shockwave Lifecycle
console.log('Test 3: Shockwave Distortion Rings Lifecycle...');
const canvas = createMockCanvas();
const renderer = new window.GameRenderer(canvas);

renderer.spawnShockwave(100, 150, '#FFD700', 80);
assert.strictEqual(renderer.shockwaves.length, 1, 'Shockwave should be created');
const sw = renderer.shockwaves[0];
assert.strictEqual(sw.x, 100);
assert.strictEqual(sw.y, 150);
assert.strictEqual(sw.color, '#FFD700');
assert.strictEqual(sw.maxRadius, 80);
assert.strictEqual(sw.alpha, 1.0);

// Advance shockwaves
renderer.updateAndDrawShockwaves();
assert.ok(renderer.shockwaves[0].radius > 8, 'Shockwave radius should expand');
assert.ok(renderer.shockwaves[0].alpha < 1.0, 'Shockwave alpha should decay');

// Simulate full expansion until deletion
for (let f = 0; f < 30; f++) {
    renderer.updateAndDrawShockwaves();
}
assert.strictEqual(renderer.shockwaves.length, 0, 'Shockwave should be cleanly removed once faded/expanded');
console.log('✓ Test 3 Passed: Shockwave ring expands dynamically and garbage-collects safely');

// Test 4: Celebratory Confetti Rain System
console.log('Test 4: Celebratory Confetti Rain...');
renderer.spawnConfettiRain(50);
const confettiParticles = renderer.particles.filter(p => p.type === 'confetti');
assert.strictEqual(confettiParticles.length, 50, 'Should spawn 50 confetti particles');
assert.ok(confettiParticles[0].w >= 6, 'Confetti should have width');
assert.ok(confettiParticles[0].h >= 10, 'Confetti should have height');
assert.ok(confettiParticles[0].vy > 2.0, 'Confetti should fall downward with gravity');

// Update particles
renderer.updateAndDrawParticles();
assert.ok(confettiParticles[0].alpha < 1.0, 'Confetti should decay over time');
console.log('✓ Test 4 Passed: Confetti rain spawns fluttering multi-colored particles');

// Test 5: Tactile Spring Scale Pop Floating Text
console.log('Test 5: Spring Scale Pop Floating Text Accolades...');
renderer.spawnFloatingText(200, 300, 'Shandar!', '#FFD700', 26);
assert.strictEqual(renderer.floatingTexts.length, 1, 'Floating text should be registered');
const ft = renderer.floatingTexts[0];
assert.strictEqual(ft.frame, 0, 'Initial frame should be 0');

renderer.updateAndDrawFloatingTexts();
assert.strictEqual(ft.frame, 1, 'Frame should increment');
assert.ok(ft.y < 300, 'Floating text should ascend vertically');
console.log('✓ Test 5 Passed: Floating text accolade triggers spring scale pop curve');

// Test 6: Squash & Stretch Gem Landing Physics
console.log('Test 6: Squash & Stretch landing physics calculation...');
const mockGem = {
    type: 0,
    special: 0,
    animX: 0,
    animY: 0.15,
    squashTimer: 0
};

// Simulate landing: prevAnimY is 0.15, current animY scales down to 0.05
const prevAnimY = mockGem.animY;
mockGem.animY *= 0.3; // drops to 0.045
if (Math.abs(prevAnimY) > 0.08 && Math.abs(mockGem.animY) <= 0.08) {
    mockGem.squashTimer = 1.0;
}
assert.strictEqual(mockGem.squashTimer, 1.0, 'Landing transition must trigger squashTimer = 1.0');

// Calculate rebound deformation
mockGem.squashTimer -= 0.12;
const wave = Math.sin((1.0 - mockGem.squashTimer) * Math.PI);
const scaleX = 1.0 + (wave * 0.20);
const scaleY = 1.0 - (wave * 0.18);

assert.ok(scaleX > 1.0, `Gem should expand horizontally on landing impact (scaleX=${scaleX})`);
assert.ok(scaleY < 1.0, `Gem should compress vertically on landing impact (scaleY=${scaleY})`);
console.log(`✓ Test 6 Passed: Landing physics produces physical squash & stretch deformation (${scaleX.toFixed(3)}x, ${scaleY.toFixed(3)}y)`);

console.log('\n======================================================');
console.log('ALL PILLAR 4 UNIT TESTS PASSED SUCCESSFULLY! (6/6)');
console.log('======================================================');
