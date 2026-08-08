export class GameAudio {
  private context: AudioContext | null = null;
  private enabled = true;

  get isEnabled(): boolean {
    return this.enabled;
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  ensure(): void {
    if (!this.enabled) return;
    this.context ??= new AudioContext();
    if (this.context.state === "suspended") void this.context.resume();
  }

  click(): void {
    this.tone(330, 0.05, "square", 0.025);
  }

  lock(): void {
    this.tone(620, 0.07, "sine", 0.04);
  }

  throwMug(power: number, special: boolean): void {
    this.ensure();
    this.sweep(special ? 220 : 150, special ? 720 : 430, 0.22 + power * 0.1, "sawtooth", special ? 0.07 : 0.045);
  }

  impact(count: number, special: boolean): void {
    this.ensure();
    this.noise(special ? 0.48 : 0.28, special ? 0.16 : 0.09);
    this.tone(special ? 72 : 92, 0.24, "square", special ? 0.09 : 0.055);
    if (count > 4) {
      window.setTimeout(() => this.tone(420 + Math.min(count, 15) * 18, 0.09, "triangle", 0.05), 90);
    }
  }

  result(cleared: boolean): void {
    if (cleared) {
      [392, 523, 659, 784].forEach((frequency, index) => {
        window.setTimeout(() => this.tone(frequency, 0.16, "triangle", 0.055), index * 90);
      });
    } else {
      this.sweep(210, 118, 0.35, "triangle", 0.045);
    }
  }

  private tone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    volume: number,
  ): void {
    if (!this.enabled) return;
    this.ensure();
    if (!this.context) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  private sweep(
    from: number,
    to: number,
    duration: number,
    type: OscillatorType,
    volume: number,
  ): void {
    if (!this.enabled) return;
    this.ensure();
    if (!this.context) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, to), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  private noise(duration: number, volume: number): void {
    if (!this.enabled) return;
    this.ensure();
    if (!this.context) return;
    const sampleCount = Math.floor(this.context.sampleRate * duration);
    const buffer = this.context.createBuffer(1, sampleCount, this.context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < sampleCount; index += 1) {
      const fade = 1 - index / sampleCount;
      channel[index] = (Math.random() * 2 - 1) * fade;
    }
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 820;
    source.buffer = buffer;
    gain.gain.value = volume;
    source.connect(filter).connect(gain).connect(this.context.destination);
    source.start();
  }
}
