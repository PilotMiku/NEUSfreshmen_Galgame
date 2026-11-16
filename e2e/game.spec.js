import { test, expect } from '@playwright/test';
import { boot, current, next, save, runtimeModule, visibleWords } from './helpers.js';
import { story, sceneIndex } from '../story.js';
const failedResponses = new WeakMap();
test.beforeEach(async ({ page }) => {
  const failures = [];
  failedResponses.set(page, failures);
  page.on('response', (response) => {
    if (response.status() >= 400) failures.push(response.status() + ' ' + response.url());
  });
  page.on('pageerror', (error) => {
    throw error;
  });
});

test('published module graph, stylesheet and responsive transparent portraits use fingerprints', async ({
  page,
}, testInfo) => {
  await boot(page, 's40');
  const source = await page.locator('script[type="module"]').getAttribute('src');
  expect(source).toMatch(/^static\/[a-f0-9]{12}\/app\.js$/);
  expect(await page.locator('link[rel="stylesheet"]').count()).toBe(1);
  await expect(page.locator('#character')).toHaveClass(/is-visible/);
  await expect(page.locator('.portrait-echo')).toHaveClass(/is-visible/);
  const small = testInfo.project.name === 'phone';
  await expect(page.locator('#character-image')).toHaveAttribute(
    'src',
    new RegExp(`banzhang\\.${small ? 'mobile' : 'desktop'}\\.[a-f0-9]{12}\\.webp`),
  );
  expect(await page.locator('#character-image').evaluate((n) => n.naturalWidth)).toBeGreaterThan(0);
  const alpha = await page.locator('#character-image').evaluate((img) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, 1, 1).data[3];
  });
  expect(alpha).toBe(0);
  await page.screenshot({ path: `artifacts/optimized-portrait-${testInfo.project.name}.png` });
});

test('cinematic transition distributes all three subjects around the dialogue', async ({
  page,
}) => {
  await boot(page, 'courses', { settings: { motion: false } });
  await page.locator('#cinematic').click();
  await page.locator('#cinematic').click();
  await current(page, 's25');
  for (const id of ['s25', 's26', 's27']) {
    await visibleWords(page);
    if (id !== 's27') await next(page, id === 's25' ? 's26' : 's27');
  }
  await page.locator('#back').click();
  await current(page, 's26');
  await visibleWords(page);
});

test('companion retains a valid image throughout exit fade', async ({ page }) => {
  await boot(page, 's40', { settings: { motion: false } });
  await expect(page.locator('.portrait-echo')).toHaveClass(/is-visible/);
  await page.waitForTimeout(500);
  const src = await page.locator('.portrait-echo img').getAttribute('src');
  await next(page, 's41');
  for (let i = 0; i < 6; i++) {
    const value = await page
      .locator('.portrait-echo img')
      .evaluate((n) => ({ src: n.getAttribute('src'), width: n.naturalWidth }));
    expect(value.src).toBe(src);
    expect(value.width).toBeGreaterThan(0);
    await page.waitForTimeout(90);
  }
  await expect(page.locator('.portrait-echo')).toHaveCSS('opacity', '0');
});

test('text pauses and resumes behind settings, hidden UI and a background tab', async ({
  page,
}) => {
  await boot(page, 'mao-encouragement', { settings: { motion: false, speed: 65 } });
  await expect.poll(() => page.locator('#dialogue-text').textContent()).not.toBe('');
  for (const kind of ['settings', 'pure', 'hidden']) {
    if (kind === 'settings') await page.locator('#settings').click();
    if (kind === 'pure') await page.locator('#hide-ui').click();
    if (kind === 'hidden')
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, value: true });
        document.dispatchEvent(new Event('visibilitychange'));
      });
    const text = await page.locator('#dialogue-text').textContent();
    expect(text.length).toBeLessThan(story[sceneIndex['mao-encouragement']].text.length);
    await page.waitForTimeout(250);
    expect(await page.locator('#dialogue-text').textContent()).toBe(text);
    if (kind === 'settings') await page.locator('#modal-close').click();
    if (kind === 'pure') await page.keyboard.press('Escape');
    if (kind === 'hidden')
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, value: false });
        document.dispatchEvent(new Event('visibilitychange'));
      });
    await expect
      .poll(async () => (await page.locator('#dialogue-text').textContent()).length)
      .toBeGreaterThan(text.length);
  }
});

