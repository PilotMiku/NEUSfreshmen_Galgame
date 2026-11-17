// Live speakers get silence; solo readers keep the chapter's music.
export function sceneAudio(scene, mode = 'solo') {
  const live = scene.kind === 'live';
  const quiet =
    live ||
    scene.memory ||
    scene.kind === 'end' ||
    ['glitch', 'binding', 'welcome', 'blackout'].includes(scene.effect) ||
    scene.id === 's7';
  const locations = {
    车窗: 'travel',
    校门: 'campus',
    文管学馆: 'campus',
    宿舍楼下: 'campus',
    军训场: 'field',
    开学典礼: 'field',
    雨中校园: 'rain',
    小南湖: 'lake',
    夜路: 'night',
    文管门口: 'campus',
  };
  return {
    music: live && mode === 'live' ? 'off' : scene.music,
    ambience: quiet ? 'off' : locations[scene.bg] || 'off',
  };
}
