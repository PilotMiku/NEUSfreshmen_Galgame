import {
  story,
  chapters,
  characters,
  backgrounds,
  todos,
  nextIndex,
  validSave,
  normalizeSave,
} from './story.js';
import { Soundtrack } from './audio.js';
import { PortraitLayer } from './portraits.js';
import { albums, PhotoViewer } from './albums.js';
import { TodoList, SceneEffects } from './scene-effects.js';
import { PhoneChat, chatKinds } from './phone-chat.js';
import { ResolvedTodos } from './resolved-todos.js';
import { BackgroundTransition } from './background-transition.js';
import { createStorage } from './storage.js';
import { loadSettings, settingsPanel } from './settings.js';
import { savePanel } from './save-panel.js';
import { newGameState, sessionSnapshot, chapterReplayState, endingReflection } from './session.js';
import { PausableTimer, Typewriter } from './playback.js';
import { element as el } from './ui.js';
import { defaultAssets } from './assets-default.js';
import {
  fetchManifest,
  backgroundSource,
  portraitSource,
  loadImage,
  preloadImage,
} from './asset-loader.js';
const $ = (id) => document.getElementById(id),
  sound = new Soundtrack();
const portraits = new PortraitLayer(
  $('character'),
  $('character-image'),
  $('character-tag'),
  $('dialogue'),
);
const phoneTodos = new TodoList(
  (count) => {
    $('phone-title').textContent = '待办事项 · ' + count;
  },
  (name) => sound.cue(name),
);
const resolvedTodos = new ResolvedTodos((name) => sound.cue(name));
const effects = new SceneEffects(
  $('cinematic'),
  $('todo-rain'),
  $('dialogue'),
  todos,
  () => scheduleAuto(),
  $('scene-decoration'),
  (name, options) => sound.cue(name, options),
);
const gallery = new PhotoViewer(
  $('photo-viewer'),
  () => {
    slideshowPlayedFor = story[state.index].id;
    sound.events.stop();
    syncPauses(true);
  },
  () => {
    syncPauses();
    resumePlayback();
  },
  () => sound.cue('photo'),
);
const chat = new PhoneChat(
  $('phone'),
  $('phone-content'),
  $('phone-title'),
  (name) => sound.cue(name),
  () => scheduleAuto(),
  (container) => gallery.renderAlbum('family', container, assets),
);
const storage = createStorage();
let settings = loadSettings(storage, matchMedia('(prefers-reduced-motion: reduce)').matches);
let state = newGameState(),
  replaying = false;
let screen = 'home',
  auto = false,
  pure = false,
  typing = false,
  toastTimer,
  fullText = '',
  assets = { ...defaultAssets },
  activeBg = '';
let slideshowPlayedFor = null,
  phoneKind = null;
const autoClock = new PausableTimer(),
  slideshowClock = new PausableTimer();
const writer = new Typewriter(
  (text) => {
    if (text === fullText) setDialogueText(text);
    else $('dialogue-text').textContent = text;
  },
  () => {
    typing = false;
    resolvedTodos.complete();
    if (!maybeSlideshow()) scheduleAuto();
  },
);

