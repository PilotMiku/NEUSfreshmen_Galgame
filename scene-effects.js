import {createTodoBody,stepTodoPhysics} from './todo-physics.js';
const node=(tag,className,text)=>{const element=document.createElement(tag);element.className=className;if(text!==undefined)element.textContent=text;return element;};
const courseIntroDuration=3500,courseTextDuration=4200;
const warningIcon='<svg viewBox="0 0 100 91" focusable="false" aria-hidden="true"><path d="M50 4 98 87.14H2Z" fill="#ffe16a" stroke="#bc8431" stroke-width="3" stroke-linejoin="round"/><path d="M46 33h8l-1 27h-6Z" fill="#d83c46"/><circle cx="50" cy="69" r="4.5" fill="#d83c46"/></svg>';
const courseWords={
 math:['(x²)′ = 2x','lim x→0','∫ f(x) dx','Δx → 0','y = f(x)','(sin x)′ = cos x','dy / dx','∫ x dx','连续 · 可导','极限存在吗？','求导法则','f′(x)','ε > 0','高等数学','洛必达法则','∫₀¹ x dx = ½','微分中值定理','(eˣ)′ = eˣ','dx → 0','泰勒公式','无穷小量','f″(x)','定积分','不定积分 + C','分部积分','单调性','凹凸性','收敛还是发散？'],
 matrix:['[ 1 0 ; 0 1 ]','A · B ≠ B · A','det(A)','矩阵相乘','Ax = b','λI − A','线性相关？','rank(A)','初等行变换','[ a₁ a₂ a₃ ]','逆矩阵 A⁻¹','向量空间','特征值 λ','齐次方程组','Aᵀ','行列式展开','正交向量','内积 ⟨u, v⟩','线性无关','基础解系','单位矩阵 I','矩阵的秩','特征向量','A + B','高斯消元','对角矩阵','线性组合','维数 dim V'],
 english:['Could you repeat that?','assignment','Take notes.','vocabulary','Unit 1','Listen carefully.','presentation','What does it mean?','paragraph','deadline','Read aloud.','How do you spell it?','grammar','One more time?','Turn to page 20.','Work in pairs.','pronunciation','Fill in the blanks.','comprehension','Keep practicing.','topic sentence','discussion','due tomorrow','Give an example.','translation','essay writing','Check your answers.','Any questions?'],
};

class CourseWords{
 constructor(container,dialogue){
  this.dialogue=dialogue;this.layer=node('div','course-words hidden');container.append(this.layer);
  this.layer.setAttribute('aria-hidden','true');this.bodies=[];
  this.measure=()=>{
   if(!this.active)return;
   const previousWidth=this.width,previousHeight=this.height;
   this.height=Math.max(0,dialogue.getBoundingClientRect().top-14);this.layer.style.height=this.height+'px';this.width=this.layer.clientWidth;
   for(const body of this.bodies){
    const oldX=Math.max(1,(previousWidth||this.width)-body.width-16),oldY=Math.max(1,(previousHeight||this.height)-body.height-16);
    const u=body.x===undefined?Math.random():(body.x-8)/oldX,v=body.y===undefined?Math.random():(body.y-8)/oldY;
    body.width=body.element.offsetWidth;body.height=body.element.offsetHeight;
    const spaceX=Math.max(0,this.width-body.width-16),spaceY=Math.max(0,this.height-body.height-16);
    body.x=8+Math.max(0,Math.min(1,u))*spaceX;body.y=8+Math.max(0,Math.min(1,v))*spaceY;
   }
   this.paint();
  };
  this.observer=new ResizeObserver(this.measure);this.observer.observe(dialogue);window.addEventListener('resize',this.measure);
 }
 set(effect,reduced=false){
  this.clear();this.active=!!courseWords[effect];this.reduced=reduced;this.layer.classList.toggle('hidden',!this.active);
  if(!this.active)return;
  courseWords[effect].forEach((text,index)=>{
   const word=node('span','course-word'),copy=node('span','course-word-copy',text);word.append(copy);
   word.style.setProperty('--word-duration',(6+Math.random()*4)+'s');word.style.setProperty('--word-delay',(-Math.random()*10)+'s');
   word.style.setProperty('--word-appear',index*45+'ms');word.style.setProperty('--word-tilt',(Math.random()-.5)*6+'deg');
   this.layer.append(word);
   const angle=Math.random()*Math.PI*2,speed=9+Math.random()*3;
   this.bodies.push({element:word,width:0,height:0,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed});
  });
  this.measure();this.run();
 }
 paint(){for(const body of this.bodies)body.element.style.transform=`translate3d(${body.x.toFixed(2)}px,${body.y.toFixed(2)}px,0)`;}
 run(){
  if(this.frame||!this.active||this.paused||this.reduced)return;
  this.lastTime=performance.now();
  const step=now=>{
   this.frame=null;if(!this.active||this.paused||this.reduced)return;
   const dt=Math.min(.05,(now-this.lastTime)/1000);this.lastTime=now;
   for(const body of this.bodies){
    body.x+=body.vx*dt;body.y+=body.vy*dt;
    const right=Math.max(8,this.width-body.width-8),bottom=Math.max(8,this.height-body.height-8);
    if(body.x<8||body.x>right){body.x=Math.max(8,Math.min(right,body.x));body.vx*=-1;}
    if(body.y<8||body.y>bottom){body.y=Math.max(8,Math.min(bottom,body.y));body.vy*=-1;}
   }
   this.paint();this.frame=requestAnimationFrame(step);
  };
  this.frame=requestAnimationFrame(step);
 }
 setReduced(value){this.reduced=value;cancelAnimationFrame(this.frame);this.frame=null;if(!value)this.run();}
 pause(value){this.paused=value;this.layer.classList.toggle('effect-paused',value);cancelAnimationFrame(this.frame);this.frame=null;if(!value)this.run();}
 clear(){cancelAnimationFrame(this.frame);this.frame=null;this.active=false;this.bodies=[];this.layer.replaceChildren();this.layer.classList.add('hidden');}
}

