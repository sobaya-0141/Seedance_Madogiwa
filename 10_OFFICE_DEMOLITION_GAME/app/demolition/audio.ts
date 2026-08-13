import type { DemolitionMaterial } from "./types";

type BrowserAudioContext = typeof AudioContext;

const MATERIAL_TONE: Record<DemolitionMaterial, {
  frequency: number;
  duration: number;
  noise: number;
  type: OscillatorType;
}> = {
  paper: { frequency: 520, duration: 0.08, noise: 0.11, type: "triangle" },
  wood: { frequency: 170, duration: 0.13, noise: 0.18, type: "square" },
  fabric: { frequency: 110, duration: 0.1, noise: 0.08, type: "sine" },
  glass: { frequency: 1_450, duration: 0.2, noise: 0.12, type: "sine" },
  metal: { frequency: 390, duration: 0.27, noise: 0.09, type: "triangle" },
  plaster: { frequency: 120, duration: 0.2, noise: 0.3, type: "square" },
  concrete: { frequency: 74, duration: 0.34, noise: 0.38, type: "sawtooth" },
  slab: { frequency: 58, duration: 0.42, noise: 0.44, type: "sawtooth" },
  steel: { frequency: 210, duration: 0.52, noise: 0.2, type: "triangle" },
};

export class DemolitionAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private enabled = true;
  private lastImpact = 0;
  private lastMeteor = 0;
  private ambientTimer = 0;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (this.master) {
      this.master.gain.setTargetAtTime(
        enabled ? 0.52 : 0.0001,
        this.context?.currentTime ?? 0,
        0.025,
      );
    }
  }

  isEnabled() {
    return this.enabled;
  }

  async prime() {
    const context = this.ensureContext();
    if (!context) return;
    if (context.state === "suspended" || context.state === "interrupted") {
      await context.resume().catch(() => undefined);
    }
  }

  update(dt: number, intensity: number) {
    if (!this.enabled) return;
    this.ambientTimer -= dt;
    if (this.ambientTimer > 0) return;
    this.ambientTimer = 1.8 - Math.min(0.8, intensity * 0.55);
    const context = this.ensureContext();
    if (!context || context.state !== "running") return;
    const now = context.currentTime;
    this.tone(90 + intensity * 26, 0.9, "sine", 0.009 + intensity * 0.006, now);
    this.tone(135 + intensity * 31, 0.65, "triangle", 0.005, now + 0.04);
  }

  footstep() {
    const context = this.ensureContext();
    if (!context || !this.enabled || context.state !== "running") return;
    this.noise(0.035, 0.035, 720, context.currentTime);
    this.tone(84, 0.045, "sine", 0.025, context.currentTime);
  }

  swing(powered = false) {
    const context = this.ensureContext();
    if (!context || !this.enabled || context.state !== "running") return;
    const now = context.currentTime;
    this.noise(powered ? 0.18 : 0.1, powered ? 0.16 : 0.1, 1_100, now);
    this.sweep(powered ? 240 : 310, powered ? 72 : 130, powered ? 0.23 : 0.14, 0.045, now);
  }

  impact(material: DemolitionMaterial, strength = 1, chain = 0) {
    const context = this.ensureContext();
    if (!context || !this.enabled || context.state !== "running") return;
    const nowMs = performance.now();
    if (nowMs - this.lastImpact < 24 && strength < 1.5) return;
    this.lastImpact = nowMs;
    const profile = MATERIAL_TONE[material];
    const now = context.currentTime;
    const gain = Math.min(0.16, 0.035 * strength + chain * 0.004);
    this.tone(
      profile.frequency * (0.94 + Math.random() * 0.12),
      profile.duration,
      profile.type,
      gain,
      now,
    );
    this.noise(
      profile.duration * 0.75,
      profile.noise * Math.min(1.4, strength),
      material === "glass" ? 4_800 : material === "steel" ? 2_200 : 900,
      now,
    );
    if (material === "glass") {
      [1.4, 1.85, 2.45].forEach((ratio, index) => {
        this.tone(
          profile.frequency * ratio,
          0.16 + index * 0.04,
          "sine",
          gain * 0.42,
          now + index * 0.015,
        );
      });
    }
    if (material === "steel") {
      this.sweep(680, 210, 0.5, gain * 0.72, now + 0.02);
    }
  }

  locked() {
    const context = this.ensureContext();
    if (!context || !this.enabled || context.state !== "running") return;
    const now = context.currentTime;
    this.tone(120, 0.08, "square", 0.035, now);
    this.tone(92, 0.12, "square", 0.03, now + 0.09);
  }

  pickup() {
    const context = this.ensureContext();
    if (!context || !this.enabled || context.state !== "running") return;
    const now = context.currentTime;
    this.sweep(260, 580, 0.13, 0.04, now);
  }

  throw() {
    const context = this.ensureContext();
    if (!context || !this.enabled || context.state !== "running") return;
    const now = context.currentTime;
    this.noise(0.12, 0.1, 1_300, now);
    this.sweep(390, 95, 0.2, 0.045, now);
  }

  beer() {
    const context = this.ensureContext();
    if (!context || !this.enabled || context.state !== "running") return;
    const now = context.currentTime;
    this.noise(0.42, 0.035, 5_200, now);
    [330, 440, 554, 660].forEach((frequency, index) => {
      this.tone(frequency, 0.26, "sine", 0.025, now + index * 0.055);
    });
  }

  ultimate() {
    const context = this.ensureContext();
    if (!context || !this.enabled || context.state !== "running") return;
    const now = context.currentTime;
    this.noise(1.25, 0.12, 8_500, now);
    this.sweep(110, 42, 0.85, 0.12, now);
    this.sweep(280, 2_600, 0.72, 0.075, now + 0.18);
    [165, 220, 330, 440, 660, 880].forEach((frequency, index) => {
      this.tone(frequency, 0.66, index % 2 === 0 ? "sawtooth" : "triangle", 0.045, now + index * 0.075);
    });
  }

  meteor() {
    const context = this.ensureContext();
    if (!context || !this.enabled || context.state !== "running") return;
    const nowMs = performance.now();
    if (nowMs - this.lastMeteor < 65) return;
    this.lastMeteor = nowMs;
    const now = context.currentTime;
    this.noise(0.38, 0.16, 1_100, now);
    this.sweep(105, 38, 0.42, 0.12, now);
    this.tone(58, 0.48, "sine", 0.14, now);
  }

  levelUp(level: number) {
    const context = this.ensureContext();
    if (!context || !this.enabled || context.state !== "running") return;
    const now = context.currentTime;
    [196, 262, 330, 392, 523].slice(0, Math.max(3, level)).forEach((frequency, index) => {
      this.tone(frequency, 0.45, "triangle", 0.048, now + index * 0.075);
    });
    this.noise(0.55, 0.055, 6_500, now + 0.12);
  }

  clear() {
    const context = this.ensureContext();
    if (!context || !this.enabled || context.state !== "running") return;
    const now = context.currentTime;
    [131, 196, 262, 330, 392, 523, 659].forEach((frequency, index) => {
      this.tone(frequency, 0.75, "triangle", 0.04, now + index * 0.11);
    });
    this.noise(1.4, 0.045, 7_000, now + 0.35);
  }

  dispose() {
    void this.context?.close();
    this.context = null;
    this.master = null;
    this.compressor = null;
    this.noiseBuffer = null;
  }

  private ensureContext() {
    if (typeof window === "undefined") return null;
    if (this.context) return this.context;
    const AudioCtor = window.AudioContext
      ?? (window as typeof window & { webkitAudioContext?: BrowserAudioContext }).webkitAudioContext;
    if (!AudioCtor) return null;
    const context = new AudioCtor();
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.knee.value = 16;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.22;
    const master = context.createGain();
    master.gain.value = this.enabled ? 0.52 : 0.0001;
    compressor.connect(master);
    master.connect(context.destination);
    this.context = context;
    this.master = master;
    this.compressor = compressor;
    context.addEventListener("statechange", () => {
      if (context.state === "interrupted" && this.enabled) void context.resume();
    });
    return context;
  }

  private destination() {
    return this.compressor;
  }

  private tone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    gainValue: number,
    start: number,
  ) {
    const context = this.context;
    const destination = this.destination();
    if (!context || !destination) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(20, frequency), start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainValue), start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }

  private sweep(
    from: number,
    to: number,
    duration: number,
    gainValue: number,
    start: number,
  ) {
    const context = this.context;
    const destination = this.destination();
    if (!context || !destination) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(from, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, to), start + duration);
    gain.gain.setValueAtTime(gainValue, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  private noise(duration: number, gainValue: number, lowpass: number, start: number) {
    const context = this.context;
    const destination = this.destination();
    if (!context || !destination) return;
    if (!this.noiseBuffer) {
      const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let index = 0; index < data.length; index += 1) {
        data[index] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
    }
    const source = context.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(lowpass, start);
    const gain = context.createGain();
    gain.gain.setValueAtTime(Math.max(0.0002, gainValue), start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    source.start(start, Math.random());
    source.stop(start + duration + 0.02);
  }
}
