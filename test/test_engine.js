/**
 * Unit & Integration Test Suite for Rangoli Utsav Game Engine
 * Runs under Node.js without browser DOM dependencies.
 */

const assert = require('assert');

// Mock window and browser APIs for Node environment
global.window = {};

// Load data.js
require('../js/data.js');
const GEM_TYPES = window.GEM_TYPES;
const SPECIAL_TYPES = window.SPECIAL_TYPES;
const OBSTACLE_TYPES = window.OBSTACLE_TYPES;
const LEVEL_CONFIGS = window.LEVEL_CONFIGS;

// Load grid.js
require('../js/grid.js');
const Match3Grid = window.Match3Grid;

console.log('--- RUNNING RANGOLI UTSAV ENGINE TESTS ---');

let passedTests = 0;
let totalTests = 0;

function it(desc, fn) {
    totalTests++;
    try {
        fn();
        console.log(`  ✓ ${desc}`);
        passedTests++;
    } catch (e) {
        console.error(`  ✗ ${desc}`);
        console.error(e);
        process.exitCode = 1;
    }
}

// 1. Grid Initialization
it('should correctly initialize an 8x8 grid without initial 3-matches', () => {
    const grid = new Match3Grid(8, 8);
    grid.initLevel(LEVEL_CONFIGS[0]);

    assert.strictEqual(grid.rows, 8);
    assert.strictEqual(grid.cols, 8);

    // Verify all cells have gems
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            assert.notStrictEqual(grid.get(r, c).gem, null);
        }
    }

    // Verify no pre-existing 3 matches
    const matches = grid.findMatches();
    assert.strictEqual(matches.cells.length, 0);
});

// 2. Horizontal Match Detection (3 in a row)
it('should accurately detect 3-in-a-row horizontal match', () => {
    const grid = new Match3Grid(8, 8);
    grid.initLevel(LEVEL_CONFIGS[0]);

    // Force a 3-match on row 0, cols 0..2
    grid.grid[0][0].gem = { id: 100, type: 0, special: SPECIAL_TYPES.NORMAL };
    grid.grid[0][1].gem = { id: 101, type: 0, special: SPECIAL_TYPES.NORMAL };
    grid.grid[0][2].gem = { id: 102, type: 0, special: SPECIAL_TYPES.NORMAL };
    grid.grid[0][3].gem = { id: 103, type: 1, special: SPECIAL_TYPES.NORMAL };

    const matches = grid.findMatches();
    const has00 = matches.cells.some(c => c.r === 0 && c.c === 0);
    const has01 = matches.cells.some(c => c.r === 0 && c.c === 1);
    const has02 = matches.cells.some(c => c.r === 0 && c.c === 2);

    assert.ok(has00 && has01 && has02);
});

// 3. Line of 4 Match -> Chakra Special Creation
it('should identify 4-in-a-row and designate Chakra special', () => {
    const grid = new Match3Grid(8, 8);
    grid.initLevel(LEVEL_CONFIGS[0]);

    for (let c = 0; c < 4; c++) {
        grid.grid[2][c].gem = { id: 200 + c, type: 2, special: SPECIAL_TYPES.NORMAL };
    }
    grid.grid[2][4].gem = { id: 204, type: 3, special: SPECIAL_TYPES.NORMAL };

    const matches = grid.findMatches();
    assert.strictEqual(matches.line4H.length, 1);
    assert.strictEqual(matches.line4H[0].length, 4);
});

// 4. Line of 5 Match -> Mayur Rainbow Special Creation
it('should identify 5-in-a-row and designate Mayur Rainbow special', () => {
    const grid = new Match3Grid(8, 8);
    grid.initLevel(LEVEL_CONFIGS[0]);

    for (let c = 0; c < 5; c++) {
        grid.grid[3][c].gem = { id: 300 + c, type: 4, special: SPECIAL_TYPES.NORMAL };
    }
    grid.grid[3][5].gem = { id: 305, type: 1, special: SPECIAL_TYPES.NORMAL };

    const matches = grid.findMatches();
    assert.strictEqual(matches.line5.length, 1);
    assert.strictEqual(matches.line5[0].length, 5);
});

