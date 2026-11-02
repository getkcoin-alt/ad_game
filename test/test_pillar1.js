/**
 * Pillar 1 Verification Tests: Royal Match Flow State & Smart Specials
 */

const assert = require('assert');

global.window = {};

require('../js/data.js');
const GEM_TYPES = window.GEM_TYPES;
const SPECIAL_TYPES = window.SPECIAL_TYPES;
const OBSTACLE_TYPES = window.OBSTACLE_TYPES;
const LEVEL_CONFIGS = window.LEVEL_CONFIGS;

require('../js/grid.js');
const Match3Grid = window.Match3Grid;

console.log('--- RUNNING PILLAR 1 VERIFICATION TESTS ---');

let passed = 0;
let total = 0;

function it(name, fn) {
    total++;
    try {
        fn();
        console.log(`  ✓ ${name}`);
        passed++;
    } catch (e) {
        console.error(`  ✗ ${name}`);
        console.error(e);
        process.exitCode = 1;
    }
}

// 1. Direct Tap-to-Activate specials in place
it('should detonate Chakra Col directly without swapping', () => {
    const grid = new Match3Grid(8, 8);
    grid.initLevel(LEVEL_CONFIGS[0]);

    grid.grid[2][5].gem = { id: 55, type: 0, special: SPECIAL_TYPES.CHAKRA_COL };
    const res = grid.detonateSpecialInPlace(2, 5);

    assert.ok(res !== null);
    assert.strictEqual(res.specialType, SPECIAL_TYPES.CHAKRA_COL);
    assert.strictEqual(res.clearedCoords.length, 8);
    for (let r = 0; r < 8; r++) {
        assert.ok(res.clearedCoords.some(c => c.r === r && c.c === 5));
    }
});

// 2. Chained Detonations: Chakra triggers adjacent Anar Bomb
it('should chain detonations if a special clears another special', () => {
    const grid = new Match3Grid(8, 8);
    grid.initLevel(LEVEL_CONFIGS[0]);

    // Chakra Row on row 3, with an Anar Bomb at (3, 6)
    grid.grid[3][1].gem = { id: 60, type: 1, special: SPECIAL_TYPES.CHAKRA_ROW };
    grid.grid[3][6].gem = { id: 61, type: 2, special: SPECIAL_TYPES.ANAR_BOMB };

    const res = grid.detonateSpecialInPlace(3, 1);
    assert.ok(res.clearedCoords.length > 8); // Entire row (8) + Anar blast radius around (3,6)
    assert.ok(res.clearedCoords.some(c => c.r === 2 && c.c === 6)); // Cell above Anar bomb cleared
    assert.ok(res.clearedCoords.some(c => c.r === 4 && c.c === 6)); // Cell below Anar bomb cleared
});

// 3. Mayur Rainbow Smart Targeting: Selects Color with Highest Obstacle Impact
it('should select the color with maximum obstacle proximity for solo Mayur Rainbow blast', () => {
    const grid = new Match3Grid(8, 8);
    grid.initLevel(LEVEL_CONFIGS[0]);

    // Type 4 (Amethyst) near unlit Diyas
    grid.grid[0][0].gem = { id: 70, type: 4, special: SPECIAL_TYPES.NORMAL };
    grid.grid[0][0].diya = OBSTACLE_TYPES.DIYA_UNLIT;
    grid.grid[0][1].gem = { id: 71, type: 4, special: SPECIAL_TYPES.NORMAL };
    grid.grid[0][1].diya = OBSTACLE_TYPES.DIYA_UNLIT;

    grid.grid[3][3].gem = { id: 72, type: 0, special: SPECIAL_TYPES.MAYUR_RAINBOW };
    const bestColor = grid.findBestColorForPeacockSweep();

    assert.strictEqual(bestColor, 4);

    const sweep = grid.detonateSpecialInPlace(3, 3);
    assert.strictEqual(sweep.specialType, SPECIAL_TYPES.MAYUR_RAINBOW);
    assert.ok(sweep.clearedCoords.some(c => c.r === 0 && c.c === 0));
    assert.ok(sweep.clearedCoords.some(c => c.r === 0 && c.c === 1));
});

// 4. Obstacle Counting Intelligence for Chakra Orientation
it('should evaluate obstacles in row vs column to optimize Chakra orientation', () => {
    const grid = new Match3Grid(8, 8);
    grid.initLevel(LEVEL_CONFIGS[0]);

    // Place Diyas on column 4
    grid.grid[1][4].diya = OBSTACLE_TYPES.DIYA_UNLIT;
    grid.grid[5][4].diya = OBSTACLE_TYPES.DIYA_UNLIT;
    grid.grid[6][4].diya = OBSTACLE_TYPES.DIYA_UNLIT;

    const rowObs = grid.countObstaclesInRow(2);
    const colObs = grid.countObstaclesInCol(4);

    assert.ok(colObs > rowObs);
    // When a match happens at (2, 4), the smart system will choose CHAKRA_COL over CHAKRA_ROW!
});

console.log(`\nPillar 1 Verification Completed: ${passed}/${total} Passed!`);
if (passed !== total) process.exit(1);