function toast(text) {
  $('toast').textContent = text;
  $('toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 2600);
}
function applySettings() {
  document.documentElement.style.setProperty('--dialogue-size', settings.font + 'px');
  document.body.classList.toggle('motion-reduced', settings.motion);
  $('sound').classList.toggle('sound-on', settings.sound);
  $('sound').setAttribute('aria-label', settings.sound ? '关闭声音' : '开启声音');
  sound.setVolume(settings.volume);
  sound.events.setVolume(settings.effectsVolume);
  sound.setEnabled(settings.sound);
  if (screen === 'game') {
    effects.words.setReduced(settings.motion);
    if (settings.motion) {
      effects.finish();
      chat.finish();
    }
    effects.pile.set(story[state.index].overflowCount || 0, settings.motion);
    phoneTodos.reduced = settings.motion;
    phoneTodos.tick();
    resolvedTodos.setReduced(settings.motion);
    writer.setSpeed(settings.speed);
    if (settings.motion) writer.finish();
  }
}
function persistSettings() {
  storage.set('settings', settings);
  applySettings();
}
function cleanTimers() {
  writer.stop();
  autoClock.clear();
  slideshowClock.clear();
  typing = false;
}
function snapshot() {
  return sessionSnapshot(state);
}
function autoSave() {
  if (replaying) return;
  const saved = storage.set('auto', snapshot());
  if (saved) $('continue').disabled = false;
}
const backgroundTransition = new BackgroundTransition($('background'));
let backgroundRequest,
  backgroundKey = 'xiaomen',
  manifestLoading = false;
const assetIssues = new Map();
function assetStatus() {
  const messages = [...assetIssues.values()];
  $('asset-status').hidden = !messages.length;
  $('asset-message').textContent = messages.join('；');
  $('asset-retry').hidden = !assetIssues.has('manifest') && !assetIssues.has('background');
}
async function background(name, force = false) {
  const key = backgrounds[name] || backgroundKey;
  backgroundKey = key;
  const small = matchMedia('(max-width:760px)').matches || navigator.connection?.saveData;
  const src = backgroundSource(key, assets, small);
  if (!force && activeBg === src) return;
  activeBg = src;
  backgroundRequest?.abort();
  const request = new AbortController();
  backgroundRequest = request;
  assetIssues.delete('background');
  assetStatus();
  try {
    await loadImage(src, { signal: request.signal });
    if (request.signal.aborted) return;
    await backgroundTransition.show(src, { signal: request.signal, reduced: settings.motion });
  } catch (error) {
    if (request.signal.aborted) return;
    // Keep a local, location-specific card available even when the photograph fails.
    await backgroundTransition.show('assets/' + key + '.svg', {
      signal: request.signal,
      reduced: settings.motion,
    });
    if (request.signal.aborted) return;
    assetIssues.set('background', '背景暂未加载，已显示备用画面');
    assetStatus();
  }
}
function preloadNextBackground() {
  if (navigator.connection?.saveData) return;
  const current = story[state.index];
  let index = state.index;
  for (let steps = 0; steps < story.length; steps++) {
    index = nextIndex(index);
    if (index === null) return;
    const scene = story[index];
    if (scene.bg !== current.bg) {
      preloadImage(
        backgroundSource(backgrounds[scene.bg], assets, matchMedia('(max-width:760px)').matches),
      );
      return;
    }
  }
}
function preloadNextPortrait() {
  if (navigator.connection?.saveData) return;
  const current = story[state.index],
    currentWho = current.character || (current.spoken && current.who !== '我' ? current.who : null);
  let index = state.index;
  for (let steps = 0; steps < story.length; steps++) {
    index = nextIndex(index);
    if (index === null) return;
    const scene = story[index],
      who = scene.character || (scene.spoken && scene.who !== '我' ? scene.who : null);
    if (who && who !== currentWho && characters[who]) {
      const character = characters[who],
        small = matchMedia('(max-width:760px)').matches;
      preloadImage(portraitSource(character.file, assets, small));
      if (character.companion) preloadImage(portraitSource(character.companion, assets, small));
      return;
    }
  }
}
function updateChapterAccess() {
  document
    .querySelectorAll('[data-chapters]')
    .forEach((button) => (button.hidden = !storage.get('completed', false)));
}
function chaptersModal() {
  if (!storage.get('completed', false)) return;
  const wrap = el('div', 'chapter-list');
  wrap.append(
    el('p', 'storage-note', '选择一章重新阅读。章节回看不会覆盖原来的自动进度和班会笔记。'),
  );
  chapters.forEach((chapter, index) => {
    const button = el('button', 'chapter-option');
    button.append(
      el('span', '', String(index + 1).padStart(2, '0')),
      el('strong', '', chapter.name),
      el('small', '', chapter.note),
    );
    button.onclick = () => {
      const saved = storage.get('auto');
      state = chapterReplayState(index, saved);
      replaying = true;
      setAuto(false);
      closeModal();
      showGame();
    };
    wrap.append(button);
  });
  openModal('章节回看', wrap, '通关之后');
}
function renderEndingReflection() {
  const reflection = endingReflection(state.notes);
  $('ending-reflection').hidden = !reflection;
  $('ending').classList.toggle('has-reflection', !!reflection);
  $('ending-reflection-label').textContent = reflection?.label || '';
  $('ending-reflection-text').textContent = reflection?.text || '';
}
async function refreshAssets() {
  if (manifestLoading) return;
  manifestLoading = true;
  assetIssues.set('loading', '正在加载素材信息…');
  assetStatus();
  try {
    let manifest;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        manifest = await fetchManifest();
        break;
      } catch (error) {
        if (attempt === 1) throw error;
      }
    }
    assets = { ...defaultAssets, ...manifest };
    sound.assetMap = assets;
    assetIssues.delete('manifest');
    background(
      screen === 'home' ? '校门' : screen === 'ending' ? '文管门口' : story[state.index].bg,
      true,
    );
    if (screen === 'game') {
      const scene = story[state.index];
      renderPortrait(scene);
      // Refresh previews too if the game began before the latest manifest arrived.
      if (albums[scene.phone] && !chatKinds.has(scene.phone)) renderPhone(scene.phone, scene);
      if (gallery.open) {
        gallery.assets = assets;
        gallery.render();
      }
    }
  } catch {
    assetIssues.set('manifest', '素材信息暂未更新，仍可继续游戏');
  } finally {
    manifestLoading = false;
    assetIssues.delete('loading');
    assetStatus();
  }
}
function showScreen(next) {
  gallery.close();
  effects.clear();
  phoneTodos.clear();
  resolvedTodos.clear();
  chat.clear();
  sound.events.stop();
  phoneKind = null;
  portraits.hide();
  screen = next;
  for (const id of ['home', 'game', 'ending']) $(id).classList.toggle('hidden', id !== next);
  document.body.classList.toggle('in-game', next === 'game');
  document.body.classList.toggle('ending-screen', next === 'ending');
  document.body.classList.remove(
    'pure',
    'choice-scene',
    'live-scene',
    'blackout',
    'glitch',
    'pixel',
    'has-phone',
    'has-portrait',
    'memory-scene',
  );
  $('memory-label').classList.add('hidden');
  pure = false;
  syncPauses();
}
function showHome() {
  cleanTimers();
  setAuto(false);
  showScreen('home');
  background('校门');
  sound.play('open');
  $('top-caption').textContent = '新生心理班会 · 互动剧场';
  $('continue').disabled = !validSave(storage.get('auto'));
  updateChapterAccess();
}
function setAuto(value) {
  auto = value;
  $('auto').classList.toggle('active', auto);
  $('auto').setAttribute('aria-pressed', String(auto));
  $('auto').querySelector('span').textContent = auto ? '自动中' : '自动';
  autoClock.clear();
  if (auto && !typing) scheduleAuto();
}
function scheduleAuto() {
  autoClock.clear();
  if (
    !auto ||
    screen !== 'game' ||
    $('modal').open ||
    gallery.open ||
    slideshowClock.active ||
    effects.busy ||
    chat.busy ||
    document.hidden ||
    pure ||
    typing
  )
    return;
  const scene = story[state.index];
  if (['choice', 'live', 'end'].includes(scene.kind)) return;
  autoClock.set(Math.max(1800, fullText.length * 65), () => advance());
}
function syncPauses(force = false) {
  const baseBlocked = $('modal').open || document.hidden || pure,
    obscured = force || baseBlocked || gallery.open,
    blocked = screen !== 'game' || obscured;
  document.body.classList.toggle('playback-paused', blocked);
  writer.pause(blocked);
  autoClock.pause(blocked);
  slideshowClock.pause(blocked);
  effects.pause(blocked);
  phoneTodos.pause(blocked);
  resolvedTodos.pause(blocked);
  chat.pause(blocked);
  gallery.pause(screen !== 'game' || baseBlocked);
  sound.pause(obscured);
  sound.events.pause(screen === 'home' || baseBlocked);
  backgroundTransition.pause(obscured);
}
function resumePlayback() {
  if (!typing && !maybeSlideshow() && !autoClock.active) scheduleAuto();
}

