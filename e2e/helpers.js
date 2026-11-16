import { expect } from '@playwright/test';
import { story, sceneIndex } from '../story.js';
export const save = (id, extra = {}) => ({
  version: 2,
  sceneId: id,
  index: sceneIndex[id],
  name: '同学',
  trail: [],
  trailIds: [],
  branch: null,
  notes: {},
  date: new Date().toISOString(),
  ...extra,
});
export async function boot(page, id, { settings = {}, data = save(id), completed = false } = {}) {
  await page.goto('./');
  await page.evaluate(
    ({ settings, data, completed }) => {
      localStorage.setItem('xinsheng.v1.auto', JSON.stringify(data));
      localStorage.setItem(
        'xinsheng.v1.settings',
        JSON.stringify({ speed: 0, motion: true, sound: false, ...settings }),
      );
      if (completed) localStorage.setItem('xinsheng.v1.completed', 'true');
    },
    { settings, data, completed },
  );
  await page.reload();
  await page.locator('#continue').click();
  await current(page, id);
}
export async function current(page, id) {
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('xinsheng.v1.auto')).sceneId))
    .toBe(id);
}
export async function next(page, id) {
  await page.locator('#dialogue').click();
  await current(page, id);
}
export async function runtimeModule(page, file) {
  return page.evaluate(
    (file) => new URL(file, document.querySelector('script[type="module"]').src).href,
    file,
  );
}
export async function visibleWords(page) {
  await expect(page.locator('.course-word:visible')).toHaveCount(28);
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  const result = await page.evaluate(() => {
    const dialogue = document.querySelector('#dialogue').getBoundingClientRect(),
      words = Array.from(document.querySelectorAll('.course-word-copy')).map((n) =>
        n.getBoundingClientRect().toJSON(),
      );
    return { dialogue: dialogue.toJSON(), words, width: innerWidth, height: innerHeight };
  });
  for (const word of result.words) {
    expect(word.x).toBeGreaterThanOrEqual(-1);
    expect(word.y).toBeGreaterThanOrEqual(-1);
    expect(word.right).toBeLessThanOrEqual(result.width + 1);
    expect(word.bottom).toBeLessThanOrEqual(result.height + 1);
    expect(
      word.left < result.dialogue.right &&
        word.right > result.dialogue.left &&
        word.top < result.dialogue.bottom &&
        word.bottom > result.dialogue.top,
    ).toBe(false);
  }
  expect(
    Math.max(...result.words.map((w) => w.y)) - Math.min(...result.words.map((w) => w.y)),
  ).toBeGreaterThan(result.height * 0.25);
}
