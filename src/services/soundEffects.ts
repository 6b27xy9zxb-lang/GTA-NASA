/**
 * GTA NASA Procedural Audio & Music Synthesizer
 * Synthesizes launch countdowns, engine ignition roar, stage separation,
 * in-flight event alarms (sirens, sonar distress pings, meteorite impacts),
 * mission outcome fanfares (triumphant victory vs. dramatic loss),
 * and dynamic ambient space music using the Web Audio API.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private musicVolume: number = 0.25;
  private sfxVolume: number = 0.5;

  // Music nodes
  private isMusicPlaying: boolean = false;
  private musicGainNode: GainNode | null = null;
  private musicInterval: any = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.musicGainNode) {
      this.musicGainNode.gain.value = muted ? 0 : this.musicVolume;
    }
  }

  getIsMuted(): boolean {
    return this.isMuted;
  }

  setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.musicGainNode && !this.isMuted) {
      this.musicGainNode.gain.setValueAtTime(this.musicVolume, this.ctx?.currentTime || 0);
    }
  }

  // ==========================================
  // UI SFX
  // ==========================================
  playUiClick() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(920, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1840, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (_) {}
  }

  playEquipSound() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, this.ctx.currentTime);
      osc.frequency.setValueAtTime(780, this.ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.12 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (_) {}
  }

  // ==========================================
  // LAUNCH SOUND EFFECTS
  // ==========================================
  playCountdownBeep(isFinal: boolean = false) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isFinal ? 1200 : 800, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.15 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (isFinal ? 0.35 : 0.1));

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + (isFinal ? 0.35 : 0.1));
    } catch (_) {}
  }

  playLaunchIgnition() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const bufferSize = this.ctx.sampleRate * 3.0;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(80, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 1.8);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.4 * this.sfxVolume, this.ctx.currentTime + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 3.0);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
      noise.stop(this.ctx.currentTime + 3.0);
    } catch (_) {}
  }

  playStageSeparation() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      // Mechanical latch clank + air discharge
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.3 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (_) {}
  }

  // ==========================================
  // IN-FLIGHT EVENT SOUND EFFECTS
  // ==========================================
  // Shared emergency alarm API used by mission, flight, hangar, and multiplayer UI.
  playAlarm() {
    this.playWarningAlarm();
  }

  playWarningAlarm() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      // Two-tone emergency siren
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(650, this.ctx.currentTime);
      osc.frequency.setValueAtTime(850, this.ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(650, this.ctx.currentTime + 0.3);
      osc.frequency.setValueAtTime(850, this.ctx.currentTime + 0.45);

      gain.gain.setValueAtTime(0.2 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.6);
    } catch (_) {}
  }

  playDistressSonarPulse() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      // Eerie deep space sonar ping
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.8);

      gain.gain.setValueAtTime(0.25 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.9);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.9);
    } catch (_) {}
  }

  playImpactCrack() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      // High-velocity micrometeorite impact
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.4 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (_) {}
  }

  playExplosion() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const bufferSize = this.ctx.sampleRate * 2.0;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 1.8);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.5 * this.sfxVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.9);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start();
      whiteNoise.stop(this.ctx.currentTime + 2.0);
    } catch (_) {}
  }

  // ==========================================
  // MISSION OUTCOME FANFARES
  // ==========================================
  playVictoryFanfare() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      // Triumphant ascending arpeggio chord (C4, E4, G4, C5)
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.12);

        gain.gain.setValueAtTime(0.001, this.ctx!.currentTime + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.18 * this.sfxVolume, this.ctx!.currentTime + idx * 0.12 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.12 + 0.8);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(this.ctx!.currentTime + idx * 0.12);
        osc.stop(this.ctx!.currentTime + idx * 0.12 + 0.85);
      });
    } catch (_) {}
  }

  playDefeatChime() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      // Somber descending chords (G3, Eb3, C3)
      const notes = [196.00, 155.56, 130.81];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.3);

        gain.gain.setValueAtTime(0.001, this.ctx!.currentTime + idx * 0.3);
        gain.gain.linearRampToValueAtTime(0.25 * this.sfxVolume, this.ctx!.currentTime + idx * 0.3 + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.3 + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(this.ctx!.currentTime + idx * 0.3);
        osc.stop(this.ctx!.currentTime + idx * 0.3 + 1.3);
      });
    } catch (_) {}
  }

  // ==========================================
  // PROCEDURAL SCI-FI SPACE MUSIC SOUNDTRACK
  // ==========================================
  // Landing-page ambient bed reuses the existing procedural space soundtrack.
  startAmbientDrone() {
    this.startSpaceMusic();
  }

  startSpaceMusic() {
    if (this.isMusicPlaying) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      this.isMusicPlaying = true;
      this.musicGainNode = this.ctx.createGain();
      this.musicGainNode.gain.setValueAtTime(this.isMuted ? 0 : this.musicVolume, this.ctx.currentTime);
      this.musicGainNode.connect(this.ctx.destination);

      // Deep space ambient chords sequence (A minor9, F maj7, D sus2, E min7)
      const chords = [
        [110.00, 164.81, 220.00, 261.63, 329.63], // Am9
        [87.31, 130.81, 174.61, 220.00, 261.63],  // Fmaj7
        [73.42, 110.00, 146.83, 220.00, 293.66],  // Dsus2
        [82.41, 123.47, 164.81, 196.00, 246.94],  // Em7
      ];

      let chordIndex = 0;

      const playChord = () => {
        if (!this.isMusicPlaying || !this.ctx || !this.musicGainNode) return;

        const currentNotes = chords[chordIndex % chords.length];
        chordIndex++;

        currentNotes.forEach((freq, i) => {
          const osc = this.ctx!.createOscillator();
          const noteGain = this.ctx!.createGain();

          osc.type = i === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);

          // Gentle slow swell
          const now = this.ctx!.currentTime;
          noteGain.gain.setValueAtTime(0.0001, now);
          noteGain.gain.linearRampToValueAtTime(0.04 / (i + 1), now + 2.0);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 6.8);

          osc.connect(noteGain);
          noteGain.connect(this.musicGainNode!);

          osc.start(now);
          osc.stop(now + 7.0);
        });
      };

      playChord();
      this.musicInterval = setInterval(playChord, 6800);
    } catch (_) {}
  }

  stopSpaceMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  toggleMusic(): boolean {
    if (this.isMusicPlaying) {
      this.stopSpaceMusic();
      return false;
    } else {
      this.startSpaceMusic();
      return true;
    }
  }

  getIsMusicPlaying(): boolean {
    return this.isMusicPlaying;
  }
}

export const sound = new SoundSynthesizer();
