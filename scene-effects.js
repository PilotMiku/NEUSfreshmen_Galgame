import {createTodoBody,stepTodoPhysics} from './todo-physics.js';
const node=(tag,className,text)=>{const element=document.createElement(tag);element.className=className;if(text!==undefined)element.textContent=text;return element;};
const courseIntroDuration=3500,courseTextDuration=4200;
const warningIcon='<svg viewBox="0 0 100 91" focusable="false" aria-hidden="true"><path d="M50 4 98 87.14H2Z" fill="#ffe16a" stroke="#bc8431" stroke-width="3" stroke-linejoin="round"/><path d="M46 33h8l-1 27h-6Z" fill="#d83c46"/><circle cx="50" cy="69" r="4.5" fill="#d83c46"/></svg>';
const courseWords={
 math:['(x²)′ = 2x','lim x→0','∫ f(x) dx','Δx → 0','y = f(x)','(sin x)′ = cos x','dy / dx','∫ x dx','连续 · 可导','极限存在吗？','求导法则','f′(x)','ε > 0','高等数学'],
 matrix:['[ 1 0 ; 0 1 ]','A · B ≠ B · A','det(A)','矩阵相乘','Ax = b','λI − A','线性相关？','rank(A)','初等行变换','[ a₁ a₂ a₃ ]','逆矩阵 A⁻¹','向量空间','特征值 λ','齐次方程组'],
 english:['Could you repeat that?','assignment','Take notes.','vocabulary','Unit 1','Listen carefully.','presentation','What does it mean?','paragraph','deadline','Read aloud.','How do you spell it?','grammar','One more time?'],
};

class CourseWords{
 constructor(container,dialogue){
  this.container=container;this.dialogue=dialogue;this.layer=node('div','course-words hidden');container.append(this.layer);
  this.layer.setAttribute('aria-hidden','true');this.measure=()=>{
   if(!this.active)return;
   const height=Math.max(0,dialogue.getBoundingClientRect().top-this.layer.getBoundingClientRect().top-14),width=this.layer.clientWidth;
   this.layer.style.height=height+'px';
   const columns=width<500?2:width>740&&height<200?5:4,rows=Math.ceil(this.layer.children.length/columns);
   this.layer.style.setProperty('--course-columns',columns);
   Array.from(this.layer.children).forEach((word,index)=>{word.style.left=((index%columns+.5)*100/columns)+'%';word.style.top=((Math.floor(index/columns)+.5)*100/rows)+'%';});
  };
  this.observer=new ResizeObserver(this.measure);this.observer.observe(dialogue);window.addEventListener('resize',this.measure);
 }
 set(effect){
  this.active=!!courseWords[effect];this.layer.classList.toggle('hidden',!this.active);this.layer.replaceChildren();
  if(!this.active)return;
  courseWords[effect].forEach((text,index)=>{
   const word=node('span','course-word',text);word.style.setProperty('--word-duration',(12+Math.random()*8)+'s');
   word.style.setProperty('--word-delay',(-Math.random()*16)+'s');word.style.setProperty('--word-appear',index*45+'ms');
   word.style.setProperty('--word-x',(Math.random()>.5?1:-1)*(6+Math.random()*6)+'px');word.style.setProperty('--word-y',(Math.random()>.5?1:-1)*(5+Math.random()*5)+'px');
   word.style.setProperty('--word-tilt',(Math.random()-.5)*6+'deg');this.layer.append(word);
  });
  this.measure();requestAnimationFrame(this.measure);
 }
 pause(value){this.layer.classList.toggle('effect-paused',value);}
 clear(){this.active=false;this.layer.replaceChildren();this.layer.classList.add('hidden');}
}

export class TodoList{
 constructor(onChange){this.onChange=onChange;this.target=0;this.count=0;this.paused=false;}
 set(container,todos,target,reduced){
  if(this.container!==container||!this.container?.isConnected){this.clear();this.container=container;this.todos=todos;}
  while(this.count>target){this.container.lastElementChild?.remove();this.count--;}
  this.target=target;this.reduced=reduced;this.onChange?.(this.count);this.tick();
 }
 clear(){clearTimeout(this.timer);this.timer=null;this.container=null;this.count=0;this.target=0;}
 pause(value){this.paused=value;clearTimeout(this.timer);this.timer=null;if(!value)this.tick();}
 tick(){
  clearTimeout(this.timer);if(this.paused||!this.container?.isConnected)return;
  while(this.count<this.target){
   const row=node('div','phone-item todo-added');row.append(node('span','phone-checkbox'),node('span','',this.todos[this.count]));
   row.style.setProperty('--todo-order',this.count);this.container.append(row);this.count++;
   this.onChange?.(this.count);
   this.container.scrollTop=this.container.scrollHeight;
   if(!this.reduced)break;
  }
  if(this.count<this.target)this.timer=setTimeout(()=>this.tick(),280);
 }
}

