// Original eight-bar loops: melody, syncopated bass, backbeat and light percussion.
export const musicTracks={
 open:{bpm:100,roots:[48,45,53,55],melody:[72,76,79,83,81,79,76,74],energy:1},
 ke:{bpm:112,roots:[45,44,48,43],melody:[69,72,76,72,68,72,75,71],energy:1.15},
 banwei:{bpm:108,roots:[48,45,53,55],melody:[72,76,79,81,79,76,74,76],energy:1.05},
 xingfu:{bpm:104,roots:[53,50,58,48],melody:[77,81,84,88,86,84,81,79],energy:.95},
 qiuzhu:{bpm:88,roots:[45,53,48,55],melody:[69,72,76,79,77,76,72,74],energy:.65},
 shouwei:{bpm:96,roots:[48,53,45,55],melody:[72,79,84,88,86,84,79,76],energy:.85}
};
const hz=midi=>440*2**((midi-69)/12);
const note=(midi,duration,level,type='sine')=>({at:0,duration,frequency:hz(midi),end:hz(midi),type,level});
const drum=(frequency,end,duration,level,type='sine')=>({at:0,duration,frequency,end,type,level});
export function musicStep(track,step){
 const config=musicTracks[track];if(!config)return [];
 const beat=step%8,bar=Math.floor(step/8)%8,root=config.roots[Math.floor(bar/2)%4],eighth=30/config.bpm,energy=config.energy,score=[];
 if([0,4].includes(beat)||(energy>=.9&&[3,7].includes(beat)))score.push(drum(135,43,.18,.28*energy));
 if([2,6].includes(beat))score.push(drum(185,95,.09,.09*energy),drum(2600,2600,.1,.12*energy,'noise'));
 score.push(drum(6200,6200,beat%2?.035:.05,(beat%2?.028:.045)*energy,'noise'));
 if([0,3,4,7].includes(beat))score.push(note(root-12+(beat===7?7:0),eighth*.85,.14,'triangle'));
 if(beat%2===0||[3,7].includes(beat)){
  const index=(Math.floor(beat/2)+bar*2)%config.melody.length;
  score.push(note(config.melody[index]+(bar%2?-12:0),eighth*1.6,.09));
 }
 if(beat===0){
  const third=[45,44,50].includes(root)?3:4;
  for(const offset of [0,third,7])score.push(note(root+offset,eighth*7,.025));
 }
 return score;
}
