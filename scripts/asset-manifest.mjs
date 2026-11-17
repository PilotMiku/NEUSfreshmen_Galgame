import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const groups = {
  img_bg: [
    'chechuang',
    'xiaomen',
    'wenguan',
    'tushuguan',
    'xiaonanhu',
    'ercantang',
    'sushe',
    'junxun',
    'jiaoshi',
    'zoulang',
    'wenguanmenkou',
    'yelu',
  ],
  img_human: [
    'zhujue',
    'banzhang',
    'tuanzhishu',
    'shenghuo',
    'zuxuan',
    'xuewei',
    'wenti',
    'xuezhang',
    'xinli',
    'wenti_stand',
    'banzhang_stand',
    'tuanzhishu_stand',
    'shenghuo_stand',
    'xuewei_stand',
    'zuxuan_stand',
    'xuezhang_stand',
  ],
  audio: ['bgm_open', 'bgm_ke', 'bgm_banwei', 'bgm_xingfu', 'bgm_qiuzhu', 'bgm_shouwei'],
};
export async function resolveAssetManifest(root) {
  const entries = JSON.parse(await readFile(resolve(root, 'asset-manifest.json'), 'utf8'));
  let variants = {};
  try {
    variants = JSON.parse(await readFile(resolve(root, 'portrait-variants.json'), 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  for (const [kind, names] of Object.entries(groups))
    for (const name of names) {
      const file = `${kind}/${name}.${kind === 'audio' ? 'mp3' : 'png'}`;
      try {
        await stat(resolve(root, file));
        const variant = variants[name];
        let optimized =
          kind === 'img_human' &&
          variant &&
          createHash('sha256')
            .update(await readFile(resolve(root, file)))
            .digest('hex') === variant.sha256;
        if (optimized) {
          try {
            await Promise.all([
              stat(resolve(root, variant.desktop)),
              stat(resolve(root, variant.mobile)),
            ]);
          } catch (error) {
            if (error.code !== 'ENOENT') throw error;
            optimized = false;
          }
        }
        if (optimized) {
          entries[name] = variant.desktop;
          entries['mobile_' + name] = variant.mobile;
        } else {
          entries[name] = file;
          if (kind === 'img_human') delete entries['mobile_' + name];
        }
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
  return entries;
}
