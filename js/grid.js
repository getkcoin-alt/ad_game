/**
 * Core Match-3 Board Engine for Rangoli Utsav
 * Handles grid state, match detection (lines, T/L shapes, combos),
 * obstacle interactions (Diyas, Marigolds), gravity falls, cascades, and hint generation.
 */

(function() {
const _scope = typeof window !== 'undefined' ? window : globalThis;
const GEM_TYPES = _scope.GEM_TYPES || [];
const SPECIAL_TYPES = _scope.SPECIAL_TYPES || { NORMAL: 0, CHAKRA_ROW: 1, CHAKRA_COL: 2, ANAR_BOMB: 3, MAYUR_RAINBOW: 4 };
const OBSTACLE_TYPES = _scope.OBSTACLE_TYPES || { NONE: 0, DIYA_UNLIT: 1, DIYA_LIT: 2, MARIGOLD_1: 3, MARIGOLD_2: 4 };

class Match3Grid {
    constructor(rows = 8, cols = 8) {
        this.rows = rows;
        this.cols = cols;
        this.grid = [];
        this.nextGemId = 1;
        this.isBusy = false;
        this.activeLevel = null;
        this.cascadeCount = 0;
        
        // Progress tracking for level goals
        this.litDiyasCount = 0;
        this.totalDiyasCount = 0;
        this.clearedMarigoldsCount = 0;
        this.totalMarigoldsCount = 0;
    }

    // Initialize board with level config
    initLevel(levelConfig) {
        this.activeLevel = levelConfig;
        this.cascadeCount = 0;
        this.litDiyasCount = 0;
        this.totalDiyasCount = 0;
        this.clearedMarigoldsCount = 0;
        this.totalMarigoldsCount = 0;

        // Build empty grid
        this.grid = [];
        for (let r = 0; r < this.rows; r++) {
            this.grid[r] = [];
            for (let c = 0; c < this.cols; c++) {
                this.grid[r][c] = {
                    gem: null,
                    diya: OBSTACLE_TYPES.NONE,
                    marigold: 0
                };
            }
        }

        // Place Diyas if defined
        if (levelConfig.diyas && Array.isArray(levelConfig.diyas)) {
            levelConfig.diyas.forEach(d => {
                if (d.r >= 0 && d.r < this.rows && d.c >= 0 && d.c < this.cols) {
                    this.grid[d.r][d.c].diya = OBSTACLE_TYPES.DIYA_UNLIT;
                    this.totalDiyasCount++;
                }
            });
        }

        // Place Marigolds if defined
        if (levelConfig.marigolds && Array.isArray(levelConfig.marigolds)) {
            levelConfig.marigolds.forEach(m => {
                if (m.r >= 0 && m.r < this.rows && m.c >= 0 && m.c < this.cols) {
                    this.grid[m.r][m.c].marigold = m.hp || 1;
                    this.totalMarigoldsCount += (m.hp || 1);
                }
            });
        }

        // Fill initial board without pre-existing matches
        this.fillInitialBoard();
    }

    createGem(type = null, special = SPECIAL_TYPES.NORMAL) {
        if (type === null) {
            type = Math.floor(Math.random() * GEM_TYPES.length);
        }
        return {
            id: this.nextGemId++,
            type: type,
            special: special,
            isMatched: false,
            animX: 0,
            animY: 0,
            scale: 1.0,
            alpha: 1.0,
            isHint: false
        };
    }

    fillInitialBoard() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                let type;
                let attempts = 0;
                do {
                    type = Math.floor(Math.random() * GEM_TYPES.length);
                    attempts++;
                } while (this.wouldCauseInitialMatch(r, c, type) && attempts < 50);

                this.grid[r][c].gem = this.createGem(type);
            }
        }

        // Ensure board has at least 3 valid moves to avoid frustrating starts
        if (!this.hasPossibleMoves()) {
            this.shuffleBoard(false);
        }
    }

    wouldCauseInitialMatch(r, c, type) {
        // Horizontal check
        if (c >= 2 &&
            this.grid[r][c - 1]?.gem?.type === type &&
            this.grid[r][c - 2]?.gem?.type === type) {
            return true;
        }
        // Vertical check
        if (r >= 2 &&
            this.grid[r - 1][c]?.gem?.type === type &&
            this.grid[r - 2][c]?.gem?.type === type) {
            return true;
        }
        return false;
    }

    get(r, c) {
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return null;
        return this.grid[r][c];
    }

    // Check if swap is valid (results in matches or special piece combination)
    canSwap(r1, c1, r2, c2) {
        const dist = Math.abs(r1 - r2) + Math.abs(c1 - c2);
        if (dist !== 1) return false;

        const cell1 = this.get(r1, c1);
        const cell2 = this.get(r2, c2);
        if (!cell1?.gem || !cell2?.gem) return false;

        const gem1 = cell1.gem;
        const gem2 = cell2.gem;

        // Special gem combination triggers (always valid!)
        if (gem1.special === SPECIAL_TYPES.MAYUR_RAINBOW || gem2.special === SPECIAL_TYPES.MAYUR_RAINBOW) {
            return true;
        }
        if (gem1.special !== SPECIAL_TYPES.NORMAL && gem2.special !== SPECIAL_TYPES.NORMAL) {
            return true;
        }

        // Temporarily swap
        cell1.gem = gem2;
        cell2.gem = gem1;

        const matches = this.findMatches();

        // Restore
        cell1.gem = gem1;
        cell2.gem = gem2;

        return matches.cells.length > 0;
    }

    // Perform swap
    swap(r1, c1, r2, c2) {
        const cell1 = this.get(r1, c1);
        const cell2 = this.get(r2, c2);
        if (!cell1 || !cell2) return false;

        const temp = cell1.gem;
        cell1.gem = cell2.gem;
        cell2.gem = temp;
        return true;
    }

    // Count remaining obstacles in row or col for smart targeting
    countObstaclesInRow(r) {
        if (r < 0 || r >= this.rows) return 0;
        let count = 0;
        for (let c = 0; c < this.cols; c++) {
            const cell = this.grid[r][c];
            if (cell.diya === OBSTACLE_TYPES.DIYA_UNLIT) count += 2;
            if (cell.marigold > 0) count += cell.marigold;
        }
        return count;
    }

    countObstaclesInCol(c) {
        if (c < 0 || c >= this.cols) return 0;
        let count = 0;
        for (let r = 0; r < this.rows; r++) {
            const cell = this.grid[r][c];
            if (cell.diya === OBSTACLE_TYPES.DIYA_UNLIT) count += 2;
            if (cell.marigold > 0) count += cell.marigold;
        }
        return count;
    }

    // Comprehensive Match Finding Algorithm (Horizontal, Vertical, T/L, Lines of 4 & 5)
    findMatches() {
        const matchedCells = new Set();
        const line4Horiz = [];
        const line4Vert = [];
        const line5Matches = [];
        const hRuns = [];
        const vRuns = [];

        // 1. Horizontal scans
        for (let r = 0; r < this.rows; r++) {
            let run = 1;
            for (let c = 0; c < this.cols; c++) {
                const currentType = this.grid[r][c]?.gem?.type;
                const nextType = (c < this.cols - 1) ? this.grid[r][c + 1]?.gem?.type : null;

                if (currentType !== null && currentType !== undefined && currentType === nextType) {
                    run++;
                } else {
                    if (run >= 3) {
                        const coords = [];
                        for (let k = 0; k < run; k++) {
                            const matchCol = c - k;
                            coords.push({ r, c: matchCol });
                            matchedCells.add(`${r},${matchCol}`);
                        }
                        hRuns.push(coords);
                        if (run >= 5) {
                            line5Matches.push(coords);
                        } else if (run === 4) {
                            line4Horiz.push(coords);
                        }
                    }
                    run = 1;
                }
            }
        }

        // 2. Vertical scans
        for (let c = 0; c < this.cols; c++) {
            let run = 1;
            for (let r = 0; r < this.rows; r++) {
                const currentType = this.grid[r][c]?.gem?.type;
                const nextType = (r < this.rows - 1) ? this.grid[r + 1][c]?.gem?.type : null;

                if (currentType !== null && currentType !== undefined && currentType === nextType) {
                    run++;
                } else {
                    if (run >= 3) {
                        const coords = [];
                        for (let k = 0; k < run; k++) {
                            const matchRow = r - k;
                            coords.push({ r: matchRow, c });
                            matchedCells.add(`${matchRow},${c}`);
                        }
                        vRuns.push(coords);
                        if (run >= 5) {
                            line5Matches.push(coords);
                        } else if (run === 4) {
                            line4Vert.push(coords);
                        }
                    }
                    run = 1;
                }
            }
        }

        // 3. T and L shape detection (Anar Bomb creation)
        const tOrLShapeMatches = [];
        hRuns.forEach(hRun => {
            vRuns.forEach(vRun => {
                // Check if any cell is in both runs and matches type
                hRun.forEach(hPt => {
                    if (vRun.some(vPt => vPt.r === hPt.r && vPt.c === hPt.c)) {
                        tOrLShapeMatches.push(hPt);
                    }
                });
            });
        });

        // Convert set to array of coordinates
        const result = [];
        matchedCells.forEach(key => {
            const [r, c] = key.split(',').map(Number);
            result.push({ r, c });
        });

        return {
            cells: result,
            line5: line5Matches,
            line4H: line4Horiz,
            line4V: line4Vert,
            tOrL: tOrLShapeMatches
        };
    }

    // Process a special combo when two specials are swapped directly
    handleSpecialCombo(r1, c1, r2, c2) {
        const gem1 = this.grid[r1][c1].gem;
        const gem2 = this.grid[r2][c2].gem;
        const cleared = new Set();
        const effects = [];

        // Case 1: Mayur Rainbow + Mayur Rainbow -> Purge the whole board!
        if (gem1.special === SPECIAL_TYPES.MAYUR_RAINBOW && gem2.special === SPECIAL_TYPES.MAYUR_RAINBOW) {
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    cleared.add(`${r},${c}`);
                }
            }
            effects.push({ type: 'MAHA_UTSAV', r: r2, c: c2 });
        }
        // Case 2: Mayur Rainbow + Chakra -> Convert all gems of that color to Chakras and trigger!
        else if (
            (gem1.special === SPECIAL_TYPES.MAYUR_RAINBOW && (gem2.special === SPECIAL_TYPES.CHAKRA_ROW || gem2.special === SPECIAL_TYPES.CHAKRA_COL)) ||
            (gem2.special === SPECIAL_TYPES.MAYUR_RAINBOW && (gem1.special === SPECIAL_TYPES.CHAKRA_ROW || gem1.special === SPECIAL_TYPES.CHAKRA_COL))
        ) {
            const targetColor = (gem1.special === SPECIAL_TYPES.MAYUR_RAINBOW) ? gem2.type : gem1.type;
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    if (this.grid[r][c].gem?.type === targetColor) {
                        this.grid[r][c].gem.special = (Math.random() > 0.5) ? SPECIAL_TYPES.CHAKRA_ROW : SPECIAL_TYPES.CHAKRA_COL;
                        this.triggerSpecialAt(r, c, cleared, effects);
                    }
                }
            }
            cleared.add(`${r1},${c1}`);
            cleared.add(`${r2},${c2}`);
            effects.push({ type: 'CHAKRA_RAINBOW', r: r2, c: c2 });
        }
        // Case 3: Mayur Rainbow + Anar Bomb -> Convert all gems of that color to Anar Bombs!
        else if (
            (gem1.special === SPECIAL_TYPES.MAYUR_RAINBOW && gem2.special === SPECIAL_TYPES.ANAR_BOMB) ||
            (gem2.special === SPECIAL_TYPES.MAYUR_RAINBOW && gem1.special === SPECIAL_TYPES.ANAR_BOMB)
        ) {
            const targetColor = (gem1.special === SPECIAL_TYPES.MAYUR_RAINBOW) ? gem2.type : gem1.type;
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    if (this.grid[r][c].gem?.type === targetColor) {
                        this.triggerAnarBlast(r, c, cleared);
                    }
                }
            }
            cleared.add(`${r1},${c1}`);
            cleared.add(`${r2},${c2}`);
            effects.push({ type: 'ANAR_RAINBOW', r: r2, c: c2 });
        }
        // Case 4: Mayur Rainbow + Normal Gem -> Sweep all gems of that normal color
        else if (gem1.special === SPECIAL_TYPES.MAYUR_RAINBOW || gem2.special === SPECIAL_TYPES.MAYUR_RAINBOW) {
            const targetColor = (gem1.special === SPECIAL_TYPES.MAYUR_RAINBOW) ? gem2.type : gem1.type;
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    if (this.grid[r][c].gem?.type === targetColor) {
                        cleared.add(`${r},${c}`);
                    }
                }
            }
            cleared.add(`${r1},${c1}`);
            cleared.add(`${r2},${c2}`);
            effects.push({ type: 'PEACOCK_SWEEP', r: r2, c: c2, color: targetColor });
        }
        // Case 5: Chakra + Chakra -> Full Cross (Row + Col)
        else if (
            (gem1.special === SPECIAL_TYPES.CHAKRA_ROW || gem1.special === SPECIAL_TYPES.CHAKRA_COL) &&
            (gem2.special === SPECIAL_TYPES.CHAKRA_ROW || gem2.special === SPECIAL_TYPES.CHAKRA_COL)
        ) {
            for (let c = 0; c < this.cols; c++) cleared.add(`${r2},${c}`);
            for (let r = 0; r < this.rows; r++) cleared.add(`${r},${c2}`);
            effects.push({ type: 'CROSS_CHAKRA', r: r2, c: c2 });
        }
        // Case 6: Chakra + Anar Bomb -> 3 Rows and 3 Columns Beam!
        else if (
            ((gem1.special === SPECIAL_TYPES.CHAKRA_ROW || gem1.special === SPECIAL_TYPES.CHAKRA_COL) && gem2.special === SPECIAL_TYPES.ANAR_BOMB) ||
            ((gem2.special === SPECIAL_TYPES.CHAKRA_ROW || gem2.special === SPECIAL_TYPES.CHAKRA_COL) && gem1.special === SPECIAL_TYPES.ANAR_BOMB)
        ) {
            for (let dr = -1; dr <= 1; dr++) {
                const tr = r2 + dr;
                if (tr >= 0 && tr < this.rows) {
                    for (let c = 0; c < this.cols; c++) cleared.add(`${tr},${c}`);
                }
            }
            for (let dc = -1; dc <= 1; dc++) {
                const tc = c2 + dc;
                if (tc >= 0 && tc < this.cols) {
                    for (let r = 0; r < this.rows; r++) cleared.add(`${r},${tc}`);
                }
            }
            effects.push({ type: 'SUPER_CHAKRA_BOMB', r: r2, c: c2 });
        }
        // Case 7: Anar + Anar -> Massive 5x5 blast
        else if (gem1.special === SPECIAL_TYPES.ANAR_BOMB && gem2.special === SPECIAL_TYPES.ANAR_BOMB) {
            for (let dr = -2; dr <= 2; dr++) {
                for (let dc = -2; dc <= 2; dc++) {
                    const tr = r2 + dr;
                    const tc = c2 + dc;
                    if (tr >= 0 && tr < this.rows && tc >= 0 && tc < this.cols) {
                        cleared.add(`${tr},${tc}`);
                    }
                }
            }
            effects.push({ type: 'MEGA_ANAR', r: r2, c: c2 });
        }

        const clearedCoords = Array.from(cleared).map(s => {
            const [r, c] = s.split(',').map(Number);
            return { r, c };
        });

        return { clearedCoords, effects };
    }

    // Trigger individual special gem power when matched (with chaining)
    triggerSpecialAt(r, c, clearedSet, effectsList, visitedSpecial = new Set()) {
        const gem = this.grid[r]?.[c]?.gem;
        if (!gem || gem.special === SPECIAL_TYPES.NORMAL) return;

        const key = `${r},${c}`;
        if (visitedSpecial.has(key)) return;
        visitedSpecial.add(key);

        clearedSet.add(key);

        if (gem.special === SPECIAL_TYPES.CHAKRA_ROW) {
            for (let col = 0; col < this.cols; col++) {
                clearedSet.add(`${r},${col}`);
                const nextGem = this.grid[r][col]?.gem;
                if (nextGem && nextGem.special !== SPECIAL_TYPES.NORMAL && !visitedSpecial.has(`${r},${col}`)) {
                    this.triggerSpecialAt(r, col, clearedSet, effectsList, visitedSpecial);
                }
            }
            effectsList.push({ type: 'CHAKRA_ROW', r, c });
        } else if (gem.special === SPECIAL_TYPES.CHAKRA_COL) {
            for (let row = 0; row < this.rows; row++) {
                clearedSet.add(`${row},${c}`);
                const nextGem = this.grid[row][c]?.gem;
                if (nextGem && nextGem.special !== SPECIAL_TYPES.NORMAL && !visitedSpecial.has(`${row},${c}`)) {
                    this.triggerSpecialAt(row, c, clearedSet, effectsList, visitedSpecial);
                }
            }
            effectsList.push({ type: 'CHAKRA_COL', r, c });
        } else if (gem.special === SPECIAL_TYPES.ANAR_BOMB) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const tr = r + dr;
                    const tc = c + dc;
                    if (tr >= 0 && tr < this.rows && tc >= 0 && tc < this.cols) {
                        clearedSet.add(`${tr},${tc}`);
                        const nextGem = this.grid[tr][tc]?.gem;
                        if (nextGem && nextGem.special !== SPECIAL_TYPES.NORMAL && !visitedSpecial.has(`${tr},${tc}`)) {
                            this.triggerSpecialAt(tr, tc, clearedSet, effectsList, visitedSpecial);
                        }
                    }
                }
            }
            effectsList.push({ type: 'ANAR_BOMB', r, c });
        } else if (gem.special === SPECIAL_TYPES.MAYUR_RAINBOW) {
            const bestColor = this.findBestColorForPeacockSweep();
            for (let row = 0; row < this.rows; row++) {
                for (let col = 0; col < this.cols; col++) {
                    if (this.grid[row][col]?.gem?.type === bestColor) {
                        clearedSet.add(`${row},${col}`);
                    }
                }
            }
            effectsList.push({ type: 'PEACOCK_SWEEP', r, c, color: bestColor });
        }
    }

    // Evaluate which gem color has the most adjacent obstacles (Diyas & Marigolds)
    findBestColorForPeacockSweep() {
        const colorScores = [0, 0, 0, 0, 0, 0];
        const colorCounts = [0, 0, 0, 0, 0, 0];

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.grid[r][c];
                if (!cell?.gem) continue;
                const type = cell.gem.type;
                if (type >= 0 && type < 6) {
                    colorCounts[type]++;
                    // Bonus if cell itself is unlit Diya
                    if (cell.diya === OBSTACLE_TYPES.DIYA_UNLIT) colorScores[type] += 6;
                    // Bonus if cell has Marigold
                    if (cell.marigold > 0) colorScores[type] += 5;

                    // Bonus for adjacent obstacles
                    const adj = [
                        { r: r - 1, c }, { r: r + 1, c },
                        { r, c: c - 1 }, { r, c: c + 1 }
                    ];
                    for (const a of adj) {
                        const nCell = this.get(a.r, a.c);
                        if (nCell) {
                            if (nCell.diya === OBSTACLE_TYPES.DIYA_UNLIT) colorScores[type] += 3;
                            if (nCell.marigold > 0) colorScores[type] += 3;
                        }
                    }
                }
            }
        }

        let bestColor = 0;
        let maxScore = -1;
        for (let i = 0; i < 6; i++) {
            const total = colorScores[i] + colorCounts[i];
            if (total > maxScore) {
                maxScore = total;
                bestColor = i;
            }
        }
        return bestColor;
    }

    // Direct Tap-to-Activate Special in place (Royal Match fluid mechanic)
    detonateSpecialInPlace(r, c) {
        const cell = this.get(r, c);
        if (!cell || !cell.gem || cell.gem.special === SPECIAL_TYPES.NORMAL) return null;

        const gem = cell.gem;
        const cleared = new Set();
        const effects = [];
        const visited = new Set();

        this.triggerSpecialAt(r, c, cleared, effects, visited);

        const clearedCoords = Array.from(cleared).map(s => {
            const [row, col] = s.split(',').map(Number);
            return { r: row, c: col };
        });

        return { clearedCoords, effects, specialType: gem.special };
    }

    triggerAnarBlast(centerR, centerC, clearedSet) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const tr = centerR + dr;
                const tc = centerC + dc;
                if (tr >= 0 && tr < this.rows && tc >= 0 && tc < this.cols) {
                    clearedSet.add(`${tr},${tc}`);
                }
            }
        }
    }

    // Process obstacle damage on adjacent matches
    damageAdjacentObstacles(matchedCoords) {
        const affectedDiyas = [];
        const affectedMarigolds = [];
        const checkedObstacles = new Set();

        matchedCoords.forEach(({ r, c }) => {
            // Check self cell first
            this.checkAndDamageCell(r, c, affectedDiyas, affectedMarigolds, checkedObstacles);

            // Check 4 adjacent orthogonal cells
            const adj = [
                { r: r - 1, c },
                { r: r + 1, c },
                { r, c: c - 1 },
                { r, c: c + 1 }
            ];

            adj.forEach(a => {
                if (a.r >= 0 && a.r < this.rows && a.c >= 0 && a.c < this.cols) {
                    this.checkAndDamageCell(a.r, a.c, affectedDiyas, affectedMarigolds, checkedObstacles);
                }
            });
        });

        return { affectedDiyas, affectedMarigolds };
    }

    checkAndDamageCell(r, c, diyas, marigolds, visited) {
        const key = `${r},${c}`;
        if (visited.has(key)) return;
        visited.add(key);

        const cell = this.grid[r][c];
        if (!cell) return;

        // Light unlit Diya
        if (cell.diya === OBSTACLE_TYPES.DIYA_UNLIT) {
            cell.diya = OBSTACLE_TYPES.DIYA_LIT;
            this.litDiyasCount++;
            diyas.push({ r, c });
        }

        // Damage / harvest Marigold
        if (cell.marigold > 0) {
            cell.marigold--;
            this.clearedMarigoldsCount++;
            marigolds.push({ r, c, remaining: cell.marigold });
        }
    }

    // Apply gravity to drop existing pieces downward and refill empty top spots
    applyGravity() {
        const movements = []; // List of { fromR, fromC, toR, toC, gem }
        const newGems = [];   // List of { r, c, gem }

        for (let c = 0; c < this.cols; c++) {
            let writeRow = this.rows - 1;

            // Shift existing gems down
            for (let r = this.rows - 1; r >= 0; r--) {
                if (this.grid[r][c].gem !== null) {
                    if (writeRow !== r) {
                        this.grid[writeRow][c].gem = this.grid[r][c].gem;
                        this.grid[r][c].gem = null;
                        movements.push({
                            fromR: r,
                            fromC: c,
                            toR: writeRow,
                            toC: c,
                            gem: this.grid[writeRow][c].gem
                        });
                    }
                    writeRow--;
                }
            }

            // Fill remaining top slots with fresh gems
            for (let r = writeRow; r >= 0; r--) {
                const freshGem = this.createGem();
                // Spawn with vertical offset animation
                freshGem.animY = -(writeRow - r + 1);
                this.grid[r][c].gem = freshGem;
                newGems.push({ r, c, gem: freshGem });
            }
        }

        return { movements, newGems };
    }

    // Check if board has any available moves
    hasPossibleMoves() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                // Check swap right
                if (c < this.cols - 1 && this.canSwap(r, c, r, c + 1)) return true;
                // Check swap down
                if (r < this.rows - 1 && this.canSwap(r, c, r + 1, c)) return true;
            }
        }
        return false;
    }

    // Find a valid move for the gentle hint system
    findHintMove() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (c < this.cols - 1 && this.canSwap(r, c, r, c + 1)) {
                    return [{ r, c }, { r, c: c + 1 }];
                }
                if (r < this.rows - 1 && this.canSwap(r, c, r + 1, c)) {
                    return [{ r, c }, { r: r + 1, c }];
                }
            }
        }
        return null;
    }

    // Shuffle board when no moves exist
    shuffleBoard(animate = true) {
        const allGems = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c].gem) {
                    allGems.push(this.grid[r][c].gem);
                }
            }
        }

        // Fisher-Yates shuffle
        let attempts = 0;
        let valid = false;
        while (!valid && attempts < 100) {
            attempts++;
            for (let i = allGems.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const t = allGems[i];
                allGems[i] = allGems[j];
                allGems[j] = t;
            }

            let idx = 0;
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    this.grid[r][c].gem = allGems[idx++];
                }
            }

            const initialMatches = this.findMatches();
            if (initialMatches.cells.length === 0 && this.hasPossibleMoves()) {
                valid = true;
            }
        }

        return valid;
    }
}

const exportScope = typeof window !== 'undefined' ? window : globalThis;
exportScope.Match3Grid = Match3Grid;
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Match3Grid };
}
})();