function setDialogueText(text) {
  const container = $('dialogue-text');
  container.classList.toggle('emotive-text', text.includes('¯᷄'));
  container.replaceChildren();
  let start = 0;
  for (const match of text.matchAll(/（[^）]*）/g)) {
    container.append(
      document.createTextNode(text.slice(start, match.index)),
      el('span', 'stage-direction', match[0]),
    );
    start = match.index + match[0].length;
  }
  container.append(document.createTextNode(text.slice(start)));
}
function maybeSlideshow() {
  const scene = story[state.index];
  if (
    screen !== 'game' ||
    typing ||
    !scene.slideshow ||
    settings.motion ||
    slideshowPlayedFor === scene.id ||
    $('modal').open ||
    document.hidden ||
    pure ||
    gallery.open
  )
    return false;
  slideshowPlayedFor = scene.id;
  slideshowClock.set(1000, () => {
    if (screen === 'game' && story[state.index].id === scene.id)
      gallery.show(scene.phone, assets, 0, true, scene.text.split('（')[0]);
  });
  return true;
}
function finishText() {
  writer.finish();
}
function typeText(text) {
  autoClock.clear();
  fullText = text;
  $('dialogue-text').classList.toggle('emotive-text', text.includes('¯᷄'));
  typing = true;
  writer.start(text, { speed: settings.speed, instant: settings.motion });
}

