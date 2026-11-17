const tone = (at, duration, frequency, end = frequency, type = 'sine', level = 0.2) => ({
  at,
  duration,
  frequency,
  end,
  type,
  level,
});
const noise = (at, duration, frequency = 1200, level = 0.12) => ({
  at,
  duration,
  frequency,
  type: 'noise',
  level,
});
export const cueNames = [
  'page',
  'travel',
  'arrival',
  'photo',
  'send',
  'receive',
  'typing',
  'erase',
  'glitch',
  'heartbeat',
  'binding',
  'welcome',
  'march',
  'rest',
  'practice',
  'rain',
  'farewell',
  'choice',
  'alarm',
  'math',
  'matrix',
  'english',
  'overload',
  'todo',
  'bounce',
  'bicycle',
  'person',
  'live',
  'help',
  'check',
  'ending',
  'phone-open',
  'key-delete',
  'steps',
  'book',
  'sigh',
  'surprise',
  'laugh',
  'warm',
  'rally',
  'dinner',
  'pocket',
  'memory',
  'share',
];
export function cueScore(name, variant = 0) {
  const pitch = 2 ** (variant / 48),
    bell = (at, f) => tone(at, 0.25, f * pitch, f * pitch, 'sine', 0.16);
  switch (name) {
    case 'alarm':
      return [
        ...Array.from({ length: 7 }, (_, i) =>
          tone(i * 0.44, 0.3, i % 2 ? 980 : 620, i % 2 ? 620 : 980, 'triangle', 0.2),
        ),
        tone(3.5, 0.45, 125, 45, 'sine', 0.24),
        noise(3.5, 0.18, 800, 0.12),
      ];
    case 'travel':
      return [
        noise(0, 0.7, 550, 0.12),
        ...Array.from({ length: 4 }, (_, i) => tone(i * 0.17, 0.09, 85, 45, 'triangle', 0.12)),
      ];
    case 'arrival':
      return [bell(0, 523), bell(0.13, 659), bell(0.27, 784)];
    case 'photo':
      return [
        noise(0, 0.045, 2400, 0.25),
        tone(0.02, 0.05, 180, 70, 'triangle', 0.2),
        noise(0.08, 0.04, 1700, 0.13),
      ];
    case 'send':
      return [tone(0, 0.16, 420, 920, 'sine', 0.19), noise(0, 0.12, 1800, 0.04)];
    case 'receive':
      return [bell(0, 880), bell(0.12, 1175)];
    case 'typing':
      return [
        noise(0, 0.018, 2800, 0.28),
        tone(0.006, 0.035, 210, 140, 'triangle', 0.22),
        noise(0.022, 0.012, 1700, 0.13),
      ];
    case 'key-delete':
      return [noise(0, 0.02, 1500, 0.22), tone(0.006, 0.04, 150, 90, 'triangle', 0.16)];
    case 'erase':
      return [noise(0, 0.12, 650, 0.14), tone(0, 0.13, 300, 180, 'triangle', 0.15)];
    case 'glitch':
      return [
        noise(0, 0.12, 2200, 0.13),
        tone(0.03, 0.09, 185, 80, 'sawtooth', 0.06),
        noise(0.19, 0.08, 3200, 0.1),
      ];
    case 'heartbeat':
      return [
        tone(0, 0.14, 65, 42, 'sine', 0.3),
        tone(0.22, 0.1, 80, 48, 'sine', 0.22),
        tone(0.7, 0.14, 65, 42, 'sine', 0.25),
        tone(0.92, 0.1, 80, 48, 'sine', 0.18),
      ];
    case 'binding':
      return [
        bell(0, 440),
        bell(0.16, 554),
        bell(0.32, 659),
        tone(0.5, 0.7, 880, 880, 'sine', 0.12),
      ];
    case 'welcome':
      return [
        bell(0, 659),
        bell(0.16, 784),
        bell(0.32, 1047),
        tone(0.32, 0.8, 523, 523, 'sine', 0.08),
      ];
    case 'march':
      return [0, 0.26, 0.52, 0.78].flatMap((at) => [
        noise(at, 0.055, 700, 0.09),
        tone(at, 0.11, 120, 55, 'triangle', 0.2),
      ]);
    case 'rest':
      return [tone(0, 0.35, 600, 280, 'sine', 0.14), noise(0.05, 0.4, 800, 0.04)];
    case 'practice':
      return [
        noise(0, 0.07, 1100, 0.13),
        tone(0.07, 0.1, 180, 90, 'triangle', 0.18),
        bell(0.22, 660),
      ];
    case 'rain':
      return [
        noise(0, 1.1, 2400, 0.1),
        ...Array.from({ length: 6 }, (_, i) =>
          tone(i * 0.13, 0.045, 1400 + i * 130, 700, 'sine', 0.035),
        ),
      ];
    case 'farewell':
      return [bell(0, 659), bell(0.22, 554), tone(0.44, 0.8, 440, 440, 'sine', 0.12)];
    case 'choice':
      return [bell(0, 698), bell(0.1, 932)];
    case 'math':
      return [noise(0, 0.28, 1900, 0.1), bell(0.12, 740), bell(0.28, 554)];
    case 'matrix':
      return [
        tone(0, 0.12, 262, 262, 'triangle', 0.17),
        tone(0.13, 0.12, 330, 330, 'triangle', 0.17),
        tone(0.26, 0.18, 392, 392, 'triangle', 0.17),
        tone(0.4, 0.18, 294, 294, 'triangle', 0.12),
      ];
    case 'english':
      return [noise(0, 0.22, 1100, 0.11), bell(0.15, 587), bell(0.31, 880)];
    case 'overload':
      return [0, 0.1, 0.19, 0.27].map((at, i) =>
        tone(at, 0.07, 350 + i * 110, 300 + i * 110, 'triangle', 0.12),
      );
    case 'todo':
      return [tone(0, 0.065, 620 * pitch, 850 * pitch, 'sine', 0.2)];
    case 'bounce':
      return [tone(0, 0.17, 170 * pitch, 50 * pitch, 'sine', 0.24), noise(0, 0.04, 450, 0.08)];
    case 'bicycle':
      return [tone(0, 0.45, 1760, 1760, 'sine', 0.12), tone(0.03, 0.4, 2370, 2370, 'sine', 0.07)];
    case 'person':
      return [bell(0, 440), bell(0.11, 440 * pitch * 1.25)];
    case 'live':
      return [tone(0, 0.4, 392, 392, 'sine', 0.12), tone(0.15, 0.5, 587, 587, 'sine', 0.08)];
    case 'help':
      return [bell(0, 523), tone(0.18, 0.6, 659, 659, 'sine', 0.1)];
    case 'check':
      return [bell(0, 784), bell(0.09, 1047), noise(0, 0.06, 1700, 0.045)];
    case 'ending':
      return [
        bell(0, 523),
        bell(0.2, 659),
        bell(0.4, 784),
        tone(0.6, 1.1, 1047, 1047, 'sine', 0.1),
      ];
    case 'phone-open':
      return [
        tone(0, 0.11, 170, 110, 'triangle', 0.15),
        tone(0.15, 0.11, 170, 110, 'triangle', 0.12),
        bell(0.28, 880),
      ];
    case 'steps':
      return [0, 0.3, 0.62].flatMap((at) => [
        noise(at, 0.065, 450, 0.14),
        tone(at, 0.085, 125, 65, 'sine', 0.18),
      ]);
    case 'book':
      return [
        noise(0, 0.13, 2200, 0.18),
        noise(0.16, 0.2, 3100, 0.13),
        tone(0.34, 0.07, 210, 100, 'triangle', 0.08),
      ];
    case 'sigh':
      return [noise(0, 0.6, 950, 0.13), tone(0.08, 0.55, 240, 140, 'sine', 0.12)];
    case 'surprise':
      return [tone(0, 0.12, 320, 660, 'triangle', 0.18), tone(0.15, 0.2, 880, 440, 'sine', 0.17)];
    case 'laugh':
      return [0, 0.17, 0.32].map((at, i) =>
        tone(at, 0.12, 450 + i * 85, 330 + i * 60, 'triangle', 0.14),
      );
    case 'warm':
      return [bell(0, 523), bell(0.14, 659), tone(0.28, 0.55, 784, 784, 'sine', 0.14)];
    case 'rally':
      return [
        tone(0, 0.2, 1320, 1480, 'sine', 0.12),
        noise(0.25, 0.1, 1600, 0.12),
        tone(0.4, 0.3, 1480, 1320, 'sine', 0.1),
      ];
    case 'dinner':
      return [
        noise(0, 0.035, 3800, 0.13),
        bell(0.02, 1568),
        bell(0.22, 1175),
        noise(0.38, 0.08, 1800, 0.07),
      ];
    case 'pocket':
      return [noise(0, 0.22, 650, 0.16), tone(0.16, 0.09, 160, 80, 'triangle', 0.1)];
    case 'memory':
      return [tone(0, 0.6, 784, 659, 'sine', 0.12), tone(0.24, 0.7, 523, 440, 'sine', 0.1)];
    case 'share':
      return [0, 0.16, 0.36].flatMap((at, i) => [
        noise(at, 0.045, 1700 + i * 250, 0.13),
        tone(at, 0.09, 320 + i * 70, 250 + i * 70, 'triangle', 0.07),
      ]);
    default:
      return [
        noise(0, 0.12, 1050 + variant * 20, 0.065),
        tone(0.04, 0.055, 480 * pitch, 380 * pitch, 'sine', 0.035),
      ];
  }
}
export const sceneCues = {
  s0: 'travel',
  s1: 'memory',
  s2: 'travel',
  s3: 'photo',
  s4: 'steps',
  s5: 'phone-open',
  s6: 'glitch',
  s7: 'heartbeat',
  s8: 'binding',
  s9: 'welcome',
  s11: 'surprise',
  'opening-ceremony': 'march',
  s12: 'march',
  'training-break': 'rest',
  'training-practice': 'practice',
  'training-evening': 'rally',
  s13: 'receive',
  s14: 'rain',
  s15: 'warm',
  s16: 'person',
  s17: 'dinner',
  'training-last-day': 'farewell',
  s18: 'steps',
  farewell: 'choice',
  cry: 'sigh',
  s21: 'memory',
  ready: 'welcome',
  s23: 'memory',
  courses: 'alarm',
  s25: 'math',
  s26: 'matrix',
  s27: 'english',
  s28: 'glitch',
  s29: 'sigh',
  s30: 'todo',
  s31: 'overload',
  s32: 'book',
  s33: 'overload',
  s34: 'heartbeat',
  s35: 'receive',
  s36: 'typing',
  s37: 'person',
  s38: 'bicycle',
  s39: 'steps',
  s40: 'help',
  s41: 'rest',
  s42: 'warm',
  s43: 'person',
  s44: 'sigh',
  s45: 'laugh',
  s46: 'warm',
  s47: 'book',
  s48: 'help',
  s49: 'todo',
  s50: 'laugh',
  s51: 'receive',
  s52: 'pocket',
  s53: 'rest',
  s54: 'dinner',
  s55: 'heartbeat',
  pause: 'live',
  'new-difficulties': 'sigh',
  'recall-lead': 'memory',
  'mao-encouragement': 'help',
  'mao-encouragement-continued': 'help',
  'ask-for-help': 'warm',
  'next-step': 'live',
  'group-sharing': 'share',
  s77: 'todo',
  s78: 'math',
  s79: 'help',
  s80: 'rest',
  s81: 'welcome',
  s82: 'steps',
  s83: 'welcome',
  s84: 'steps',
  s85: 'rest',
  s86: 'ending',
};
export function sceneCue(scene) {
  return sceneCues[scene.id] || (scene.kind === 'live' ? 'live' : scene.spoken ? 'person' : 'page');
}
export function renderCue(ctx, destination, name, { variant = 0, ...options } = {}) {
  return renderScore(ctx, destination, cueScore(name, variant), options);
}
export function renderScore(
  ctx,
  destination,
  score,
  { startTime = ctx.currentTime, strength = 1, onVoice = () => {} } = {},
) {
  const sources = [];
  for (const note of score) {
    const start = startTime + note.at,
      gain = ctx.createGain();
    let source;
    if (note.type === 'noise') {
      source = ctx.createBufferSource();
      const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * note.duration), ctx.sampleRate),
        data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = note.frequency;
      source.connect(filter);
      filter.connect(gain);
      source.onended = () => filter.disconnect();
    } else {
      source = ctx.createOscillator();
      source.type = note.type;
      source.frequency.setValueAtTime(note.frequency, start);
      source.frequency.exponentialRampToValueAtTime(note.end, start + note.duration);
      source.connect(gain);
    }
    const level = Math.max(0.0001, note.level * Math.max(0, strength));
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(level, start + Math.min(0.008, note.duration / 4));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + note.duration);
    gain.connect(destination);
    const ended = source.onended;
    source.onended = () => {
      ended?.();
      source.disconnect();
      gain.disconnect();
    };
    onVoice(source);
    sources.push(source);
    source.start(start);
    source.stop(start + note.duration + 0.01);
  }
  return sources;
}
// Keep keyboards and soft actions present alongside the louder scene stingers.
export const cueMix = {
  typing: 1.8,
  'key-delete': 2,
  erase: 2,
  rest: 1.8,
  send: 1.7,
  todo: 1.8,
  rain: 1.5,
  bounce: 1.4,
  welcome: 0.85,
  alarm: 0.9,
};
export class EventSounds {
  constructor() {
    this.enabled = false;
    this.volume = 0.9;
    this.paused = false;
    this.voices = new Set();
    this.last = new Map();
  }
  attach(ctx) {
    if (this.ctx) return;
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.volume * 0.85;
    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -10;
    this.limiter.knee.value = 12;
    this.limiter.ratio.value = 6;
    this.limiter.attack.value = 0.003;
    this.limiter.release.value = 0.12;
    this.master.connect(this.limiter);
    this.limiter.connect(ctx.destination);
  }
  setEnabled(value) {
    this.enabled = value;
    if (!value) this.stop();
  }
  setVolume(value) {
    this.volume = value;
    if (this.master) this.master.gain.setTargetAtTime(value * 0.85, this.ctx.currentTime, 0.025);
  }
  pause(value) {
    this.paused = value;
    if (value) this.stop();
  }
  stop() {
    for (const source of this.voices) {
      try {
        source.stop();
      } catch {}
    }
    this.voices.clear();
  }
  play(name, options = {}) {
    if (
      !name ||
      !this.enabled ||
      this.paused ||
      !this.ctx ||
      this.ctx.state !== 'running' ||
      document.hidden
    )
      return;
    const now = this.ctx.currentTime,
      spacing = name === 'bounce' ? 0.15 : name === 'todo' ? 0.05 : 0.035;
    if (now - (this.last.get(name) ?? -10) < spacing) return;
    this.last.set(name, now);
    renderCue(this.ctx, this.master, name, {
      ...options,
      strength: (options.strength ?? 1) * (cueMix[name] ?? 1),
      onVoice: (source) => {
        this.voices.add(source);
        source.addEventListener('ended', () => this.voices.delete(source), { once: true });
      },
    });
  }
  enter(scene) {
    this.stop();
    const variant =
      (Array.from(scene.id).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 13) - 6;
    this.play(sceneCue(scene), { variant });
  }
}