export class TodoList{
 constructor(onChange,onCue=()=>{}){this.onChange=onChange;this.onCue=onCue;this.target=0;this.count=0;this.paused=false;}
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
   this.onCue('todo');
   this.container.scrollTop=this.container.scrollHeight;
   if(!this.reduced)break;
  }
  if(this.count<this.target)this.timer=setTimeout(()=>this.tick(),280);
 }
}

export class FallingTodos{
 constructor(container,dialogue,todos,onCue){
  this.onCue=onCue;
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
   this.accumulator+=dt;while(this.accumulator>=1/120){const impact=stepTodoPhysics(this.bodies,this.width,this.floor,1/120);if(impact>160&&now-(this.lastImpact||0)>160){this.onCue?.('bounce',{strength:Math.min(.8,impact/900),variant:Math.round(Math.random()*10)-5});this.lastImpact=now;}this.accumulator-=1/120;}
   this.paint();
   const moving=this.bodies.some(body=>Math.abs(body.vy)>10||Math.abs(body.vx)>5||Math.abs(body.omega)>.08);
   this.restFrames=moving?0:this.restFrames+1;
   if(this.bodies.length<this.target||(this.restFrames<90&&this.sinceSpawn<14))this.frame=requestAnimationFrame(step);
  };
  this.frame=requestAnimationFrame(step);
 }
}

export class SceneEffects{
 constructor(overlay,pile,dialogue,todos,onFinished,decoration,onCue){
  this.overlay=overlay;this.heading=overlay.querySelector('[data-cinematic-title]');this.note=overlay.querySelector('[data-cinematic-note]');
  this.warnings=node('div','course-warning-signs');this.warnings.setAttribute('aria-hidden','true');overlay.prepend(this.warnings);
  overlay.style.setProperty('--course-intro',courseIntroDuration+'ms');
  window.addEventListener('resize',()=>{if(this.effect==='course-warning'&&this.playing)this.renderWarnings(courseIntroDuration+courseTextDuration-this.remaining+(this.paused?0:performance.now()-this.startedAt));});
  this.pile=new FallingTodos(pile,dialogue,todos,onCue);this.words=new CourseWords(decoration,dialogue);this.onFinished=onFinished;this.key=null;this.playing=false;
 }
 get cinematic(){return ['binding','welcome','course-warning'].includes(this.effect);}
 get busy(){return this.playing;}
 clear(){clearTimeout(this.timer);this.timer=null;this.key=null;this.effect=null;this.playing=false;this.overlay.className='cinematic-overlay hidden';this.warnings.replaceChildren();this.pile.clear();this.words.clear();document.body.classList.remove('cinematic-scene');}
 renderWarnings(elapsed=0){
  const width=this.overlay.clientWidth,height=this.overlay.clientHeight;
  const size=Math.max(120,Math.min(190,Math.min(width,height)*.22));
  const count=Math.max(20,Math.ceil(width*height/(size*size)*2.1)),fragment=document.createDocumentFragment();
  const delays=[0,...Array.from({length:count-2},()=>Math.random()*2800),2800].sort((a,b)=>a-b);
  for(let index=0;index<count;index++){
   const sign=node('span','course-warning-sign');sign.innerHTML=warningIcon;
   // Independent positions intentionally allow clusters, gaps and overlapping signs.
   sign.style.left=Math.random()*100+'%';sign.style.top=Math.random()*100+'%';
   sign.style.width=size*(.65+Math.random()*.95)+'px';sign.style.rotate=(Math.random()-.5)*28+'deg';
   sign.style.setProperty('--warning-delay',(delays[index]-elapsed)+'ms');fragment.append(sign);
  }
  this.warnings.replaceChildren(fragment);
 }
 set(scene,name,reduced){
  this.pile.set(scene.effect==='overload'?scene.overflowCount||12:0,reduced);
  if(scene.id===this.key&&this.effect===scene.effect)return;
  clearTimeout(this.timer);this.timer=null;this.key=scene.id;this.effect=scene.effect;this.playing=false;
  this.words.set(scene.effect,reduced);
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
