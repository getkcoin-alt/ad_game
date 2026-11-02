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
        this.soundVolume = 0.8;
        this.musicVolume = 0.6;
        this.masterFilter = null;
        this.masterGain = null;
        this.sfxGainNode = null;
        this.musicGainNode = null;
        this.isFilterPaused = false;
        
        // Procedural Loop Music State ("Raga Tarang")
        this.tanpuraGain = null;
        this.tanpuraOscillators = [];
        this.musicTimer = null;
        this.musicStep = 0;
        this.nextStepTime = 0;
        this.isMusicPlaying = false;
        
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
        this.ensureMasterPipeline();
    }

    ensureMasterPipeline() {
        if (!this.ctx) return;
        if (!this.masterFilter) {
            try {
                this.masterFilter = this.ctx.createBiquadFilter();
                this.masterFilter.type = 'lowpass';
                this.masterFilter.frequency.setValueAtTime(22000, this.ctx.currentTime);

                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

                this.masterFilter.connect(this.masterGain);
                this.masterGain.connect(this.ctx.destination);

                // Dedicated SFX channel
                this.sfxGainNode = this.ctx.createGain();
                this.sfxGainNode.gain.setValueAtTime(this.soundEnabled ? this.soundVolume : 0.0, this.ctx.currentTime);
                this.sfxGainNode.connect(this.masterFilter);

                // Dedicated Music channel
                this.musicGainNode = this.ctx.createGain();
                this.musicGainNode.gain.setValueAtTime(this.musicEnabled ? this.musicVolume : 0.0, this.ctx.currentTime);
                this.musicGainNode.connect(this.masterFilter);
            } catch (e) {
                console.warn('Master audio filter setup warning:', e);
            }
        }
    }

    getDestination() {
        this.ensureMasterPipeline();
        return this.sfxGainNode || this.masterFilter || (this.ctx ? this.ctx.destination : null);
    }

    getMusicDestination() {
        this.ensureMasterPipeline();
        return this.musicGainNode || this.masterFilter || (this.ctx ? this.ctx.destination : null);
    }

    setSoundVolume(vol) {
        this.soundVolume = Math.max(0, Math.min(1, vol));
        if (this.ctx && this.sfxGainNode) {
            const target = this.soundEnabled ? this.soundVolume : 0.0;
            this.sfxGainNode.gain.setValueAtTime(target, this.ctx.currentTime);
        }
    }

    setMusicVolume(vol) {
        this.musicVolume = Math.max(0, Math.min(1, vol));
        if (this.ctx && this.musicGainNode) {
            const target = this.musicEnabled ? this.musicVolume : 0.0;
            this.musicGainNode.gain.setValueAtTime(target, this.ctx.currentTime);
        }
    }

    // Pillar 4: Web Audio Master Low-Pass Filter on Pause (22kHz -> 420Hz)
    setPausedFilter(isPaused) {
        this.isFilterPaused = isPaused;
        if (!this.ctx) return;
        this.ensureMasterPipeline();
        if (!this.masterFilter) return;

        try {
            const now = this.ctx.currentTime;
            const targetFreq = isPaused ? 420 : 22000;
            this.targetFilterFreq = targetFreq;
            this.masterFilter.frequency.cancelScheduledValues(now);
            this.masterFilter.frequency.setValueAtTime(this.masterFilter.frequency.value || 22000, now);
            this.masterFilter.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.25);
        } catch (e) {
            console.warn('Filter transition error:', e);
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        if (this.ctx && this.sfxGainNode) {
            const target = this.soundEnabled ? this.soundVolume : 0.0;
            this.sfxGainNode.gain.setValueAtTime(target, this.ctx.currentTime);
        }
        return this.soundEnabled;
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (this.ctx && this.musicGainNode) {
            const target = this.musicEnabled ? this.musicVolume : 0.0;
            this.musicGainNode.gain.setValueAtTime(target, this.ctx.currentTime);
        }
        if (this.musicEnabled) {
            this.startMusicLoop();
        } else {
            this.stopMusicLoop();
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
        gain.connect(this.getDestination());

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
            gain.connect(this.getDestination());

            osc.start(now + (idx * 0.008));
            osc.stop(now + 0.18);
        });
    }

    // Synthesize Sitar Pluck for deliberate user moves with micro-pitch acoustic jitter
    playSitarPluck(noteIndex = 0) {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const baseNote = this.ragaScale[noteIndex % this.ragaScale.length];
        const pitchJitter = 1.0 + (Math.random() - 0.5) * 0.025; // ±1.25% organic sitar fret nuance
        const baseFreq = baseNote * pitchJitter;

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
        gain.connect(this.getDestination());

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
        const baseFreq = this.ragaScale[noteIdx];
        const pitchJitter = 1.0 + (Math.random() - 0.5) * 0.02; // organic micro-pitch jitter
        const freq = baseFreq * pitchJitter;
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
        gain.connect(this.getDestination());

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
        gain.connect(this.getDestination());

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
        subGain.connect(this.getDestination());
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
        gain.connect(this.getDestination());

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
        gongGain.connect(this.getDestination());
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
                gain.connect(this.getDestination());
                osc.start(cNow);
                osc.stop(cNow + 0.85);
            }, idx * 110);
        });
    }

    // Sparkler burst chime during Maha Utsav remaining move conversion
    playSparklerBurst(index = 0) {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const scaleIdx = (index % this.ragaScale.length);
        const baseFreq = this.ragaScale[scaleIdx];
        const pitchJitter = 1.0 + (Math.random() - 0.5) * 0.02;
        const freq = baseFreq * pitchJitter;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * 1.5, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 2.0, now + 0.12);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.getDestination());
        osc.start(now);
        osc.stop(now + 0.24);

        this.playGhungroo(0.6);
    }

    // Triumphant Maha Utsav opening fanfare
    playFanfare() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                if (!this.ctx) return;
                const cNow = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, cNow);
                gain.gain.setValueAtTime(0.14, cNow);
                gain.gain.exponentialRampToValueAtTime(0.001, cNow + 0.4);

                osc.connect(gain);
                gain.connect(this.getDestination());
                osc.start(cNow);
                osc.stop(cNow + 0.42);
            }, idx * 70);
        });
    }

    // Voice 1: Tanpura Drone Bed (Continuous Sa-Pa harmonic resonance with micro-chorus)
    startTanpuraDrone() {
        if (!this.ctx || this.tanpuraOscillators.length > 0) return;
        const dest = this.getMusicDestination();
        if (!dest) return;

        try {
            this.tanpuraGain = this.ctx.createGain();
            this.tanpuraGain.gain.setValueAtTime(0.045, this.ctx.currentTime);
            this.tanpuraGain.connect(dest);

            // Tanpura root frequencies: Low Sa (130.81Hz), Low Pa (196.00Hz), Middle Sa (261.63Hz)
            const freqs = [130.81, 131.15, 196.00, 195.65, 261.63];
            this.tanpuraOscillators = [];

            freqs.forEach((f, idx) => {
                const osc = this.ctx.createOscillator();
                osc.type = (idx % 2 === 0) ? 'sine' : 'triangle';
                osc.frequency.setValueAtTime(f, this.ctx.currentTime);

                const oscGain = this.ctx.createGain();
                oscGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
                osc.connect(oscGain);
                oscGain.connect(this.tanpuraGain);

                osc.start();
                this.tanpuraOscillators.push(osc);
            });
        } catch (e) {
            console.warn('Tanpura drone start error:', e);
        }
    }

    stopTanpuraDrone() {
        this.tanpuraOscillators.forEach(osc => {
            try { osc.stop(); } catch(e) {}
        });
        this.tanpuraOscillators = [];
        this.tanpuraGain = null;
    }

    // Voice 2, 3, 4: Procedural Loop Music ("Raga Tarang" at 96 BPM)
    playMusicStep(step, time) {
        if (!this.ctx || !this.musicEnabled) return;
        const dest = this.getMusicDestination();
        if (!dest) return;

        // 1. Voice 2: Soft Tabla Percussive Groove (Dadra / Tintal cadence)
        // Bayan (low resonant bass "Ghe"): hits on beat 1 (step 0, 16, 32, 48) and beat 3 (step 8, 24, 40, 56)
        if (step % 8 === 0) {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(115, time);
            osc.frequency.exponentialRampToValueAtTime(48, time + 0.16);
            g.gain.setValueAtTime(0.10, time);
            g.gain.exponentialRampToValueAtTime(0.001, time + 0.16);
            osc.connect(g);
            g.connect(dest);
            osc.start(time);
            osc.stop(time + 0.18);
        }

        // Dayan (treble rim snap "Tin"): hits on beat 2 and 4 (step 4, 12, 20, 28, 36, 44, 52, 60)
        if (step % 8 === 4) {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(460, time);
            osc.frequency.exponentialRampToValueAtTime(240, time + 0.05);
            g.gain.setValueAtTime(0.05, time);
            g.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
            osc.connect(g);
            g.connect(dest);
            osc.start(time);
            osc.stop(time + 0.06);
        }

        // 2. Voice 3: Sitar Melodic Phrases (Raga Bhupali: Sa, Re, Ga, Pa, Dha)
        // 64-step cyclical loop (16 bars of 4 beats)
        const sitarPattern = {
            // Bars 1-4: Serene ascending phrase
            0: 261.63,  // Sa (C4)
            4: 293.66,  // Re (D4)
            8: 329.63,  // Ga (E4)
            12: 392.00, // Pa (G4)
            // Bars 5-8: Regal flourish rising to Taar Sa
            16: 329.63, // Ga (E4)
            20: 392.00, // Pa (G4)
            24: 440.00, // Dha (A4)
            28: 523.25, // Sa' (C5)
            // Bars 9-12: Descending cascade
            32: 440.00, // Dha (A4)
            36: 392.00, // Pa (G4)
            40: 329.63, // Ga (E4)
            44: 293.66, // Re (D4)
            // Bars 13-16: Resolving resting cadence
            48: 329.63, // Ga (E4)
            52: 293.66, // Re (D4)
            56: 261.63  // Sa (C4 - sustained resolution)
        };

        const sitarFreq = sitarPattern[step];
        if (sitarFreq) {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sawtooth';

            // Microtonal string bend (meend) upward by ~1.5%
            osc.frequency.setValueAtTime(sitarFreq * 0.985, time);
            osc.frequency.exponentialRampToValueAtTime(sitarFreq, time + 0.07);

            // Resonant bandpass filter to shape authentic sitar harmonics
            const sitarFilter = this.ctx.createBiquadFilter();
            sitarFilter.type = 'bandpass';
            sitarFilter.frequency.setValueAtTime(sitarFreq * 2.2, time);
            sitarFilter.Q.setValueAtTime(3.2, time);

            g.gain.setValueAtTime(0.075, time);
            g.gain.exponentialRampToValueAtTime(0.001, time + 0.52);

            osc.connect(sitarFilter);
            sitarFilter.connect(g);
            g.connect(dest);
            osc.start(time);
            osc.stop(time + 0.55);
        }

        // 3. Voice 4: Santur Bell Sparkles (high crystalline shimmer on off-beats)
        const santurSparkles = {
            6: 783.99,   // High Pa (G5)
            14: 1046.50, // Taar Sa (C6)
            22: 659.25,  // High Ga (E5)
            38: 880.00,  // High Dha (A5)
            54: 1046.50  // Taar Sa (C6)
        };

        const sparkleFreq = santurSparkles[step];
        if (sparkleFreq) {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(sparkleFreq, time);
            osc.frequency.exponentialRampToValueAtTime(sparkleFreq * 1.01, time + 0.18);
            g.gain.setValueAtTime(0.035, time);
            g.gain.exponentialRampToValueAtTime(0.0005, time + 0.22);
            osc.connect(g);
            g.connect(dest);
            osc.start(time);
            osc.stop(time + 0.24);
        }
    }

    startMusicLoop() {
        if (!this.musicEnabled || this.isMusicPlaying) return;
        this.init();
        if (!this.ctx) return;

        this.isMusicPlaying = true;
        this.startTanpuraDrone();

        this.musicStep = 0;
        this.nextStepTime = this.ctx.currentTime + 0.05;
        const stepDuration = (60 / 96) / 4; // 96 BPM 16th note (approx 0.15625s)

        if (this.musicTimer) clearInterval(this.musicTimer);
        this.musicTimer = setInterval(() => {
            if (!this.isMusicPlaying || !this.ctx) return;
            const now = this.ctx.currentTime;
            while (this.nextStepTime < now + 0.15) {
                this.playMusicStep(this.musicStep, this.nextStepTime);
                this.musicStep = (this.musicStep + 1) % 64;
                this.nextStepTime += stepDuration;
            }
        }, 30);
    }

    stopMusicLoop() {
        if (!this.isMusicPlaying) return;
        if (this.musicTimer) {
            clearInterval(this.musicTimer);
            this.musicTimer = null;
        }
        this.stopTanpuraDrone();
        this.isMusicPlaying = false;
    }

    startAmbient() {
        this.startMusicLoop();
    }

    stopAmbient() {
        this.stopMusicLoop();
    }
}

// Global audio singleton
window.AudioEngine = new SoundEngine();
