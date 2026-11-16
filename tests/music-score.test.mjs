import test from 'node:test';
import assert from 'node:assert/strict';
import {musicTracks,musicStep} from '../music-score.js';
import {story} from '../story.js';

test('Every chapter track has a repeatable rhythm with bass, melody and backbeats',()=>{
 for(const track of new Set(story.map(s=>s.music).filter(t=>t!=='off'))){
  assert(musicTracks[track]);assert(musicTracks[track].bpm>=88&&musicTracks[track].bpm<=112);
  for(let step=0;step<64;step++){
   const score=musicStep(track,step);assert.deepEqual(score,musicStep(track,step+64));
   for(const note of score){for(const field of ['at','duration','frequency','end','level'])assert(Number.isFinite(note[field]));assert(note.duration>0&&note.duration<3);assert(note.frequency>0&&note.end>0);assert(note.level>0&&note.level<.35);}
  }
  const downbeat=musicStep(track,0),backbeat=musicStep(track,2);
  assert(downbeat.some(n=>n.frequency>100&&n.end<50),'Kick drum');
  assert(downbeat.some(n=>n.type==='triangle'&&n.frequency<150),'Bass');
  assert(downbeat.some(n=>n.type==='sine'&&n.frequency>400),'Melody');
  assert(backbeat.some(n=>n.type==='noise'&&n.duration>=.1),'Snare backbeat');
 }
 assert.deepEqual(musicStep('off',0),[]);
});
