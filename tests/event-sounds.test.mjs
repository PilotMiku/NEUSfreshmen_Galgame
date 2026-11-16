import test from 'node:test';
import assert from 'node:assert/strict';
import {cueNames,cueScore,sceneCue} from '../event-sounds.js';
import {story} from '../story.js';
test('Every event has a distinct, finite, bounded sound score',()=>{
 const scores=[];
 for(const name of cueNames){const score=cueScore(name);assert(score.length>0);scores.push(JSON.stringify(score));for(const note of score){assert(note.at>=0&&note.duration>0&&note.at+note.duration<4.5);assert(note.level>0&&note.level<=.35);assert(note.frequency>0&&Number.isFinite(note.frequency));}}
 assert.equal(new Set(scores).size,cueNames.length);
});
test('Every scene resolves to an event sound or the chat message sound sequence',()=>{
 for(const scene of story){const cue=sceneCue(scene);assert(cue===null||cueNames.includes(cue),scene.id);}
 assert.equal(sceneCue(story.find(scene=>scene.id==='courses')),'alarm');assert.equal(sceneCue(story.find(scene=>scene.id==='s5')),null);
});