test('family keyboard and message queue pause together', async ({ page }) => {
  await boot(page, 's5', { settings: { motion: false, speed: 65 } });
  await expect.poll(() => page.locator('.chat-draft').textContent()).not.toBe('');
  await page.locator('#settings').click();
  const draft = await page.locator('.chat-draft').textContent(),
    dialogue = await page.locator('#dialogue-text').textContent();
  await page.waitForTimeout(300);
  expect(await page.locator('.chat-draft').textContent()).toBe(draft);
  expect(await page.locator('#dialogue-text').textContent()).toBe(dialogue);
  await page.locator('#modal-close').click();
  await expect(page.locator('.chat-thread')).toContainText('到了就好，记得吃饭。');
});

test('each ending task waits for its narration, including after rewind and old save load', async ({
  page,
}) => {
  await boot(page, 's77', { settings: { motion: false, speed: 65 } });
  expect(await page.locator('.resolved-todo.checked').count()).toBe(0);
  await page.locator('#dialogue').click();
  for (let i = 1; i <= 4; i++) {
    await next(page, 's' + (77 + i));
    expect(await page.locator('.resolved-todo.checked').count()).toBe(i - 1);
    await page.locator('#dialogue').click();
    expect(await page.locator('.resolved-todo.checked').count()).toBe(i);
  }
  await page.locator('#back').click();
  await current(page, 's80');
  expect(await page.locator('.resolved-todo.checked').count()).toBe(2);
  await page.locator('#home-button').click();
  await page.reload();
  await page.locator('#continue').click();
  await current(page, 's80');
  expect(await page.locator('.resolved-todo.checked').count()).toBe(2);
});

test('ending reflects the player note and unlocks replay without overwriting progress', async ({
  page,
}) => {
  const note = '今天先和学委一起看两道题。<script>不执行</script>';
  await boot(page, 's85', { data: save('s85', { notes: { 'next-step': note } }) });
  await next(page, 's86');
  await expect(page.locator('#ending-reflection-text')).toHaveText(note);
  await expect(page.locator('#ending [data-chapters]')).toBeVisible();
  await page.screenshot({ path: `artifacts/optimized-ending-${test.info().project.name}.png` });
  const saved = await page.evaluate(() => localStorage.getItem('xinsheng.v1.auto'));
  await page.locator('#ending [data-chapters]').click();
  await expect(page.locator('.chapter-option')).toHaveCount(6);
  await page.locator('.chapter-option').nth(2).click();
  await expect(page.locator('#chapter-title')).toContainText('回看');
  expect(await page.evaluate(() => localStorage.getItem('xinsheng.v1.auto'))).toBe(saved);
  await page.locator('#home-button').click();
  await page.locator('#continue').click();
  await expect(page.locator('#ending')).toBeVisible();
  expect(await page.locator('#ending-reflection-text').textContent()).toBe(note);
});

test('uncompleted games keep chapters locked and explicit live gates stay paused', async ({
  page,
}) => {
  await boot(page, 'next-step', { settings: { mode: 'live' } });
  await page.locator('#live-note').fill('先向同学求助');
  await page.locator('#live-note').blur();
  await page.keyboard.press('Space');
  await current(page, 'next-step');
  await page.locator('#live-next').click();
  await current(page, 'group-sharing');
  await page.locator('#back').click();
  await current(page, 'next-step');
  await expect(page.locator('#live-note')).toHaveValue('先向同学求助');
  await page.locator('#home-button').click();
  await expect(page.locator('#home [data-chapters]')).toBeHidden();
});

test('music crossfades across tracks and cleans up when muted', async ({ page }) => {
  await page.goto('./');
  const url = await runtimeModule(page, 'audio.js');
  await page.evaluate(async (url) => {
    const { Soundtrack } = await import(url);
    const sound = new Soundtrack();
    window.reviewSound = sound;
    sound.setEnabled(true);
    await sound.unlock();
    sound.play('open');
  }, url);
  await page.waitForTimeout(650);
  await page.evaluate(() => window.reviewSound.play('banwei'));
  expect(await page.evaluate(() => window.reviewSound.sessions.size)).toBe(2);
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => window.reviewSound.sessions.size)).toBe(1);
  await page.evaluate(() => window.reviewSound.pause(true));
  expect(await page.evaluate(() => window.reviewSound.sessions.size)).toBe(0);
  await page.evaluate(() => window.reviewSound.pause(false));
  expect(await page.evaluate(() => window.reviewSound.sessions.size)).toBe(1);
  await page.evaluate(() => window.reviewSound.setEnabled(false));
  expect(await page.evaluate(() => window.reviewSound.voices.size)).toBe(0);
  expect(await page.evaluate(() => window.reviewSound.sessions.size)).toBe(0);
});

