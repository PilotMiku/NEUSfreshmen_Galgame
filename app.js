import {story,chapters,characters,backgrounds,todos,nextIndex,validSave,normalizeSave} from './story.js';
import {Soundtrack} from './audio.js';
import {PortraitLayer} from './portraits.js';
import {albums,PhotoViewer} from './albums.js';
import {TodoList,SceneEffects} from './scene-effects.js';
import {PhoneChat,chatKinds} from './phone-chat.js';
import {ResolvedTodos} from './resolved-todos.js';
import {BackgroundTransition} from './background-transition.js';
import {defaultAssets} from './assets-default.js';
import {fetchManifest,backgroundSource,loadImage,preloadImage} from './asset-loader.js';
const $=id=>document.getElementById(id),sound=new Soundtrack(),KEY='xinsheng.v1';
const portraits=new PortraitLayer($('character'),$('character-image'),$('character-tag'),$('dialogue'));
const phoneTodos=new TodoList(count=>{$('phone-title').textContent='待办事项 · '+count;},name=>sound.cue(name));
const resolvedTodos=new ResolvedTodos(name=>sound.cue(name));
const effects=new SceneEffects($('cinematic'),$('todo-rain'),$('dialogue'),todos,()=>scheduleAuto(),$('scene-decoration'),(name,options)=>sound.cue(name,options));
const gallery=new PhotoViewer($('photo-viewer'),()=>{clearTimeout(autoTimer);clearTimeout(slideshowTimer);slideshowTimer=null;slideshowPlayedFor=story[state.index].id;effects.pause(true);phoneTodos.pause(true);resolvedTodos.pause(true);chat.pause(true);sound.events.stop();},()=>{syncPauses();scheduleAuto();},()=>sound.cue('photo'));
const chat=new PhoneChat($('phone'),$('phone-content'),$('phone-title'),name=>sound.cue(name),()=>scheduleAuto(),container=>gallery.renderAlbum('family',container,assets));
let storeAvailable=true;
const storage={get(key,fallback=null){try{const v=localStorage.getItem(KEY+'.'+key);if(v===null)return fallback;const value=JSON.parse(v);return key==='auto'||/^slot[123]$/.test(key)?normalizeSave(value)||fallback:value;}catch{return fallback;}},set(key,value){try{localStorage.setItem(KEY+'.'+key,JSON.stringify(value));return true;}catch{storeAvailable=false;return false;}}};
let settings={speed:32,volume:.35,effectsVolume:.65,font:21,mode:'solo',sound:true,motion:matchMedia('(prefers-reduced-motion: reduce)').matches};
const savedSettings=storage.get('settings',{});
if(savedSettings&&typeof savedSettings==='object'){
for(const k of ['speed','volume','effectsVolume','font'])if(typeof savedSettings[k]==='number'&&Number.isFinite(savedSettings[k]))settings[k]=Math.max(k==='font'?17:0,Math.min(['volume','effectsVolume'].includes(k)?1:k==='font'?27:65,savedSettings[k]));
if(['solo','live'].includes(savedSettings.mode))settings.mode=savedSettings.mode;
for(const k of ['sound','motion'])if(typeof savedSettings[k]==='boolean')settings[k]=savedSettings[k];
}
let state={version:2,index:0,name:'同学',trail:[],branch:null,notes:{},date:''};
let screen='home',auto=false,pure=false,typing=false,typeTimer,autoTimer,toastTimer,fullText='',assets={...defaultAssets},activeBg='';
let slideshowPlayedFor=null,slideshowTimer=null,phoneKind=null;
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2600);}
function applySettings(){document.documentElement.style.setProperty('--dialogue-size',settings.font+'px');document.body.classList.toggle('motion-reduced',settings.motion);$('sound').classList.toggle('sound-on',settings.sound);$('sound').setAttribute('aria-label',settings.sound?'关闭声音':'开启声音');sound.setVolume(settings.volume);sound.events.setVolume(settings.effectsVolume);sound.setEnabled(settings.sound);if(screen==='game'){effects.words.setReduced(settings.motion);if(settings.motion){effects.finish();chat.finish();}effects.pile.set(story[state.index].overflowCount||0,settings.motion);phoneTodos.reduced=settings.motion;phoneTodos.tick();resolvedTodos.setReduced(settings.motion);}}
function persistSettings(){storage.set('settings',settings);applySettings();}
function cleanTimers(){clearInterval(typeTimer);clearTimeout(autoTimer);clearTimeout(slideshowTimer);slideshowTimer=null;typing=false;}
function snapshot(){return {...state,version:2,sceneId:story[state.index].id,trail:[...state.trail],trailIds:state.trail.map(index=>story[index].id),notes:{...state.notes},date:new Date().toISOString()};}
function autoSave(){storage.set('auto',snapshot());$('continue').disabled=false;}
const backgroundTransition=new BackgroundTransition($('background'));
let backgroundRequest,backgroundKey='xiaomen',manifestLoading=false;
const assetIssues=new Map();
function assetStatus(){
 const messages=[...assetIssues.values()];
 $('asset-status').hidden=!messages.length;
 $('asset-message').textContent=messages.join('；');
 $('asset-retry').hidden=!assetIssues.has('manifest')&&!assetIssues.has('background');
}
async function background(name,force=false){
 const key=backgrounds[name]||backgroundKey;
 backgroundKey=key;
 const small=matchMedia('(max-width:760px)').matches||navigator.connection?.saveData;
 const src=backgroundSource(key,assets,small);
 if(!force&&activeBg===src)return;
 activeBg=src;backgroundRequest?.abort();
 const request=new AbortController();backgroundRequest=request;
 assetIssues.delete('background');assetStatus();
 try{
  await loadImage(src,{signal:request.signal});
  if(request.signal.aborted)return;
  await backgroundTransition.show(src,{signal:request.signal,reduced:settings.motion});
 }catch(error){
  if(request.signal.aborted)return;
  // Keep a local, location-specific card available even when the photograph fails.
  await backgroundTransition.show('assets/'+key+'.svg',{signal:request.signal,reduced:settings.motion});
  if(request.signal.aborted)return;
  assetIssues.set('background','背景暂未加载，已显示备用画面');assetStatus();
 }
}
function preloadNextBackground(){
 if(navigator.connection?.saveData)return;
 const current=story[state.index];
 let index=state.index;
 for(let steps=0;steps<story.length;steps++){
  index=nextIndex(index);
  if(index===null)return;
  const scene=story[index];
  if(scene.bg!==current.bg){preloadImage(backgroundSource(backgrounds[scene.bg],assets,matchMedia('(max-width:760px)').matches));return;}
 }
}
async function refreshAssets(){
 if(manifestLoading)return;
 manifestLoading=true;
 assetIssues.set('loading','正在加载素材信息…');assetStatus();
 try{
  let manifest;
  for(let attempt=0;attempt<2;attempt++){
   try{manifest=await fetchManifest();break;}catch(error){if(attempt===1)throw error;}
  }
  assets={...defaultAssets,...manifest};sound.assetMap=assets;
  assetIssues.delete('manifest');
  background(screen==='home'?'校门':screen==='ending'?'文管门口':story[state.index].bg,true);
  if(screen==='game'){
   const scene=story[state.index];renderPortrait(scene);
   // Refresh previews too if the game began before the latest manifest arrived.
   if(albums[scene.phone]&&!chatKinds.has(scene.phone))renderPhone(scene.phone,scene);
   if(gallery.open){gallery.assets=assets;gallery.render();}
  }
 }catch{
  assetIssues.set('manifest','素材信息暂未更新，仍可继续游戏');
 }finally{
  manifestLoading=false;assetIssues.delete('loading');assetStatus();
 }
}
function showScreen(next){gallery.close();effects.clear();phoneTodos.clear();resolvedTodos.clear();chat.clear();sound.events.stop();phoneKind=null;portraits.hide();screen=next;for(const id of ['home','game','ending'])$(id).classList.toggle('hidden',id!==next);document.body.classList.toggle('in-game',next==='game');document.body.classList.toggle('ending-screen',next==='ending');document.body.classList.remove('pure','choice-scene','live-scene','blackout','glitch','pixel','has-phone','has-portrait','memory-scene');$('memory-label').classList.add('hidden');pure=false;syncPauses();}
function showHome(){cleanTimers();setAuto(false);showScreen('home');background('校门');sound.play('open');$('top-caption').textContent='新生心理班会 · 互动剧场';$('continue').disabled=!validSave(storage.get('auto'));}
function setAuto(value){auto=value;$('auto').classList.toggle('active',auto);$('auto').setAttribute('aria-pressed',String(auto));$('auto').querySelector('span').textContent=auto?'自动中':'自动';clearTimeout(autoTimer);if(auto&&!typing)scheduleAuto();}
function scheduleAuto(){clearTimeout(autoTimer);if(!auto||screen!=='game'||$('modal').open||gallery.open||slideshowTimer||effects.busy||chat.busy||document.hidden||pure)return;const s=story[state.index];if(['choice','live','end'].includes(s.kind))return;autoTimer=setTimeout(()=>advance(),Math.max(1800,fullText.length*65));}
function syncPauses(){const blocked=screen!=='game'||$('modal').open||document.hidden||pure;effects.pause(blocked||gallery.open);phoneTodos.pause(blocked||gallery.open);resolvedTodos.pause(blocked||gallery.open);chat.pause(blocked||gallery.open);sound.events.pause(screen==='home'||$('modal').open||document.hidden||pure);gallery.pause(blocked);}
function setDialogueText(text){
 const container=$('dialogue-text');container.classList.toggle('emotive-text',text.includes('¯᷄'));container.replaceChildren();let start=0;
 for(const match of text.matchAll(/（[^）]*）/g)){container.append(document.createTextNode(text.slice(start,match.index)),el('span','stage-direction',match[0]));start=match.index+match[0].length;}
 container.append(document.createTextNode(text.slice(start)));
}
function maybeSlideshow(){const scene=story[state.index];if(screen!=='game'||typing||!scene.slideshow||settings.motion||slideshowPlayedFor===scene.id||$('modal').open||document.hidden||pure)return false;slideshowPlayedFor=scene.id;slideshowTimer=setTimeout(()=>{slideshowTimer=null;if(screen==='game'&&story[state.index].id===scene.id&&!$('modal').open&&!document.hidden&&!pure)gallery.show(scene.phone,assets,0,true,scene.text.split('（')[0]);else slideshowPlayedFor=null;},1000);return true;}
function finishText(){clearInterval(typeTimer);setDialogueText(fullText);typing=false;resolvedTodos.complete();if(!maybeSlideshow())scheduleAuto();}
function typeText(text){clearInterval(typeTimer);clearTimeout(autoTimer);fullText=text;$('dialogue-text').classList.toggle('emotive-text',text.includes('¯᷄'));$('dialogue-text').textContent='';if(settings.speed===0||settings.motion){finishText();return;}typing=true;const chars=Array.from(text);let n=0;typeTimer=setInterval(()=>{n++;$('dialogue-text').textContent=chars.slice(0,n).join('');if(n>=chars.length)finishText();},settings.speed);}
function showGame(){showScreen('game');render();}
function renderPortrait(scene){
 const who=scene.character||(scene.spoken&&scene.who!=='我'?scene.who:null);
 const visible=!!who&&!['choice','live','end'].includes(scene.kind);
 document.body.classList.toggle('has-portrait',visible);
 if(!visible){portraits.hide();return;}
 portraits.show(who,characters[who],assets);
}
function render(){
cleanTimers();gallery.close();slideshowPlayedFor=null;const s=story[state.index];if(!s)return;if(s.kind==='end'){showEnding();return;}
for(const [cls,val]of [['choice-scene',s.kind==='choice'],['live-scene',s.kind==='live'],['blackout',s.effect==='blackout'],['glitch',s.effect==='glitch'],['pixel',s.effect==='pixel'],['memory-scene',!!s.memory]])document.body.classList.toggle(cls,val);
$('memory-label').classList.toggle('hidden',!s.memory);
background(s.bg);sound.play(s.music);
const chapter=chapters[s.chapter];$('chapter-number').textContent=String(s.chapter+1).padStart(2,'0');$('chapter-label').textContent=chapter.en;$('chapter-title').textContent=chapter.name;$('location').textContent=s.memory&&s.who==='毛学长'?'教学楼外 · 文管学馆':s.bg;$('top-caption').textContent=state.name+'的大学生活 · '+chapter.name;$('dialogue-context').textContent=s.memory?'回忆 · 教学楼外':chapter.note;
$('speaker').textContent=s.who;$('speaker-note').textContent=s.who==='我'?(s.spoken?'对话':'内心独白'):characters[s.who]?.title||(s.who==='NEU生活模拟器'?'系统消息':'');
const chapterScenes=story.filter(v=>v.chapter===s.chapter);$('scene-count').textContent=String(chapterScenes.indexOf(s)+1).padStart(2,'0')+' / '+String(chapterScenes.length).padStart(2,'0');$('chapter-progress').style.width=((state.index+1)/story.length*100)+'%';
effects.set(s,state.name,settings.motion);
$('simulator').classList.toggle('hidden',!s.sim||effects.cinematic);$('sim-text').textContent=(s.sim||'').replaceAll('{name}',state.name);
renderPortrait(s);
$('scene-decoration').className='scene-decoration '+(s.decoration||s.effect||'');renderPhone(s.phone,s);
$('choice-panel').classList.toggle('hidden',s.kind!=='choice');if(s.kind==='choice'){setAuto(false);$('choices').replaceChildren();s.choices.forEach((c,i)=>{const b=el('button','choice-button');b.append(el('span','',String(i+1).padStart(2,'0')));const copy=el('div');copy.append(el('strong','',c.text),el('small','',c.detail));b.append(copy,el('i','','→'));b.onclick=()=>{state.branch=c.target;advance(i);};$('choices').append(b);});}
$('live-panel').classList.toggle('hidden',s.kind!=='live');if(s.kind==='live'){setAuto(false);$('live-badge').textContent=settings.mode==='live'?'现场模式 · 等待主持人继续':'班会互动';$('live-title').textContent=s.live.title;$('live-prompt').textContent=s.live.prompt;$('live-response').textContent=s.live.response;$('live-response').classList.toggle('hidden',settings.mode==='live');$('live-note').value=state.notes[s.id]||'';$('live-note').placeholder=s.notePlaceholder||'写点什么（可留空，只保存在本机）';$('live-hint').textContent=settings.mode==='live'?(s.liveHint||'分享结束后，由主持人继续。'):'可留空，直接继续。';$('live-next').firstChild.textContent=(s.liveNext||(settings.mode==='live'?'现场分享结束':'继续故事'))+' ';}
$('dialogue').classList.toggle('hidden',['choice','live'].includes(s.kind)||effects.cinematic);
syncPauses();sound.events.enter(s);
if(effects.cinematic){fullText=s.text.replaceAll('{name}',state.name);setDialogueText(fullText);typing=false;scheduleAuto();}
else if(!['choice','live'].includes(s.kind))typeText(s.text.replaceAll('{name}',state.name));else{fullText=s.text;typing=false;}
$('back').disabled=state.trail.length===0;autoSave();preloadNextBackground();requestAnimationFrame(fitSceneLayout);
}
function advance(choice,fromLive=false){if(screen!=='game'||$('modal').open||gallery.open||pure)return;const s=story[state.index];if(s.kind==='live'&&!fromLive)return;if(s.kind==='choice'&&choice===undefined)return;if(typing){finishText();return;}if(chat.busy){chat.finish();return;}if(effects.finish()){sound.events.stop();return;}const next=nextIndex(state.index,choice);if(next===null)return;state.trail.push(state.index);state.index=next;render();if(choice!==undefined)sound.cue('choice');}
function back(){if(screen!=='game'||!state.trail.length)return;setAuto(false);cleanTimers();state.index=state.trail.pop();if(story[state.index].kind==='choice')state.branch=null;render();}
function showEnding(){cleanTimers();setAuto(false);showScreen('ending');background('文管门口');sound.play('shouwei');sound.events.enter(story[state.index]);$('top-caption').textContent='新生心理班会 · 结束';$('ending-memory').textContent=state.branch==='cry'?'后来某天夜里，我突然想起教官喊口令的声音。':'后来某次离别，我发现自己还是会愣一下。';storage.set('completed',true);autoSave();}
function openModal(title,content,eyebrow=''){clearTimeout(autoTimer);if(typing){clearInterval(typeTimer);setDialogueText(fullText);typing=false;resolvedTodos.complete();}$('modal-title').textContent=title;$('modal-eyebrow').textContent=eyebrow;$('modal-body').replaceChildren(content);$('modal').scrollTop=0;if(!$('modal').open)$('modal').showModal();syncPauses();}
function closeModal(){$('modal').close();syncPauses();if(!maybeSlideshow())scheduleAuto();}
function intro(){const wrap=el('div'),copy=el('div','modal-copy');copy.append(el('p','','你是班上的一名普通同学，刚来东北大学报到。'));wrap.append(copy);const label=el('label','form-label','姓名或昵称（可不填）');label.htmlFor='player-name';const input=el('input','name-input');input.id='player-name';input.maxLength=16;input.placeholder='同学';const oldName=storage.get('playerName','');input.value=typeof oldName==='string'?oldName:'';wrap.append(label,input,el('span','form-label','选择游玩方式'));const modes=el('div','mode-options');for(const [value,title,desc]of [['solo','自己读完','独自游玩，查看参考回应'],['live','班会现场','主持人控制分享环节']]){const l=el('label','mode-option'),radio=el('input');radio.type='radio';radio.name='mode';radio.value=value;radio.checked=settings.mode===value;l.append(radio,document.createTextNode(title),el('small','',desc));modes.append(l);}wrap.append(modes);if(validSave(storage.get('auto')))wrap.append(el('p','storage-note','开启后将更新自动存档。手动存档仍可读取。'));const start=el('button','primary-button modal-wide-button','开始游戏');start.onclick=async()=>{state={version:2,index:0,name:input.value.trim().slice(0,16)||'同学',trail:[],branch:null,notes:{},date:''};settings.mode=wrap.querySelector('input[name="mode"]:checked').value;storage.set('playerName',state.name);persistSettings();closeModal();await sound.unlock();showGame();if(!storeAvailable)toast('浏览器限制了存储，本次仍可正常游玩。');};wrap.append(start);openModal('开始之前',wrap,'入学登记');}
function settingsModal(){const wrap=el('div');const range=(name,key,min,max,step,desc)=>{const row=el('div','setting-row'),l=el('label','',name),input=el('input');input.id='setting-'+key;l.htmlFor=input.id;if(desc)l.append(el('small','',desc));input.type='range';input.min=min;input.max=max;input.step=step;input.value=settings[key];input.setAttribute('aria-label',name);input.oninput=()=>{settings[key]=Number(input.value);persistSettings();};row.append(l,input);wrap.append(row);};range('文字速度','speed',0,65,5,'左边更快；最左侧立即显示。');range('文字大小','font',17,27,1,'调整正文大小。');range('音乐音量','volume',0,1,.05,'右上角音符控制所有声音。');range('音效音量','effectsVolume',0,1,.05,'警报、消息、碰撞等事件音效。');const row=el('div','setting-row'),label=el('label','','游玩方式'),select=el('select');select.id='setting-mode';label.htmlFor=select.id;for(const[value,text]of [['solo','单人 · 展示参考回应'],['live','现场 · 等待主持人']]){const op=el('option','',text);op.value=value;op.selected=settings.mode===value;select.append(op);}select.onchange=()=>{settings.mode=select.value;persistSettings();if(screen==='game'&&story[state.index].kind==='live')render();};row.append(label,select);wrap.append(row);const mr=el('div','setting-row'),ml=el('label','','减少动态效果'),mi=el('input');mi.id='setting-motion';ml.htmlFor=mi.id;mi.type='checkbox';mi.checked=settings.motion;mi.onchange=()=>{settings.motion=mi.checked;persistSettings();};mr.append(ml,mi);wrap.append(mr,el('p','storage-note','存档、称呼和分享笔记只保存在当前浏览器。游戏无需账号，不上传这些内容。'));openModal('设置',wrap,'游戏设置');}
function confirmAction(title,text,yesLabel,action){const wrap=el('div'),p=el('p','modal-copy',text),actions=el('div','return-actions'),cancel=el('button','secondary-button','再想想'),yes=el('button','primary-button',yesLabel);cancel.onclick=closeModal;yes.onclick=()=>{closeModal();action();};actions.append(cancel,yes);wrap.append(p,actions);openModal(title,wrap);}
function slotsModal(mode){const wrap=el('div'),rows=mode==='load'?['auto',1,2,3]:[1,2,3];for(const key of rows){const data=storage.get(key==='auto'?'auto':'slot'+key),valid=validSave(data),row=el('div','slot');row.append(el('div','slot-number',key==='auto'?'A':String(key).padStart(2,'0')));const info=el('div','slot-info');info.append(el('strong','',valid?data.name+' · '+chapters[story[data.index].chapter].name:'空白存档'));info.append(el('small','',valid?(key==='auto'?'自动保存 · ':'')+new Date(data.date).toLocaleString('zh-CN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):'空白存档'));const b=el('button','slot-action',mode==='save'?'保存':'读取');b.disabled=mode==='load'&&!valid;b.onclick=()=>{if(mode==='save'){const save=()=>{const ok=storage.set('slot'+key,snapshot());closeModal();toast(ok?'已保存在存档 '+key:'浏览器存储不可用，存档未保存。');};if(valid)confirmAction('覆盖这份存档？','存档 '+key+' 目前停在「'+chapters[story[data.index].chapter].name+'」。','确认覆盖',save);else save();}else{closeModal();restore(data);toast('已读档。');}};row.append(info,b);wrap.append(row);}wrap.append(el('p','storage-note','存档保存在当前浏览器；清除网站数据会移除存档。'));openModal(mode==='save'?'存档':'读档',wrap,mode==='save'?'本机存档':'本机存档');}
function restore(data){data=normalizeSave(data);if(!data){toast('这份存档无法读取。');return;}state=structuredClone(data);setAuto(false);showGame();}
function logModal(){const wrap=el('div');for(const index of [...state.trail,state.index]){const s=story[index],row=el('div','log-item');row.append(el('small','',chapters[s.chapter].name+' · '+s.who),el('p','',s.text.replaceAll('{name}',state.name)));if(s.kind==='choice'&&state.branch)row.append(el('small','','我选择了：'+(s.choices.find(c=>c.target===state.branch)?.text||'')));if(state.notes[s.id])row.append(el('p','','我的想法：'+state.notes[s.id]));wrap.append(row);}for(const [id,note]of Object.entries(state.notes)){if(note&&!story.some(s=>s.id===id)){const row=el('div','log-item');row.append(el('small','','此前的分享笔记'),el('p','',note));wrap.append(row);}}openModal('对话记录',wrap,'回看');requestAnimationFrame(()=>$('modal').scrollTop=$('modal').scrollHeight);}
function howTo(){const wrap=el('div','modal-copy');for(const text of ['你是普通同学“我”。点击画面或按空格 / 回车推进；文字还没出现完时，点击可立即显示。','按 ← 返回上一句；按 A 切换自动播放；按 H 隐藏界面；Esc 关闭弹窗或退出隐藏界面。','选择不会判分。军训后的两个选择会留下不同回忆，之后回到同一段大学生活。','“自己读完”提供参考回应。“班会现场”会在主持人环节暂停，由主持人点击按钮进入下一环节。自动播放会停在选择、讨论和分享环节。','每句剧情自动保存，也可使用三个手动存档。回看只展示你走过的故事。右上角音符可开关音乐与事件音效，设置中可分别调整音量。'])wrap.append(el('p','',text));openModal('操作说明',wrap,'操作说明');}
function renderPhone(kind,scene={}){
 document.body.classList.toggle('has-phone',!!kind);$('phone').classList.toggle('hidden',!kind);
 const content=$('phone-content'),title=$('phone-title'),sameTodos=kind==='todos'&&phoneKind==='todos',sameChat=chatKinds.has(kind)&&phoneKind===kind&&chat.active;
 phoneKind=kind||null;if(!sameTodos&&!sameChat){phoneTodos.clear();resolvedTodos.clear();chat.clear();content.replaceChildren();}if(!kind)return;
 if(chatKinds.has(kind)){if(!sameChat)chat.set(kind,settings.motion);return;}
 const msg=(text,out=false)=>content.append(el('div','phone-bubble'+(out?' out':''),text));
 if(albums[kind]){title.textContent=albums[kind].title;gallery.renderAlbum(kind,content,assets);if(kind==='training')msg('腿已废。求雨。');}
 else if(kind==='todos'){title.textContent='待办事项 · '+todos.length;phoneTodos.set(content,todos,scene.todoCount||todos.length,settings.motion);}
 else if(kind==='resolved'){title.textContent='待办事项';resolvedTodos.set(content,scene,settings.motion);}
 else if(kind==='bind'){title.textContent='手机';const panel=el('div','phone-pixel');panel.append(el('strong','','NEU'),el('span','','生活模拟器'),el('p','','正在连接…'));content.append(panel);}
 else if(kind==='courses'){title.textContent='本学期课程';for(const text of ['高等数学 ∫','线性代数 [ ]','大学英语 Aa'])content.append(el('div','phone-courses',text));}
}
function fitSceneLayout(){
 const phone=$('phone'),dialogue=$('dialogue');
 if(screen!=='game'||phone.classList.contains('hidden')||!dialogue.offsetHeight||matchMedia('(orientation:landscape) and (max-height:600px)').matches){phone.style.maxHeight='';return;}
 const room=dialogue.getBoundingClientRect().top-$('game').getBoundingClientRect().top-phone.offsetTop-24;
 phone.style.maxHeight=Math.max(150,Math.floor(room))+'px';
}
new ResizeObserver(fitSceneLayout).observe($('dialogue'));window.addEventListener('resize',fitSceneLayout);
$('start').onclick=intro;$('replay').onclick=intro;$('ending-home').onclick=showHome;$('how-to').onclick=howTo;$('settings').onclick=settingsModal;
$('continue').onclick=async()=>{await sound.unlock();restore(storage.get('auto'));};
$('dialogue').onclick=()=>advance();$('cinematic').onclick=()=>advance();$('cinematic').onkeydown=e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();e.stopPropagation();advance();}};$('dialogue').onkeydown=e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();e.stopPropagation();advance();}};
$('back').onclick=back;$('auto').onclick=()=>setAuto(!auto);$('log').onclick=logModal;$('save').onclick=()=>slotsModal('save');$('load').onclick=()=>slotsModal('load');
$('live-next').onclick=()=>advance(undefined,true);$('live-note').oninput=()=>{state.notes[story[state.index].id]=$('live-note').value;autoSave();};
$('hide-ui').onclick=()=>{if(['choice','live'].includes(story[state.index].kind))return;pure=!pure;document.body.classList.toggle('pure',pure);syncPauses();if(pure)clearTimeout(autoTimer);else if(!maybeSlideshow())scheduleAuto();};
function homeAction(){if(screen==='game')autoSave();showHome();}
$('home-button').onclick=homeAction;$('brand').onclick=e=>{e.preventDefault();homeAction();};
$('sound').onclick=async()=>{await sound.unlock();settings.sound=!settings.sound;persistSettings();if(settings.sound)toast('声音已开启 · 音乐与事件音效');};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('当前浏览器不支持全屏。');}catch{toast('当前浏览器未允许全屏。');}};
$('modal-close').onclick=closeModal;$('modal').addEventListener('click',e=>{if(e.target===$('modal')){const r=$('modal').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});$('modal').addEventListener('close',()=>{syncPauses();if(!maybeSlideshow())scheduleAuto();});
window.addEventListener('keydown',e=>{if(gallery.open)return;if($('modal').open||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;if(screen!=='game')return;if(e.target.tagName==='BUTTON'&&[' ','Enter'].includes(e.key))return;if(e.key==='Escape'){if(pure){pure=false;document.body.classList.remove('pure');syncPauses();if(!maybeSlideshow())scheduleAuto();}return;}if([' ','Enter','ArrowRight'].includes(e.key)){e.preventDefault();if(story[state.index].kind!=='live')advance();}else if(e.key==='ArrowLeft'){e.preventDefault();back();}else if(e.key.toLowerCase()==='a')setAuto(!auto);else if(e.key.toLowerCase()==='h')$('hide-ui').click();});
document.addEventListener('visibilitychange',()=>{syncPauses();if(document.hidden){clearTimeout(autoTimer);sound.stop();if(screen==='game')autoSave();}else{sound.update();if(!maybeSlideshow())scheduleAuto();}});
window.addEventListener('pagehide',()=>{if(screen==='game')autoSave();});
sound.assetMap=assets;
applySettings();showHome();
$('asset-retry').onclick=()=>{if(assetIssues.has('manifest'))refreshAssets();if(assetIssues.has('background'))background(null,true);};
window.addEventListener('online',()=>{if(assetIssues.has('manifest'))refreshAssets();if(assetIssues.has('background'))background(null,true);});
window.addEventListener('resize',()=>background(null));
refreshAssets();
