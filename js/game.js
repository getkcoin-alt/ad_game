/**
 * Master Game Controller, State Machine & Input Engine for Rangoli Utsav
 * Coordinates the Match-3 engine, Canvas renderer, Web Audio synthesizer,
 * Haveli Courtyard metagame, and monetization systems.
 */

/**
 * Pillar 4: Tactile Android Haptic Engine
 * Provides tuned vibration curves via navigator.vibrate for tactile mobile physical realism.
 */
class HapticEngine {
    static isSupported() {
        const isEnabled = window.StorageManager?.data?.hapticsEnabled !== false;
        return isEnabled && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
    }

    static setEnabled(bool) {
        if (window.StorageManager) {
            window.StorageManager.setHapticsEnabled(bool);
        }
    }

    static lightTap() {
        if (this.isSupported()) {
            try { navigator.vibrate(12); } catch (e) {}
        }
    }

    static matchPulse() {
        if (this.isSupported()) {
            try { navigator.vibrate([18, 25, 18]); } catch (e) {}
        }
    }

    static specialCreated() {
        if (this.isSupported()) {
            try { navigator.vibrate([30, 40, 45]); } catch (e) {}
        }
    }

    static explosion() {
        if (this.isSupported()) {
            try { navigator.vibrate([45, 30, 75]); } catch (e) {}
        }
    }

    static wobble() {
        if (this.isSupported()) {
            try { navigator.vibrate([25, 20, 25]); } catch (e) {}
        }
    }