test.afterEach(async ({ page }) => {
  expect(failedResponses.get(page)).toEqual([]);
});

test('auto advance retains its remaining reading time across a settings pause', async ({
  page,
}) => {
  await boot(page, 's39');
  await page.locator('#auto').click();
  await page.waitForTimeout(800);
  await page.locator('#settings').click();
  await page.waitForTimeout(1100);
  await current(page, 's39');
  await page.locator('#modal-close').click();
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('xinsheng.v1.auto')).sceneId), {
      timeout: 1500,
      intervals: [50],
    })
    .toBe('s40');
});

test('long personal reflections remain readable and ending controls are reachable', async ({
  page,
}) => {
  const note = '今天先向身边的人求助，也给自己留一点时间。\n'.repeat(18).slice(0, 490);
  await boot(page, 's85', { data: save('s85', { notes: { 'next-step': note } }) });
  await next(page, 's86');
  await expect(page.locator('#ending-reflection-text')).toHaveText(note.trim());
  await page.locator('#ending-home').scrollIntoViewIfNeeded();
  const box = await page.locator('#ending-home').boundingBox(),
    viewport = page.viewportSize();
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('louder contextual effects render finite waveforms with headroom', async ({ page }) => {
  await page.goto('./');
  const url = await runtimeModule(page, 'event-sounds.js');
  const metrics = await page.evaluate(async (url) => {
    const { EventSounds, renderCue, cueNames, cueMix } = await import(url);
    const results = {};
    for (const name of cueNames) {
      const ctx = new OfflineAudioContext(1, 22050 * 5, 22050),
        effects = new EventSounds();
      effects.attach(ctx);
      renderCue(ctx, effects.master, name, { strength: cueMix[name] ?? 1 });
      const samples = (await ctx.startRendering()).getChannelData(0);
      let peak = 0,
        energy = 0;
      for (const value of samples) {
        peak = Math.max(peak, Math.abs(value));
        energy += value * value;
      }
      results[name] = { peak, energy };
    }
    return results;
  }, url);
  for (const [name, result] of Object.entries(metrics)) {
    expect(result.peak, name + ' audible').toBeGreaterThan(0.015);
    expect(result.peak, name + ' headroom').toBeLessThan(0.95);
    expect(Number.isFinite(result.energy), name + ' finite').toBe(true);
  }
});

test('an original version 1 save still restores the same committee scene', async ({ page }) => {
  const { legacySceneIds } = await import('../legacy-scenes.js');
  const old = {
    version: 1,
    index: legacySceneIds.indexOf('s40'),
    name: '以前的同学',
    trail: [0, 1, 2],
    branch: 'cry',
    notes: { 'help-feeling': '以前保存的笔记' },
    date: '2026-11-01T00:00:00Z',
  };
  await boot(page, 's40', { data: old });
  await expect(page.locator('#speaker')).toHaveText('班长');
  await page.locator('#log').click();
  await expect(page.locator('#modal-body')).toContainText('以前保存的笔记');
});

test('a new game completes the full route with reflection, choice and live interactions intact', async ({
  page,
}) => {
  await page.goto('./');
  await page.evaluate(() =>
    localStorage.setItem(
      'xinsheng.v1.settings',
      JSON.stringify({ speed: 0, motion: true, sound: false }),
    ),
  );
  await page.reload();
  await page.locator('#start').click();
  await page.locator('#player-name').fill('新同学');
  await page.locator('#modal-body .primary-button').click();
  for (let step = 0; step < 110; step++) {
    const id = await page.evaluate(
      () => JSON.parse(localStorage.getItem('xinsheng.v1.auto')).sceneId,
    );
    if (id === 's86') break;
    const scene = story[sceneIndex[id]];
    if (scene.kind === 'choice') await page.locator('.choice-button').first().click();
    else if (scene.kind === 'live') {
      if (id === 'next-step') await page.locator('#live-note').fill('今天先找同学聊聊。');
      await page.locator('#live-next').click();
    } else if (await page.locator('#cinematic').isVisible())
      await page.locator('#cinematic').click();
    else await page.locator('#dialogue').click();
  }
  await current(page, 's86');
  await expect(page.locator('#ending-reflection-text')).toHaveText('今天先找同学聊聊。');
  await expect(page.locator('#ending [data-chapters]')).toBeVisible();
});
