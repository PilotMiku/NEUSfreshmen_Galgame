import { test, expect } from '@playwright/test';
import { current, next, runtimeModule, save } from './helpers.js';

async function bootAudio(page, id, settings = {}) {
  await page.goto('./');
  await page.evaluate(
    ({ data, settings }) => {
      localStorage.setItem('xinsheng.v1.auto', JSON.stringify(data));
      localStorage.setItem(
        'xinsheng.v1.settings',
        JSON.stringify({
          speed: 0,
          motion: true,
          sound: true,
          ...settings,
        }),
      );
    },
    { data: save(id), settings },
  );
  await page.reload();
  const url = await runtimeModule(page, 'audio.js');
  await page.evaluate(async (url) => {
    const { Soundtrack } = await import(url);
    const unlock = Soundtrack.prototype.unlock;
    Soundtrack.prototype.unlock = function (...args) {
      window.audioUnderTest = this;
      return unlock.apply(this, args);
    };
  }, url);
  await page.locator('#continue').click();
  await current(page, id);
}

test('all host-led sharing is quiet and returning to the story restores music and ambience', async ({
  page,
}) => {
  await bootAudio(page, 'pause', { mode: 'live' });
  const quiet = async () => {
    await expect
      .poll(() =>
        page.evaluate(() => ({
          music: window.audioUnderTest.current,
          musicSessions: window.audioUnderTest.sessions.size,
          ambience: window.audioUnderTest.ambience.current,
          ambientSessions: window.audioUnderTest.ambience.sessions.size,
        })),
      )
      .toEqual({ music: 'off', musicSessions: 0, ambience: 'off', ambientSessions: 0 });
  };
  await quiet();
  await page.locator('#live-next').click();
  await current(page, 'new-difficulties');
  expect(await page.evaluate(() => window.audioUnderTest.current)).toBe('qiuzhu');
  for (const id of [
    'recall-lead',
    'mao-encouragement',
    'mao-encouragement-continued',
    'ask-for-help',
    'next-step',
  ]) {
    await next(page, id);
  }
  await quiet();
  await page.locator('#settings').click();
  await page.locator('#setting-mode').selectOption('solo');
  expect(await page.evaluate(() => window.audioUnderTest.current)).toBe('qiuzhu');
  await page.locator('#setting-mode').selectOption('live');
  await page.locator('#modal-close').click();
  await quiet();
  await page.locator('#live-next').click();
  await current(page, 'group-sharing');
  await quiet();
  await page.locator('#live-next').click();
  await current(page, 's77');
  expect(await page.evaluate(() => window.audioUnderTest.current)).toBe('shouwei');
  expect(await page.evaluate(() => window.audioUnderTest.ambience.session.name)).toBe('campus');
});

test('rain continues between lines and obeys its own volume, pause and master mute', async ({
  page,
}) => {
  await bootAudio(page, 's14');
  await page.evaluate(() => {
    window.rainSession = window.audioUnderTest.ambience.session;
  });
  expect(await page.evaluate(() => window.rainSession.name)).toBe('rain');
  await next(page, 's15');
  expect(
    await page.evaluate(() => window.rainSession === window.audioUnderTest.ambience.session),
  ).toBe(true);
  await page.locator('#settings').click();
  expect(await page.evaluate(() => window.audioUnderTest.ambience.sessions.size)).toBe(0);
  await page.locator('#setting-ambienceVolume').fill('0');
  await page.locator('#modal-close').click();
  await expect
    .poll(() => page.evaluate(() => window.audioUnderTest.ambience.master.gain.value))
    .toBeLessThan(0.0001);
  expect(await page.evaluate(() => window.audioUnderTest.volume)).toBe(0.35);
  expect(await page.evaluate(() => window.audioUnderTest.events.volume)).toBe(0.9);
  await page.locator('#settings').click();
  await page.locator('#setting-ambienceVolume').fill('0.35');
  await page.locator('#modal-close').click();
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(
    await page.evaluate(() => [
      window.audioUnderTest.sessions.size,
      window.audioUnderTest.ambience.sessions.size,
    ]),
  ).toEqual([0, 0]);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(await page.evaluate(() => window.audioUnderTest.ambience.session.name)).toBe('rain');
  await page.locator('#sound').click();
  expect(
    await page.evaluate(() => [
      window.audioUnderTest.sessions.size,
      window.audioUnderTest.events.voices.size,
      window.audioUnderTest.ambience.sessions.size,
    ]),
  ).toEqual([0, 0, 0]);
  await page.locator('#sound').click();
  expect(await page.evaluate(() => window.audioUnderTest.ambience.session.name)).toBe('rain');
});

