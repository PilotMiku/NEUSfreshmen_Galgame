const paths = {
  play: '<path d="m9 5 11 7-11 7Z"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  back: '<path d="m9 5-6 6 6 6M3 11h11a6 6 0 0 1 6 6v2"/>',
  music:
    '<path d="M9 17V5l11-2v12M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2.5"/><ellipse cx="17" cy="16" rx="3" ry="2.5"/>',
  fullscreen: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  settings:
    '<path d="m10 3-1 3-3 1-3-1-1 4 3 2 1 3-1 3 4 2 2-2 3-1 3 1 2-4-2-2-1-3 1-3-4-2-2 2Z"/><circle cx="11" cy="11" r="3"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  book: '<path d="M12 5v15M3 4c4-1 7 0 9 2 2-2 5-3 9-2v14c-4-1-7 0-9 2-2-2-5-3-9-2Z"/><path d="M6 8h3m6 0h3M6 12h3m6 0h3"/>',
  save: '<path d="M5 3h12l4 4v14H3V3Zm2 0v6h10V3M7 21v-7h10v7"/>',
  folder: '<path d="M3 7V4h6l3 3h9v13H3Z"/><path d="M3 10h18"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  home: '<path d="m3 10 9-7 9 7M5 9v12h14V9M10 21v-7h4v7"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  cloud: '<path d="M6 18h12a4 4 0 0 0 0-8h-1a5 5 0 0 0-10-1 4.5 4.5 0 0 0-1 9Z"/>',
  sparkle: '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/>',
  plane: '<path d="m3 10 18-7-7 18-3-8-8-3Zm8 3L21 3"/>',
  flower:
    '<path d="M12 8C5-3 0 9 8 11c-12 2-1 14 3 5-1 12 13 4 5-2 12 0 7-13-1-6 6-10-7-11-3 0Z"/><circle cx="12" cy="12" r="2.5"/>',
  leaf: '<path d="M20 3C8 2 2 6 4 14s15 8 16-11ZM4 20 16 8m-6 6V9m0 5h5"/>',
  heart: '<path d="M12 21S2 14 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 6-10 13-10 13Z"/>',
  ribbon:
    '<circle cx="12" cy="9" r="6"/><path d="m8 14-2 8 6-3 6 3-2-8m-6-5 1.3-1.3L13 9l-1.7 1.7Z"/>',
  cup: '<path d="M4 7h13v7a6 6 0 0 1-12 0L4 7Zm13 1h2a3 3 0 0 1 0 6h-2M3 22h16M7 3v1m5-1v1"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
  voice: '<path d="M4 9h4l5-5v16l-5-5H4Zm12-1a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
};
export function icon(name, className = 'ui-icon') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  for (const [key, value] of Object.entries({
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '1.7',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    focusable: 'false',
    class: className,
  }))
    svg.setAttribute(key, value);
  svg.innerHTML = paths[name] || paths.sparkle;
  return svg;
}
function controlIcon(button, name) {
  if (!button) return;
  for (const child of [...button.childNodes]) if (child.nodeType === Node.TEXT_NODE) child.remove();
  button.querySelectorAll(':scope > svg.ui-icon').forEach((node) => node.remove());
  button.prepend(icon(name));
  button.dataset.icon = name;
}
export function decorateInterface() {
  for (const [id, name] of Object.entries({
    sound: 'music',
    fullscreen: 'fullscreen',
    settings: 'settings',
    back: 'back',
    log: 'book',
    save: 'save',
    load: 'folder',
    auto: 'play',
    'hide-ui': 'eye',
    'home-button': 'home',
    'modal-close': 'close',
  }))
    controlIcon(document.getElementById(id), name);
  controlIcon(document.querySelector('[data-photo-close]'), 'close');
  document.querySelector('.play-triangle')?.replaceChildren(icon('play'));
  document.querySelector('.button-arrow')?.replaceChildren(icon('arrow'));
  document.querySelector('.continue-button > span')?.replaceChildren(icon('arrow'));
  document.querySelector('#live-next > span')?.replaceChildren(icon('arrow'));
  document.querySelector('.location-label > span')?.replaceChildren(icon('pin'));
  document
    .querySelectorAll('[data-doodle]')
    .forEach((node) => node.replaceChildren(icon(node.dataset.doodle)));
}
const roleIcons = {
  班长: 'ribbon',
  团支书: 'leaf',
  生活委员: 'cup',
  心理委员: 'cup',
  组宣: 'flower',
  学习委员: 'book',
  文体委员: 'music',
  毛学长: 'sun',
};
export function decorateSpeaker(scene, character = {}) {
  const dialogue = document.getElementById('dialogue');
  dialogue.dataset.voice =
    scene.who === 'NEU生活模拟器'
      ? 'system'
      : scene.who === '我' && !scene.spoken
        ? 'thought'
        : 'spoken';
  dialogue.style.setProperty(
    '--speaker-accent',
    character.color || (dialogue.dataset.voice === 'system' ? '#b39abd' : '#82aebb'),
  );
  document
    .getElementById('speaker-icon')
    .replaceChildren(
      icon(
        roleIcons[scene.who] ||
          (dialogue.dataset.voice === 'thought'
            ? 'cloud'
            : dialogue.dataset.voice === 'system'
              ? 'sparkle'
              : 'plane'),
      ),
    );
}