// 5. Clay Diya Lighting Mechanism
it('should light unlit Diyas on adjacent matches', () => {
    const grid = new Match3Grid(8, 8);
    grid.initLevel(LEVEL_CONFIGS[1]); // Level 2 with Diyas

    // Diya at (2, 2)
    assert.strictEqual(grid.grid[2][2].diya, OBSTACLE_TYPES.DIYA_UNLIT);

    // Match adjacent cell at (2, 1)
    const { affectedDiyas } = grid.damageAdjacentObstacles([{ r: 2, c: 1 }]);

    assert.strictEqual(grid.grid[2][2].diya, OBSTACLE_TYPES.DIYA_LIT);
    assert.strictEqual(affectedDiyas.length, 1);
    assert.strictEqual(grid.litDiyasCount, 1);
});

// 6. Marigold Garland HP Deduction
it('should deduct HP and clear Marigolds on adjacent matches', () => {
    const grid = new Match3Grid(8, 8);
    grid.initLevel(LEVEL_CONFIGS[2]); // Level 3 with Marigolds

    // Cell with 1 HP marigold
    const initialHP = grid.grid[1][3].marigold;
    assert.strictEqual(initialHP, 1);

    // Damage cell using an adjacent coordinate that only touches (1, 3)
    const { affectedMarigolds } = grid.damageAdjacentObstacles([{ r: 0, c: 3 }]);

    assert.strictEqual(grid.grid[1][3].marigold, 0);
    assert.strictEqual(grid.clearedMarigoldsCount, 1);
    assert.strictEqual(affectedMarigolds.length, 1);
});

// 7. Gravity Fall & Board Refill
it('should drop pieces downward and spawn fresh gems on gravity', () => {
    const grid = new Match3Grid(8, 8);
    grid.initLevel(LEVEL_CONFIGS[0]);

    // Clear bottom two gems in col 0
    grid.grid[7][0].gem = null;
    grid.grid[6][0].gem = null;

    const { movements, newGems } = grid.applyGravity();

    assert.ok(movements.length > 0 || newGems.length > 0);
    // Ensure all cells in col 0 are filled again
    for (let r = 0; r < 8; r++) {
        assert.notStrictEqual(grid.grid[r][0].gem, null);
    }
});

// 8. Swap Validity Checker
it('should validate legal swaps that create matches', () => {
    const grid = new Match3Grid(8, 8);
    grid.initLevel(LEVEL_CONFIGS[0]);

    // Set up a guaranteed match upon swap
    grid.grid[4][0].gem = { id: 400, type: 1, special: SPECIAL_TYPES.NORMAL };
    grid.grid[4][1].gem = { id: 401, type: 1, special: SPECIAL_TYPES.NORMAL };
    grid.grid[4][2].gem = { id: 402, type: 0, special: SPECIAL_TYPES.NORMAL }; // will be swapped
    grid.grid[4][3].gem = { id: 403, type: 1, special: SPECIAL_TYPES.NORMAL }; // target swap

    const canSwap = grid.canSwap(4, 2, 4, 3);
    assert.strictEqual(canSwap, true);
});

// 9. Special Combo Synergy: Mayur Rainbow + Chakra
it('should properly handle Mayur Rainbow + Chakra combo', () => {
    const grid = new Match3Grid(8, 8);
    grid.initLevel(LEVEL_CONFIGS[0]);

    grid.grid[5][2].gem = { id: 501, type: 0, special: SPECIAL_TYPES.MAYUR_RAINBOW };
    grid.grid[5][3].gem = { id: 502, type: 2, special: SPECIAL_TYPES.CHAKRA_ROW };

    const combo = grid.handleSpecialCombo(5, 2, 5, 3);
    assert.ok(combo.clearedCoords.length > 0);
    assert.ok(combo.effects.some(e => e.type === 'CHAKRA_RAINBOW'));
});

// 10. Deadlock Detection & Reshuffle
it('should detect available moves and shuffle if deadlocked', () => {
    const grid = new Match3Grid(8, 8);
    grid.initLevel(LEVEL_CONFIGS[0]);

    const hasMoves = grid.hasPossibleMoves();
    assert.strictEqual(typeof hasMoves, 'boolean');

    const shuffled = grid.shuffleBoard(false);
    assert.strictEqual(shuffled, true);
});

