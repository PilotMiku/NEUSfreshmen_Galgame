import test from 'node:test';
import assert from 'node:assert/strict';
import { newGameState, sessionSnapshot, chapterReplayState, endingReflection } from '../session.js';
import { validSave, chapters, story, normalizeSave } from '../story.js';
import { createStorage } from '../storage.js';
import { loadSettings } from '../settings.js';
test('Chapter replay starts at a valid scene and copies personal notes without mutating a save', () => {
  const saved = sessionSnapshot({
    ...newGameState('小明'),
    notes: { 'next-step': '先请同学帮忙' },
    branch: 'cry',
  });
  for (let index = 0; index < chapters.length; index++) {
    const replay = chapterReplayState(index, saved);
    assert.equal(story[replay.index].chapter, index);
    assert(validSave(sessionSnapshot(replay)));
    replay.notes['next-step'] = '回看时的笔记';
    assert.equal(saved.notes['next-step'], '先请同学帮忙');
  }
  assert.equal(chapterReplayState(-1, saved), null);
});
test('The ending uses the personal first step, with a sharing note fallback and no invented answer', () => {
  assert.deepEqual(
    endingReflection({ 'next-step': '  今天问问学委  ', 'group-sharing': '另一个办法' }),
    { label: '我准备尝试的一步', text: '今天问问学委' },
  );
  assert.equal(endingReflection({}), null);
  assert.equal(endingReflection({ 'group-sharing': '同学给的办法' }).label, '我想记住的办法');
});
test('The extracted storage keeps existing keys and validates saved progress', () => {
  const data = new Map(),
    storage = createStorage(() => ({
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
    }));
  const saved = sessionSnapshot(newGameState());
  storage.set('auto', saved);
  assert(data.has('xinsheng.v1.auto'));
  assert.deepEqual(storage.get('auto'), normalizeSave(saved));
  data.set('xinsheng.v1.auto', '{"bad":1}');
  assert.equal(storage.get('auto'), null);
  assert.deepEqual(loadSettings(storage, true), {
    speed: 32,
    volume: 0.35,
    effectsVolume: 0.9,
    ambienceVolume: 0.35,
    font: 21,
    mode: 'solo',
    sound: true,
    motion: true,
  });
});
