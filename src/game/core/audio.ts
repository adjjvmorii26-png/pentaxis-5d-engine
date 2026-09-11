/** Procedural Web Audio mixer. Unlock from the first user gesture. */

type Bus = { gain: GainNode };

export class AudioEngine {
  ctx: AudioContext | null = null;
  master: Bus | null = null;
  music: Bus | null = null;
  sfx: Bus | null = null;
  muted = false;
  volume = 0.7;
  private drones: OscillatorNode[] = [];
  private started = false;

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC({ latencyHint: "interactive" });
      this.master = { gain: this.ctx.createGain() };
      this.music = { gain: this.ctx.createGain() };
      this.sfx = { gain: this.ctx.createGain() };
      this.music.gain.gain.value = 0.18;
      this.sfx.gain.gain.value = 0.55;
      this.music.gain.connect(this.master.gain);
      this.sfx.gain.connect(this.master.gain);
      this.master.gain.connect(this.ctx.destination);
      this.applyVolume();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.visibilityState === "visible" && this.ctx?.state === "suspended") {
          void this.ctx.resume();
        }
      },
      { passive: true },
    );
  }

  applyVolume() {
    if (!this.master || !this.ctx) return;
    const v = this.muted ? 0 : this.volume * this.volume;
    this.master.gain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.04);
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    this.applyVolume();
  }

  setMuted(m: boolean) {
    this.muted = m;
    this.applyVolume();
  }

  startDrones() {
    if (!this.ctx || !this.music || this.started) return;
    this.started = true;
    const freqs = [98, 147, 196, 246.94, 293.66];
    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      const filt = this.ctx!.createBiquadFilter();
      osc.type = i % 2 === 0 ? "sine" : "triangle";
      osc.frequency.value = f;
      filt.type = "lowpass";
      filt.frequency.value = 420 + i * 80;
      g.gain.value = 0.07 - i * 0.008;
      osc.connect(filt);
      filt.connect(g);
      g.connect(this.music!.gain);
      osc.start();
      this.drones.push(osc);
    });
  }

  stopDrones() {
    for (const o of this.drones) {
      try {
        o.stop();
      } catch {
        /* already stopped */
      }
    }
    this.drones = [];
    this.started = false;
  }

  private beep(freq: number, dur: number, type: OscillatorType, gain: number, detune = 0) {
    if (!this.ctx || !this.sfx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq * (1 + (Math.random() * 2 - 1) * 0.03);
    osc.detune.value = detune;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.sfx.gain);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  footstep() {
    this.beep(90 + Math.random() * 40, 0.07, "triangle", 0.12);
  }

  pickup() {
    this.beep(523, 0.12, "sine", 0.22);
    this.beep(784, 0.18, "sine", 0.16, 12);
    this.beep(1046, 0.28, "triangle", 0.1);
  }

  portal() {
    if (!this.ctx || !this.sfx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(640, t + 0.22);
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    osc.connect(g);
    g.connect(this.sfx.gain);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  observe() {
    this.beep(880, 0.08, "square", 0.08);
    this.beep(440, 0.16, "sine", 0.14);
  }

  reverse() {
    if (!this.ctx || !this.sfx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.35);
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.36);
    osc.connect(g);
    g.connect(this.sfx.gain);
    osc.start(t);
    osc.stop(t + 0.38);
  }

  query() {
    this.beep(196, 0.2, "triangle", 0.16);
    this.beep(392, 0.35, "sine", 0.1);
  }

  hurt() {
    this.beep(110, 0.22, "sawtooth", 0.18);
  }

  attune() {
    this.beep(659, 0.14, "sine", 0.18);
    this.beep(988, 0.28, "triangle", 0.12);
  }

  land() {
    this.beep(70, 0.09, "triangle", 0.16);
  }

  tick() {
    this.beep(1480, 0.03, "square", 0.04);
  }
}

export const audio = new AudioEngine();