function showGame() {
  showScreen('game');
  render();
}
function renderPortrait(scene) {
  const who = scene.character || (scene.spoken && scene.who !== '我' ? scene.who : null);
  const visible = !!who && !['choice', 'live', 'end'].includes(scene.kind);
  document.body.classList.toggle('has-portrait', visible);
  if (!visible) {
    portraits.hide();
    return;
  }
  portraits.show(who, characters[who], assets);
}
function render() {
  cleanTimers();
  gallery.close();
  slideshowPlayedFor = null;
  const s = story[state.index];
  if (!s) return;
  if (s.kind === 'end') {
    showEnding();
    return;
  }
  for (const [cls, val] of [
    ['choice-scene', s.kind === 'choice'],
    ['live-scene', s.kind === 'live'],
    ['blackout', s.effect === 'blackout'],
    ['glitch', s.effect === 'glitch'],
    ['pixel', s.effect === 'pixel'],
    ['memory-scene', !!s.memory],
  ])
    document.body.classList.toggle(cls, val);
  $('memory-label').classList.toggle('hidden', !s.memory);
  background(s.bg);
  sound.play(s.music);
  const chapter = chapters[s.chapter];
  $('chapter-number').textContent = String(s.chapter + 1).padStart(2, '0');
  $('chapter-label').textContent = chapter.en;
  $('chapter-title').textContent = chapter.name + (replaying ? ' · 回看' : '');
  $('location').textContent = s.memory && s.who === '毛学长' ? '教学楼外 · 文管学馆' : s.bg;
  $('top-caption').textContent =
    (replaying ? '章节回看 · ' : state.name + '的大学生活 · ') + chapter.name;
  $('dialogue-context').textContent = s.memory ? '回忆 · 教学楼外' : chapter.note;
  $('speaker').textContent = s.who;
  $('speaker-note').textContent =
    s.who === '我'
      ? s.spoken
        ? '对话'
        : '内心独白'
      : characters[s.who]?.title || (s.who === 'NEU生活模拟器' ? '系统消息' : '');
  const chapterScenes = story.filter((v) => v.chapter === s.chapter);
  $('scene-count').textContent =
    String(chapterScenes.indexOf(s) + 1).padStart(2, '0') +
    ' / ' +
    String(chapterScenes.length).padStart(2, '0');
  $('chapter-progress').style.width = ((state.index + 1) / story.length) * 100 + '%';
  effects.set(s, state.name, settings.motion);
  $('simulator').classList.toggle('hidden', !s.sim || effects.cinematic);
  $('sim-text').textContent = (s.sim || '').replaceAll('{name}', state.name);
  renderPortrait(s);
  $('scene-decoration').className = 'scene-decoration ' + (s.decoration || s.effect || '');
  renderPhone(s.phone, s);
  $('choice-panel').classList.toggle('hidden', s.kind !== 'choice');
  if (s.kind === 'choice') {
    setAuto(false);
    $('choices').replaceChildren();
    s.choices.forEach((c, i) => {
      const b = el('button', 'choice-button');
      b.append(el('span', '', String(i + 1).padStart(2, '0')));
      const copy = el('div');
      copy.append(el('strong', '', c.text), el('small', '', c.detail));
      b.append(copy, el('i', '', '→'));
      b.onclick = () => {
        state.branch = c.target;
        advance(i);
      };
      $('choices').append(b);
    });
  }
  $('live-panel').classList.toggle('hidden', s.kind !== 'live');
  if (s.kind === 'live') {
    setAuto(false);
    $('live-badge').textContent =
      settings.mode === 'live' ? '现场模式 · 等待主持人继续' : '班会互动';
    $('live-title').textContent = s.live.title;
    $('live-prompt').textContent = s.live.prompt;
    $('live-response').textContent = s.live.response;
    $('live-response').classList.toggle('hidden', settings.mode === 'live');
    $('live-note').value = state.notes[s.id] || '';
    $('live-note').placeholder = s.notePlaceholder || '写点什么（可留空，只保存在本机）';
    $('live-hint').textContent =
      settings.mode === 'live' ? s.liveHint || '分享结束后，由主持人继续。' : '可留空，直接继续。';
    $('live-next').firstChild.textContent =
      (s.liveNext || (settings.mode === 'live' ? '现场分享结束' : '继续故事')) + ' ';
  }
  $('dialogue').classList.toggle(
    'hidden',
    ['choice', 'live'].includes(s.kind) || effects.cinematic,
  );
  syncPauses();
  sound.events.enter(s);
  if (effects.cinematic) {
    fullText = s.text.replaceAll('{name}', state.name);
    setDialogueText(fullText);
    typing = false;
    scheduleAuto();
  } else if (!['choice', 'live'].includes(s.kind))
    typeText(s.text.replaceAll('{name}', state.name));
  else {
    fullText = s.text;
    typing = false;
  }
  $('back').disabled = state.trail.length === 0;
  autoSave();
  preloadNextBackground();
  preloadNextPortrait();
  requestAnimationFrame(fitSceneLayout);
}
function advance(choice, fromLive = false) {
  if (screen !== 'game' || $('modal').open || gallery.open || pure) return;
  const s = story[state.index];
  if (s.kind === 'live' && !fromLive) return;
  if (s.kind === 'choice' && choice === undefined) return;
  if (typing) {
    finishText();
    return;
  }
  if (chat.busy) {
    chat.finish();
    return;
  }
  if (effects.finish()) {
    sound.events.stop();
    return;
  }
  const next = nextIndex(state.index, choice);
  if (next === null) return;
  state.trail.push(state.index);
  state.index = next;
  render();
  if (choice !== undefined) sound.cue('choice');
}
function back() {
  if (screen !== 'game' || !state.trail.length) return;
  setAuto(false);
  cleanTimers();
  state.index = state.trail.pop();
  if (story[state.index].kind === 'choice') state.branch = null;
  render();
}
function showEnding() {
  cleanTimers();
  setAuto(false);
  showScreen('ending');
  background('文管门口');
  sound.play('shouwei');
  sound.events.enter(story[state.index]);
  $('top-caption').textContent = '新生心理班会 · 结束';
  $('ending-memory').textContent =
    state.branch === 'cry'
      ? '后来某天夜里，我突然想起教官喊口令的声音。'
      : '后来某次离别，我发现自己还是会愣一下。';
  if (!replaying) storage.set('completed', true);
  renderEndingReflection();
  updateChapterAccess();
  autoSave();
}
function openModal(title, content, eyebrow = '') {
  $('modal-title').textContent = title;
  $('modal-eyebrow').textContent = eyebrow;
  $('modal-body').replaceChildren(content);
  $('modal').scrollTop = 0;
  if (!$('modal').open) $('modal').showModal();
  syncPauses();
}
function closeModal() {
  $('modal').close();
  syncPauses();
  resumePlayback();
}

