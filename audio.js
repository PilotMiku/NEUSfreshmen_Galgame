// Each music track has its own bus so adjacent chapters can overlap during a short fade.
import { EventSounds, renderScore } from './event-sounds.js';
import { musicTracks, musicStep } from './music-score.js';
import { Ambience } from './ambience.js';
import { sceneAudio } from './scene-audio.js';
export class Soundtrack {
  constructor() {
    this.enabled = false;
    this.paused = false;
    this.volume = 0.35;
    this.current = 'off';
    this.ctx = null;
    this.master = null;
    this.assetMap = {};
    this.sessions = new Set();
    this.events = new EventSounds();
    this.ambience = new Ambience();
    this.resumeTick = 0;
  }
  get voices() {
    return new Set([...this.sessions].flatMap((session) => [...session.voices]));
  }
  get timer() {
    return this.session?.timer ?? null;
  }
  get tick() {
    return this.session?.tick ?? this.resumeTick;
  }
  async unlock() {
    try {
      if (!this.ctx) {
        const Context = window.AudioContext || window.webkitAudioContext;
        if (!Context) return;
        this.ctx = new Context();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.volume * 0.4;
        this.master.connect(this.ctx.destination);
        this.events.attach(this.ctx);
        this.ambience.attach(this.ctx);
      }
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      this.update();
    } catch {}
  }
  setEnabled(value) {
    if (this.enabled === value) return;
    if (!value) this.resumeTick = this.tick;
    this.enabled = value;
    this.events.setEnabled(value);
    this.ambience.setEnabled(value);
    this.update();
  }
  cue(name, options) {
    this.events.play(name, options);
  }
  enter(scene, { mode = 'solo' } = {}) {
    const mix = sceneAudio(scene, mode);
    this.play(mix.music);
    this.ambience.play(mix.ambience);
  }
  setVolume(value) {
    this.volume = value;
    if (this.master) this.master.gain.setTargetAtTime(value * 0.4, this.ctx.currentTime, 0.15);
  }
  play(track) {
    if (track === this.current) return;
    this.current = track;
    this.resumeTick = 0;
    if (this.session) {
      this.retire(this.session, 0.55);
      this.session = null;
    }
    this.update();
  }
  ramp(gain, value, duration) {
    const now = this.ctx.currentTime;
    if (gain.cancelAndHoldAtTime) gain.cancelAndHoldAtTime(now);
    else {
      gain.cancelScheduledValues(now);
      gain.setValueAtTime(gain.value, now);
    }
    gain.linearRampToValueAtTime(value, now + duration);
  }
  dispose(session) {
    if (!this.sessions.has(session)) return;
    clearInterval(session.timer);
    clearTimeout(session.cleanup);
    for (const voice of session.voices) {
      try {
        voice.stop();
      } catch {}
    }
    session.voices.clear();
    if (session.media) {
      session.media.onerror = null;
      session.media.pause();
      session.media.removeAttribute('src');
      session.media.load();
      session.media = null;
    }
    session.mediaNode?.disconnect();
    session.bus.disconnect();
    this.sessions.delete(session);
  }
  retire(session, duration) {
    // Retiring oscillators continue to their scheduled end while their bus fades out.
    clearInterval(session.timer);
    session.timer = null;
    session.retiring = true;
    this.ramp(session.bus.gain, 0, duration);
    session.cleanup = setTimeout(() => this.dispose(session), duration * 1000 + 40);
  }
  stop() {
    for (const session of [...this.sessions]) this.dispose(session);
    this.session = null;
  }
  pause(value) {
    this.ambience.pause(value);
    if (this.paused === value) return;
    this.paused = value;
    if (value) {
      this.resumeTick = this.tick;
      this.stop();
    } else this.update();
  }
  update() {
    if (!this.enabled || this.paused || document.hidden) {
      this.stop();
      return;
    }
    if (!this.ctx || this.current === 'off' || this.session) return;
    const session = {
      track: this.current,
      bus: this.ctx.createGain(),
      voices: new Set(),
      tick: this.resumeTick,
      timer: null,
    };
    session.bus.gain.value = 0;
    session.bus.connect(this.master);
    this.sessions.add(session);
    this.session = session;
    this.ramp(session.bus.gain, 1, 0.55);
    const file = this.assetMap[`bgm_${session.track}`];
    if (!file) {
      this.synth(session);
      return;
    }
    const media = new Audio(file);
    session.media = media;
    media.loop = true;
    media.volume = 1;
    session.mediaNode = this.ctx.createMediaElementSource(media);
    session.mediaNode.connect(session.bus);
    const fallback = () => {
      if (!this.sessions.has(session) || session.retiring || session.media !== media) return;
      media.onerror = null;
      media.pause();
      media.removeAttribute('src');
      media.load();
      session.media = null;
      session.mediaNode.disconnect();
      this.synth(session);
    };
    media.onerror = fallback;
    media.play().catch(fallback);
  }
  synth(session) {
    if (!musicTracks[session.track] || !this.sessions.has(session) || session.retiring) return;
    const interval = 30 / musicTracks[session.track].bpm;
    session.nextBeat = this.ctx.currentTime + 0.04;
    const schedule = () => {
      if (session.nextBeat < this.ctx.currentTime - 0.1)
        session.nextBeat = this.ctx.currentTime + 0.03;
      while (session.nextBeat < this.ctx.currentTime + 0.18) {
        renderScore(this.ctx, session.bus, musicStep(session.track, session.tick++), {
          startTime: session.nextBeat,
          onVoice: (voice) => {
            session.voices.add(voice);
            voice.addEventListener('ended', () => session.voices.delete(voice), { once: true });
          },
        });
        session.nextBeat += interval;
      }
    };
    schedule();
    session.timer = setInterval(schedule, 60);
  }
}
