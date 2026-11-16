// Rectangles of valid word origins, with room for the copy's gentle bob and tilt.
export function courseRegions(width,height,word,dialogue){
 const padding=18,gap=18;
 if(width<=0||height<=0||word.width<=0||word.height<=0||dialogue.width<=0||dialogue.height<=0)return [];
 const left=padding,top=padding,right=width-word.width-padding,bottom=height-word.height-padding;
 if(right<=left||bottom<=top)return [];
 const cutLeft=Math.max(left,dialogue.left-word.width-gap),cutRight=Math.min(right,dialogue.right+gap);
 const cutTop=Math.max(top,dialogue.top-word.height-gap),cutBottom=Math.min(bottom,dialogue.bottom+gap);
 if(cutRight<=cutLeft||cutBottom<=cutTop)return [{left,top,right,bottom}];
 return [
  {left,top,right,bottom:cutTop},
  {left,top:cutBottom,right,bottom},
  {left,top:cutTop,right:cutLeft,bottom:cutBottom},
  {left:cutRight,top:cutTop,right,bottom:cutBottom}
 ].filter(rect=>rect.right>rect.left&&rect.bottom>rect.top);
}

export function inCourseRegion(regions,x,y){return regions.some(r=>x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom);}

export function randomCoursePosition(regions,random=Math.random){
 const areas=regions.map(r=>(r.right-r.left)*(r.bottom-r.top)),total=areas.reduce((sum,a)=>sum+a,0);
 if(!total)return null;
 let choice=random()*total,index=0;
 while(index<regions.length-1&&choice>=areas[index])choice-=areas[index++];
 const rect=regions[index];
 return {x:rect.left+random()*(rect.right-rect.left),y:rect.top+random()*(rect.bottom-rect.top)};
}

export function moveCourseWord(body,dt){
 // Reflect each axis at both the viewport and the dialogue boundary.
 const x=body.x+body.vx*dt;
 if(inCourseRegion(body.regions,x,body.y))body.x=x;else body.vx*=-1;
 const y=body.y+body.vy*dt;
 if(inCourseRegion(body.regions,body.x,y))body.y=y;else body.vy*=-1;
}
