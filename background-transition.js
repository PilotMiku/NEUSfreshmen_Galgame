// Only the scenery blurs. Each navigation can cancel the previous transition.
export class BackgroundTransition {
  constructor(image) {
    this.image = image;
    this.layer = image.parentElement;
  }
  pause(value) {
    this.paused = value;
    if (this.animation && ['running', 'paused'].includes(this.animation.playState)) {
      if (value) this.animation.pause();
      else this.animation.play();
    }
  }

  async blur(from, to, duration, signal) {
    this.animation?.cancel();
    const animation = this.layer.animate(
      [{ filter: `blur(${from}px)` }, { filter: `blur(${to}px)` }],
      {
        duration,
        easing: 'ease-in-out',
        fill: 'forwards',
      },
    );
    this.animation = animation;
    if (this.paused) animation.pause();
    const cancel = () => animation.cancel();
    signal.addEventListener('abort', cancel, { once: true });
    try {
      await animation.finished;
      if (to === 0) animation.cancel();
      return !signal.aborted;
    } catch {
      return false;
    } finally {
      signal.removeEventListener('abort', cancel);
    }
  }

  async show(src, { signal, reduced = false } = {}) {
    this.animation?.cancel();
    if (signal.aborted || this.image.getAttribute('src') === src) return;
    if (reduced) {
      this.image.src = src;
      return;
    }
    if (!(await this.blur(0, 14, 240, signal))) return;
    this.image.src = src;
    // The caller has loaded this source; decode before revealing it at full sharpness.
    try {
      await this.image.decode();
    } catch {}
    if (signal.aborted) return;
    await this.blur(14, 0, 360, signal);
  }
}
