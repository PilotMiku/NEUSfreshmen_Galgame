import { element as el } from './ui.js';
export function loadSettings(storage, reduced = false) {
  const settings = {
      speed: 32,
      volume: 0.35,
      effectsVolume: 0.9,
      font: 21,
      mode: 'solo',
      sound: true,
      motion: reduced,
    },
    saved = storage.get('settings', {});
  if (!saved || typeof saved !== 'object') return settings;
  for (const [key, min, max] of [
    ['speed', 0, 65],
    ['volume', 0, 1],
    ['effectsVolume', 0, 1],
    ['font', 17, 27],
  ])
    if (Number.isFinite(saved[key])) settings[key] = Math.max(min, Math.min(max, saved[key]));
  if (['solo', 'live'].includes(saved.mode)) settings.mode = saved.mode;
  for (const key of ['sound', 'motion'])
    if (typeof saved[key] === 'boolean') settings[key] = saved[key];
  return settings;
}
export function settingsPanel(settings, persistSettings, onModeChange) {
  const wrap = el('div');
  const range = (name, key, min, max, step, desc) => {
    const row = el('div', 'setting-row'),
      l = el('label', '', name),
      input = el('input');
    input.id = 'setting-' + key;
    l.htmlFor = input.id;
    if (desc) l.append(el('small', '', desc));
    input.type = 'range';
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = settings[key];
    input.setAttribute('aria-label', name);
    input.oninput = () => {
      settings[key] = Number(input.value);
      persistSettings();
    };
    row.append(l, input);
    wrap.append(row);
  };
  range('文字速度', 'speed', 0, 65, 5, '左边更快；最左侧立即显示。');
  range('文字大小', 'font', 17, 27, 1, '调整正文大小。');
  range('音乐音量', 'volume', 0, 1, 0.05, '右上角音符控制所有声音。');
  range('音效音量', 'effectsVolume', 0, 1, 0.05, '台词场景音效、手机键盘、消息和碰撞声。');
  const row = el('div', 'setting-row'),
    label = el('label', '', '游玩方式'),
    select = el('select');
  select.id = 'setting-mode';
  label.htmlFor = select.id;
  for (const [value, text] of [
    ['solo', '单人 · 展示参考回应'],
    ['live', '现场 · 等待主持人'],
  ]) {
    const op = el('option', '', text);
    op.value = value;
    op.selected = settings.mode === value;
    select.append(op);
  }
  select.onchange = () => {
    settings.mode = select.value;
    persistSettings();
    onModeChange();
  };
  row.append(label, select);
  wrap.append(row);
  const mr = el('div', 'setting-row'),
    ml = el('label', '', '减少动态效果'),
    mi = el('input');
  mi.id = 'setting-motion';
  ml.htmlFor = mi.id;
  mi.type = 'checkbox';
  mi.checked = settings.motion;
  mi.onchange = () => {
    settings.motion = mi.checked;
    persistSettings();
  };
  mr.append(ml, mi);
  wrap.append(
    mr,
    el(
      'p',
      'storage-note',
      '存档、称呼和分享笔记只保存在当前浏览器。游戏无需账号，不上传这些内容。',
    ),
  );
  return wrap;
}
