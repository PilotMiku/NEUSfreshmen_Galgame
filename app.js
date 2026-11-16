import {story,chapters,characters,backgrounds,todos,nextIndex,validSave,normalizeSave} from './story.js';
import {Soundtrack} from './audio.js';
import {PortraitLayer} from './portraits.js';
import {albums,PhotoViewer} from './albums.js';
import {TodoList,SceneEffects} from './scene-effects.js';
const $=id=>document.getElementById(id),sound=new Soundtrack(),KEY='xinsheng.v1';
const portraits=new PortraitLayer($('character'),$('character-image'),$('character-tag'));
const phoneTodos=new TodoList(count=>{$('phone-title').textContent='待办事项 · '+count;});
const effects=new SceneEffects($('cinematic'),$('todo-rain'),$('dialogue'),todos,()=>scheduleAuto(),$('scene-decoration'));
const gallery=new PhotoViewer($('photo-viewer'),()=>{clearTimeout(autoTimer);clearTimeout(slideshowTimer);slideshowTimer=null;slideshowPlayedFor=story[state.index].id;effects.pause(true);phoneTodos.pause(true);},()=>{syncPauses();scheduleAuto();});
let storeAvailable=true;
const storage={get(key,fallback=null){try{const v=localStorage.getItem(KEY+'.'+key);if(v===null)return fallback;const value=JSON.parse(v);return key==='auto'||/^slot[123]$/.test(key)?normalizeSave(value)||fallback:value;}catch{return fallback;}},set(key,value){try{localStorage.setItem(KEY+'.'+key,JSON.stringify(value));return true;}catch{storeAvailable=false;return false;}}};
let settings={speed:32,volume:.35,font:21,mode:'solo',sound:false,motion:matchMedia('(prefers-reduced-motion: reduce)').matches};
const savedSettings=storage.get('settings',{});
if(savedSettings&&typeof savedSettings==='object'){
for(const k of ['speed','volume','font'])if(typeof savedSettings[k]==='number'&&Number.isFinite(savedSettings[k]))settings[k]=Math.max(k==='volume'?0:k==='font'?17:0,Math.min(k==='volume'?1:k==='font'?27:65,savedSettings[k]));
if(['solo','live'].includes(savedSettings.mode))settings.mode=savedSettings.mode;
for(const k of ['sound','motion'])if(typeof savedSettings[k]==='boolean')settings[k]=savedSettings[k];
}
let state={version:2,index:0,name:'同学',trail:[],branch:null,notes:{},date:''};
let screen='home',auto=false,pure=false,typing=false,typeTimer,autoTimer,toastTimer,fullText='',assets={xiaomen:'assets/photos/xiaomen.jpg'},activeBg='';
let slideshowPlayedFor=null,slideshowTimer=null,phoneKind=null;
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2600);}
function applySettings(){document.documentElement.style.setProperty('--dialogue-size',settings.font+'px');document.body.classList.toggle('motion-reduced',settings.motion);$('sound').classList.toggle('sound-on',settings.sound);$('sound').setAttribute('aria-label',settings.sound?'关闭声音':'开启声音');sound.setVolume(settings.volume);sound.setEnabled(settings.sound);if(screen==='game'){if(settings.motion)effects.finish();effects.pile.set(story[state.index].overflowCount||0,settings.motion);phoneTodos.reduced=settings.motion;phoneTodos.tick();}}
function persistSettings(){storage.set('settings',settings);applySettings();}
function cleanTimers(){clearInterval(typeTimer);clearTimeout(autoTimer);clearTimeout(slideshowTimer);slideshowTimer=null;typing=false;}
function snapshot(){return {...state,version:2,sceneId:story[state.index].id,trail:[...state.trail],trailIds:state.trail.map(index=>story[index].id),notes:{...state.notes},date:new Date().toISOString()};}
function autoSave(){storage.set('auto',snapshot());$('continue').disabled=false;}
function background(name){const key=backgrounds[name]||'xiaomen',src=assets[key]||'assets/'+key+'.svg';if(activeBg===src)return;activeBg=src;$('background').onerror=()=>{$('background').onerror=null;$('background').src='assets/'+key+'.svg';};$('background').src=src;}
function showScreen(next){gallery.close();effects.clear();phoneTodos.clear();phoneKind=null;portraits.hide();screen=next;for(const id of ['home','game','ending'])$(id).classList.toggle('hidden',id!==next);document.body.classList.toggle('in-game',next==='game');document.body.classList.toggle('ending-screen',next==='ending');document.body.classList.remove('pure','choice-scene','live-scene','blackout','glitch','pixel','has-phone','has-portrait');pure=false;syncPauses();}
function showHome(){cleanTimers();setAuto(false);showScreen('home');background('校门');sound.play('open');$('top-caption').textContent='新生心理班会 · 互动剧场';$('continue').disabled=!validSave(storage.get('auto'));}
function setAuto(value){auto=value;$('auto').classList.toggle('active',auto);$('auto').setAttribute('aria-pressed',String(auto));$('auto').querySelector('span').textContent=auto?'自动中':'自动';clearTimeout(autoTimer);if(auto&&!typing)scheduleAuto();}
function scheduleAuto(){clearTimeout(autoTimer);if(!auto||screen!=='game'||$('modal').open||gallery.open||slideshowTimer||effects.busy||document.hidden||pure)return;const s=story[state.index];if(['choice','live','end'].includes(s.kind))return;autoTimer=setTimeout(()=>advance(),Math.max(1800,fullText.length*65));}
function syncPauses(){const blocked=screen!=='game'||$('modal').open||document.hidden||pure;effects.pause(blocked||gallery.open);phoneTodos.pause(blocked||gallery.open);gallery.pause(blocked);}
function setDialogueText(text){
 const container=$('dialogue-text');container.replaceChildren();let start=0;
 for(const match of text.matchAll(/（[^）]*）/g)){container.append(document.createTextNode(text.slice(start,match.index)),el('span','stage-direction',match[0]));start=match.index+match[0].length;}
 container.append(document.createTextNode(text.slice(start)));
}
function maybeSlideshow(){const scene=story[state.index];if(screen!=='game'||typing||!scene.slideshow||settings.motion||slideshowPlayedFor===scene.id||$('modal').open||document.hidden||pure)return false;slideshowPlayedFor=scene.id;slideshowTimer=setTimeout(()=>{slideshowTimer=null;if(screen==='game'&&story[state.index].id===scene.id&&!$('modal').open&&!document.hidden&&!pure)gallery.show(scene.phone,assets,0,true,scene.text.split('（')[0]);else slideshowPlayedFor=null;},1000);return true;}
function finishText(){clearInterval(typeTimer);setDialogueText(fullText);typing=false;if(!maybeSlideshow())scheduleAuto();}
function typeText(text){clearInterval(typeTimer);clearTimeout(autoTimer);fullText=text;$('dialogue-text').textContent='';if(settings.speed===0||settings.motion){finishText();return;}typing=true;const chars=Array.from(text);let n=0;typeTimer=setInterval(()=>{n++;$('dialogue-text').textContent=chars.slice(0,n).join('');if(n>=chars.length)finishText();},settings.speed);}
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
for(const [cls,val]of [['choice-scene',s.kind==='choice'],['live-scene',s.kind==='live'],['blackout',s.effect==='blackout'],['glitch',s.effect==='glitch'],['pixel',s.effect==='pixel']])document.body.classList.toggle(cls,val);
background(s.bg);sound.play(s.music);
const chapter=chapters[s.chapter];$('chapter-number').textContent=String(s.chapter+1).padStart(2,'0');$('chapter-label').textContent=chapter.en;$('chapter-title').textContent=chapter.name;$('location').textContent=s.bg;$('top-caption').textContent=state.name+'的大学生活 · '+chapter.name;$('dialogue-context').textContent=chapter.note;
$('speaker').textContent=s.who;$('speaker-note').textContent=s.who==='我'?(s.spoken?'对话':'内心独白'):characters[s.who]?.title||(s.who==='NEU生活模拟器'?'系统消息':'');
const chapterScenes=story.filter(v=>v.chapter===s.chapter);$('scene-count').textContent=String(chapterScenes.indexOf(s)+1).padStart(2,'0')+' / '+String(chapterScenes.length).padStart(2,'0');$('chapter-progress').style.width=((state.index+1)/story.length*100)+'%';
effects.set(s,state.name,settings.motion);
$('simulator').classList.toggle('hidden',!s.sim||effects.cinematic);$('sim-text').textContent=(s.sim||'').replaceAll('{name}',state.name);
renderPortrait(s);
$('scene-decoration').className='scene-decoration '+(s.decoration||s.effect||'');renderPhone(s.phone,s);
$('choice-panel').classList.toggle('hidden',s.kind!=='choice');if(s.kind==='choice'){setAuto(false);$('choices').replaceChildren();s.choices.forEach((c,i)=>{const b=el('button','choice-button');b.append(el('span','',String(i+1).padStart(2,'0')));const copy=el('div');copy.append(el('strong','',c.text),el('small','',c.detail));b.append(copy,el('i','','→'));b.onclick=()=>{state.branch=c.target;advance(i);};$('choices').append(b);});}
$('live-panel').classList.toggle('hidden',s.kind!=='live');if(s.kind==='live'){setAuto(false);$('live-badge').textContent=settings.mode==='live'?'现场模式 · 等待主持人继续':'班会互动';$('live-title').textContent=s.live.title;$('live-prompt').textContent=s.live.prompt;$('live-response').textContent=s.live.response;$('live-response').classList.toggle('hidden',settings.mode==='live');$('live-note').value=state.notes[s.id]||'';$('live-hint').textContent=settings.mode==='live'?'分享结束后，由主持人继续。':'可留空，直接继续。';$('live-next').firstChild.textContent=settings.mode==='live'?'现场分享结束 ':'继续故事 ';}
$('dialogue').classList.toggle('hidden',['choice','live'].includes(s.kind)||effects.cinematic);
if(effects.cinematic){fullText=s.text.replaceAll('{name}',state.name);setDialogueText(fullText);typing=false;scheduleAuto();}
else if(!['choice','live'].includes(s.kind))typeText(s.text.replaceAll('{name}',state.name));else{fullText=s.text;typing=false;}
$('back').disabled=state.trail.length===0;autoSave();syncPauses();requestAnimationFrame(fitSceneLayout);
}
function advance(choice,fromLive=false){if(screen!=='game'||$('modal').open||gallery.open||pure)return;const s=story[state.index];if(s.kind==='live'&&!fromLive)return;if(s.kind==='choice'&&choice===undefined)return;if(typing){finishText();return;}if(effects.finish())return;const next=nextIndex(state.index,choice);if(next===null)return;state.trail.push(state.index);state.index=next;render();}
function back(){if(screen!=='game'||!state.trail.length)return;setAuto(false);cleanTimers();state.index=state.trail.pop();if(story[state.index].kind==='choice')state.branch=null;render();}
function showEnding(){cleanTimers();setAuto(false);showScreen('ending');background('文管门口');sound.play('shouwei');$('top-caption').textContent='新生心理班会 · 结束';$('ending-memory').textContent=state.branch==='cry'?'后来某天夜里，我突然想起教官喊口令的声音。':'后来某次离别，我发现自己还是会愣一下。';storage.set('completed',true);autoSave();}
function openModal(title,content,eyebrow=''){clearTimeout(autoTimer);if(typing){clearInterval(typeTimer);setDialogueText(fullText);typing=false;}$('modal-title').textContent=title;$('modal-eyebrow').textContent=eyebrow;$('modal-body').replaceChildren(content);$('modal').scrollTop=0;if(!$('modal').open)$('modal').showModal();syncPauses();}
function closeModal(){$('modal').close();syncPauses();if(!maybeSlideshow())scheduleAuto();}
function intro(){const wrap=el('div'),copy=el('div','modal-copy');copy.append(el('p','','你是班上的一名普通同学，刚来东北大学报到。'));wrap.append(copy);const label=el('label','form-label','姓名或昵称（可不填）');label.htmlFor='player-name';const input=el('input','name-input');input.id='player-name';input.maxLength=16;input.placeholder='同学';const oldName=storage.get('playerName','');input.value=typeof oldName==='string'?oldName:'';wrap.append(label,input,el('span','form-label','选择游玩方式'));const modes=el('div','mode-options');for(const [value,title,desc]of [['solo','自己读完','独自游玩，查看参考回应'],['live','班会现场','主持人控制分享环节']]){const l=el('label','mode-option'),radio=el('input');radio.type='radio';radio.name='mode';radio.value=value;radio.checked=settings.mode===value;l.append(radio,document.createTextNode(title),el('small','',desc));modes.append(l);}wrap.append(modes);if(validSave(storage.get('auto')))wrap.append(el('p','storage-note','开启后将更新自动存档。手动存档仍可读取。'));const start=el('button','primary-button modal-wide-button','开始游戏');start.onclick=async()=>{state={version:2,index:0,name:input.value.trim().slice(0,16)||'同学',trail:[],branch:null,notes:{},date:''};settings.mode=wrap.querySelector('input[name="mode"]:checked').value;storage.set('playerName',state.name);persistSettings();closeModal();await sound.unlock();await assetsReady;showGame();if(!storeAvailable)toast('浏览器限制了存储，本次仍可正常游玩。');};wrap.append(start);openModal('开始之前',wrap,'入学登记');}
function settingsModal(){const wrap=el('div');const range=(name,key,min,max,step,desc)=>{const row=el('div','setting-row'),l=el('label','',name),input=el('input');input.id='setting-'+key;l.htmlFor=input.id;if(desc)l.append(el('small','',desc));input.type='range';input.min=min;input.max=max;input.step=step;input.value=settings[key];input.setAttribute('aria-label',name);input.oninput=()=>{settings[key]=Number(input.value);persistSettings();};row.append(l,input);wrap.append(row);};range('文字速度','speed',0,65,5,'左边更快；最左侧立即显示。');range('文字大小','font',17,27,1,'调整正文大小。');range('音乐音量','volume',0,1,.05,'开启右上角音符后播放。');const row=el('div','setting-row'),label=el('label','','游玩方式'),select=el('select');select.id='setting-mode';label.htmlFor=select.id;for(const[value,text]of [['solo','单人 · 展示参考回应'],['live','现场 · 等待主持人']]){const op=el('option','',text);op.value=value;op.selected=settings.mode===value;select.append(op);}select.onchange=()=>{settings.mode=select.value;persistSettings();if(screen==='game'&&story[state.index].kind==='live')render();};row.append(label,select);wrap.append(row);const mr=el('div','setting-row'),ml=el('label','','减少动态效果'),mi=el('input');mi.id='setting-motion';ml.htmlFor=mi.id;mi.type='checkbox';mi.checked=settings.motion;mi.onchange=()=>{settings.motion=mi.checked;persistSettings();};mr.append(ml,mi);wrap.append(mr,el('p','storage-note','存档、称呼和分享笔记只保存在当前浏览器。游戏无需账号，不上传这些内容。'));openModal('设置',wrap,'游戏设置');}
function confirmAction(title,text,yesLabel,action){const wrap=el('div'),p=el('p','modal-copy',text),actions=el('div','return-actions'),cancel=el('button','secondary-button','再想想'),yes=el('button','primary-button',yesLabel);cancel.onclick=closeModal;yes.onclick=()=>{closeModal();action();};actions.append(cancel,yes);wrap.append(p,actions);openModal(title,wrap);}
function slotsModal(mode){const wrap=el('div'),rows=mode==='load'?['auto',1,2,3]:[1,2,3];for(const key of rows){const data=storage.get(key==='auto'?'auto':'slot'+key),valid=validSave(data),row=el('div','slot');row.append(el('div','slot-number',key==='auto'?'A':String(key).padStart(2,'0')));const info=el('div','slot-info');info.append(el('strong','',valid?data.name+' · '+chapters[story[data.index].chapter].name:'空白存档'));info.append(el('small','',valid?(key==='auto'?'自动保存 · ':'')+new Date(data.date).toLocaleString('zh-CN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):'空白存档'));const b=el('button','slot-action',mode==='save'?'保存':'读取');b.disabled=mode==='load'&&!valid;b.onclick=()=>{if(mode==='save'){const save=()=>{const ok=storage.set('slot'+key,snapshot());closeModal();toast(ok?'已保存在存档 '+key:'浏览器存储不可用，存档未保存。');};if(valid)confirmAction('覆盖这份存档？','存档 '+key+' 目前停在「'+chapters[story[data.index].chapter].name+'」。','确认覆盖',save);else save();}else{closeModal();restore(data);toast('已读档。');}};row.append(info,b);wrap.append(row);}wrap.append(el('p','storage-note','存档保存在当前浏览器；清除网站数据会移除存档。'));openModal(mode==='save'?'存档':'读档',wrap,mode==='save'?'本机存档':'本机存档');}
function restore(data){data=normalizeSave(data);if(!data){toast('这份存档无法读取。');return;}state=structuredClone(data);setAuto(false);showGame();}
function logModal(){const wrap=el('div');for(const index of [...state.trail,state.index]){const s=story[index],row=el('div','log-item');row.append(el('small','',chapters[s.chapter].name+' · '+s.who),el('p','',s.text.replaceAll('{name}',state.name)));if(s.kind==='choice'&&state.branch)row.append(el('small','','我选择了：'+(s.choices.find(c=>c.target===state.branch)?.text||'')));if(state.notes[s.id])row.append(el('p','','我的想法：'+state.notes[s.id]));wrap.append(row);}openModal('对话记录',wrap,'回看');requestAnimationFrame(()=>$('modal').scrollTop=$('modal').scrollHeight);}
function howTo(){const wrap=el('div','modal-copy');for(const text of ['你是普通同学“我”。点击画面或按空格 / 回车推进；文字还没出现完时，点击可立即显示。','按 ← 返回上一句；按 A 切换自动播放；按 H 隐藏界面；Esc 关闭弹窗或退出隐藏界面。','选择不会判分。军训后的两个选择会留下不同回忆，之后回到同一段大学生活。','“自己读完”提供参考回应。“班会现场”会在主持人环节暂停，直到点击“现场分享结束”。自动播放会停在选择和分享环节。','每句剧情自动保存，也可使用三个手动存档。回看只展示你走过的故事。开启声音后，配乐会随剧情变化。'])wrap.append(el('p','',text));openModal('操作说明',wrap,'操作说明');}
function renderPhone(kind,scene={}){
 document.body.classList.toggle('has-phone',!!kind);$('phone').classList.toggle('hidden',!kind);
 const content=$('phone-content'),title=$('phone-title'),sameTodos=kind==='todos'&&phoneKind==='todos';
 phoneKind=kind||null;if(!sameTodos){phoneTodos.clear();content.replaceChildren();}if(!kind)return;
 const line=(name,small,checked=false)=>{const row=el('div','phone-item'+(checked?' checked':''));row.append(el('span','phone-checkbox',checked?'✓':''));const text=el('span','',name);if(small)text.append(el('small','',small));row.append(text);content.append(row);};
 const msg=(text,out=false)=>content.append(el('div','phone-bubble'+(out?' out':''),text));
 if(albums[kind]&&kind!=='family'){title.textContent=albums[kind].title;gallery.renderAlbum(kind,content,assets);if(kind==='training')msg('腿已废。求雨。');}
 else if(kind==='todos'){title.textContent='待办事项 · '+todos.length;phoneTodos.set(content,todos,scene.todoCount||todos.length,settings.motion);}
 else if(kind==='resolved'){title.textContent='待办事项';line('今晚心理班会','我来了',true);line('高数作业','已找学委问',true);line('小组作业落单','已问冉有',true);line('心里不得劲','已跟生活委员说',true);line('Python课','周三 · 记得带电脑');}
 else if(kind==='notifications'){title.textContent='消息 · 99+';for(const[name,text]of [['学生会','同学们，记得提交材料。'],['班委会','收到请回复。'],['社团通知','明晚活动，大家别忘了。']]){const row=el('div','phone-item');row.append(el('span','phone-avatar',name.slice(0,1)));const copy=el('span','',name);copy.append(el('small','',text));row.append(copy);content.append(row);}msg('收到',true);msg('收',true);msg('👌',true);}
 else if(kind==='bind'){title.textContent='手机';const panel=el('div','phone-pixel');panel.append(el('strong','','NEU'),el('span','','生活模拟器'),el('p','','正在连接…'));content.append(panel);}
 else if(kind==='family'){title.textContent='幸福一家人';msg('我到学校啦，已经找到宿舍了。',true);gallery.renderAlbum('family',content,assets);msg('到了就好，记得吃饭。');}
 else if(kind==='courses'){title.textContent='本学期课程';for(const text of ['高等数学 ∫','线性代数 [ ]','大学英语 Aa'])content.append(el('div','phone-courses',text));}
 else if(kind==='classMeeting'){title.textContent='班级群';msg('今晚心理班会，都来啊。');msg('心理班会 · 随便坐。');}
 else if(kind==='friend'){title.textContent='朋友';content.append(el('div','phone-time','凌晨 00:47'));msg('在吗……',true);content.append(el('div','phone-time','正在输入……又删掉了。'));}
 else if(kind==='partner'){title.textContent='班级群';msg('有没有高数搭子？',true);content.append(el('div','phone-warn','防诈提醒：不转账、不点链接、不交押金。'));}
 else if(kind==='kfc'){title.textContent='班级群';msg('班长V我50吃KFC',true);msg('先一起吃顿饭？');}
}
function fitSceneLayout(){
 const phone=$('phone'),dialogue=$('dialogue');
 if(screen!=='game'||phone.classList.contains('hidden')||!dialogue.offsetHeight||matchMedia('(orientation:landscape) and (max-height:600px)').matches){phone.style.maxHeight='';return;}
 const room=dialogue.getBoundingClientRect().top-$('game').getBoundingClientRect().top-phone.offsetTop-24;
 phone.style.maxHeight=Math.max(150,Math.floor(room))+'px';
}
new ResizeObserver(fitSceneLayout).observe($('dialogue'));window.addEventListener('resize',fitSceneLayout);
$('start').onclick=intro;$('replay').onclick=intro;$('ending-home').onclick=showHome;$('how-to').onclick=howTo;$('settings').onclick=settingsModal;
$('continue').onclick=async()=>{await sound.unlock();await assetsReady;restore(storage.get('auto'));};
$('dialogue').onclick=()=>advance();$('cinematic').onclick=()=>advance();$('cinematic').onkeydown=e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();e.stopPropagation();advance();}};$('dialogue').onkeydown=e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();e.stopPropagation();advance();}};
$('back').onclick=back;$('auto').onclick=()=>setAuto(!auto);$('log').onclick=logModal;$('save').onclick=()=>slotsModal('save');$('load').onclick=()=>slotsModal('load');
$('live-next').onclick=()=>advance(undefined,true);$('live-note').oninput=()=>{state.notes[story[state.index].id]=$('live-note').value;autoSave();};
$('hide-ui').onclick=()=>{if(['choice','live'].includes(story[state.index].kind))return;pure=!pure;document.body.classList.toggle('pure',pure);syncPauses();if(pure)clearTimeout(autoTimer);else if(!maybeSlideshow())scheduleAuto();};
function homeAction(){if(screen==='game')autoSave();showHome();}
$('home-button').onclick=homeAction;$('brand').onclick=e=>{e.preventDefault();homeAction();};
$('sound').onclick=async()=>{await sound.unlock();settings.sound=!settings.sound;persistSettings();if(settings.sound)toast('声音已开启 · 配乐随故事变化');};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('当前浏览器不支持全屏。');}catch{toast('当前浏览器未允许全屏。');}};
$('modal-close').onclick=closeModal;$('modal').addEventListener('click',e=>{if(e.target===$('modal')){const r=$('modal').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});$('modal').addEventListener('close',()=>{syncPauses();if(!maybeSlideshow())scheduleAuto();});
window.addEventListener('keydown',e=>{if(gallery.open)return;if($('modal').open||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;if(screen!=='game')return;if(e.target.tagName==='BUTTON'&&[' ','Enter'].includes(e.key))return;if(e.key==='Escape'){if(pure){pure=false;document.body.classList.remove('pure');syncPauses();if(!maybeSlideshow())scheduleAuto();}return;}if([' ','Enter','ArrowRight'].includes(e.key)){e.preventDefault();if(story[state.index].kind!=='live')advance();}else if(e.key==='ArrowLeft'){e.preventDefault();back();}else if(e.key.toLowerCase()==='a')setAuto(!auto);else if(e.key.toLowerCase()==='h')$('hide-ui').click();});
document.addEventListener('visibilitychange',()=>{syncPauses();if(document.hidden){clearTimeout(autoTimer);sound.stop();if(screen==='game')autoSave();}else{sound.update();if(!maybeSlideshow())scheduleAuto();}});
window.addEventListener('pagehide',()=>{if(screen==='game')autoSave();});
applySettings();showHome();
const assetsReady=(async()=>{try{const response=await fetch('asset-manifest.json',{cache:'no-store'});if(response.ok){assets=await response.json();sound.assetMap=assets;if(screen==='home')background('校门');else if(screen==='game')renderPortrait(story[state.index]);}}catch{}})();
