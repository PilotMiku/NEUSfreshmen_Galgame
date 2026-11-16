import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { characters } from '../story.js';
import { defaultAssets } from '../assets-default.js';
import { portraitSource } from '../asset-loader.js';
import { resolveAssetManifest } from '../scripts/asset-manifest.mjs';
test('Every shipped committee portrait has small transparent desktop and phone variants', async () => {
  const variants = JSON.parse(
    await readFile(new URL('../portrait-variants.json', import.meta.url), 'utf8'),
  );
  let desktop = 0,
    mobile = 0;
  for (const character of new Set(Object.values(characters)))
    for (const key of [character.file, character.companion].filter((key) => variants[key])) {
      const variant = variants[key],
        source = await readFile(new URL('../' + variant.source, import.meta.url));
      assert.equal(createHash('sha256').update(source).digest('hex'), variant.sha256);
      for (const kind of ['desktop', 'mobile']) {
        const bytes = await readFile(new URL('../' + variant[kind], import.meta.url));
        assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
        assert(bytes.includes(Buffer.from('ALPH')), 'Transparency retained: ' + key);
        assert(bytes.length < 250_000, key + ' budget');
        if (kind === 'desktop') desktop += bytes.length;
        else mobile += bytes.length;
      }
      assert.equal(portraitSource(key, defaultAssets, true), variant.mobile);
      assert.equal(portraitSource(key, defaultAssets, false), variant.desktop);
    }
  assert(desktop < 2_000_000 && mobile < 1_300_000);
});
test('Local preview and release resolve the same optimized portrait manifest', async () => {
  assert.deepEqual(
    await resolveAssetManifest(new URL('../', import.meta.url).pathname),
    defaultAssets,
  );
  assert.equal(
    portraitSource('custom', { custom: 'img_human/custom.png' }, true),
    'img_human/custom.png',
  );
});

test('A replaced PNG or missing optimized file falls back to the current original', async () => {
  const { mkdtemp, mkdir, writeFile, rm } = await import('node:fs/promises'),
    { tmpdir } = await import('node:os'),
    { join } = await import('node:path');
  const root = await mkdtemp(join(tmpdir(), 'xinsheng-portrait-'));
  try {
    await mkdir(join(root, 'img_human'));
    const source = Buffer.from('original portrait');
    await writeFile(join(root, 'img_human/banzhang.png'), source);
    await writeFile(
      join(root, 'asset-manifest.json'),
      JSON.stringify({
        banzhang: 'img_human/old.webp',
        mobile_banzhang: 'img_human/old-mobile.webp',
      }),
    );
    const variants = {
      banzhang: {
        source: 'img_human/banzhang.png',
        desktop: 'img_human/desktop.webp',
        mobile: 'img_human/mobile.webp',
        sha256: createHash('sha256').update(source).digest('hex'),
      },
    };
    await writeFile(join(root, 'portrait-variants.json'), JSON.stringify(variants));
    assert.deepEqual(await resolveAssetManifest(root), { banzhang: 'img_human/banzhang.png' });
    await writeFile(join(root, 'img_human/desktop.webp'), 'desktop');
    await writeFile(join(root, 'img_human/mobile.webp'), 'mobile');
    assert.equal((await resolveAssetManifest(root)).banzhang, 'img_human/desktop.webp');
    await writeFile(join(root, 'img_human/banzhang.png'), 'a new portrait');
    assert.deepEqual(await resolveAssetManifest(root), { banzhang: 'img_human/banzhang.png' });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
