import test from 'node:test';
import assert from 'node:assert/strict';
import { PausableTimer, Typewriter } from '../playback.js';
function clock() {
  let time = 0,
    id = 0;
  const tasks = new Map();
  return {
    now: () => time,
    set: (fn, delay) => {
      tasks.set(++id, { at: time + delay, fn });
      return id;
    },
    clear: (id) => tasks.delete(id),
    tick(ms) {
      const end = time + ms;
      while (true) {
        const next = [...tasks.entries()]
          .filter(([, t]) => t.at <= end)
          .sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        time = next[1].at;
        tasks.delete(next[0]);
        next[1].fn();
      }
      time = end;
    },
  };
}
test('Pausing preserves the remaining delay rather than restarting or firing in the background', () => {
  const c = clock(),
    timer = new PausableTimer(c);
  let fired = 0;
  timer.set(100, () => fired++);
  c.tick(40);
  timer.pause(true);
  c.tick(1000);
  assert.equal(fired, 0);
  timer.pause(false);
  c.tick(59);
  assert.equal(fired, 0);
  c.tick(1);
  assert.equal(fired, 1);
  assert(!timer.active);
});
test('Typing pauses exactly at its current character, resumes, and completes only once', () => {
  const c = clock();
  let text = '',
    finished = 0;
  const writer = new Typewriter(
    (value) => (text = value),
    () => finished++,
    c,
  );
  writer.start('你好😀', { speed: 100 });
  c.tick(150);
  assert.equal(text, '你');
  writer.pause(true);
  c.tick(1000);
  assert.equal(text, '你');
  writer.pause(false);
  c.tick(49);
  assert.equal(text, '你');
  c.tick(51);
  assert.equal(text, '你好');
  writer.finish();
  writer.finish();
  assert.equal(text, '你好😀');
  assert.equal(finished, 1);
  c.tick(1000);
  assert.equal(finished, 1);
});
test('Changing scenes cancels an old paused typing job', () => {
  const c = clock();
  let text = '',
    finished = 0;
  const writer = new Typewriter(
    (value) => (text = value),
    () => finished++,
    c,
  );
  writer.start('旧台词', { speed: 50 });
  c.tick(50);
  writer.pause(true);
  writer.start('新台词', { speed: 50 });
  c.tick(1000);
  assert.equal(text, '');
  writer.pause(false);
  c.tick(150);
  assert.equal(text, '新台词');
  assert.equal(finished, 1);
});
