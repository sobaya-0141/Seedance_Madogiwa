export class RunnerAudio {
  private context?: AudioContext;
  private master?: GainNode;
  private musicTimer = 0;
  private musicStep = 0;
  private playing = false;

  unlock(): void {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.18;
      this.master.connect(this.context.destination);
    }
    void this.context.resume();
  }

  setPlaying(playing: boolean): void {
    this.playing = playing;
  }

  update(dt: number): void {
    if (!this.playing || !this.context || !this.master) return;
    this.musicTimer -= dt;
    if (this.musicTimer > 0) return;
    this.musicTimer += 0.34;
    const notes = [196, 246.94, 293.66, 246.94, 220, 261.63, 329.63, 261.63];
    this.tone(notes[this.musicStep % notes.length], 0.09, "triangle", 0.085);
    this.musicStep += 1;
  }

  collect(chain: number): void {
    const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
    this.tone(scale[Math.min(scale.length - 1, chain % scale.length)], 0.08, "sine", 0.2);
  }

  routeClear(): void {
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
      this.tone(frequency, 0.18, "triangle", 0.19, index * 0.07);
    });
  }

  hit(): void {
    this.tone(115, 0.16, "square", 0.12);
    this.tone(86, 0.2, "triangle", 0.08, 0.05);
  }

  finish(): void {
    [261.63, 329.63, 392, 523.25].forEach((frequency, index) => {
      this.tone(frequency, 0.24, "triangle", 0.18, index * 0.1);
    });
  }

  private tone(
    frequency: number,
    duration: number,
    wave: OscillatorType,
    volume: number,
    delay = 0,
  ): void {
    if (!this.context || !this.master) return;
    const start = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }
}
