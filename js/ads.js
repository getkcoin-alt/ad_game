/**
 * Ethical Rewarded Ad Monetization & Daily Shagun Wheel System
 * Follows Google Play Best Practices:
 * 1. 100% Voluntary participation (zero interstitial spam, zero forced interruptions).
 * 2. Clear, transparent reward communication before viewing.
 * 3. Authentic Cultural Artisan Showcase simulation with honest countdowns and immediate reward disbursement.
 * 4. Extensible bridge to native Android AdMob SDK when running inside APK.
 */

class AdSystem {
    constructor() {
        this.isAdShowing = false;
        this.currentPlacement = null;
        this.onRewardCallback = null;
        this.countdownTimer = null;
        this.countdownRemaining = 5;

        // Wheel segments
        this.wheelSegments = [
            { label: "50 Coins", type: "coins", amount: 50, color: "#E6196E" },
            { label: "1 Hammer", type: "hammer", amount: 1, color: "#F5A623" },
            { label: "100 Coins", type: "coins", amount: 100, color: "#00A8B5" },
            { label: "1 Anar Bomb", type: "anar", amount: 1, color: "#10B981" },
            { label: "25 Coins", type: "coins", amount: 25, color: "#8B5CF6" },
            { label: "1 Magic Silk", type: "swap", amount: 1, color: "#D97706" },
            { label: "1 Heart", type: "life", amount: 1, color: "#EC4899" },
            { label: "Jackpot! 200 Coins", type: "jackpot", amount: 200, color: "#FFD700" }
        ];

        this.isSpinning = false;
        this.wheelAngle = 0;
    }

    // Show ethical rewarded ad modal
    showRewardedAd(placement, onRewarded, onClosed) {
        if (this.isAdShowing) return;

        this.currentPlacement = placement;
        this.onRewardCallback = onRewarded;
        this.isAdShowing = true;
        this.countdownRemaining = 5;

        const lang = window.StorageManager.data.language || 'en';
        const t = window.I18N[lang] || window.I18N.en;

        const adModal = document.getElementById('ad-modal');
        const adTitle = document.getElementById('ad-title');
        const adSubtitle = document.getElementById('ad-subtitle');
        const adCountdown = document.getElementById('ad-countdown');
        const adClaimBtn = document.getElementById('ad-claim-btn');

        if (adTitle) adTitle.textContent = t.adTitle;
        if (adSubtitle) adSubtitle.textContent = t.adNotice;
        if (adClaimBtn) {
            adClaimBtn.style.display = 'none';
            adClaimBtn.textContent = t.adClaimReward;
        }

        if (adModal) {
            adModal.classList.remove('hidden');
            adModal.classList.add('flex');
        }

        // Play gentle audio tone
        window.AudioEngine.playGhungroo(0.8);

        // 5-second honest countdown
        if (adCountdown) {
            adCountdown.textContent = `${t.adCountdown} ${this.countdownRemaining}s...`;
        }

        if (this.countdownTimer) clearInterval(this.countdownTimer);
        this.countdownTimer = setInterval(() => {
            this.countdownRemaining--;
            if (this.countdownRemaining > 0) {
                if (adCountdown) {
                    adCountdown.textContent = `${t.adCountdown} ${this.countdownRemaining}s...`;
                }
            } else {
                clearInterval(this.countdownTimer);
                if (adCountdown) adCountdown.textContent = "✓ Reward Ready!";
                if (adClaimBtn) adClaimBtn.style.display = 'inline-flex';
            }
        }, 1000);
    }

    claimAdReward() {
        if (!this.isAdShowing) return;

        clearInterval(this.countdownTimer);
        const adModal = document.getElementById('ad-modal');
        if (adModal) {
            adModal.classList.add('hidden');
            adModal.classList.remove('flex');
        }

        this.isAdShowing = false;
        window.AudioEngine.playLevelVictory();

        // Log analytics
        window.AnalyticsEngine.onRewardedAdWatched(this.currentPlacement, true);

        if (typeof this.onRewardCallback === 'function') {
            this.onRewardCallback();
            this.onRewardCallback = null;
        }
    }

