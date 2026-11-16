export const chapters = [
  {name:'初来乍到', en:'九月 · 报到', note:'入学第一天'},
  {name:'军训结束', en:'九月 · 军训', note:'闭幕式之后'},
  {name:'这就是大学吗', en:'第一周 · 上课', note:'新学期课表'},
  {name:'身边的那些人', en:'课间', note:'班群里又有新消息'},
  {name:'试着开口', en:'心理班会', note:'现场互动'},
  {name:'没那么沉了', en:'今天晚上', note:'文管学馆门口'},
];
export const backgrounds = {车窗:'chechuang',校门:'xiaomen',文管学馆:'wenguan',图书馆:'tushuguan',小南湖:'xiaonanhu',二食堂:'ercantang',宿舍楼下:'sushe',军训场:'junxun',教室:'jiaoshi',走廊:'zoulang',文管门口:'wenguanmenkou',夜路:'yelu'};
export const characters = {
  主角:{file:'zhujue',side:'center',color:'#7a9f88',title:'一个普通同学'},
  班长:{file:'banzhang',side:'left',color:'#789789',title:'班委'},
  团支书:{file:'tuanzhishu',side:'left',color:'#be8e73',title:'班委'},
  生活委员:{file:'shenghuo',side:'left',color:'#bc9a65',title:'副班 · 心理委员'},
  组宣:{file:'zuxuan',side:'left',color:'#8d88b1',title:'组织 · 宣传'},
  学习委员:{file:'xuewei',side:'left',color:'#7a9eae',title:'学习委员 · 双创委员'},
  文体委员:{file:'wenti',side:'left',color:'#b78984',title:'文体委员 · 生涯发展委员'},
  学长:{file:'xuezhang',side:'right',color:'#7e8fa8',title:'高年级同学'},
  心理委员:{file:'xinli',side:'right',color:'#89a789',title:'班委'},
};
export const todos=['学生会面试','班委会','年级会选拔','篮球队选拔','志愿者协会招募','四六级报考','商业精英挑战赛','国庆放假','高数课','线代课','大学生心理健康教育','Python课','劳动教育'];
export const story=[];
let context={chapter:0,bg:'车窗',music:'open'};
function scene(text, extra={}) { const item={...context,id:`s${story.length}`,who:'我',text,...extra};story.push(item);return item; }
function at(bg,music,chapter){context={...context,bg,...(music!==undefined?{music}:{}),...(chapter!==undefined?{chapter}:{})};}
function say(who,text,extra={}){return scene(text,{who,spoken:true,...extra});}
function system(text,extra={}){return scene(text,{who:'NEU生活模拟器',sim:text,...extra});}
function live(id,title,prompt,response,extra={}){return scene(prompt,{id,kind:'live',who:'主持人',live:{title,prompt,response},...extra});}
scene('手机相册自动播放。照片晃、糊、歪，字幕一行行蹦出来。',{phone:'album'});
scene('第一次离家这么远。');
scene('车窗外的地名，越来越陌生。');
at('校门');
scene('相册快速滑过：校门、文管学馆、图书馆的红砖……',{phone:'campus'});
scene('小南湖、二食堂，还有宿舍楼下的快递堆。',{phone:'campus2'});
system('检测到宿主正在拍照发家庭群。',{phone:'family'});
at('文管学馆');
scene('我一只手拿着饭卡。手机屏幕突然花屏，弹出“NEU生活模拟器”。',{effect:'glitch',phone:'bind'});
scene('周围的人声一点点变闷，只听见自己的心跳。');
system('滴！绑定成功。',{effect:'glitch'});
system('欢迎{name}入学，下面开启你的大学生活吧。');
scene('屏幕上的字，从正经黑体，变成了像素字。',{effect:'pixel'});
scene('啊？');
at('军训场','open',1);
scene('军训开始了。站军姿、拉歌、食堂抢饭、回到宿舍瘫倒。',{phone:'training'});
scene('日历翻页和朋友圈刷屏混在一起。有人配文：腿已废。求雨。',{phone:'training'});
scene('日子慢慢过。');
system('检测到宿主情绪波动，轻微上扬。',{stats:[58,68,58]});
scene('似乎大学生活也不是那么……');
scene('话不说满。照片里，大家开始笑、约饭、起外号。',{phone:'trainingHappy'});
scene('军训结束。闭幕式上，教官转过身，走向人群之外。');
scene('我看着那个越来越远的背影。',{id:'farewell',kind:'choice',choices:[{text:'转过身的瞬间，鼻子突然酸了',detail:'没出声，在原地站了一会儿。',target:'cry'},{text:'觉得自己做好了准备',detail:'虽然也不知道，准备好了什么。',target:'ready'}]});
scene('转过身的瞬间，鼻子突然酸了。没有出声，就是站那儿愣了一会儿。',{id:'cry'});
scene('后来某天夜里，我突然想起教官喊口令的声音。',{jump:'courses'});
scene('我觉得自己做好了准备。虽然，也不知道准备好了什么。',{id:'ready'});
scene('后来某次离别，我发现自己还是会愣一下。',{jump:'courses'});
at('教室','ke',2);
scene('一大波课程正在接近。',{id:'courses',effect:'warning',phone:'courses'});
scene('高数——导数咋求来着？公式在眼前扭曲。',{effect:'math'});
scene('线代——开心消消乐？矩阵怎么乱消起来了。',{effect:'matrix'});
scene('英语——阿巴阿巴。听力波纹都快变成乱码。',{effect:'english'});
system('宿主修为，散尽中。',{stats:[12,18,15],effect:'warning'});
scene('这就是……大学吗。',{stats:[12,18,15]});
at('走廊');
scene('我打开待办：学生会面试、班委会、年级会选拔、篮球队选拔……',{phone:'todos'});
scene('志愿者协会招募、四六级报考、商业精英挑战赛、国庆放假……',{phone:'todos',effect:'overload'});
scene('高数课、线代课、大学生心理健康教育、Python课、劳动教育……',{phone:'todos',effect:'overload'});
scene('最后一条“劳动教育”弹出来时，满屏都是待办，一条也划不掉。',{phone:'todos',effect:'overload'});
system(`检测到宿主待办数，${todos.length}。建议，先呼吸。`,{phone:'todos',stats:[12,18,15]});
at('夜路');
scene('我边走边看手机。学生会、班委会、社团通知，一条接一条。',{phone:'notifications'});
scene('前几条“收到”打得很快。中间停了一下，后面只打“收”，或者点一个表情。',{phone:'notifications'});
say('路过的同学','同学，让一下。');
scene('一辆自行车擦身而过。我往旁边躲了躲，低头继续回复。',{phone:'notifications'});
at('走廊','banwei',3);
scene('第二天，在走廊里，我碰到了班长。');
say('班长','有事别自己憋着，班群@我，私聊也行。我回得慢但我会回。',{sim:'检测到一个愿意回复你的人。',stats:[28,35,23]});
scene('转过走廊，团支书走过来。');
say('团支书','青年大学习记得看，但看不完也别慌，先跟我说一声。');
scene('生活委员兼副班和心理委员，停下来和我打招呼。');
say('生活委员','班费的事找我，心里不得劲也找我。二食堂沙发区，随时。',{stats:[35,48,25]});
scene('组宣从教室里探出头。');
say('组宣','群里消息不用条条秒回，重要的我会再@一遍。你先把觉睡够。');
scene('学习委员兼双创委员，抱着书走过来。');
say('学习委员','作业别拖，商赛别慌。不会的先问我，我也不会咱一起问老师。',{stats:[45,55,42]});
scene('文体委员兼生涯发展委员，朝我挥挥手。');
say('文体委员','该打球打球，该看演出看演出。生涯规划不急，你先玩明白再说。');
scene('六个人说完，手机震了一下。班群消息：今晚心理班会，都来啊。',{phone:'classMeeting'});
scene('我看了一眼，把手机揣进兜里，继续往前走。');
at('小南湖','xingfu');
scene('日子好像，慢慢顺过来了。',{stats:[62,72,56]});
scene('我开始记得一些小事：哪家窗口好吃、哪天没早八、哪次笑得很真。');
at('夜路');
scene('可是——');
at('夜路','off',4);
live('pause','最近遇到什么困难？','视觉小说暂停。主持人上场，邀请现场同学分享最近遇到的困难。','比如：一道高数题卡了一晚上。想找人问问，又怕显得自己太笨。',{effect:'blackout'});
at('文管门口','qiuzhu');
scene('第一个卡住的瞬间。文管学馆门口碰到学长，嘴张了张，没说出话。',{character:'学长'});
scene('学长走了。那句想问的话，还在嘴边。');
live('help-senior','要不要叫住学长？','主持人转头看班长：“班长，你要是那个学长，你希望他张嘴吗？”请班长现场回应。','参考回应：“问呗。我现在有空就给你讲，没空咱们另约个时间。”');
system('求助不是掉价，是提前止损。');
at('宿舍楼下');
scene('第二个瞬间。半夜给朋友发“在吗”，打了，又删。',{phone:'friend'});
live('help-friend','一句“在吗”，打了又删。','主持人邀请团支书或人缘好的同学接话：朋友半夜发来一句“在吗”，你会怎么接？','参考回应：“有事直接发就行，我醒了就回。别光发个在吗，我还得猜你怎么了。”');
system('有些话不用组织好语言，先发出去。');
at('二食堂');
scene('第三个瞬间。群里找“高数搭子”，屏幕却弹出一条防诈提示。',{phone:'partner'});
live('help-partner','有人一起学高数吗？','主持人看学委：“你收作业见过多少‘搭子变鸽子’？”请学委接话。主持人补充：搭子可以找，不转账、不点链接、不交押金。','参考回应：“先在班里约两个人，下课一起做两道题。别还没见过面，就让你交资料费。”');
system('搭子可以找，不转账、不点链接、不交押金。');
at('走廊');
scene('第四个瞬间。走廊碰到生活委员兼心理委员，我憋了半天。',{character:'生活委员'});
say('我','我心里不得劲。',{character:'生活委员'});
live('help-feeling','“我心里不得劲。”','主持人直接看生活委员：“这句你接不接？”','生活委员：接。你说了我就听，二食堂沙发区十分钟，不记名。');
say('生活委员','接。你说了我就听，二食堂沙发区十分钟，不记名。');
system('暗号不用高级，说出来就行。');
at('夜路');
scene('第五个瞬间。班群里，有人发了一句：“班长V我50吃KFC。”',{phone:'kfc'});
live('help-kfc','班长，V不V？','主持人看班长：“V不V？”请班长现场回应。','参考回应：“50没有，饭可以一起吃。到底啥事，边吃边说。”');
system('有些困难一顿KFC解决不了，但能让你先笑一下再解决。');
system('以上方式，不保证困难消失。但保证，你不是一个人。',{stats:[65,76,60]});
live('next-step','帮忙想个办法。','主持人邀请台下同学：从刚才分享的一个困难出发，一起想一个今天就能做到的小动作。','可以从这里开始：把不会的那道题拍给学委；给朋友发一条完整消息；约生活委员在二食堂坐十分钟。',{reflection:true});
at('文管门口','shouwei',5);
scene('手机待办还是满的。但有几条旁边，多了一些小标记。',{phone:'resolved'});
scene('“高数作业”旁标：已找学委问。',{phone:'resolved'});
scene('“小组作业落单”旁标：已问冉有。',{phone:'resolved'});
scene('“心里不得劲”旁标：已跟生活委员说。',{phone:'resolved'});
scene('最上面一条新待办：今晚心理班会。我打了个勾。',{phone:'resolved'});
scene('文管学馆门口，心理委员举着“心理班会 · 随便坐”的牌子，抬头看见我。',{character:'心理委员',decoration:'meeting'});
say('心理委员','就差你了。',{decoration:'meeting'});
scene('我走过去。心里有一句很轻的旁白。');
scene('待办没少几条，但好像……没那么沉了。',{sim:'你不是一个人。',stats:[72,82,65]});
scene('故事到这里，生活才刚刚开始。',{kind:'end'});
export const sceneIndex = Object.fromEntries(story.map((s,i)=>[s.id,i]));
export function nextIndex(index,choice) { const s=story[index];if(!s||s.kind==='end')return null;if(s.kind==='choice')return choice===undefined?null:sceneIndex[s.choices[choice]?.target]??null;return s.jump?sceneIndex[s.jump]:index+1<story.length?index+1:null; }
export function validSave(value) {return !!value && value.version===1 && Number.isInteger(value.index) && value.index>=0 && value.index<story.length && typeof value.name==='string' && value.name.length<=16 && Array.isArray(value.trail) && value.trail.length<=1000 && value.trail.every(i=>Number.isInteger(i)&&i>=0&&i<story.length) && ['cry','ready',null].includes(value.branch) && value.notes!==null && typeof value.notes==='object' && !Array.isArray(value.notes) && Object.entries(value.notes).every(([k,v])=>typeof v==='string'&&v.length<=500&&sceneIndex[k]!==undefined); }
