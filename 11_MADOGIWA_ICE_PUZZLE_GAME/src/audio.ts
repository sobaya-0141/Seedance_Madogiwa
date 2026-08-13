export class GameAudio {
  private context?: AudioContext;

  private getContext(): AudioContext | undefined {
    try {
      this.context ??= new AudioContext();
      if (this.context.state === "suspended") void this.context.resume();
      return this.context;
    } catch {
      return undefined;
    }
  }

  private tone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    gain = 0.045,
    endFrequency?: number,
  ): void {
    const context = this.getContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const volume = context.createGain();
    const now = context.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
    }
    volume.gain.setValueAtTime(gain, now);
    volume.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(volume);
    volume.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  slide(): void {
    this.tone(540, 0.22, "sine", 0.025, 820);
  }

  bump(): void {
    this.tone(120, 0.12, "square", 0.035, 75);
  }

  collect(kind: "document" | "beer"): void {
    this.tone(kind === "beer" ? 620 : 760, 0.18, "triangle", 0.055, 1120);
    window.setTimeout(() => this.tone(980, 0.15, "sine", 0.04, 1320), 70);
  }

  undo(): void {
    this.tone(420, 0.12, "triangle", 0.025, 260);
  }

  clear(): void {
    [523, 659, 784].forEach((frequency, index) => {
      window.setTimeout(
        () => this.tone(frequency, 0.36, "triangle", 0.05, frequency * 1.05),
        index * 110,
      );
    });
  }
}
