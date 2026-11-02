/**
 * Master Game Controller, State Machine & Input Engine for Rangoli Utsav
 * Coordinates the Match-3 engine, Canvas renderer, Web Audio synthesizer,
 * Haveli Courtyard metagame, and monetization systems.
 */

class GameController {
    constructor() {
        this.grid = new Match3Grid(8, 8);
        this.renderer = null;
        this.courtyard = null;
        
        // Game State
        this.state = 'MENU'; // 'MENU' | 'PLAYING' | 'RESOLVING' | 'PAUSED' | 'WIN' | 'FAIL' | 'COURTYARD'
        this.currentLevelId = 1;
        this.score = 0;
        this.movesLeft = 0;
        this.targetScore = 0;
        this.selectedCell = null;
        this.dragStartPos = null;
        this.activeBooster = null; // 'hammer' | 'anar' | 'swap'
        this.swapFirstCell = null;
        this.lastMoveTime = Date.now();
        this.hintMove = null;
        this.hintTimer = null;
        this.animFrameId = null;

        // Sound & Language
        this.currentLang = 'en';
    }

    init() {
        const gameCanvas = document.getElementById('game-canvas');
        if (gameCanvas) {
            this.renderer = new GameRenderer(gameCanvas);
        }

        this.courtyard = new CourtyardManager('courtyard-canvas');
        this.courtyard.init();

        this.currentLang = window.StorageManager.data.language || 'en';

        this.bindEvents();
        this.updateHeaderUI();
        this.applyLanguage(this.currentLang);
        this.showScreen('menu-screen');

        // Start render loop
        this.startLoop();

        // Start idle hint timer
        this.startHintChecker();
    }

    startLoop() {
        const loop = () => {
            if (this.state === 'PLAYING' || this.state === 'RESOLVING') {
                if (this.renderer) {
                    this.renderer.render(this.grid, this.selectedCell, this.hintMove);
                }
            } else if (this.state === 'COURTYARD') {
                if (this.courtyard) {
                    this.courtyard.render();
                }
            }
            this.animFrameId = requestAnimationFrame(loop);
        };
        this.animFrameId = requestAnimationFrame(loop);
    }

    startHintChecker() {
        if (this.hintTimer) clearInterval(this.hintTimer);
        this.hintTimer = setInterval(() => {
            if (this.state === 'PLAYING' && !this.selectedCell && !this.activeBooster) {
                const idleTime = Date.now() - this.lastMoveTime;
                if (idleTime > 4500 && !this.hintMove) {
                    this.hintMove = this.grid.findHintMove();
                }
            }
        }, 1000);
    }

    resetHint() {
        this.lastMoveTime = Date.now();
        this.hintMove = null;
    }

    // Input Handling (Touch & Mouse Support for Android and Desktop)
    bindEvents() {
        const canvas = document.getElementById('game-canvas');
        if (!canvas) return;

        const getGridCoords = (clientX, clientY) => {
            const rect = canvas.getBoundingClientRect();
            const x = clientX - rect.left - this.renderer.boardX;
            const y = clientY - rect.top - this.renderer.boardY;

            if (x < 0 || x >= this.renderer.boardSize || y < 0 || y >= this.renderer.boardSize) {
                return null;
            }

            const c = Math.floor(x / this.renderer.cellSize);
            const r = Math.floor(y / this.renderer.cellSize);
            return (r >= 0 && r < 8 && c >= 0 && c < 8) ? { r, c } : null;
        };

        // Pointer Down
        const onDown = (clientX, clientY) => {
            if (this.state !== 'PLAYING') return;
            const coords = getGridCoords(clientX, clientY);
            if (!coords) return;

            this.dragStartPos = { x: clientX, y: clientY, r: coords.r, c: coords.c };

            // Handle Active Booster Usage
            if (this.activeBooster) {
                this.handleBoosterClick(coords.r, coords.c);
                return;
            }

            // Tap-to-select / Tap-to-swap logic
            if (!this.selectedCell) {
                this.selectedCell = coords;
                this.resetHint();
                window.AudioEngine.playSitarPluck(coords.r);
            } else {
                const dist = Math.abs(this.selectedCell.r - coords.r) + Math.abs(this.selectedCell.c - coords.c);
                if (dist === 1) {
                    this.attemptSwap(this.selectedCell.r, this.selectedCell.c, coords.r, coords.c);
                    this.selectedCell = null;
                } else {
                    this.selectedCell = coords;
                    window.AudioEngine.playSitarPluck(coords.r);
                }
                this.resetHint();
            }
        };

        // Pointer Move (Swipe Detection)
        const onMove = (clientX, clientY) => {
            if (this.state !== 'PLAYING' || !this.dragStartPos || this.activeBooster) return;

            const dx = clientX - this.dragStartPos.x;
            const dy = clientY - this.dragStartPos.y;
            const threshold = this.renderer.cellSize * 0.45;

            if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
                let targetR = this.dragStartPos.r;
                let targetC = this.dragStartPos.c;

                if (Math.abs(dx) > Math.abs(dy)) {
                    targetC += (dx > 0) ? 1 : -1;
                } else {
                    targetR += (dy > 0) ? 1 : -1;
                }

                if (targetR >= 0 && targetR < 8 && targetC >= 0 && targetC < 8) {
                    this.selectedCell = null;
                    this.attemptSwap(this.dragStartPos.r, this.dragStartPos.c, targetR, targetC);
                }

                this.dragStartPos = null;
                this.resetHint();
            }
        };