function intro() {
  const wrap = el('div'),
    copy = el('div', 'modal-copy');
  copy.append(el('p', '', '你是班上的一名普通同学，刚来东北大学报到。'));
  wrap.append(copy);
  const label = el('label', 'form-label', '姓名或昵称（可不填）');
  label.htmlFor = 'player-name';
  const input = el('input', 'name-input');
  input.id = 'player-name';
  input.maxLength = 16;
  input.placeholder = '同学';
  const oldName = storage.get('playerName', '');
  input.value = typeof oldName === 'string' ? oldName : '';
  wrap.append(label, input, el('span', 'form-label', '选择游玩方式'));
  const modes = el('div', 'mode-options');
  for (const [value, title, desc] of [
    ['solo', '自己读完', '独自游玩，查看参考回应'],
    ['live', '班会现场', '主持人控制分享环节'],
  ]) {
    const l = el('label', 'mode-option'),
      radio = el('input');
    radio.type = 'radio';
    radio.name = 'mode';
    radio.value = value;
    radio.checked = settings.mode === value;
    l.append(radio, document.createTextNode(title), el('small', '', desc));
    modes.append(l);
  }
  wrap.append(modes);
  if (validSave(storage.get('auto')))
    wrap.append(el('p', 'storage-note', '开启后将更新自动存档。手动存档仍可读取。'));
  const start = el('button', 'primary-button modal-wide-button', '开始游戏');
  start.onclick = async () => {
    state = newGameState(input.value.trim().slice(0, 16) || '同学');
    replaying = false;
    settings.mode = wrap.querySelector('input[name="mode"]:checked').value;
    storage.set('playerName', state.name);
    persistSettings();
    closeModal();
    await sound.unlock();
    showGame();
    if (!storage.available) toast('浏览器限制了存储，本次仍可正常游玩。');
  };
  wrap.append(start);
  openModal('开始之前', wrap, '入学登记');
}
function settingsModal() {
  openModal(
    '设置',
    settingsPanel(settings, persistSettings, () => {
      if (screen === 'game' && story[state.index].kind === 'live') render();
    }),
    '游戏设置',
  );
}
function confirmAction(title, text, yesLabel, action) {
  const wrap = el('div'),
    p = el('p', 'modal-copy', text),
    actions = el('div', 'return-actions'),
    cancel = el('button', 'secondary-button', '再想想'),
    yes = el('button', 'primary-button', yesLabel);
  cancel.onclick = closeModal;
  yes.onclick = () => {
    closeModal();
    action();
  };
  actions.append(cancel, yes);
  wrap.append(p, actions);
  openModal(title, wrap);
}
function slotsModal(mode) {
  openModal(
    mode === 'save' ? '存档' : '读档',
    savePanel(mode, { storage, snapshot, restore, closeModal, toast, confirmAction }),
    '本机存档',
  );
}
function restore(data) {
  data = normalizeSave(data);
  if (!data) {
    toast('这份存档无法读取。');
    return;
  }
  state = structuredClone(data);
  replaying = false;
  setAuto(false);
  showGame();
}
function logModal() {
  const wrap = el('div');
  for (const index of [...state.trail, state.index]) {
    const s = story[index],
      row = el('div', 'log-item');
    row.append(
      el('small', '', chapters[s.chapter].name + ' · ' + s.who),
      el('p', '', s.text.replaceAll('{name}', state.name)),
    );
    if (s.kind === 'choice' && state.branch)
      row.append(
        el(
          'small',
          '',
          '我选择了：' + (s.choices.find((c) => c.target === state.branch)?.text || ''),
        ),
      );
    if (state.notes[s.id]) row.append(el('p', '', '我的想法：' + state.notes[s.id]));
    wrap.append(row);
  }
  for (const [id, note] of Object.entries(state.notes)) {
    if (note && !story.some((s) => s.id === id)) {
      const row = el('div', 'log-item');
      row.append(el('small', '', '此前的分享笔记'), el('p', '', note));
      wrap.append(row);
    }
  }
  openModal('对话记录', wrap, '回看');
  requestAnimationFrame(() => ($('modal').scrollTop = $('modal').scrollHeight));
}
function howTo() {
  const wrap = el('div', 'modal-copy');
  for (const text of [
    '你是普通同学“我”。点击画面或按空格 / 回车推进；文字还没出现完时，点击可立即显示。',
    '按 ← 返回上一句；按 A 切换自动播放；按 H 隐藏界面；Esc 关闭弹窗或退出隐藏界面。',
    '选择不会判分。军训后的两个选择会留下不同回忆，之后回到同一段大学生活。',
    '“自己读完”提供参考回应。“班会现场”会在主持人环节暂停，由主持人点击按钮进入下一环节。自动播放会停在选择、讨论和分享环节。',
    '每句剧情自动保存，也可使用三个手动存档。回看只展示你走过的故事。右上角音符可开关音乐与事件音效，设置中可分别调整音量。',
  ])
    wrap.append(el('p', '', text));
  openModal('操作说明', wrap, '操作说明');
}
function renderPhone(kind, scene = {}) {
  document.body.classList.toggle('has-phone', !!kind);
  $('phone').classList.toggle('hidden', !kind);
  const content = $('phone-content'),
    title = $('phone-title'),
    sameTodos = kind === 'todos' && phoneKind === 'todos',
    sameChat = chatKinds.has(kind) && phoneKind === kind && chat.active;
  phoneKind = kind || null;
  if (!sameTodos && !sameChat) {
    phoneTodos.clear();
    resolvedTodos.clear();
    chat.clear();
    content.replaceChildren();
  }
  if (!kind) return;
  if (chatKinds.has(kind)) {
    if (!sameChat) chat.set(kind, settings.motion);
    return;
  }
  const msg = (text, out = false) =>
    content.append(el('div', 'phone-bubble' + (out ? ' out' : ''), text));
  if (albums[kind]) {
    title.textContent = albums[kind].title;
    gallery.renderAlbum(kind, content, assets);
    if (kind === 'training') msg('腿已废。求雨。');
  } else if (kind === 'todos') {
    title.textContent = '待办事项 · ' + todos.length;
    phoneTodos.set(content, todos, scene.todoCount || todos.length, settings.motion);
  } else if (kind === 'resolved') {
    title.textContent = '待办事项';
    resolvedTodos.set(content, scene, settings.motion);
  } else if (kind === 'bind') {
    title.textContent = '手机';
    const panel = el('div', 'phone-pixel');
    panel.append(el('strong', '', 'NEU'), el('span', '', '生活模拟器'), el('p', '', '正在连接…'));
    content.append(panel);
  } else if (kind === 'courses') {
    title.textContent = '本学期课程';
    for (const text of ['高等数学 ∫', '线性代数 [ ]', '大学英语 Aa'])
      content.append(el('div', 'phone-courses', text));
  }
}
function fitSceneLayout() {
  const phone = $('phone'),
    dialogue = $('dialogue'),
    game = $('game');
  if (screen !== 'game' || phone.classList.contains('hidden') || !dialogue.offsetHeight) return;
  const landscape = matchMedia('(orientation:landscape) and (max-height:600px)').matches;
  const mobile = innerWidth <= 760;
  const ratio = 19.5 / 9;
  const topLimit =
    document.querySelector('.topbar').getBoundingClientRect().bottom + (landscape ? 12 : 20);
  const toolbarTop = document.querySelector('.game-toolbar').getBoundingClientRect().top;
  const dialogueTop = dialogue.getBoundingClientRect().top;
  let height, top;
  if (landscape) {
    height = Math.min(180 * ratio, innerHeight - topLimit - 16);
    top = topLimit;
  } else if (mobile) {
    const bottom = Math.min(dialogueTop + 30, toolbarTop - 16);
    height = Math.min(Math.min(224, innerWidth * 0.56) * ratio, bottom - topLimit);
    top = bottom - height;
  } else {
    height = Math.min(310 * ratio, toolbarTop - topLimit - 20);
    top = Math.max(topLimit, dialogueTop + 100 - height);
  }
  height = Math.max(100, height);
  phone.classList.toggle('phone-compact', height / ratio < 160);
  // Geometry belongs to the game layer so the dialogue can reserve the same handset width.
  game.style.setProperty('--phone-width', (height / ratio).toFixed(2) + 'px');
  game.style.setProperty('--phone-top', (top - game.getBoundingClientRect().top).toFixed(2) + 'px');
}
new ResizeObserver(fitSceneLayout).observe($('dialogue'));
window.addEventListener('resize', fitSceneLayout);
document.querySelectorAll('[data-chapters]').forEach((button) => (button.onclick = chaptersModal));
$('start').onclick = intro;
$('replay').onclick = intro;
$('ending-home').onclick = showHome;
$('how-to').onclick = howTo;
$('settings').onclick = settingsModal;
$('continue').onclick = async () => {
  await sound.unlock();
  restore(storage.get('auto'));
};
$('dialogue').onclick = () => advance();
$('cinematic').onclick = () => advance();
$('cinematic').onkeydown = (e) => {
  if ([' ', 'Enter'].includes(e.key)) {
    e.preventDefault();
    e.stopPropagation();
    advance();
  }
};
$('dialogue').onkeydown = (e) => {
  if ([' ', 'Enter'].includes(e.key)) {
    e.preventDefault();
    e.stopPropagation();
    advance();
  }
};
$('back').onclick = back;
$('auto').onclick = () => setAuto(!auto);
$('log').onclick = logModal;
$('save').onclick = () => slotsModal('save');
$('load').onclick = () => slotsModal('load');
$('live-next').onclick = () => advance(undefined, true);
$('live-note').oninput = () => {
  state.notes[story[state.index].id] = $('live-note').value;
  autoSave();
};
$('hide-ui').onclick = () => {
  if (['choice', 'live'].includes(story[state.index].kind)) return;
  pure = !pure;
  document.body.classList.toggle('pure', pure);
  syncPauses();
  if (!pure) resumePlayback();
};
function homeAction() {
  if (screen === 'game') autoSave();
  showHome();
}
$('home-button').onclick = homeAction;
$('brand').onclick = (e) => {
  e.preventDefault();
  homeAction();
};
$('sound').onclick = async () => {
  await sound.unlock();
  settings.sound = !settings.sound;
  persistSettings();
  if (settings.sound) toast('声音已开启 · 音乐与事件音效');
};
$('fullscreen').onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen)
      await document.documentElement.requestFullscreen();
    else toast('当前浏览器不支持全屏。');
  } catch {
    toast('当前浏览器未允许全屏。');
  }
};
$('modal-close').onclick = closeModal;
$('modal').addEventListener('click', (e) => {
  if (e.target === $('modal')) {
    const r = $('modal').getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
      closeModal();
  }
});
$('modal').addEventListener('close', () => {
  syncPauses();
  resumePlayback();
});
window.addEventListener('keydown', (e) => {
  if (gallery.open) return;
  if ($('modal').open || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
  if (screen !== 'game') return;
  if (e.target.tagName === 'BUTTON' && [' ', 'Enter'].includes(e.key)) return;
  if (e.key === 'Escape') {
    if (pure) {
      pure = false;
      document.body.classList.remove('pure');
      syncPauses();
      resumePlayback();
    }
    return;
  }
  if ([' ', 'Enter', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
    if (story[state.index].kind !== 'live') advance();
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    back();
  } else if (e.key.toLowerCase() === 'a') setAuto(!auto);
  else if (e.key.toLowerCase() === 'h') $('hide-ui').click();
});
document.addEventListener('visibilitychange', () => {
  syncPauses();
  if (document.hidden) {
    if (screen === 'game') autoSave();
  } else resumePlayback();
});
window.addEventListener('pagehide', () => {
  if (screen === 'game') autoSave();
});
sound.assetMap = assets;
applySettings();
showHome();
$('asset-retry').onclick = () => {
  if (assetIssues.has('manifest')) refreshAssets();
  if (assetIssues.has('background')) background(null, true);
};
window.addEventListener('online', () => {
  if (assetIssues.has('manifest')) refreshAssets();
  if (assetIssues.has('background')) background(null, true);
});
window.addEventListener('resize', () => {
  background(null);
  if (screen === 'game') {
    renderPortrait(story[state.index]);
    preloadNextPortrait();
  }
});
refreshAssets();
