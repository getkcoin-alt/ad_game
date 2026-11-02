/**
 * Haveli Courtyard Renovation & Metagame Engine for Rangoli Utsav
 * Visualizes the player's personal sanctuary, unlocking architectural marvels
 * (marble floor, lotus fountain, peacock rangoli, marigold toran, silver jhula, deepstambha)
 * with stars earned through puzzle mastery.
 */

class CourtyardManager {
    constructor(canvasId) {
        this.canvasId = canvasId;
        this.canvas = null;
        this.ctx = null;
        this.animTime = 0;
        this.swingOffset = 0;
        this.fountainRipples = [];
        this.activeItemDetail = null;
    }

    init() {
        this.canvas = document.getElementById(this.canvasId);
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            window.addEventListener('resize', () => this.resize());
            if (typeof ResizeObserver !== 'undefined' && this.canvas.parentElement) {
                new ResizeObserver(() => this.resize()).observe(this.canvas.parentElement);
            }
            this.resize();
        }
    }

    resize() {
        if (!this.canvas) return;
        const container = this.canvas.parentElement;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = Math.floor(rect.width * dpr);
        this.canvas.height = Math.floor(rect.height * dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';

        if (this.ctx) {
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        this.render();
    }

    render() {
        if (!this.canvas || !this.ctx) return;
        const w = this.canvas.width / (window.devicePixelRatio || 1);
        const h = this.canvas.height / (window.devicePixelRatio || 1);

        this.animTime += 0.03;
        this.ctx.clearRect(0, 0, w, h);

        const sm = window.StorageManager;
        const unlocked = sm.data.courtyardUnlocks || [];

        // 1. Sky & Haveli Royal Archways
        this.drawHaveliArchitecture(w, h);

        // 2. Marble Floor (if unlocked)
        const hasFloor = unlocked.includes('marble_floor');
        this.drawMarbleFloor(w, h, hasFloor);

        // 3. Peacock Rangoli Centerpiece (if unlocked)
        const hasRangoli = unlocked.includes('peacock_rangoli');
        if (hasRangoli) {
            this.drawPeacockRangoli(w / 2, h * 0.72, Math.min(w, h) * 0.22);
        }

        // 4. Brass Lotus Fountain (if unlocked)
        const hasFountain = unlocked.includes('lotus_fountain');
        if (hasFountain) {
            this.drawLotusFountain(w / 2, h * 0.52, Math.min(w, h) * 0.16);
        }

        // 5. Marigold Toran Garlands (if unlocked)
        const hasToran = unlocked.includes('marigold_toran');
        if (hasToran) {
            this.drawMarigoldToran(w, h);
        }

        // 6. Royal Silver Jhula (if unlocked)
        const hasJhula = unlocked.includes('royal_jhula');
        if (hasJhula) {
            this.drawSilverJhula(w * 0.2, h * 0.62, Math.min(w, h) * 0.15);
        }

        // 7. Illuminated Deepstambha / Diyas (if unlocked)
        const hasDiyas = unlocked.includes('evening_diyas');
        if (hasDiyas) {
            this.drawDeepstambha(w * 0.8, h * 0.62, Math.min(w, h) * 0.15);
        }

        // Render ambient floating rose petals
        this.drawAmbientPetals(w, h);
    }

    drawHaveliArchitecture(w, h) {
        // Sunset sky background gradient (Warm Saffron to Royal Violet)
        const skyGrad = this.ctx.createLinearGradient(0, 0, 0, h * 0.65);
        skyGrad.addColorStop(0, '#31103F'); // Royal Violet
        skyGrad.addColorStop(0.4, '#6B1B4A'); // Rani Pink
        skyGrad.addColorStop(0.85, '#D97706'); // Warm Amber
        skyGrad.addColorStop(1, '#FEF3C7'); // Warm Saffron White

        this.ctx.fillStyle = skyGrad;
        this.ctx.fillRect(0, 0, w, h * 0.65);

        // Haveli Mughal / Rajput carved sandstone archways
        this.ctx.fillStyle = '#831843'; // Sandstone maroon
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(w * 0.18, 0);
        this.ctx.quadraticCurveTo(w * 0.25, h * 0.25, 0, h * 0.35);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.moveTo(w, 0);
        this.ctx.lineTo(w * 0.82, 0);
        this.ctx.quadraticCurveTo(w * 0.75, h * 0.25, w, h * 0.35);
        this.ctx.closePath();
        this.ctx.fill();

        // Top royal arch
        this.ctx.beginPath();
        this.ctx.moveTo(w * 0.15, 0);
        this.ctx.bezierCurveTo(w * 0.3, h * 0.18, w * 0.45, h * 0.08, w * 0.5, h * 0.2);
        this.ctx.bezierCurveTo(w * 0.55, h * 0.08, w * 0.7, h * 0.18, w * 0.85, 0);
        this.ctx.closePath();
        this.ctx.fillStyle = '#9D174D';
        this.ctx.fill();
        this.ctx.strokeStyle = '#FBBF24';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }

    drawMarbleFloor(w, h, isUnlocked) {
        const floorY = h * 0.55;
        const floorH = h - floorY;

        if (isUnlocked) {
            // Pristine Makrana marble floor with warm golden jaali grid
            const marbleGrad = this.ctx.createLinearGradient(0, floorY, 0, h);
            marbleGrad.addColorStop(0, '#FDFBF7');
            marbleGrad.addColorStop(0.5, '#F5EDE0');
            marbleGrad.addColorStop(1, '#E6DAC8');

            this.ctx.fillStyle = marbleGrad;
            this.ctx.fillRect(0, floorY, w, floorH);

            // Marble isometric grid lines
            this.ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
            this.ctx.lineWidth = 1.5;
            for (let x = -w; x < w * 2; x += 45) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, floorY);
                this.ctx.lineTo(x + (floorH * 0.7), h);
                this.ctx.stroke();

                this.ctx.beginPath();
                this.ctx.moveTo(x, floorY);
                this.ctx.lineTo(x - (floorH * 0.7), h);
                this.ctx.stroke();
            }
        } else {
            // Unrenovated rustic stone floor
            this.ctx.fillStyle = '#4B2538';
            this.ctx.fillRect(0, floorY, w, floorH);
        }
    }

    drawPeacockRangoli(cx, cy, radius) {
        this.ctx.save();
        this.ctx.translate(cx, cy);

        // Outer gulal mandala ring
        const petals = 16;
        for (let i = 0; i < petals; i++) {
            const a = (i * Math.PI * 2) / petals;
            this.ctx.fillStyle = (i % 2 === 0) ? '#E6196E' : '#F5A623';
            this.ctx.beginPath();
            this.ctx.arc(Math.cos(a) * radius, Math.sin(a) * (radius * 0.6), radius * 0.22, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Inner peacock blue circle
        this.ctx.fillStyle = '#00A8B5';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, radius * 0.65, radius * 0.4, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Golden center star
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, radius * 0.3, radius * 0.18, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    drawLotusFountain(cx, cy, size) {
        this.ctx.save();
        this.ctx.translate(cx, cy);

        // Brass basin
        this.ctx.fillStyle = '#D97706';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 8, size, size * 0.45, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Fountain water
        this.ctx.fillStyle = '#38BDF8';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 4, size * 0.85, size * 0.35, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Floating pink lotus petals
        this.ctx.fillStyle = '#F472B6';
        for (let i = 0; i < 5; i++) {
            const a = (i * Math.PI * 2) / 5 + (this.animTime * 0.2);
            this.ctx.beginPath();
            this.ctx.ellipse(Math.cos(a) * (size * 0.4), Math.sin(a) * (size * 0.18) + 4, size * 0.14, size * 0.08, a, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Central bubbling water spout
        const waterHeight = size * 0.5 + Math.sin(this.animTime * 6) * 4;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 4);
        this.ctx.lineTo(0, -waterHeight);
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawMarigoldToran(w, h) {
        this.ctx.save();
        const archY = h * 0.18;
        const count = 14;

        this.ctx.strokeStyle = '#15803D'; // Green mango leaf rope
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();
        this.ctx.moveTo(w * 0.1, archY);
        this.ctx.quadraticCurveTo(w * 0.5, archY + 35, w * 0.9, archY);
        this.ctx.stroke();

        // Hanging Marigold flowers
        for (let i = 0; i <= count; i++) {
            const t = i / count;
            const x = (1 - t) * (1 - t) * (w * 0.1) + 2 * (1 - t) * t * (w * 0.5) + t * t * (w * 0.9);
            const y = (1 - t) * (1 - t) * archY + 2 * (1 - t) * t * (archY + 35) + t * t * archY;

            this.ctx.fillStyle = (i % 2 === 0) ? '#EA580C' : '#FBBF24';
            this.ctx.beginPath();
            this.ctx.arc(x, y + 10, 8, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }

    drawSilverJhula(cx, cy, size) {
        this.ctx.save();
        this.ctx.translate(cx, cy);

        // Silver carved pillars
        this.ctx.strokeStyle = '#CBD5E1';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(-size * 0.6, -size * 1.1);
        this.ctx.lineTo(-size * 0.6, size * 0.7);
        this.ctx.moveTo(size * 0.6, -size * 1.1);
        this.ctx.lineTo(size * 0.6, size * 0.7);
        this.ctx.stroke();

        // Top beam
        this.ctx.beginPath();
        this.ctx.moveTo(-size * 0.75, -size * 1.1);
        this.ctx.lineTo(size * 0.75, -size * 1.1);
        this.ctx.stroke();

        // Swaying swing seat
        const sway = Math.sin(this.animTime * 1.8) * (size * 0.08);
        this.ctx.strokeStyle = '#94A3B8';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(-size * 0.4, -size * 1.1);
        this.ctx.lineTo(-size * 0.35 + sway, size * 0.2);
        this.ctx.moveTo(size * 0.4, -size * 1.1);
        this.ctx.lineTo(size * 0.35 + sway, size * 0.2);
        this.ctx.stroke();

        // Swing seat with velvet cushion
        this.ctx.fillStyle = '#831843'; // Royal velvet
        this.ctx.fillRect(-size * 0.45 + sway, size * 0.2, size * 0.9, size * 0.18);

        this.ctx.restore();
    }

    drawDeepstambha(cx, cy, size) {
        this.ctx.save();
        this.ctx.translate(cx, cy);

        // Brass central pillar
        this.ctx.fillStyle = '#B45309';
        this.ctx.fillRect(-6, -size * 0.9, 12, size * 1.6);

        // 3 tiers of Diyas
        const tiers = [-size * 0.7, -size * 0.3, size * 0.1];
        tiers.forEach((ty, idx) => {
            const tierW = size * (0.8 - idx * 0.15);
            this.ctx.fillStyle = '#D97706';
            this.ctx.fillRect(-tierW / 2, ty, tierW, 6);

            // Glowing flames on left and right
            [-tierW / 2, tierW / 2].forEach(fx => {
                const flicker = Math.sin(this.animTime * 9 + fx) * 2;
                this.ctx.fillStyle = '#F59E0B';
                this.ctx.beginPath();
                this.ctx.arc(fx, ty - 6 + flicker, 8, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#FEF3C7';
                this.ctx.beginPath();
                this.ctx.arc(fx, ty - 6 + flicker, 4, 0, Math.PI * 2);
                this.ctx.fill();
            });
        });

        this.ctx.restore();
    }

    drawAmbientPetals(w, h) {
        for (let i = 0; i < 6; i++) {
            const px = (w * 0.1) + ((i * 137 + this.animTime * 25) % (w * 0.8));
            const py = (h * 0.2) + ((i * 93 + this.animTime * 18) % (h * 0.7));

            this.ctx.fillStyle = 'rgba(244, 114, 182, 0.65)';
            this.ctx.beginPath();
            this.ctx.ellipse(px, py, 5, 3, this.animTime + i, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
}

window.CourtyardManager = CourtyardManager;
