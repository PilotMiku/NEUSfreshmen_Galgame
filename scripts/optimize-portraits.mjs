import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
const run = promisify(execFile),
  root = process.cwd(),
  folder = 'img_human/optimized';
await mkdir(resolve(root, folder), { recursive: true });
const variants = {};
let original = 0,
  desktop = 0,
  mobile = 0;
for (const name of (await readdir('img_human')).filter((name) => name.endsWith('.png')).sort()) {
  const source = `img_human/${name}`,
    bytes = await readFile(source),
    width = bytes.readUInt32BE(16),
    height = bytes.readUInt32BE(20),
    key = name.slice(0, -4);
  variants[key] = { source, sha256: createHash('sha256').update(bytes).digest('hex') };
  original += bytes.length;
  for (const [kind, edge] of [
    ['desktop', 2000],
    ['mobile', 1200],
  ]) {
    const scale = Math.min(1, edge / Math.max(width, height)),
      w = Math.round(width * scale),
      h = Math.round(height * scale),
      target = `${folder}/${key}.${kind}.webp`;
    await run('cwebp', [
      '-quiet',
      '-q',
      '88',
      '-alpha_q',
      '100',
      '-m',
      '6',
      '-metadata',
      'icc',
      '-resize',
      String(w),
      String(h),
      source,
      '-o',
      target,
    ]);
    variants[key][kind] = target;
    const size = (await stat(target)).size;
    if (kind === 'desktop') desktop += size;
    else mobile += size;
  }
}
await writeFile('portrait-variants.json', JSON.stringify(variants, null, 2) + '\n');
const manifest = JSON.parse(await readFile('asset-manifest.json', 'utf8'));
for (const [key, value] of Object.entries(variants)) {
  manifest[key] = value.desktop;
  manifest['mobile_' + key] = value.mobile;
}
await writeFile('asset-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
await writeFile(
  'assets-default.js',
  '// Generated asset fallback; runtime and build use the same map.\nexport const defaultAssets = ' +
    JSON.stringify(manifest, null, 2) +
    ';\n',
);
console.log(
  `人物原图 ${(original / 1048576).toFixed(2)} MB → 电脑 ${(desktop / 1048576).toFixed(2)} MB / 手机 ${(mobile / 1048576).toFixed(2)} MB`,
);
