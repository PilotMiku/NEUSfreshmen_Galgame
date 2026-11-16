import {legacySceneIds} from './legacy-scenes.js';
export const chapters = [
  {name:'初来乍到', en:'九月 · 报到', note:'入学第一天'},
  {name:'军训那些天', en:'九月 · 军训', note:'操场上的日子'},
  {name:'这就是大学吗', en:'第一周 · 上课', note:'新学期课表'},
  {name:'身边的那些人', en:'课间', note:'班群里又有新消息'},
  {name:'试着开口', en:'心理班会', note:'现场互动'},
  {name:'没那么沉了', en:'今天晚上', note:'文管学馆门口'},
];
export const backgrounds = {开学典礼:'openingCeremony',雨中校园:'rainCampus',车窗:'chechuang',校门:'xiaomen',文管学馆:'wenguan',图书馆:'tushuguan',小南湖:'xiaonanhu',二食堂:'ercantang',宿舍楼下:'sushe',军训场:'junxun',教室:'jiaoshi',走廊:'zoulang',文管门口:'wenguanmenkou',夜路:'sunset'};
export const characters = {
  主角:{file:'zhujue',side:'center',color:'#7a9f88',title:'一个普通同学'},
  班长:{file:'banzhang',companion:'banzhang_stand',companionStyle:{height:1.12,x:.22,y:.17,opacity:.30},portraitHip:.62,side:'left',color:'#789789',title:'班委'},
  团支书:{file:'tuanzhishu',companion:'tuanzhishu_stand',companionStyle:{height:.88,x:.33,y:.19,opacity:.32},portraitHip:.56,side:'left',color:'#be8e73',title:'班委'},
  生活委员:{file:'shenghuo',companion:'shenghuo_stand',companionStyle:{height:.80,x:.32,y:.16,opacity:.34,rotation:-90},portraitHip:.56,side:'left',color:'#bc9a65',title:'副班 · 心理委员'},
  组宣:{file:'zuxuan',companion:'zuxuan_stand',companionStyle:{height:.88,x:.34,y:.18,opacity:.32},portraitHip:.56,side:'left',color:'#8d88b1',title:'组织 · 宣传'},
  学习委员:{file:'xuewei',companion:'xuewei_stand',companionStyle:{height:.86,x:.30,y:.17,opacity:.32},portraitHip:.53,side:'left',color:'#7a9eae',title:'学习委员 · 双创委员'},
  文体委员:{file:'wenti',companion:'wenti_stand',companionStyle:{height:1.18,x:.19,y:.16,opacity:.36},portraitHip:.58,side:'left',color:'#b78984',title:'文体委员 · 生涯发展委员'},
  毛学长:{file:'xuezhang',side:'left',color:'#7e8fa8',title:'高年级同学'},
};
// The life committee member also serves as the psychology committee member.
characters.心理委员=characters.生活委员;
export const todos=['学生会面试','班委会','年级会选拔','篮球队选拔','志愿者协会招募','四六级报考','商业精英挑战赛','国庆放假','高数课','线代课','大学生心理健康教育','Python课','劳动教育'];
export const story=[];
let context={chapter:0,bg:'车窗',music:'open'};
function scene(text, extra={}) { const item={...context,id:`scene-${story.length}`,who:'我',text,...extra};story.push(item);return item; }
function at(bg,music,chapter){context={...context,bg,...(music!==undefined?{music}:{}),...(chapter!==undefined?{chapter}:{})};}
function say(who,text,extra={}){return scene(text,{who,spoken:true,...extra});}
function system(text,extra={}){return scene(text,{who:'NEU生活模拟器',sim:text,...extra});}
function live(id,title,prompt,response,extra={}){return scene(prompt,{id,kind:'live',who:'主持人',live:{title,prompt,response},...extra});}
scene('几个月前，我们背上行囊，离开家乡，来到这片土地。（手机相册里，是大家各自拍下的来时路。）',{id:'s0',phone:'album',slideshow:true});
scene('出门前还嫌爸妈念叨，真上了车，又忍不住翻了翻聊天记录。',{id:'s1',phone:'album'});
scene('第一次离家这么远。后面这些路，得自己慢慢认了。（车窗外的地名越来越陌生。）',{id:'s2',phone:'album'});
at('校门');
scene('原来这就是东大。照片里看过好多次，真站到门口，还是想先拍一张。（相册滑过校门、迎新横幅和文管学馆。）',{id:'s3',phone:'campus'});
scene('总算找到宿舍了。以后每天都要从这儿出门，先认认附近的路吧。（相册继续翻过宿舍、湖边和校园小路。）',{id:'s4',phone:'campus2'});
scene('到学校了，先给家里回个消息。拍了这么多，总得让他们看看我到了哪儿。（我选了几张照片，发进家庭群。）',{id:'s5',phone:'family'});
at('文管学馆');
scene('饭卡还没揣进口袋，手机怎么突然卡住了？（屏幕闪了一下，跳出一个陌生的窗口。）',{id:'s6',effect:'glitch',phone:'bind'});
scene('刚才还闹哄哄的，怎么突然听不清了？（周围的人声渐远，只剩下心跳。）',{id:'s7'});
system('滴！绑定成功。（屏幕上的字从黑体变成了像素字。）',{id:'s8',effect:'binding',cinematicTitle:'绑定成功',cinematicNote:'（屏幕上的字从黑体变成了像素字。）'});
system('欢迎{name}入学，下面开启你的大学生活吧。',{id:'s9',effect:'welcome',cinematicTitle:'欢迎{name}入学',cinematicNote:'下面开启你的大学生活吧。'});
scene('啊？上大学还带这个？',{id:'s11'});
at('开学典礼','open',1);
scene('周围全是迷彩服。我还认不全身边的人，倒是先记住了大家的后脑勺。（开学典礼开始了。）',{id:'opening-ceremony',phone:'ceremony'});
at('军训场');
scene('第一天站军姿，才过了几分钟，我就开始偷偷算还有多久能休息。（操场上，口令一遍遍响起来。）',{id:'s12',phone:'training'});
scene('“原地休息”四个字，从来没这么好听过。快，找块阴凉坐一下。',{id:'training-break',phone:'training'});
scene('平时说着“我来试试”，真轮到自己上场，还是会有点紧张。（军训活动里，大家轮流体验，旁边的同学围着看。）',{id:'training-practice',phone:'trainingPractice',slideshow:true});
scene('站了一天，嗓子却是在晚上拉歌时喊哑的。旁边的人递来一瓶水，我这才想起来，还没问他叫什么。',{id:'training-evening',phone:'training'});
scene('群里又有人发“腿已废。求雨。”我赶紧跟了一条：加一。（朋友圈里，多了几张军训的照片。）',{id:'s13',phone:'training'});
at('雨中校园');
scene('日子就这么一天天过去。群里喊了几天求雨，这回倒真下起来了。（两个同学冒雨往前走，路灯照着积水。）',{id:'s14',phone:'rainDiary'});
system('检测到宿主情绪波动，轻微上扬。',{id:'s15'});
at('军训场');
scene('好像没第一天那么难熬了。至少休息时，已经有人能一起说两句话。',{id:'s16'});
scene('现在去吃饭，不用一个人站着想去哪儿了。有人在群里喊一声，几个人就能凑一桌。（相册里，同学们的身影慢慢多了起来。）',{id:'s17',phone:'trainingHappy',slideshow:true});
scene('怎么就最后一天了。昨天还在盼着结束，今天整理衣领的时候，反而有点不习惯。（闭幕式开始，口令声又响了一遍。）',{id:'training-last-day'});
scene('我还想再跟教官说句话，抬头时，他已经往人群外走了。（闭幕式散场，操场上的人渐渐往外走。）',{id:'s18'});
scene('我看着那个越来越远的背影。',{id:'farewell',kind:'choice',choices:[{text:'转过身的瞬间，鼻子突然酸了',detail:'没出声，在原地站了一会儿。',target:'cry'},{text:'觉得自己做好了准备',detail:'虽然也不知道，准备好了什么。',target:'ready'}]});
scene('转过身的瞬间，鼻子突然酸了。没有出声，就是站那儿愣了一会儿。',{id:'cry'});
scene('后来某天夜里，我突然想起教官喊口令的声音。',{id:'s21',jump:'courses'});
scene('我觉得自己做好了准备。虽然，也不知道准备好了什么。',{id:'ready'});
scene('后来某次离别，我发现自己还是会愣一下。',{id:'s23',jump:'courses'});
at('教室','ke',2);
scene('一大波课程正在接近。',{id:'courses',effect:'course-warning',cinematicTitle:'一大波课程正在接近'});
scene('高数——导数咋求来着？（我盯着公式看了半天，又翻回前一页。）',{id:'s25',effect:'math'});
scene('线代——开心消消乐？等会儿，我是不是消错了？',{id:'s26',effect:'matrix'});
scene('英语——阿巴阿巴。老师刚才说到哪了？',{id:'s27',effect:'english'});
system('宿主修为，散尽中。',{id:'s28'});
scene('这就是……大学吗。',{id:'s29'});
at('走廊');
scene('我打开待办：学生会面试、班委会、年级会选拔、篮球队选拔……',{id:'s30',phone:'todos',todoCount:4});
scene('志愿者协会招募、四六级报考、商业精英挑战赛、国庆放假……',{id:'s31',phone:'todos',todoCount:8,effect:'overload',overflowCount:7});
scene('高数课、线代课、大学生心理健康教育、Python课、劳动教育……',{id:'s32',phone:'todos',todoCount:12,effect:'overload',overflowCount:16});
scene('最后一条“劳动教育”弹出来时，满屏都是待办，一条也划不掉。',{id:'s33',phone:'todos',todoCount:13,effect:'overload',overflowCount:25});
system(`检测到宿主待办数，${todos.length}。建议，先呼吸。`,{id:'s34',phone:'todos',todoCount:13,effect:'overload',overflowCount:28});
at('夜路');
scene('我边走边看手机。学生会、班委会、社团通知，一条接一条。',{id:'s35',phone:'notifications'});
scene('前几条“收到”打得很快。中间停了一下，后面只打“收”，或者点一个表情。',{id:'s36',phone:'notifications'});
say('路过的同学','同学，让一下。',{id:'s37'});
scene('一辆自行车擦身而过。我往旁边躲了躲，低头继续回复。',{id:'s38',phone:'notifications'});
at('走廊','banwei',3);
scene('第二天，在走廊里，我碰到了班长。',{id:'s39'});
say('班长','有啥不懂的随时cue我，不能秒回，但一定尽力帮你解决(wink)',{id:'s40',sim:'检测到一个愿意回复你的人。'});
scene('团支书见我还攥着手机，停下来，示意我慢慢说。',{id:'s41'});
say('团支书','我就在这里，不躲，不逃，把你的坏脾气稳稳接住了',{id:'s42'});
scene('生活委员兼副班和心理委员走过来，给我示范了一句求助暗号。',{id:'s43'});
say('生活委员','555｡°(°¯᷄◠¯᷅°)°｡ 心理委员我不得劲儿',{id:'s44'});
scene('我没忍住笑了。组宣从教室里探出头，接着认真安利起自己的心头好。',{id:'s45'});
say('组宣','我喜欢水豚噜噜😳😳',{id:'s46'});
scene('学习委员兼双创委员抱着书走来，听我说起没弄懂的高数题。',{id:'s47'});
say('学习委员','有学习问题随时喊我，我主打一个贴心服务',{id:'s48'});
scene('文体委员兼生涯发展委员一边看活动安排，一边朝我挥手。',{id:'s49'});
say('文体委员','文体委员是最忙的班委（奶龙唐笑）',{id:'s50'});
scene('几句聊下来，我记住了名字，也记住了各自的梗。手机一震：今晚心理班会，都来啊。',{id:'s51',phone:'classMeeting'});
scene('我看了一眼，把手机揣进兜里。真有事的时候，好像也没那么难开口了。',{id:'s52'});
at('小南湖','xingfu');
scene('日子好像，慢慢顺过来了。',{id:'s53'});
scene('我开始记得一些小事：哪家窗口好吃、哪天没早八、哪次笑得很真。',{id:'s54'});
at('夜路');
scene('可是——',{id:'s55'});
at('夜路','off',4);
live('pause','最近遇到什么困难？','视觉小说暂停。主持人上场，邀请现场同学分享最近遇到的困难。','比如：一道高数题卡了一晚上。想找人问问，又怕显得自己太笨。',{effect:'blackout'});
at('夜路','qiuzhu');
scene('啊，新的生活，困难真是接连不断呢。',{id:'new-difficulties'});
scene('不过……',{id:'recall-lead',memory:true});
at('文管学馆');
say('毛学长','刚来大学，有些事一时应付不过来，很正常。遇到困难就跟我们说一声，同学、班委，还有学长学姐，都可以一起想办法。别急，慢慢来。',{id:'mao-encouragement',memory:true});
at('夜路');
scene('是呢，遇到自己很难解决的困难，向身边的同学求助，也是不错的选择呢。',{id:'ask-for-help'});
live('next-step','一起想想办法。','主持人：请大家以小组为单位，从刚才分享的困难里选择一个，讨论可以怎么解决、可以向谁求助，以及今天就能迈出的第一步。讨论结束后，每组推选一位代表分享。','可以记下：我们选的困难是……；可以尝试的办法是……；可以向……求助；今天先做……。',{reflection:true,liveNext:'讨论结束，进入分享',liveHint:'小组讨论结束、选好代表后，由主持人继续。',notePlaceholder:'记录小组选择的困难、解决办法和第一步（可留空）'});
live('group-sharing','听听大家的办法。','主持人：请各组代表分享。你们讨论了什么困难？想到了哪些办法？准备先从哪一步开始？','分享时可以这样说：“我们讨论的是……，准备先……，如果还是有困难，可以找……一起想办法。”',{reflection:true,liveNext:'分享结束，继续故事',liveHint:'各组代表分享结束后，由主持人继续。',notePlaceholder:'记下分享中想尝试的办法（可留空）'});
at('文管门口','shouwei',5);
scene('手机待办还是满的。我把已经有着落的事，一条条记下来。',{id:'s77',phone:'resolved',resolvedCount:0});
scene('“高数作业”旁标：已找学委问。',{id:'s78',phone:'resolved',resolvedCount:1});
scene('“小组作业落单”旁标：已和同学约好一起做。',{id:'s79',phone:'resolved',resolvedCount:2});
scene('“心里不得劲”旁标：已跟生活委员说。',{id:'s80',phone:'resolved',resolvedCount:3});
scene('最上面一条新待办：今晚心理班会。我打了个勾。',{id:'s81',phone:'resolved',resolvedCount:4});
scene('文管学馆门口，心理委员举着“心理班会 · 随便坐”的牌子，抬头看见我。',{id:'s82',character:'心理委员',decoration:'meeting'});
say('心理委员','就差你了。',{id:'s83',decoration:'meeting'});
scene('我走过去。心里有一句很轻的旁白。',{id:'s84'});
scene('待办没少几条，但好像……没那么沉了。',{id:'s85',sim:'你不是一个人。'});
scene('故事到这里，生活才刚刚开始。',{id:'s86',kind:'end'});
export const sceneIndex = Object.fromEntries(story.map((s,i)=>[s.id,i]));
// Retired scenes resume at the start of the replacement sequence. Keep their notes readable.
const retiredHelpIds=['s57','s58','help-senior','s60','s61','help-friend','s63','s64','help-partner','s66','s67','s68','help-feeling','s70','s71','s72','help-kfc','s74','s75'];
const sceneAliases=Object.fromEntries([['s10','s8'],...retiredHelpIds.map(id=>[id,'new-difficulties'])]);
export function nextIndex(index,choice) { const s=story[index];if(!s||s.kind==='end')return null;if(s.kind==='choice')return choice===undefined?null:sceneIndex[s.choices[choice]?.target]??null;return s.jump?sceneIndex[s.jump]:index+1<story.length?index+1:null; }
export function validSave(value){
 if(!value||![1,2].includes(value.version))return false;
 const count=value.version===1?legacySceneIds.length:story.length;
 const base=Number.isInteger(value.index)&&value.index>=0&&value.index<count&&typeof value.name==='string'&&value.name.length<=16&&Array.isArray(value.trail)&&value.trail.length<=1000&&value.trail.every(i=>Number.isInteger(i)&&i>=0&&i<count)&&['cry','ready',null].includes(value.branch)&&value.notes!==null&&typeof value.notes==='object'&&!Array.isArray(value.notes)&&Object.entries(value.notes).every(([key,note])=>typeof note==='string'&&note.length<=500&&(Object.hasOwn(sceneIndex,key)||Object.hasOwn(sceneAliases,key)));
 if(!base)return false;
 if(value.version===1)return true;
 return typeof value.sceneId==='string'&&sceneIndex[value.sceneId]===value.index&&Array.isArray(value.trailIds)&&value.trailIds.length===value.trail.length&&value.trailIds.every((id,i)=>typeof id==='string'&&sceneIndex[id]===value.trail[i]);
}
export function normalizeSave(raw){
 if(!raw||typeof raw!=='object')return null;
 const resolve=id=>{const key=Object.hasOwn(sceneAliases,id)?sceneAliases[id]:id;return Object.hasOwn(sceneIndex,key)?sceneIndex[key]:undefined;};
 let sceneId,trailIds;
 if(raw.version===1){
  if(!validSave(raw))return null;
  sceneId=legacySceneIds[raw.index];trailIds=raw.trail.map(index=>legacySceneIds[index]);
 }else if(raw.version===2){sceneId=raw.sceneId;trailIds=raw.trailIds;}
 else return null;
 if(typeof sceneId!=='string'||!Array.isArray(trailIds)||trailIds.length>1000||!trailIds.every(id=>typeof id==='string'&&resolve(id)!==undefined))return null;
 const index=resolve(sceneId);if(index===undefined)return null;
 const trail=trailIds.map(resolve).filter((index,i,array)=>i===0||index!==array[i-1]);
 if(trail.at(-1)===index)trail.pop();
 const value={...raw,version:2,index,sceneId:story[index].id,trail,trailIds:trail.map(index=>story[index].id)};
 return validSave(value)?value:null;
}
