// Keep decoded scenery underneath each fade, including when navigation interrupts it.
export class BackgroundTransition {
  constructor(image) {
    this.image = image;
    this.layer = image.parentElement;
    this.frames = new Set();
    this.revision = 0;
  }
  pause(value) {
    this.paused = value;
    if (this.animation && ['running', 'paused'].includes(this.animation.playState)) {
      if (value) this.animation.pause();
      else this.animation.play();
    }
  }

  freeze() {
    if (!this.animation) return;
    const frame = this.animation.effect.target;
    frame.style.opacity = getComputedStyle(frame).opacity;
    this.animation.cancel();
    this.animation = null;
  }

  clear() {
    for (const frame of this.frames) frame.remove();
    this.frames.clear();
  }

  async show(src, { signal = new AbortController().signal, reduced = false } = {}) {
    if (signal.aborted) return;
    const revision = ++this.revision;
    this.freeze();
    if (this.image.getAttribute('src') === src && !this.frames.size) return;

    const frame = this.image.cloneNode(false);
    frame.removeAttribute('id');
    frame.classList.add('background-frame');
    frame.src = src;
    // Decode offscreen so the current scenery stays intact while the next one loads.
    await frame.decode();
    if (signal.aborted || revision !== this.revision) return;

    if (!reduced) {
      frame.style.opacity = '0';
      this.layer.insertBefore(frame, this.layer.querySelector('.scene-tint'));
      this.frames.add(frame);
      const animation = frame.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 850,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards',
      });
      this.animation = animation;
      if (this.paused) animation.pause();
      // Preserve the visible blend instead of snapping back during rapid navigation.
      const cancel = () => {
        if (this.animation === animation) this.freeze();
      };
      signal.addEventListener('abort', cancel, { once: true });
      try {
        await animation.finished;
      } catch {
        return;
      } finally {
        signal.removeEventListener('abort', cancel);
      }
    }

    if (signal.aborted || revision !== this.revision) return;
    this.image.src = src;
    // Retain the fully visible overlay until the permanent image is ready to paint.
    await this.image.decode();
    if (signal.aborted || revision !== this.revision) return;
    this.animation?.cancel();
    this.animation = null;
    this.clear();
  }
}
