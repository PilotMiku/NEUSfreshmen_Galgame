import test from 'node:test';
import assert from 'node:assert/strict';
import { sceneAudio } from '../scene-audio.js';
import { story, sceneIndex } from '../story.js';
import { ambientProfiles } from '../ambience.js';

test('Every host-led discussion is quiet while solo readers retain the scene music', () => {
  for (const scene of story.filter((scene) => scene.kind === 'live')) {
    assert.deepEqual(sceneAudio(scene, 'live'), { music: 'off', ambience: 'off' });
    assert.equal(sceneAudio(scene, 'solo').music, scene.music);
    assert.equal(sceneAudio(scene, 'solo').ambience, 'off');
  }
  assert.equal(sceneAudio(story[sceneIndex.s77], 'live').music, 'shouwei');
});

test('Ambience follows the location across dialogue and leaves memories and system reveals quiet', () => {
  assert.equal(sceneAudio(story[sceneIndex.s14]).ambience, 'rain');
  assert.equal(sceneAudio(story[sceneIndex.s15]).ambience, 'rain');
  assert.equal(sceneAudio(story[sceneIndex.s0]).ambience, 'travel');
  assert.equal(sceneAudio(story[sceneIndex.s53]).ambience, 'lake');
  for (const id of ['s6', 's7', 's8', 's9', 'mao-encouragement', 'mao-encouragement-continued']) {
    assert.equal(sceneAudio(story[sceneIndex[id]]).ambience, 'off', id);
  }
  for (const scene of story) {
    const name = sceneAudio(scene).ambience;
    assert(name === 'off' || Object.hasOwn(ambientProfiles, name), scene.id);
  }
});
