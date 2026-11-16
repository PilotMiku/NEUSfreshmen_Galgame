// Requests are bounded, and cancelled scene requests can never replace a newer scene.
export async function fetchManifest(
  url = new URL('./asset-manifest.json', import.meta.url),
  timeout = 5000,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: 'no-cache' });
    if (!response.ok) throw new Error('素材清单请求失败');
    const value = await response.json();
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      !Object.keys(value).length ||
      !Object.values(value).every(
        (path) =>
          typeof path === 'string' &&
          /^(assets|img_bg|img_human|audio)\//.test(path) &&
          !path.split('/').includes('..'),
      )
    )
      throw new Error('素材清单格式错误');
    return value;
  } finally {
    clearTimeout(timer);
  }
}

export function portraitSource(key, assets, small = false) {
  return (small && assets['mobile_' + key]) || assets[key] || null;
}

export function backgroundSource(key, assets, small = false) {
  const primary = assets[key] || `assets/${key}.svg`;
  // User supplied backgrounds always take precedence over generated variants.
  return (small && primary.startsWith('assets/photos/') && assets['mobile_' + key]) || primary;
}

export function loadImage(src, { signal, timeout = 8000 } = {}) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    let timer;
    const cleanup = () => {
      clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
      signal?.removeEventListener('abort', abort);
    };
    const fail = (error) => {
      cleanup();
      image.src = '';
      reject(error);
    };
    const abort = () => fail(new DOMException('Image request cancelled', 'AbortError'));
    if (signal?.aborted) {
      abort();
      return;
    }
    image.decoding = 'async';
    image.onload = () => {
      cleanup();
      resolve(image);
    };
    image.onerror = () => fail(new Error('图片加载失败'));
    signal?.addEventListener('abort', abort, { once: true });
    timer = setTimeout(() => fail(new Error('图片加载超时')), timeout);
    image.src = src;
  });
}

const preloads = new Map();
export function preloadImage(src) {
  if (!src || preloads.has(src)) return;
  if (preloads.size >= 6) preloads.delete(preloads.keys().next().value);
  preloads.set(
    src,
    loadImage(src).catch(() => {
      preloads.delete(src);
    }),
  );
}
