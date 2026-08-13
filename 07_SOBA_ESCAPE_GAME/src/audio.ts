import type { SoundKind } from "./game.js";

export class GameAudio {
  private context?: AudioContext;
  private enabled = true;
  private lastStep = 0;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  get isEnabled() {
    return this.enabled;
  }

  unlock() {
    if (!this.enabled) return;
    this.ensureContext()?.resume().catch(() => undefined);
  }

  play(kind: SoundKind) {
    if (!this.enabled) return;
    const context = this.ensureContext();
    if (!context) return;
    if (kind === "step") {
      if (context.currentTime - this.lastStep < 0.16) return;
      this.lastStep = context.currentTime;
      this.tone(105, 0.035, 0.018, "sine");
    } else if (kind === "pickup") {
      this.tone(640, 0.08, 0.05, "sine");
      this.tone(920, 0.11, 0.04, "sine", 0.06);
    } else if (kind === "alert") {
      this.tone(230, 0.12, 0.07, "square");
      this.tone(170, 0.14, 0.06, "square", 0.1);
    } else if (kind === "gadget") {
      this.tone(360, 0.07, 0.055, "triangle");
      this.tone(520, 0.09, 0.045, "triangle", 0.04);
    } else if (kind === "locked") {
      this.tone(145, 0.12, 0.055, "sawtooth");
    } else if (kind === "win") {
      [440, 554, 660, 880].forEach((frequency, index) => {
        this.tone(frequency, 0.16, 0.05, "triangle", index * 0.09);
      });
    } else if (kind === "caught") {
      this.tone(260, 0.14, 0.07, "sawtooth");
      this.tone(155, 0.26, 0.07, "sawtooth", 0.12);
    }
  }

  private ensureContext() {
    if (!this.context) {
      const Context = window.AudioContext
        ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Context) return undefined;
      this.context = new Context();
    }
    return this.context;
  }

  private tone(
    frequency: number,
    duration: number,
    volume: number,
    type: OscillatorType,
    delay = 0,
  ) {
    const context = this.context;
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startsAt = context.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startsAt);
    gain.gain.setValueAtTime(0.0001, startsAt);
    gain.gain.exponentialRampToValueAtTime(volume, startsAt + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startsAt);
    oscillator.stop(startsAt + duration + 0.02);
  }
}