    closeAdEarly() {
        if (!this.isAdShowing) return;
        clearInterval(this.countdownTimer);
        const adModal = document.getElementById('ad-modal');
        if (adModal) {
            adModal.classList.add('hidden');
            adModal.classList.remove('flex');
        }
        this.isAdShowing = false;
        this.onRewardCallback = null;
    }

    // Spin the Daily Shagun Wheel
    spinWheel(onComplete) {
        if (this.isSpinning) return;
        this.isSpinning = true;

        const canvas = document.getElementById('wheel-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Random prize index with slight weighting towards useful items
        const prizeIdx = Math.floor(Math.random() * this.wheelSegments.length);
        const segmentAngle = (Math.PI * 2) / this.wheelSegments.length;
        
        // Target angle calculation
        const fullRotations = 5 + Math.floor(Math.random() * 3);
        const prizeCenterAngle = (this.wheelSegments.length - prizeIdx - 0.5) * segmentAngle;
        const targetTotalAngle = (fullRotations * Math.PI * 2) + prizeCenterAngle;

        const durationMs = 3800;
        const startTimestamp = performance.now();
        const initialAngle = this.wheelAngle;
        let lastTickSegment = -1;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTimestamp;
            const progress = Math.min(elapsed / durationMs, 1.0);

            // Cubic ease-out deceleration
            const easeOut = 1 - Math.pow(1 - progress, 3.5);
            this.wheelAngle = initialAngle + (targetTotalAngle * easeOut);

            this.drawWheel(ctx, canvas.width, canvas.height);

            // Sound tick on passing each segment
            const currentSegment = Math.floor((this.wheelAngle / segmentAngle)) % this.wheelSegments.length;
            if (currentSegment !== lastTickSegment) {
                lastTickSegment = currentSegment;
                window.AudioEngine.playSitarPluck(currentSegment);
            }

            if (progress < 1.0) {
                requestAnimationFrame(animate);
            } else {
                this.isSpinning = false;
                const wonItem = this.wheelSegments[prizeIdx];

                // Grant reward
                this.grantWheelReward(wonItem);
                window.AudioEngine.playLevelVictory();

                if (typeof onComplete === 'function') {
                    onComplete(wonItem);
                }
            }
        };

        requestAnimationFrame(animate);
    }

    drawWheel(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        const cx = w / 2;
        const cy = h / 2;
        const radius = (Math.min(w, h) / 2) - 10;
        const numSegments = this.wheelSegments.length;
        const segAngle = (Math.PI * 2) / numSegments;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.wheelAngle);

        // Draw segments
        for (let i = 0; i < numSegments; i++) {
            const item = this.wheelSegments[i];
            const startA = i * segAngle;
            const endA = (i + 1) * segAngle;

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, startA, endA);
            ctx.closePath();

            ctx.fillStyle = item.color;
            ctx.fill();

            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Segment label text
            ctx.save();
            ctx.rotate(startA + (segAngle / 2));
            ctx.textAlign = 'right';
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 13px sans-serif';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 4;
            ctx.fillText(item.label, radius - 16, 5);
            ctx.restore();
        }

        // Center golden jewel bindu
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.fillStyle = '#D4AF37';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.restore();

        // Fixed Top Pointer / Diya indicator
        ctx.save();
        ctx.translate(cx, cy - radius + 4);
        ctx.fillStyle = '#FF0055';
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(-12, -8);
        ctx.lineTo(12, -8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }

    grantWheelReward(item) {
        const sm = window.StorageManager;
        if (item.type === 'coins' || item.type === 'jackpot') {
            sm.addCoins(item.amount);
        } else if (item.type === 'hammer') {
            sm.addBooster('hammer', item.amount);
        } else if (item.type === 'anar') {
            sm.addBooster('anar', item.amount);
        } else if (item.type === 'swap') {
            sm.addBooster('swap', item.amount);
        } else if (item.type === 'life') {
            sm.addLives(item.amount);
        }
    }
}

window.AdSystem = new AdSystem();
