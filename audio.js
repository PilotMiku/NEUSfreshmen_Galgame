// Original, locally synthesized ambient motifs. Optional user MP3s take priority.
import {EventSounds} from './event-sounds.js';
export class Soundtrack {
 constructor(){this.enabled=false;this.volume=.35;this.current='off';this.timer=null;this.ctx=null;this.master=null;this.voices=new Set();this.assetMap={};this.media=null;this.tick=0;this.events=new EventSounds();}
 async unlock(){try{if(!this.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;this.ctx=new AC();this.master=this.ctx.createGain();this.master.gain.value=this.volume*.35;this.master.connect(this.ctx.destination);this.events.attach(this.ctx);}if(this.ctx.state==='suspended')await this.ctx.resume();this.update();}catch{}}
 setEnabled(value){if(this.enabled===value)return;this.enabled=value;this.events.setEnabled(value);this.update();}
 cue(name,options){this.events.play(name,options);}
 setVolume(value){this.volume=value;if(this.master)this.master.gain.setTargetAtTime(value*.35,this.ctx.currentTime,.2);if(this.media)this.media.volume=value;}
 play(track){if(track===this.current)return;this.current=track;this.tick=0;this.update();}
 stop(){clearInterval(this.timer);this.timer=null;for(const voice of this.voices){try{voice.stop();}catch{}}this.voices.clear();if(this.media){this.media.pause();this.media.src='';this.media=null;}}
 update(){this.stop();if(!this.enabled||this.current==='off'||document.hidden)return;const file=this.assetMap[`bgm_${this.current}`];if(file){this.media=new Audio(file);this.media.loop=true;this.media.volume=this.volume;this.media.play().catch(()=>this.synth());}else this.synth();}
 synth(){if(!this.ctx||!this.enabled||this.current==='off'||document.hidden)return;const motifs={open:[60,64,67,71,69,67,64,62],ke:[57,60,64,60,56,60,63,59],banwei:[60,64,67,69,67,64,62,64],xingfu:[65,69,72,76,74,72,69,67],qiuzhu:[57,60,64,67,65,64,60,62],shouwei:[60,67,72,76,74,72,67,64]};const notes=motifs[this.current]||motifs.open;const play=()=>{const i=this.tick++%notes.length;this.tone(notes[i],2.1,.16);if(i%4===0){this.tone(notes[i]-24,3.6,.12);this.tone(notes[i]-12,3.2,.07);}};play();this.timer=setInterval(play,this.current==='ke'?650:950);}
 tone(midi,duration,strength){if(!this.ctx||!this.master)return;const t=this.ctx.currentTime;const osc=this.ctx.createOscillator(),gain=this.ctx.createGain();osc.type='sine';osc.frequency.value=440*Math.pow(2,(midi-69)/12);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(strength,t+.035);gain.gain.exponentialRampToValueAtTime(.001,t+duration);osc.connect(gain);gain.connect(this.master);this.voices.add(osc);osc.onended=()=>{this.voices.delete(osc);osc.disconnect();gain.disconnect();};osc.start(t);osc.stop(t+duration+.1);}
}