test('rapid ambience changes release old loops and all nodes stop on pause', async ({ page }) => {
  await bootAudio(page, 's53');
  await page.evaluate(() => {
    const ambience = window.audioUnderTest.ambience;
    ambience.play('rain');
    ambience.play('travel');
    ambience.play('night');
  });
  await expect
    .poll(() => page.evaluate(() => window.audioUnderTest.ambience.sessions.size))
    .toBe(1);
  expect(await page.evaluate(() => window.audioUnderTest.ambience.session.name)).toBe('night');
  await page.locator('#hide-ui').click();
  expect(await page.evaluate(() => window.audioUnderTest.ambience.sessions.size)).toBe(0);
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => window.audioUnderTest.ambience.session.name)).toBe('night');
});

test('full music phrases and ambience render audible finite samples with mixed headroom', async ({
  page,
}) => {
  await page.goto('./');
  const url = await runtimeModule(page, 'music-score.js');
  const metrics = await page.evaluate(async (url) => {
    const { musicTracks, musicStep } = await import(url);
    const { renderScore, renderCue, EventSounds, cueMix } = await import(
      new URL('event-sounds.js', url)
    );
    const { Ambience, ambientProfiles } = await import(new URL('ambience.js', url));
    const measure = (samples) => {
      let peak = 0,
        energy = 0;
      for (const sample of samples) {
        if (!Number.isFinite(sample)) throw new Error('Nonfinite audio sample');
        peak = Math.max(peak, Math.abs(sample));
        energy += sample * sample;
      }
      return { peak, rms: Math.sqrt(energy / samples.length) };
    };
    const tracks = {},
      beds = {};
    for (const [name, config] of Object.entries(musicTracks)) {
      const ctx = new OfflineAudioContext(
        1,
        Math.ceil(12000 * ((128 * 30) / config.bpm + 3)),
        12000,
      );
      const master = ctx.createGain();
      master.gain.value = 0.35 * 0.4;
      master.connect(ctx.destination);
      for (let step = 0; step < 128; step++)
        renderScore(ctx, master, musicStep(name, step), { startTime: (step * 30) / config.bpm });
      tracks[name] = measure((await ctx.startRendering()).getChannelData(0));
    }
    for (const name of Object.keys(ambientProfiles)) {
      const ctx = new OfflineAudioContext(1, 12000 * 8, 12000);
      const ambience = new Ambience();
      ambience.attach(ctx);
      ambience.setEnabled(true);
      ambience.play(name);
      beds[name] = measure((await ctx.startRendering()).getChannelData(0));
      ambience.stop();
    }
    const ctx = new OfflineAudioContext(1, 12000 * 8, 12000);
    const effects = new EventSounds();
    effects.volume = 1;
    effects.attach(ctx);
    const ambience = new Ambience();
    ambience.volume = 1;
    ambience.attach(ctx);
    ambience.setEnabled(true);
    ambience.play('rain');
    const music = ctx.createGain();
    music.gain.value = 0.4;
    music.connect(ctx.destination);
    for (let step = 0; step < 24; step++)
      renderScore(ctx, music, musicStep('ke', step), {
        startTime: (step * 30) / musicTracks.ke.bpm,
      });
    renderCue(ctx, effects.master, 'alarm', { strength: cueMix.alarm });
    renderCue(ctx, effects.master, 'heartbeat', { strength: cueMix.heartbeat });
    const mixed = measure((await ctx.startRendering()).getChannelData(0));
    ambience.stop();
    return { tracks, beds, mixed };
  }, url);
  for (const [name, value] of Object.entries(metrics.tracks)) {
    expect(value.rms, name + ' audible').toBeGreaterThan(0.001);
    expect(value.peak, name + ' headroom').toBeLessThan(0.95);
  }
  for (const [name, value] of Object.entries(metrics.beds)) {
    expect(value.rms, name + ' audible ambience').toBeGreaterThan(0.0001);
    expect(value.peak, name + ' stays in the background').toBeLessThan(0.05);
  }
  expect(metrics.mixed.peak).toBeLessThan(0.95);
});
