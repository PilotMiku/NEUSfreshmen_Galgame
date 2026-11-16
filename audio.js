// Original local music and effects. Optional user MP3s take priority.
import {EventSounds,renderScore} from './event-sounds.js';
import {musicTracks,musicStep} from './music-score.js';
export class Soundtrack {
 constructor(){this.enabled=false;this.volume=.35;this.current='off';this.timer=null;this.ctx=null;this.master=null;this.voices=new Set();this.assetMap={};this.media=null;this.tick=0;this.generation=0;this.events=new EventSounds();}
 async unlock(){try{if(!this.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;this.ctx=new AC();this.master=this.ctx.createGain();this.master.gain.value=this.volume*.4;this.master.connect(this.ctx.destination);this.events.attach(this.ctx);}if(this.ctx.state==='suspended')await this.ctx.resume();this.update();}catch{}}
 setEnabled(value){if(this.enabled===value)return;this.enabled=value;this.events.setEnabled(value);this.update();}
 cue(name,options){this.events.play(name,options);}
 setVolume(value){this.volume=value;if(this.master)this.master.gain.setTargetAtTime(value*.4,this.ctx.currentTime,.2);if(this.media)this.media.volume=value;}
 play(track){if(track===this.current)return;this.current=track;this.tick=0;this.update();}
 stop(){this.generation++;clearInterval(this.timer);this.timer=null;for(const voice of this.voices){try{voice.stop();}catch{}}this.voices.clear();if(this.media){this.media.onerror=null;this.media.pause();this.media.removeAttribute('src');this.media.load();this.media=null;}}
 update(){
  this.stop();if(!this.enabled||this.current==='off'||document.hidden)return;
  const file=this.assetMap[`bgm_${this.current}`];if(!file){this.synth();return;}
  const generation=this.generation,media=new Audio(file);this.media=media;media.loop=true;media.volume=this.volume;
  const fallback=()=>{if(this.generation!==generation||this.media!==media)return;this.media=null;media.onerror=null;media.pause();media.removeAttribute('src');media.load();this.synth();};
  media.onerror=fallback;media.play().catch(fallback);
 }
 synth(){
  if(!this.ctx||!this.enabled||!musicTracks[this.current]||document.hidden)return;
  const track=this.current,interval=30/musicTracks[track].bpm;
  this.nextBeat=this.ctx.currentTime+.04;
  const schedule=()=>{
   // Schedule against the audio clock so browser timers do not loosen the beat.
   if(this.nextBeat<this.ctx.currentTime-.1)this.nextBeat=this.ctx.currentTime+.03;
   while(this.nextBeat<this.ctx.currentTime+.18){
    renderScore(this.ctx,this.master,musicStep(track,this.tick++),{startTime:this.nextBeat,onVoice:voice=>{this.voices.add(voice);voice.addEventListener('ended',()=>this.voices.delete(voice),{once:true});}});
    this.nextBeat+=interval;
   }
  };
  schedule();this.timer=setInterval(schedule,60);
 }
}
