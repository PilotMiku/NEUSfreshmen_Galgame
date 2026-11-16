import { story, chapters } from './story.js';
export function newGameState(name = '同学') {
  return { version: 2, index: 0, name, trail: [], branch: null, notes: {}, date: '' };
}
export function sessionSnapshot(state) {
  return {
    ...state,
    version: 2,
    sceneId: story[state.index].id,
    trail: [...state.trail],
    trailIds: state.trail.map((index) => story[index].id),
    notes: { ...state.notes },
    date: new Date().toISOString(),
  };
}
export function chapterReplayState(chapter, saved) {
  if (!Number.isInteger(chapter) || !chapters[chapter]) return null;
  return {
    ...newGameState(saved?.name || '同学'),
    index: story.findIndex((scene) => scene.chapter === chapter),
    branch: saved?.branch || null,
    notes: { ...saved?.notes },
  };
}
export function endingReflection(notes = {}) {
  if (notes['next-step']?.trim())
    return { label: '我准备尝试的一步', text: notes['next-step'].trim() };
  if (notes['group-sharing']?.trim())
    return { label: '我想记住的办法', text: notes['group-sharing'].trim() };
  return null;
}
