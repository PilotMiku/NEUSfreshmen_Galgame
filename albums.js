const photo=(key,caption)=>({key,caption});
export const albums={
 album:{title:'我的相册 · 在路上',photos:[
  photo('journeyNight','来时路上的车灯'),photo('journeyWindow','晃过去的车窗'),
  photo('journeyDusk','傍晚的路口'),photo('journeyTrees','窗外的树影'),
  photo('rain','隔着雨窗看路'),photo('chechuang','列车上的一角'),
  photo('journeySun','夕阳照在车身上'),photo('bus','车上的校园卡'),
 ]},
 campus:{title:'我的相册 · 到校了',photos:[photo('xiaomen','东北大学校门'),photo('campusWelcome','迎新拱门'),photo('registration','欢迎新生的横幅'),photo('wenguan','文管学馆门口')]},
 campus2:{title:'我的相册 · 认认路',photos:[photo('sushe','宿舍楼下'),photo('xiaonanhu','小南湖'),photo('campusRoad','校园路口'),photo('treeRoad','校园里的秋树')]},
 family:{title:'发给家里的照片',photos:[photo('xiaomen','我到学校了'),photo('sushe','已经找到宿舍了')]},
 ceremony:{title:'开学典礼',photos:[photo('openingCeremony','2026级学生开学典礼'),photo('campusWelcome','报到时的迎新拱门'),photo('xiaomen','第一次走进校门'),photo('registration','新生报到')]},
 training:{title:'军训日记',photos:[photo('trainingPractice','军训活动现场'),photo('trainingFriends','迷彩服、同学和晚霞'),photo('trainingSky','训练间隙抬头看天'),photo('grassField','傍晚的操场')]},
 trainingPractice:{title:'军训日记 · 轮到我了',photos:[photo('trainingPractice','军训活动现场')]},
 rainDiary:{title:'军训日记 · 求雨成功',photos:[photo('rainCampus','两个同学走过雨中的校园'),photo('rain','雨点落在车窗上')]},
 trainingHappy:{title:'军训日记 · 熟起来了',photos:[photo('trainingFriends','休息时身边的同学'),photo('friendship','两个人并排骑车'),photo('yelu','一起走过校园小路'),photo('campusRoad','来来往往的同学')]},
};

export class PhotoViewer{
 constructor(dialog,onOpen,onClose){
  this.dialog=dialog;this.onOpen=onOpen;this.onClose=onClose;
  this.title=dialog.querySelector('[data-photo-title]');this.image=dialog.querySelector('img');
  this.storyText=dialog.querySelector('[data-photo-story]');
  this.caption=dialog.querySelector('[data-photo-caption]');this.count=dialog.querySelector('[data-photo-count]');
  this.previous=dialog.querySelector('[data-photo-previous]');this.next=dialog.querySelector('[data-photo-next]');
  this.play=dialog.querySelector('[data-photo-play]');
  this.previous.onclick=()=>this.move(-1);this.next.onclick=()=>this.move(1);
  this.play.onclick=()=>{this.playing=!this.playing;this.updatePlayback();};
  dialog.querySelector('[data-photo-close]').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{this.stopTimer();this.playing=false;this.onClose();});
  dialog.addEventListener('keydown',event=>{
   if(['ArrowRight','ArrowLeft'].includes(event.key)||([' ','Enter'].includes(event.key)&&event.target.tagName!=='BUTTON')){
    event.preventDefault();event.stopPropagation();this.move(event.key==='ArrowLeft'?-1:1);
   }
  });
 }
 get open(){return this.dialog.open;}
 stopTimer(){clearTimeout(this.timer);this.timer=null;}
 close(){this.stopTimer();if(this.open)this.dialog.close();}
 pause(value){this.paused=value;this.updatePlayback();}
 show(kind,assets,index=0,autoplay=false,storyText=''){
  const album=albums[kind];if(!album)return;
  this.album=album;this.assets=assets;this.index=index;this.playing=autoplay;
  this.storyText.textContent=storyText;this.storyText.hidden=!storyText;
  if(!this.open){this.onOpen();this.dialog.showModal();this.dialog.focus();}
  this.render();
 }
 move(direction){
  const next=this.index+direction;
  if(next>=this.album.photos.length){this.close();return;}
  this.index=Math.max(0,next);this.render();
 }
 render(){
  const item=this.album.photos[this.index];
  this.title.textContent=this.album.title;this.caption.textContent=item.caption;
  this.count.textContent=(this.index+1)+' / '+this.album.photos.length;
  this.previous.disabled=this.index===0;this.next.textContent=this.index===this.album.photos.length-1?'完成 →':'下一张 →';
  this.image.alt=item.caption;this.image.src=this.assets[item.key]||'assets/'+item.key+'.svg';
  this.image.getAnimations().forEach(animation=>animation.cancel());
  if(!document.body.classList.contains('motion-reduced'))this.image.animate([{opacity:.25,transform:'scale(.96)'},{opacity:1,transform:'scale(1)'}],{duration:380,easing:'ease-out'});
  this.updatePlayback();
 }
 updatePlayback(){
  this.stopTimer();this.play.textContent=this.playing?'Ⅱ 暂停':'▷ 播放';this.play.setAttribute('aria-pressed',String(!!this.playing));
  if(this.open&&this.playing&&!this.paused&&!document.hidden)this.timer=setTimeout(()=>this.move(1),2600);
 }
 renderAlbum(kind,container,assets){
  const album=albums[kind];if(!album)return false;
  const grid=document.createElement('div');grid.className='album-grid';
  album.photos.forEach((item,index)=>{
   const button=document.createElement('button');button.className='album-photo';button.type='button';button.setAttribute('aria-label','查看照片：'+item.caption);
   const image=document.createElement('img');image.src=assets[item.key]||'assets/'+item.key+'.svg';image.alt=item.caption;
   button.append(image);button.onclick=()=>this.show(kind,assets,index);grid.append(button);
  });
  const hint=document.createElement('div');hint.className='album-caption';hint.textContent=album.photos.length+' 张照片 · 点开查看';
  container.append(grid,hint);return true;
 }
}
