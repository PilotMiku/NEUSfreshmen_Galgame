const node=(tag,className,text)=>{const element=document.createElement(tag);element.className=className;if(text!==undefined)element.textContent=text;return element;};

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
  this.bodies.push({element,x:(this.width-spread)/2+column*(this.cardWidth+6)+(index%3-1)*7,y:-this.cardHeight-20,vx:(index%3-1)*14,vy:0,angle:(index%5-2)*1.5});
 }
 settle(){
  const columns=Math.max(1,Math.min(3,Math.floor((this.width-24)/(this.cardWidth+8))));
  const left=(this.width-columns*(this.cardWidth+6))/2;
  this.bodies.forEach((body,index)=>{body.x=left+(index%columns)*(this.cardWidth+6);body.y=this.floor-this.cardHeight*(Math.floor(index/columns)+1)-2;body.vx=0;body.vy=0;});this.paint();
 }
 paint(){for(const body of this.bodies)body.element.style.transform=`translate(${body.x.toFixed(1)}px,${body.y.toFixed(1)}px) rotate(${body.angle}deg)`;}
 run(){
  if(this.frame||this.paused||!this.active||this.reduced)return;
  this.lastTime=performance.now();this.spawnTime=0;this.restFrames=0;
  const step=now=>{
   this.frame=null;if(this.paused||!this.active||this.reduced)return;
   const dt=Math.min(.025,(now-this.lastTime)/1000);this.lastTime=now;this.spawnTime+=dt;
   if(this.bodies.length<this.target&&this.spawnTime>.18){this.spawn();this.spawnTime=0;}
   for(const body of this.bodies){body.vy+=1050*dt;body.x+=body.vx*dt;body.y+=body.vy*dt;}
   for(let pass=0;pass<5;pass++){
    for(let i=0;i<this.bodies.length;i++)for(let j=i+1;j<this.bodies.length;j++){
     const a=this.bodies[i],b=this.bodies[j],overlapX=Math.min(a.x+this.cardWidth,b.x+this.cardWidth)-Math.max(a.x,b.x),overlapY=Math.min(a.y+this.cardHeight,b.y+this.cardHeight)-Math.max(a.y,b.y);
     if(overlapX<=0||overlapY<=0)continue;
     if(overlapX<overlapY&&overlapX<25){const shift=overlapX/2+.1;if(a.x<b.x){a.x-=shift;b.x+=shift;}else{a.x+=shift;b.x-=shift;}a.vx*=.7;b.vx*=.7;}
     else{const top=a.y<=b.y?a:b,bottom=top===a?b:a;if(bottom.y+this.cardHeight>=this.floor-2){top.y-=overlapY+.1;top.vy=Math.min(0,top.vy)*.2;}else{top.y-=overlapY*.55;bottom.y+=overlapY*.45;const speed=Math.max(0,Math.min(top.vy,bottom.vy));top.vy=speed;bottom.vy=speed;}top.vx*=.94;}
    }
    for(const body of this.bodies){
     if(body.x<10){body.x=10;body.vx=Math.abs(body.vx)*.3;}if(body.x+this.cardWidth>this.width-10){body.x=this.width-this.cardWidth-10;body.vx=-Math.abs(body.vx)*.3;}
     if(body.y+this.cardHeight>this.floor-2){body.y=this.floor-this.cardHeight-2;body.vy=Math.abs(body.vy)<25?0:-body.vy*.1;body.vx*=.8;}
    }
   }
   this.paint();
   const moving=this.bodies.some(body=>Math.abs(body.vy)>10||Math.abs(body.vx)>2);
   this.restFrames=moving?0:this.restFrames+1;
   if(this.bodies.length<this.target||this.restFrames<45)this.frame=requestAnimationFrame(step);
  };
  this.frame=requestAnimationFrame(step);
 }
}

export class SceneEffects{
 constructor(overlay,pile,dialogue,todos,onFinished){
  this.overlay=overlay;this.heading=overlay.querySelector('[data-cinematic-title]');this.note=overlay.querySelector('[data-cinematic-note]');
  this.pile=new FallingTodos(pile,dialogue,todos);this.onFinished=onFinished;this.key=null;this.playing=false;
 }
 get cinematic(){return ['binding','welcome','course-warning'].includes(this.effect);}
 get busy(){return this.playing;}
 clear(){clearTimeout(this.timer);this.timer=null;this.key=null;this.effect=null;this.playing=false;this.overlay.className='cinematic-overlay hidden';this.pile.clear();document.body.classList.remove('cinematic-scene');}
 set(scene,name,reduced){
  this.pile.set(scene.effect==='overload'?scene.overflowCount||12:0,reduced);
  if(scene.id===this.key&&this.effect===scene.effect)return;
  clearTimeout(this.timer);this.timer=null;this.key=scene.id;this.effect=scene.effect;this.playing=false;
  this.overlay.className='cinematic-overlay hidden';document.body.classList.toggle('cinematic-scene',this.cinematic);
  if(!this.cinematic)return;
  const title=(scene.cinematicTitle||scene.text).replaceAll('{name}',name);
  this.heading.replaceChildren();Array.from(title).forEach((letter,index)=>{const span=node('span','cinematic-letter',letter);span.style.setProperty('--letter-index',index);this.heading.append(span);});
  this.note.textContent=scene.cinematicNote||'';
  this.overlay.className='cinematic-overlay '+scene.effect+(reduced?' finished':'');
  this.overlay.classList.toggle('effect-paused',!!this.paused);
  if(reduced)return;
  this.playing=true;this.remaining=scene.effect==='course-warning'?4200:Math.max(1900,title.length*140+650);this.resumeTimer();
 }
 resumeTimer(){if(!this.playing||this.paused)return;this.startedAt=performance.now();this.timer=setTimeout(()=>this.finish(),this.remaining);}
 finish(){if(!this.playing)return false;clearTimeout(this.timer);this.timer=null;this.playing=false;this.overlay.classList.add('finished');this.onFinished();return true;}
 pause(value){
  if(this.paused===value)return;this.paused=value;this.pile.pause(value);this.overlay.classList.toggle('effect-paused',value);
  if(value){if(this.timer){clearTimeout(this.timer);this.timer=null;this.remaining=Math.max(0,this.remaining-(performance.now()-this.startedAt));}}
  else this.resumeTimer();
 }
}
