/**
 * Storage & State Persistence Engine for Rangoli Utsav
 * Handles LocalStorage save-states, energy/heart timers, currency balances,
 * level stars, courtyard renovations, and offline data safety.
 */

const STORAGE_KEY = 'rangoli_utsav_v1_save';

class StorageManager {
    constructor() {
        this.data = this.getDefaultState();
        this.load();
    }

    getDefaultState() {
        return {
            unlockedLevel: 1,
            levelStars: {},       // { levelId: 1..3 }
            levelScores: {},      // { levelId: number }
            coins: 150,           // Starting Shagun Coins
            stars: 0,             // Total stars collected for courtyard
            lives: 5,             // Max lives
            lastLifeTimestamp: Date.now(),
            boosters: {
                hammer: 2,        // Gulal Hammer
                anar: 2,          // Anar Sparkler Bomb
                swap: 2           // Magic Silk Swapper
            },
            courtyardUnlocks: [], // Array of item IDs unlocked
            winStreak: 0,         // Shringaar Blessing Win-Streak
            currentCircleId: 'gulal_queens', // Default Saheli Circle
            claimedChestTiers: [],            // Claimed Community Chest Tiers
            giftedMembers: [],                // Members gifted life today
            pendingReceivedGifts: 1,          // Starting with 1 warm gift from Sunita!
            lastCircleLifeRequest: 0,
            lastDailySpin: 0,
            spinStreak: 1,
            language: 'en',       // 'en' or 'hi'
            soundEnabled: true,
            musicEnabled: true,
            soundVolume: 0.8,     // 0.0 to 1.0
            musicVolume: 0.6,     // 0.0 to 1.0
            hapticsEnabled: true, // Native vibration feedback
            artisanId: '#RU-' + Math.floor(10000 + Math.random() * 90000),
            createdAt: Date.now()
        };
    }

