import { test, expect } from '@playwright/test';
import { boot } from './helpers.js';

async function verifyPhone(page) {
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  const geometry = await page.evaluate(() => {
    const phone = document.querySelector('#phone'),
      dialogue = document.querySelector('#dialogue'),
      p = phone.getBoundingClientRect(),
      d = dialogue.getBoundingClientRect(),
      text = document.querySelector('#dialogue-text').getBoundingClientRect();
    const left = Math.max(p.left, d.left),
      right = Math.min(p.right, d.right),
      top = Math.max(p.top, d.top),
      bottom = Math.min(p.bottom, d.bottom);
    let phoneInFront = false;
    for (let x = left + 3; x < right; x += 5)
      for (let y = top + 3; y < bottom; y += 5)
        if (document.elementFromPoint(x, y)?.closest('#phone')) phoneInFront = true;
    return {
      ratio: phone.offsetHeight / phone.offsetWidth,
      p: p.toJSON(),
      d: d.toJSON(),
      text: text.toJSON(),
      phoneInFront,
      width: innerWidth,
      height: innerHeight,
      overflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
  expect(geometry.ratio).toBeGreaterThan(1.75);
  expect(geometry.ratio).toBeLessThan(1.95);
  expect(geometry.p.top).toBeGreaterThanOrEqual(0);
  expect(geometry.p.left).toBeGreaterThanOrEqual(0);
  expect(geometry.p.right).toBeLessThanOrEqual(geometry.width);
  expect(geometry.p.bottom).toBeLessThanOrEqual(geometry.height);
  expect(geometry.phoneInFront).toBe(true);
  expect(geometry.overflow).toBe(false);
  const p = geometry.p,
    t = geometry.text;
  expect(p.left < t.right && p.right > t.left && p.top < t.bottom && p.bottom > t.top).toBe(false);
  return geometry;
}

test('albums, chat and todos share a tall proportional phone layered over the dialogue edge', async ({
  page,
}, testInfo) => {
  page.on('pageerror', (error) => {
    throw error;
  });
  for (const id of ['s0', 's5', 's33', 's81']) {
    await boot(page, id);
    await verifyPhone(page);
    await page.screenshot({ path: `artifacts/phone-ratio-${id}-${testInfo.project.name}.png` });
  }
});

test('the phone keeps its shape with larger text and smaller or taller viewports', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  for (const viewport of [
    { width: 360, height: 640 },
    { width: 430, height: 932 },
    { width: 1366, height: 768 },
    { width: 1920, height: 1080 },
    { width: 568, height: 320 },
  ]) {
    await page.setViewportSize(viewport);
    await boot(page, 's5');
    await page.locator('#settings').click();
    await page.locator('#setting-font').fill('27');
    await page.locator('#modal-close').click();
    await verifyPhone(page);
    await page.screenshot({ path: `artifacts/phone-ratio-large-text-${viewport.width}.png` });
  }
});
