import test from 'node:test';
import assert from 'node:assert/strict';
import {createTodoBody,stepTodoPhysics} from '../todo-physics.js';
const seeded=()=>{let seed=73;return()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);};

test('Sliding and spin lose momentum consistently across time steps',()=>{
 const results=[];
 for(const hz of [60,120]){
  const body=createTodoBody(2000,20,240,66,()=>.5);
  Object.assign(body,{vx:200,vy:0,omega:2});
  for(let frame=0;frame<hz;frame++)stepTodoPhysics([body],5000,10000,1/hz);
  assert(body.vx>0&&body.vx<100,'Sideways drift should lose over half its speed in a second');
  assert(body.omega>0&&body.omega<1,'Spin should slow down without stopping abruptly');
  assert(body.vy>0,'Gravity still pulls the card down');results.push(body);
 }
 assert(Math.abs(results[0].vx-results[1].vx)<.001);
 assert(Math.abs(results[0].omega-results[1].omega)<.001);
});

test('A supported card comes to rest without skating across the floor',()=>{
 const body=createTodoBody(300,514,240,66,()=>.5);
 Object.assign(body,{vx:260,vy:0,angle:0,omega:0});
 for(let frame=0;frame<360;frame++)stepTodoPhysics([body],1440,550,1/120);
 assert(Math.abs(body.x-300)<100,'Floor friction should keep a sliding card close to its landing point');
 assert(Math.abs(body.vx)<5);assert(Math.abs(body.omega)<.03);
});

test('A falling card rebounds and rotates instead of stopping flat at the floor',()=>{
 const body=createTodoBody(400,20,240,66,seeded());let rebound=false,turn=0;
 for(let frame=0;frame<420;frame++){
  const speed=body.vy;stepTodoPhysics([body],1440,550,1/120);
  rebound ||= speed>150&&body.vy< -80;turn=Math.max(turn,Math.abs(body.angle));
 }
 assert(rebound);assert(turn>.5);
});

test('An off-center card collision transfers movement and spin to another card',()=>{
 const random=seeded(),a=createTodoBody(430,240,240,66,random),b=createTodoBody(530,340,240,66,random);
 Object.assign(a,{vx:80,vy:500,angle:.22,omega:0});Object.assign(b,{vx:0,vy:0,angle:0,omega:0});
 let transfer=false;
 for(let frame=0;frame<70;frame++){stepTodoPhysics([a,b],1440,1200,1/120);transfer ||= Math.abs(b.vx)>10&&Math.abs(b.omega)>.1;}
 assert(transfer);
});

test('Full piles stay finite and contained on desktop, portrait and landscape screens',()=>{
 for(const [width,floor,cardWidth,cardHeight] of [[1440,550,240,66],[390,400,169,54],[844,210,240,66]]){
  const random=seeded(),bodies=[];
  for(let frame=0;frame<1700;frame++){
   if(frame%22===0&&bodies.length<28)bodies.push(createTodoBody(width/2+(random()-.5)*Math.min(width*.5,650),-160,cardWidth,cardHeight,random));
   stepTodoPhysics(bodies,width,floor,1/120);
   for(const body of bodies){
    assert([body.x,body.y,body.vx,body.vy,body.angle,body.omega].every(Number.isFinite));assert(Math.hypot(body.vx,body.vy)<2000);
    assert(body.x> -cardWidth&&body.x<width+cardWidth);
   }
  }
  assert.equal(bodies.length,28);
 }
});