export class FallingTodos{
 constructor(container,dialogue,todos){
  this.container=container;this.dialogue=dialogue;this.todos=todos;this.bodies=[];this.target=0;this.active=false;this.paused=false;
  this.resize=()=>this.measure(true);window.addEventListener('resize',this.resize);
  this.observer=new ResizeObserver(()=>this.measure(false));this.observer.observe(dialogue);
 }
 clear(){cancelAnimationFrame(this.frame);this.frame=null;this.active=false;this.target=0;this.bodies=[];this.container.replaceChildren();}
 pause(value){this.paused=value;cancelAnimationFrame(this.frame);this.frame=null;if(!value&&this.active)this.run();}
 set(target,reduced){
  if(!target){this.clear();return;}
  if(target<this.target)this.clear();
  this.active=true;this.reduced=reduced;this.target=Math.max(target,this.target);this.measure(false);
  if(reduced){while(this.bodies.length<this.target)this.spawn();this.settle();return;}
  this.run();
 }
 measure(reset){
  if(!this.active)return;
  const bounds=this.container.getBoundingClientRect(),floor=this.dialogue.getBoundingClientRect().top-bounds.top;
  if(bounds.width<1||floor<1)return;
  const previous=this.floor;this.width=bounds.width;this.floor=floor;
  this.container.style.height=floor+'px';
  this.cardWidth=Math.min(240,Math.max(145,(this.width-34)/2.1));this.cardHeight=this.width<761?54:66;
  if(reset){this.bodies.forEach(body=>{body.element.style.width=this.cardWidth+'px';body.element.style.height=this.cardHeight+'px';});this.settle();}
  else if(previous&&Math.abs(previous-floor)>1){this.bodies.forEach(body=>body.y+=floor-previous);this.paint();}
 }
 spawn(){
  const index=this.bodies.length,todoIndex=index<this.todos.length?index:index%3===0?index%this.todos.length:this.todos.length-1;
  const element=node('div','todo-card'+(todoIndex===this.todos.length-1?' todo-card-last':''));
  element.append(node('small','',String(todoIndex+1).padStart(2,'0')),node('span','',this.todos[todoIndex]));
  element.style.width=this.cardWidth+'px';element.style.height=this.cardHeight+'px';this.container.append(element);
  const columns=Math.max(1,Math.min(3,Math.floor((this.width-24)/(this.cardWidth+8))));
  const spread=columns*(this.cardWidth+6),column=(index*2+Math.floor(index/columns))%columns;
  const body=createTodoBody((this.width-spread)/2+column*(this.cardWidth+6)+this.cardWidth/2+(Math.random()-.5)*24,-this.cardWidth/2-25,this.cardWidth,this.cardHeight);
  body.element=element;this.bodies.push(body);this.sinceSpawn=0;
 }
 settle(){
  const columns=Math.max(1,Math.min(3,Math.floor((this.width-24)/(this.cardWidth+8))));
  const left=(this.width-columns*(this.cardWidth+6))/2;
  this.bodies.forEach((body,index)=>{body.width=this.cardWidth;body.height=this.cardHeight;body.invInertia=12/(body.width**2+body.height**2);body.x=left+(index%columns)*(this.cardWidth+6)+this.cardWidth/2;body.y=this.floor-this.cardHeight*(Math.floor(index/columns)+.5)-3;body.vx=0;body.vy=0;body.omega=0;body.angle=this.reduced?0:(Math.random()-.5)*.2;});this.paint();
 }
 paint(){for(const body of this.bodies)body.element.style.transform=`translate(${(body.x-body.width/2).toFixed(1)}px,${(body.y-body.height/2).toFixed(1)}px) rotate(${body.angle*180/Math.PI}deg)`;}
 run(){
  if(this.frame||this.paused||!this.active||this.reduced)return;
  this.lastTime=performance.now();this.spawnTime=0;this.restFrames=0;this.accumulator=0;
  const step=now=>{
   this.frame=null;if(this.paused||!this.active||this.reduced)return;
   const dt=Math.min(.04,(now-this.lastTime)/1000);this.lastTime=now;this.spawnTime+=dt;this.sinceSpawn=(this.sinceSpawn||0)+dt;
   if(this.bodies.length<this.target&&this.spawnTime>.18){this.spawn();this.spawnTime=0;}
   this.accumulator+=dt;while(this.accumulator>=1/120){stepTodoPhysics(this.bodies,this.width,this.floor,1/120);this.accumulator-=1/120;}
   this.paint();
   const moving=this.bodies.some(body=>Math.abs(body.vy)>10||Math.abs(body.vx)>5||Math.abs(body.omega)>.08);
   this.restFrames=moving?0:this.restFrames+1;
   if(this.bodies.length<this.target||(this.restFrames<90&&this.sinceSpawn<14))this.frame=requestAnimationFrame(step);
  };
  this.frame=requestAnimationFrame(step);
 }
}

