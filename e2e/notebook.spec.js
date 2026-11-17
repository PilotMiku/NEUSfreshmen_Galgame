import { test, expect } from '@playwright/test';
import { boot, save } from './helpers.js';

test('notebook cover keeps the title and both actions clear on every screen', async ({
  page,
}, testInfo) => {
  await page.goto('./');
  await expect(page.locator('#start')).toBeVisible();
  await expect(page.locator('#start .ui-icon')).toHaveCount(2);
  const layout = await page.evaluate(() => {
    const card = document.querySelector('.home-copy').getBoundingClientRect(),
      buttons = ['start', 'continue'].map((id) => {
        const node = document.getElementById(id),
          r = node.getBoundingClientRect(),
          hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return { id, rect: r.toJSON(), hit: hit?.closest('button')?.id };
      });
    return {
      card: card.toJSON(),
      buttons,
      width: innerWidth,
      height: innerHeight,
      overflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
  expect(layout.overflow).toBe(false);
  for (const button of layout.buttons) {
    expect(button.rect.left).toBeGreaterThanOrEqual(layout.card.left);
    expect(button.rect.right).toBeLessThanOrEqual(layout.card.right);
    expect(button.rect.bottom).toBeLessThanOrEqual(layout.height);
    expect(button.hit).toBe(button.id);
  }
  await page.screenshot({ path: `artifacts/notebook-home-${testInfo.project.name}.png` });
});

test('paper nameplates, notebook discussion, album and keepsake share the new style', async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const id of ['s40', 's44', 's48', 's50']) {
    await boot(page, id);
    await expect(page.locator('#speaker-icon .ui-icon')).toHaveCount(1);
    await expect(page.locator('.speaker-label')).toBeVisible();
    expect(await page.locator('#speaker').textContent()).not.toBe('');
    if (id === 's40')
      await page.screenshot({ path: `artifacts/notebook-dialogue-${testInfo.project.name}.png` });
  }
  await page.locator('#settings').click();
  await expect(page.locator('#modal-close .ui-icon')).toHaveCount(1);
  await page.screenshot({ path: `artifacts/notebook-settings-${testInfo.project.name}.png` });
  await page.locator('#modal-close').click();
  await boot(page, 'next-step');
  await page.locator('#live-note').fill('今天先和同学一起看两道题。');
  await page.screenshot({ path: `artifacts/notebook-discussion-${testInfo.project.name}.png` });
  await boot(page, 's0');
  await page.locator('.album-photo').first().click();
  await expect(page.locator('#photo-viewer img')).toBeVisible();
  await page.screenshot({ path: `artifacts/notebook-album-${testInfo.project.name}.png` });
  await page.locator('[data-photo-close]').click();
  await boot(page, 's85', {
    data: save('s85', { notes: { 'next-step': '今天先和同学一起看两道题。' } }),
  });
  await page.locator('#dialogue').click();
  await expect(page.locator('#ending-signature')).toHaveText('同学的校园手账');
  await expect(page.locator('#ending-date')).not.toBeEmpty();
  await page.screenshot({ path: `artifacts/notebook-ending-${testInfo.project.name}.png` });
  expect(errors).toEqual([]);
});
