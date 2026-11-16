export class PausableTimer {
  constructor({
    now = () => performance.now(),
    set = (fn, ms) => setTimeout(fn, ms),
    clear = (id) => clearTimeout(id),
  } = {}) {
    Object.assign(this, { now, setTimeout: set, clearTimeout: clear });
    this.paused = false;
    this.id = null;
    this.callback = null;
  }
  get active() {
    return this.callback !== null;
  }
  set(delay, callback) {
    this.clear();
    this.remaining = Math.max(0, delay);
    this.callback = callback;
    this.run();
  }
  run() {
    if (this.paused || !this.active || this.id !== null) return;
    this.started = this.now();
    this.id = this.setTimeout(() => {
      this.id = null;
      const callback = this.callback;
      this.callback = null;
      callback?.();
    }, this.remaining);
  }
  pause(value) {
    if (this.paused === value) return;
    this.paused = value;
    if (value && this.id !== null) {
      this.clearTimeout(this.id);
      this.id = null;
      this.remaining = Math.max(0, this.remaining - (this.now() - this.started));
    }
    if (!value) this.run();
  }
  clear() {
    if (this.id !== null) this.clearTimeout(this.id);
    this.id = null;
    this.callback = null;
    this.remaining = 0;
  }
}
export class Typewriter {
  constructor(onUpdate, onFinish, clock) {
    this.onUpdate = onUpdate;
    this.onFinish = onFinish;
    this.clock = new PausableTimer(clock);
    this.active = false;
  }
  start(text, { speed = 32, instant = false } = {}) {
    this.stop();
    this.chars = Array.from(text);
    this.index = 0;
    this.speed = speed;
    this.active = true;
    this.onUpdate('');
    if (instant || !speed || !this.chars.length) {
      this.finish();
      return;
    }
    this.next();
  }
  next() {
    this.clock.set(this.speed, () => {
      if (!this.active) return;
      this.index++;
      this.onUpdate(this.chars.slice(0, this.index).join(''));
      if (this.index === this.chars.length) {
        this.active = false;
        this.onFinish();
      } else this.next();
    });
  }
  finish() {
    if (!this.active) return false;
    this.clock.clear();
    this.active = false;
    this.index = this.chars.length;
    this.onUpdate(this.chars.join(''));
    this.onFinish();
    return true;
  }
  setSpeed(speed) {
    this.speed = speed;
    if (!speed) this.finish();
  }
  pause(value) {
    this.clock.pause(value);
  }
  stop() {
    this.clock.clear();
    this.active = false;
  }
}