        const onUp = () => {
            this.dragStartPos = null;
        };

        // Mouse listeners
        canvas.addEventListener('mousedown', e => onDown(e.clientX, e.clientY));
        window.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
        window.addEventListener('mouseup', onUp);

        // Touch listeners (Android Mobile optimized)
        canvas.addEventListener('touchstart', e => {
            if (e.touches.length > 0) {
                onDown(e.touches[0].clientX, e.touches[0].clientY);
            }
            e.preventDefault();
        }, { passive: false });

        window.addEventListener('touchmove', e => {
            if (e.touches.length > 0) {
                onMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        window.addEventListener('touchend', onUp);

        // UI Button bindings
        this.bindUIButtons();
    }

    bindUIButtons() {
        // Sound and Music toggles
        document.getElementById('sound-toggle-btn')?.addEventListener('click', () => {
            const on = window.AudioEngine.toggleSound();
            const btn = document.getElementById('sound-toggle-btn');
            if (btn) btn.textContent = on ? '🔊' : '🔇';
        });

        document.getElementById('music-toggle-btn')?.addEventListener('click', () => {
            const on = window.AudioEngine.toggleMusic();
            const btn = document.getElementById('music-toggle-btn');
            if (btn) btn.textContent = on ? '🎵' : '🎶';
        });

        // Language toggle (English / Hindi)
        document.getElementById('lang-toggle-btn')?.addEventListener('click', () => {
            this.currentLang = (this.currentLang === 'en') ? 'hi' : 'en';
            window.StorageManager.data.language = this.currentLang;
            window.StorageManager.save();
            this.applyLanguage(this.currentLang);
        });

        // Courtyard screen button
        document.getElementById('courtyard-btn')?.addEventListener('click', () => {
            this.showScreen('courtyard-screen');
            this.renderCourtyardUpgradeList();
        });

        // Daily Shagun Wheel button
        document.getElementById('wheel-btn')?.addEventListener('click', () => {
            this.showWheelModal();
        });

        // In-Game Boosters buttons
        document.getElementById('booster-hammer-btn')?.addEventListener('click', () => {
            this.toggleBooster('hammer');
        });
        document.getElementById('booster-anar-btn')?.addEventListener('click', () => {
            this.toggleBooster('anar');
        });
        document.getElementById('booster-swap-btn')?.addEventListener('click', () => {
            this.toggleBooster('swap');
        });

        // Pause / Resume buttons
        document.getElementById('pause-btn')?.addEventListener('click', () => {
            this.pauseGame();
        });
        document.getElementById('resume-btn')?.addEventListener('click', () => {
            this.resumeGame();
        });
        document.getElementById('quit-btn')?.addEventListener('click', () => {
            this.showScreen('menu-screen');
        });

        // Win / Fail Modal buttons
        document.getElementById('win-next-btn')?.addEventListener('click', () => {
            this.startLevel(this.currentLevelId + 1);
        });
        document.getElementById('win-menu-btn')?.addEventListener('click', () => {
            this.showScreen('menu-screen');
        });
        document.getElementById('fail-retry-btn')?.addEventListener('click', () => {
            this.startLevel(this.currentLevelId);
        });
        document.getElementById('fail-ad-btn')?.addEventListener('click', () => {
            this.watchAdForMoves();
        });
        document.getElementById('fail-coins-btn')?.addEventListener('click', () => {
            this.useCoinsForMoves();
        });

        // Ad Modal buttons
        document.getElementById('ad-claim-btn')?.addEventListener('click', () => {
            window.AdSystem.claimAdReward();
        });
        document.getElementById('ad-close-btn')?.addEventListener('click', () => {
            window.AdSystem.closeAdEarly();
        });
    }

    applyLanguage(lang) {
        const t = window.I18N[lang] || window.I18N.en;
        document.querySelectorAll('[data-i18n]').forEach(elem => {
            const key = elem.getAttribute('data-i18n');
            if (t[key]) elem.textContent = t[key];
        });

        const langBtn = document.getElementById('lang-toggle-btn');
        if (langBtn) langBtn.textContent = (lang === 'en') ? 'हिन्दी' : 'English';
    }

    showScreen(screenId) {
        ['menu-screen', 'game-screen', 'courtyard-screen'].forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                if (id === screenId) elem.classList.remove('hidden');
                else elem.classList.add('hidden');
            }
        });

