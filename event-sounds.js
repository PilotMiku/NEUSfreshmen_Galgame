const tone=(at,duration,frequency,end=frequency,type='sine',level=.2)=>({at,duration,frequency,end,type,level});
const noise=(at,duration,frequency=1200,level=.12)=>({at,duration,frequency,type:'noise',level});
export const cueNames=['page','travel','arrival','photo','send','receive','typing','erase','glitch','heartbeat','binding','welcome','march','rest','practice','rain','farewell','choice','alarm','math','matrix','english','overload','todo','bounce','bicycle','person','live','help','check','ending'];
export function cueScore(name,variant=0){
 const pitch=2**(variant/48),bell=(at,f)=>tone(at,.25,f*pitch,f*pitch,'sine',.16);
 switch(name){
  case 'alarm':return [...Array.from({length:7},(_,i)=>tone(i*.44,.3,i%2?980:620,i%2?620:980,'triangle',.2)),tone(3.5,.45,125,45,'sine',.24),noise(3.5,.18,800,.12)];
  case 'travel':return [noise(0,.7,550,.12),...Array.from({length:4},(_,i)=>tone(i*.17,.09,85,45,'triangle',.12))];
  case 'arrival':return [bell(0,523),bell(.13,659),bell(.27,784)];
  case 'photo':return [noise(0,.045,2400,.25),tone(.02,.05,180,70,'triangle',.2),noise(.08,.04,1700,.13)];
  case 'send':return [tone(0,.16,420,920,'sine',.19),noise(0,.12,1800,.04)];
  case 'receive':return [bell(0,880),bell(.12,1175)];
  case 'typing':return [noise(0,.025,1800,.08),noise(.075,.025,1600,.06)];
  case 'erase':return [noise(0,.12,650,.08),tone(0,.13,300,180,'triangle',.05)];
  case 'glitch':return [noise(0,.12,2200,.13),tone(.03,.09,185,80,'sawtooth',.06),noise(.19,.08,3200,.1)];
  case 'heartbeat':return [tone(0,.14,65,42,'sine',.3),tone(.22,.1,80,48,'sine',.22),tone(.7,.14,65,42,'sine',.25),tone(.92,.1,80,48,'sine',.18)];
  case 'binding':return [bell(0,440),bell(.16,554),bell(.32,659),tone(.5,.7,880,880,'sine',.12)];
  case 'welcome':return [bell(0,659),bell(.16,784),bell(.32,1047),tone(.32,.8,523,523,'sine',.08)];
  case 'march':return [0,.26,.52,.78].flatMap(at=>[noise(at,.055,700,.09),tone(at,.11,120,55,'triangle',.2)]);
  case 'rest':return [tone(0,.35,600,280,'sine',.14),noise(.05,.4,800,.04)];
  case 'practice':return [noise(0,.07,1100,.13),tone(.07,.1,180,90,'triangle',.18),bell(.22,660)];
  case 'rain':return [noise(0,1.1,2400,.1),...Array.from({length:6},(_,i)=>tone(i*.13,.045,1400+i*130,700,'sine',.035))];
  case 'farewell':return [bell(0,659),bell(.22,554),tone(.44,.8,440,440,'sine',.12)];
  case 'choice':return [bell(0,698),bell(.1,932)];
  case 'math':return [noise(0,.28,1900,.1),bell(.12,740),bell(.28,554)];
  case 'matrix':return [tone(0,.12,262,262,'triangle',.17),tone(.13,.12,330,330,'triangle',.17),tone(.26,.18,392,392,'triangle',.17),tone(.4,.18,294,294,'triangle',.12)];
  case 'english':return [noise(0,.22,1100,.11),bell(.15,587),bell(.31,880)];
  case 'overload':return [0,.1,.19,.27].map((at,i)=>tone(at,.07,350+i*110,300+i*110,'triangle',.12));
  case 'todo':return [tone(0,.065,620*pitch,850*pitch,'sine',.1)];
  case 'bounce':return [tone(0,.17,170*pitch,50*pitch,'sine',.24),noise(0,.04,450,.08)];
  case 'bicycle':return [tone(0,.45,1760,1760,'sine',.12),tone(.03,.4,2370,2370,'sine',.07)];
  case 'person':return [bell(0,440),bell(.11,440*pitch*1.25)];
  case 'live':return [tone(0,.4,392,392,'sine',.12),tone(.15,.5,587,587,'sine',.08)];
  case 'help':return [bell(0,523),tone(.18,.6,659,659,'sine',.1)];
  case 'check':return [bell(0,784),bell(.09,1047),noise(0,.06,1700,.045)];
  case 'ending':return [bell(0,523),bell(.2,659),bell(.4,784),tone(.6,1.1,1047,1047,'sine',.1)];
  default:return [noise(0,.12,1050+variant*20,.065),tone(.04,.055,480*pitch,380*pitch,'sine',.035)];
 }
}
const sceneCues={s0:'travel',s3:'arrival',s5:'send',s6:'glitch',s7:'heartbeat',s8:'binding',s9:'welcome','opening-ceremony':'march',s12:'march','training-break':'rest','training-practice':'practice','training-evening':'person',s13:'receive',s14:'rain',s17:'arrival','training-last-day':'farewell',s18:'farewell',farewell:'choice',cry:'farewell',ready:'welcome',courses:'alarm',s25:'math',s26:'matrix',s27:'english',s28:'glitch',s30:'todo',s31:'overload',s32:'overload',s33:'overload',s34:'heartbeat',s37:'bicycle',s53:'rest',s55:'heartbeat','new-difficulties':'rest','recall-lead':'rest','mao-encouragement':'help','ask-for-help':'help',s83:'welcome',s85:'ending',s86:'ending'};
export function sceneCue(scene){if(['family','notifications','classMeeting','friend','partner','kfc','resolved'].includes(scene.phone))return null;return sceneCues[scene.id]||(scene.kind==='live'?'live':scene.spoken?'person':'page');}
export function renderCue(ctx,destination,name,{variant=0,strength=1,onVoice=()=>{}}={}){
 const sources=[];
 for(const note of cueScore(name,variant)){
  const start=ctx.currentTime+note.at,gain=ctx.createGain();let source;
  if(note.type==='noise'){
   source=ctx.createBufferSource();const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*note.duration),ctx.sampleRate),data=buffer.getChannelData(0);
   for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;source.buffer=buffer;
   const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=note.frequency;source.connect(filter);filter.connect(gain);source.onended=()=>filter.disconnect();
  }else{source=ctx.createOscillator();source.type=note.type;source.frequency.setValueAtTime(note.frequency,start);source.frequency.exponentialRampToValueAtTime(note.end,start+note.duration);source.connect(gain);}
  const level=Math.max(.0001,note.level*Math.min(1,Math.max(0,strength)));gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(level,start+Math.min(.008,note.duration/4));gain.gain.exponentialRampToValueAtTime(.0001,start+note.duration);gain.connect(destination);
  const ended=source.onended;source.onended=()=>{ended?.();source.disconnect();gain.disconnect();};onVoice(source);sources.push(source);source.start(start);source.stop(start+note.duration+.01);
 }
 return sources;
}
export class EventSounds{
 constructor(){this.enabled=false;this.volume=.65;this.paused=false;this.voices=new Set();this.last=new Map();}
 attach(ctx){if(this.ctx)return;this.ctx=ctx;this.master=ctx.createGain();this.master.gain.value=this.volume*.3;this.master.connect(ctx.destination);}
 setEnabled(value){this.enabled=value;if(!value)this.stop();}
 setVolume(value){this.volume=value;if(this.master)this.master.gain.setTargetAtTime(value*.3,this.ctx.currentTime,.025);}
 pause(value){this.paused=value;if(value)this.stop();}
 stop(){for(const source of this.voices){try{source.stop();}catch{}}this.voices.clear();}
 play(name,options={}){
  if(!name||!this.enabled||this.paused||!this.ctx||this.ctx.state!=='running'||document.hidden)return;
  const now=this.ctx.currentTime,spacing=name==='bounce'?.15:name==='todo'?.05:.035;if(now-(this.last.get(name)??-10)<spacing)return;this.last.set(name,now);
  renderCue(this.ctx,this.master,name,{...options,onVoice:source=>{this.voices.add(source);source.addEventListener('ended',()=>this.voices.delete(source),{once:true});}});
 }
 enter(scene){this.stop();const variant=Array.from(scene.id).reduce((sum,char)=>sum+char.charCodeAt(0),0)%13-6;this.play(sceneCue(scene),{variant});}
}
