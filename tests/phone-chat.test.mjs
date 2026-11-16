import test from 'node:test';
import assert from 'node:assert/strict';
import {PhoneChat} from '../phone-chat.js';

test('Each outgoing phone character produces a key sound, including the family message',()=>{
 const chat=new PhoneChat(null,null,null,()=>{},()=>{},()=>{}),cues=[];
 chat.draft={textContent:''};chat.onCue=cue=>cues.push(cue);
 const text='我到学校啦，已经找到宿舍了。';chat.typeDraft(text);
 for(const [index,task]of chat.tasks.entries()){
  assert.equal(task.delay,90);task.action();assert.equal(chat.draft.textContent,Array.from(text).slice(0,index+1).join(''));
 }
 assert.deepEqual(cues,Array.from(text,()=> 'typing'));
 chat.flushing=true;chat.tasks[0].action();assert.equal(cues.length,Array.from(text).length,'Fast-forward does not burst all key sounds at once');
});
