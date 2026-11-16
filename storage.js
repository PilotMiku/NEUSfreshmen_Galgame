import { normalizeSave } from './story.js';
export function createStorage(getStorage = () => localStorage) {
  let available = true;
  return {
    get available() {
      return available;
    },
    get(key, fallback = null) {
      try {
        const raw = getStorage().getItem('xinsheng.v1.' + key);
        if (raw === null) return fallback;
        const value = JSON.parse(raw);
        return key === 'auto' || /^slot[123]$/.test(key) ? normalizeSave(value) || fallback : value;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        getStorage().setItem('xinsheng.v1.' + key, JSON.stringify(value));
        return true;
      } catch {
        available = false;
        return false;
      }
    },
  };
}
