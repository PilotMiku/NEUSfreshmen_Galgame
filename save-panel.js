import { element as el } from './ui.js';
import { story, chapters, validSave } from './story.js';
export function savePanel(mode, { storage, snapshot, restore, closeModal, toast, confirmAction }) {
  const wrap = el('div'),
    rows = mode === 'load' ? ['auto', 1, 2, 3] : [1, 2, 3];
  for (const key of rows) {
    const data = storage.get(key === 'auto' ? 'auto' : 'slot' + key),
      valid = validSave(data),
      row = el('div', 'slot');
    row.append(el('div', 'slot-number', key === 'auto' ? 'A' : String(key).padStart(2, '0')));
    const info = el('div', 'slot-info');
    info.append(
      el(
        'strong',
        '',
        valid ? data.name + ' · ' + chapters[story[data.index].chapter].name : '空白存档',
      ),
    );
    info.append(
      el(
        'small',
        '',
        valid
          ? (key === 'auto' ? '自动保存 · ' : '') +
              new Date(data.date).toLocaleString('zh-CN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
          : '空白存档',
      ),
    );
    const b = el('button', 'slot-action', mode === 'save' ? '保存' : '读取');
    b.disabled = mode === 'load' && !valid;
    b.onclick = () => {
      if (mode === 'save') {
        const save = () => {
          const ok = storage.set('slot' + key, snapshot());
          closeModal();
          toast(ok ? '已保存在存档 ' + key : '浏览器存储不可用，存档未保存。');
        };
        if (valid)
          confirmAction(
            '覆盖这份存档？',
            '存档 ' + key + ' 目前停在「' + chapters[story[data.index].chapter].name + '」。',
            '确认覆盖',
            save,
          );
        else save();
      } else {
        closeModal();
        restore(data);
        toast('已读档。');
      }
    };
    row.append(info, b);
    wrap.append(row);
  }
  wrap.append(el('p', 'storage-note', '存档保存在当前浏览器；清除网站数据会移除存档。'));
  return wrap;
}
