export class AudioSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      // Initialize on user interaction usually, but we'll try lazy loading
      try {
        const AudioContext = (window.AudioContext || (window as any).webkitAudioContext);
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; // Default volume
        this.masterGain.connect(this.ctx.destination);
      } catch (e) {
        console.warn("AudioContext not supported");
      }
    }
  }

  private ensureContext() {
    if (this.ctx?.state === "suspended") {
      this.ctx.resume();
    }
  }

  playIncomingMessage() {
    if (!this.ctx || !this.masterGain) return;
    this.ensureContext();
    const t = this.ctx.currentTime;
    
    // High-pitch digital "blip" sequence
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.1);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.2);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.5, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(t);
    osc.stop(t + 0.3);
  }

  playSentMessage() {
    if (!this.ctx || !this.masterGain) return;
    this.ensureContext();
    const t = this.ctx.currentTime;
    
    // Soft "whoosh" air release
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = "triangle";
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.3);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(t);
    osc.stop(t + 0.3);
  }

  playReaction() {
    if (!this.ctx || !this.masterGain) return;
    this.ensureContext();
    const t = this.ctx.currentTime;
    
    // Playful "pop"
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.1);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(t);
    osc.stop(t + 0.2);
  }

  playNotification() {
    if (!this.ctx || !this.masterGain) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    // Double chime
    [0, 0.15].forEach((offset, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "sine";
        osc.frequency.value = i === 0 ? 600 : 900;
        gain.gain.setValueAtTime(0, t + offset);
        gain.gain.linearRampToValueAtTime(0.2, t + offset + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, t + offset + 0.3);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(t + offset);
        osc.stop(t + offset + 0.3);
    });
  }
}

export const synth = new AudioSynth();
