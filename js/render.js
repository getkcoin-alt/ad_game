/**
 * High-Performance Canvas 2D Rendering & Particle Engine for Rangoli Utsav
 * Renders ornate Indian Kundan/Meenakari jewels, glowing clay Diyas, Marigold blossoms,
 * multi-layered particle bursts (Gulal powder puffs, golden embers, peacock feathers),
 * and dynamic juice effects (squash/stretch, screen shake, floating accolades).
 */

class GameRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.dpr = window.devicePixelRatio || 1;
        
        // Dimensions
        this.width = 0;
        this.height = 0;
        this.cellSize = 0;
        this.boardX = 0;
        this.boardY = 0;
        this.boardSize = 0;

        // Particle System
        this.particles = [];
        this.floatingTexts = [];
        this.screenShake = 0;
        this.globalTime = 0;

        this.initResize();
    }

    initResize() {
        this.resize = () => {
            const container = this.canvas.parentElement;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {
                return;
            }

            this.width = rect.width;
            this.height = rect.height;

            this.canvas.width = Math.floor(this.width * this.dpr);
            this.canvas.height = Math.floor(this.height * this.dpr);
            this.canvas.style.width = this.width + 'px';
            this.canvas.style.height = this.height + 'px';

            this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

            // Compute 8x8 board layout inside container
            const padding = 12;
            const availableSize = Math.min(this.width - (padding * 2), this.height - (padding * 2));
            this.boardSize = Math.max(availableSize, 260);
            this.cellSize = this.boardSize / 8;
            this.boardX = (this.width - this.boardSize) / 2;
            this.boardY = (this.height - this.boardSize) / 2;
        };

        window.addEventListener('resize', () => this.resize());
        if (typeof ResizeObserver !== 'undefined' && this.canvas.parentElement) {
            new ResizeObserver(() => this.resize()).observe(this.canvas.parentElement);
        }
        this.resize();
    }

    addScreenShake(amount = 6) {
        this.screenShake = Math.max(this.screenShake, amount);
    }

    // Add Gulal powder puff particle explosion
    spawnGulalExplosion(x, y, colorHex, count = 16) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 4.5;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 4 + Math.random() * 8,
                color: colorHex,
                alpha: 1.0,
                decay: 0.02 + Math.random() * 0.03,
                type: 'powder'
            });
        }
    }

    // Add Sparkler / Diya flame golden ember particles
    spawnGoldenEmbers(x, y, count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2.0 + Math.random() * 5.0;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.0, // slight upward float
                size: 2.5 + Math.random() * 4,
                color: '#FFD700',
                alpha: 1.0,
                decay: 0.025 + Math.random() * 0.02,
                type: 'spark'
            });
        }
    }

    // Add fluttering Marigold petal particles
    spawnMarigoldPetals(x, y, count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.0 + Math.random() * 3.0;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed + 0.5,
                rot: Math.random() * Math.PI * 2,
                vrot: (Math.random() - 0.5) * 0.2,
                size: 6 + Math.random() * 6,
                color: Math.random() > 0.4 ? '#FF9900' : '#FFD700',
                alpha: 1.0,
                decay: 0.018 + Math.random() * 0.015,
                type: 'petal'
            });
        }
    }

    // Add floating accolade or score text
    spawnFloatingText(x, y, text, color = '#FFD700', size = 20) {
        this.floatingTexts.push({
            x, y,
            text,
            color,
            size,
            alpha: 1.0,
            vy: -1.8,
            life: 1.0
        });
    }

    // Main render frame
    render(grid, selectedCell, hintMove) {
        this.globalTime += 0.025;
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Apply screen shake
        this.ctx.save();
        if (this.screenShake > 0.1) {
            const sx = (Math.random() - 0.5) * this.screenShake;
            const sy = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(sx, sy);
            this.screenShake *= 0.88;
        }

        // Draw Haveli decorative board border & background
        this.drawBoardBackground();

        // Draw Under-Tile Obstacles (Diyas)
        this.drawDiyas(grid);

        // Draw Board Tiles & Gems
        this.drawGems(grid, selectedCell, hintMove);

        // Draw Animated Hint Arrow
        if (hintMove && hintMove.length === 2) {
            this.drawHintArrow(hintMove[0], hintMove[1]);
        }

        // Draw Over-Tile Obstacles (Marigold blooms)
        this.drawMarigolds(grid);

        // Draw Particles
        this.updateAndDrawParticles();

        // Draw Floating Accolades
        this.updateAndDrawFloatingTexts();

        this.ctx.restore();
    }

    drawHintArrow(p1, p2) {
        const cs = this.cellSize;
        const x1 = this.boardX + (p1.c * cs) + (cs / 2);
        const y1 = this.boardY + (p1.r * cs) + (cs / 2);
        const x2 = this.boardX + (p2.c * cs) + (cs / 2);
        const y2 = this.boardY + (p2.r * cs) + (cs / 2);

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const pulse = Math.abs(Math.sin(this.globalTime * 6)) * (cs * 0.08);

        this.ctx.save();
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.lineWidth = 3.5;
        this.ctx.shadowColor = 'rgba(255, 215, 0, 0.9)';
        this.ctx.shadowBlur = 12;

        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(midX, midY, 6 + pulse, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#D97706';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawBoardBackground() {
        const bx = this.boardX;
        const by = this.boardY;
        const bs = this.boardSize;

        // Shadow & glow
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(255, 215, 0, 0.25)';
        this.ctx.shadowBlur = 18;
        this.ctx.fillStyle = 'rgba(34, 9, 32, 0.85)';
        this.roundRect(bx - 6, by - 6, bs + 12, bs + 12, 18);
        this.ctx.fill();

        // Ornate golden filigree border
        this.ctx.strokeStyle = '#D4AF37';
        this.ctx.lineWidth = 3;
        this.roundRect(bx - 4, by - 4, bs + 8, bs + 8, 16);
        this.ctx.stroke();

        this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
        this.ctx.lineWidth = 1;
        this.roundRect(bx - 1, by - 1, bs + 2, bs + 2, 14);
        this.ctx.stroke();
        this.ctx.restore();

        // Draw alternating checker tiles for visual depth and clarity
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const tx = bx + (c * this.cellSize);
                const ty = by + (r * this.cellSize);
                const isEven = (r + c) % 2 === 0;

                this.ctx.fillStyle = isEven ? 'rgba(56, 14, 50, 0.55)' : 'rgba(42, 10, 38, 0.55)';
                this.roundRect(tx + 2, ty + 2, this.cellSize - 4, this.cellSize - 4, 8);
                this.ctx.fill();

                // Subtle inner grid border
                this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.12)';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
        }
    }

    drawDiyas(grid) {
        const bx = this.boardX;
        const by = this.boardY;
        const cs = this.cellSize;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = grid.get(r, c);
                if (!cell || cell.diya === OBSTACLE_TYPES.NONE) continue;

                const cx = bx + (c * cs) + (cs / 2);
                const cy = by + (r * cs) + (cs / 2);
                const isLit = cell.diya === OBSTACLE_TYPES.DIYA_LIT;

                this.ctx.save();
                this.ctx.translate(cx, cy);

                // Diya clay bowl
                this.ctx.fillStyle = isLit ? '#D97706' : '#78350F';
                this.ctx.beginPath();
                this.ctx.ellipse(0, 8, cs * 0.35, cs * 0.18, 0, 0, Math.PI);
                this.ctx.fill();

                // Diya rim
                this.ctx.strokeStyle = isLit ? '#FBBF24' : '#92400E';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();

                if (isLit) {
                    // Radiant warm Diya glow
                    const flicker = Math.sin(this.globalTime * 8 + r * 2 + c) * 2;
                    const glowGrad = this.ctx.createRadialGradient(0, -2, 2, 0, -2, cs * 0.5 + flicker);
                    glowGrad.addColorStop(0, 'rgba(255, 235, 120, 0.9)');
                    glowGrad.addColorStop(0.4, 'rgba(245, 158, 11, 0.5)');
                    glowGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');

                    this.ctx.fillStyle = glowGrad;
                    this.ctx.beginPath();
                    this.ctx.arc(0, -2, cs * 0.5 + flicker, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Flame droplet
                    this.ctx.fillStyle = '#FFFBEB';
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, -14 + (flicker * 0.5));
                    this.ctx.quadraticCurveTo(6, -2, 0, 4);
                    this.ctx.quadraticCurveTo(-6, -2, 0, -14 + (flicker * 0.5));
                    this.ctx.fill();
                } else {
                    // Unlit wick
                    this.ctx.fillStyle = '#374151';
                    this.ctx.fillRect(-1.5, 0, 3, 6);
                }

                this.ctx.restore();
            }
        }
    }

    drawGems(grid, selectedCell, hintMove) {
        const bx = this.boardX;
        const by = this.boardY;
        const cs = this.cellSize;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = grid.get(r, c);
                if (!cell || !cell.gem) continue;

                const gem = cell.gem;
                
                // Interpolate animation offsets
                gem.animX *= 0.72;
                gem.animY *= 0.72;
                if (Math.abs(gem.animX) < 0.01) gem.animX = 0;
                if (Math.abs(gem.animY) < 0.01) gem.animY = 0;

                const cx = bx + (c * cs) + (cs / 2) + (gem.animX * cs);
                const cy = by + (r * cs) + (cs / 2) + (gem.animY * cs);

                const isSelected = selectedCell && selectedCell.r === r && selectedCell.c === c;
                const isHint = hintMove && hintMove.some(h => h.r === r && h.c === c);

                this.drawSingleGem(cx, cy, cs * 0.82, gem, isSelected, isHint);
            }
        }
    }

    drawSingleGem(cx, cy, size, gem, isSelected, isHint) {
        const def = GEM_TYPES[gem.type] || GEM_TYPES[0];
        const r = size / 2;

        this.ctx.save();
        this.ctx.translate(cx, cy);

        // Selection highlight ring
        if (isSelected) {
            const pulse = 1.0 + Math.sin(this.globalTime * 10) * 0.08;
            this.ctx.scale(pulse, pulse);
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 3.5;
            this.ctx.shadowColor = '#FFD700';
            this.ctx.shadowBlur = 14;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, r + 4, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        // Idle hint pulse
        if (isHint) {
            const hintPulse = 1.0 + Math.sin(this.globalTime * 6) * 0.12;
            this.ctx.scale(hintPulse, hintPulse);
            this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.85)';
            this.ctx.lineWidth = 2.5;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, r + 3, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        // Special gem spinning aura
        if (gem.special !== SPECIAL_TYPES.NORMAL) {
            this.drawSpecialAura(gem.special, r);
        }

        // Jewel base shadow
        this.ctx.shadowColor = def.glow;
        this.ctx.shadowBlur = 8;

        // Render Faceted Jewel by Gem Type
        switch (gem.type) {
            case 0: // Ruby / Lotus Cushion
                this.drawRubyCushion(r, def);
                break;
            case 1: // Topaz / Octagon
                this.drawTopazOctagon(r, def);
                break;
            case 2: // Sapphire / Peacock Teardrop
                this.drawSapphireTeardrop(r, def);
                break;
            case 3: // Emerald / Square Cut
                this.drawEmeraldSquare(r, def);
                break;
            case 4: // Amethyst / Paisley Hexagon
                this.drawAmethystHex(r, def);
                break;
            case 5: // Diamond / Pearl Circle
                this.drawPearlCircle(r, def);
                break;
            default:
                this.drawPearlCircle(r, def);
        }

        // Draw Special Gem Overlays (Chakra Sun, Anar Sparkler, Mayur Rainbow)
        if (gem.special === SPECIAL_TYPES.CHAKRA_ROW) {
            this.drawChakraIcon('H', r);
        } else if (gem.special === SPECIAL_TYPES.CHAKRA_COL) {
            this.drawChakraIcon('V', r);
        } else if (gem.special === SPECIAL_TYPES.ANAR_BOMB) {
            this.drawAnarBombIcon(r);
        } else if (gem.special === SPECIAL_TYPES.MAYUR_RAINBOW) {
            this.drawMayurRainbowIcon(r);
        }

        this.ctx.restore();
    }

    drawSpecialAura(specialType, r) {
        const rot = this.globalTime * 2.5;
        this.ctx.save();

        // Pulsing glow ring indicating "Tap to activate!" (Royal Match affordance)
        const pulse = 1.0 + Math.sin(this.globalTime * 5) * 0.08;
        this.ctx.strokeStyle = (specialType === SPECIAL_TYPES.MAYUR_RAINBOW) ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 215, 0, 0.85)';
        this.ctx.lineWidth = 1.8;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, (r + 4) * pulse, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.rotate(rot);

        if (specialType === SPECIAL_TYPES.MAYUR_RAINBOW) {
            // Radiant iridescent rainbow aura
            for (let i = 0; i < 6; i++) {
                const a = (i * Math.PI) / 3;
                this.ctx.strokeStyle = GEM_TYPES[i].color;
                this.ctx.lineWidth = 2.8;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, r + 2 + Math.sin(this.globalTime * 4 + i) * 2, a, a + 0.6);
                this.ctx.stroke();
            }
        } else {
            // Golden spinning sunray aura
            this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
            this.ctx.lineWidth = 2.2;
            for (let i = 0; i < 8; i++) {
                const a = (i * Math.PI) / 4;
                this.ctx.beginPath();
                this.ctx.moveTo(Math.cos(a) * (r - 2), Math.sin(a) * (r - 2));
                this.ctx.lineTo(Math.cos(a) * (r + 5), Math.sin(a) * (r + 5));
                this.ctx.stroke();
            }
        }
        this.ctx.restore();
    }

    drawRubyCushion(r, def) {
        const rad = r * 0.88;
        const grad = this.ctx.createLinearGradient(-rad, -rad, rad, rad);
        grad.addColorStop(0, def.highlightColor);
        grad.addColorStop(0.3, def.secondaryColor);
        grad.addColorStop(1, def.color);

        this.ctx.fillStyle = grad;
        this.roundRect(-rad, -rad, rad * 2, rad * 2, rad * 0.5);
        this.ctx.fill();

        // Facet lines
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        this.ctx.lineWidth = 1.5;
        this.roundRect(-rad * 0.55, -rad * 0.55, rad * 1.1, rad * 1.1, rad * 0.3);
        this.ctx.stroke();

        // Lotus petal flourish
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        this.ctx.beginPath();
        this.ctx.arc(0, -rad * 0.15, rad * 0.22, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawTopazOctagon(r, def) {
        const rad = r * 0.9;
        this.ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const x = Math.cos(angle) * rad;
            const y = Math.sin(angle) * rad;
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();

        const grad = this.ctx.createRadialGradient(-rad * 0.2, -rad * 0.2, 2, 0, 0, rad);
        grad.addColorStop(0, def.highlightColor);
        grad.addColorStop(0.4, def.secondaryColor);
        grad.addColorStop(1, def.color);
        this.ctx.fillStyle = grad;
        this.ctx.fill();

        // Inner table facet
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const x = Math.cos(angle) * (rad * 0.55);
            const y = Math.sin(angle) * (rad * 0.55);
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();
        this.ctx.stroke();
    }

    drawSapphireTeardrop(r, def) {
        const rad = r * 0.92;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -rad);
        this.ctx.bezierCurveTo(rad * 0.8, -rad * 0.2, rad * 0.8, rad * 0.7, 0, rad);
        this.ctx.bezierCurveTo(-rad * 0.8, rad * 0.7, -rad * 0.8, -rad * 0.2, 0, -rad);
        this.ctx.closePath();

        const grad = this.ctx.createLinearGradient(0, -rad, 0, rad);
        grad.addColorStop(0, def.highlightColor);
        grad.addColorStop(0.3, def.secondaryColor);
        grad.addColorStop(1, def.color);
        this.ctx.fillStyle = grad;
        this.ctx.fill();

        // Peacock eye center
        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.75)';
        this.ctx.beginPath();
        this.ctx.ellipse(0, rad * 0.15, rad * 0.3, rad * 0.42, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#064E3B';
        this.ctx.beginPath();
        this.ctx.arc(0, rad * 0.15, rad * 0.18, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawEmeraldSquare(r, def) {
        const rad = r * 0.85;
        const grad = this.ctx.createLinearGradient(-rad, -rad, rad, rad);
        grad.addColorStop(0, def.highlightColor);
        grad.addColorStop(0.4, def.secondaryColor);
        grad.addColorStop(1, def.color);

        this.ctx.fillStyle = grad;
        this.roundRect(-rad, -rad, rad * 2, rad * 2, 6);
        this.ctx.fill();

        // Classic step cut lines
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        this.ctx.lineWidth = 1.5;
        this.roundRect(-rad * 0.6, -rad * 0.6, rad * 1.2, rad * 1.2, 4);
        this.ctx.stroke();

        this.roundRect(-rad * 0.3, -rad * 0.3, rad * 0.6, rad * 0.6, 2);
        this.ctx.stroke();
    }

    drawAmethystHex(r, def) {
        const rad = r * 0.88;
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = Math.cos(angle) * rad;
            const y = Math.sin(angle) * rad;
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();

        const grad = this.ctx.createRadialGradient(0, 0, 2, 0, 0, rad);
        grad.addColorStop(0, def.highlightColor);
        grad.addColorStop(0.5, def.secondaryColor);
        grad.addColorStop(1, def.color);
        this.ctx.fillStyle = grad;
        this.ctx.fill();

        // Inner paisley curve
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, rad * 0.48, 0, Math.PI * 1.5);
        this.ctx.stroke();
    }

    drawPearlCircle(r, def) {
        const rad = r * 0.85;
        const grad = this.ctx.createRadialGradient(-rad * 0.3, -rad * 0.3, 1, 0, 0, rad);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.35, def.highlightColor);
        grad.addColorStop(0.75, def.secondaryColor);
        grad.addColorStop(1, '#CBD5E1');

        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, rad, 0, Math.PI * 2);
        this.ctx.fill();

        // Shimmering pearl luster ring
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.arc(-rad * 0.2, -rad * 0.2, rad * 0.45, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    drawChakraIcon(dir, r) {
        this.ctx.save();
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 2.5;

        if (dir === 'H') {
            // Horizontal laser arrows
            this.ctx.beginPath();
            this.ctx.moveTo(-r * 0.7, 0);
            this.ctx.lineTo(r * 0.7, 0);
            this.ctx.stroke();

            // Arrowheads
            this.ctx.beginPath();
            this.ctx.moveTo(-r * 0.7, 0);
            this.ctx.lineTo(-r * 0.4, -r * 0.25);
            this.ctx.lineTo(-r * 0.4, r * 0.25);
            this.ctx.closePath();
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.moveTo(r * 0.7, 0);
            this.ctx.lineTo(r * 0.4, -r * 0.25);
            this.ctx.lineTo(r * 0.4, r * 0.25);
            this.ctx.closePath();
            this.ctx.fill();
        } else {
            // Vertical laser arrows
            this.ctx.beginPath();
            this.ctx.moveTo(0, -r * 0.7);
            this.ctx.lineTo(0, r * 0.7);
            this.ctx.stroke();

            // Arrowheads
            this.ctx.beginPath();
            this.ctx.moveTo(0, -r * 0.7);
            this.ctx.lineTo(-r * 0.25, -r * 0.4);
            this.ctx.lineTo(r * 0.25, -r * 0.4);
            this.ctx.closePath();
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.moveTo(0, r * 0.7);
            this.ctx.lineTo(-r * 0.25, r * 0.4);
            this.ctx.lineTo(r * 0.25, r * 0.4);
            this.ctx.closePath();
            this.ctx.fill();
        }
        this.ctx.restore();
    }

    drawAnarBombIcon(r) {
        // Festive brass firework sparkler pot
        this.ctx.save();
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
        this.ctx.fill();

        // 8 radiating firework spark rays
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4 + (this.globalTime * 3);
            this.ctx.beginPath();
            this.ctx.moveTo(Math.cos(angle) * (r * 0.35), Math.sin(angle) * (r * 0.35));
            this.ctx.lineTo(Math.cos(angle) * (r * 0.7), Math.sin(angle) * (r * 0.7));
            this.ctx.stroke();
        }
        this.ctx.restore();
    }

    drawMayurRainbowIcon(r) {
        // Grand Peacock Rainbow Feather
        this.ctx.save();
        const pulse = 1.0 + Math.sin(this.globalTime * 8) * 0.1;
        this.ctx.scale(pulse, pulse);

        // Concentric multicolored rings
        const colors = ['#E6196E', '#F5A623', '#00A8B5', '#10B981', '#8B5CF6'];
        colors.forEach((c, idx) => {
            this.ctx.strokeStyle = c;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, r * (0.65 - idx * 0.1), 0, Math.PI * 2);
            this.ctx.stroke();
        });

        // Golden center bindu
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    drawMarigolds(grid) {
        const bx = this.boardX;
        const by = this.boardY;
        const cs = this.cellSize;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = grid.get(r, c);
                if (!cell || cell.marigold <= 0) continue;

                const cx = bx + (c * cs) + (cs / 2);
                const cy = by + (r * cs) + (cs / 2);
                const isDouble = cell.marigold >= 2;

                this.ctx.save();
                this.ctx.translate(cx, cy);

                // Golden marigold blossom (Genda Phool)
                const petals = 12;
                const radius = cs * 0.42;

                // Outer petals (Saffron orange)
                this.ctx.fillStyle = '#EA580C';
                for (let i = 0; i < petals; i++) {
                    const a = (i * Math.PI * 2) / petals;
                    this.ctx.beginPath();
                    this.ctx.arc(Math.cos(a) * (radius * 0.65), Math.sin(a) * (radius * 0.65), radius * 0.35, 0, Math.PI * 2);
                    this.ctx.fill();
                }

                // Middle petals (Bright Golden Yellow)
                this.ctx.fillStyle = '#FBBF24';
                for (let i = 0; i < petals; i++) {
                    const a = (i * Math.PI * 2) / petals + 0.25;
                    this.ctx.beginPath();
                    this.ctx.arc(Math.cos(a) * (radius * 0.4), Math.sin(a) * (radius * 0.4), radius * 0.25, 0, Math.PI * 2);
                    this.ctx.fill();
                }

                // Center core
                this.ctx.fillStyle = '#B45309';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
                this.ctx.fill();

                if (isDouble) {
                    // Golden ribbon badge for 2-HP marigolds
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.font = 'bold 12px sans-serif';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText('2', 0, 0);
                }

                this.ctx.restore();
            }
        }
    }

    updateAndDrawParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;

            if (p.type === 'powder') {
                p.size *= 1.02; // expand dust
                p.vx *= 0.94;
                p.vy *= 0.94;
            } else if (p.type === 'petal') {
                p.rot += p.vrot;
                p.vx *= 0.97;
                p.vy += 0.05; // gravity
            } else if (p.type === 'spark') {
                p.vx *= 0.95;
                p.vy += 0.08;
            }

            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.globalAlpha = Math.max(p.alpha, 0);
            this.ctx.fillStyle = p.color;

            if (p.type === 'petal') {
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(p.rot);
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.restore();
        }
    }

    updateAndDrawFloatingTexts() {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy;
            ft.alpha -= 0.022;

            if (ft.alpha <= 0) {
                this.floatingTexts.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.globalAlpha = Math.max(ft.alpha, 0);
            this.ctx.fillStyle = ft.color;
            this.ctx.font = `bold ${ft.size}px 'Cinzel Decorative', 'Yatra One', serif, sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            this.ctx.shadowBlur = 6;
            this.ctx.fillText(ft.text, ft.x, ft.y);
            this.ctx.restore();
        }
    }

    // Helper: Rounded rectangle
    roundRect(x, y, w, h, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + w - radius, y);
        this.ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        this.ctx.lineTo(x + w, y + h - radius);
        this.ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        this.ctx.lineTo(x + radius, y + h);
        this.ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }
}

window.GameRenderer = GameRenderer;