    load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                this.data = { ...this.getDefaultState(), ...parsed };
            }
        } catch (e) {
            console.warn('Storage load failed, using defaults:', e);
            this.data = this.getDefaultState();
        }
        this.updateLivesRegeneration();
    }

    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.warn('Storage save failed:', e);
        }
    }

    // Natural life regeneration: 1 life every 20 minutes (1200000 ms) up to 5
    updateLivesRegeneration() {
        const REGEN_TIME_MS = 20 * 60 * 1000;
        const MAX_LIVES = 5;

        if (this.data.lives >= MAX_LIVES) {
            this.data.lastLifeTimestamp = Date.now();
            return;
        }

        const now = Date.now();
        const elapsed = now - this.data.lastLifeTimestamp;
        const recovered = Math.floor(elapsed / REGEN_TIME_MS);

        if (recovered > 0) {
            this.data.lives = Math.min(MAX_LIVES, this.data.lives + recovered);
            this.data.lastLifeTimestamp = now - (elapsed % REGEN_TIME_MS);
            this.save();
        }
    }

    getTimeUntilNextLife() {
        this.updateLivesRegeneration();
        if (this.data.lives >= 5) return 0;
        const REGEN_TIME_MS = 20 * 60 * 1000;
        const now = Date.now();
        const elapsed = now - this.data.lastLifeTimestamp;
        return Math.max(0, REGEN_TIME_MS - elapsed);
    }

    getTotalTimeUntilFullLives() {
        this.updateLivesRegeneration();
        if (this.data.lives >= 5) return 0;
        const REGEN_TIME_MS = 20 * 60 * 1000;
        const nextTime = this.getTimeUntilNextLife();
        const remainingAfterNext = Math.max(0, 4 - this.data.lives) * REGEN_TIME_MS;
        return nextTime + remainingAfterNext;
    }

    formatTime(ms) {
        if (ms <= 0) return "00:00";
        const totalSec = Math.floor(ms / 1000);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        const mStr = String(mins).padStart(2, '0');
        const sStr = String(secs).padStart(2, '0');
        return `${mStr}:${sStr}`;
    }

    formatDuration(ms) {
        if (ms <= 0) return "0s";
        const totalSec = Math.floor(ms / 1000);
        const hrs = Math.floor(totalSec / 3600);
        const mins = Math.floor((totalSec % 3600) / 60);
        const secs = totalSec % 60;
        if (hrs > 0) {
            return `${hrs}h ${mins}m`;
        }
        if (mins > 0) {
            return `${mins}m ${secs}s`;
        }
        return `${secs}s`;
    }

    deductLife() {
        this.updateLivesRegeneration();
        if (this.data.lives > 0) {
            this.data.lives--;
            if (this.data.lives === 4) {
                this.data.lastLifeTimestamp = Date.now();
            }
            this.save();
            return true;
        }
        return false;
    }

    addLives(count = 1) {
        this.data.lives = Math.min(5, this.data.lives + count);
        this.save();
    }

    addCoins(amount) {
        this.data.coins += amount;
        this.save();
        return this.data.coins;
    }

    deductCoins(amount) {
        if (this.data.coins >= amount) {
            this.data.coins -= amount;
            this.save();
            return true;
        }
        return false;
    }

    recordLevelWin(levelId, stars, score) {
        // Record stars (keep best)
        const currentStars = this.data.levelStars[levelId] || 0;
        if (stars > currentStars) {
            const starGain = stars - currentStars;
            this.data.stars += starGain;
            this.data.levelStars[levelId] = stars;
        }

        // Record high score
        const currentScore = this.data.levelScores[levelId] || 0;
        if (score > currentScore) {
            this.data.levelScores[levelId] = score;
        }

        // Unlock next level
        if (levelId >= this.data.unlockedLevel) {
            this.data.unlockedLevel = levelId + 1;
        }

        // Win Shagun Reward
        this.addCoins(stars * 20);

        // Increment Shringaar Blessing Win-Streak
        this.data.winStreak = (this.data.winStreak || 0) + 1;
        this.save();
    }

    resetWinStreak() {
        this.data.winStreak = 0;
        this.save();
    }

    getStreakTier() {
        const streak = this.data.winStreak || 0;
        if (streak >= 3) return 3;
        if (streak === 2) return 2;
        if (streak === 1) return 1;
        return 0;
    }

    getStreakBonuses() {
        const tier = this.getStreakTier();
        if (tier === 1) return ['chakra'];
        if (tier === 2) return ['chakra', 'anar'];
        if (tier === 3) return ['mayur', 'chakra', 'anar'];
        return [];
    }

    unlockCourtyardItem(itemId, starsCost) {
        if (this.data.courtyardUnlocks.includes(itemId)) return true;
        if (this.data.stars >= starsCost) {
            this.data.courtyardUnlocks.push(itemId);
            this.save();
            return true;
        }
        return false;
    }

    hasBooster(type) {
        return (this.data.boosters[type] || 0) > 0;
    }

    useBooster(type) {
        if (this.hasBooster(type)) {
            this.data.boosters[type]--;
            this.save();
            return true;
        }
        return false;
    }

    addBooster(type, count = 1) {
        this.data.boosters[type] = (this.data.boosters[type] || 0) + count;
        this.save();
    }

    canDailySpin() {
        const ONE_DAY_MS = 20 * 60 * 60 * 1000; // 20 hours window for daily cycle
        return (Date.now() - this.data.lastDailySpin) > ONE_DAY_MS;
    }

    recordDailySpin() {
        this.data.lastDailySpin = Date.now();
        this.save();
    }

    // Pillar 3: Saheli Circle & Community Gifting
    giftLifeToMember(memberId) {
        if (!this.data.giftedMembers) this.data.giftedMembers = [];
        if (this.data.giftedMembers.includes(memberId)) return false;

        this.data.giftedMembers.push(memberId);
        // Gifting a life rewards the player with +10 Shagun Coins (Reciprocity)
        this.addCoins(10);
        this.save();
        return true;
    }

    requestCircleLives() {
        this.data.lastCircleLifeRequest = Date.now();
        // Friendly simulated response from Saheli circle arrives!
        this.data.pendingReceivedGifts = (this.data.pendingReceivedGifts || 0) + 1;
        this.save();
        return true;
    }

    claimCircleGift() {
        if ((this.data.pendingReceivedGifts || 0) > 0) {
            this.addLives(1);
            this.data.pendingReceivedGifts--;
            this.save();
            return true;
        }
        return false;
    }

    isChestClaimed(tier = 1) {
        return (this.data.claimedChestTiers || []).includes(tier);
    }

    claimCommunityChest(tier = 1, rewardCoins = 200, rewardBoosters = { hammer: 1, anar: 1, swap: 1 }) {
        if (this.isChestClaimed(tier)) return false;
        if (!this.data.claimedChestTiers) this.data.claimedChestTiers = [];

        this.data.claimedChestTiers.push(tier);
        this.addCoins(rewardCoins);
        Object.keys(rewardBoosters).forEach(b => {
            this.addBooster(b, rewardBoosters[b]);
        });
        this.save();
        return true;
    }

    // Settings Hub & Preferences
    setVolumes(soundVol, musicVol) {
        if (typeof soundVol === 'number') this.data.soundVolume = Math.max(0, Math.min(1, soundVol));
        if (typeof musicVol === 'number') this.data.musicVolume = Math.max(0, Math.min(1, musicVol));
        this.save();
    }

    setHapticsEnabled(enabled) {
        this.data.hapticsEnabled = !!enabled;
        this.save();
    }

    resetProgress() {
        const artisanId = this.data.artisanId || ('#RU-' + Math.floor(10000 + Math.random() * 90000));
        const language = this.data.language || 'en';
        const soundEnabled = this.data.soundEnabled !== undefined ? this.data.soundEnabled : true;
        const musicEnabled = this.data.musicEnabled !== undefined ? this.data.musicEnabled : true;
        const soundVolume = this.data.soundVolume !== undefined ? this.data.soundVolume : 0.8;
        const musicVolume = this.data.musicVolume !== undefined ? this.data.musicVolume : 0.6;
        const hapticsEnabled = this.data.hapticsEnabled !== undefined ? this.data.hapticsEnabled : true;

        this.data = {
            ...this.getDefaultState(),
            artisanId,
            language,
            soundEnabled,
            musicEnabled,
            soundVolume,
            musicVolume,
            hapticsEnabled
        };
        this.save();
        return this.data;
    }
}

window.StorageManager = new StorageManager();
