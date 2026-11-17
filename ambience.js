import { renderScore } from './event-sounds.js';

// Quiet synthesized beds, separate from the short scene cues and chapter music.
export const ambientProfiles = {
  travel: { low: 480, high: 45, level: 0.065, rate: 0.3 },
  campus: { low: 1800, high: 160, level: 0.025, rate: 0.14, birds: true },
  field: { low: 2400, high: 220, level: 0.023, rate: 0.19, birds: true },
  rain: { low: 4200, high: 300, level: 0.065, rate: 0.09 },
  lake: { low: 1400, high: 100, level: 0.035, rate: 0.22, birds: true },
  night: { low: 900, high: 120, level: 0.016, rate: 0.11 },
};

export class Ambience {
  constructor() {
    this.current = 'off';
    this.enabled = false;
    this.paused = false;
    this.volume = 0.35;
    this.sessions = new Set();
  }

  attach(ctx) {
    if (this.ctx) return;
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.volume * 0.45;
    this.master.connect(ctx.destination);
    this.update();
  }

  setVolume(value) {
    this.volume = value;
    if (this.master) this.master.gain.setTargetAtTime(value * 0.45, this.ctx.currentTime, 0.15);
  }

  setEnabled(value) {
    this.enabled = value;
    this.update();
  }

  pause(value) {
    this.paused = value;
    this.update();
  }

  play(name) {
    if (name === this.current) return;
    this.current = name;
    if (this.session) {
      const outgoing = this.session;
      clearInterval(outgoing.timer);
      this.ramp(outgoing.bus.gain, 0);
      outgoing.cleanup = setTimeout(() => this.dispose(outgoing), 1040);
      this.session = null;
    }
    this.update();
  }

  ramp(gain, value) {
    const now = this.ctx.currentTime;
    if (gain.cancelAndHoldAtTime) gain.cancelAndHoldAtTime(now);
    else {
      gain.cancelScheduledValues(now);
      gain.setValueAtTime(gain.value, now);
    }
    gain.linearRampToValueAtTime(value, now + 1);
  }

  noiseBuffer() {
    if (!this.buffer) {
      const ctx = this.ctx;
      this.buffer = ctx.createBuffer(2, ctx.sampleRate * 6, ctx.sampleRate);
      for (let channel = 0; channel < 2; channel++) {
        const samples = this.buffer.getChannelData(channel);
        for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
      }
    }
    return this.buffer;
  }

  update() {
    if (!this.enabled || this.paused || document.hidden) {
      this.stop();
      return;
    }
    const profile = ambientProfiles[this.current];
    if (!this.ctx || !profile || this.session) return;
    const ctx = this.ctx;
    const session = {
      name: this.current,
      bus: ctx.createGain(),
      voices: new Set(),
      nodes: [],
    };
    this.session = session;
    this.sessions.add(session);
    session.bus.gain.value = 0;
    session.bus.connect(this.master);
    this.ramp(session.bus.gain, 1);

    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer();
    source.loop = true;
    const high = ctx.createBiquadFilter();
    high.type = 'highpass';
    high.frequency.value = profile.high;
    const low = ctx.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = profile.low;
    const level = ctx.createGain();
    level.gain.value = profile.level;
    const drift = ctx.createOscillator();
    drift.frequency.value = profile.rate;
    const depth = ctx.createGain();
    depth.gain.value = profile.level * 0.22;
    source.connect(high).connect(low).connect(level).connect(session.bus);
    drift.connect(depth).connect(level.gain);
    session.nodes.push(high, low, level, depth);
    session.voices.add(source);
    session.voices.add(drift);
    source.start();
    drift.start();

    if (profile.birds) {
      let phrase = 0;
      const birds = () => {
        const frequency = 1650 + (phrase++ % 3) * 180;
        renderScore(
          ctx,
          session.bus,
          [0, 0.22].map((at) => ({
            at,
            duration: 0.13,
            frequency,
            end: frequency * 1.35,
            type: 'sine',
            level: 0.014,
            attack: 0.035,
          })),
          {
            startTime: ctx.currentTime + 1.8,
            onVoice: (voice) => {
              session.voices.add(voice);
              voice.addEventListener('ended', () => session.voices.delete(voice), { once: true });
            },
          },
        );
      };
      birds();
      session.timer = setInterval(birds, 7300);
    }
  }

  dispose(session) {
    if (!this.sessions.delete(session)) return;
    clearInterval(session.timer);
    clearTimeout(session.cleanup);
    for (const voice of session.voices) {
      try {
        voice.stop();
      } catch {}
      voice.disconnect();
    }
    session.voices.clear();
    for (const node of session.nodes) node.disconnect();
    session.bus.disconnect();
  }

  stop() {
    for (const session of [...this.sessions]) this.dispose(session);
    this.session = null;
  }
}
