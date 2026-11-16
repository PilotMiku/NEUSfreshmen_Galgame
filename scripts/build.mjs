import { mkdir, copyFile, readdir, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve, dirname, extname } from 'node:path';
import { createHash } from 'node:crypto';
import { resolveAssetManifest } from './asset-manifest.mjs';
const root = process.cwd(),
  dist = resolve(root, 'dist'),
  hash = (value) => createHash('sha256').update(value).digest('hex').slice(0, 12);
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
const entries = await resolveAssetManifest(root),
  copies = new Map();
async function fingerprint(file) {
  if (copies.has(file)) return copies.get(file);
  const bytes = await readFile(resolve(root, file)),
    extension = extname(file),
    output = (extension ? file.slice(0, -extension.length) : file) + '.' + hash(bytes) + extension;
  copies.set(file, output);
  await mkdir(dirname(resolve(dist, output)), { recursive: true });
  await writeFile(resolve(dist, output), bytes);
  return output;
}
for (const [key, file] of Object.entries(entries)) entries[key] = await fingerprint(file);
let html = await readFile(resolve(root, 'index.html'), 'utf8'),
  css = await readFile(resolve(root, 'style.css'), 'utf8');
// Hash HTML resources as well as the manifest's photographs and portraits.
for (const match of [
  ...html.matchAll(/(?:src|href)="((?:assets|img_bg|img_human|audio)\/[^"?#]+)"/g),
]) {
  const output = await fingerprint(match[1]);
  html = html.replaceAll('"' + match[1] + '"', '"' + output + '"');
}
for (const match of [...css.matchAll(/url\(["']?((?:assets|img_bg|img_human)\/[^)'"?#]+)["']?\)/g)])
  css = css.replaceAll(match[1], '../../' + (await fingerprint(match[1])));
const modules = (await readdir(root))
    .filter(
      (file) => file.endsWith('.js') && !file.endsWith('.config.js') && !file.endsWith('.test.js'),
    )
    .sort(),
  sources = new Map();
for (const file of modules)
  sources.set(
    file,
    file === 'assets-default.js'
      ? 'export const defaultAssets = ' + JSON.stringify(entries, null, 2) + ';\n'
      : await readFile(resolve(root, file), 'utf8'),
  );
// One fingerprint identifies the entire module graph, keeping all relative imports in sync.
const version = hash(html + css + [...sources.values()].join('\n') + JSON.stringify(entries)),
  release = `static/${version}`;
await mkdir(resolve(dist, release), { recursive: true });
for (const [file, source] of sources) await writeFile(resolve(dist, release, file), source);
await writeFile(resolve(dist, release, 'style.css'), css);
await writeFile(resolve(dist, release, 'asset-manifest.json'), JSON.stringify(entries, null, 2));
html = html
  .replace('href="style.css"', `href="${release}/style.css"`)
  .replace('src="app.js"', `src="${release}/app.js"`);
await writeFile(resolve(dist, 'index.html'), html);
// Keep location cards available when a network request for a primary asset fails.
for (const file of await readdir(resolve(root, 'assets')))
  if (file.endsWith('.svg'))
    await copyFile(resolve(root, 'assets', file), resolve(dist, 'assets', file));
await writeFile(resolve(dist, 'asset-manifest.json'), JSON.stringify(entries, null, 2));
await writeFile(resolve(dist, 'version.json'), JSON.stringify({ version }, null, 2));
await writeFile(resolve(dist, '.nojekyll'), '');
console.log(`已构建到 dist/，版本 ${version}；脚本、样式和素材均已加入指纹。`);
