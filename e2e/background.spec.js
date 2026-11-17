import { test, expect } from '@playwright/test';
import { boot, current, next } from './helpers.js';

test('background crossfade preserves decoded scenery through rapid rewind', async ({
  page,
}, testInfo) => {
  await boot(page, 's54', { settings: { motion: false } });
  const base = page.locator('#background');
  const frames = page.locator('.background-frame');
  await expect(base).toHaveAttribute('src', /xiaonanhu\./);
  await expect(frames).toHaveCount(0);
  const original = await base.getAttribute('src');
  await next(page, 's55');
  await expect(frames).toHaveCount(1);
  const blend = await frames.evaluate((frame) => {
    const animation = frame.getAnimations()[0];
    animation.pause();
    animation.currentTime = 425;
    return {
      opacity: Number(getComputedStyle(frame).opacity),
      width: frame.naturalWidth,
      underTint: !!frame.nextElementSibling?.matches('.scene-tint'),
      layerFilter: getComputedStyle(frame.parentElement).filter,
    };
  });
  expect(blend.opacity).toBeGreaterThan(0);
  expect(blend.opacity).toBeLessThan(1);
  expect(blend.width).toBeGreaterThan(0);
  expect(blend.underTint).toBe(true);
  expect(blend.layerFilter).toBe('none');
  await expect(base).toHaveAttribute('src', original);
  await page.screenshot({ path: `artifacts/background-blend-${testInfo.project.name}.png` });

  await page.locator('#back').click();
  await current(page, 's54');
  await expect(frames).toHaveCount(2);
  expect(
    Number(await frames.first().evaluate((frame) => getComputedStyle(frame).opacity)),
  ).toBeCloseTo(blend.opacity, 3);
  await next(page, 's55');
  await expect(base).toHaveAttribute('src', /sunset\./);
  await expect(frames).toHaveCount(0);
  expect(await base.evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);
});

test('background crossfade pauses behind settings and resumes cleanly', async ({ page }) => {
  await boot(page, 's54', { settings: { motion: false } });
  await expect(page.locator('#background')).toHaveAttribute('src', /xiaonanhu\./);
  await expect(page.locator('.background-frame')).toHaveCount(0);
  await next(page, 's55');
  const frame = page.locator('.background-frame');
  await expect(frame).toHaveCount(1);
  // Slow only this animation so the test can open the settings on every viewport.
  await frame.evaluate((image) => image.getAnimations()[0].updatePlaybackRate(0.1));
  await page.locator('#settings').click();
  const paused = await frame.evaluate(async (image) => {
    const animation = image.getAnimations()[0];
    await animation.ready;
    return { state: animation.playState, time: animation.currentTime };
  });
  expect(paused.state).toBe('paused');
  await page.waitForTimeout(150);
  expect(await frame.evaluate((image) => image.getAnimations()[0].currentTime)).toBe(paused.time);
  await page.locator('#modal-close').click();
  await frame.evaluate((image) => image.getAnimations()[0].updatePlaybackRate(1));
  await expect(page.locator('#background')).toHaveAttribute('src', /sunset\./);
  await expect(frame).toHaveCount(0);
});

test('reduced motion switches backgrounds without a fade layer', async ({ page }) => {
  await boot(page, 's54');
  await expect(page.locator('#background')).toHaveAttribute('src', /xiaonanhu\./);
  await next(page, 's55');
  await expect(page.locator('#background')).toHaveAttribute('src', /sunset\./);
  await expect(page.locator('.background-frame')).toHaveCount(0);
});
