const dot=(a,b)=>a.x*b.x+a.y*b.y;
const cross=(a,b)=>a.x*b.y-a.y*b.x;
const add=(a,b,scale=1)=>({x:a.x+b.x*scale,y:a.y+b.y*scale});
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function createTodoBody(x,y,width,height,random=Math.random){
 return {x,y,width,height,vx:(random()-.5)*180,vy:30+random()*50,angle:(random()-.5)*.85,omega:(random()-.5)*3.6,invMass:1,invInertia:12/(width*width+height*height)};
}

function shape(body){
 const x={x:Math.cos(body.angle),y:Math.sin(body.angle)},y={x:-x.y,y:x.x};
 return {body,axes:[x,y],half:[body.width/2,body.height/2]};
}
function radius(box,axis){return Math.abs(dot(box.axes[0],axis))*box.half[0]+Math.abs(dot(box.axes[1],axis))*box.half[1];}
function clip(points,axis,limit){
 if(points.length<2)return points;
 const distance=points.map(point=>dot(point,axis)-limit),result=[];
 if(distance[0]<=0)result.push(points[0]);if(distance[1]<=0)result.push(points[1]);
 if(distance[0]*distance[1]<0)result.push(add(points[0],{x:points[1].x-points[0].x,y:points[1].y-points[0].y},distance[0]/(distance[0]-distance[1])));
 return result;
}
function collide(a,b){
 const delta={x:b.body.x-a.body.x,y:b.body.y-a.body.y};
 if(Math.abs(delta.x)>a.half[0]+a.half[1]+b.half[0]+b.half[1]||Math.abs(delta.y)>a.half[0]+a.half[1]+b.half[0]+b.half[1])return null;
 let depth=Infinity,normal,reference,axisIndex;
 for(const box of [a,b])for(let index=0;index<2;index++){
  const axis=box.axes[index],distance=dot(delta,axis),overlap=radius(a,axis)+radius(b,axis)-Math.abs(distance);
  if(overlap<=0)return null;
  if(overlap<depth){depth=overlap;normal={x:axis.x*(distance<0?-1:1),y:axis.y*(distance<0?-1:1)};reference=box;axisIndex=index;}
 }
 // Clip the touching edges to keep two contact points when rotated cards stack.
 const incident=reference===a?b:a,n=reference===a?normal:{x:-normal.x,y:-normal.y};
 const tangent=reference.axes[1-axisIndex],face=add(reference.body,n,reference.half[axisIndex]);
 const incidentIndex=Math.abs(dot(incident.axes[0],n))>Math.abs(dot(incident.axes[1],n))?0:1;
 const incidentNormal=incident.axes[incidentIndex],direction=dot(incidentNormal,n)>0?-1:1;
 const center=add(incident.body,incidentNormal,incident.half[incidentIndex]*direction),edge=incident.axes[1-incidentIndex];
 let points=[add(center,edge,incident.half[1-incidentIndex]),add(center,edge,-incident.half[1-incidentIndex])];
 points=clip(points,tangent,dot(reference.body,tangent)+reference.half[1-axisIndex]);
 points=clip(points,{x:-tangent.x,y:-tangent.y},-dot(reference.body,tangent)+reference.half[1-axisIndex]);
 const contacts=[];
 for(const point of points){const separation=dot({x:point.x-face.x,y:point.y-face.y},n);if(separation<=.5)contacts.push(add(point,n,-separation/2));}
 return contacts.length?{a:a.body,b:b.body,normal,depth,contacts,restitution:.4}:null;
}
function vertices(box){
 const points=[];for(const x of [-1,1])for(const y of [-1,1])points.push(add(add(box.body,box.axes[0],box.half[0]*x),box.axes[1],box.half[1]*y));return points;
}
function boundaries(box,width,floor){
 const points=vertices(box),contacts=[];
 for(const [normal,limit] of [[{x:0,y:1},floor-3],[{x:-1,y:0},-8],[{x:1,y:0},width-8]]){
  const depths=points.map(point=>dot(point,normal)-limit),depth=Math.max(...depths);
  if(depth<0)continue;
  const touching=points.filter((point,index)=>depths[index]>=Math.max(-.5,depth-.8));
  contacts.push({a:box.body,b:null,normal,depth,contacts:touching,restitution:.58});
 }
 return contacts;
}
function velocity(body,point){return body?{x:body.vx-body.omega*(point.y-body.y),y:body.vy+body.omega*(point.x-body.x)}:{x:0,y:0};}
function impulse(body,point,vector,direction){
 if(!body)return;body.vx+=vector.x*body.invMass*direction;body.vy+=vector.y*body.invMass*direction;
 body.omega+=cross({x:point.x-body.x,y:point.y-body.y},vector)*body.invInertia*direction;
}
function solve(contact){
 const {a,b,normal,contacts}=contact;
 for(let index=0;index<contacts.length;index++){
  const point=contacts[index],ra={x:point.x-a.x,y:point.y-a.y},rb=b?{x:point.x-b.x,y:point.y-b.y}:{x:0,y:0};
  const va=velocity(a,point),vb=velocity(b,point),relative={x:vb.x-va.x,y:vb.y-va.y};
  const mass=a.invMass+(b?.invMass||0)+cross(ra,normal)**2*a.invInertia+cross(rb,normal)**2*(b?.invInertia||0);
  const magnitude=Math.max(0,(contact.bounce[index]-dot(relative,normal))/mass);
  if(!magnitude)continue;
  const normalImpulse={x:normal.x*magnitude,y:normal.y*magnitude};impulse(a,point,normalImpulse,-1);impulse(b,point,normalImpulse,1);
  const tangent={x:-normal.y,y:normal.x},nextA=velocity(a,point),nextB=velocity(b,point);
  const tangentMass=a.invMass+(b?.invMass||0)+cross(ra,tangent)**2*a.invInertia+cross(rb,tangent)**2*(b?.invInertia||0);
  const friction=clamp(-dot({x:nextB.x-nextA.x,y:nextB.y-nextA.y},tangent)/tangentMass,-magnitude*.48,magnitude*.48);
  const frictionImpulse={x:tangent.x*friction,y:tangent.y*friction};impulse(a,point,frictionImpulse,-1);impulse(b,point,frictionImpulse,1);
 }
}
function findContacts(bodies,width,floor){
 const boxes=bodies.map(shape),contacts=[];
 for(let index=0;index<boxes.length;index++){
  contacts.push(...boundaries(boxes[index],width,floor));
  for(let other=index+1;other<boxes.length;other++){const collision=collide(boxes[index],boxes[other]);if(collision)contacts.push(collision);}
 }
 return contacts;
}
export function stepTodoPhysics(bodies,width,floor,dt){
 for(const body of bodies){body.vy+=1050*dt;body.vx*=Math.exp(-.15*dt);body.omega*=Math.exp(-.55*dt);body.x+=body.vx*dt;body.y+=body.vy*dt;body.angle=(body.angle+body.omega*dt)%(Math.PI*2);}
 const contacts=findContacts(bodies,width,floor);
 let impact=0;
 for(const contact of contacts)contact.bounce=contact.contacts.map(point=>{const a=velocity(contact.a,point),b=velocity(contact.b,point),speed=dot({x:b.x-a.x,y:b.y-a.y},contact.normal);impact=Math.max(impact,-speed);return speed< -80?-speed*contact.restitution:0;});
 for(let iteration=0;iteration<6;iteration++)for(const contact of contacts)solve(contact);
 for(let iteration=0;iteration<3;iteration++)for(const {a,b,normal,depth} of findContacts(bodies,width,floor)){
  const correction=Math.max(0,depth-.3)*.7/(a.invMass+(b?.invMass||0));
  a.x-=normal.x*correction*a.invMass;a.y-=normal.y*correction*a.invMass;
  if(b){b.x+=normal.x*correction*b.invMass;b.y+=normal.y*correction*b.invMass;}
 }
 return impact;
}
