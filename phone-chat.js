const element=(tag,className,text)=>{const node=document.createElement(tag);node.className=className;if(text!==undefined)node.textContent=text;return node;};
export const chatKinds=new Set(['family','notifications','classMeeting','friend','partner','kfc']);
export class PhoneChat{
 constructor(phone,content,title,onCue,onFinished,renderPhotos){Object.assign(this,{phone,content,title,onCue,onFinished,renderPhotos});this.tasks=[];this.paused=false;}
 get busy(){return this.active&&!!(this.task||this.tasks.length);}
 clear(){clearTimeout(this.timer);this.timer=null;this.task=null;this.tasks=[];this.active=false;this.composer?.remove();this.phone.classList.remove('chat-phone','chat-paused');}
 pause(value){
  if(this.paused===value)return;this.paused=value;this.phone.classList.toggle('chat-paused',value);
  if(value&&this.timer){clearTimeout(this.timer);this.timer=null;this.remaining=Math.max(0,this.remaining-(performance.now()-this.started));}
  if(!value)this.run();
 }
 cue(name){if(!this.flushing)this.onCue(name);}
 queue(delay,action){this.tasks.push({delay,action});}
 run(){
  if(!this.active||this.paused||this.timer)return;
  if(!this.task){this.task=this.tasks.shift();if(!this.task){this.onFinished();return;}this.remaining=this.task.delay;}
  this.started=performance.now();this.timer=setTimeout(()=>{this.timer=null;const task=this.task;this.task=null;task.action();this.scroll();this.run();},this.remaining);
 }
 finish(){
  if(!this.active)return;clearTimeout(this.timer);this.timer=null;this.flushing=true;
  if(this.task){const task=this.task;this.task=null;task.action();}
  while(this.tasks.length)this.tasks.shift().action();this.flushing=false;this.scroll();this.onFinished();
 }
 scroll(){this.content.scrollTop=this.content.scrollHeight;}
 row(name,text,out=false){
  const row=element('div','chat-row'+(out?' outgoing':'')),avatar=element('span','chat-avatar',out?'我':name.slice(0,1)),copy=element('div','chat-message');
  if(!out)copy.append(element('small','chat-sender',name));const bubble=element('div','chat-bubble',text);copy.append(bubble);
  if(out){const status=element('small','chat-delivery','发送中');copy.append(status);this.delivery=status;}
  row.append(avatar,copy);this.thread.append(row);return bubble;
 }
 send(text){
  this.queue(400,()=>{this.composer.classList.add('is-writing');this.status.textContent='正在输入';this.cue('typing');});
  Array.from(text).forEach((_,index)=>this.queue(90,()=>{this.draft.textContent=Array.from(text).slice(0,index+1).join('');}));
  this.queue(320,()=>{this.row('我',text,true);this.draft.textContent='';this.composer.classList.remove('is-writing');this.status.textContent='发送中…';this.cue('send');});
  this.queue(320,()=>{this.delivery.textContent='已送达';this.status.textContent='发送';});
 }
 receive(name,text){
  let indicator;this.queue(450,()=>{indicator=this.row(name,'');indicator.classList.add('chat-typing');for(let i=0;i<3;i++)indicator.append(element('i',''));this.subtitle.textContent=name+'正在输入…';});
  this.queue(1000,()=>{indicator.closest('.chat-row').remove();this.row(name,text);this.subtitle.textContent=this.subtitleText;this.cue('receive');});
 }
 set(kind,reduced){
  this.clear();this.active=true;this.phone.classList.add('chat-phone');this.phone.classList.toggle('chat-paused',this.paused);this.content.replaceChildren();
  this.title.textContent={family:'幸福一家人',notifications:'班级通知 · 99+',classMeeting:'班级群',friend:'朋友',partner:'班级群',kfc:'班级群'}[kind];
  this.subtitleText=kind==='family'?'家里的消息':kind==='friend'?'凌晨 00:47':'群聊';this.subtitle=element('div','chat-subtitle',this.subtitleText);this.thread=element('div','chat-thread');
  this.content.append(this.subtitle,element('div','phone-time',kind==='friend'?'今天 00:47':'今天 09:41'),this.thread);
  this.composer=element('div','chat-compose');const voice=element('span','chat-voice','◉');this.draft=element('div','chat-draft');this.draft.dataset.placeholder='发消息…';this.draft.setAttribute('role','textbox');this.draft.setAttribute('aria-readonly','true');this.draft.setAttribute('aria-label','剧情中的消息输入框');this.status=element('span','chat-send','发送');
  this.composer.append(voice,this.draft,this.status);this.phone.insertBefore(this.composer,this.phone.querySelector('.phone-home'));
  if(kind==='family'){
   this.send('我到学校啦，已经找到宿舍了。');this.queue(320,()=>{const bubble=this.row('我','',true);bubble.classList.add('chat-photos');this.renderPhotos(bubble);this.delivery.textContent='已送达';this.cue('send');});this.receive('家里人','到了就好，记得吃饭。');
  }else if(kind==='notifications'){
   this.receive('学生会','同学们，记得提交材料。');this.receive('班委会','收到请回复。');this.receive('社团通知','明晚活动，大家别忘了。');this.send('收到');this.send('收');this.send('👌');
  }else if(kind==='classMeeting'){
   this.receive('班长','今晚心理班会，都来啊。');this.receive('心理委员','心理班会 · 随便坐。');
  }else if(kind==='friend'){
   const draft='在吗……';this.queue(400,()=>{this.composer.classList.add('is-writing');this.cue('typing');});
   Array.from(draft).forEach((_,index)=>this.queue(160,()=>{this.draft.textContent=Array.from(draft).slice(0,index+1).join('');}));
   this.queue(1000,()=>this.cue('erase'));Array.from(draft).forEach((_,index)=>this.queue(110,()=>{this.draft.textContent=Array.from(draft).slice(0,draft.length-index-1).join('');}));
   this.queue(100,()=>{this.composer.classList.remove('is-writing');this.draft.dataset.placeholder='打了，又删掉了。';});
  }else if(kind==='partner'){
   this.send('有没有高数搭子？');this.queue(350,()=>{this.thread.append(element('div','phone-warn','防诈提醒：不转账、不点链接、不交押金。'));this.cue('receive');});
  }else if(kind==='kfc'){this.send('班长V我50吃KFC');this.receive('班长','先一起吃顿饭？');}
  if(reduced)this.finish();else this.run();
 }
}