    static victoryFanfare() {
        if (this.isSupported()) {
            try { navigator.vibrate([30, 40, 30, 40, 70]); } catch (e) {}
        }
    }
}
window.HapticEngine = HapticEngine;

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
        this.livesTimerInterval = null;
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

        // Apply audio levels from storage
        const sm = window.StorageManager;
        const ae = window.AudioEngine;
        if (ae && sm) {
            ae.soundEnabled = sm.data.soundEnabled !== false;
            ae.musicEnabled = sm.data.musicEnabled !== false;
            ae.setSoundVolume(sm.data.soundVolume ?? 0.8);
            ae.setMusicVolume(sm.data.musicVolume ?? 0.6);
        }

        this.bindEvents();
        this.updateHeaderUI();
        this.updateSettingsUI();
        this.updateNavBadges();
        this.applyLanguage(this.currentLang);
        this.showScreen('menu-screen');

        // Start loop music on first interaction (browser autoplay policy safe)
        const startAudioOnInteraction = () => {
            if (window.AudioEngine) {
                window.AudioEngine.init();
                if (window.AudioEngine.musicEnabled && !window.AudioEngine.isMusicPlaying) {
                    window.AudioEngine.startMusicLoop();
                }
            }
            window.removeEventListener('pointerdown', startAudioOnInteraction);
            window.removeEventListener('keydown', startAudioOnInteraction);
        };
        window.addEventListener('pointerdown', startAudioOnInteraction, { once: true });
        window.addEventListener('keydown', startAudioOnInteraction, { once: true });

        // Start render loop
        this.startLoop();

        // Start idle hint timer
        this.startHintChecker();

        // Start live heart energy timer
        this.startLivesTimer();
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
                const threshold = (this.currentLevelId === 1) ? 1200 : 2500;
                if (idleTime > threshold && !this.hintMove) {
                    this.hintMove = this.grid.findHintMove();
                }
            }
        }, 500);
    }

    resetHint() {
        this.lastMoveTime = Date.now();
        this.hintMove = null;
    }

    // Heart Energy & Live Refill Timer System
    startLivesTimer() {
        if (this.livesTimerInterval) clearInterval(this.livesTimerInterval);
        this.updateLivesTimerUI();
        this.livesTimerInterval = setInterval(() => {
            this.updateLivesTimerUI();
        }, 1000);
    }

    updateLivesTimerUI() {
        const sm = window.StorageManager;
        if (!sm) return;

        const prevLives = sm.data.lives;
        sm.updateLivesRegeneration();
        if (sm.data.lives !== prevLives) {
            this.updateHeaderUI();
        }

        const timerEl = document.getElementById('header-lives-timer');
        const modalBadge = document.getElementById('lives-modal-badge');
        const modalNext = document.getElementById('lives-modal-next-time');
        const modalFull = document.getElementById('lives-modal-full-time');
        const modalCount = document.getElementById('lives-modal-count');
        const modalProgress = document.getElementById('lives-modal-progress');
        const t = (window.I18N && window.I18N[this.currentLang]) || window.I18N?.en || {};

        const isFull = sm.data.lives >= 5;
        const msUntilNext = sm.getTimeUntilNextLife();
        const msUntilFull = sm.getTotalTimeUntilFullLives();

        const formattedNext = sm.formatTime(msUntilNext);
        const formattedFull = sm.formatDuration(msUntilFull);
        const fullLabel = t.livesFull || "FULL";
        const displayText = isFull ? fullLabel : formattedNext;

        if (timerEl) {
            timerEl.textContent = displayText;
            if (isFull) {
                timerEl.classList.add('is-full');
            } else {
                timerEl.classList.remove('is-full');
            }
        }

        if (modalBadge) {
            modalBadge.textContent = displayText;
            if (isFull) modalBadge.classList.add('is-full');
            else modalBadge.classList.remove('is-full');
        }

        if (modalNext) {
            modalNext.textContent = isFull ? fullLabel : formattedNext;
        }

        if (modalFull) {
            modalFull.textContent = isFull ? fullLabel : formattedFull;
        }

        if (modalCount) {
            modalCount.textContent = sm.data.lives;
        }

        if (modalProgress) {
            if (isFull) {
                modalProgress.style.width = '100%';
            } else {
                const REGEN_TIME_MS = 20 * 60 * 1000;
                const elapsed = Math.max(0, REGEN_TIME_MS - msUntilNext);
                const pct = Math.min(100, Math.max(4, (elapsed / REGEN_TIME_MS) * 100));
                modalProgress.style.width = `${pct}%`;
            }
        }
    }

    showLivesModal() {
        this.updateLivesTimerUI();
        const modal = document.getElementById('lives-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    watchAdForLife() {
        window.AdSystem.showRewardedAd('lives_refill', () => {
            window.StorageManager.addLives(1);
            this.updateHeaderUI();
            this.updateLivesTimerUI();
            document.getElementById('lives-modal')?.classList.add('hidden');
            document.getElementById('lives-modal')?.classList.remove('flex');
            window.AudioEngine.playLevelVictory();
            window.HapticEngine.victoryFanfare();
        });
    }

    refillLivesWithCoins() {
        const sm = window.StorageManager;
        if (sm.data.lives >= 5) {
            alert((this.currentLang === 'hi') ? "प्राण पहले से ही पूर्ण हैं!" : "Hearts are already full!");
            return;
        }
        if (sm.deductCoins(100)) {
            sm.data.lives = 5;
            sm.data.lastLifeTimestamp = Date.now();
            sm.save();
            this.updateHeaderUI();
            this.updateLivesTimerUI();
            document.getElementById('lives-modal')?.classList.add('hidden');
            document.getElementById('lives-modal')?.classList.remove('flex');
            window.AudioEngine.playLevelVictory();
            window.HapticEngine.victoryFanfare();
        } else {
            alert((this.currentLang === 'hi') ? "सिक्के पर्याप्त नहीं हैं! (आवश्यक: १०० सिक्के)" : "Not enough coins! (Needed: 100 coins)");
        }
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

            // Tap-to-select / Tap-to-swap / Direct Special Detonation logic (Royal Match feel)
            if (!this.selectedCell) {
                this.selectedCell = coords;
                this.resetHint();
                window.AudioEngine.playSitarPluck(coords.r);
                HapticEngine.lightTap();

                // If user selected a special gem, show a friendly helper cue
                const cell = this.grid.get(coords.r, coords.c);
                if (cell?.gem && cell.gem.special !== SPECIAL_TYPES.NORMAL && this.renderer) {
                    const cx = this.renderer.boardX + (coords.c * this.renderer.cellSize) + (this.renderer.cellSize / 2);
                    const cy = this.renderer.boardY + (coords.r * this.renderer.cellSize);
                    const msg = (this.currentLang === 'hi') ? "⚡ पुनः दबाकर फोड़ें!" : "⚡ Tap again to blast!";
                    this.renderer.spawnFloatingText(cx, cy, msg, '#FDE047', 15);
                }
            } else {
                // If tapped the same cell and it's a special gem -> Direct Detonation!
                if (this.selectedCell.r === coords.r && this.selectedCell.c === coords.c) {
                    const cell = this.grid.get(coords.r, coords.c);
                    if (cell?.gem && cell.gem.special !== SPECIAL_TYPES.NORMAL) {
                        this.selectedCell = null;
                        this.resetHint();
                        this.activateSpecialDirectly(coords.r, coords.c);
                        return;
                    }
                }

                const dist = Math.abs(this.selectedCell.r - coords.r) + Math.abs(this.selectedCell.c - coords.c);
                if (dist === 1) {
                    this.attemptSwap(this.selectedCell.r, this.selectedCell.c, coords.r, coords.c);
                    this.selectedCell = null;
                } else {
                    this.selectedCell = coords;
                    window.AudioEngine.playSitarPluck(coords.r);
                    HapticEngine.lightTap();

                    const cell = this.grid.get(coords.r, coords.c);
                    if (cell?.gem && cell.gem.special !== SPECIAL_TYPES.NORMAL && this.renderer) {
                        const cx = this.renderer.boardX + (coords.c * this.renderer.cellSize) + (this.renderer.cellSize / 2);
                        const cy = this.renderer.boardY + (coords.r * this.renderer.cellSize);
                        const msg = (this.currentLang === 'hi') ? "⚡ पुनः दबाकर फोड़ें!" : "⚡ Tap again to blast!";
                        this.renderer.spawnFloatingText(cx, cy, msg, '#FDE047', 15);
                    }
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
        // Settings Hub & Bottom Navigation Dock
        document.getElementById('settings-btn')?.addEventListener('click', () => {
            this.showSettingsModal();
        });
        document.getElementById('settings-close-btn')?.addEventListener('click', () => {
            document.getElementById('settings-modal')?.classList.add('hidden');
            document.getElementById('settings-modal')?.classList.remove('flex');
        });

        // Bottom Dock Tab Navigation
        document.getElementById('nav-map')?.addEventListener('click', () => {
            this.showScreen('menu-screen');
        });
        document.getElementById('nav-courtyard')?.addEventListener('click', () => {
            this.showScreen('courtyard-screen');
        });
        document.getElementById('nav-saheli')?.addEventListener('click', () => {
            this.showSaheliModal();
        });
        document.getElementById('nav-shagun')?.addEventListener('click', () => {
            this.showWheelModal();
        });
        document.getElementById('nav-settings')?.addEventListener('click', () => {
            this.showSettingsModal();
        });

        // Settings Hub Controls
        document.getElementById('settings-sfx-slider')?.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            const label = document.getElementById('settings-sfx-val');
            if (label) label.textContent = `${val}%`;
            const normalized = val / 100;
            window.AudioEngine.setSoundVolume(normalized);
            window.StorageManager.setVolumes(normalized, null);
        });

        document.getElementById('settings-music-slider')?.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            const label = document.getElementById('settings-music-val');
            if (label) label.textContent = `${val}%`;
            const normalized = val / 100;
            window.AudioEngine.setMusicVolume(normalized);
            window.StorageManager.setVolumes(null, normalized);
        });

        document.getElementById('settings-haptics-toggle')?.addEventListener('change', (e) => {
            const enabled = !!e.target.checked;
            HapticEngine.setEnabled(enabled);
            if (enabled) HapticEngine.lightTap();
        });

        document.getElementById('settings-lang-btn')?.addEventListener('click', () => {
            this.currentLang = (this.currentLang === 'en') ? 'hi' : 'en';
            window.StorageManager.data.language = this.currentLang;
            window.StorageManager.save();
            this.applyLanguage(this.currentLang);
            this.updateSettingsUI();
        });

        document.getElementById('settings-how-to-play-btn')?.addEventListener('click', () => {
            const modal = document.getElementById('how-modal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        });

        document.getElementById('settings-reset-btn')?.addEventListener('click', () => {
            const dict = window.I18N[this.currentLang] || window.I18N.en;
            const msg = dict.resetConfirmPrompt || "Are you sure you want to reset all game progress? This will reset levels, stars, coins, and haveli decor!";
            if (confirm(msg)) {
                window.StorageManager.resetProgress();
                this.updateHeaderUI();
                this.updateSettingsUI();
                this.showScreen('menu-screen');
                document.getElementById('settings-modal')?.classList.add('hidden');
                document.getElementById('settings-modal')?.classList.remove('flex');
                alert((this.currentLang === 'hi') ? "प्रगति सफलतापूर्वक रीसेट कर दी गई!" : "All progress reset successfully!");
            }
        });

        // How to Play Guide Modal
        document.getElementById('how-to-play-btn')?.addEventListener('click', () => {
            const modal = document.getElementById('how-modal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        });
        document.getElementById('how-close-btn')?.addEventListener('click', () => {
            document.getElementById('how-modal')?.classList.add('hidden');
        });

        // Prominent Play Button on Home Screen
        document.getElementById('play-main-cta-btn')?.addEventListener('click', () => {
            const sm = window.StorageManager;
            const lvl = Math.min(sm.data.unlockedLevel || 1, LEVEL_CONFIGS.length);
            this.startLevel(lvl);
        });

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

        // Pillar 3: Saheli Circle Modal button
        document.getElementById('saheli-btn')?.addEventListener('click', () => {
            this.showSaheliModal();
        });
        document.getElementById('saheli-close-btn')?.addEventListener('click', () => {
            document.getElementById('saheli-modal')?.classList.add('hidden');
        });
        document.getElementById('saheli-claim-chest-btn')?.addEventListener('click', () => {
            this.claimSaheliChest();
        });
        document.getElementById('saheli-request-life-btn')?.addEventListener('click', () => {
            this.requestSaheliLife();
        });
        document.getElementById('saheli-claim-gift-btn')?.addEventListener('click', () => {
            this.claimReceivedSaheliGift();
        });
        document.getElementById('saheli-invite-btn')?.addEventListener('click', () => {
            this.shareOnWhatsApp('invite');
        });

        // Heart Energy & Timer Refill Modal bindings
        document.getElementById('header-lives-chip')?.addEventListener('click', () => {
            this.showLivesModal();
        });
        document.getElementById('lives-modal-close-btn')?.addEventListener('click', () => {
            document.getElementById('lives-modal')?.classList.add('hidden');
            document.getElementById('lives-modal')?.classList.remove('flex');
        });
        document.getElementById('lives-refill-ad-btn')?.addEventListener('click', () => {
            this.watchAdForLife();
        });
        document.getElementById('lives-refill-coins-btn')?.addEventListener('click', () => {
            this.refillLivesWithCoins();
        });
        document.getElementById('lives-ask-saheli-btn')?.addEventListener('click', () => {
            document.getElementById('lives-modal')?.classList.add('hidden');
            document.getElementById('lives-modal')?.classList.remove('flex');
            this.showSaheliModal();
        });

        // WhatsApp Share Buttons on Victory & Courtyard
        document.getElementById('win-share-btn')?.addEventListener('click', () => {
            this.shareOnWhatsApp('victory');
        });
        document.getElementById('courtyard-share-btn')?.addEventListener('click', () => {
            this.shareOnWhatsApp('courtyard');
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
            window.StorageManager.resetWinStreak();
            this.updateHeaderUI();
            this.showScreen('menu-screen');
        });

        // Win / Fail Modal buttons
        document.getElementById('win-next-btn')?.addEventListener('click', () => {
            document.getElementById('win-modal')?.classList.add('hidden');
            document.getElementById('win-modal')?.classList.remove('flex');
            this.startLevel(this.currentLevelId + 1);
        });
        document.getElementById('win-menu-btn')?.addEventListener('click', () => {
            document.getElementById('win-modal')?.classList.add('hidden');
            document.getElementById('win-modal')?.classList.remove('flex');
            this.showScreen('menu-screen');
        });
        document.getElementById('fail-retry-btn')?.addEventListener('click', () => {
            window.StorageManager.resetWinStreak();
            this.updateHeaderUI();
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
        const settingsLangText = document.getElementById('settings-lang-text');
        if (settingsLangText) settingsLangText.textContent = (lang === 'en') ? 'हिन्दी' : 'English';
        this.updateLivesTimerUI();
    }

    showSettingsModal() {
        this.updateSettingsUI();
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    updateSettingsUI() {
        const sm = window.StorageManager;
        if (!sm) return;

        const sfxSlider = document.getElementById('settings-sfx-slider');
        const sfxVal = document.getElementById('settings-sfx-val');
        const sfxVol = Math.round((sm.data.soundVolume ?? 0.8) * 100);
        if (sfxSlider) sfxSlider.value = sfxVol;
        if (sfxVal) sfxVal.textContent = `${sfxVol}%`;

        const musicSlider = document.getElementById('settings-music-slider');
        const musicVal = document.getElementById('settings-music-val');
        const musicVol = Math.round((sm.data.musicVolume ?? 0.6) * 100);
        if (musicSlider) musicSlider.value = musicVol;
        if (musicVal) musicVal.textContent = `${musicVol}%`;

        const hapticsToggle = document.getElementById('settings-haptics-toggle');
        if (hapticsToggle) hapticsToggle.checked = (sm.data.hapticsEnabled !== false);

        const artisanIdEl = document.getElementById('settings-artisan-id');
        if (artisanIdEl) artisanIdEl.textContent = sm.data.artisanId || '#RU-82910';

        const langBtnText = document.getElementById('settings-lang-text');
        if (langBtnText) langBtnText.textContent = (this.currentLang === 'en') ? 'हिन्दी' : 'English';
    }

    updateNavBadges() {
        const sm = window.StorageManager;
        if (!sm) return;

        const saheliBadge = document.getElementById('nav-saheli-badge');
        if (saheliBadge) {
            const hasGifts = (sm.data.pendingReceivedGifts || 0) > 0;
            const hasChest = !sm.isChestClaimed(1);
            if (hasGifts || hasChest) {
                saheliBadge.classList.remove('hidden');
            } else {
                saheliBadge.classList.add('hidden');
            }
        }

        const shagunBadge = document.getElementById('nav-shagun-badge');
        if (shagunBadge) {
            if (sm.canDailySpin()) {
                shagunBadge.classList.remove('hidden');
            } else {
                shagunBadge.classList.add('hidden');
            }
        }
    }

    showScreen(screenId) {
        // Dismiss modal overlays when switching screens
        ['win-modal', 'fail-modal', 'pause-modal', 'how-modal', 'saheli-modal', 'ad-modal', 'lives-modal', 'wheel-modal', 'settings-modal'].forEach(mId => {
            const m = document.getElementById(mId);
            if (m) {
                m.classList.add('hidden');
                m.classList.remove('flex');
            }
        });

        // Ergonomic Bottom Navigation Auto-hide / Auto-show
        const bottomNav = document.getElementById('bottom-nav');
        if (bottomNav) {
            if (screenId === 'game-screen') {
                bottomNav.classList.add('hidden-dock');
            } else {
                bottomNav.classList.remove('hidden-dock');
            }
        }

        // Highlight active dock tab
        const navMap = document.getElementById('nav-map');
        const navCourtyard = document.getElementById('nav-courtyard');
        const navSaheli = document.getElementById('nav-saheli');
        const navShagun = document.getElementById('nav-shagun');
        const navSettings = document.getElementById('nav-settings');
        [navMap, navCourtyard, navSaheli, navShagun, navSettings].forEach(tab => tab?.classList.remove('active'));

        if (screenId === 'menu-screen') {
            navMap?.classList.add('active');
        } else if (screenId === 'courtyard-screen') {
            navCourtyard?.classList.add('active');
        }

        ['menu-screen', 'game-screen', 'courtyard-screen'].forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                if (id === screenId) elem.classList.remove('hidden');
                else elem.classList.add('hidden');
            }
        });

        if (screenId === 'menu-screen') {
            this.state = 'MENU';
            window.AudioEngine.setPausedFilter(false);
            this.renderLevelSelectGrid();
            this.updateHeaderUI();
        } else if (screenId === 'courtyard-screen') {
            this.state = 'COURTYARD';
            this.renderCourtyardUpgradeList();
            this.updateHeaderUI();
            requestAnimationFrame(() => {
                if (this.courtyard) this.courtyard.resize();
            });
        } else if (screenId === 'game-screen') {
            this.state = 'PLAYING';
            this.updateInGameUI();
            requestAnimationFrame(() => {
                if (this.renderer) this.renderer.resize();
            });
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

        this.updateLivesTimerUI();
        this.updateNavBadges();

        // Pillar 2: Shringaar Blessing Streak Badge
        const streakEl = document.getElementById('header-streak');
        const streakChip = document.getElementById('streak-chip');
        const winStreak = sm.data.winStreak || 0;
        if (streakEl && streakChip) {
            if (winStreak > 0) {
                streakEl.textContent = winStreak;
                streakChip.classList.remove('hidden');
            } else {
                streakChip.classList.add('hidden');
            }
        }

        const playCta = document.getElementById('play-cta-text');
        if (playCta) {
            const nextLvl = Math.min(sm.data.unlockedLevel || 1, LEVEL_CONFIGS.length);
            playCta.textContent = (this.currentLang === 'hi') ? `स्तर ${nextLvl} खेलें` : `Play Level ${nextLvl}`;
        }
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
            this.showLivesModal();
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
        this.updateLivesTimerUI();

        // Pillar 2: Shringaar Blessing starting bonuses (Butler's Gift equivalent)
        const streakTier = sm.getStreakTier();
        if (streakTier > 0) {
            const bonuses = sm.getStreakBonuses();
            this.spawnStreakBonuses(bonuses, streakTier);
        }

        // Log analytics
        window.AnalyticsEngine.onLevelStart(config.id);

        // Hide modals
        document.getElementById('win-modal')?.classList.add('hidden');
        document.getElementById('fail-modal')?.classList.add('hidden');
        document.getElementById('pause-modal')?.classList.add('hidden');
        document.getElementById('lives-modal')?.classList.add('hidden');

        this.showScreen('game-screen');
        this.state = 'PLAYING';
        this.resetHint();
        this.updateInGameUI();

        requestAnimationFrame(() => {
            if (this.renderer) this.renderer.resize();
        });

        window.AudioEngine.playSwipe();
    }

    // Pillar 2: Disburse Shringaar Blessing specials onto the board
    spawnStreakBonuses(bonuses, streakTier) {
        const candidates = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = this.grid.get(r, c);
                if (cell?.gem && cell.gem.special === SPECIAL_TYPES.NORMAL) {
                    candidates.push({ r, c });
                }
            }
        }

        // Shuffle candidates randomly
        for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const t = candidates[i];
            candidates[i] = candidates[j];
            candidates[j] = t;
        }

        let idx = 0;
        bonuses.forEach(b => {
            if (idx < candidates.length) {
                const target = candidates[idx++];
                const cell = this.grid.get(target.r, target.c);
                if (b === 'mayur') cell.gem.special = SPECIAL_TYPES.MAYUR_RAINBOW;
                else if (b === 'anar') cell.gem.special = SPECIAL_TYPES.ANAR_BOMB;
                else cell.gem.special = (Math.random() > 0.5) ? SPECIAL_TYPES.CHAKRA_ROW : SPECIAL_TYPES.CHAKRA_COL;

                if (this.renderer) {
                    const cx = this.renderer.boardX + (target.c * this.renderer.cellSize) + (this.renderer.cellSize / 2);
                    const cy = this.renderer.boardY + (target.r * this.renderer.cellSize) + (this.renderer.cellSize / 2);
                    this.renderer.spawnGoldenEmbers(cx, cy, 18);
                }
            }
        });

        window.AudioEngine.playFanfare();
        if (this.renderer) {
            const toast = (this.currentLang === 'hi')
                ? `🔥 श्रृंगार वरदान ${streakTier}! (+${bonuses.length} विशेष रत्न)`
                : `🔥 Shringaar Blessing ${streakTier}! (+${bonuses.length} Free Specials)`;
            this.renderer.spawnFloatingText(
                this.renderer.width / 2,
                this.renderer.boardY + 40,
                toast,
                '#FDE047',
                18
            );
            this.renderer.addScreenShake(6);
        }
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

    // Direct Tap-to-Activate Special (Royal Match Fluid UX)
    activateSpecialDirectly(r, c) {
        if (this.state !== 'PLAYING') return;

        const cell = this.grid.get(r, c);
        if (!cell || !cell.gem || cell.gem.special === SPECIAL_TYPES.NORMAL) return;

        this.state = 'RESOLVING';
        this.movesLeft--;
        this.updateInGameUI();

        const blast = this.grid.detonateSpecialInPlace(r, c);
        if (!blast) {
            this.state = 'PLAYING';
            return;
        }

        // Distinctive audio & juiciness per special type
        HapticEngine.explosion();
        if (blast.specialType === SPECIAL_TYPES.ANAR_BOMB) {
            window.AudioEngine.playAnarExplosion();
            if (this.renderer) {
                this.renderer.addScreenShake(12);
                const scx = this.renderer.boardX + (c * this.renderer.cellSize) + (this.renderer.cellSize / 2);
                const scy = this.renderer.boardY + (r * this.renderer.cellSize) + (this.renderer.cellSize / 2);
                this.renderer.spawnShockwave(scx, scy, '#FF6B00', 110);
            }
        } else if (blast.specialType === SPECIAL_TYPES.MAYUR_RAINBOW) {
            window.AudioEngine.playPeacockRainbow();
            if (this.renderer) {
                this.renderer.addScreenShake(14);
                const scx = this.renderer.boardX + (c * this.renderer.cellSize) + (this.renderer.cellSize / 2);
                const scy = this.renderer.boardY + (r * this.renderer.cellSize) + (this.renderer.cellSize / 2);
                this.renderer.spawnShockwave(scx, scy, '#00E5FF', 140);
            }
        } else {
            window.AudioEngine.playChakraBeam();
            if (this.renderer) {
                this.renderer.addScreenShake(8);
                const scx = this.renderer.boardX + (c * this.renderer.cellSize) + (this.renderer.cellSize / 2);
                const scy = this.renderer.boardY + (r * this.renderer.cellSize) + (this.renderer.cellSize / 2);
                this.renderer.spawnShockwave(scx, scy, '#FFD700', 95);
            }
        }

        // Spawn gulal explosions & golden embers
        blast.clearedCoords.forEach(({ r: cr, c: cc }) => {
            const clrCell = this.grid.get(cr, cc);
            if (clrCell?.gem && this.renderer) {
                const def = GEM_TYPES[clrCell.gem.type];
                const cx = this.renderer.boardX + (cc * this.renderer.cellSize) + (this.renderer.cellSize / 2);
                const cy = this.renderer.boardY + (cr * this.renderer.cellSize) + (this.renderer.cellSize / 2);
                this.renderer.spawnGulalExplosion(cx, cy, def.color, 12);
                clrCell.gem = null;
            }
        });

        // Award score
        this.score += blast.clearedCoords.length * 120;
        this.updateInGameUI();

        // Process obstacle clears (Diyas & Marigolds)
        this.processObstacleClears(blast.clearedCoords);

        // Apply gravity and resolve cascading matches
        setTimeout(() => {
            this.grid.applyGravity();
            this.grid.cascadeCount = 1;
            setTimeout(() => this.resolveCascade(), 220);
        }, 250);
    }

    attemptSwap(r1, c1, r2, c2) {
        if (!this.grid.canSwap(r1, c1, r2, c2)) {
            // Invalid swap: visual wobble and tactile haptic feedback
            window.AudioEngine.playSwipe();
            HapticEngine.wobble();
            const cell1 = this.grid.get(r1, c1);
            const cell2 = this.grid.get(r2, c2);
            if (cell1?.gem && cell2?.gem) {
                cell1.gem.animX = (c2 - c1) * 0.35;
                cell1.gem.animY = (r2 - r1) * 0.35;
                cell2.gem.animX = (c1 - c2) * 0.35;
                cell2.gem.animY = (r1 - r2) * 0.35;
            }
            if (this.renderer) {
                const cx = this.renderer.boardX + (((c1 + c2) / 2) * this.renderer.cellSize) + (this.renderer.cellSize / 2);
                const cy = this.renderer.boardY + (((r1 + r2) / 2) * this.renderer.cellSize) + (this.renderer.cellSize / 2);
                const msg = (this.currentLang === 'hi') ? "३ एक जैसे रंग मिलाएँ!" : "Match 3 in a line!";
                this.renderer.spawnFloatingText(cx, cy, msg, '#F472B6', 15);
            }
            this.lastMoveTime = Date.now() - 3000;
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

        // Standard Swap with tactile click
        this.grid.swap(r1, c1, r2, c2);
        window.AudioEngine.playSitarPluck(r2);
        HapticEngine.lightTap();

        // Trigger cascade resolution
        this.grid.cascadeCount = 0;
        setTimeout(() => this.resolveCascade(), 180);
    }

    resolveSpecialCombo(comboResult) {
        window.AudioEngine.playPeacockRainbow();
        HapticEngine.explosion();
        if (this.renderer) {
            this.renderer.addScreenShake(12);
            if (comboResult.clearedCoords.length > 0) {
                const firstCoord = comboResult.clearedCoords[0];
                const scx = this.renderer.boardX + (firstCoord.c * this.renderer.cellSize) + (this.renderer.cellSize / 2);
                const scy = this.renderer.boardY + (firstCoord.r * this.renderer.cellSize) + (this.renderer.cellSize / 2);
                this.renderer.spawnShockwave(scx, scy, '#F43F5E', 130);
            }
        }

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

        // Sound feedback climbing Raga Bhupali pentatonic scale and tactile match pulse
        window.AudioEngine.playCascade(cascadeMultiplier);
        HapticEngine.matchPulse();

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

        // Identify special gem creations (Pillar 1: Smart Obstacle Targeting & Specials)
        const createdSpecials = new Map();

        // 5 in line -> Mayur Rainbow
        matches.line5.forEach(line => {
            const center = line[2] || line[0];
            createdSpecials.set(`${center.r},${center.c}`, SPECIAL_TYPES.MAYUR_RAINBOW);
        });

        // T and L shape intersections -> Anar Bomb
        if (matches.tOrL && Array.isArray(matches.tOrL)) {
            matches.tOrL.forEach(pt => {
                if (!createdSpecials.has(`${pt.r},${pt.c}`)) {
                    createdSpecials.set(`${pt.r},${pt.c}`, SPECIAL_TYPES.ANAR_BOMB);
                }
            });
        }

        // 4 in horizontal line -> Smart Chakra (evaluates whether row or col has more obstacles)
        matches.line4H.forEach(line => {
            const center = line[1];
            if (!createdSpecials.has(`${center.r},${center.c}`)) {
                const rowObs = this.grid.countObstaclesInRow(center.r);
                const colObs = this.grid.countObstaclesInCol(center.c);
                const type = (colObs > rowObs + 1) ? SPECIAL_TYPES.CHAKRA_COL : SPECIAL_TYPES.CHAKRA_ROW;
                createdSpecials.set(`${center.r},${center.c}`, type);
            }
        });

        // 4 in vertical line -> Smart Chakra (evaluates whether row or col has more obstacles)
        matches.line4V.forEach(line => {
            const center = line[1];
            if (!createdSpecials.has(`${center.r},${center.c}`)) {
                const rowObs = this.grid.countObstaclesInRow(center.r);
                const colObs = this.grid.countObstaclesInCol(center.c);
                const type = (rowObs > colObs + 1) ? SPECIAL_TYPES.CHAKRA_ROW : SPECIAL_TYPES.CHAKRA_COL;
                createdSpecials.set(`${center.r},${center.c}`, type);
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

                HapticEngine.explosion();
                if (cell.gem.special === SPECIAL_TYPES.ANAR_BOMB) {
                    window.AudioEngine.playAnarExplosion();
                    this.renderer.spawnGoldenEmbers(cx, cy, 20);
                    this.renderer.spawnShockwave(cx, cy, '#FF6B00', 105);
                } else {
                    window.AudioEngine.playChakraBeam();
                    this.renderer.spawnShockwave(cx, cy, '#FFD700', 90);
                }
            }

            // Create new special or clear cell
            const key = `${r},${c}`;
            if (createdSpecials.has(key)) {
                cell.gem.special = createdSpecials.get(key);
                HapticEngine.specialCreated();
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
            if (this.movesLeft > 0) {
                this.startMahaUtsavFinale();
            } else {
                this.triggerLevelVictory();
            }
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

    // Pillar 1 & 4: Maha Utsav Grand Finale (Royal Match Remaining Moves Cascade & Confetti)
    startMahaUtsavFinale() {
        this.state = 'MAHA_UTSAV';
        window.AudioEngine.playFanfare();
        HapticEngine.victoryFanfare();
        if (this.renderer) {
            this.renderer.spawnConfettiRain(40);
        }

        // Celebratory banner in center
        if (this.renderer) {
            const title = (this.currentLang === 'hi') ? "🎆 महा उत्सव! 🎆" : "🎆 MAHA UTSAV! 🎆";
            this.renderer.spawnFloatingText(
                this.renderer.width / 2,
                this.renderer.boardY + (this.renderer.boardSize / 2) - 20,
                title,
                '#FFD700',
                30
            );
            this.renderer.addScreenShake(8);
        }

        let moveIndex = 0;

        const convertStep = () => {
            if (this.movesLeft <= 0) {
                // All remaining moves turned into specials! Ignite the finale!
                setTimeout(() => this.igniteMahaUtsavSpecials(), 300);
                return;
            }

            this.movesLeft--;
            moveIndex++;
            this.score += 250;
            this.updateInGameUI();

            // Find all normal gems eligible for promotion
            const candidateCells = [];
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const gem = this.grid.get(r, c)?.gem;
                    if (gem && gem.special === SPECIAL_TYPES.NORMAL) {
                        candidateCells.push({ r, c });
                    }
                }
            }

            if (candidateCells.length > 0) {
                const target = candidateCells[Math.floor(Math.random() * candidateCells.length)];
                const chosenCell = this.grid.get(target.r, target.c);
                if (chosenCell && chosenCell.gem) {
                    const rand = Math.random();
                    if (rand < 0.45) chosenCell.gem.special = SPECIAL_TYPES.CHAKRA_ROW;
                    else if (rand < 0.85) chosenCell.gem.special = SPECIAL_TYPES.CHAKRA_COL;
                    else chosenCell.gem.special = SPECIAL_TYPES.ANAR_BOMB;

                    if (this.renderer) {
                        const cx = this.renderer.boardX + (target.c * this.renderer.cellSize) + (this.renderer.cellSize / 2);
                        const cy = this.renderer.boardY + (target.r * this.renderer.cellSize) + (this.renderer.cellSize / 2);
                        this.renderer.spawnGoldenEmbers(cx, cy, 16);
                    }
                    window.AudioEngine.playSparklerBurst(moveIndex);
                }
            }

            setTimeout(convertStep, 120);
        };

        setTimeout(convertStep, 250);
    }

    igniteMahaUtsavSpecials() {
        // Collect all specials currently on the board
        const specials = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const gem = this.grid.get(r, c)?.gem;
                if (gem && gem.special !== SPECIAL_TYPES.NORMAL) {
                    specials.push({ r, c });
                }
            }
        }

        if (specials.length === 0) {
            setTimeout(() => this.triggerLevelVictory(), 400);
            return;
        }

        // Detonate first special, allowing chain reactions to propagate
        const first = specials[0];
        const blast = this.grid.detonateSpecialInPlace(first.r, first.c);
        if (blast) {
            window.AudioEngine.playAnarExplosion();
            if (this.renderer) this.renderer.addScreenShake(12);

            blast.clearedCoords.forEach(({ r, c }) => {
                const cell = this.grid.get(r, c);
                if (cell?.gem && this.renderer) {
                    const def = GEM_TYPES[cell.gem.type];
                    const cx = this.renderer.boardX + (c * this.renderer.cellSize) + (this.renderer.cellSize / 2);
                    const cy = this.renderer.boardY + (r * this.renderer.cellSize) + (this.renderer.cellSize / 2);
                    this.renderer.spawnGulalExplosion(cx, cy, def.color, 12);
                    cell.gem = null;
                }
            });

            this.score += blast.clearedCoords.length * 150;
            this.updateInGameUI();
            this.processObstacleClears(blast.clearedCoords);

            setTimeout(() => {
                this.grid.applyGravity();
                this.grid.cascadeCount = 1;
                this.resolveMahaUtsavCascade();
            }, 240);
        } else {
            setTimeout(() => this.triggerLevelVictory(), 400);
        }
    }

    resolveMahaUtsavCascade() {
        const matches = this.grid.findMatches();
        let remainingSpecials = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.grid.get(r, c)?.gem?.special !== SPECIAL_TYPES.NORMAL) {
                    remainingSpecials.push({ r, c });
                }
            }
        }

        if (matches.cells.length === 0 && remainingSpecials.length === 0) {
            setTimeout(() => this.triggerLevelVictory(), 550);
            return;
        }

        if (matches.cells.length > 0) {
            this.grid.cascadeCount++;
            window.AudioEngine.playCascade(this.grid.cascadeCount);

            matches.cells.forEach(({ r, c }) => {
                const cell = this.grid.get(r, c);
                if (!cell?.gem) return;
                const def = GEM_TYPES[cell.gem.type];
                const cx = this.renderer.boardX + (c * this.renderer.cellSize) + (this.renderer.cellSize / 2);
                const cy = this.renderer.boardY + (r * this.renderer.cellSize) + (this.renderer.cellSize / 2);
                this.renderer.spawnGulalExplosion(cx, cy, def.color, 10);
                cell.gem = null;
            });

            this.score += matches.cells.length * 80 * this.grid.cascadeCount;
            this.updateInGameUI();
            this.processObstacleClears(matches.cells);

            setTimeout(() => {
                this.grid.applyGravity();
                setTimeout(() => this.resolveMahaUtsavCascade(), 200);
            }, 200);
        } else if (remainingSpecials.length > 0) {
            setTimeout(() => this.igniteMahaUtsavSpecials(), 200);
        }
    }

    triggerLevelVictory() {
        this.state = 'WIN';
        window.AudioEngine.playLevelVictory();
        HapticEngine.victoryFanfare();

        // Pillar 4: Celebratory Confetti Rain
        if (this.renderer) {
            this.renderer.spawnConfettiRain(70);
        }

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
        const streakWarning = document.getElementById('fail-streak-warning');
        const streakText = document.getElementById('fail-streak-text');
        const adBtn = document.getElementById('fail-ad-btn');
        const t = window.I18N[this.currentLang] || window.I18N.en;

        if (failSub) {
            failSub.textContent = t.levelFailedSub;
        }

        // Pillar 2: Loss aversion warning if active streak is at risk
        const sm = window.StorageManager;
        const winStreak = sm.data.winStreak || 0;

        if (winStreak > 0) {
            if (streakWarning) streakWarning.classList.remove('hidden');
            if (streakText) {
                streakText.textContent = (this.currentLang === 'hi')
                    ? `⚠️ ${winStreak} स्तर का वरदान टूटने से बचाएं!`
                    : `⚠️ Save your ${winStreak}-win Shringaar Blessing streak!`;
            }
            if (adBtn) {
                const label = adBtn.querySelector('span:nth-child(2)');
                if (label) label.textContent = (this.currentLang === 'hi')
                    ? `✨ वरदान बचाएं (+३ चालें)`
                    : `✨ Save ${winStreak}-Win Streak (+3 Moves)`;
            }
        } else {
            if (streakWarning) streakWarning.classList.add('hidden');
            if (adBtn) {
                const label = adBtn.querySelector('span:nth-child(2)');
                if (label) label.textContent = t.watchAdMoves;
            }
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
            HapticEngine.explosion();
            this.renderer.spawnShockwave(cx, cy, '#FFD700', 95);
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
            HapticEngine.explosion();
            this.renderer.spawnShockwave(cx, cy, '#FF6B00', 120);
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
                HapticEngine.lightTap();
            } else {
                sm.useBooster('swap');
                this.grid.swap(this.swapFirstCell.r, this.swapFirstCell.c, r, c);
                window.AudioEngine.playSwipe();
                HapticEngine.lightTap();
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
        window.AudioEngine.setPausedFilter(true);
        document.getElementById('pause-modal')?.classList.remove('hidden');
        document.getElementById('pause-modal')?.classList.add('flex');
    }

    resumeGame() {
        this.state = 'PLAYING';
        window.AudioEngine.setPausedFilter(false);
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

    // Pillar 3: Saheli Circle & Community Social Methods
    showSaheliModal() {
        const sm = window.StorageManager;
        const circleId = sm.data.currentCircleId || 'gulal_queens';
        const circlesList = (typeof SAHELI_CIRCLES !== 'undefined') ? SAHELI_CIRCLES : (window.SAHELI_CIRCLES || []);
        const circle = circlesList.find(c => c.id === circleId) || circlesList[0];

        if (!circle) return;

        const badgeEl = document.getElementById('saheli-circle-badge');
        const nameEl = document.getElementById('saheli-circle-name');
        const taglineEl = document.getElementById('saheli-circle-tagline');

        if (badgeEl) badgeEl.textContent = circle.badge;
        if (nameEl) nameEl.textContent = (this.currentLang === 'hi') ? circle.nameHi : circle.name;
        if (taglineEl) taglineEl.textContent = (this.currentLang === 'hi') ? circle.taglineHi : circle.tagline;

        // Calculate collective stars
        const memberStars = circle.members.reduce((acc, m) => acc + m.stars, 0);
        const totalStars = memberStars + (sm.data.stars || 0);
        const targetStars = circle.targetStars || 60;
        const progressPct = Math.min(100, (totalStars / targetStars) * 100);

        const progFill = document.getElementById('saheli-chest-progress-fill');
        const progText = document.getElementById('saheli-chest-progress-text');
        const claimBtn = document.getElementById('saheli-claim-chest-btn');

        if (progFill) progFill.style.width = `${progressPct}%`;
        if (progText) progText.textContent = `${totalStars} / ${targetStars} ⭐`;

        const isClaimed = sm.isChestClaimed(1);
        if (claimBtn) {
            if (isClaimed) {
                claimBtn.textContent = (this.currentLang === 'hi') ? "✓ प्राप्त किया" : "✓ Claimed";
                claimBtn.className = "btn-secondary";
                claimBtn.disabled = true;
            } else if (totalStars >= targetStars) {
                claimBtn.textContent = (this.currentLang === 'hi') ? "शगुन खज़ाना लें" : "Claim Chest";
                claimBtn.className = "btn-primary anim-pulse-gold";
                claimBtn.disabled = false;
            } else {
                claimBtn.textContent = (this.currentLang === 'hi') ? "प्रगति जारी..." : "In Progress";
                claimBtn.className = "btn-secondary";
                claimBtn.disabled = true;
            }
        }

        // Render Inbox
        this.updateSaheliInboxUI();

        // Render Members Feed
        this.renderSaheliMemberList(circle);

        const modal = document.getElementById('saheli-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    updateSaheliInboxUI() {
        const sm = window.StorageManager;
        const inboxCard = document.getElementById('saheli-inbox-section');
        const inboxText = document.getElementById('saheli-inbox-text');
        const pending = sm.data.pendingReceivedGifts || 0;

        if (inboxCard) {
            if (pending > 0) {
                inboxCard.classList.remove('hidden');
                if (inboxText) {
                    inboxText.textContent = (this.currentLang === 'hi')
                        ? `सुनीता शर्मा ने आपको +${pending} उपहार (प्राण ❤️) भेजा!`
                        : `Sunita Sharma sent you +${pending} Gift (Life ❤️)!`;
                }
            } else {
                inboxCard.classList.add('hidden');
            }
        }
    }

    renderSaheliMemberList(circle) {
        const container = document.getElementById('saheli-members-container');
        if (!container) return;
        container.innerHTML = '';

        const sm = window.StorageManager;
        const giftedList = sm.data.giftedMembers || [];

        circle.members.forEach(m => {
            const row = document.createElement('div');
            row.className = 'saheli-member-item';

            const name = (this.currentLang === 'hi') ? m.nameHi : m.name;
            const isGifted = giftedList.includes(m.id);

            row.innerHTML = `
                <div class="saheli-member-info">
                    <div class="saheli-avatar">${m.avatar}</div>
                    <div>
                        <div style="font-weight: 700; color: var(--text-light);">${name}</div>
                        <div style="color: var(--accent-gold); font-size: 11px;">⭐ ${m.stars} • Lv ${m.level}</div>
                    </div>
                </div>
            `;

            if (m.needsLife) {
                const giftBtn = document.createElement('button');
                giftBtn.className = `btn-gift-life ${isGifted ? 'gifted' : ''}`;
                giftBtn.textContent = isGifted 
                    ? ((this.currentLang === 'hi') ? "✓ भेजा गया" : "✓ Gifted")
                    : ((this.currentLang === 'hi') ? "प्राण दें (+१० 🪙)" : "Gift Life (+10 🪙)");

                if (!isGifted) {
                    giftBtn.onclick = () => this.handleGiftLifeToMember(m.id, giftBtn);
                }
                row.appendChild(giftBtn);
            }

            container.appendChild(row);
        });
    }

    handleGiftLifeToMember(memberId, btnElement) {
        const sm = window.StorageManager;
        if (sm.giftLifeToMember(memberId)) {
            window.AudioEngine.playLevelVictory();
            this.updateHeaderUI();

            if (btnElement) {
                btnElement.className = 'btn-gift-life gifted';
                btnElement.textContent = (this.currentLang === 'hi') ? "✓ भेजा गया" : "✓ Gifted";
                btnElement.onclick = null;
            }

            if (this.renderer) {
                this.renderer.spawnFloatingText(this.renderer.width / 2, 80, "+10 Shagun Coins 🪙", "#FFD700", 20);
            }
        }
    }

    requestSaheliLife() {
        const sm = window.StorageManager;
        sm.requestCircleLives();
        window.AudioEngine.playDiyaLit();
        this.updateSaheliInboxUI();

        const toast = (this.currentLang === 'hi')
            ? "सहेली मंडल को प्राण संदेश भेजा गया!"
            : "Life request sent to your Saheli Circle!";
        alert(toast);
    }

    claimReceivedSaheliGift() {
        const sm = window.StorageManager;
        if (sm.claimCircleGift()) {
            window.AudioEngine.playLevelVictory();
            this.updateHeaderUI();
            this.updateSaheliInboxUI();

            if (this.renderer) {
                this.renderer.spawnFloatingText(this.renderer.width / 2, 80, "+1 Life ❤️", "#EF4444", 22);
            }
        }
    }

    claimSaheliChest() {
        const sm = window.StorageManager;
        if (sm.claimCommunityChest(1, 200, { hammer: 1, anar: 1, swap: 1 })) {
            window.AudioEngine.playFanfare();
            this.updateHeaderUI();
            this.showSaheliModal();

            const toast = (this.currentLang === 'hi')
                ? "बधाई! मंडप खज़ाना प्राप्त हुआ: +२०० सिक्के और ३ सहायक!"
                : "Badhai Ho! Community Chest Claimed: +200 Coins & 3 Boosters!";
            alert(toast);
        }
    }

    shareOnWhatsApp(context = 'invite') {
        let msg = "";
        const url = "https://rangoli-jewel-utsav.vercel.app";

        if (context === 'victory') {
            msg = (this.currentLang === 'hi')
                ? `🎉 मैंने रंगोली उत्सव में स्तर ${this.currentLevelId} पर शानदार विजय पाई है! 🪔✨ मेरे साथ खेलें और सहेली मंडल में शामिल हों: ${url}`
                : `🎉 I achieved victory on Level ${this.currentLevelId} in Rangoli Utsav! 🪔✨ Play with me and join our Saheli Circle: ${url}`;
        } else if (context === 'courtyard') {
            msg = (this.currentLang === 'hi')
                ? `🏛️ मैंने रंगोली उत्सव में हवेली का शाही आँगन सजाया है! 🦚✨ आकर देखें और अपनी हवेली सजाएं: ${url}`
                : `🏛️ I've beautified our Royal Haveli Courtyard in Rangoli Utsav! 🦚✨ Come explore and renovate your own: ${url}`;
        } else {
            msg = (this.currentLang === 'hi')
                ? `👭 सहेली, मेरे साथ "रंगोली उत्सव" खेलो! यहाँ हम मिलकर प्राण और शगुन उपहार भेजते हैं: ${url}`
                : `👭 Saheli, join me in playing "Rangoli Utsav"! We share lives and celebrate festival gifts together: ${url}`;
        }

        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');
    }
}

window.GameController = new GameController();
window.game = window.GameController;