// 11. Pillar 1: Direct Tap-to-Activate Special (Royal Match Fluid UX)
it('should detonate Anar Bomb in place without needing a swap', () => {
    const grid = new Match3Grid(8, 8);
    grid.initLevel(LEVEL_CONFIGS[0]);

    grid.grid[3][3].gem = { id: 777, type: 1, special: SPECIAL_TYPES.ANAR_BOMB };
    const blast = grid.detonateSpecialInPlace(3, 3);

    assert.ok(blast !== null);
    assert.strictEqual(blast.specialType, SPECIAL_TYPES.ANAR_BOMB);
    // 3x3 surrounding cells = 9 cells
    assert.strictEqual(blast.clearedCoords.length, 9);
    assert.ok(blast.clearedCoords.some(c => c.r === 3 && c.c === 3));
    assert.ok(blast.clearedCoords.some(c => c.r === 2 && c.c === 2));
    assert.ok(blast.clearedCoords.some(c => c.r === 4 && c.c === 4));
});

// 12. Pillar 1: Direct Tap-to-Activate Chakra Row
it('should detonate Chakra Row in place clearing full row', () => {
    const grid = new Match3Grid(8, 8);
    grid.initLevel(LEVEL_CONFIGS[0]);

    grid.grid[4][2].gem = { id: 888, type: 2, special: SPECIAL_TYPES.CHAKRA_ROW };
    const beam = grid.detonateSpecialInPlace(4, 2);

    assert.ok(beam !== null);
    assert.strictEqual(beam.specialType, SPECIAL_TYPES.CHAKRA_ROW);
    assert.strictEqual(beam.clearedCoords.length, 8);
    for (let c = 0; c < 8; c++) {
        assert.ok(beam.clearedCoords.some(coord => coord.r === 4 && coord.c === c));
    }
});

// 13. Pillar 1: Smart Obstacle Targeting for Peacock Sweep
it('should smart-target the color with the most unlit Diyas or Marigolds', () => {
    const grid = new Match3Grid(8, 8);
    grid.initLevel(LEVEL_CONFIGS[0]);

    // Place unlit Diyas under ruby gems (type 0)
    for (let c = 0; c < 3; c++) {
        grid.grid[1][c].gem = { id: 900 + c, type: 0, special: SPECIAL_TYPES.NORMAL };
        grid.grid[1][c].diya = OBSTACLE_TYPES.DIYA_UNLIT;
    }

    const bestColor = grid.findBestColorForPeacockSweep();
    assert.strictEqual(bestColor, 0); // Ruby (type 0) has highest obstacle score
});

// 14. Pillar 1: T/L Shape match creates Anar Bomb
it('should identify T or L shape match intersections for Anar Bomb creation', () => {
    const grid = new Match3Grid(8, 8);
    grid.initLevel(LEVEL_CONFIGS[0]);

    // Create a T-shape of type 1 (Topaz) at center (2, 2)
    // Horizontal row 2: cols 1, 2, 3
    grid.grid[2][1].gem = { id: 10, type: 1, special: SPECIAL_TYPES.NORMAL };
    grid.grid[2][2].gem = { id: 11, type: 1, special: SPECIAL_TYPES.NORMAL };
    grid.grid[2][3].gem = { id: 12, type: 1, special: SPECIAL_TYPES.NORMAL };
    // Vertical col 2: rows 1, 2, 3
    grid.grid[1][2].gem = { id: 13, type: 1, special: SPECIAL_TYPES.NORMAL };
    grid.grid[3][2].gem = { id: 14, type: 1, special: SPECIAL_TYPES.NORMAL };

    // Fill adjacent non-matching
    grid.grid[2][0].gem = { id: 15, type: 3, special: SPECIAL_TYPES.NORMAL };
    grid.grid[2][4].gem = { id: 16, type: 3, special: SPECIAL_TYPES.NORMAL };
    grid.grid[0][2].gem = { id: 17, type: 3, special: SPECIAL_TYPES.NORMAL };
    grid.grid[4][2].gem = { id: 18, type: 3, special: SPECIAL_TYPES.NORMAL };

    const matches = grid.findMatches();
    assert.ok(matches.tOrL.length >= 1);
    assert.strictEqual(matches.tOrL[0].r, 2);
    assert.strictEqual(matches.tOrL[0].c, 2);
});

console.log(`\nAll Engine Tests Completed: ${passedTests}/${totalTests} Passed!`);
if (passedTests !== totalTests) {
    process.exit(1);
}