        if (screenId === 'menu-screen') {
            this.state = 'MENU';
            this.renderLevelSelectGrid();
            this.updateHeaderUI();
        } else if (screenId === 'courtyard-screen') {
            this.state = 'COURTYARD';
            this.renderCourtyardUpgradeList();
            this.updateHeaderUI();
        } else if (screenId === 'game-screen') {
            this.state = 'PLAYING';
            this.updateInGameUI();
        }
    }

    updateHeaderUI() {
        const sm = window.StorageManager;
        sm.updateLivesRegeneration();

        const livesEl = document.getElementById('header-lives');
        const coinsEl = document.getElementById('header-coins');
        const starsEl = document.getElementById('header-stars');

        if (livesEl) livesEl.textContent = sm.data.lives;
        if (coinsEl) coinsEl.textContent = sm.data.coins;
        if (starsEl) starsEl.textContent = sm.data.stars;
    }

    renderLevelSelectGrid() {
        const container = document.getElementById('level-select-container');
        if (!container) return;
        container.innerHTML = '';

        const sm = window.StorageManager;
        const unlocked = sm.data.unlockedLevel || 1;

        LEVEL_CONFIGS.forEach(lvl => {
            const card = document.createElement('button');
            const isUnlocked = lvl.id <= unlocked;
            const stars = sm.data.levelStars[lvl.id] || 0;

            card.className = `level-card ${isUnlocked ? 'unlocked' : 'locked'}`;
            
            const starIcons = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
            const title = (this.currentLang === 'hi') ? lvl.titleHi : lvl.title;

            card.innerHTML = `
                <div class="level-num">${lvl.id}</div>
                <div class="level-title">${title}</div>
                <div class="level-stars">${isUnlocked ? starIcons : '🔒'}</div>
            `;

            if (isUnlocked) {
                card.onclick = () => this.startLevel(lvl.id);
            }

            container.appendChild(card);
        });
    }

    startLevel(levelId) {
        const config = LEVEL_CONFIGS.find(l => l.id === levelId) || LEVEL_CONFIGS[0];
        const sm = window.StorageManager;

        // Check lives
        if (sm.data.lives <= 0) {
            alert((this.currentLang === 'hi') ? "प्राण समाप्त! कृपया प्रतीक्षा करें या दैनिक शगुन चक्र घुमाएं।" : "No lives left! Please wait for refill or spin the Shagun Wheel.");
            return;
        }

        this.currentLevelId = config.id;
        this.score = 0;
        this.movesLeft = config.moves;
        this.targetScore = config.targetScore;
        this.selectedCell = null;
        this.activeBooster = null;
        this.grid.initLevel(config);

        // Deduct 1 life
        sm.deductLife();
        this.updateHeaderUI();

        // Log analytics
        window.AnalyticsEngine.onLevelStart(config.id);

        // Hide modals
        document.getElementById('win-modal')?.classList.add('hidden');
        document.getElementById('fail-modal')?.classList.add('hidden');
        document.getElementById('pause-modal')?.classList.add('hidden');

        this.showScreen('game-screen');
        this.state = 'PLAYING';
        this.resetHint();
        this.updateInGameUI();

        window.AudioEngine.playSwipe();
    }

    updateInGameUI() {
        const scoreEl = document.getElementById('ingame-score');
        const movesEl = document.getElementById('ingame-moves');
        const targetEl = document.getElementById('ingame-target');
        const progressEl = document.getElementById('ingame-progress-fill');
        const levelNumEl = document.getElementById('ingame-level-num');

        if (scoreEl) scoreEl.textContent = this.score;
        if (movesEl) movesEl.textContent = this.movesLeft;
        if (targetEl) targetEl.textContent = this.targetScore;
        if (levelNumEl) levelNumEl.textContent = this.currentLevelId;

        // Goal display (Diyas, Marigolds, Score)
        const config = this.grid.activeLevel;
        const goalBadge = document.getElementById('ingame-goal-badge');
        if (goalBadge && config) {
            if (config.objectiveType === 'diyas') {
                goalBadge.innerHTML = `🪔 ${this.grid.litDiyasCount} / ${config.targetDiyas}`;
            } else if (config.objectiveType === 'marigolds') {
                goalBadge.innerHTML = `🌼 ${this.grid.clearedMarigoldsCount} / ${config.targetMarigolds}`;
            } else if (config.objectiveType === 'hybrid') {
                goalBadge.innerHTML = `🪔 ${this.grid.litDiyasCount}/${config.targetDiyas}  🌼 ${this.grid.clearedMarigoldsCount}/${config.targetMarigolds}`;
            } else {
                goalBadge.innerHTML = `🎯 ${this.score} / ${config.targetScore}`;
            }
        }

        // Score progress bar
        if (progressEl) {
            const pct = Math.min(100, (this.score / this.targetScore) * 100);
            progressEl.style.width = `${pct}%`;
        }

        // Update booster counts
        const sm = window.StorageManager;
        const hCount = document.getElementById('booster-hammer-count');
        const aCount = document.getElementById('booster-anar-count');
        const sCount = document.getElementById('booster-swap-count');
        if (hCount) hCount.textContent = sm.data.boosters.hammer;
        if (aCount) aCount.textContent = sm.data.boosters.anar;
        if (sCount) sCount.textContent = sm.data.boosters.swap;
    }

    attemptSwap(r1, c1, r2, c2) {
        if (!this.grid.canSwap(r1, c1, r2, c2)) {
            // Invalid swap: bounce back animation
            window.AudioEngine.playSwipe();
            return;
        }

        this.state = 'RESOLVING';
        this.movesLeft--;
        this.updateInGameUI();

        const cell1 = this.grid.get(r1, c1);
        const cell2 = this.grid.get(r2, c2);

        // Check if swapping two specials or Mayur Rainbow
        if (
            cell1.gem.special === SPECIAL_TYPES.MAYUR_RAINBOW || cell2.gem.special === SPECIAL_TYPES.MAYUR_RAINBOW ||
            (cell1.gem.special !== SPECIAL_TYPES.NORMAL && cell2.gem.special !== SPECIAL_TYPES.NORMAL)
        ) {
            const comboResult = this.grid.handleSpecialCombo(r1, c1, r2, c2);
            this.resolveSpecialCombo(comboResult);
            return;
        }

        // Standard Swap
        this.grid.swap(r1, c1, r2, c2);
        window.AudioEngine.playSitarPluck(r2);

        // Trigger cascade resolution
        this.grid.cascadeCount = 0;
        setTimeout(() => this.resolveCascade(), 180);
    }

    resolveSpecialCombo(comboResult) {
        window.AudioEngine.playPeacockRainbow();
        if (this.renderer) this.renderer.addScreenShake(12);

        // Clear matched pieces
        comboResult.clearedCoords.forEach(({ r, c }) => {
            const cell = this.grid.get(r, c);
            if (cell?.gem) {
                const def = GEM_TYPES[cell.gem.type];
                const cx = this.renderer.boardX + (c * this.renderer.cellSize) + (this.renderer.cellSize / 2);
                const cy = this.renderer.boardY + (r * this.renderer.cellSize) + (this.renderer.cellSize / 2);
                this.renderer.spawnGulalExplosion(cx, cy, def.color, 14);
                cell.gem = null;
            }
        });

        // Add combo score
        const points = comboResult.clearedCoords.length * 150;
        this.score += points;
        this.updateInGameUI();

        // Damage adjacent obstacles
        this.processObstacleClears(comboResult.clearedCoords);

        // Apply gravity and continue cascades
        setTimeout(() => {
            this.grid.applyGravity();
            this.resolveCascade();
        }, 300);
    }

    resolveCascade() {
        const matches = this.grid.findMatches();

        if (matches.cells.length === 0) {
            // Board has stabilized! Check win/loss
            this.checkLevelOutcome();
            return;
        }

        this.grid.cascadeCount++;
        const cascadeMultiplier = this.grid.cascadeCount;

        // Sound feedback climbing Raga Bhupali pentatonic scale!
        window.AudioEngine.playCascade(cascadeMultiplier);

        // Floating accolades for deep cascades
        if (cascadeMultiplier >= 3 && this.renderer) {
            const t = window.I18N[this.currentLang] || window.I18N.en;
            let praise = t.comboGreat;
            if (cascadeMultiplier === 4) praise = t.comboSuper;
            if (cascadeMultiplier >= 5) praise = t.comboAmazing;

            this.renderer.spawnFloatingText(
                this.renderer.width / 2,
                this.renderer.boardY + (this.renderer.boardSize / 2),
                praise,
                '#FFD700',
                26
            );
            this.renderer.addScreenShake(Math.min(cascadeMultiplier * 3, 15));
            window.AnalyticsEngine.onCascadeStreak(this.currentLevelId, cascadeMultiplier);
        }

        // Identify special gem creations
        const createdSpecials = new Map();

        // 5 in line -> Mayur Rainbow
        matches.line5.forEach(line => {
            const center = line[2] || line[0];
            createdSpecials.set(`${center.r},${center.c}`, SPECIAL_TYPES.MAYUR_RAINBOW);
        });

        // 4 in horizontal line -> Chakra Row
        matches.line4H.forEach(line => {
            const center = line[1];
            if (!createdSpecials.has(`${center.r},${center.c}`)) {
                createdSpecials.set(`${center.r},${center.c}`, SPECIAL_TYPES.CHAKRA_ROW);
            }
        });

        // 4 in vertical line -> Chakra Col
        matches.line4V.forEach(line => {
            const center = line[1];
            if (!createdSpecials.has(`${center.r},${center.c}`)) {
                createdSpecials.set(`${center.r},${center.c}`, SPECIAL_TYPES.CHAKRA_COL);
            }
        });

        // Process clears and particles
        let points = 0;
        matches.cells.forEach(({ r, c }) => {
            const cell = this.grid.get(r, c);
            if (!cell?.gem) return;

            const def = GEM_TYPES[cell.gem.type];
            const cx = this.renderer.boardX + (c * this.renderer.cellSize) + (this.renderer.cellSize / 2);
            const cy = this.renderer.boardY + (r * this.renderer.cellSize) + (this.renderer.cellSize / 2);

            this.renderer.spawnGulalExplosion(cx, cy, def.color, 12);
            points += 50 * cascadeMultiplier;

            // Trigger existing special gem detonations if any
            if (cell.gem.special !== SPECIAL_TYPES.NORMAL) {
                const clearedSet = new Set();
                const effectsList = [];
                this.grid.triggerSpecialAt(r, c, clearedSet, effectsList);

                if (cell.gem.special === SPECIAL_TYPES.ANAR_BOMB) {
                    window.AudioEngine.playAnarExplosion();
                    this.renderer.spawnGoldenEmbers(cx, cy, 20);
                } else {
                    window.AudioEngine.playChakraBeam();
                }
            }

            // Create new special or clear cell
            const key = `${r},${c}`;
            if (createdSpecials.has(key)) {
                cell.gem.special = createdSpecials.get(key);
                window.AnalyticsEngine.onSpecialCreated(cell.gem.special, this.currentLevelId);
            } else {
                cell.gem = null;
            }
        });

        this.score += points;
        this.updateInGameUI();

        // Damage adjacent obstacles (Diyas & Marigolds)
        this.processObstacleClears(matches.cells);

        // Apply gravity drop and refill
        setTimeout(() => {
            this.grid.applyGravity();
            // Continue cascade chain
            setTimeout(() => this.resolveCascade(), 220);
        }, 220);
    }

    processObstacleClears(matchedCoords) {
        const { affectedDiyas, affectedMarigolds } = this.grid.damageAdjacentObstacles(matchedCoords);

        // Diyas lit
        affectedDiyas.forEach(({ r, c }) => {
            window.AudioEngine.playDiyaLit();
            const cx = this.renderer.boardX + (c * this.renderer.cellSize) + (this.renderer.cellSize / 2);
            const cy = this.renderer.boardY + (r * this.renderer.cellSize) + (this.renderer.cellSize / 2);
            this.renderer.spawnGoldenEmbers(cx, cy, 14);
            this.score += 250;
        });

        // Marigolds harvested
        affectedMarigolds.forEach(({ r, c, remaining }) => {
            const cx = this.renderer.boardX + (c * this.renderer.cellSize) + (this.renderer.cellSize / 2);
            const cy = this.renderer.boardY + (r * this.renderer.cellSize) + (this.renderer.cellSize / 2);
            this.renderer.spawnMarigoldPetals(cx, cy, 14);
            this.score += 200;
        });

        this.updateInGameUI();
    }

    checkLevelOutcome() {
        const config = this.grid.activeLevel;
        let isWin = false;

        if (config.objectiveType === 'score') {
            isWin = (this.score >= this.targetScore);
        } else if (config.objectiveType === 'diyas') {
            isWin = (this.grid.litDiyasCount >= config.targetDiyas);
        } else if (config.objectiveType === 'marigolds') {
            isWin = (this.grid.clearedMarigoldsCount >= config.targetMarigolds);
        } else if (config.objectiveType === 'hybrid') {
            isWin = (this.grid.litDiyasCount >= config.targetDiyas && this.grid.clearedMarigoldsCount >= config.targetMarigolds);
        }

        if (isWin) {
            this.triggerLevelVictory();
            return;
        }

        // Check if out of moves
        if (this.movesLeft <= 0) {
            this.triggerLevelDefeat();
            return;
        }

        // If neither win nor out of moves, return to PLAYING state
        this.state = 'PLAYING';
        this.resetHint();

        // Check if any valid moves exist, reshuffle if needed
        if (!this.grid.hasPossibleMoves()) {
            this.grid.shuffleBoard(true);
            const t = window.I18N[this.currentLang] || window.I18N.en;
            this.renderer.spawnFloatingText(
                this.renderer.width / 2,
                this.renderer.boardY + (this.renderer.boardSize / 2),
                (this.currentLang === 'hi') ? "नए रंग! बोर्ड पुनः सजाया गया" : "New Colors! Board Reshuffled",
                '#FFD700',
                22
            );
        }
    }

    triggerLevelVictory() {
        this.state = 'WIN';
        window.AudioEngine.playLevelVictory();

        // Calculate 1 to 3 stars based on score & remaining moves
        let stars = 1;
        if (this.score >= this.targetScore * 1.2 || this.movesLeft >= 5) stars = 2;
        if (this.score >= this.targetScore * 1.5 && this.movesLeft >= 3) stars = 3;

        // Save progress
        window.StorageManager.recordLevelWin(this.currentLevelId, stars, this.score);
        window.AnalyticsEngine.onLevelComplete(this.currentLevelId, stars, this.score, this.movesLeft);

        // Populate Victory Modal
        const winModal = document.getElementById('win-modal');
        const winStars = document.getElementById('win-stars');
        const winScore = document.getElementById('win-score');
        const winCoins = document.getElementById('win-coins-earned');

        if (winStars) winStars.textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
        if (winScore) winScore.textContent = this.score;
        if (winCoins) winCoins.textContent = `+${stars * 20} Shagun Coins`;

        if (winModal) {
            winModal.classList.remove('hidden');
            winModal.classList.add('flex');
        }

        this.updateHeaderUI();
    }

    triggerLevelDefeat() {
        this.state = 'FAIL';
        const failData = window.AnalyticsEngine.onLevelFail(this.currentLevelId, {
            score: this.score,
            target: this.targetScore,
            diyas: this.grid.litDiyasCount,
            marigolds: this.grid.clearedMarigoldsCount
        }, this.score);

        const failModal = document.getElementById('fail-modal');
        const failSub = document.getElementById('fail-subtitle');

        if (failSub) {
            const t = window.I18N[this.currentLang] || window.I18N.en;
            failSub.textContent = t.levelFailedSub;
        }

        if (failModal) {
            failModal.classList.remove('hidden');
            failModal.classList.add('flex');
        }
    }

    watchAdForMoves() {
        window.AdSystem.showRewardedAd('out_of_moves', () => {
            // Grant +3 moves and resume
            this.movesLeft += 3;
            document.getElementById('fail-modal')?.classList.add('hidden');
            this.state = 'PLAYING';
            this.updateInGameUI();
            this.resetHint();
            window.AudioEngine.playLevelVictory();
        });
    }

    useCoinsForMoves() {
        const sm = window.StorageManager;
        if (sm.deductCoins(50)) {
            this.movesLeft += 3;
            document.getElementById('fail-modal')?.classList.add('hidden');
            this.state = 'PLAYING';
            this.updateInGameUI();
            this.updateHeaderUI();
            this.resetHint();
            window.AudioEngine.playLevelVictory();
        } else {
            alert((this.currentLang === 'hi') ? "सिक्के पर्याप्त नहीं हैं! आप छोटा संदेश देखकर ३ चालें ले सकते हैं।" : "Not enough coins! You can watch a short artisan message for +3 moves.");
        }
    }

    // Boosters System
    toggleBooster(type) {
        if (this.state !== 'PLAYING') return;
        const sm = window.StorageManager;

        if (!sm.hasBooster(type)) {
            alert((this.currentLang === 'hi') ? "यह सहायक उपलब्ध नहीं है! दैनिक शगुन चक्र घुमाएं।" : "Booster not available! Spin the Daily Shagun Wheel to get more.");
            return;
        }

        if (this.activeBooster === type) {
            this.activeBooster = null;
        } else {
            this.activeBooster = type;
            this.selectedCell = null;
        }

        // Highlight active booster button
        ['hammer', 'anar', 'swap'].forEach(b => {
            const btn = document.getElementById(`booster-${b}-btn`);
            if (btn) {
                if (b === this.activeBooster) btn.classList.add('active-booster');
                else btn.classList.remove('active-booster');
            }
        });
    }

    handleBoosterClick(r, c) {
        const sm = window.StorageManager;
        const cx = this.renderer.boardX + (c * this.renderer.cellSize) + (this.renderer.cellSize / 2);
        const cy = this.renderer.boardY + (r * this.renderer.cellSize) + (this.renderer.cellSize / 2);

        if (this.activeBooster === 'hammer') {
            sm.useBooster('hammer');
            const cell = this.grid.get(r, c);
            if (cell?.gem) {
                this.renderer.spawnGulalExplosion(cx, cy, GEM_TYPES[cell.gem.type].color, 20);
                cell.gem = null;
            }
            this.grid.checkAndDamageCell(r, c, [], [], new Set());
            window.AudioEngine.playAnarExplosion();
            this.renderer.addScreenShake(8);
            this.activeBooster = null;
            this.updateInGameUI();
            this.toggleBooster(null);

            // Gravity & Cascades
            setTimeout(() => {
                this.grid.applyGravity();
                this.resolveCascade();
            }, 200);
        } else if (this.activeBooster === 'anar') {
            sm.useBooster('anar');
            const clearedSet = new Set();
            this.grid.triggerAnarBlast(r, c, clearedSet);
            window.AudioEngine.playAnarExplosion();
            this.renderer.spawnGoldenEmbers(cx, cy, 28);
            this.renderer.addScreenShake(12);

            clearedSet.forEach(key => {
                const [cr, cc] = key.split(',').map(Number);
                const cell = this.grid.get(cr, cc);
                if (cell?.gem) cell.gem = null;
                this.grid.checkAndDamageCell(cr, cc, [], [], new Set());
            });

            this.activeBooster = null;
            this.updateInGameUI();
            this.toggleBooster(null);

            setTimeout(() => {
                this.grid.applyGravity();
                this.resolveCascade();
            }, 250);
        } else if (this.activeBooster === 'swap') {
            if (!this.swapFirstCell) {
                this.swapFirstCell = { r, c };
                window.AudioEngine.playSitarPluck(r);
            } else {
                sm.useBooster('swap');
                this.grid.swap(this.swapFirstCell.r, this.swapFirstCell.c, r, c);
                window.AudioEngine.playSwipe();
                this.swapFirstCell = null;
                this.activeBooster = null;
                this.updateInGameUI();
                this.toggleBooster(null);

                setTimeout(() => this.resolveCascade(), 200);
            }
        }
    }

    pauseGame() {
        this.state = 'PAUSED';
        document.getElementById('pause-modal')?.classList.remove('hidden');
        document.getElementById('pause-modal')?.classList.add('flex');
    }

    resumeGame() {
        this.state = 'PLAYING';
        document.getElementById('pause-modal')?.classList.add('hidden');
    }

    // Courtyard Screen Logic
    renderCourtyardUpgradeList() {
        const container = document.getElementById('courtyard-items-container');
        if (!container) return;
        container.innerHTML = '';

        const sm = window.StorageManager;
        const unlocked = sm.data.courtyardUnlocks || [];

        COURTYARD_ITEMS.forEach(item => {
            const card = document.createElement('div');
            const isUnlocked = unlocked.includes(item.id);
            const canUnlock = !isUnlocked && (sm.data.stars >= item.starsRequired);
            const title = (this.currentLang === 'hi') ? item.nameHi : item.name;
            const desc = (this.currentLang === 'hi') ? item.descHi : item.desc;

            card.className = `courtyard-item-card ${isUnlocked ? 'unlocked' : ''}`;
            card.innerHTML = `
                <div class="item-icon">${item.icon}</div>
                <div class="item-info">
                    <h4>${title}</h4>
                    <p>${desc}</p>
                </div>
                <div class="item-action">
                    ${isUnlocked 
                        ? `<span class="badge-unlocked">✓ ${(this.currentLang === 'hi') ? 'सुशोभित' : 'Decorated'}</span>`
                        : `<button class="btn-renovate ${canUnlock ? 'ready' : 'disabled'}" ${canUnlock ? '' : 'disabled'}>
                             ⭐ ${item.starsRequired}
                           </button>`
                    }
                </div>
            `;

            if (canUnlock) {
                card.querySelector('.btn-renovate').onclick = () => {
                    if (sm.unlockCourtyardItem(item.id, item.starsRequired)) {
                        window.AudioEngine.playLevelVictory();
                        window.AnalyticsEngine.onCourtyardRenovated(item.id, sm.data.stars);
                        this.renderCourtyardUpgradeList();
                        this.courtyard.render();
                    }
                };
            }

            container.appendChild(card);
        });
    }

    // Daily Wheel Modal
    showWheelModal() {
        const modal = document.getElementById('wheel-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        const canvas = document.getElementById('wheel-canvas');
        if (canvas) {
            window.AdSystem.drawWheel(canvas.getContext('2d'), canvas.width, canvas.height);
        }

        const spinBtn = document.getElementById('wheel-spin-btn');
        const canFreeSpin = window.StorageManager.canDailySpin();

        if (spinBtn) {
            spinBtn.textContent = canFreeSpin 
                ? ((this.currentLang === 'hi') ? "मुफ़्त दैनिक घुमाव" : "Free Daily Spin")
                : ((this.currentLang === 'hi') ? "पुनः घुमाएँ (छोटा संदेश)" : "Spin Again (Short Ad)");

            spinBtn.onclick = () => {
                if (canFreeSpin) {
                    window.StorageManager.recordDailySpin();
                    spinBtn.disabled = true;
                    window.AdSystem.spinWheel(wonItem => {
                        this.onWheelPrizeWon(wonItem);
                        spinBtn.disabled = false;
                        this.showWheelModal();
                    });
                } else {
                    window.AdSystem.showRewardedAd('daily_wheel', () => {
                        spinBtn.disabled = true;
                        window.AdSystem.spinWheel(wonItem => {
                            this.onWheelPrizeWon(wonItem);
                            spinBtn.disabled = false;
                            this.showWheelModal();
                        });
                    });
                }
            };
        }

        document.getElementById('wheel-close-btn').onclick = () => {
            modal.classList.add('hidden');
        };
    }

    onWheelPrizeWon(wonItem) {
        this.updateHeaderUI();
        const alertMsg = (this.currentLang === 'hi') 
            ? `बधाई! आपको मिला: ${wonItem.label}`
            : `Badhai Ho! You received: ${wonItem.label}`;
        alert(alertMsg);
    }
}

window.GameController = new GameController();
