import test from 'node:test';
import assert from 'node:assert/strict';
import {courseRegions,randomCoursePosition,inCourseRegion,moveCourseWord} from '../course-layout.js';
const seeded=()=>{let value=123456;return ()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/2**32;};};
const overlaps=(position,word,dialogue)=>position.x<dialogue.right&&position.x+word.width>dialogue.left&&position.y<dialogue.bottom&&position.y+word.height>dialogue.top;

test('Hidden dialogue geometry never initializes words into a zero-height strip',()=>{
 const word={width:150,height:40},hidden={left:0,right:0,top:0,bottom:0,width:0,height:0};
 assert.deepEqual(courseRegions(1440,900,word,hidden),[]);
 assert.equal(randomCoursePosition(courseRegions(1440,900,word,hidden)),null);
 const visible={left:115,right:1325,top:640,bottom:820,width:1210,height:180};
 const regions=courseRegions(1440,900,word,visible),random=seeded();
 const ys=Array.from({length:28},()=>randomCoursePosition(regions,random).y);
 assert(Math.max(...ys)-Math.min(...ys)>400,'Initial positions cover the available height after the dialogue returns');
});

test('Random origins use the full viewport around the dialogue without entering it',()=>{
 const word={width:60,height:25},dialogue={left:220,right:780,top:350,bottom:550,width:560,height:200};
 const regions=courseRegions(1000,700,word,dialogue),random=seeded(),covered=new Set();
 for(let i=0;i<2000;i++){
  const p=randomCoursePosition(regions,random);assert(!overlaps(p,word,dialogue));assert(p.x>=0&&p.y>=0&&p.x+word.width<=1000&&p.y+word.height<=700);
  if(p.y+word.height<dialogue.top)covered.add('above');
  if(p.y>dialogue.bottom)covered.add('below');
  if(p.x+word.width<dialogue.left&&p.y>=dialogue.top&&p.y<=dialogue.bottom)covered.add('left');
  if(p.x>dialogue.right&&p.y>=dialogue.top&&p.y<=dialogue.bottom)covered.add('right');
 }
 assert.deepEqual([...covered].sort(),['above','below','left','right']);
});

test('Slow floating words reflect at the viewport and dialogue rather than drifting through text',()=>{
 const random=seeded();
 for(const [width,height,dialogue]of [
  [1440,900,{left:115,right:1325,top:640,bottom:824,width:1210,height:184}],
  [390,844,{left:20,right:370,top:574,bottom:766,width:350,height:192}],
  [844,390,{left:290,right:820,top:105,bottom:320,width:530,height:215}]
 ]){
  for(let i=0;i<28;i++){
   const body={width:60+random()*100,height:24,vx:(random()-.5)*18,vy:(random()-.5)*18};body.regions=courseRegions(width,height,body,dialogue);Object.assign(body,randomCoursePosition(body.regions,random));
   for(let step=0;step<1800;step++){moveCourseWord(body,1/30);assert(inCourseRegion(body.regions,body.x,body.y));assert(!overlaps(body,body,dialogue));}
  }
 }
});
