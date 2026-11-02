/**
 * Economy, Persistence, Churn Risk & Localization Tests
 */

const assert = require('assert');

// Mock localStorage and window
const store = {};
global.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { for (const k in store) delete store[k]; }
};

global.window = {
    AudioEngine: {
        playLevelVictory: () => {},
        playGhungroo: () => {},
        playSitarPluck: () => {}
    }
};

require('../js/data.js');
require('../js/storage.js');
require('../js/analytics.js');
require('../js/ads.js');

const sm = window.StorageManager;
const analytics = window.AnalyticsEngine;
const ads = window.AdSystem;
const I18N = window.I18N;

console.log('--- RUNNING ECONOMY, MONETIZATION & PSYCHOLOGY TESTS ---');

let passed = 0;
let total = 0;

function it(desc, fn) {
    total++;
    try {
        fn();
        console.log(`  ✓ ${desc}`);
        passed++;
    } catch (e) {
        console.error(`  ✗ ${desc}`);
        console.error(e);
        process.exitCode = 1;
    }
}

// 1. Initial State & Shagun Coins
it('should start new players with 5 lives and 150 welcome Shagun coins', () => {
    assert.strictEqual(sm.data.lives, 5);
    assert.strictEqual(sm.data.coins, 150);
    assert.strictEqual(sm.data.unlockedLevel, 1);
});

// 2. Compassionate Energy Regeneration
it('should deduct life on level start and calculate regeneration time correctly', () => {
    const success = sm.deductLife();
    assert.strictEqual(success, true);
    assert.strictEqual(sm.data.lives, 4);

    const timeUntil = sm.getTimeUntilNextLife();
    assert.ok(timeUntil > 0 && timeUntil <= 20 * 60 * 1000);
});

// 3. Level Star Progression & Next Level Unlock
it('should record level victory, award coins, and unlock subsequent level', () => {
    sm.recordLevelWin(1, 3, 2400); // 3 stars, 2400 score
    assert.strictEqual(sm.data.levelStars[1], 3);
    assert.strictEqual(sm.data.unlockedLevel, 2);
    assert.strictEqual(sm.data.stars, 3);
    assert.ok(sm.data.coins > 150); // gained coins
});

// 4. Haveli Courtyard Renovation Unlock
it('should unlock Courtyard architectural elements when sufficient stars are earned', () => {
    // Marble floor requires 2 stars, we have 3 stars
    const unlocked = sm.unlockCourtyardItem('marble_floor', 2);
    assert.strictEqual(unlocked, true);
    assert.ok(sm.data.courtyardUnlocks.includes('marble_floor'));
});

// 5. Churn Risk Detection on Consecutive Failures
it('should proactively flag churn risk when player fails 2 times consecutively', () => {
    analytics.onLevelStart(4);
    const fail1 = analytics.onLevelFail(4, { diyas: 2 }, 1500);
    assert.strictEqual(fail1.isChurnRisk, false);
    assert.strictEqual(fail1.failCount, 1);

    analytics.onLevelStart(4);
    const fail2 = analytics.onLevelFail(4, { diyas: 1 }, 1800);
    assert.strictEqual(fail2.isChurnRisk, true);
    assert.strictEqual(fail2.failCount, 2);

    // Verify telemetry event
    const lastEvent = analytics.eventLog[analytics.eventLog.length - 1];
    assert.strictEqual(lastEvent.eventName, 'churn_risk_flagged');
});

// 6. Ethical Rewarded Ad Reward Disbursement
it('should correctly disburse booster or move rewards on ad completion', () => {
    const initialHammers = sm.data.boosters.hammer;
    sm.addBooster('hammer', 1);
    assert.strictEqual(sm.data.boosters.hammer, initialHammers + 1);

    const initialCoins = sm.data.coins;
    ads.grantWheelReward({ type: 'coins', amount: 50 });
    assert.strictEqual(sm.data.coins, initialCoins + 50);
});

// 7. Full Bilingual Dictionary Parity
it('should have 100% key parity between English and Hindi dictionaries', () => {
    const enKeys = Object.keys(I18N.en);
    const hiKeys = Object.keys(I18N.hi);
    assert.strictEqual(enKeys.length, hiKeys.length);

    enKeys.forEach(k => {
        assert.ok(I18N.hi[k] !== undefined, `Missing Hindi translation for key: ${k}`);
        assert.ok(I18N.hi[k].length > 0);
    });
});

console.log(`\nEconomy & Psychology Tests Completed: ${passed}/${total} Passed!`);
if (passed !== total) {
    process.exit(1);
}
