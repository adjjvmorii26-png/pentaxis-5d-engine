/** Presentation-only feedback. Never mutates simulation outcomes. */

export class Juice {
  trauma = 0;
  hitstop = 0;
  flash = 0;
  fovPunch = 0;
  enabled = true;
  reduced = false;

  constructor() {
    if (typeof window !== "undefined" && window.matchMedia) {
      this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
  }

  addTrauma(v: number) {
    if (!this.enabled || this.reduced) return;
    this.trauma = Math.min(1, this.trauma + v);
  }

  punch(v = 4) {
    if (!this.enabled || this.reduced) return;
    this.fovPunch = Math.max(this.fovPunch, v);
  }

  freeze(seconds: number) {
    if (this.reduced) return;
    this.hitstop = Math.max(this.hitstop, seconds);
  }

  addFlash(v: number) {
    this.flash = Math.min(1, this.flash + v);
  }

  update(dt: number) {
    this.trauma = Math.max(0, this.trauma - dt * 1.6);
    this.flash = Math.max(0, this.flash - dt * 2.4);
    this.fovPunch = Math.max(0, this.fovPunch - dt * 18);
    if (this.hitstop > 0) this.hitstop = Math.max(0, this.hitstop - dt);
  }

  shakeOffset(time: number) {
    const s = this.trauma * this.trauma;
    if (s <= 0.0001) return { x: 0, y: 0, roll: 0 };
    return {
      x: s * 0.11 * Math.sin(time * 47.1),
      y: s * 0.09 * Math.sin(time * 41.7 + 1.7),
      roll: s * 0.03 * Math.sin(time * 23.3),
    };
  }
}
