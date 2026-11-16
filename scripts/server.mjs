import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { resolveAssetManifest } from './asset-manifest.mjs';
const built = process.argv.includes('--dist'),
  root = resolve(process.cwd(), built ? 'dist' : '.'),
  port = Number(process.env.PORT || 4173);
const baseIndex = process.argv.indexOf('--base'),
  base = baseIndex >= 0 ? '/' + process.argv[baseIndex + 1].replace(/^\/+|\/+$/g, '') : '';
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.json': 'application/json; charset=utf-8',
};
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let path = decodeURIComponent(url.pathname);
    if (base) {
      if (!path.startsWith(base + '/')) {
        res.writeHead(302, { Location: base + '/' });
        res.end();
        return;
      }
      path = path.slice(base.length);
    }
    if (!built && path === '/asset-manifest.json') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(await resolveAssetManifest(root)));
      return;
    }
    const file = resolve(root, '.' + (path === '/' ? '/index.html' : path));
    if (!file.startsWith(root + sep) || path.split('/').some((s) => s.startsWith('.'))) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    const data = await readFile(file);
    res.writeHead(200, {
      'Content-Type': types[extname(file)] || 'application/octet-stream',
      'Cache-Control':
        built && /\/[a-f0-9]{12}\/|\.[a-f0-9]{12}\./.test(path)
          ? 'public,max-age=31536000,immutable'
          : 'no-cache',
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});
server.listen(port, '127.0.0.1', () =>
  console.log(`新生 · Local: http://127.0.0.1:${port}${base}/`),
);
server.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