export class SceneEffects{
 constructor(overlay,pile,dialogue,todos,onFinished,decoration){
  this.overlay=overlay;this.heading=overlay.querySelector('[data-cinematic-title]');this.note=overlay.querySelector('[data-cinematic-note]');
  this.warnings=node('div','course-warning-signs');this.warnings.setAttribute('aria-hidden','true');overlay.prepend(this.warnings);
  overlay.style.setProperty('--course-intro',courseIntroDuration+'ms');
  window.addEventListener('resize',()=>{if(this.effect==='course-warning'&&this.playing)this.renderWarnings(courseIntroDuration+courseTextDuration-this.remaining+(this.paused?0:performance.now()-this.startedAt));});
  this.pile=new FallingTodos(pile,dialogue,todos);this.words=new CourseWords(decoration,dialogue);this.onFinished=onFinished;this.key=null;this.playing=false;
 }
 get cinematic(){return ['binding','welcome','course-warning'].includes(this.effect);}
 get busy(){return this.playing;}
 clear(){clearTimeout(this.timer);this.timer=null;this.key=null;this.effect=null;this.playing=false;this.overlay.className='cinematic-overlay hidden';this.warnings.replaceChildren();this.pile.clear();this.words.clear();document.body.classList.remove('cinematic-scene');}
 renderWarnings(elapsed=0){
  const width=this.overlay.clientWidth,height=this.overlay.clientHeight,columns=Math.max(3,Math.ceil(width/180)),size=width/columns;
  const rows=Math.ceil(height/(size*.66)),count=columns*rows,fragment=document.createDocumentFragment();
  const positions=Array.from({length:count},(_,index)=>index);
  for(let index=count-1;index>0;index--){const other=Math.floor(Math.random()*(index+1));[positions[index],positions[other]]=[positions[other],positions[index]];}
  for(let index=0;index<count;index++){
   const sign=node('span','course-warning-sign');sign.innerHTML=warningIcon;
   const position=positions[index],column=position%columns,row=Math.floor(position/columns);
   sign.style.left=(column+.5+(Math.random()-.5)*.38)*100/columns+'%';sign.style.top=(row+.5+(Math.random()-.5)*.36)*100/rows+'%';
   sign.style.width=size*(1.22+Math.random()*.18)+'px';sign.style.setProperty('--warning-delay',(index/(count-1)*2800-elapsed)+'ms');fragment.append(sign);
  }
  this.warnings.replaceChildren(fragment);
 }
 set(scene,name,reduced){
  this.pile.set(scene.effect==='overload'?scene.overflowCount||12:0,reduced);
  if(scene.id===this.key&&this.effect===scene.effect)return;
  clearTimeout(this.timer);this.timer=null;this.key=scene.id;this.effect=scene.effect;this.playing=false;
  this.words.set(scene.effect);
  this.overlay.className='cinematic-overlay hidden';this.warnings.replaceChildren();document.body.classList.toggle('cinematic-scene',this.cinematic);
  if(!this.cinematic)return;
  const title=(scene.cinematicTitle||scene.text).replaceAll('{name}',name);
  this.heading.replaceChildren();Array.from(title).forEach((letter,index)=>{const span=node('span','cinematic-letter',letter);span.style.setProperty('--letter-index',index);this.heading.append(span);});
  this.note.textContent=scene.cinematicNote||'';
  this.overlay.className='cinematic-overlay '+scene.effect+(reduced?' finished':'');
  this.overlay.classList.toggle('effect-paused',!!this.paused);
  if(reduced)return;
  if(scene.effect==='course-warning')this.renderWarnings();
  this.playing=true;this.remaining=scene.effect==='course-warning'?courseIntroDuration+courseTextDuration:Math.max(1900,title.length*140+650);this.resumeTimer();
 }
 resumeTimer(){if(!this.playing||this.paused)return;this.startedAt=performance.now();this.timer=setTimeout(()=>this.finish(),this.remaining);}
 finish(){if(!this.playing)return false;clearTimeout(this.timer);this.timer=null;this.playing=false;this.overlay.classList.add('finished');this.onFinished();return true;}
 pause(value){
  if(this.paused===value)return;this.paused=value;this.pile.pause(value);this.words.pause(value);this.overlay.classList.toggle('effect-paused',value);
  if(value){if(this.timer){clearTimeout(this.timer);this.timer=null;this.remaining=Math.max(0,this.remaining-(performance.now()-this.startedAt));}}
  else this.resumeTimer();
 }
}
