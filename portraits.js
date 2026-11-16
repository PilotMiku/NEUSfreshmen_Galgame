const escapeXml = text => String(text).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
}[character]));

// A neutral stand-in, kept separate from the finished character artwork.
export function portraitPlaceholder(name, color = '#789789') {
  const coat = /^#[\da-f]{6}$/i.test(color) ? color : '#789789';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 700">
    <defs><linearGradient id="coat" x2="0" y2="1"><stop stop-color="${coat}"/><stop offset="1" stop-color="#354b41"/></linearGradient></defs>
    <g stroke="#f7f3e8" stroke-width="3" stroke-linejoin="round">
      <path d="M164 192v60l36 36 36-36v-60" fill="#d3d3c4"/>
      <ellipse cx="200" cy="122" rx="68" ry="88" fill="#dadbcc"/>
      <path d="M158 242l-54 22q-29 13-38 57L30 559l46 13 40-178-4 306h176l-4-306 40 178 46-13-36-238q-9-44-38-57l-54-22-42 42z" fill="url(#coat)"/>
      <path d="M158 242l42 42-29 41-37-71m108-12-42 42 29 41 37-71" fill="#f3efe1"/>
      <path d="M200 284v416" fill="none" stroke-opacity=".35"/>
    </g>
    <rect x="103" y="386" width="194" height="66" rx="3" fill="#f7f3e8" fill-opacity=".94"/>
    <text x="200" y="428" text-anchor="middle" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="25" fill="#415b4c">${escapeXml(name)}</text>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

export class PortraitLayer {
  constructor(container, image, label, dialogue) {
    this.container = container;
    this.image = image;
    this.label = label;
    this.dialogue = dialogue;
    this.key = null;
    this.sequence = 0;
    this.frame = null;
    this.echo = document.createElement('div');
    this.echo.className = 'portrait-echo';
    this.echo.setAttribute('aria-hidden', 'true');
    this.echoImage = document.createElement('img');
    this.echoImage.alt = '';
    this.echo.append(this.echoImage);
    container.before(this.echo);
    container.className = 'character left';
    container.setAttribute('aria-hidden', 'true');
    this.reflow = () => this.fit();
    if (dialogue) new ResizeObserver(this.reflow).observe(dialogue);
    window.addEventListener('resize', this.reflow);
  }

  fit() {
    if (!this.dialogue || this.container.dataset.portrait !== 'image' || !this.image.naturalWidth) return;
    const dialogue = this.dialogue.getBoundingClientRect();
    const headerBottom = document.querySelector('.topbar')?.getBoundingClientRect().bottom || 0;
    const parentTop = this.container.offsetParent?.getBoundingClientRect().top || 0;
    // Frame the original artwork down to the hips, aligned with the dialogue edge.
    const hipRatio = this.image.naturalHeight / this.image.naturalWidth * this.hipFraction;
    const desiredWidth = innerWidth <= 760 ? Math.min(280, innerWidth * .62) : Math.min(330, innerWidth * .22);
    const visibleHeight = Math.min(desiredWidth * 1.3, Math.max(60, dialogue.top - headerBottom - 30));
    const width = visibleHeight / hipRatio;
    this.container.style.setProperty('--portrait-width', width + 'px');
    this.container.style.setProperty('--portrait-top', (dialogue.top - visibleHeight - parentTop) + 'px');
    this.container.style.setProperty('--portrait-height', (visibleHeight + Math.min(120, dialogue.height * .6)) + 'px');
    const shift = Math.min(64, width * .19), echoWidth = width * 1.05;
    this.echo.style.width = echoWidth + 'px';
    this.echo.style.height = (visibleHeight + Math.min(120, dialogue.height * .6)) + 'px';
    this.echo.style.left = Math.max(8, Math.min(this.container.offsetLeft + shift, innerWidth - echoWidth - 12)) + 'px';
    this.echo.style.top = (Math.max(headerBottom + 8, dialogue.top - visibleHeight - shift) - parentTop) + 'px';
  }

  hide() {
    this.sequence++;
    this.key = null;
    cancelAnimationFrame(this.frame);
    this.image.onload = null;
    this.image.onerror = null;
    this.container.classList.remove('is-visible');
    this.container.setAttribute('aria-hidden', 'true');
    this.echo.classList.remove('is-visible');
    this.echoImage.onload = null;
    this.echoImage.onerror = null;
    this.echoImage.removeAttribute('src');
    this.echoReady = false;
  }

  show(name, character = {}, assets = {}) {
    const source = typeof assets[character.file] === 'string' ? assets[character.file] : null;
    const echoSource = character.companion ? assets[character.companion] : null;
    const key = name + '\0' + (source || 'placeholder') + '\0' + (echoSource || '');
    if (this.key === key) return;
    this.hide();
    this.key = key;
    const sequence = this.sequence;
    const fallback = portraitPlaceholder(name, character.color);
    this.image.alt = name;
    this.label.textContent = name;
    this.container.dataset.character = name;
    this.hipFraction = character.portraitHip ?? .62;
    this.container.dataset.portrait = source ? 'image' : 'placeholder';
    this.image.onload = () => {
      if (sequence !== this.sequence || !this.image.complete || !this.image.naturalWidth) return;
      this.fit();
      this.frame = requestAnimationFrame(() => {
        if (sequence !== this.sequence) return;
        this.container.setAttribute('aria-hidden', 'false');
        this.container.classList.add('is-visible');
        if (this.echoReady && this.container.dataset.portrait === 'image') this.echo.classList.add('is-visible');
      });
    };
    this.image.onerror = () => {
      if (sequence !== this.sequence) return;
      this.image.onerror = null;
      this.container.dataset.portrait = 'placeholder';
      this.echo.classList.remove('is-visible');
      this.image.src = fallback;
    };
    this.image.src = source || fallback;
    if (source && echoSource) {
      this.echoImage.onload = () => {
        if (sequence !== this.sequence || !this.echoImage.naturalWidth) return;
        this.echoReady = true;
        if (this.container.classList.contains('is-visible') && this.container.dataset.portrait === 'image') this.echo.classList.add('is-visible');
      };
      this.echoImage.onerror = () => {
        if (sequence !== this.sequence) return;
        this.echoReady = false;
        this.echo.classList.remove('is-visible');
      };
      this.echoImage.src = echoSource;
    }
  }
}
