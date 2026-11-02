/**
 * Procedural Indian Musical Audio Engine for Rangoli Utsav
 * Synthesizes authentic Ghungroo, Sitar, Raga Bhupali chimes, Temple Bells,
 * and ambient Tanpura drones using Web Audio API without any external asset dependencies.
 * Ensures zero-latency, 100% offline reliability, and low battery consumption on Android.
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.ambientGain = null;
        this.isAmbientPlaying = false;
        this.ambientOscillators = [];
        
        // Raga Bhupali pentatonic scale frequencies (Sa, Re, Ga, Pa, Dha, Sa')
        // Pentatonic scales are deeply rooted in Indian classical aesthetics and universally relaxing.
        this.ragaScale = [
            261.63, // C4 (Sa)
            293.66, // D4 (Re)
            329.63, // E4 (Ga)
            392.00, // G4 (Pa)
            440.00, // Dha (Dha)
            523.25, // C5 (Sa')
            587.33, // D5 (Re')
            659.25, // E5 (Ga')
            783.99, // G5 (Pa')
            880.00, // A5 (Dha')
            1046.50 // C6 (Taar Sa)
        ];
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (this.musicEnabled) {
            this.startAmbient();
        } else {
            this.stopAmbient();
        }
        return this.musicEnabled;
    }

    // Play tactile swipe / touch whoosh
    playSwipe() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
    }

    // Synthesize Ghungroo (Indian ankle-bell jingle)
    playGhungroo(intensity = 1.0) {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const bellPitches = [3200, 4800, 6200, 7500];

        bellPitches.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const jitter = (Math.random() - 0.5) * 80;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq + jitter, now + (idx * 0.008));

            const vol = 0.04 * intensity;
            gain.gain.setValueAtTime(vol, now + (idx * 0.008));
            gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.12 + (idx * 0.015));

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + (idx * 0.008));
            osc.stop(now + 0.18);
        });
    }

    // Synthesize Sitar Pluck for deliberate user moves
    playSitarPluck(noteIndex = 0) {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const baseFreq = this.ragaScale[noteIndex % this.ragaScale.length];

        // Fundamental oscillator with subtle microtonal pitch meend (slur)
        const osc = this.ctx.createOscillator();
        const overtone = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(baseFreq * 0.98, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.04);

        overtone.type = 'sine';
        overtone.frequency.setValueAtTime(baseFreq * 2.01, now);

        // Filter to simulate resonant wooden gourd of sitar
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(baseFreq * 2.5, now);
        filter.Q.setValueAtTime(3.0, now);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(filter);
        overtone.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        overtone.start(now);
        osc.stop(now + 0.38);
        overtone.stop(now + 0.38);
    }

    // Melodic cascade chime: each successive cascade step climbs the Raga Bhupali scale!
    playCascade(step = 1) {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        const noteIdx = Math.min(step - 1, this.ragaScale.length - 1);
        const freq = this.ragaScale[noteIdx];
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const shimmer = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        shimmer.type = 'sine';
        shimmer.frequency.setValueAtTime(freq * 3, now);

        const vol = Math.min(0.15 + (step * 0.02), 0.30);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        shimmer.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        shimmer.start(now);
        osc.stop(now + 0.48);
        shimmer.stop(now + 0.48);

        // Accompany with subtle ghungroo sparkles on higher cascades
        if (step >= 2) {
            this.playGhungroo(Math.min(0.5 + (step * 0.2), 1.5));
        }
    }

    // Special piece activation: Chakra laser beam sweep
    playChakraBeam() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.45);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.5);
    }

    // Special piece activation: Anar / Sparkler festive explosion
    playAnarExplosion() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        
        // Low warm thump
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(160, now);
        subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.35);

        subGain.gain.setValueAtTime(0.25, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

        subOsc.connect(subGain);
        subGain.connect(this.ctx.destination);
        subOsc.start(now);
        subOsc.stop(now + 0.4);

        // Crackling sparkles
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                this.playGhungroo(0.8);
            }, i * 45);
        }
    }

    // Special piece activation: Mayur Ratna (Peacock Gem) rainbow sweep
    playPeacockRainbow() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        // Fast arpeggiated glissando through 6 notes
        for (let i = 0; i < 6; i++) {
            setTimeout(() => {
                this.playCascade(i + 3);
            }, i * 65);
        }
    }

    // Diya lighting sound: warm gentle chime + spark
    playDiyaLit() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // High C
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    // Temple Gong / Shankh Victory Fanfare for Level Completion
    playLevelVictory() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // Deep resonant brass gong
        const gong = this.ctx.createOscillator();
        const gongGain = this.ctx.createGain();
        gong.type = 'triangle';
        gong.frequency.setValueAtTime(110, now);
        gong.frequency.exponentialRampToValueAtTime(108, now + 1.5);

        gongGain.gain.setValueAtTime(0.3, now);
        gongGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

        gong.connect(gongGain);
        gongGain.connect(this.ctx.destination);
        gong.start(now);
        gong.stop(now + 2.0);

        // Cascading celebratory chime chord (Sa-Ga-Pa-Sa')
        const victoryNotes = [261.63, 329.63, 392.00, 523.25, 659.25];
        victoryNotes.forEach((freq, idx) => {
            setTimeout(() => {
                if (!this.ctx) return;
                const cNow = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, cNow);
                gain.gain.setValueAtTime(0.18, cNow);
                gain.gain.exponentialRampToValueAtTime(0.001, cNow + 0.8);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(cNow);
                osc.stop(cNow + 0.85);
            }, idx * 110);
        });
    }

    // Ambient Meditative Tanpura Drone (Gentle Sa-Pa harmonic bed)
    startAmbient() {
        if (!this.musicEnabled || this.isAmbientPlaying) return;
        this.init();
        if (!this.ctx) return;

        try {
            this.ambientGain = this.ctx.createGain();
            this.ambientGain.gain.setValueAtTime(0.025, this.ctx.currentTime);
            this.ambientGain.connect(this.ctx.destination);

            // Tanpura root notes: Low Pa (196Hz) and Sa (261.63Hz)
            const frequencies = [130.81, 196.00, 261.63];
            this.ambientOscillators = [];

            frequencies.forEach(f => {
                const osc = this.ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(f, this.ctx.currentTime);
                osc.connect(this.ambientGain);
                osc.start();
                this.ambientOscillators.push(osc);
            });

            this.isAmbientPlaying = true;
        } catch (e) {
            console.warn('Ambient drone start error:', e);
        }
    }

    stopAmbient() {
        if (!this.isAmbientPlaying) return;
        try {
            this.ambientOscillators.forEach(osc => {
                try { osc.stop(); } catch(e) {}
            });
            this.ambientOscillators = [];
            this.isAmbientPlaying = false;
        } catch (e) {
            console.warn('Ambient drone stop error:', e);
        }
    }
}

// Global audio singleton
window.AudioEngine = new SoundEngine();
