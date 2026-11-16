import test from 'node:test';
import assert from 'node:assert/strict';
import {cueNames,cueScore,sceneCue,sceneCues} from '../event-sounds.js';
import {story,characters} from '../story.js';
test('Every event has a distinct, finite, bounded sound score',()=>{
 const scores=[];
 for(const name of cueNames){const score=cueScore(name);assert(score.length>0);scores.push(JSON.stringify(score));for(const note of score){assert(note.at>=0&&note.duration>0&&note.at+note.duration<4.5);assert(note.level>0&&note.level<=.35);assert(note.frequency>0&&Number.isFinite(note.frequency));}}
 assert.equal(new Set(scores).size,cueNames.length);
});
test('Every scene has an explicit sound matched to its action rather than a generic page cue',()=>{
 for(const scene of story){assert(Object.hasOwn(sceneCues,scene.id),scene.id);assert(cueNames.includes(sceneCue(scene)),scene.id);assert.notEqual(sceneCue(scene),'page',scene.id);}
 for(const [id,cue]of Object.entries({courses:'alarm',s5:'phone-open',s38:'bicycle',s47:'book',s52:'pocket',s14:'rain','group-sharing':'share'}))assert.equal(sceneCue(story.find(scene=>scene.id===id)),cue);
});
test('The psychology committee member shares the life committee member portrait and companion',()=>{
 assert.equal(characters.心理委员,characters.生活委员);
 assert.equal(characters.心理委员.file,'shenghuo');assert.equal(characters.心理委员.companion,'shenghuo_stand');
});
